import {
  getChapterSegments,
  yearToChapterMiniX,
  formatYear,
  getTickInterval,
  getItemStyle,
  getEventStartYear,
  getEventEndYear,
  formatDetailedDate
} from './timelineMath.js';

export function computeGravityTracks(periodesList) {
  const sorted = [...periodesList].sort((a, b) => a._exactStart - b._exactStart || (b._exactEnd - a._exactEnd));
  const occupiedTop = [];
  const occupiedBottom = [];

  return sorted.map((p, idx) => {
    let side = p.cote ? p.cote : ((idx % 2 === 0) ? 'top' : 'bottom');
    let tracks = side === 'top' ? occupiedTop : occupiedBottom;

    if (p.gravite === false) {
      let fixedLevel = 0;
      while (tracks[fixedLevel] !== undefined && tracks[fixedLevel] > p._exactStart) {
        fixedLevel++;
      }
      tracks[fixedLevel] = p._exactEnd;
      return { ...p, side, level: fixedLevel, dropYear: null };
    }

    let level = 0;
    while (tracks[level] !== undefined && tracks[level] > p._exactStart) {
      level++;
    }

    const altSide = side === 'top' ? 'bottom' : 'top';
    const altTracks = altSide === 'top' ? occupiedTop : occupiedBottom;
    let altLevel = 0;
    while (altTracks[altLevel] !== undefined && altTracks[altLevel] > p._exactStart) {
      altLevel++;
    }

    if (altLevel < level) {
      side = altSide;
      tracks = altTracks;
      level = altLevel;
    }

    let dropYear = null;
    if (level > 0 && tracks[level - 1] !== undefined && tracks[level - 1] > p._exactStart && tracks[level - 1] < p._exactEnd) {
      dropYear = tracks[level - 1];
      tracks[level - 1] = p._exactEnd;
    }

    tracks[level] = p._exactEnd;
    return { ...p, side, level, dropYear };
  });
}

export function renderTimelineScene({
  cMain,
  cMini,
  currentBounds,
  viewRange,
  allEvents,
  activeFilter,
  selectedEvent,
  drawerEvent,
  cursorYear,
  activeChapter,
  hitboxesRef
}) {
  if (!cMain || !cMini) return;

  const ctx = cMain.getContext('2d');
  const mctx = cMini.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = cMain.clientWidth;
  const h = cMain.clientHeight;
  const mw = cMini.clientWidth;
  const mh = cMini.clientHeight;

  if (w === 0 || h === 0 || mw === 0 || mh === 0) return;

  const { min: vMin, max: vMax } = viewRange;
  const span = vMax - vMin;
  const yearToX = (year) => ((year - vMin) / span) * w;

  ctx.fillStyle = '#eaf0f6';
  ctx.fillRect(0, 0, w, h);
  hitboxesRef.current = [];

  const isMobile = w < 640;
  const barY = Math.round(h * (isMobile ? 0.60 : 0.58));

  const zoomFactor = Math.max(0, Math.min(1, (3000 - span) / 2900));
  const trackH = Math.round((isMobile ? 18 : 22) + zoomFactor * (isMobile ? 6 : 10));
  const basePadding = Math.round(6 + zoomFactor * 4);
  const periodFontSize = Math.round(10.5 + zoomFactor * 2);
  const defaultHalfH = Math.round((isMobile ? 18 : 22));

  const xStart = yearToX(currentBounds.min);
  const xEnd = yearToX(currentBounds.max);

  const filteredList = (allEvents || []).filter(evt => {
    const debut = getEventStartYear(evt);
    const fin = getEventEndYear(evt) ?? debut;
    if (fin < currentBounds.min || debut > currentBounds.max) return false;

    if (activeFilter.mode === 'custom') {
      return activeFilter.customIds.has(evt.id);
    }
    if (activeFilter.mode === 'groups') {
      const group = (evt.groupe_id && typeof evt.groupe_id === 'string') ? evt.groupe_id.trim() : null;
      return group ? activeFilter.groups.includes(group) : false;
    }
    const itemTags = Array.isArray(evt.tags) && evt.tags.length > 0 ? evt.tags : [evt.categorie || "Sans tag"];
    return itemTags.some(tag => activeFilter.tags.includes(tag));
  }).map(evt => ({
    ...evt,
    _exactStart: getEventStartYear(evt),
    _exactEnd: getEventEndYear(evt)
  }));

  const rawPeriodes = filteredList.filter(e => e._exactEnd !== null && e._exactEnd !== undefined);
  const ponctuels = filteredList.filter(e => e._exactEnd === null || e._exactEnd === undefined);
  const gravityPeriodes = computeGravityTracks(rawPeriodes);

  const visibleX1 = Math.max(-60, xStart);
  const visibleX2 = Math.min(w + 60, xEnd);
  const visibleW = Math.max(0, visibleX2 - visibleX1);

  // 1. RAIL EN CREUX NEUMORPHIQUE
  if (visibleW > 0) {
    const topY = barY - defaultHalfH;
    const totalH = defaultHalfH * 2;
    const railRadius = totalH / 2;

    ctx.save();
    ctx.fillStyle = '#dfe6ee';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(visibleX1, topY, visibleW, totalH, railRadius);
    } else {
      ctx.rect(visibleX1, topY, visibleW, totalH);
    }
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(166, 180, 200, 0.7)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(visibleX1, topY);
    ctx.lineTo(visibleX2, topY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(visibleX1, topY + totalH);
    ctx.lineTo(visibleX2, topY + totalH);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(166, 180, 200, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(visibleX1, barY);
    ctx.lineTo(visibleX2, barY);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // 2. CAPSULES FLOTTANTES D'EMPIRES ET DYNASTIES
  const externalPeriodLabels = [];

  gravityPeriodes.forEach((p) => {
    const x1 = yearToX(p._exactStart);
    const x2 = yearToX(p._exactEnd);
    const rX = Math.min(x1, x2);
    const rW = Math.max(8, Math.abs(x2 - x1));

    if (rX + rW < -100 || rX > w + 100) return;

    const style = getItemStyle(p);
    const isSelected = (selectedEvent && selectedEvent.id === p.id) || (drawerEvent && drawerEvent.id === p.id);
    const isTop = p.side === 'top';
    const dir = isTop ? -1 : 1;

    const transitionW = Math.max(16, trackH * 1.1);
    const baseColor = p.couleur || style.stroke || '#0284c7';

    ctx.save();

    let rectTop = 0;
    let rectH = trackH;
    const yBase = barY + dir * (basePadding + defaultHalfH + p.level * (trackH + 6));
    rectTop = isTop ? yBase - trackH : yBase;

    let canDrop = false;
    let xSplit = 0;
    let remainingWAfterDrop = 0;

    if (p.dropYear && p.dropYear > p._exactStart && p.dropYear < p._exactEnd && p.level > 0) {
      xSplit = yearToX(p.dropYear);
      remainingWAfterDrop = (rX + rW) - xSplit;
      if (remainingWAfterDrop >= trackH) {
        canDrop = true;
      }
    }

    const pillRadius = trackH / 2;

    ctx.shadowColor = isSelected ? 'rgba(2, 132, 199, 0.55)' : 'rgba(166, 180, 200, 0.45)';
    ctx.shadowBlur = isSelected ? 14 : 7;
    ctx.shadowOffsetY = isSelected ? 4 : 3;

    if (p.forme === 'ligne') {
      const lineY = isTop ? rectTop + trackH * 0.75 : rectTop + trackH * 0.25;
      const tickH = Math.max(6, trackH * 0.4);

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(rX, lineY);
      ctx.lineTo(rX + rW, lineY);
      ctx.moveTo(rX, lineY - tickH / 2);
      ctx.lineTo(rX, lineY + tickH / 2);
      ctx.moveTo(rX + rW, lineY - tickH / 2);
      ctx.lineTo(rX + rW, lineY + tickH / 2);
      ctx.stroke();

      rectH = trackH;
    } else if (canDrop) {
      const actualTransW = Math.min(transitionW, remainingWAfterDrop * 0.8);
      const xTransStart = xSplit;
      const xTransEnd = xSplit + actualTransW;

      const targetLvl = p.level - 1;
      const yStart = barY + dir * (basePadding + defaultHalfH + p.level * (trackH + 6));
      const yEnd = barY + dir * (basePadding + defaultHalfH + targetLvl * (trackH + 6));

      ctx.beginPath();
      ctx.moveTo(rX + pillRadius, yStart + dir * trackH);
      ctx.lineTo(xTransStart, yStart + dir * trackH);

      ctx.bezierCurveTo(
        xTransStart + actualTransW * 0.5, yStart + dir * trackH,
        xTransStart + actualTransW * 0.5, yEnd + dir * trackH,
        xTransEnd, yEnd + dir * trackH
      );

      ctx.lineTo(rX + rW - pillRadius, yEnd + dir * trackH);
      ctx.arcTo(rX + rW, yEnd + dir * trackH, rX + rW, yEnd, pillRadius);
      ctx.arcTo(rX + rW, yEnd, rX + rW - pillRadius, yEnd, pillRadius);

      ctx.lineTo(xTransEnd, yEnd);
      ctx.bezierCurveTo(
        xTransStart + actualTransW * 0.5, yEnd,
        xTransStart + actualTransW * 0.5, yStart,
        xTransStart, yStart
      );

      ctx.lineTo(rX + pillRadius, yStart);
      ctx.arcTo(rX, yStart, rX, yStart + dir * trackH, pillRadius);
      ctx.arcTo(rX, yStart + dir * trackH, rX + pillRadius, yStart + dir * trackH, pillRadius);
      ctx.closePath();

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = isSelected ? 1 : (p.opacite ?? 0.88);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      rectTop = Math.min(yStart, yEnd, yStart + dir * trackH, yEnd + dir * trackH);
      rectH = Math.abs(yStart - yEnd) + trackH;
    } else {
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rX, rectTop, rW, trackH, pillRadius);
      } else {
        ctx.rect(rX, rectTop, rW, trackH);
      }

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = isSelected ? 1 : (p.opacite ?? 0.88);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();
    }

    hitboxesRef.current.push({
      type: 'rect',
      x: rX,
      y: rectTop,
      w: rW,
      h: rectH,
      evt: p
    });

    const titreTexte = String(p.titre || 'Sans titre');
    ctx.font = `600 ${periodFontSize}px system-ui, sans-serif`;
    const textWidth = ctx.measureText(titreTexte).width;

    const visibleLeft = Math.max(0, rX);
    const visibleRight = Math.min(w, rX + rW);
    const visibleBarW = Math.max(0, visibleRight - visibleLeft);

    const fitsInside = p.forme !== 'ligne' && rW >= textWidth + 16 && visibleBarW >= Math.min(textWidth + 16, 48);

    if (fitsInside) {
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.rect(rX + 4, rectTop, rW - 8, rectH);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 ${periodFontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textX = Math.max(rX + 8, 8);
      const clampedTextX = Math.min(textX, rX + rW - textWidth - 8);
      ctx.fillText(titreTexte, Math.max(rX + 8, clampedTextX), rectTop + (isTop ? trackH / 2 : rectH - trackH / 2));
      ctx.restore();
    } else {
      const anchorX = rX + rW / 2;
      const anchorY = p.forme === 'ligne'
        ? (isTop ? rectTop + trackH * 0.75 : rectTop + trackH * 0.25)
        : rectTop;

      externalPeriodLabels.push({
        evt: p,
        anchorX,
        anchorY,
        baseColor,
        isSelected
      });
    }

    ctx.restore();
  });

  // 3. GRADUATIONS DOUCES SUR LE FOND CLAIR
  const interval = getTickInterval(span);
  const firstTick = Math.ceil(vMin / interval) * interval;
  ctx.fillStyle = '#64748b';
  ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
  ctx.textAlign = 'center';

  for (let t = firstTick; t <= vMax; t += interval) {
    if (t < currentBounds.min || t > currentBounds.max) continue;
    const tx = yearToX(t);
    ctx.strokeStyle = 'rgba(166, 180, 200, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, barY + defaultHalfH);
    ctx.lineTo(tx, barY + defaultHalfH + 6);
    ctx.stroke();
    ctx.fillText(formatYear(t), tx, barY + defaultHalfH + (isMobile ? 18 : 22));
  }

  // 4. REPÈRES PONCTUELS + PÉRIODES COMPACTES AU-DESSUS
  let minImportanceForText = 1;
  if (span > 5000) minImportanceForText = 4;
  else if (span > 800) minImportanceForText = 3;
  else if (span > 250) minImportanceForText = 2;

  const pinTracks = [];

  const combinedPins = [
    ...ponctuels.map(evt => ({
      kind: 'point',
      evt,
      sortYear: evt._exactStart,
      x: yearToX(evt._exactStart),
      anchorY: barY - defaultHalfH,
      color: evt.couleur || getItemStyle(evt).stroke || '#64748b'
    })),
    ...externalPeriodLabels.map(item => ({
      kind: 'period',
      evt: item.evt,
      sortYear: item.evt._exactStart,
      x: item.anchorX,
      anchorY: item.anchorY,
      color: item.baseColor
    }))
  ].sort((a, b) => a.sortYear - b.sortYear);

  combinedPins.forEach((pin) => {
    const { evt, x, anchorY, color, kind } = pin;
    if (x < -200 || x > w + 200) return;

    const titreTexte = String(evt.titre || 'Sans titre');
    const isSelected = (selectedEvent && selectedEvent.id === evt.id) || (drawerEvent && drawerEvent.id === evt.id);
    const shouldShowLabel = kind === 'period' || (evt.importance || 3) >= minImportanceForText || isSelected;

    ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
    const textWidth = ctx.measureText(titreTexte).width;
    const labelW = shouldShowLabel ? textWidth + 18 : 16;

    let trackIndex = 0;
    while (pinTracks[trackIndex] && pinTracks[trackIndex] > x - 8) {
      trackIndex++;
    }
    pinTracks[trackIndex] = x + labelW;

    const baseStem = isMobile ? 22 : 34;
    const stepStem = isMobile ? 20 : 30;
    const decalageY = baseStem + (trackIndex % 5) * stepStem;
    const topLimit = (barY - defaultHalfH) - decalageY;
    const yT = Math.min(topLimit, anchorY - 18);

    const pinColor = isSelected ? '#0284c7' : color;

    ctx.save();
    ctx.strokeStyle = isSelected ? pinColor : 'rgba(148, 163, 184, 0.75)';
    ctx.lineWidth = isSelected ? 2 : 1.1;
    ctx.beginPath();
    ctx.moveTo(x, anchorY);
    ctx.lineTo(x, yT);
    ctx.stroke();

    ctx.fillStyle = pinColor;
    ctx.beginPath();
    ctx.arc(x, anchorY, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, yT, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.22)';
      ctx.fill();
      ctx.fillStyle = pinColor;
    }

    ctx.beginPath();
    ctx.arc(x, yT, isSelected ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.stroke();

    if (shouldShowLabel) {
      const startStr = formatDetailedDate(evt.date_debut, evt.mois_debut, evt.jour_debut, true);
      const endStr = formatDetailedDate(evt.date_fin, evt.mois_fin, evt.jour_fin, true);
      const anneeStr = kind === 'period' ? `${startStr} — ${endStr}` : startStr;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.font = isMobile ? '600 9.5px monospace, sans-serif' : '600 10.5px monospace, sans-serif';
      ctx.fillStyle = pinColor;
      ctx.fillText(anneeStr, x + 8, yT - 1);

      ctx.textBaseline = 'top';
      ctx.font = isSelected
        ? (isMobile ? '700 11px system-ui, sans-serif' : '700 12px system-ui, sans-serif')
        : (isMobile ? '600 10px system-ui, sans-serif' : '600 11px system-ui, sans-serif');
      ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
      ctx.fillText(titreTexte, x + 8, yT + 1);
    }
    ctx.restore();

    hitboxesRef.current.push({
      type: 'rect',
      x: x - 6,
      y: yT - 14,
      w: labelW + 10,
      h: 30,
      evt
    });
  });

  // 5. SCRUBBER TEMPOREL DOUX NEUMORPHIQUE
  const cursorX = yearToX(cursorYear);

  if (cursorX >= -100 && cursorX <= w + 100) {
    ctx.save();

    ctx.strokeStyle = '#5b4fe8';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelText = formatYear(cursorYear);
    ctx.font = '600 10.5px monospace, system-ui, sans-serif';
    const labelW = ctx.measureText(labelText).width + 16;
    const badgeY = 8;
    const badgeH = 20;

    ctx.fillStyle = '#eaf0f6';
    ctx.shadowColor = 'rgba(166, 180, 200, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cursorX - labelW / 2, badgeY, labelW, badgeH, 10);
    } else {
      ctx.rect(cursorX - labelW / 2, badgeY, labelW, badgeH);
    }
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#5b4fe8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, cursorX, badgeY + badgeH / 2);

    ctx.fillStyle = '#5b4fe8';
    ctx.beginPath();
    ctx.arc(cursorX, barY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // 6. MINIMAP BASSE NEUMORPHIQUE
  mctx.clearRect(0, 0, mw, mh);

  const activeSegments = getChapterSegments(activeChapter);

  let curSegX = 0;
  activeSegments.forEach((seg, i) => {
    const segW = seg.ratio * mw;
    mctx.fillStyle = seg.color;
    mctx.fillRect(curSegX, 0, segW, mh);

    if (i > 0) {
      mctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      mctx.lineWidth = 1;
      mctx.beginPath();
      mctx.moveTo(curSegX, 0);
      mctx.lineTo(curSegX, mh);
      mctx.stroke();
    }

    mctx.fillStyle = '#ffffff';
    mctx.font = isMobile ? '700 7.5px system-ui, sans-serif' : '700 8.5px system-ui, sans-serif';
    mctx.textAlign = 'center';
    const labelText = isMobile ? seg.nom.slice(0, 5) : seg.nom.toUpperCase();
    mctx.fillText(labelText, curSegX + segW / 2, 12);

    curSegX += segW;
  });

  const numBuckets = isMobile ? 12 : 24;
  const densityBins = new Array(numBuckets).fill(0);
  filteredList.forEach(evt => {
    const yr = evt._exactStart;
    const xPos = yearToChapterMiniX(yr, mw, activeChapter);
    const binIdx = Math.max(0, Math.min(numBuckets - 1, Math.floor((xPos / mw) * numBuckets)));
    densityBins[binIdx] += 1;
  });

  const maxDensity = Math.max(1, ...densityBins);
  const wavePoints = densityBins.map((count, idx) => {
    const px = (idx + 0.5) * (mw / numBuckets);
    const normalizedH = Math.pow(count / maxDensity, 0.6) * (mh * 0.44);
    return { x: px, y: mh - 8 - normalizedH };
  });

  if (wavePoints.length > 1) {
    mctx.save();
    mctx.beginPath();
    mctx.moveTo(0, wavePoints[0].y);
    mctx.lineTo(wavePoints[0].x, wavePoints[0].y);

    for (let i = 0; i < wavePoints.length - 1; i++) {
      const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
      const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
      mctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
    }
    mctx.lineTo(mw, wavePoints[wavePoints.length - 1].y);

    mctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    mctx.lineWidth = 2;
    mctx.stroke();
    mctx.restore();
  }

  if (cursorYear >= currentBounds.min && cursorYear <= currentBounds.max) {
    const curMiniX = yearToChapterMiniX(cursorYear, mw, activeChapter);
    mctx.fillStyle = '#5b4fe8';
    mctx.fillRect(curMiniX - 1.5, 0, 3, mh);
  }

  const vx1 = yearToChapterMiniX(vMin, mw, activeChapter);
  const vx2 = yearToChapterMiniX(vMax, mw, activeChapter);
  const left = Math.min(vx1, vx2);
  const right = Math.max(vx1, vx2);
  const bWidth = Math.max(64, right - left);
  const topY = 6;
  const selH = mh - 12;
  const cornerRadius = 16;

  mctx.save();
  mctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  mctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  mctx.shadowBlur = 8;
  mctx.shadowOffsetY = 2;

  mctx.beginPath();
  if (mctx.roundRect) {
    mctx.roundRect(left, topY, bWidth, selH, cornerRadius);
  } else {
    mctx.rect(left, topY, bWidth, selH);
  }
  mctx.fill();

  mctx.shadowColor = 'transparent';
  mctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  mctx.lineWidth = 1.8;
  mctx.stroke();

  mctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  mctx.beginPath();
  mctx.arc(left + 8, topY + selH / 2, 4.5, 0, Math.PI * 2);
  mctx.fill();

  mctx.beginPath();
  mctx.arc(left + bWidth - 8, topY + selH / 2, 4.5, 0, Math.PI * 2);
  mctx.fill();

  if (bWidth > (isMobile ? 70 : 88)) {
    const labelRange = `${formatYear(vMin)} — ${formatYear(vMax)}`;
    mctx.fillStyle = '#1e293b';
    mctx.font = isMobile ? '700 8.5px monospace, system-ui, sans-serif' : '700 9.5px monospace, system-ui, sans-serif';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText(labelRange, left + bWidth / 2, topY + selH / 2);
  }
  mctx.restore();
}