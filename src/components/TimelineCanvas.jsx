import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

const PERIOD_SEGMENTS = [
  { id: "cosmo", nom: "Cosmologie", start: -4500000000, end: -300000, ratio: 0.20, color: "#312e81" },
  { id: "prehist", nom: "Préhistoire", start: -300000, end: -3500, ratio: 0.16, color: "#1e3a5f" },
  { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.16, color: "#065f46" },
  { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.16, color: "#854d0e" },
  { id: "moderne", nom: "Ép. moderne", start: 1492, end: 1789, ratio: 0.16, color: "#9a3412" },
  { id: "contemp", nom: "Contemporain", start: 1789, end: 2026, ratio: 0.16, color: "#991b1b" }
];

const DEFAULT_TAG_PALETTE = {
  "Sciences & Techniques": { color: "rgba(14, 165, 233, 0.45)", stroke: "#38bdf8" },
  "Politique": { color: "rgba(234, 88, 12, 0.45)", stroke: "#fb923c" },
  "Martial / Militaire": { color: "rgba(225, 29, 72, 0.45)", stroke: "#f43f5e" },
  "Art & Culture": { color: "rgba(168, 85, 247, 0.45)", stroke: "#c084fc" },
  "Religion & Philosophie": { color: "rgba(234, 179, 8, 0.45)", stroke: "#fde047" }
};

const GLOBAL_MIN = -4500000000;
const GLOBAL_MAX = 2026;
const MINI_PAD = 30;
const HANDLE_WIDTH = 10;
const MINI_HEIGHT = 70;
const BAR_HEIGHT = 46;

function getAutoPeriod(year) {
  for (const seg of PERIOD_SEGMENTS) {
    if (year <= seg.end) return seg.nom;
  }
  return "Contemporain";
}

function getTagStyle(tag) {
  if (DEFAULT_TAG_PALETTE[tag]) return DEFAULT_TAG_PALETTE[tag];
  return { color: "rgba(148, 163, 184, 0.4)", stroke: "#94a3b8" };
}

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);

  const [viewRange, setViewRange] = useState({ min: -1000, max: 2026 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);

  // Répertoire des tags disponibles
  const [availableTags, setAvailableTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [newTagInput, setNewTagInput] = useState('');

  // Filtres
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(Object.keys(DEFAULT_TAG_PALETTE));
  const [customSelectedIds, setCustomSelectedIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState('tags'); // 'tags' ou 'custom'
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    anneeDebut: '',
    ereDebut: 'CE',
    anneeFin: '',
    ereFin: 'CE',
    tags: ["Sciences & Techniques"],
    importance: 3,
    description: ''
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

  function formatYear(year) {
    const rounded = Math.round(year);
    if (Math.abs(rounded) >= 1_000_000_000) return (rounded / 1_000_000_000).toFixed(2) + " Ga";
    if (Math.abs(rounded) >= 1_000_000) return (rounded / 1_000_000).toFixed(1) + " Ma";
    if (rounded < 0) return Math.abs(rounded) + " av. J.-C.";
    return rounded.toString();
  }

  function getTickInterval(span) {
    const targets = [
      1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 50000,
      100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000,
      500000000, 1000000000
    ];
    const approx = span / 8;
    return targets.find(t => t >= approx) || 1000000000;
  }

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

    // Filtrage dynamique
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

      const firstTag = (p.tags && p.tags[0]) || p.categorie;
      const catStyle = getTagStyle(firstTag);
      const trackHeight = (BAR_HEIGHT - 6) / 2;
      const trackY = (idx % 2 === 0) ? barTop + 3 : barTop + 3 + trackHeight;

      ctx.fillStyle = catStyle.color;
      ctx.fillRect(rX, trackY, rW, trackHeight);
      ctx.strokeStyle = catStyle.stroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rX, trackY, rW, trackHeight);

      if (rW > 35) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rX + 2, trackY, rW - 4, trackHeight);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
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

      const firstTag = (evt.tags && evt.tags[0]) || evt.categorie;
      const tagStyle = getTagStyle(firstTag);

      ctx.strokeStyle = tagStyle.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, barTop);
      ctx.lineTo(x, yT);
      ctx.stroke();

      ctx.fillStyle = tagStyle.stroke;
      ctx.beginPath();
      ctx.arc(x, yT, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 12px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const textW = ctx.measureText(titreTexte).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 8, yT - 10, textW + 8, 20);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(titreTexte, x + 12, yT);

      hitboxesRef.current.push({ type: 'circle', x, y: yT, r: 14, evt });
    });

    // Minimap
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
      if (evt.date_fin) {
        const mx2 = yearToMiniX(evt.date_fin, mw);
        const mW = Math.max(2, Math.abs(mx2 - mx));
        mctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        mctx.fillRect(Math.min(mx, mx2), 36, mW, 6);
      } else {
        mctx.fillStyle = '#38bdf8';
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

    canvasMainRef.current.width = totalW;
    canvasMainRef.current.height = Math.max(100, totalH - MINI_HEIGHT);

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

        // Enrichit la liste des tags connus à partir des données en base
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
  }, []);

  useEffect(() => {
    drawScene();
  }, [viewRange, events, selectedTags, customSelectedIds, filterMode]);

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

      setSelectedEvent(hit ? hit.evt : null);
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

  // Ajout d'un tag personnalisé à la volée
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
        if (prev.tags.length === 1) return prev; // Au moins 1 tag
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      }
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

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

    const newRecord = {
      titre: formData.titre.trim(),
      date_debut: calculatedStart,
      date_fin: calculatedEnd,
      tags: chosenTags,
      categorie: chosenTags[0], // Conserve rétro-compatibilité
      periode: calculatedPeriod,
      importance: Number(formData.importance),
      description: formData.description.trim() || null
    };

    const { data, error } = await supabase
      .from('evenements')
      .insert([newRecord])
      .select();

    setIsSubmitting(false);

    if (error) {
      setFormError('Erreur : ' + error.message);
    } else if (data && data.length > 0) {
      const created = data[0];
      setEvents(prev => [...prev, created]);
      setCustomSelectedIds(prev => new Set([...prev, created.id]));
      setIsModalOpen(false);
      setFormData({
        titre: '',
        anneeDebut: '',
        ereDebut: 'CE',
        anneeFin: '',
        ereFin: 'CE',
        tags: [availableTags[0] || "Sciences & Techniques"],
        importance: 3,
        description: ''
      });
      setIsRange(false);

      const centerYear = calculatedEnd ? (calculatedStart + calculatedEnd) / 2 : calculatedStart;
      const span = viewRef.current.max - viewRef.current.min;
      setViewRange({
        min: centerYear - span / 2,
        max: centerYear + span / 2
      });
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
      
      {/* Barre supérieure */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: isFilterOpen ? '#0284c7' : '#0f172a', color: '#ffffff', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          <span>🏷️ Filtres & Tags</span>
        </button>

        <div style={{ padding: '8px 14px', backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12, pointerEvents: 'none', color: '#f8fafc' }}>
          Plage : <span style={{ color: '#38bdf8' }}>{formatYear(viewRange.min)} ➔ {formatYear(viewRange.max)}</span>
        </div>
      </div>

      {/* Bouton d'ajout */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          <span style={{ fontSize: 15 }}>+</span>
          <span>Ajouter</span>
        </button>
      </div>

      {/* Volet de filtres */}
      {isFilterOpen && (
        <div style={{ position: 'absolute', top: 60, left: 16, zIndex: 25, width: 340, maxHeight: 'calc(100vh - 160px)', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, backdropFilter: 'blur(10px)', boxShadow: '0 12px 35px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#f8fafc' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: 13, color: '#38bdf8' }}>Filtres d'affichage</span>
            <button onClick={() => setIsFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 8, gap: 6, backgroundColor: '#090d16', borderBottom: '1px solid #1e293b' }}>
            <button
              onClick={() => setFilterMode('tags')}
              style={{ padding: '6px', fontSize: 11, fontWeight: 'bold', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: filterMode === 'tags' ? '#0284c7' : 'transparent', color: filterMode === 'tags' ? '#ffffff' : '#94a3b8' }}
            >
              Par Tags
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              style={{ padding: '6px', fontSize: 11, fontWeight: 'bold', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: filterMode === 'custom' ? '#0284c7' : 'transparent', color: filterMode === 'custom' ? '#ffffff' : '#94a3b8' }}
            >
              Éléments isolés
            </button>
          </div>

          <div style={{ padding: 14, overflowY: 'auto', flex: 1, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filterMode === 'tags' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>
                  <span>COCHER POUR VISUALISER :</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span onClick={() => setSelectedTags(availableTags)} style={{ cursor: 'pointer', color: '#38bdf8' }}>Tous</span>
                    <span onClick={() => setSelectedTags([])} style={{ cursor: 'pointer', color: '#94a3b8' }}>Aucun</span>
                  </div>
                </div>

                {availableTags.map(tag => {
                  const isChecked = selectedTags.includes(tag);
                  const style = getTagStyle(tag);
                  return (
                    <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, backgroundColor: isChecked ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFilterTag(tag)}
                        style={{ accentColor: style.stroke }}
                      />
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: style.stroke }} />
                      <span style={{ color: isChecked ? '#f8fafc' : '#64748b' }}>{tag}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {filterMode === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#ffffff', fontSize: 11, outline: 'none' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>{customSelectedIds.size} visible(s) / {events.length}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span onClick={selectAllCustom} style={{ cursor: 'pointer', color: '#38bdf8' }}>Tout</span>
                    <span onClick={deselectAllCustom} style={{ cursor: 'pointer', color: '#94a3b8' }}>Rien</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                  {searchedEvents.map(evt => {
                    const isChecked = customSelectedIds.has(evt.id);
                    return (
                      <label key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 6, backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'transparent', cursor: 'pointer', fontSize: 11 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCustomEvent(evt.id)}
                          style={{ accentColor: '#38bdf8' }}
                        />
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isChecked ? '#f8fafc' : '#64748b' }}>
                          {evt.titre}
                        </span>
                        <span style={{ fontSize: 9, color: '#64748b' }}>{formatYear(evt.date_debut)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fiche descriptive au clic */}
      {selectedEvent && (
        <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 380, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', color: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: selectedEvent.date_fin ? '#c084fc' : '#38bdf8', fontWeight: 'bold' }}>
                {selectedEvent.date_fin ? '⏳ Période historique' : '📍 Événement ponctuel'}
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontWeight: 'bold', color: '#ffffff', fontSize: 15 }}>{selectedEvent.titre}</h3>
            </div>
            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>{selectedEvent.description || "Aucune description fournie."}</p>
          
          {/* Tags sous forme de badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {(selectedEvent.tags || [selectedEvent.categorie]).filter(Boolean).map(t => (
              <span key={t} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, backgroundColor: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}>
                #{t}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 10, color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <span>📅 {formatYear(selectedEvent.date_debut)} {selectedEvent.date_fin ? `➔ ${formatYear(selectedEvent.date_fin)} (${Math.round(selectedEvent.date_fin - selectedEvent.date_debut)} ans)` : ''}</span>
            <span>🏛️ {selectedEvent.periode}</span>
            <span>⭐ {selectedEvent.importance}/5</span>
          </div>
        </div>
      )}

      {/* Modale d'ajout avec gestion des tags multiples */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 22, width: '100%', maxWidth: 460, color: '#f8fafc', boxShadow: '0 15px 35px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#38bdf8' }}>Ajouter un élément temporel</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>

            {formError && (
              <div style={{ marginBottom: 12, padding: 8, backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#fecdd3', fontSize: 12, borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, backgroundColor: '#020617', borderRadius: 8, border: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setIsRange(false)}
                  style={{ padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11, backgroundColor: !isRange ? '#0284c7' : 'transparent', color: !isRange ? '#ffffff' : '#94a3b8' }}
                >
                  📍 Événement ponctuel
                </button>
                <button
                  type="button"
                  onClick={() => setIsRange(true)}
                  style={{ padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11, backgroundColor: isRange ? '#0284c7' : 'transparent', color: isRange ? '#ffffff' : '#94a3b8' }}
                >
                  ⏳ Période / Dynastie
                </button>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Titre</label>
                <input
                  type="text"
                  required
                  placeholder={isRange ? "Ex: Siècle des Lumières" : "Ex: Déclaration d'indépendance"}
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>
                    {isRange ? "Année de début" : "Année"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 1715"
                    value={formData.anneeDebut}
                    onChange={e => setFormData({ ...formData, anneeDebut: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Ère</label>
                  <select
                    value={formData.ereDebut}
                    onChange={e => setFormData({ ...formData, ereDebut: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none' }}
                  >
                    <option value="CE">ap. J.-C.</option>
                    <option value="BCE">av. J.-C.</option>
                  </select>
                </div>
              </div>

              {isRange && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, padding: 10, backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '1px dashed #38bdf8', borderRadius: 8 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, color: '#38bdf8', fontWeight: 500 }}>Année de fin</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 1789"
                      value={formData.anneeFin}
                      onChange={e => setFormData({ ...formData, anneeFin: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #38bdf8', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, color: '#38bdf8', fontWeight: 500 }}>Ère de fin</label>
                    <select
                      value={formData.ereFin}
                      onChange={e => setFormData({ ...formData, ereFin: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #38bdf8', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none' }}
                    >
                      <option value="CE">ap. J.-C.</option>
                      <option value="BCE">av. J.-C.</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Sélection & Création de tags */}
              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>
                  Tags associés (cliquer pour activer / désactiver)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {availableTags.map(tag => {
                    const isSelected = formData.tags.includes(tag);
                    const style = getTagStyle(tag);
                    return (
                      <span
                        key={tag}
                        onClick={() => toggleTagInForm(tag)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 14,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? style.stroke : '#020617',
                          color: isSelected ? '#0f172a' : '#94a3b8',
                          border: `1px solid ${isSelected ? style.stroke : '#334155'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tag} {isSelected ? '✓' : '+'}
                      </span>
                    );
                  })}
                </div>

                {/* Champ pour créer un nouveau tag à la volée */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Créer un nouveau tag (ex: Astronomie, Asie...)"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewTag(); } }}
                    style={{ flex: 1, backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#ffffff', fontSize: 11, outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTag}
                    style={{ padding: '6px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 11 }}
                  >
                    + Ajouter le tag
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ color: '#cbd5e1', fontWeight: 500 }}>Importance visuelle</label>
                  <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Niveau {formData.importance} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.importance}
                  onChange={e => setFormData({ ...formData, importance: e.target.value })}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Description (optionnelle)</label>
                <textarea
                  rows="3"
                  placeholder="Contexte, acteurs, conséquences..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', color: '#ffffff', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '7px 14px', backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '7px 18px', backgroundColor: '#0284c7', border: 'none', color: '#ffffff', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Frise principale */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100% - 70px)', cursor: 'grab' }}>
        <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Minimap basse */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 70, backgroundColor: '#020617', borderTop: '1px solid #1e293b', cursor: 'pointer', zIndex: 15 }}>
        <canvas ref={canvasMiniRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

    </div>
  );
}