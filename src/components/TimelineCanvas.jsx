import { supabase } from '../supabase.js';
import React, { useRef, useEffect, useState } from 'react';

const PERIOD_SEGMENTS = [
  { id: "cosmo", nom: "Cosmologie", start: -4500000000, end: -300000, ratio: 0.20, color: "#312e81" },
  { id: "prehist", nom: "Préhistoire", start: -300000, end: -3500, ratio: 0.16, color: "#1e3a5f" },
  { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.16, color: "#065f46" },
  { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.16, color: "#854d0e" },
  { id: "moderne", nom: "Ép. moderne", start: 1492, end: 1789, ratio: 0.16, color: "#9a3412" },
  { id: "contemp", nom: "Contemporain", start: 1789, end: 2026, ratio: 0.16, color: "#991b1b" }
];

const GLOBAL_MIN = -4500000000;
const GLOBAL_MAX = 2026;
const MINI_PAD = 30;
const HANDLE_WIDTH = 12;

export default function TimelineCanvas() {
  const canvasMainRef = useRef(null);
  const canvasMiniRef = useRef(null);

  const [viewRange, setViewRange] = useState({ min: -1000, max: 2026 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const viewRef = useRef(viewRange);
  useEffect(() => { viewRef.current = viewRange; }, [viewRange]);

  const hitboxesRef = useRef([]);

  // Récupération des données dans Supabase
  useEffect(() => {
    async function chargerEvenements() {
      const { data, error } = await supabase
        .from('evenements')
        .select('*');

      if (error) {
        console.error('Erreur Supabase :', error);
      } else if (data) {
        setEvents(data);
      }
      setLoading(false);
    }
    chargerEvenements();
  }, []);

  function formatYear(year) {
    const rounded = Math.round(year);
    if (Math.abs(rounded) >= 1_000_000_000) return (rounded / 1_000_000_000).toFixed(2) + " Ga";
    if (Math.abs(rounded) >= 1_000_000) return (rounded / 1_000_000).toFixed(1) + " Ma";
    if (rounded < 0) return Math.abs(rounded) + " av. J.-C.";
    return rounded.toString();
  }

  function getTickInterval(span) {
    const targets = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000];
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

    const { min: vMin, max: vMax } = viewRef.current;
    const span = vMax - vMin;

    const yearToX = year => ((year - vMin) / span) * w;

    // --- Vue Principale ---
    ctx.clearRect(0, 0, w, h);
    hitboxesRef.current = [];

    const timelineY = h * 0.65;
    const xStart = yearToX(GLOBAL_MIN);
    const xEnd = yearToX(GLOBAL_MAX);

    // Axe horizontal
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.max(-50, xStart), timelineY);
    ctx.lineTo(Math.min(w + 50, xEnd), timelineY);
    ctx.stroke();

    // Graduations
    const interval = getTickInterval(span);
    const firstTick = Math.ceil(vMin / interval) * interval;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    for (let t = firstTick; t <= vMax; t += interval) {
      if (t < GLOBAL_MIN || t > GLOBAL_MAX) continue;
      const tx = yearToX(t);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.beginPath();
      ctx.moveTo(tx, timelineY - 6);
      ctx.lineTo(tx, timelineY + 6);
      ctx.stroke();
      ctx.fillText(formatYear(t), tx, timelineY + 20);
    }

    // Affichage des événements avec étiquettes
    events.forEach((evt, index) => {
      const x = yearToX(evt.date_debut);
      if (x < -200 || x > w + 200) return;

      const texteTitre = String(evt.titre || 'Sans titre');
      const decalageY = 35 + (index % 3) * 35;
      const yT = timelineY - decalageY;

      // Tige
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, timelineY);
      ctx.lineTo(x, yT);
      ctx.stroke();

      // Pastille
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x, yT, 5, 0, Math.PI * 2);
      ctx.fill();

      // Boîte de fond pour le texte
      ctx.font = 'bold 12px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const textW = ctx.measureText(texteTitre).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(x + 8, yT - 10, textW + 8, 20);

      // Texte
      ctx.fillStyle = '#ffffff';
      ctx.fillText(texteTitre, x + 12, yT);

      hitboxesRef.current.push({ x, y: yT, r: 14, evt });
    });

    // --- Minimap ---
    mctx.clearRect(0, 0, mw, mh);
    const usableW = mw - 2 * MINI_PAD;
    let curX = MINI_PAD;

    PERIOD_SEGMENTS.forEach(seg => {
      const segW = seg.ratio * usableW;
      mctx.fillStyle = seg.color;
      mctx.fillRect(curX, 10, segW, 34);
      mctx.fillStyle = 'rgba(255,255,255,0.85)';
      mctx.font = '10px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText(seg.nom, curX + segW / 2, 30);
      curX += segW;
    });

    events.forEach(evt => {
      const mx = yearToMiniX(evt.date_debut, mw);
      mctx.fillStyle = '#38bdf8';
      mctx.fillRect(mx - 1, 46, 2, 6);
    });

    const vx1 = yearToMiniX(vMin, mw);
    const vx2 = yearToMiniX(vMax, mw);
    const left = Math.min(vx1, vx2);
    const right = Math.max(vx1, vx2);
    const bWidth = Math.max(8, right - left);

    mctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    mctx.fillRect(left, 8, bWidth, 46);
    mctx.strokeStyle = '#38bdf8';
    mctx.lineWidth = 1.5;
    mctx.strokeRect(left, 8, bWidth, 46);

    mctx.fillStyle = '#fff';
    mctx.fillRect(left, 10, 4, 42);
    mctx.fillRect(left + bWidth - 4, 10, 4, 42);
  };

  // Redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (!canvasMainRef.current || !canvasMiniRef.current) return;
      canvasMainRef.current.width = window.innerWidth;
      canvasMainRef.current.height = window.innerHeight - 85;
      canvasMiniRef.current.width = window.innerWidth;
      canvasMiniRef.current.height = 85;
      drawScene();
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redessiner à chaque changement de vue ou de données
  useEffect(() => {
    drawScene();
  }, [viewRange, events]);

  // Événements souris
  useEffect(() => {
    const cMain = canvasMainRef.current;
    const cMini = canvasMiniRef.current;
    if (!cMain || !cMini) return;

    let isDragging = false;
    let dragStartX = 0;
    let startMin = 0;
    let startMax = 0;
    let miniMode = null;
    let initialTouchDist = 0;

    const onWheel = e => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const w = cMain.width;
      const span = viewRef.current.max - viewRef.current.min;
      const mouseYear = viewRef.current.min + (e.clientX / w) * span;

      const nMin = mouseYear + (viewRef.current.min - mouseYear) * factor;
      const nMax = mouseYear + (viewRef.current.max - mouseYear) * factor;
      if (nMax - nMin > 1) setViewRange({ min: nMin, max: nMax });
    };

    const onMouseDownMain = e => {
      isDragging = true;
      dragStartX = e.clientX;
      startMin = viewRef.current.min;
      startMax = viewRef.current.max;
    };

    const onMouseDownMini = e => {
      const w = cMini.width;
      const left = yearToMiniX(viewRef.current.min, w);
      const right = yearToMiniX(viewRef.current.max, w);
      dragStartX = e.clientX;
      startMin = viewRef.current.min;
      startMax = viewRef.current.max;

      if (Math.abs(e.clientX - left) <= HANDLE_WIDTH) miniMode = 'left';
      else if (Math.abs(e.clientX - right) <= HANDLE_WIDTH) miniMode = 'right';
      else if (e.clientX > left && e.clientX < right) miniMode = 'pan';
      else {
        const clicked = miniXToYear(e.clientX, w);
        const span = startMax - startMin;
        setViewRange({ min: clicked - span / 2, max: clicked + span / 2 });
        miniMode = 'pan';
      }
    };

    const onMouseMove = e => {
      if (isDragging) {
        const span = startMax - startMin;
        const shift = ((e.clientX - dragStartX) / cMain.width) * span;
        setViewRange({ min: startMin - shift, max: startMax - shift });
      } else if (miniMode) {
        const w = cMini.width;
        const targetYear = miniXToYear(e.clientX, w);
        if (miniMode === 'pan') {
          const shift = targetYear - miniXToYear(dragStartX, w);
          setViewRange({ min: startMin + shift, max: startMax + shift });
        } else if (miniMode === 'left') {
          if (viewRef.current.max - targetYear > 1) setViewRange(v => ({ ...v, min: targetYear }));
        } else if (miniMode === 'right') {
          if (targetYear - viewRef.current.min > 1) setViewRange(v => ({ ...v, max: targetYear }));
        }
      }
    };

    const onMouseUp = () => { isDragging = false; miniMode = null; };

    const onTouchStart = e => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        startMin = viewRef.current.min;
        startMax = viewRef.current.max;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        startMin = viewRef.current.min;
        startMax = viewRef.current.max;
      }
    };

    const onTouchMove = e => {
      if (e.touches.length === 1 && isDragging) {
        const span = startMax - startMin;
        const shift = ((e.touches[0].clientX - dragStartX) / cMain.width) * span;
        setViewRange({ min: startMin - shift, max: startMax - shift });
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = initialTouchDist / dist;
        const center = (startMin + startMax) / 2;
        const span = (startMax - startMin) * factor;
        if (span > 1) setViewRange({ min: center - span / 2, max: center + span / 2 });
      }
    };

    const onClickMain = e => {
      const hit = hitboxesRef.current.find(h => Math.hypot(e.clientX - h.x, e.clientY - h.y) <= h.r);
      setSelectedEvent(hit ? hit.evt : null);
    };

    cMain.addEventListener('wheel', onWheel, { passive: false });
    cMain.addEventListener('mousedown', onMouseDownMain);
    cMini.addEventListener('mousedown', onMouseDownMini);
    cMain.addEventListener('click', onClickMain);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    cMain.addEventListener('touchstart', onTouchStart, { passive: true });
    cMain.addEventListener('touchmove', onTouchMove, { passive: true });
    cMain.addEventListener('touchend', onMouseUp);

    return () => {
      cMain.removeEventListener('wheel', onWheel);
      cMain.removeEventListener('mousedown', onMouseDownMain);
      cMini.removeEventListener('mousedown', onMouseDownMini);
      cMain.removeEventListener('click', onClickMain);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cMain.removeEventListener('touchstart', onTouchStart);
      cMain.removeEventListener('touchmove', onTouchMove);
      cMain.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      <div className="absolute top-4 left-4 z-10 p-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg text-xs leading-relaxed pointer-events-none">
        <span className="font-semibold text-sky-400">Frise Chronologique Universelle</span><br />
        Plage : {formatYear(viewRange.min)} ➔ {formatYear(viewRange.max)}
        {loading && <div className="text-amber-400 mt-1">Chargement des données...</div>}
      </div>

      {selectedEvent && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-80 md:w-96 p-4 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-sky-400 text-sm">{selectedEvent.titre}</h3>
            <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <p className="text-xs text-slate-300 leading-normal mb-3">{selectedEvent.description}</p>
          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex flex-wrap gap-x-2 gap-y-1">
            <span>📅 {formatYear(selectedEvent.date_debut)}</span>
            <span>🏷️ {selectedEvent.categorie}</span>
            <span>🏛️ {selectedEvent.periode}</span>
          </div>
        </div>
      )}

      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        <canvas ref={canvasMainRef} className="block w-full h-full" />
      </div>

      <div className="h-[85px] bg-slate-950 border-t border-slate-800 relative cursor-pointer">
        <canvas ref={canvasMiniRef} className="block w-full h-full" />
      </div>
    </div>
  );
}