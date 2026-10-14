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

const CATEGORIES = [
  "Sciences & Techniques",
  "Politique",
  "Martial / Militaire",
  "Art & Culture",
  "Religion & Philosophie"
];

const GLOBAL_MIN = -4500000000;
const GLOBAL_MAX = 2026;
const MINI_PAD = 30;
const HANDLE_WIDTH = 10;
const MINI_HEIGHT = 70;

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);

  const [viewRange, setViewRange] = useState({ min: -1000, max: 2026 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    annee: '',
    ere: 'CE',
    categorie: CATEGORIES[0],
    periode: PERIOD_SEGMENTS[2].nom,
    importance: 3,
    description: ''
  });

  const viewRef = useRef(viewRange);
  useEffect(() => { viewRef.current = viewRange; }, [viewRange]);

  const eventsRef = useRef(events);
  useEffect(() => { eventsRef.current = events; }, [events]);

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

    // --- 1. Canvas principal ---
    ctx.clearRect(0, 0, w, h);
    hitboxesRef.current = [];

    const timelineY = h * 0.65;
    const xStart = yearToX(GLOBAL_MIN);
    const xEnd = yearToX(GLOBAL_MAX);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.max(-50, xStart), timelineY);
    ctx.lineTo(Math.min(w + 50, xEnd), timelineY);
    ctx.stroke();

    const interval = getTickInterval(span);
    const firstTick = Math.ceil(vMin / interval) * interval;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    for (let t = firstTick; t <= vMax; t += interval) {
      if (t < GLOBAL_MIN || t > GLOBAL_MAX) continue;
      const tx = yearToX(t);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, timelineY - 6);
      ctx.lineTo(tx, timelineY + 6);
      ctx.stroke();
      ctx.fillText(formatYear(t), tx, timelineY + 20);
    }

    const liste = eventsRef.current || [];
    liste.forEach((evt, index) => {
      const x = yearToX(evt.date_debut);
      if (x < -200 || x > w + 200) return;

      const titreTexte = String(evt.titre || 'Sans titre');
      const decalageY = 35 + (index % 3) * 35;
      const yT = timelineY - decalageY;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, timelineY);
      ctx.lineTo(x, yT);
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x, yT, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 12px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const textW = ctx.measureText(titreTexte).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 8, yT - 10, textW + 8, 20);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(titreTexte, x + 12, yT);

      hitboxesRef.current.push({ x, y: yT, r: 14, evt });
    });

    // --- 2. Minimap basse ---
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

    liste.forEach(evt => {
      const mx = yearToMiniX(evt.date_debut, mw);
      mctx.fillStyle = '#38bdf8';
      mctx.fillRect(mx - 1, 38, 2, 6);
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
  }, [viewRange, events]);

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
      const hit = hitboxesRef.current.find(h => Math.hypot(e.clientX - h.x, e.clientY - h.y) <= h.r);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.titre.trim()) {
      setFormError('Le titre est obligatoire.');
      return;
    }

    const rawVal = Number(formData.annee);
    if (isNaN(rawVal) || formData.annee === '') {
      setFormError('L’année doit être un nombre valide.');
      return;
    }

    const calculatedYear = formData.ere === 'BCE' ? -Math.abs(rawVal) : rawVal;

    setIsSubmitting(true);

    const newRecord = {
      titre: formData.titre.trim(),
      date_debut: calculatedYear,
      categorie: formData.categorie,
      periode: formData.periode,
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
      setEvents(prev => [...prev, data[0]]);
      setIsModalOpen(false);
      setFormData({
        titre: '',
        annee: '',
        ere: 'CE',
        categorie: CATEGORIES[0],
        periode: PERIOD_SEGMENTS[2].nom,
        importance: 3,
        description: ''
      });

      const span = viewRef.current.max - viewRef.current.min;
      setViewRange({
        min: calculatedYear - span / 2,
        max: calculatedYear + span / 2
      });
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#020617', overflow: 'hidden', userSelect: 'none' }}>
      
      {/* Panneau indicateur en haut à gauche */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, padding: 12, backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12, lineHeight: 1.5, pointerEvents: 'none', color: '#f8fafc' }}>
        <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Frise Chronologique Universelle</span><br />
        Plage : {formatYear(viewRange.min)} ➔ {formatYear(viewRange.max)}
      </div>

      {/* Bouton d'ajout en haut à droite */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          <span style={{ fontSize: 15 }}>+</span>
          <span>Ajouter un événement</span>
        </button>
      </div>

      {/* Fiche descriptive au clic */}
      {selectedEvent && (
        <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 360, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', color: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontWeight: 'bold', color: '#38bdf8', fontSize: 14 }}>{selectedEvent.titre}</h3>
            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>{selectedEvent.description || "Aucune description fournie."}</p>
          <div style={{ fontSize: 10, color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span>📅 {formatYear(selectedEvent.date_debut)}</span>
            <span>🏷️ {selectedEvent.categorie}</span>
            <span>🏛️ {selectedEvent.periode}</span>
            <span>⭐ {selectedEvent.importance}/5</span>
          </div>
        </div>
      )}

      {/* Modale d'ajout */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20, width: '100%', maxWidth: 440, color: '#f8fafc', boxShadow: '0 15px 35px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #1e293b', pb: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#38bdf8' }}>Nouvel événement historique</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>

            {formError && (
              <div style={{ marginBottom: 10, padding: 8, backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#fecdd3', fontSize: 12, borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Titre</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prise de la Bastille"
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Année</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 1789"
                    value={formData.annee}
                    onChange={e => setFormData({ ...formData, annee: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Ère</label>
                  <select
                    value={formData.ere}
                    onChange={e => setFormData({ ...formData, ere: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none' }}
                  >
                    <option value="CE">ap. J.-C. (Ère commune)</option>
                    <option value="BCE">av. J.-C. (Négatif)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Catégorie</label>
                  <select
                    value={formData.categorie}
                    onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Période</label>
                  <select
                    value={formData.periode}
                    onChange={e => setFormData({ ...formData, periode: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none' }}
                  >
                    {PERIOD_SEGMENTS.map(seg => (
                      <option key={seg.id} value={seg.nom}>{seg.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Importance (1 à 5)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.importance}
                    onChange={e => setFormData({ ...formData, importance: e.target.value })}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#38bdf8', width: 16, textAlign: 'center' }}>{formData.importance}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, color: '#cbd5e1', fontWeight: 500 }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Contexte de l'événement..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', color: '#ffffff', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '6px 12px', backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '6px 16px', backgroundColor: '#0284c7', border: 'none', color: '#ffffff', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Frise principale (prend tout le haut) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100% - 70px)', cursor: 'grab' }}>
        <canvas ref={canvasMainRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Barre du bas (Minimap) clouée à 70px en bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 70, backgroundColor: '#020617', borderTop: '1px solid #1e293b', cursor: 'pointer', zIndex: 15 }}>
        <canvas ref={canvasMiniRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

    </div>
  );
}