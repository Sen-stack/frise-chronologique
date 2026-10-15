export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Linear Dark',
    icon: '✨',
    bgClass: 'theme-linear',
    canvas: {
      bg: 'transparent',
      // Ruban graphite ardoise clair satiné qui tranche fort sur le fond noir
      axisBg: '#232634',
      axisBorder: 'rgba(255, 255, 255, 0.35)',
      axisLine: '#818cf8', // Ligne violette / bleue électrique
      ticks: 'rgba(255, 255, 255, 0.45)',
      tickText: '#cbd5e1', // Dates claires et lumineuses
      pinLine: '#94a3b8',
      pinFill: '#6366f1',
      labelBg: 'rgba(30, 33, 45, 0.98)',
      labelText: '#ffffff',
      minimapBg: '#181a24',
      viewportBg: 'rgba(99, 102, 241, 0.35)',
      viewportBorder: '#a5b4fc'
    }
  },
  light: {
    id: 'light',
    name: 'Galerie d’Art (Chaux)',
    icon: '🏛️',
    bgClass: 'theme-gallery',
    canvas: {
      bg: 'transparent',
      axisBg: '#cbb69d',                   // Argile / grès mat chaud
      axisBorder: 'rgba(120, 85, 55, 0.2)',
      axisLine: 'rgba(92, 58, 30, 0.35)',
      ticks: 'rgba(92, 58, 30, 0.45)',
      tickText: '#3d2616',                 // Dates gravées en bistre foncé
      pinLine: '#451a03',
      pinFill: '#78350f',
      labelBg: 'rgba(255, 255, 255, 0.98)',
      labelText: '#1c1917',
      minimapBg: '#b89f82',
      viewportBg: 'rgba(120, 53, 15, 0.28)',
      viewportBorder: '#78350f'
    }
  },
  accessible: {
    id: 'accessible',
    name: 'Daltonien (Okabe-Ito)',
    icon: '👁️',
    bgClass: 'theme-accessible',
    canvas: {
      bg: 'transparent',
      axisBg: '#262626',
      axisBorder: '#ffffff',
      axisLine: '#ffffff',
      ticks: '#ffffff',
      tickText: '#ffffff',
      pinLine: '#f0e442',
      pinFill: '#d55e00',
      labelBg: '#000000',
      labelText: '#ffffff',
      minimapBg: '#1c1c1c',
      viewportBg: 'rgba(240, 228, 66, 0.4)',
      viewportBorder: '#f0e442'
    }
  }
};