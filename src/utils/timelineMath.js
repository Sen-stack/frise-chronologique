// Constantes temporelles et visuelles globales
export const GLOBAL_MIN = -4500000000;
export const GLOBAL_MAX = 2026;
export const MINI_PAD = 30;
export const HANDLE_WIDTH = 10;
export const MINI_HEIGHT = 70;
export const BAR_HEIGHT = 46;

// Définition des 3 grandes tranches temporelles fonctionnelles avec bornes strictes
export const TIMELINE_CHAPTERS = [
  {
    id: "geologie",
    label: "Temps géologique",
    min: -4500000000,
    max: -300000,
    defaultView: { min: -4500000000, max: -300000 },
    hasMapData: false,
    unit: "Ga / Ma"
  },
  {
    id: "prehistoire",
    label: "Préhistoire",
    min: -300000,
    max: -5000,
    defaultView: { min: -300000, max: -5000 },
    hasMapData: false,
    unit: "Millénaires"
  },
  {
    id: "histoire",
    label: "Histoire & Civilisations",
    min: -5000,
    max: 2026,
    defaultView: { min: -3500, max: 2026 },
    hasMapData: true,
    unit: "Siècles / Années"
  }
];

// Segments de la minimap dédiés à chaque tranche
export const CHAPTER_SEGMENTS = {
  geologie: [
    { id: "hadean", nom: "Hadéen", start: -4500000000, end: -4000000000, ratio: 0.20, color: "#9e5c54" },
    { id: "archean", nom: "Archéen", start: -4000000000, end: -2500000000, ratio: 0.25, color: "#8a584c" },
    { id: "protero", nom: "Protérozoïque", start: -2500000000, end: -541000000, ratio: 0.25, color: "#6e685f" },
    { id: "paleozoic", nom: "Paléozoïque", start: -541000000, end: -252000000, ratio: 0.12, color: "#6e8b7d" },
    { id: "mesozoic", nom: "Mésozoïque", start: -252000000, end: -66000000, ratio: 0.10, color: "#62788e" },
    { id: "cenozoic", nom: "Cénozoïque", start: -66000000, end: -300000, ratio: 0.08, color: "#c99a4e" }
  ],
  prehistoire: [
    { id: "paleo_inf", nom: "Paléo. inf.", start: -300000, end: -120000, ratio: 0.30, color: "#9e5c54" },
    { id: "paleo_moy", nom: "Paléo. moyen", start: -120000, end: -40000, ratio: 0.28, color: "#bfa382" },
    { id: "paleo_sup", nom: "Paléo. sup.", start: -40000, end: -12000, ratio: 0.20, color: "#6e8b7d" },
    { id: "meso", nom: "Mésolithique", start: -12000, end: -8000, ratio: 0.11, color: "#62788e" },
    { id: "neo", nom: "Néolithique", start: -8000, end: -5000, ratio: 0.11, color: "#c99a4e" }
  ],
  histoire: [
    { id: "antiq_anc", nom: "Protohistoire", start: -5000, end: -3500, ratio: 0.15, color: "#bfa382" },
    { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.25, color: "#6e8b7d" },
    { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.20, color: "#62788e" },
    { id: "moderne", nom: "Ép. moderne", start: 1492, end: 1789, ratio: 0.20, color: "#b89063" },
    { id: "contemp", nom: "Contemporain", start: 1789, end: 2026, ratio: 0.20, color: "#c99a4e" }
  ]
};

// Segments globaux par défaut (rétrocompatibilité)
export const PERIOD_SEGMENTS = [
  { id: "cosmo", nom: "Cosmologie", start: -4500000000, end: -300000, ratio: 0.20, color: "#9e5c54" },
  { id: "prehist", nom: "Préhistoire", start: -300000, end: -3500, ratio: 0.16, color: "#bfa382" },
  { id: "antiq", nom: "Antiquité", start: -3500, end: 476, ratio: 0.16, color: "#6e8b7d" },
  { id: "moyenage", nom: "Moyen Âge", start: 476, end: 1492, ratio: 0.16, color: "#62788e" },
  { id: "moderne", nom: "Ép. moderne", start: 1492, end: 1789, ratio: 0.16, color: "#b89063" },
  { id: "contemp", nom: "Contemporain", start: 1789, end: 2026, ratio: 0.16, color: "#c99a4e" }
];

// Récupère les segments de minimap adaptés au chapitre
export function getChapterSegments(chapterId = 'histoire') {
  return CHAPTER_SEGMENTS[chapterId] || CHAPTER_SEGMENTS.histoire;
}

// Convertit une année en coordonnée X selon la tranche active
export function yearToChapterMiniX(year, width, chapterId = 'histoire') {
  const chapter = TIMELINE_CHAPTERS.find(c => c.id === chapterId) || TIMELINE_CHAPTERS[2];
  const clamped = Math.max(chapter.min, Math.min(chapter.max, year));
  const segments = getChapterSegments(chapterId);

  let accRatio = 0;
  for (const seg of segments) {
    if (clamped <= seg.end) {
      const segProgress = (clamped - seg.start) / (seg.end - seg.start);
      return (accRatio + segProgress * seg.ratio) * width;
    }
    accRatio += seg.ratio;
  }
  return width;
}

// Convertit une coordonnée X en année selon la tranche active
export function miniXToChapterYear(x, width, chapterId = 'histoire') {
  const chapter = TIMELINE_CHAPTERS.find(c => c.id === chapterId) || TIMELINE_CHAPTERS[2];
  const progress = Math.max(0, Math.min(1, x / width));
  const segments = getChapterSegments(chapterId);

  let accRatio = 0;
  for (const seg of segments) {
    if (progress <= accRatio + seg.ratio) {
      const segProgress = (progress - accRatio) / seg.ratio;
      return seg.start + segProgress * (seg.end - seg.start);
    }
    accRatio += seg.ratio;
  }
  return chapter.max;
}

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

// Formatage lisible des années (-4.5 Ga, -300 ka, -331 av. J.-C., 2026)
export function formatYear(year) {
  const rounded = Math.round(year);
  if (Math.abs(rounded) >= 1_000_000_000) return (rounded / 1_000_000_000).toFixed(2) + " Ga";
  if (Math.abs(rounded) >= 1_000_000) return (rounded / 1_000_000).toFixed(1) + " Ma";
  if (rounded <= -10000) return Math.abs(Math.round(rounded / 1000)) + " ka BP";
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