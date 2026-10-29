// Configuration des 7 cartes géologiques repères
export const GEOLOGY_MAPS = [
  {
    id: "hadean",
    year: -4500000000,
    title: "Hadéen — Origines & Océan de magma",
    period: "Hadéen (-4.5 Ga)",
    description: "Formation de la Terre, accrétion planétaire et océan magmatique primordial.",
    image: "/maps/geology/archean.png"
  },
  {
    id: "archean",
    year: -3000000000,
    title: "Archéen — Premiers micro-continents",
    period: "Archéen (-3.0 Ga)",
    description: "Apparition des premiers boucliers continentaux granitiques sous une atmosphère réductrice sans oxygène.",
    image: "/maps/geology/archean.png"
  },
  {
    id: "rodinia",
    year: -1000000000,
    title: "Protérozoïque — Supercontinent Rodinia",
    period: "Néoprotérozoïque (-1.0 Ga)",
    description: "Regroupement de l'ensemble des masses terrestres en un unique supercontinent avant sa dislocation.",
    image: "/maps/geology/archean.png"
  },
  {
    id: "pangea",
    year: -300000000,
    title: "Carbonifère / Permien — La Pangée",
    period: "Paléozoïque supérieur (-300 Ma)",
    description: "Soudure de la Laurasia et du Gondwana formant la Pangée, ceinturée par l'immense océan Panthalassa.",
    image: "/maps/geology/archean.png"
  },
  {
    id: "jurassic",
    year: -150000000,
    title: "Jurassique — Éclatement de la Pangée",
    period: "Mésozoïque (-150 Ma)",
    description: "Ouverture de l'océan Atlantique central et séparation entre le bloc nord (Laurasia) et sud (Gondwana).",
    image: "/maps/geology/archean.png"
  },
  {
    id: "cretaceous",
    year: -66000000,
    title: "Fin du Crétacé — Dislocation avancée",
    period: "Crétacé supérieur (-66 Ma)",
    description: "Mise en place des bassins océaniques modernes, isolement du continent indien et extinction des dinosaures.",
    image: "/maps/geology/archean.png"
  },
  {
    id: "lgm",
    year: -20000,
    title: "Dernier Maximum Glaciaire",
    period: "Pléistocène supérieur (-20 ka BP)",
    description: "Épaisses calottes sur l'Europe du Nord et l'Amérique, niveau marin 120 mètres plus bas et ponts terrestres.",
    image: "/maps/geology/archean.png"
  }
];

export function getClosestGeologyMap(year) {
  let closest = GEOLOGY_MAPS[0];
  let minDiff = Math.abs(year - closest.year);

  for (const m of GEOLOGY_MAPS) {
    const diff = Math.abs(year - m.year);
    if (diff < minDiff) {
      minDiff = diff;
      closest = m;
    }
  }
  return closest;
}