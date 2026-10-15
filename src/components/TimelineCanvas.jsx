import React, { useRef, useEffect, useState } from 'react';
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

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);

  const [viewRange, setViewRange] = useState({ min: -1000, max: 2026 });
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

  // Mode Split View (Approfondissement)
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);

  // Formulaire d'ajout / modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
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
    importance: 3,
    description: '',
    latitude: '',
    longitude: '',
    cartesHistoriques: []
  });

  const viewRef = useRef(viewRange);
  useEffect(() => { viewRef.current = viewRange; }, [viewRange]);

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

  // Dessin de la scène (Canvas)
  const drawScene = () => {
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

    const barY = h * 0.62;
    const barTop = barY - BAR_HEIGHT / 2;
    const barBottom = barY + BAR_HEIGHT / 2;

    const xStart = yearToX(GLOBAL_MIN);
    const xEnd = yearToX(GLOBAL_MAX);

    const visibleBarX1 = Math.max(-50, xStart);
    const visibleBarX2 = Math.min(w + 50, xEnd);
    const barWidth = Math.max(0, visibleBarX2 - visibleBarX1);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(visibleBarX1, barTop, barWidth, BAR_HEIGHT);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(visibleBarX1, barTop, barWidth, BAR_HEIGHT);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(visibleBarX1, barY);
    ctx.lineTo(visibleBarX2, barY);
    ctx.stroke();

    const interval = getTickInterval(span);
    const firstTick = Math.ceil(vMin / interval) * interval;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    for (let t = firstTick; t <= vMax; t += interval) {
      if (t < GLOBAL_MIN || t > GLOBAL_MAX) continue;
      const tx = yearToX(t);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, barBottom);
      ctx.lineTo(tx, barBottom + 7);
      ctx.stroke();
      ctx.fillText(formatYear(t), tx, barBottom + 20);
    }

    const allEvents = eventsRef.current || [];
    const activeFilter = filterRef.current;

    const filteredList = allEvents.filter(evt => {
      if (activeFilter.mode === 'custom') {
        return activeFilter.customIds.has(evt.id);
      }
      const itemTags = Array.isArray(evt.tags) && evt.tags.length > 0 ? evt.tags : [evt.categorie || "Sans tag"];
      return itemTags.some(tag => activeFilter.tags.includes(tag));
    });

    const periodes = filteredList.filter(e => e.date_fin !== null && e.date_fin !== undefined && e.date_fin !== '');
    const ponctuels = filteredList.filter(e => !e.date_fin);

    // Dessin des périodes
    periodes.forEach((p, idx) => {
      const x1 = yearToX(p.date_debut);
      const x2 = yearToX(p.date_fin);
      const rX = Math.min(x1, x2);
      const rW = Math.max(4, Math.abs(x2 - x1));

      if (rX + rW < -100 || rX > w + 100) return;

      const style = getItemStyle(p);
      const trackHeight = (BAR_HEIGHT - 6) / 2;
      const trackY = (idx % 2 === 0) ? barTop + 3 : barTop + 3 + trackHeight;

      const isSelected = selectedEvent && selectedEvent.id === p.id;

      ctx.fillStyle = isSelected ? style.stroke : style.fill;
      ctx.fillRect(rX, trackY, rW, trackHeight);
      ctx.strokeStyle = isSelected ? '#ffffff' : style.stroke;
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.strokeRect(rX, trackY, rW, trackHeight);

      if (rW > 35) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rX + 2, trackY, rW - 4, trackHeight);
        ctx.clip();
        ctx.fillStyle = isSelected ? '#020617' : '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.titre, rX + 6, trackY + trackHeight / 2);
        ctx.restore();
      }

      hitboxesRef.current.push({ type: 'rect', x: rX, y: trackY, w: rW, h: trackHeight, evt: p });
    });

    // Dessin des ponctuels
    ponctuels.forEach((evt, index) => {
      const x = yearToX(evt.date_debut);
      if (x < -200 || x > w + 200) return;

      const titreTexte = String(evt.titre || 'Sans titre');
      const decalageY = 30 + (index % 3) * 35;
      const yT = barTop - decalageY;

      const style = getItemStyle(evt);
      const isSelected = selectedEvent && selectedEvent.id === evt.id;

      ctx.strokeStyle = isSelected ? '#ffffff' : style.stroke;
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, barTop);
      ctx.lineTo(x, yT);
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#ffffff' : style.stroke;
      ctx.beginPath();
      ctx.arc(x, yT, isSelected ? 6 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = isSelected ? 'bold 13px sans-serif' : 'bold 12px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const textW = ctx.measureText(titreTexte).width;

      ctx.fillStyle = isSelected ? style.stroke : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 8, yT - 10, textW + 8, 20);

      ctx.fillStyle = isSelected ? '#020617' : '#ffffff';
      ctx.fillText(titreTexte, x + 12, yT);

      hitboxesRef.current.push({ type: 'circle', x, y: yT, r: 14, evt });
    });

    // Dessin de la minimap
    mctx.fillStyle = '#020617';
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
      mctx.font = '10px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText(seg.nom, currentX + segWidth / 2, 23);
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

    mctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    mctx.fillRect(left, 4, bWidth, 42);
    mctx.strokeStyle = '#38bdf8';
    mctx.lineWidth = 2;
    mctx.strokeRect(left, 4, bWidth, 42);

    mctx.fillStyle = '#ffffff';
    mctx.fillRect(left, 6, 4, 38);
    mctx.fillRect(left + bWidth - 4, 6, 4, 38);

    mctx.fillStyle = '#94a3b8';
    mctx.font = '10px sans-serif';
    mctx.textAlign = 'left';
    mctx.fillText("-4.5 Ga", MINI_PAD, 60);
    mctx.textAlign = 'right';
    mctx.fillText("2026", mw - MINI_PAD, 60);
  };

  const updateSizesAndDraw = () => {
    if (!canvasMainRef.current || !canvasMiniRef.current) return;
    const totalW = window.innerWidth;
    const totalH = window.innerHeight;

    // Si Split View est ouvert, la frise occupe les 50 % inférieurs
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
  }, [viewRange, events, selectedTags, customSelectedIds, filterMode, selectedEvent, isSplitViewOpen]);

  // Gestion des interactions de navigation (drag & zoom)
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

    const onMainMouseDown = (e) => {
      isMainDragging = true;
      dragStartX = e.clientX;
      dragStartMin = viewRef.current.min;
      dragStartMax = viewRef.current.max;
    };

    const onMainMouseMove = (e) => {
      if (!isMainDragging) return;
      const dx = e.clientX - dragStartX;
      const span = dragStartMax - dragStartMin;
      const shift = (dx / cMain.width) * span;
      setViewRange({ min: dragStartMin - shift, max: dragStartMax - shift });
    };

    const onMainWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const { min: vMin, max: vMax } = viewRef.current;
      const span = vMax - vMin;
      const mouseYear = vMin + (e.clientX / cMain.width) * span;

      const nMin = mouseYear + (vMin - mouseYear) * factor;
      const nMax = mouseYear + (vMax - mouseYear) * factor;
      if (nMax - nMin > 1) {
        setViewRange({ min: nMin, max: nMax });
      }
    };

    const onMainClick = (e) => {
      const rect = cMain.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

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
      } else {
        setSelectedEvent(null);
      }
    };

    const onMiniMouseDown = (e) => {
      const mw = cMini.width;
      const clickX = e.clientX;
      const { min: vMin, max: vMax } = viewRef.current;

      const vx1 = yearToMiniX(vMin, mw);
      const vx2 = yearToMiniX(vMax, mw);
      const left = Math.min(vx1, vx2);
      const right = Math.max(vx1, vx2);

      miniDragStartX = clickX;
      miniStartMin = vMin;
      miniStartMax = vMax;

      if (Math.abs(clickX - left) <= HANDLE_WIDTH) {
        miniMode = 'left';
      } else if (Math.abs(clickX - right) <= HANDLE_WIDTH) {
        miniMode = 'right';
      } else if (clickX > left && clickX < right) {
        miniMode = 'move';
      } else {
        const clickedYear = miniXToYear(clickX, mw);
        const currentSpan = vMax - vMin;
        setViewRange({ min: clickedYear - currentSpan / 2, max: clickedYear + currentSpan / 2 });
        miniMode = 'move';
      }
    };

    const onMiniMouseMove = (e) => {
      const mw = cMini.width;
      if (!miniMode) {
        const { min: vMin, max: vMax } = viewRef.current;
        const left = Math.min(yearToMiniX(vMin, mw), yearToMiniX(vMax, mw));
        const right = Math.max(yearToMiniX(vMin, mw), yearToMiniX(vMax, mw));
        if (Math.abs(e.clientX - left) <= HANDLE_WIDTH || Math.abs(e.clientX - right) <= HANDLE_WIDTH) {
          cMini.style.cursor = 'ew-resize';
        } else if (e.clientX > left && e.clientX < right) {
          cMini.style.cursor = 'grab';
        } else {
          cMini.style.cursor = 'pointer';
        }
        return;
      }

      const targetYear = miniXToYear(e.clientX, mw);
      if (miniMode === 'move') {
        const startYear = miniXToYear(miniDragStartX, mw);
        const shift = targetYear - startYear;
        setViewRange({ min: miniStartMin + shift, max: miniStartMax + shift });
      } else if (miniMode === 'left') {
        if (viewRef.current.max - targetYear >= 1) setViewRange(v => ({ ...v, min: targetYear }));
      } else if (miniMode === 'right') {
        if (targetYear - viewRef.current.min >= 1) setViewRange(v => ({ ...v, max: targetYear }));
      }
    };

    const onMouseUp = () => {
      isMainDragging = false;
      miniMode = null;
    };

    cMain.addEventListener('mousedown', onMainMouseDown);
    window.addEventListener('mousemove', onMainMouseMove);
    cMain.addEventListener('wheel', onMainWheel, { passive: false });
    cMain.addEventListener('click', onMainClick);

    cMini.addEventListener('mousedown', onMiniMouseDown);
    window.addEventListener('mousemove', onMiniMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cMain.removeEventListener('mousedown', onMainMouseDown);
      window.removeEventListener('mousemove', onMainMouseMove);
      cMain.removeEventListener('wheel', onMainWheel);
      cMain.removeEventListener('click', onMainClick);
      cMini.removeEventListener('mousedown', onMiniMouseDown);
      window.removeEventListener('mousemove', onMiniMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Ouverture modale d'ajout
  const handleOpenCreateModal = () => {
    setEditingEventId(null);
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
      importance: 3,
      description: '',
      latitude: '',
      longitude: '',
      cartesHistoriques: []
    });
    setIsModalOpen(true);
  };

  // Ouverture modale d'édition
  const handleOpenEditModal = (evt) => {
    if (!evt) return;
    setEditingEventId(evt.id);
    setFormError('');

    const isEvtRange = evt.date_fin !== null && evt.date_fin !== undefined && evt.date_fin !== '';
    setIsRange(isEvtRange);

    const startAbs = Math.abs(evt.date_debut);
    const startEre = evt.date_debut < 0 ? 'BCE' : 'CE';

    let endAbs = '';
    let endEre = 'CE';
    if (isEvtRange) {
      endAbs = Math.abs(evt.date_fin);
      endEre = evt.date_fin < 0 ? 'BCE' : 'CE';
    }

    const itemTags = Array.isArray(evt.tags) && evt.tags.length > 0 ? evt.tags : [evt.categorie || "Général"];
    const style = getItemStyle(evt);

    // Récupération des cartes historiques existantes (format tableau ou rétro-compatibilité)
    let cartesList = [];
    if (Array.isArray(evt.cartes_historiques)) {
      cartesList = evt.cartes_historiques;
    } else if (evt.carte_historique_url) {
      cartesList = [{ source: 'archive', titre: evt.carte_legende || 'Carte historique', url: evt.carte_historique_url }];
    }

    setFormData({
      titre: evt.titre || '',
      anneeDebut: startAbs.toString(),
      ereDebut: startEre,
      anneeFin: endAbs.toString(),
      ereFin: endEre,
      tags: itemTags,
      couleur: evt.couleur || style.stroke,
      importance: evt.importance || 3,
      description: evt.description || '',
      latitude: evt.latitude ?? '',
      longitude: evt.longitude ?? '',
      cartesHistoriques: cartesList
    });
    setIsModalOpen(true);
  };

  // Suppression
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
      if (isSplitViewOpen) setIsSplitViewOpen(false);
    }
  };

  const handleAddNewTag = () => {
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
  };

  const toggleTagInForm = (tag) => {
    setFormData(prev => {
      const exists = prev.tags.includes(tag);
      if (exists) {
        if (prev.tags.length === 1) return prev;
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      }
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

  // Enregistrement (Création ou Mise à jour)
  const handleSubmit = async (e) => {
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

    // Rétro-compatibilité : on conserve aussi carte_historique_url de la 1ère carte
    const premiereCarte = formData.cartesHistoriques?.[0];

    const payload = {
      titre: formData.titre.trim(),
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      tags: chosenTags,
      categorie: chosenTags[0],
      periode: calculatedPeriod,
      couleur: formData.couleur || null,
      importance: Number(formData.importance),
      description: formData.description.trim() || null,
      latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
      cartes_historiques: formData.cartesHistoriques,
      carte_historique_url: premiereCarte?.url || null,
      carte_legende: premiereCarte?.titre || null
    };

    if (editingEventId) {
      const { data, error } = await supabase
        .from('evenements')
        .update(payload)
        .eq('id', editingEventId)
        .select();

      setIsSubmitting(false);

      if (error) {
        setFormError('Erreur de modification : ' + error.message);
      } else if (data && data.length > 0) {
        const updated = data[0];
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        setSelectedEvent(updated);
        setIsModalOpen(false);
      }
    } else {
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
        setIsModalOpen(false);

        const centerYear = calculatedEnd ? (calculatedStart + calculatedEnd) / 2 : calculatedStart;
        const span = viewRef.current.max - viewRef.current.min;
        setViewRange({
          min: centerYear - span / 2,
          max: centerYear + span / 2
        });
      }
    }
  };

  const toggleFilterTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleCustomEvent = (id) => {
    setCustomSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCustom = () => setCustomSelectedIds(new Set(events.map(e => e.id)));
  const deselectAllCustom = () => setCustomSelectedIds(new Set());

  const searchedEvents = events.filter(e =>
    e.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#020617', overflow: 'hidden', userSelect: 'none' }}>
      
      {/* 1. Volet supérieur (Knowledge Hub / Split View) */}
      <KnowledgeSplitView
        isOpen={isSplitViewOpen}
        onClose={() => setIsSplitViewOpen(false)}
        event={selectedEvent}
      />

      {/* 2. Barre d'outils flottante */}
      <div style={{
        position: 'absolute',
        top: isSplitViewOpen ? 'calc(50% + 12px)' : 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(51, 65, 85, 0.6)',
        borderRadius: 30,
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        color: '#f8fafc',
        transition: 'top 0.25s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, borderRight: '1px solid #334155' }}>
          <span style={{ fontSize: 14 }}>⏳</span>
          <span style={{ fontWeight: 'bold', fontSize: 12, color: '#38bdf8' }}>Chronos</span>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: isFilterOpen ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <span>🏷️</span>
          <span>Filtres</span>
        </button>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
          }}
        >
          <span style={{ fontSize: 13 }}>+</span>
          <span>Ajouter</span>
        </button>

        {selectedEvent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6, borderLeft: '1px solid #334155' }}>
            <button
              onClick={() => setIsSplitViewOpen(!isSplitViewOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                backgroundColor: isSplitViewOpen ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)',
                color: isSplitViewOpen ? '#020617' : '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>🔍</span>
              <span>{isSplitViewOpen ? 'Fermer le volet' : 'Approfondir'}</span>
            </button>

            <button
              onClick={() => handleOpenEditModal(selectedEvent)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                backgroundColor: 'rgba(234, 88, 12, 0.2)',
                color: '#fb923c',
                border: '1px solid rgba(251, 146, 60, 0.4)',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>✏️</span>
              <span>Modifier</span>
            </button>

            <button
              onClick={() => handleDeleteEvent(selectedEvent)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                backgroundColor: 'rgba(225, 29, 72, 0.2)',
                color: '#f43f5e',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>🗑️</span>
              <span>Supprimer</span>
            </button>
          </div>
        )}

        <div style={{ paddingLeft: 8, borderLeft: '1px solid #334155', fontSize: 11, color: '#94a3b8' }}>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{formatYear(viewRange.min)}</span>
          <span style={{ margin: '0 4px' }}>➔</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{formatYear(viewRange.max)}</span>
        </div>
      </div>

      {/* 3. Volet latéral de filtres */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={toggleFilterTag}
        onSelectAllTags={() => setSelectedTags(availableTags)}
        onDeselectAllTags={() => setSelectedTags([])}
        events={events}
        searchedEvents={searchedEvents}
        customSelectedIds={customSelectedIds}
        onToggleCustomEvent={toggleCustomEvent}
        onSelectAllCustom={selectAllCustom}
        onDeselectAllCustom={deselectAllCustom}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 4. Pop-up informative au clic sur un événement */}
      <EventPopup
        event={selectedEvent}
        position={popupPos}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteEvent}
        onDeepDive={() => setIsSplitViewOpen(true)}
      />

      {/* 5. Modale de saisie / modification */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={Boolean(editingEventId)}
        isSubmitting={isSubmitting}
        formError={formError}
        isRange={isRange}
        setIsRange={setIsRange}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        availableTags={availableTags}
        newTagInput={newTagInput}
        setNewTagInput={setNewTagInput}
        onAddNewTag={handleAddNewTag}
        onToggleTag={toggleTagInForm}
      />

      {/* 6. Zone Canvas (Frise chronologique dynamique) */}
      <div style={{
        position: 'absolute',
        bottom: 70,
        left: 0,
        width: '100%',
        height: isSplitViewOpen ? 'calc(50% - 70px)' : 'calc(100% - 70px)',
        cursor: 'grab',
        transition: 'height 0.25s ease'
      }}>
        <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* 7. Minimap basse */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 70,
        backgroundColor: '#020617',
        borderTop: '1px solid #1e293b',
        cursor: 'pointer',
        zIndex: 15
      }}>
        <canvas ref={canvasMiniRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

    </div>
  );
}