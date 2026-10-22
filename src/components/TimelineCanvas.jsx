import React, { useRef, useEffect, useState } from 'react';
import { THEMES } from '../utils/themeConfig.js';
import { supabase } from '../supabase.js';
import {
  PERIOD_SEGMENTS,
  DEFAULT_TAG_PALETTE,
  COLOR_PRESETS,
  GLOBAL_MIN,
  GLOBAL_MAX,
  MINI_PAD,
  HANDLE_WIDTH,
  MINI_HEIGHT,
  BAR_HEIGHT,
  formatYear,
  getTickInterval,
  getAutoPeriod,
  getItemStyle
} from '../utils/timelineMath.js';

import EventPopup from './EventPopup.jsx';
import FilterDrawer from './FilterDrawer.jsx';
import EventModal from './EventModal.jsx';
import KnowledgeSplitView from './KnowledgeSplitView.jsx';
import EventEditDrawer from './EventEditDrawer.jsx';
import HistoricalAtlas from './HistoricalAtlas.jsx';

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);

  const [viewRange, setViewRange] = useState({ min: -1000, max: 2026 });
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('chronos_theme') || 'light';
  });

  useEffect(() => {
    document.body.className = THEMES[currentTheme]?.bgClass || 'theme-gallery';
    localStorage.setItem('chronos_theme', currentTheme);
  }, [currentTheme]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState([]);

  // Répertoire des tags
  const [availableTags, setAvailableTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [newTagInput, setNewTagInput] = useState('');

  // Répertoire des fils conducteurs / thématiques
  const [availableGroups, setAvailableGroups] = useState([]);
  const [newGroupInput, setNewGroupInput] = useState('');

  // 1. Volet d'infos & filtres à gauche FERMÉ PAR DÉFAUT
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [customSelectedIds, setCustomSelectedIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState('tags');
  const [searchQuery, setSearchQuery] = useState('');

  // Atlas Historique Mondial (Haut 50% escamotable)
  const [isAtlasOpen, setIsAtlasOpen] = useState(true);
  const [mapLayers, setMapLayers] = useState({
    worldEmpires: true,
    subDivisions: true,
    tradeRoutes: false,
    ancientCities: false,
    markers: true
  });

  const handleToggleMapLayer = (layerKey) => {
    setMapLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };
  const [atlasFocusedEvent, setAtlasFocusedEvent] = useState(null);
  
  // 2. Année active des territoires affichés dans l'Atlas
  const [atlasActiveYear, setAtlasActiveYear] = useState(200);

  // Volet latéral droit de savoir (Slide-over)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState(null);

  // Volet latéral droit de modification
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTargetEvent, setEditingTargetEvent] = useState(null);

  // Pop-up création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    groupe_id: '',
    anneeDebut: '',
    ereDebut: 'CE',
    anneeFin: '',
    ereFin: 'CE',
    tags: [Object.keys(DEFAULT_TAG_PALETTE)[0]],
    couleur: COLOR_PRESETS[0].stroke,
    importance: 3,
    forme: 'bandeau',
    style_trait: 'plein',
    gravite: true,
    opacite: 0.85
  });

  const viewRef = useRef(viewRange);
  useEffect(() => { viewRef.current = viewRange; }, [viewRange]);

  const targetViewRef = useRef({ min: -1000, max: 2026 });
  const animFrameRef = useRef(null);
  const textureShiftRef = useRef(0);
  const stonePatternRef = useRef(null);

  useEffect(() => {
    const stoneNoise = document.createElement('canvas');
    stoneNoise.width = 600;
    stoneNoise.height = 300;
    const nctx = stoneNoise.getContext('2d');

    nctx.fillStyle = '#333842';
    nctx.fillRect(0, 0, 600, 300);

    for (let i = 0; i < 20000; i++) {
      const gx = Math.random() * 600;
      const gy = Math.random() * 300;
      const isLight = Math.random() < 0.48;
      nctx.fillStyle = isLight
        ? `rgba(255, 255, 255, ${0.04 + Math.random() * 0.08})`
        : `rgba(0, 0, 0, ${0.06 + Math.random() * 0.10})`;
      nctx.fillRect(gx, gy, 1, 1);
    }

    const cMain = canvasMainRef.current;
    if (cMain) {
      const ctx = cMain.getContext('2d');
      stonePatternRef.current = ctx.createPattern(stoneNoise, 'repeat');
    }
  }, []);

  const updateInertia = () => {
    const cur = viewRef.current;
    const tgt = targetViewRef.current;

    const diffMin = tgt.min - cur.min;
    const diffMax = tgt.max - cur.max;

    if (Math.abs(diffMin) > 0.05 || Math.abs(diffMax) > 0.05) {
      const nextMin = cur.min + diffMin * 0.18;
      const nextMax = cur.max + diffMax * 0.18;
      setViewRange({ min: nextMin, max: nextMax });
      animFrameRef.current = requestAnimationFrame(updateInertia);
    } else {
      setViewRange({ min: tgt.min, max: tgt.max });
      animFrameRef.current = null;
    }
  };

  const smoothSetView = (nextTgt, deltaX = 0) => {
    targetViewRef.current = nextTgt;
    if (deltaX !== 0) {
      textureShiftRef.current += deltaX;
    }
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateInertia);
    }
  };

  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

  const filterRef = useRef({
    mode: filterMode,
    tags: selectedTags,
    groups: selectedGroups,
    customIds: customSelectedIds
  });
  useEffect(() => {
    filterRef.current = {
      mode: filterMode,
      tags: selectedTags,
      groups: selectedGroups,
      customIds: customSelectedIds
    };
  }, [filterMode, selectedTags, selectedGroups, customSelectedIds]);

  const hitboxesRef = useRef([]);

  const yearToMiniX = (year, width) => {
    const clamped = Math.max(GLOBAL_MIN, Math.min(GLOBAL_MAX, year));
    const usableW = width - 2 * MINI_PAD;
    let accRatio = 0;
    for (const seg of PERIOD_SEGMENTS) {
      if (clamped <= seg.end) {
        const segProgress = (clamped - seg.start) / (seg.end - seg.start);
        return MINI_PAD + (accRatio + segProgress * seg.ratio) * usableW;
      }
      accRatio += seg.ratio;
    }
    return MINI_PAD + usableW;
  };

  const miniXToYear = (x, width) => {
    const usableW = width - 2 * MINI_PAD;
    const progress = Math.max(0, Math.min(1, (x - MINI_PAD) / usableW));
    let accRatio = 0;
    for (const seg of PERIOD_SEGMENTS) {
      if (progress <= accRatio + seg.ratio) {
        const segProgress = (progress - accRatio) / seg.ratio;
        return seg.start + segProgress * (seg.end - seg.start);
      }
      accRatio += seg.ratio;
    }
    return GLOBAL_MAX;
  };

  const computeGravityTracks = (periodesList) => {
    const sorted = [...periodesList].sort((a, b) => a.date_debut - b.date_debut || (b.date_fin - a.date_fin));
    const occupiedTop = [];
    const occupiedBottom = [];

    return sorted.map((p, idx) => {
      let side = p.cote ? p.cote : ((idx % 2 === 0) ? 'top' : 'bottom');
      let tracks = side === 'top' ? occupiedTop : occupiedBottom;

      if (p.gravite === false) {
        let fixedLevel = 0;
        while (tracks[fixedLevel] !== undefined && tracks[fixedLevel] > p.date_debut) {
          fixedLevel++;
        }
        tracks[fixedLevel] = p.date_fin;
        return { ...p, side, level: fixedLevel, dropYear: null };
      }

      let level = 0;
      while (tracks[level] !== undefined && tracks[level] > p.date_debut) {
        level++;
      }

      const altSide = side === 'top' ? 'bottom' : 'top';
      const altTracks = altSide === 'top' ? occupiedTop : occupiedBottom;
      let altLevel = 0;
      while (altTracks[altLevel] !== undefined && altTracks[altLevel] > p.date_debut) {
        altLevel++;
      }

      if (altLevel < level) {
        side = altSide;
        tracks = altTracks;
        level = altLevel;
      }

      let dropYear = null;
      if (level > 0 && tracks[level - 1] !== undefined && tracks[level - 1] > p.date_debut && tracks[level - 1] < p.date_fin) {
        dropYear = tracks[level - 1];
        tracks[level - 1] = p.date_fin;
      }

      tracks[level] = p.date_fin;
      return { ...p, side, level, dropYear };
    });
  };

  const drawScene = () => {
    const th = THEMES[currentTheme]?.canvas || THEMES.light.canvas;
    const cMain = canvasMainRef.current;
    const cMini = canvasMiniRef.current;
    if (!cMain || !cMini) return;

    const ctx = cMain.getContext('2d');
    const mctx = cMini.getContext('2d');
    const w = cMain.width;
    const h = cMain.height;
    const mw = cMini.width;
    const mh = cMini.height;

    if (w === 0 || h === 0 || mw === 0 || mh === 0) return;

    const { min: vMin, max: vMax } = viewRef.current;
    const span = vMax - vMin;
    const yearToX = (year) => ((year - vMin) / span) * w;

    ctx.clearRect(0, 0, w, h);
    hitboxesRef.current = [];

    const isMobile = w < 640;
    const barY = h * (isMobile ? 0.70 : 0.58);

    const zoomFactor = Math.max(0, Math.min(1, (3000 - span) / 2900));
    const trackH = Math.round((isMobile ? 16 : 18) + zoomFactor * (isMobile ? 8 : 12));
    const basePadding = Math.round(4 + zoomFactor * 3);
    const periodFontSize = Math.round(10 + zoomFactor * 2.5);

    const defaultHalfH = Math.round((isMobile ? 24 : 26) + zoomFactor * (isMobile ? 18 : 28));

    const xStart = yearToX(GLOBAL_MIN);
    const xEnd = yearToX(GLOBAL_MAX);

    const allEvents = eventsRef.current || [];
    const activeFilter = filterRef.current;

    const filteredList = allEvents.filter(evt => {
      if (activeFilter.mode === 'custom') {
        return activeFilter.customIds.has(evt.id);
      }
      if (activeFilter.mode === 'groups') {
        const group = (evt.groupe_id && typeof evt.groupe_id === 'string') ? evt.groupe_id.trim() : null;
        return group ? activeFilter.groups.includes(group) : false;
      }
      const itemTags = Array.isArray(evt.tags) && evt.tags.length > 0 ? evt.tags : [evt.categorie || "Sans tag"];
      return itemTags.some(tag => activeFilter.tags.includes(tag));
    });

    const rawPeriodes = filteredList.filter(e => e.date_fin !== null && e.date_fin !== undefined && e.date_fin !== '');
    const ponctuels = filteredList.filter(e => !e.date_fin);

    const gravityPeriodes = computeGravityTracks(rawPeriodes);

    // Corps minéral
    const visibleX1 = Math.max(-60, xStart);
    const visibleX2 = Math.min(w + 60, xEnd);
    const visibleW = Math.max(0, visibleX2 - visibleX1);

    if (visibleW > 0) {
      const topY = barY - defaultHalfH;
      const totalH = defaultHalfH * 2;

      ctx.save();
      ctx.shadowColor = currentTheme === 'light' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#2d323b';

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(visibleX1, topY, visibleW, totalH, 8);
      } else {
        ctx.rect(visibleX1, topY, visibleW, totalH);
      }
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(visibleX1, topY, visibleW, totalH, 8);
      } else {
        ctx.rect(visibleX1, topY, visibleW, totalH);
      }
      ctx.clip();

      if (stonePatternRef.current) {
        if (ctx.setTransform && stonePatternRef.current.setTransform) {
          const matrix = new DOMMatrix().translate(textureShiftRef.current % 600, 0);
          stonePatternRef.current.setTransform(matrix);
        }
        ctx.fillStyle = stonePatternRef.current;
        ctx.fill();
      } else {
        ctx.fillStyle = '#333842';
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(visibleX1, barY);
      ctx.lineTo(visibleX2, barY);
      ctx.stroke();
    }

    // Dessin des périodes
    gravityPeriodes.forEach((p) => {
      const x1 = yearToX(p.date_debut);
      const x2 = yearToX(p.date_fin);
      const rX = Math.min(x1, x2);
      const rW = Math.max(4, Math.abs(x2 - x1));

      if (rX + rW < -100 || rX > w + 100) return;

      const style = getItemStyle(p);
      const isSelected = (selectedEvent && selectedEvent.id === p.id) || (drawerEvent && drawerEvent.id === p.id);
      const isTop = p.side === 'top';
      const dir = isTop ? -1 : 1;

      const transitionW = Math.max(16, trackH * 1.1);

      ctx.save();
      ctx.fillStyle = isSelected ? style.stroke : (p.couleur || style.stroke || style.fill);
      ctx.strokeStyle = isSelected ? '#ffffff' : (p.couleur || style.stroke);
      ctx.lineWidth = isSelected ? 2.5 : (p.forme === 'ligne' ? 2 : 1.2);

      if (p.style_trait === 'pointille') {
        ctx.setLineDash([5, 4]);
      } else {
        ctx.setLineDash([]);
      }

      let rectTop = 0;
      let rectH = trackH;

      const yBase = barY + dir * (basePadding + p.level * (trackH + 3));
      rectTop = isTop ? yBase - trackH : yBase;

      let canDrop = false;
      let xSplit = 0;
      let remainingWAfterDrop = 0;

      if (p.dropYear && p.dropYear > p.date_debut && p.dropYear < p.date_fin && p.level > 0) {
        xSplit = yearToX(p.dropYear);
        remainingWAfterDrop = (rX + rW) - xSplit;
        if (remainingWAfterDrop >= trackH) {
          canDrop = true;
        }
      }

      if (p.forme === 'ligne') {
        const lineY = isTop ? rectTop + trackH * 0.75 : rectTop + trackH * 0.25;
        const tickH = Math.max(6, trackH * 0.4);

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
        const yStart = barY + dir * (basePadding + p.level * (trackH + 3));
        const yEnd = barY + dir * (basePadding + targetLvl * (trackH + 3));
        const radius = p.forme === 'ruban' ? Math.round(trackH / 2) : 4;

        ctx.beginPath();
        ctx.moveTo(rX + radius, yStart + dir * trackH);
        ctx.lineTo(xTransStart, yStart + dir * trackH);

        ctx.bezierCurveTo(
          xTransStart + actualTransW * 0.5, yStart + dir * trackH,
          xTransStart + actualTransW * 0.5, yEnd + dir * trackH,
          xTransEnd, yEnd + dir * trackH
        );

        ctx.lineTo(rX + rW - radius, yEnd + dir * trackH);
        ctx.arcTo(rX + rW, yEnd + dir * trackH, rX + rW, yEnd, radius);
        ctx.arcTo(rX + rW, yEnd, rX + rW - radius, yEnd, radius);

        ctx.lineTo(xTransEnd, yEnd);
        ctx.bezierCurveTo(
          xTransStart + actualTransW * 0.5, yEnd,
          xTransStart + actualTransW * 0.5, yStart,
          xTransStart, yStart
        );

        ctx.lineTo(rX + radius, yStart);
        ctx.arcTo(rX, yStart, rX, yStart + dir * trackH, radius);
        ctx.arcTo(rX, yStart + dir * trackH, rX + radius, yStart + dir * trackH, radius);

        ctx.closePath();

        ctx.save();
        ctx.globalAlpha = p.opacite ?? 0.85;
        ctx.fill();
        ctx.restore();

        ctx.stroke();

        rectTop = Math.min(yStart, yEnd, yStart + dir * trackH, yEnd + dir * trackH);
        rectH = Math.abs(yStart - yEnd) + trackH;
      } else {
        const radius = p.forme === 'ruban' ? Math.round(trackH / 2) : 4;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rX, rectTop, rW, trackH, radius);
        } else {
          ctx.rect(rX, rectTop, rW, trackH);
        }

        ctx.save();
        ctx.globalAlpha = p.opacite ?? 0.85;
        ctx.fill();
        ctx.restore();

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

      if (rW > 30) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rX + 2, rectTop, rW - 4, rectH);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${periodFontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.titre, rX + 6, rectTop + (isTop ? trackH / 2 : rectH - trackH / 2));
        ctx.restore();
      }

      ctx.restore();
    });

    // Graduations
    const interval = getTickInterval(span);
    const firstTick = Math.ceil(vMin / interval) * interval;
    ctx.fillStyle = currentTheme === 'light' ? '#52525b' : th.tickText;
    ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
    ctx.textAlign = 'center';

    for (let t = firstTick; t <= vMax; t += interval) {
      if (t < GLOBAL_MIN || t > GLOBAL_MAX) continue;
      const tx = yearToX(t);
      ctx.strokeStyle = currentTheme === 'light' ? 'rgba(113, 113, 122, 0.4)' : th.ticks;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, barY + defaultHalfH);
      ctx.lineTo(tx, barY + defaultHalfH + 6);
      ctx.stroke();
      ctx.fillText(formatYear(t), tx, barY + defaultHalfH + (isMobile ? 18 : 22));
    }

    // Ponctuels avec étagement
    let minImportanceForText = 1;
    if (span > 5000) minImportanceForText = 4;
    else if (span > 800) minImportanceForText = 3;
    else if (span > 250) minImportanceForText = 2;

    const pinTracks = [];
    const sortedPonctuels = [...ponctuels].sort((a, b) => a.date_debut - b.date_debut);

    sortedPonctuels.forEach((evt) => {
      const x = yearToX(evt.date_debut);
      if (x < -200 || x > w + 200) return;

      const titreTexte = String(evt.titre || 'Sans titre');
      const style = getItemStyle(evt);
      const isSelected = (selectedEvent && selectedEvent.id === evt.id) || (drawerEvent && drawerEvent.id === evt.id);
      const shouldShowLabel = (evt.importance || 3) >= minImportanceForText || isSelected;

      ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
      const textWidth = ctx.measureText(titreTexte).width;
      const labelW = shouldShowLabel ? textWidth + 16 : 16;

      let trackIndex = 0;
      while (pinTracks[trackIndex] && pinTracks[trackIndex] > x - 8) {
        trackIndex++;
      }
      pinTracks[trackIndex] = x + labelW;

      const baseStem = isMobile ? 26 : 36;
      const stepStem = isMobile ? 22 : 30;
      const decalageY = baseStem + (trackIndex % 5) * stepStem;
      const yT = (barY - defaultHalfH) - decalageY;

      const pinColor = isSelected ? '#0284c7' : (evt.couleur || style.stroke || '#475569');

      ctx.save();
      ctx.strokeStyle = isSelected ? pinColor : 'rgba(148, 163, 184, 0.65)';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, barY - defaultHalfH);
      ctx.lineTo(x, yT);
      ctx.stroke();

      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(x, barY - defaultHalfH, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, yT, isSelected ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();

      if (shouldShowLabel) {
        const anneeStr = evt.date_debut < 0 ? `${Math.abs(evt.date_debut)} BCE` : `${evt.date_debut} CE`;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
        ctx.fillStyle = pinColor;
        ctx.fillText(anneeStr, x + 8, yT - 1);

        ctx.textBaseline = 'top';
        ctx.font = isSelected
          ? (isMobile ? '600 11px system-ui, sans-serif' : '600 12px system-ui, sans-serif')
          : (isMobile ? '500 10px system-ui, sans-serif' : '500 11px system-ui, sans-serif');
        ctx.fillStyle = currentTheme === 'light' ? '#18181b' : '#f8fafc';
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

    // Bornes
    if (xStart >= -120 && xStart <= w + 120) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xStart, barY - defaultHalfH - 12);
      ctx.lineTo(xStart, barY + defaultHalfH + 12);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText("Origine (-4.5 Ga)", xStart - 8, barY);
      ctx.restore();
    }

    if (xEnd >= -120 && xEnd <= w + 120) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xEnd, barY - defaultHalfH - 12);
      ctx.lineTo(xEnd, barY + defaultHalfH + 12);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("Présent (2026)", xEnd + 8, barY);
      ctx.restore();
    }

    // Curseur de l'Atlas
    if (isAtlasOpen && atlasActiveYear !== null) {
      const atlasX = yearToX(atlasActiveYear);

      if (atlasX >= -100 && atlasX <= w + 100) {
        ctx.save();

        const gradient = ctx.createLinearGradient(atlasX - 18, 0, atlasX + 18, 0);
        gradient.addColorStop(0, 'rgba(180, 83, 9, 0)');
        gradient.addColorStop(0.5, 'rgba(180, 83, 9, 0.18)');
        gradient.addColorStop(1, 'rgba(180, 83, 9, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(atlasX - 18, 0, 36, h);

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(atlasX, 0);
        ctx.lineTo(atlasX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        const labelText = `🏛️ Carte : ${formatYear(atlasActiveYear)}`;
        ctx.font = 'bold 10px system-ui, sans-serif';
        const labelW = ctx.measureText(labelText).width + 16;
        const badgeY = 14;

        ctx.fillStyle = '#b45309';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(atlasX - labelW / 2, badgeY, labelW, 20, 10);
        } else {
          ctx.rect(atlasX - labelW / 2, badgeY, labelW, 20);
        }
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(atlasX - 4, badgeY + 20);
        ctx.lineTo(atlasX, badgeY + 24);
        ctx.lineTo(atlasX + 4, badgeY + 20);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, atlasX, badgeY + 10);

        ctx.restore();
      }
    }

    // Minimap
    mctx.fillStyle = th.minimapBg;
    mctx.fillRect(0, 0, mw, mh);

    const usableW = mw - 2 * MINI_PAD;
    let currentX = MINI_PAD;

    PERIOD_SEGMENTS.forEach(seg => {
      const segWidth = seg.ratio * usableW;
      mctx.fillStyle = seg.color;
      mctx.fillRect(currentX, 6, segWidth, 28);
      mctx.strokeStyle = '#0f172a';
      mctx.lineWidth = 1;
      mctx.strokeRect(currentX, 6, segWidth, 28);

      mctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      mctx.font = isMobile ? '8px sans-serif' : '10px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText(isMobile ? seg.nom.slice(0, 4) : seg.nom, currentX + segWidth / 2, 23);
      currentX += segWidth;
    });

    filteredList.forEach(evt => {
      const mx = yearToMiniX(evt.date_debut, mw);
      const style = getItemStyle(evt);
      if (evt.date_fin) {
        const mx2 = yearToMiniX(evt.date_fin, mw);
        const mW = Math.max(2, Math.abs(mx2 - mx));
        mctx.fillStyle = style.fill;
        mctx.fillRect(Math.min(mx, mx2), 36, mW, 6);
      } else {
        mctx.fillStyle = style.stroke;
        mctx.fillRect(mx - 1, 36, 2, 6);
      }
    });

    if (isAtlasOpen && atlasActiveYear !== null) {
      const atlasMiniX = yearToMiniX(atlasActiveYear, mw);
      mctx.fillStyle = '#b45309';
      mctx.fillRect(atlasMiniX - 1, 4, 2, 42);
    }

    const vx1 = yearToMiniX(vMin, mw);
    const vx2 = yearToMiniX(vMax, mw);
    const left = Math.min(vx1, vx2);
    const right = Math.max(vx1, vx2);
    const bWidth = Math.max(10, right - left);

    mctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    mctx.fillRect(left, 4, bWidth, 42);
    mctx.strokeStyle = th.viewportBorder;
    mctx.lineWidth = 2;
    mctx.strokeRect(left, 4, bWidth, 42);

    mctx.fillStyle = '#ffffff';
    mctx.fillRect(left, 6, 4, 38);
    mctx.fillRect(left + bWidth - 4, 6, 4, 38);

    mctx.fillStyle = '#94a3b8';
    mctx.font = '9px monospace, sans-serif';
    mctx.textAlign = 'left';
    mctx.fillText("-4.5 Ga", MINI_PAD, 60);
    mctx.textAlign = 'right';
    mctx.fillText("2026", mw - MINI_PAD, 60);
  };

  const updateSizesAndDraw = () => {
    if (!canvasMainRef.current || !canvasMiniRef.current) return;
    const totalW = window.innerWidth;
    const totalH = window.innerHeight;

    const timelineH = isAtlasOpen ? totalH * 0.5 : totalH;

    canvasMainRef.current.width = totalW;
    canvasMainRef.current.height = Math.max(100, timelineH - MINI_HEIGHT);

    canvasMiniRef.current.width = totalW;
    canvasMiniRef.current.height = MINI_HEIGHT;

    drawScene();
  };

  useEffect(() => {
    async function chargerEvenements() {
      const { data, error } = await supabase.from('evenements').select('*');
      if (!error && data) {
        setEvents(data);
        setCustomSelectedIds(new Set(data.map(d => d.id)));

        const extractedTags = new Set(Object.keys(DEFAULT_TAG_PALETTE));
        const extractedGroups = new Set();

        data.forEach(item => {
          if (Array.isArray(item.tags)) item.tags.forEach(t => extractedTags.add(t));
          else if (item.categorie) extractedTags.add(item.categorie);

          if (item.groupe_id && typeof item.groupe_id === 'string' && item.groupe_id.trim()) {
            extractedGroups.add(item.groupe_id.trim());
          }
        });

        const listTags = Array.from(extractedTags);
        const listGroups = Array.from(extractedGroups);

        setAvailableTags(listTags);
        setSelectedTags(listTags);

        setAvailableGroups(listGroups);
        setSelectedGroups(listGroups);
      }
    }
    chargerEvenements();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateSizesAndDraw);
    updateSizesAndDraw();
    return () => window.removeEventListener('resize', updateSizesAndDraw);
  }, [isAtlasOpen]);

  useEffect(() => {
    drawScene();
  }, [viewRange, events, selectedTags, selectedGroups, customSelectedIds, filterMode, selectedEvent, drawerEvent, isAtlasOpen, atlasActiveYear, currentTheme]);

  // Écouteurs souris et tactile
  useEffect(() => {
    const cMain = canvasMainRef.current;
    const cMini = canvasMiniRef.current;
    if (!cMain || !cMini) return;

    let isMainDragging = false;
    let dragStartX = 0;
    let dragStartMin = 0;
    let dragStartMax = 0;

    let miniMode = null;
    let miniDragStartX = 0;
    let miniStartMin = 0;
    let miniStartMax = 0;

    let touchStartDist = null;
    let touchStartCenterYear = 0;
    let touchStartSpan = 0;

    const onMainMouseDown = (e) => {
      isMainDragging = true;
      dragStartX = e.clientX;
      dragStartMin = targetViewRef.current.min;
      dragStartMax = targetViewRef.current.max;
    };

    const onMainMouseMove = (e) => {
      if (!isMainDragging) return;
      const dx = e.clientX - dragStartX;
      const span = dragStartMax - dragStartMin;
      const shift = (dx / cMain.width) * span;
      smoothSetView({ min: dragStartMin - shift, max: dragStartMax - shift }, dx);
    };

    const onMainWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const span = vMax - vMin;
      const mouseYear = vMin + (e.clientX / cMain.width) * span;

      const nMin = mouseYear + (vMin - mouseYear) * factor;
      const nMax = mouseYear + (vMax - mouseYear) * factor;
      if (nMax - nMin > 1) {
        smoothSetView({ min: nMin, max: nMax });
      }
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isMainDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartMin = targetViewRef.current.min;
        dragStartMax = targetViewRef.current.max;
        touchStartDist = null;
      } else if (e.touches.length === 2) {
        isMainDragging = false;
        const x1 = e.touches[0].clientX;
        const x2 = e.touches[1].clientX;
        touchStartDist = Math.hypot(x1 - x2, e.touches[0].clientY - e.touches[1].clientY);

        const { min: vMin, max: vMax } = targetViewRef.current;
        touchStartSpan = vMax - vMin;
        const midX = (x1 + x2) / 2;
        touchStartCenterYear = vMin + (midX / cMain.width) * touchStartSpan;
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isMainDragging) {
        const dx = e.touches[0].clientX - dragStartX;
        const span = dragStartMax - dragStartMin;
        const shift = (dx / cMain.width) * span;
        smoothSetView({ min: dragStartMin - shift, max: dragStartMax - shift }, dx);
      } else if (e.touches.length === 2 && touchStartDist) {
        const x1 = e.touches[0].clientX;
        const x2 = e.touches[1].clientX;
        const currentDist = Math.hypot(x1 - x2, e.touches[0].clientY - e.touches[1].clientY);

        if (currentDist > 0) {
          const scale = touchStartDist / currentDist;
          const nextSpan = Math.max(1, touchStartSpan * scale);
          const midX = (x1 + x2) / 2;
          const ratio = midX / cMain.width;
          smoothSetView({
            min: touchStartCenterYear - nextSpan * ratio,
            max: touchStartCenterYear + nextSpan * (1 - ratio)
          });
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        isMainDragging = false;
        touchStartDist = null;
      } else if (e.touches.length === 1) {
        isMainDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartMin = targetViewRef.current.min;
        dragStartMax = targetViewRef.current.max;
        touchStartDist = null;
      }
    };

    const onMainClick = (e) => {
      const rect = cMain.getBoundingClientRect();
      const cx = (e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - rect.left;
      const cy = (e.clientY || (e.changedTouches && e.changedTouches[0].clientY)) - rect.top;

      const hit = [...hitboxesRef.current].reverse().find(h => {
        if (h.type === 'circle') {
          return Math.hypot(cx - h.x, cy - h.y) <= h.r;
        } else if (h.type === 'rect') {
          return cx >= h.x && cx <= h.x + h.w && cy >= h.y && cy <= h.y + h.h;
        }
        return false;
      });

      if (hit) {
        setSelectedEvent(hit.evt);
        setAtlasFocusedEvent(hit.evt);
        const targetX = hit.type === 'rect' ? hit.x + hit.w / 2 : hit.x;
        const targetY = hit.y;
        setPopupPos({ x: targetX, y: targetY });

        if (isDrawerOpen) {
          setDrawerEvent(hit.evt);
        }
        if (isEditDrawerOpen) {
          setEditingTargetEvent(hit.evt);
        }
      } else {
        setSelectedEvent(null);
      }
    };

    const onMiniStart = (clientX) => {
      const mw = cMini.width;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const vx1 = yearToMiniX(vMin, mw);
      const vx2 = yearToMiniX(vMax, mw);
      const left = Math.min(vx1, vx2);
      const right = Math.max(vx1, vx2);

      miniDragStartX = clientX;
      miniStartMin = vMin;
      miniStartMax = vMax;

      if (Math.abs(clientX - left) <= HANDLE_WIDTH + 8) {
        miniMode = 'left';
      } else if (Math.abs(clientX - right) <= HANDLE_WIDTH + 8) {
        miniMode = 'right';
      } else if (clientX > left && clientX < right) {
        miniMode = 'move';
      } else {
        const clickedYear = miniXToYear(clientX, mw);
        const currentSpan = vMax - vMin;
        smoothSetView({ min: clickedYear - currentSpan / 2, max: clickedYear + currentSpan / 2 });
        miniMode = 'move';
      }
    };

    const onMiniMove = (clientX) => {
      const mw = cMini.width;
      const targetYear = miniXToYear(clientX, mw);
      if (miniMode === 'move') {
        const startYear = miniXToYear(miniDragStartX, mw);
        const shift = targetYear - startYear;
        smoothSetView({ min: miniStartMin + shift, max: miniStartMax + shift });
      } else if (miniMode === 'left') {
        if (targetViewRef.current.max - targetYear >= 1) smoothSetView({ min: targetYear, max: targetViewRef.current.max });
      } else if (miniMode === 'right') {
        if (targetYear - targetViewRef.current.min >= 1) smoothSetView({ min: targetYear, max: targetViewRef.current.max });
      }
    };

    const onMiniMouseDown = (e) => onMiniStart(e.clientX);
    const onMiniMouseMove = (e) => {
      if (miniMode) onMiniMove(e.clientX);
    };

    const onMiniTouchStart = (e) => {
      if (e.touches.length > 0) onMiniStart(e.touches[0].clientX);
    };
    const onMiniTouchMove = (e) => {
      e.preventDefault();
      if (miniMode && e.touches.length > 0) onMiniMove(e.touches[0].clientX);
    };

    const onEnd = () => {
      isMainDragging = false;
      miniMode = null;
    };

    cMain.addEventListener('mousedown', onMainMouseDown);
    window.addEventListener('mousemove', onMainMouseMove);
    cMain.addEventListener('wheel', onMainWheel, { passive: false });
    cMain.addEventListener('click', onMainClick);

    cMini.addEventListener('mousedown', onMiniMouseDown);
    window.addEventListener('mousemove', onMiniMouseMove);
    window.addEventListener('mouseup', onEnd);

    cMain.addEventListener('touchstart', onTouchStart, { passive: false });
    cMain.addEventListener('touchmove', onTouchMove, { passive: false });
    cMain.addEventListener('touchend', onTouchEnd);

    cMini.addEventListener('touchstart', onMiniTouchStart, { passive: false });
    cMini.addEventListener('touchmove', onMiniTouchMove, { passive: false });
    cMini.addEventListener('touchend', onEnd);

    return () => {
      cMain.removeEventListener('mousedown', onMainMouseDown);
      window.removeEventListener('mousemove', onMainMouseMove);
      cMain.removeEventListener('wheel', onMainWheel);
      cMain.removeEventListener('click', onMainClick);

      cMini.removeEventListener('mousedown', onMiniMouseDown);
      window.removeEventListener('mousemove', onMiniMouseMove);
      window.removeEventListener('mouseup', onEnd);

      cMain.removeEventListener('touchstart', onTouchStart);
      cMain.removeEventListener('touchmove', onTouchMove);
      cMain.removeEventListener('touchend', onTouchEnd);

      cMini.removeEventListener('touchstart', onMiniTouchStart);
      cMini.removeEventListener('touchmove', onMiniTouchMove);
      cMini.removeEventListener('touchend', onEnd);
    };
  }, [isEditDrawerOpen]);

  const handleOpenCreateModal = () => {
    setFormError('');
    setIsRange(false);
    setFormData({
      titre: '',
      groupe_id: '',
      anneeDebut: '',
      ereDebut: 'CE',
      anneeFin: '',
      ereFin: 'CE',
      tags: [availableTags[0] || Object.keys(DEFAULT_TAG_PALETTE)[0]],
      couleur: COLOR_PRESETS[0].stroke,
      importance: 3,
      forme: 'bandeau',
      style_trait: 'plein',
      gravite: true,
      opacite: 0.85
    });
    setNewGroupInput('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditDrawer = (evt) => {
    const target = evt || selectedEvent;
    if (!target) return;
    setEditingTargetEvent(target);
    setIsEditDrawerOpen(true);
  };

  const handleOpenDrawer = (evt) => {
    const target = evt || selectedEvent;
    if (!target) return;
    setDrawerEvent(target);
    setAtlasFocusedEvent(target);
    setIsDrawerOpen(true);
    setSelectedEvent(null);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerEvent(null);
  };

  const handleDeleteEvent = async (evt) => {
    if (!evt) return;
    const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer "${evt.titre}" ?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('evenements').delete().eq('id', evt.id);
    if (error) {
      alert("Erreur de suppression : " + error.message);
    } else {
      setEvents(prev => prev.filter(e => e.id !== evt.id));
      setSelectedEvent(null);
      if (drawerEvent && drawerEvent.id === evt.id) handleCloseDrawer();
      if (editingTargetEvent && editingTargetEvent.id === evt.id) setIsEditDrawerOpen(false);
    }
  };

  const handleSaveFromDrawer = async (eventId, payload) => {
    const { data, error } = await supabase
      .from('evenements')
      .update(payload)
      .eq('id', eventId)
      .select();

    if (error) {
      alert("Erreur de modification : " + error.message);
    } else if (data && data.length > 0) {
      const updated = data[0];
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvent(updated);
      if (drawerEvent && drawerEvent.id === updated.id) setDrawerEvent(updated);
      setIsEditDrawerOpen(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.titre.trim()) {
      setFormError('Le titre est obligatoire.');
      return;
    }

    const startVal = Number(formData.anneeDebut);
    if (isNaN(startVal) || formData.anneeDebut === '') {
      setFormError('L’année de début doit être un nombre valide.');
      return;
    }
    const calculatedStart = formData.ereDebut === 'BCE' ? -Math.abs(startVal) : startVal;

    let calculatedEnd = null;
    if (isRange) {
      const endVal = Number(formData.anneeFin);
      if (isNaN(endVal) || formData.anneeFin === '') {
        setFormError('L’année de fin doit être un nombre valide.');
        return;
      }
      calculatedEnd = formData.ereFin === 'BCE' ? -Math.abs(endVal) : endVal;
      if (calculatedEnd <= calculatedStart) {
        setFormError('L’année de fin doit être strictement après l’année de début.');
        return;
      }
    }

    setIsSubmitting(true);
    const calculatedPeriod = getAutoPeriod(calculatedStart);
    const chosenTags = formData.tags.length > 0 ? formData.tags : ["Général"];
    const chosenGroup = formData.groupe_id ? formData.groupe_id.trim() : null;

    const payload = {
      titre: formData.titre.trim(),
      groupe_id: chosenGroup,
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      tags: chosenTags,
      categorie: chosenTags[0],
      periode: calculatedPeriod,
      couleur: formData.couleur || null,
      importance: Number(formData.importance),
      description: null,
      latitude: null,
      longitude: null,
      cartes_historiques: [],
      forme: formData.forme || 'bandeau',
      style_trait: formData.style_trait || 'plein',
      gravite: formData.gravite !== false,
      opacite: formData.opacite ?? 0.85
    };

    const { data, error } = await supabase
      .from('evenements')
      .insert([payload])
      .select();

    setIsSubmitting(false);

    if (error) {
      setFormError('Erreur d’enregistrement : ' + error.message);
    } else if (data && data.length > 0) {
      const created = data[0];
      setEvents(prev => [...prev, created]);
      setCustomSelectedIds(prev => new Set([...prev, created.id]));
      setSelectedEvent(created);

      if (chosenGroup && !availableGroups.includes(chosenGroup)) {
        setAvailableGroups(prev => [...prev, chosenGroup]);
        setSelectedGroups(prev => [...prev, chosenGroup]);
      }

      setIsCreateModalOpen(false);

      const centerYear = calculatedEnd ? (calculatedStart + calculatedEnd) / 2 : calculatedStart;
      const span = targetViewRef.current.max - targetViewRef.current.min;
      smoothSetView({
        min: centerYear - span / 2,
        max: centerYear + span / 2
      });
    }
  };

  const activeHeaderEvent = drawerEvent || selectedEvent;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'transparent', overflow: 'hidden', userSelect: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", touchAction: 'none' }}>

      {/* 1. ATLAS HISTORIQUE MONDIAL */}
      {isAtlasOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '50vh',
            borderBottom: '1px solid #e7ded0',
            backgroundColor: '#0f172a',
            zIndex: 10,
            overflow: 'hidden'
          }}
        >
          <HistoricalAtlas
            viewRange={viewRange}
            events={events}
            selectedEvent={atlasFocusedEvent || drawerEvent || selectedEvent}
            onOpenDrawer={(evt) => handleOpenDrawer(evt)}
            onMapYearChange={(yr) => setAtlasActiveYear(yr)}
            mapLayers={mapLayers}
          />
        </div>
      )}

      {/* 2. Slide-over lateral droit */}
      <KnowledgeSplitView
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        event={drawerEvent}
      />

      {/* 3. Indicateur de date */}
      <div
        style={{
          position: 'absolute',
          top: isAtlasOpen ? 'calc(50vh + 14px)' : 16,
          left: 48,
          zIndex: 20,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          transition: 'top 0.25s ease'
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#71717a'
          }}
        >
          Période
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: currentTheme === 'light' ? '#09090b' : '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
            {formatYear(viewRange.min)}
          </span>
          <span style={{ fontSize: 12, color: '#a1a1aa' }}>—</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: currentTheme === 'light' ? '#09090b' : '#f8fafc', fontVariantNumeric: 'tabular-nums' }}>
            {formatYear(viewRange.max)}
          </span>
        </div>
      </div>

      {/* 4. Barre d'outils centrée */}
      <div style={{
        position: 'absolute',
        top: isAtlasOpen ? 'calc(50% + 12px)' : 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
        borderRadius: 14,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
        color: currentTheme === 'light' ? '#18181b' : '#f8fafc',
        transition: 'top 0.25s ease'
      }}>
        <button
          type="button"
          onClick={() => setIsAtlasOpen(prev => !prev)}
          style={{
            padding: '6px 10px',
            backgroundColor: isAtlasOpen ? '#0284c7' : (currentTheme === 'light' ? '#f4f4f5' : '#1e293b'),
            color: isAtlasOpen ? '#ffffff' : (currentTheme === 'light' ? '#52525b' : '#94a3b8'),
            border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title={isAtlasOpen ? "Replier la carte" : "Déployer la carte"}
        >
          {isAtlasOpen ? '🗺️ Atlas (50%)' : '🗺️ Ouvrir Atlas'}
        </button>

        <button
          type="button"
          onClick={() => setCurrentTheme(t => (t === 'light' ? 'dark' : 'light'))}
          style={{
            padding: '6px 10px',
            backgroundColor: currentTheme === 'light' ? '#f4f4f5' : '#1e293b',
            color: currentTheme === 'light' ? '#52525b' : '#94a3b8',
            border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {currentTheme === 'light' ? 'Nuit' : 'Jour'}
        </button>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>+</span>
          <span>Ajouter</span>
        </button>

        {activeHeaderEvent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 4, borderLeft: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => {
                if (isDrawerOpen) handleCloseDrawer();
                else handleOpenDrawer(selectedEvent);
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: isDrawerOpen ? '#0284c7' : (currentTheme === 'light' ? '#f4f4f5' : '#1e293b'),
                color: isDrawerOpen ? '#ffffff' : '#0284c7',
                border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isDrawerOpen ? '✕ Volet' : 'Détails'}
            </button>

            <button
              type="button"
              onClick={() => handleOpenEditDrawer(activeHeaderEvent)}
              style={{
                padding: '6px 8px',
                backgroundColor: currentTheme === 'light' ? '#f4f4f5' : '#1e293b',
                color: '#d97706',
                border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Éditer
            </button>
          </div>
        )}
      </div>

      {/* 5. Volet latéral gauche des filtres */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onToggleOpen={() => setIsFilterOpen(!isFilterOpen)}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
        onSelectAllTags={() => setSelectedTags(availableTags)}
        onDeselectAllTags={() => setSelectedTags([])}
        availableGroups={availableGroups}
        selectedGroups={selectedGroups}
        onToggleGroup={(grp) => setSelectedGroups(prev => prev.includes(grp) ? prev.filter(g => g !== grp) : [...prev, grp])}
        onSelectAllGroups={() => setSelectedGroups(availableGroups)}
        onDeselectAllGroups={() => setSelectedGroups([])}
        events={events}
        customSelectedIds={customSelectedIds}
        onToggleCustomEvent={(id) => setCustomSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        })}
        onSelectAllCustom={() => setCustomSelectedIds(new Set(events.map(e => e.id)))}
        onDeselectAllCustom={() => setCustomSelectedIds(new Set())}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentTheme={currentTheme}
        mapLayers={mapLayers}
        onToggleMapLayer={handleToggleMapLayer}
      />

      {/* Pop-up aperçu rapide ancrée */}
      {selectedEvent && (() => {
        const span = viewRange.max - viewRange.min;
        if (span <= 0) return null;

        const isPeriod = selectedEvent.date_fin !== null && selectedEvent.date_fin !== undefined;
        const targetYear = isPeriod 
          ? (Math.max(viewRange.min, selectedEvent.date_debut) + Math.min(viewRange.max, selectedEvent.date_fin)) / 2 
          : selectedEvent.date_debut;

        const dynamicX = ((targetYear - viewRange.min) / span) * window.innerWidth;
        const atlasOffsetY = isAtlasOpen ? (window.innerHeight * 0.5) : 0;
        const absoluteTargetY = atlasOffsetY + popupPos.y;

        const debut = selectedEvent.date_debut;
        const fin = selectedEvent.date_fin ?? debut;
        if (fin < viewRange.min || debut > viewRange.max) {
          return null;
        }

        return (
          <EventPopup
            event={selectedEvent}
            position={{ x: dynamicX, y: absoluteTargetY }}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleOpenEditDrawer}
            onDelete={handleDeleteEvent}
            onDeepDive={() => handleOpenDrawer(selectedEvent)}
          />
        );
      })()}

      {/* Modale création */}
      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isSubmitting={isSubmitting}
        formError={formError}
        isRange={isRange}
        setIsRange={setIsRange}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateSubmit}
        availableTags={availableTags}
        newTagInput={newTagInput}
        setNewTagInput={setNewTagInput}
        onAddNewTag={() => {
          const trimmed = newTagInput.trim();
          if (!trimmed) return;
          if (!availableTags.includes(trimmed)) {
            setAvailableTags(prev => [...prev, trimmed]);
            setSelectedTags(prev => [...prev, trimmed]);
          }
          if (!formData.tags.includes(trimmed)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
          }
          setNewTagInput('');
        }}
        onToggleTag={(tag) => {
          setFormData(prev => {
            const exists = prev.tags.includes(tag);
            if (exists) {
              if (prev.tags.length === 1) return prev;
              return { ...prev, tags: prev.tags.filter(t => t !== tag) };
            }
            return { ...prev, tags: [...prev.tags, tag] };
          });
        }}
        availableGroups={availableGroups}
        newGroupInput={newGroupInput}
        setNewGroupInput={setNewGroupInput}
        onAddNewGroup={() => {
          const trimmed = newGroupInput.trim();
          if (!trimmed) return;
          if (!availableGroups.includes(trimmed)) {
            setAvailableGroups(prev => [...prev, trimmed]);
            setSelectedGroups(prev => [...prev, trimmed]);
          }
          setFormData(prev => ({ ...prev, groupe_id: trimmed }));
          setNewGroupInput('');
        }}
      />

      {/* Volet d'édition */}
      <EventEditDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        event={editingTargetEvent}
        onSave={handleSaveFromDrawer}
        onDelete={handleDeleteEvent}
        availableTags={availableTags}
        onToggleTag={() => {}}
        availableGroups={availableGroups}
      />

      {/* Canvas frise */}
      <div style={{
        position: 'absolute',
        bottom: 70,
        left: 0,
        width: '100%',
        height: isAtlasOpen ? 'calc(50% - 70px)' : 'calc(100% - 70px)',
        cursor: 'grab',
        touchAction: 'none',
        transition: 'height 0.25s ease'
      }}>
        <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Minimap */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 70,
        backgroundColor: currentTheme === 'light' ? '#f4f4f5' : '#020617',
        borderTop: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #1e293b',
        cursor: 'pointer',
        touchAction: 'none',
        zIndex: 15
      }}>
        <canvas ref={canvasMiniRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

    </div>
  );
}