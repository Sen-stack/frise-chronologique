import React, { useRef, useEffect, useState } from 'react';
import { THEMES } from '../utils/themeConfig.js';
import { supabase } from '../supabase.js';
import {
  DEFAULT_TAG_PALETTE,
  COLOR_PRESETS,
  GLOBAL_MIN,
  GLOBAL_MAX,
  TIMELINE_CHAPTERS,
  yearToChapterMiniX,
  miniXToChapterYear,
  formatYear,
  getAutoPeriod
} from '../utils/timelineMath.js';
import { renderTimelineScene } from '../utils/timelineRenderer.js';

import TimelineHeader from './TimelineHeader.jsx';
import EventPopup from './EventPopup.jsx';
import FilterDrawer from './FilterDrawer.jsx';
import EventModal from './EventModal.jsx';
import KnowledgeSplitView from './KnowledgeSplitView.jsx';
import EventEditDrawer from './EventEditDrawer.jsx';
import HistoricalAtlas from './HistoricalAtlas.jsx';

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);
  const subBarRef = useRef(null);

  const [isMobileScreen, setIsMobileScreen] = useState(() => window.innerWidth < 768);
  const [activeChapter, setActiveChapter] = useState('histoire');
  const [viewRange, setViewRange] = useState({ min: -3500, max: 2026 });
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

  const [availableTags, setAvailableTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [newTagInput, setNewTagInput] = useState('');

  const [availableGroups, setAvailableGroups] = useState([]);
  const [newGroupInput, setNewGroupInput] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [customSelectedIds, setCustomSelectedIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState('tags');
  const [searchQuery, setSearchQuery] = useState('');

  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isAtlasOpen, setIsAtlasOpen] = useState(true);
  const [isReliefActive, setIsReliefActive] = useState(false);
  const [recalibrateTrigger, setRecalibrateTrigger] = useState(0);

  const [drawingTerritoryEvent, setDrawingTerritoryEvent] = useState(null);
  const [drawUiState, setDrawUiState] = useState({
    shapesCount: 0,
    canValidateShape: false,
    canUndo: false,
    canClear: false,
    linksCount: 0,
    isAddingLink: false,
    isSaving: false,
    actions: null
  });

  const [mapLayers, setMapLayers] = useState({
    worldEmpires: true,
    subDivisions: true,
    tradeRoutes: false,
    markers: true
  });

  const handleToggleMapLayer = (layerKey) => {
    setMapLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const [atlasFocusedEvent, setAtlasFocusedEvent] = useState(null);
  const [timelineCursorYear, setTimelineCursorYear] = useState(200);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState(null);

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTargetEvent, setEditingTargetEvent] = useState(null);

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

  const targetViewRef = useRef({ min: -3500, max: 2026 });
  const animFrameRef = useRef(null);

  const activeChapterRef = useRef(activeChapter);
  useEffect(() => { activeChapterRef.current = activeChapter; }, [activeChapter]);

  const cursorYearRef = useRef(timelineCursorYear);
  useEffect(() => { cursorYearRef.current = timelineCursorYear; }, [timelineCursorYear]);

  const getActiveBounds = () => {
    const chapter = TIMELINE_CHAPTERS.find(c => c.id === activeChapterRef.current);
    return chapter ? { min: chapter.min, max: chapter.max } : { min: GLOBAL_MIN, max: GLOBAL_MAX };
  };

  const updateInertia = () => {
    const cur = viewRef.current;
    const tgt = targetViewRef.current;
    const diffMin = tgt.min - cur.min;
    const diffMax = tgt.max - cur.max;

    if (Math.abs(diffMin) > 0.05 || Math.abs(diffMax) > 0.05) {
      setViewRange({ min: cur.min + diffMin * 0.18, max: cur.max + diffMax * 0.18 });
      animFrameRef.current = requestAnimationFrame(updateInertia);
    } else {
      setViewRange({ min: tgt.min, max: tgt.max });
      animFrameRef.current = null;
    }
  };

  const smoothSetView = (nextTgt) => {
    const bounds = getActiveBounds();
    const span = nextTgt.max - nextTgt.min;
    const margin = span * 0.5;
    const minAllowed = bounds.min - margin;
    const maxAllowed = bounds.max + margin;

    if (nextTgt.min < minAllowed) nextTgt = { min: minAllowed, max: minAllowed + span };
    if (nextTgt.max > maxAllowed) nextTgt = { min: maxAllowed - span, max: maxAllowed };

    targetViewRef.current = nextTgt;
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(updateInertia);
    }
  };

  const handleSelectChapter = (chapterId) => {
    const chapter = TIMELINE_CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return;
    setActiveChapter(chapterId);
    activeChapterRef.current = chapterId;
    setSelectedEvent(null);
    targetViewRef.current = chapter.defaultView;
    setViewRange(chapter.defaultView);

    const initCursor = Math.round((chapter.defaultView.min + chapter.defaultView.max) / 2);
    setTimelineCursorYear(initCursor);
    cursorYearRef.current = initCursor;
  };

  const handleResetToFullChapterView = () => {
    const chapter = TIMELINE_CHAPTERS.find(c => c.id === activeChapterRef.current);
    if (chapter) smoothSetView(chapter.defaultView);
  };

  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

  const filterRef = useRef({ mode: filterMode, tags: selectedTags, groups: selectedGroups, customIds: customSelectedIds });
  useEffect(() => {
    filterRef.current = { mode: filterMode, tags: selectedTags, groups: selectedGroups, customIds: customSelectedIds };
  }, [filterMode, selectedTags, selectedGroups, customSelectedIds]);

  const hitboxesRef = useRef([]);

  const drawScene = () => {
    renderTimelineScene({
      cMain: canvasMainRef.current,
      cMini: canvasMiniRef.current,
      currentBounds: getActiveBounds(),
      viewRange: viewRef.current,
      allEvents: eventsRef.current,
      activeFilter: filterRef.current,
      selectedEvent,
      drawerEvent,
      cursorYear: cursorYearRef.current,
      activeChapter,
      hitboxesRef
    });
  };

  const HEADER_H = isMobileScreen ? 86 : 56;

  const updateSizesAndDraw = () => {
    setIsMobileScreen(window.innerWidth < 768);
    if (!canvasMainRef.current || !canvasMiniRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const totalW = window.innerWidth;
    const totalH = window.innerHeight;
    const currentHeaderH = totalW < 768 ? 86 : 56;
    const subBarH = subBarRef.current ? subBarRef.current.offsetHeight : 0;

    const availableAreaH = totalH - currentHeaderH - subBarH;
    const actualRatio = isAtlasOpen ? splitRatio : 0;
    const atlasH = Math.round(availableAreaH * actualRatio);
    const timelineAreaH = availableAreaH - atlasH;
    const mainH = Math.max(80, timelineAreaH - 74);

    canvasMainRef.current.width = Math.round(totalW * dpr);
    canvasMainRef.current.height = Math.round(mainH * dpr);

    const miniRect = canvasMiniRef.current.getBoundingClientRect();
    const miniW = miniRect.width || Math.min(980, Math.round(totalW * 0.92));
    canvasMiniRef.current.width = Math.round(miniW * dpr);
    canvasMiniRef.current.height = Math.round(56 * dpr);

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

  useEffect(() => { updateSizesAndDraw(); }, [isAtlasOpen, splitRatio, drawingTerritoryEvent, drawUiState.isAddingLink]);
  useEffect(() => {
    window.addEventListener('resize', updateSizesAndDraw);
    return () => window.removeEventListener('resize', updateSizesAndDraw);
  }, [isAtlasOpen, splitRatio, drawingTerritoryEvent]);
  useEffect(() => { drawScene(); }, [viewRange, events, selectedTags, selectedGroups, customSelectedIds, filterMode, selectedEvent, drawerEvent, isAtlasOpen, splitRatio, timelineCursorYear, currentTheme, activeChapter]);

  // GESTION SOURIS / TACTILE DES CANVAS
  useEffect(() => {
    const cMain = canvasMainRef.current;
    const cMini = canvasMiniRef.current;
    if (!cMain || !cMini) return;

    let isMainDragging = false;
    let isCursorDragging = false;
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
      const rect = cMain.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const span = vMax - vMin;
      const curX = ((cursorYearRef.current - vMin) / span) * cMain.clientWidth;

      if (Math.abs(clickX - curX) <= 24) {
        isCursorDragging = true;
        return;
      }
      isMainDragging = true;
      dragStartX = e.clientX;
      dragStartMin = targetViewRef.current.min;
      dragStartMax = targetViewRef.current.max;
    };

    const onMainMouseMove = (e) => {
      const rect = cMain.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const span = vMax - vMin;
      const curX = ((cursorYearRef.current - vMin) / span) * cMain.clientWidth;

      if (!isMainDragging && !isCursorDragging) {
        cMain.style.cursor = Math.abs(currentX - curX) <= 24 ? 'ew-resize' : 'grab';
      }

      if (isCursorDragging) {
        const bounds = getActiveBounds();
        const ratio = Math.max(0, Math.min(1, currentX / cMain.clientWidth));
        const clampedYear = Math.max(bounds.min, Math.min(bounds.max, Math.round(vMin + ratio * span)));
        setTimelineCursorYear(clampedYear);
        cursorYearRef.current = clampedYear;
        return;
      }

      if (!isMainDragging) return;
      const dx = e.clientX - dragStartX;
      const shift = (dx / cMain.clientWidth) * span;
      smoothSetView({ min: dragStartMin - shift, max: dragStartMax - shift });
    };

    const onMainWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const span = vMax - vMin;
      const mouseYear = vMin + (e.clientX / cMain.clientWidth) * span;

      const bounds = getActiveBounds();
      const maxSpan = Math.max((bounds.max - bounds.min) * 2.2, 13000);

      let nMin = mouseYear + (vMin - mouseYear) * factor;
      let nMax = mouseYear + (vMax - mouseYear) * factor;
      if (nMax - nMin > maxSpan) {
        const ratio = (mouseYear - vMin) / span;
        nMin = mouseYear - maxSpan * ratio;
        nMax = mouseYear + maxSpan * (1 - ratio);
      }
      if (nMax - nMin > 1) smoothSetView({ min: nMin, max: nMax });
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        const rect = cMain.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const { min: vMin, max: vMax } = targetViewRef.current;
        const span = vMax - vMin;
        const curX = ((cursorYearRef.current - vMin) / span) * cMain.clientWidth;

        if (Math.abs(touchX - curX) <= 30) {
          isCursorDragging = true;
          return;
        }
        isMainDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartMin = targetViewRef.current.min;
        dragStartMax = targetViewRef.current.max;
        touchStartDist = null;
      } else if (e.touches.length === 2) {
        isMainDragging = false;
        isCursorDragging = false;
        const x1 = e.touches[0].clientX;
        const x2 = e.touches[1].clientX;
        touchStartDist = Math.hypot(x1 - x2, e.touches[0].clientY - e.touches[1].clientY);

        const { min: vMin, max: vMax } = targetViewRef.current;
        touchStartSpan = vMax - vMin;
        touchStartCenterYear = vMin + (((x1 + x2) / 2) / cMain.clientWidth) * touchStartSpan;
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isCursorDragging) {
        const rect = cMain.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const { min: vMin, max: vMax } = targetViewRef.current;
        const span = vMax - vMin;
        const bounds = getActiveBounds();
        const ratio = Math.max(0, Math.min(1, touchX / cMain.clientWidth));
        const clampedYear = Math.max(bounds.min, Math.min(bounds.max, Math.round(vMin + ratio * span)));
        setTimelineCursorYear(clampedYear);
        cursorYearRef.current = clampedYear;
        return;
      }

      if (e.touches.length === 1 && isMainDragging) {
        const dx = e.touches[0].clientX - dragStartX;
        const shift = (dx / cMain.clientWidth) * (dragStartMax - dragStartMin);
        smoothSetView({ min: dragStartMin - shift, max: dragStartMax - shift });
      } else if (e.touches.length === 2 && touchStartDist) {
        const x1 = e.touches[0].clientX;
        const x2 = e.touches[1].clientX;
        const currentDist = Math.hypot(x1 - x2, e.touches[0].clientY - e.touches[1].clientY);
        if (currentDist > 0) {
          const bounds = getActiveBounds();
          const maxSpan = Math.max((bounds.max - bounds.min) * 2.2, 13000);
          const nextSpan = Math.min(maxSpan, Math.max(1, touchStartSpan * (touchStartDist / currentDist)));
          const ratio = ((x1 + x2) / 2) / cMain.clientWidth;
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
        isCursorDragging = false;
        touchStartDist = null;
      } else if (e.touches.length === 1) {
        isMainDragging = true;
        isCursorDragging = false;
        dragStartX = e.touches[0].clientX;
        dragStartMin = targetViewRef.current.min;
        dragStartMax = targetViewRef.current.max;
        touchStartDist = null;
      }
    };

    const onMainClick = (e) => {
      if (isCursorDragging) return;
      const rect = cMain.getBoundingClientRect();
      const cx = (e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - rect.left;
      const cy = (e.clientY || (e.changedTouches && e.changedTouches[0].clientY)) - rect.top;

      const hit = [...hitboxesRef.current].reverse().find(h =>
        h.type === 'circle'
          ? Math.hypot(cx - h.x, cy - h.y) <= h.r
          : (cx >= h.x && cx <= h.x + h.w && cy >= h.y && cy <= h.y + h.h)
      );

      if (hit) {
        setSelectedEvent(hit.evt);
        setAtlasFocusedEvent(hit.evt);
        setPopupPos({ x: hit.type === 'rect' ? hit.x + hit.w / 2 : hit.x, y: hit.y });
        if (isDrawerOpen) setDrawerEvent(hit.evt);
        if (isEditDrawerOpen) setEditingTargetEvent(hit.evt);
      } else {
        setSelectedEvent(null);
      }
    };

    const onMiniStart = (clientX) => {
      const mw = cMini.clientWidth;
      const cx = clientX - cMini.getBoundingClientRect().left;
      const chId = activeChapterRef.current;
      const { min: vMin, max: vMax } = targetViewRef.current;
      const vx1 = yearToChapterMiniX(vMin, mw, chId);
      const vx2 = yearToChapterMiniX(vMax, mw, chId);
      const left = Math.min(vx1, vx2);
      const right = Math.max(vx1, vx2);

      miniDragStartX = cx;
      miniStartMin = vMin;
      miniStartMax = vMax;

      if (Math.abs(cx - left) <= 16) miniMode = 'left';
      else if (Math.abs(cx - right) <= 16) miniMode = 'right';
      else if (cx > left && cx < right) miniMode = 'move';
      else {
        const clickedYear = miniXToChapterYear(cx, mw, chId);
        const currentSpan = vMax - vMin;
        smoothSetView({ min: clickedYear - currentSpan / 2, max: clickedYear + currentSpan / 2 });
        miniMode = 'move';
      }
    };

    const onMiniMove = (clientX) => {
      const mw = cMini.clientWidth;
      const cx = clientX - cMini.getBoundingClientRect().left;
      const chId = activeChapterRef.current;
      const targetYear = miniXToChapterYear(cx, mw, chId);

      if (miniMode === 'move') {
        const shift = targetYear - miniXToChapterYear(miniDragStartX, mw, chId);
        smoothSetView({ min: miniStartMin + shift, max: miniStartMax + shift });
      } else if (miniMode === 'left' && targetViewRef.current.max - targetYear >= 5) {
        smoothSetView({ min: targetYear, max: targetViewRef.current.max });
      } else if (miniMode === 'right' && targetYear - targetViewRef.current.min >= 5) {
        smoothSetView({ min: targetViewRef.current.min, max: targetYear });
      }
    };

    const onMiniMouseDown = (e) => onMiniStart(e.clientX);
    const onMiniMouseMove = (e) => { if (miniMode) onMiniMove(e.clientX); };
    const onMiniTouchStart = (e) => { if (e.touches.length > 0) onMiniStart(e.touches[0].clientX); };
    const onMiniTouchMove = (e) => { e.preventDefault(); if (miniMode && e.touches.length > 0) onMiniMove(e.touches[0].clientX); };
    const onEnd = () => { isMainDragging = false; isCursorDragging = false; miniMode = null; };

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
  }, [isEditDrawerOpen, activeChapter]);

  // ACTIONS SUPABASE & MODALES
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
    const target = evt || selectedEvent || drawerEvent;
    if (target) { setEditingTargetEvent(target); setIsEditDrawerOpen(true); }
  };

  const handleOpenDrawer = (evt) => {
    const target = evt || selectedEvent;
    if (target) { setDrawerEvent(target); setAtlasFocusedEvent(target); setIsDrawerOpen(true); setSelectedEvent(null); }
  };

  const handleDeleteEvent = async (evt) => {
    if (!evt || !window.confirm(`Voulez-vous vraiment supprimer "${evt.titre}" ?`)) return;
    const { error } = await supabase.from('evenements').delete().eq('id', evt.id);
    if (error) alert("Erreur de suppression : " + error.message);
    else {
      setEvents(prev => prev.filter(e => e.id !== evt.id));
      setSelectedEvent(null);
      if (drawerEvent?.id === evt.id) { setIsDrawerOpen(false); setDrawerEvent(null); }
      if (editingTargetEvent?.id === evt.id) setIsEditDrawerOpen(false);
    }
  };

  const handleSaveFromDrawer = async (eventId, payload) => {
    const { data, error } = await supabase.from('evenements').update(payload).eq('id', eventId).select();
    if (error) alert("Erreur de modification : " + error.message);
    else if (data?.[0]) {
      const updated = data[0];
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedEvent(updated);
      if (drawerEvent?.id === updated.id) setDrawerEvent(updated);
      setIsEditDrawerOpen(false);
    }
  };

  const handleStartDrawTerritory = (evt) => {
    const target = evt || selectedEvent || drawerEvent;
    if (!target) return;
    if (drawingTerritoryEvent?.id === target.id) { setDrawingTerritoryEvent(null); return; }
    if (!isAtlasOpen) { setIsAtlasOpen(true); setSplitRatio(0.5); }
    setSelectedEvent(null);
    setIsDrawerOpen(false);
    setDrawingTerritoryEvent(target);
  };

  const handleSaveTerritory = async (eventId, geojsonPayload) => {
    const { data, error } = await supabase.from('evenements').update({ zone_geojson: geojsonPayload }).eq('id', eventId).select();
    if (error) alert("Erreur de sauvegarde du territoire : " + error.message);
    else if (data?.[0]) {
      const updated = data[0];
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      if (drawerEvent?.id === updated.id) setDrawerEvent(updated);
      if (selectedEvent?.id === updated.id) setSelectedEvent(updated);
      setDrawingTerritoryEvent(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.titre.trim()) return setFormError('Le titre est obligatoire.');

    const startVal = Number(formData.anneeDebut);
    if (isNaN(startVal) || formData.anneeDebut === '') return setFormError('L’année de début doit être un nombre valide.');
    const calculatedStart = formData.ereDebut === 'BCE' ? -Math.abs(startVal) : startVal;

    let calculatedEnd = null;
    if (isRange) {
      const endVal = Number(formData.anneeFin);
      if (isNaN(endVal) || formData.anneeFin === '') return setFormError('L’année de fin doit être un nombre valide.');
      calculatedEnd = formData.ereFin === 'BCE' ? -Math.abs(endVal) : endVal;
      if (calculatedEnd <= calculatedStart) return setFormError('L’année de fin doit être strictement après l’année de début.');
    }

    setIsSubmitting(true);
    const chosenTags = formData.tags.length > 0 ? formData.tags : ["Général"];
    const chosenGroup = formData.groupe_id ? formData.groupe_id.trim() : null;

    const payload = {
      titre: formData.titre.trim(),
      groupe_id: chosenGroup,
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      tags: chosenTags,
      categorie: chosenTags[0],
      periode: getAutoPeriod(calculatedStart),
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

    const { data, error } = await supabase.from('evenements').insert([payload]).select();
    setIsSubmitting(false);

    if (error) setFormError('Erreur d’enregistrement : ' + error.message);
    else if (data?.[0]) {
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
      smoothSetView({ min: centerYear - span / 2, max: centerYear + span / 2 });
    }
  };

  const handleSelectEventFromAtlas = (evt) => {
    if (!evt) return;
    setSelectedEvent(evt);
    setAtlasFocusedEvent(evt);
    if (isDrawerOpen) setDrawerEvent(evt);
    if (isEditDrawerOpen) setEditingTargetEvent(evt);

    const isPeriod = evt.date_fin !== null && evt.date_fin !== undefined && evt.date_fin !== '';
    const centerYear = isPeriod ? (evt.date_debut + evt.date_fin) / 2 : evt.date_debut;
    setPopupPos({ x: window.innerWidth / 2, y: 120 });

    if (centerYear < viewRef.current.min || centerYear > viewRef.current.max) {
      const span = targetViewRef.current.max - targetViewRef.current.min;
      smoothSetView({ min: centerYear - span / 2, max: centerYear + span / 2 });
    }
  };

  const activeSelection = selectedEvent || drawerEvent || drawingTerritoryEvent;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#eaf0f6',
      overflow: 'hidden',
      userSelect: 'none',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      touchAction: 'none',
      display: 'flex',
      flexDirection: 'column'
    }}>

      <TimelineHeader
        headerHeight={HEADER_H}
        isMobileScreen={isMobileScreen}
        activeChapter={activeChapter}
        onSelectChapter={handleSelectChapter}
        onResetFullView={handleResetToFullChapterView}
        onOpenCreateModal={handleOpenCreateModal}
        activeSelection={activeSelection}
        onOpenEditDrawer={handleOpenEditDrawer}
        onStartDrawTerritory={handleStartDrawTerritory}
        onDeleteEvent={handleDeleteEvent}
        drawingTerritoryEvent={drawingTerritoryEvent}
        onCancelDrawing={() => setDrawingTerritoryEvent(null)}
        drawUiState={drawUiState}
        subBarRef={subBarRef}
        isReliefActive={isReliefActive}
        onToggleRelief={() => setIsReliefActive(prev => !prev)}
        onRecalibrate={() => setRecalibrateTrigger(t => t + 1)}
        isAtlasOpen={isAtlasOpen}
        onToggleAtlas={() => setIsAtlasOpen(prev => {
          const nextState = !prev;
          if (nextState) setSplitRatio(0.5);
          return nextState;
        })}
      />

      {/* ZONE CENTRALE */}
      <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>

        {isAtlasOpen && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${Math.round(splitRatio * 100)}%`,
              borderBottom: '1px solid rgba(166, 180, 200, 0.4)',
              backgroundColor: '#0f172a',
              zIndex: 10,
              overflow: 'hidden'
            }}
          >
            <HistoricalAtlas
              viewRange={viewRange}
              targetDate={timelineCursorYear}
              events={events}
              selectedEvent={atlasFocusedEvent || drawerEvent || selectedEvent}
              onSelectEvent={handleSelectEventFromAtlas}
              onOpenDrawer={(evt) => handleOpenDrawer(evt)}
              onMapYearChange={() => {}}
              mapLayers={mapLayers}
              isReliefProp={isReliefActive}
              recalibrateTrigger={recalibrateTrigger}
              drawingEvent={drawingTerritoryEvent}
              onSaveTerritory={handleSaveTerritory}
              onCancelDrawing={() => setDrawingTerritoryEvent(null)}
              onDrawUiStateChange={setDrawUiState}
            />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: isAtlasOpen ? `calc(${Math.round(splitRatio * 100)}% + 6px)` : 6,
            left: 12,
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#71717a' }}>
            Période
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
              {formatYear(viewRange.min)}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>—</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
              {formatYear(viewRange.max)}
            </span>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: isAtlasOpen ? `${Math.round(splitRatio * 100)}%` : 0,
          left: 0,
          width: '100%',
          height: isAtlasOpen ? `${100 - Math.round(splitRatio * 100)}%` : '100%',
          cursor: 'grab',
          touchAction: 'none'
        }}>
          <div style={{ width: '100%', height: 'calc(100% - 74px)' }}>
            <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: 980,
            height: 56,
            backgroundColor: '#1e232d',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 28,
            boxShadow: '0 10px 24px rgba(166, 180, 200, 0.45)',
            overflow: 'hidden',
            cursor: 'pointer',
            touchAction: 'none',
            zIndex: 15
          }}>
            <canvas ref={canvasMiniRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>

      </div>

      <KnowledgeSplitView
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setDrawerEvent(null); }}
        event={drawerEvent}
        onStartDrawTerritory={handleStartDrawTerritory}
        onDeleteTerritory={(evt) => evt && handleSaveTerritory(evt.id, null)}
      />

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
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        })}
        onSelectAllCustom={() => setCustomSelectedIds(new Set(events.map(e => e.id)))}
        onDeselectAllCustom={() => setCustomSelectedIds(new Set())}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        mapLayers={mapLayers}
        onToggleMapLayer={handleToggleMapLayer}
      />

      {selectedEvent && (() => {
        const span = viewRange.max - viewRange.min;
        if (span <= 0) return null;

        const isPeriod = selectedEvent.date_fin !== null && selectedEvent.date_fin !== undefined;
        const targetYear = isPeriod 
          ? (Math.max(viewRange.min, selectedEvent.date_debut) + Math.min(viewRange.max, selectedEvent.date_fin)) / 2 
          : selectedEvent.date_debut;

        const dynamicX = ((targetYear - viewRange.min) / span) * window.innerWidth;
        const subBarH = subBarRef.current ? subBarRef.current.offsetHeight : 0;
        const actualAtlasH = isAtlasOpen ? Math.round((window.innerHeight - HEADER_H - subBarH) * splitRatio) : 0;
        const absoluteTargetY = HEADER_H + subBarH + actualAtlasH + popupPos.y;

        if ((selectedEvent.date_fin ?? selectedEvent.date_debut) < viewRange.min || selectedEvent.date_debut > viewRange.max) {
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

    </div>
  );
}