// Constantes temporelles et visuelles globales
export const GLOBAL_MIN = -4500000000;
export const GLOBAL_MAX = 2026;
export const MINI_PAD = 30;
export const HANDLE_WIDTH = 10;
export const MINI_HEIGHT = 70;
export const BAR_HEIGHT = 46;

// Segments des grandes époques pour la minimap
export const PERIOD_SEGMENTS = [
  { id: "cosmo", nom: "Cosmologie", start: -4500000000, end: -300000, ratio: 0.20, color: "#312e81" },
  { id: "prehist", nom: "Préhistoire", start: -300000, end: -3500, ratio: 0.16, color: "#1e3a5f" },
  { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.16, color: "#065f46" },
  { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.16, color: "#854d0e" },
  { id: "moderne", nom: "Ép. moderne", start: 1492, end: 1789, ratio: 0.16, color: "#9a3412" },
  { id: "contemp", nom: "Contemporain", start: 1789, end: 2026, ratio: 0.16, color: "#991b1b" }
];

// Palette par défaut des tags
export const DEFAULT_TAG_PALETTE = {
  "Sciences & Techniques": { color: "rgba(14, 165, 233, 0.45)", stroke: "#38bdf8" },
  "Politique": { color: "rgba(234, 88, 12, 0.45)", stroke: "#fb923c" },
  "Martial / Militaire": { color: "rgba(225, 29, 72, 0.45)", stroke: "#f43f5e" },
  "Art & Culture": { color: "rgba(168, 85, 247, 0.45)", stroke: "#c084fc" },
  "Religion & Philosophie": { color: "rgba(234, 179, 8, 0.45)", stroke: "#fde047" }
};

// Nuancier de sélection rapide
export const COLOR_PRESETS = [
  { name: "Ciel", stroke: "#38bdf8", fill: "rgba(14, 165, 233, 0.45)" },
  { name: "Émeraude", stroke: "#10b981", fill: "rgba(16, 185, 129, 0.45)" },
  { name: "Ambre", stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.45)" },
  { name: "Orange", stroke: "#fb923c", fill: "rgba(234, 88, 12, 0.45)" },
  { name: "Rose", stroke: "#f43f5e", fill: "rgba(225, 29, 72, 0.45)" },
  { name: "Violet", stroke: "#c084fc", fill: "rgba(168, 85, 247, 0.45)" },
  { name: "Indigo", stroke: "#818cf8", fill: "rgba(99, 102, 241, 0.45)" },
  { name: "Argent", stroke: "#94a3b8", fill: "rgba(148, 163, 184, 0.45)" }
];

// Calcul automatique de l'époque selon l'année
export function getAutoPeriod(year) {
  for (const seg of PERIOD_SEGMENTS) {
    if (year <= seg.end) return seg.nom;
  }
  return "Contemporain";
}

// Formatage lisible des années (-4.5 Ga, -331 av. J.-C., 2026)
export function formatYear(year) {
  const rounded = Math.round(year);
  if (Math.abs(rounded) >= 1_000_000_000) return (rounded / 1_000_000_000).toFixed(2) + " Ga";
  if (Math.abs(rounded) >= 1_000_000) return (rounded / 1_000_000).toFixed(1) + " Ma";
  if (rounded < 0) return Math.abs(rounded) + " av. J.-C.";
  return rounded.toString();
}

// Calcul de l'intervalle dynamique des graduations
export function getTickInterval(span) {
  const targets = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 50000,
    100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000,
    500000000, 1000000000
  ];
  const approx = span / 8;
  return targets.find(t => t >= approx) || 1000000000;
}

// Style de couleur d'un élément (couleur personnalisée prioritaire, sinon tag)
export function getItemStyle(evt) {
  if (evt && evt.couleur) {
    const preset = COLOR_PRESETS.find(p => p.stroke.toLowerCase() === evt.couleur.toLowerCase());
    if (preset) return preset;
    return { stroke: evt.couleur, fill: evt.couleur.replace(')', ', 0.45)').replace('rgb', 'rgba') };
  }
  const firstTag = (evt && evt.tags && evt.tags[0]) || (evt && evt.categorie);
  if (firstTag && DEFAULT_TAG_PALETTE[firstTag]) return { stroke: DEFAULT_TAG_PALETTE[firstTag].stroke, fill: DEFAULT_TAG_PALETTE[firstTag].color };
  return { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.45)" };
}