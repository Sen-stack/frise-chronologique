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

  // Filtres
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [customSelectedIds, setCustomSelectedIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState('tags');
  const [searchQuery, setSearchQuery] = useState('');

  // Split View haut
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [splitEvent, setSplitEvent] = useState(null);

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
    anneeDebut: '',
    ereDebut: 'CE',
    anneeFin: '',
    ereFin: 'CE',
    tags: [Object.keys(DEFAULT_TAG_PALETTE)[0]],
    couleur: COLOR_PRESETS[0].stroke,
    importance: 3
  });

  const viewRef = useRef(viewRange);
  useEffect(() => { viewRef.current = viewRange; }, [viewRange]);

  const targetViewRef = useRef({ min: -1000, max: 2026 });
  const animFrameRef = useRef(null);
  const textureShiftRef = useRef(0);
  const stonePatternRef = useRef(null);

  // Texture minérale ardoise satinée
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

  const filterRef = useRef({ mode: filterMode, tags: selectedTags, customIds: customSelectedIds });
  useEffect(() => {
    filterRef.current = { mode: filterMode, tags: selectedTags, customIds: customSelectedIds };
  }, [filterMode, selectedTags, customSelectedIds]);

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

  // Moteur de gravité dynamique des périodes
  const computeGravityTracks = (periodesList) => {
    const sorted = [...periodesList].sort((a, b) => a.date_debut - b.date_debut || (b.date_fin - b.date_fin));
    const occupiedTop = [];
    const occupiedBottom = [];

    return sorted.map((p, idx) => {
      const side = (idx % 2 === 0) ? 'top' : 'bottom';
      const occupied = side === 'top' ? occupiedTop : occupiedBottom;

      let level = 0;
      let dropYear = null;

      while (occupied[level] && occupied[level] > p.date_debut) {
        level++;
      }

      if (level > 0 && occupied[level - 1] && occupied[level - 1] < p.date_fin) {
        dropYear = occupied[level - 1];
      }

      occupied[level] = p.date_fin;
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
    const trackH = 18;
    const basePadding = 4;
    const defaultHalfH = 26; // Épaisseur régulière et constante de la frise

    const xStart = yearToX(GLOBAL_MIN);
    const xEnd = yearToX(GLOBAL_MAX);

    const allEvents = eventsRef.current || [];
    const activeFilter = filterRef.current;

    const filteredList = allEvents.filter(evt => {
      if (activeFilter.mode === 'custom') {
        return activeFilter.customIds.has(evt.id);
      }
      const itemTags = Array.isArray(evt.tags) && evt.tags.length > 0 ? evt.tags : [evt.categorie || "Sans tag"];
      return itemTags.some(tag => activeFilter.tags.includes(tag));
    });

    const rawPeriodes = filteredList.filter(e => e.date_fin !== null && e.date_fin !== undefined && e.date_fin !== '');
    const ponctuels = filteredList.filter(e => !e.date_fin);

    const gravityPeriodes = computeGravityTracks(rawPeriodes);

    // 1. TRACÉ DU CORPS DE LA FRISE DROITE ET SYMÉTRIQUE
    const visibleX1 = Math.max(-60, xStart);
    const visibleX2 = Math.min(w + 60, xEnd);
    const visibleW = Math.max(0, visibleX2 - visibleX1);

    if (visibleW > 0) {
      const topY = barY - defaultHalfH;
      const botY = barY + defaultHalfH;
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

      // Matière minérale coupée dans le rectangle
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

      // Axe médian interne
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(visibleX1, barY);
      ctx.lineTo(visibleX2, barY);
      ctx.stroke();
    }

    // 2. TRACÉ DES PÉRIODES AVEC GRAVITÉ DYNAMIQUE & TRANSITION EN S
    gravityPeriodes.forEach((p) => {
      const x1 = yearToX(p.date_debut);
      const x2 = yearToX(p.date_fin);
      const rX = Math.min(x1, x2);
      const rW = Math.max(4, Math.abs(x2 - x1));

      if (rX + rW < -100 || rX > w + 100) return;

      const style = getItemStyle(p);
      const isSelected = (selectedEvent && selectedEvent.id === p.id) || (splitEvent && splitEvent.id === p.id);
      const isTop = p.side === 'top';
      const dir = isTop ? -1 : 1;
      const transitionW = 35;

      ctx.save();
      ctx.fillStyle = isSelected ? style.stroke : style.fill;
      ctx.strokeStyle = isSelected ? '#ffffff' : style.stroke;
      ctx.lineWidth = isSelected ? 2 : 1.2;

      // Cas avec transition descendante vers l'axe médian (en S)
      if (p.dropYear && p.dropYear > p.date_debut && p.dropYear < p.date_fin) {
        const xSplit = yearToX(p.dropYear);
        const xTransEnd = Math.min(rX + rW, xSplit + transitionW);

        const yL0 = barY + dir * basePadding;
        const yL1 = barY + dir * (basePadding + trackH + 3);

        ctx.beginPath();
        ctx.moveTo(rX + 4, yL1 + dir * trackH);
        ctx.lineTo(xSplit, yL1 + dir * trackH);
        ctx.bezierCurveTo(
          xSplit + transitionW * 0.5, yL1 + dir * trackH,
          xSplit + transitionW * 0.5, yL0 + dir * trackH,
          xTransEnd, yL0 + dir * trackH
        );
        ctx.lineTo(rX + rW - 4, yL0 + dir * trackH);
        ctx.arcTo(rX + rW, yL0 + dir * trackH, rX + rW, yL0, 4);
        ctx.arcTo(rX + rW, yL0, rX + rW - 4, yL0, 4);

        ctx.lineTo(xTransEnd, yL0);
        ctx.bezierCurveTo(
          xSplit + transitionW * 0.5, yL0,
          xSplit + transitionW * 0.5, yL1,
          xSplit, yL1
        );
        ctx.lineTo(rX + 4, yL1);
        ctx.arcTo(rX, yL1, rX, yL1 + dir * trackH, 4);
        ctx.arcTo(rX, yL1 + dir * trackH, rX + 4, yL1 + dir * trackH, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        hitboxesRef.current.push({
          type: 'rect',
          x: rX,
          y: Math.min(yL0, yL1 + dir * trackH),
          w: rW,
          h: Math.abs(yL1 - yL0) + trackH,
          evt: p
        });
      } else {
        // Cas standard : bande rectangulaire
        const yBase = barY + dir * (basePadding + p.level * (trackH + 3));
        const yTop = isTop ? yBase - trackH : yBase;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rX, yTop, rW, trackH, 4);
        } else {
          ctx.rect(rX, yTop, rW, trackH);
        }
        ctx.fill();
        ctx.stroke();

        hitboxesRef.current.push({ type: 'rect', x: rX, y: yTop, w: rW, h: trackH, evt: p });
      }

      // Titre gravé sur la période
      if (rW > 35) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rX + 2, barY - defaultHalfH, rW - 4, defaultHalfH * 2);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const labelY = isTop ? barY - basePadding - trackH / 2 : barY + basePadding + trackH / 2;
        ctx.fillText(p.titre, rX + 6, labelY);
        ctx.restore();
      }
      ctx.restore();
    });

    // 3. GRADUATIONS DE DATES EN BAS
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

    // 4. JALONS PONCTUELS ÉPURÉS (AIGUILLES MINIMALISTES)
    // 4. JALONS PONCTUELS ÉPURÉS (ANTI-COLLISION & HAUTEURS DYNAMIQUES SÉCURISÉES)
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
      
      // isSelected calculé en premier
      const isSelected = (selectedEvent && selectedEvent.id === evt.id) || (splitEvent && splitEvent.id === evt.id);
      const shouldShowLabel = (evt.importance || 3) >= minImportanceForText || isSelected;

      // Mesure de l'encombrement horizontal
      ctx.font = isMobile ? '600 10px monospace, sans-serif' : '600 11px monospace, sans-serif';
      const textWidth = ctx.measureText(titreTexte).width;
      const labelW = shouldShowLabel ? textWidth + 30 : 16;

      // Recherche de l'étage disponible pour éviter les chevauchements
      let trackIndex = 0;
      while (pinTracks[trackIndex] && pinTracks[trackIndex] > x - 8) {
        trackIndex++;
      }
      pinTracks[trackIndex] = x + labelW;

      // Hauteur de tige étagée (5 paliers)
      const baseStem = isMobile ? 26 : 36;
      const stepStem = isMobile ? 22 : 30;
      const decalageY = baseStem + (trackIndex % 5) * stepStem;
      const yT = (barY - defaultHalfH) - decalageY;

      const pinColor = isSelected ? '#0284c7' : (evt.couleur || style.stroke || '#475569');

      ctx.save();
      // Tige
      ctx.strokeStyle = isSelected ? pinColor : 'rgba(148, 163, 184, 0.65)';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, barY - defaultHalfH);
      ctx.lineTo(x, yT);
      ctx.stroke();

      // Point d'accroche bas
      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(x, barY - defaultHalfH, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pastille sommitale
      ctx.beginPath();
      ctx.arc(x, yT, isSelected ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();

      // Libellé (uniquement si visible)
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

      // Hitbox
      hitboxesRef.current.push({
        type: 'rect',
        x: x - 8,
        y: yT - 16,
        w: labelW,
        h: 36,
        evt
      });
    });

    // 5. BORNES EXTRÊMES (ORIGINE ET AUJOURD'HUI)
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

    // 6. MINIMAP BASSE
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

    const availableH = isSplitViewOpen ? totalH * 0.5 : totalH;

    canvasMainRef.current.width = totalW;
    canvasMainRef.current.height = Math.max(100, availableH - MINI_HEIGHT);

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
        data.forEach(item => {
          if (Array.isArray(item.tags)) item.tags.forEach(t => extractedTags.add(t));
          else if (item.categorie) extractedTags.add(item.categorie);
        });
        const list = Array.from(extractedTags);
        setAvailableTags(list);
        setSelectedTags(list);
      }
    }
    chargerEvenements();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateSizesAndDraw);
    updateSizesAndDraw();
    return () => window.removeEventListener('resize', updateSizesAndDraw);
  }, [isSplitViewOpen]);

  useEffect(() => {
    drawScene();
  }, [viewRange, events, selectedTags, customSelectedIds, filterMode, selectedEvent, splitEvent, isSplitViewOpen, currentTheme]);

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

      const hit = hitboxesRef.current.find(h => {
        if (h.type === 'circle') {
          return Math.hypot(cx - h.x, cy - h.y) <= h.r;
        } else if (h.type === 'rect') {
          return cx >= h.x && cx <= h.x + h.w && cy >= h.y && cy <= h.y + h.h;
        }
        return false;
      });

      if (hit) {
        setSelectedEvent(hit.evt);
        const targetX = hit.type === 'rect' ? hit.x + hit.w / 2 : hit.x;
        const targetY = hit.y;
        setPopupPos({ x: targetX, y: targetY });

        setSplitEvent(prev => (prev ? hit.evt : null));
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
        if (targetYear - targetViewRef.current.min >= 1) smoothSetView({ min: targetViewRef.current.min, max: targetYear });
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
      anneeDebut: '',
      ereDebut: 'CE',
      anneeFin: '',
      ereFin: 'CE',
      tags: [availableTags[0] || Object.keys(DEFAULT_TAG_PALETTE)[0]],
      couleur: COLOR_PRESETS[0].stroke,
      importance: 3
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditDrawer = (evt) => {
    const target = evt || selectedEvent;
    if (!target) return;
    setEditingTargetEvent(target);
    setIsEditDrawerOpen(true);
  };

  const handleOpenSplit = (evt) => {
    const target = evt || selectedEvent;
    if (!target) return;
    setSplitEvent(target);
    setIsSplitViewOpen(true);
    setSelectedEvent(null);
  };

  const handleCloseSplit = () => {
    setIsSplitViewOpen(false);
    setSplitEvent(null);
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
      if (splitEvent && splitEvent.id === evt.id) handleCloseSplit();
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
      if (splitEvent && splitEvent.id === updated.id) setSplitEvent(updated);
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

    const payload = {
      titre: formData.titre.trim(),
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
      cartes_historiques: []
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
      setIsCreateModalOpen(false);

      const centerYear = calculatedEnd ? (calculatedStart + calculatedEnd) / 2 : calculatedStart;
      const span = targetViewRef.current.max - targetViewRef.current.min;
      smoothSetView({
        min: centerYear - span / 2,
        max: centerYear + span / 2
      });
    }
  };

  const activeHeaderEvent = splitEvent || selectedEvent;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'transparent', overflow: 'hidden', userSelect: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", touchAction: 'none' }}>
      
      {/* 1. Knowledge Split View */}
      <KnowledgeSplitView
        isOpen={isSplitViewOpen}
        onClose={handleCloseSplit}
        event={splitEvent}
      />

      {/* 2. Indicateur de date en haut à gauche */}
      <div
        style={{
          position: 'absolute',
          top: isSplitViewOpen ? 'calc(50vh + 14px)' : 16,
          left: 18,
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

      {/* 3. Barre d'outils centrée */}
      <div style={{
        position: 'absolute',
        top: isSplitViewOpen ? 'calc(50% + 12px)' : 14,
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
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          style={{
            padding: '6px 12px',
            backgroundColor: isFilterOpen ? (currentTheme === 'light' ? '#e4e4e7' : '#334155') : (currentTheme === 'light' ? '#f4f4f5' : '#1e293b'),
            color: currentTheme === 'light' ? '#18181b' : '#f8fafc',
            border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Filtres
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
                if (isSplitViewOpen) handleCloseSplit();
                else handleOpenSplit(selectedEvent);
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: isSplitViewOpen ? '#0284c7' : (currentTheme === 'light' ? '#f4f4f5' : '#1e293b'),
                color: isSplitViewOpen ? '#ffffff' : '#0284c7',
                border: currentTheme === 'light' ? '1px solid #e4e4e7' : '1px solid #334155',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSplitViewOpen ? '✕' : 'Détails'}
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

      {/* Volet filtres */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
        onSelectAllTags={() => setSelectedTags(availableTags)}
        onDeselectAllTags={() => setSelectedTags([])}
        events={events}
        searchedEvents={events.filter(e => e.titre.toLowerCase().includes(searchQuery.toLowerCase()))}
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
      />

      {/* Pop-up aperçu rapide */}
      <EventPopup
        event={selectedEvent}
        position={popupPos}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleOpenEditDrawer}
        onDelete={handleDeleteEvent}
        onDeepDive={() => handleOpenSplit(selectedEvent)}
      />

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
      />

      {/* Volet latéral droit d'édition */}
      <EventEditDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        event={editingTargetEvent}
        onSave={handleSaveFromDrawer}
        onDelete={handleDeleteEvent}
        availableTags={availableTags}
        onToggleTag={() => {}}
      />

      {/* Zone Canvas frise principale */}
      <div style={{
        position: 'absolute',
        bottom: 70,
        left: 0,
        width: '100%',
        height: isSplitViewOpen ? 'calc(50% - 70px)' : 'calc(100% - 70px)',
        cursor: 'grab',
        touchAction: 'none',
        transition: 'height 0.25s ease'
      }}>
        <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Minimap basse */}
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