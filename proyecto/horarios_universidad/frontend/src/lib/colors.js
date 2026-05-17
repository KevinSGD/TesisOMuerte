/**
 * Centralized material color palette.
 * All colors are WCAG AA compliant (contrast ≥ 4.5:1) on the app's dark bg (#0b1326).
 * Used by: CalendarioPage.vue, WeeklyCalendar.vue, MateriasTagInput.vue
 */

/** 12-color palette — Tailwind 400-level equivalents, vibrant on dark backgrounds */
export const PALETTE_HEX = [
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#a78bfa', // violet-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#2dd4bf', // teal-400
  '#fb923c', // orange-400
  '#c084fc', // purple-400
  '#a3e635', // lime-400
  '#22d3ee', // cyan-400
  '#f472b6', // pink-400
  '#818cf8', // indigo-400
]

/** Category → accent color mapping (matches tailwind.config.js theme tokens) */
export const CAT_COLOR = {
  'Software':         '#35c98a', // primary
  'Humanidades':      '#4ab8d9', // secondary
  'Ciencias Básicas': '#e8a44a', // tertiary
}
export const CAT_COLOR_DEFAULT = '#9ca3af' // gray-400

/** Returns the hex color for a given 0-based materia index */
export function hexAt(idx) {
  return PALETTE_HEX[Math.abs(idx ?? 0) % PALETTE_HEX.length]
}

/**
 * Returns an object with pre-computed inline style objects for event cells,
 * legend dots, and border accents.
 * @param {number} idx - 0-based materia index in state.materias
 */
export function colorForIndex(idx) {
  const hex = hexAt(idx)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    hex,
    /** Full cell style: tinted bg + colored border + colored text */
    bgStyle: {
      backgroundColor: `rgba(${r},${g},${b},0.12)`,
      borderColor:     `rgba(${r},${g},${b},0.55)`,
      color:           hex,
    },
    /** Just the dot / fill */
    dotStyle: { backgroundColor: hex },
    /** Text only */
    textStyle: { color: hex },
    /** Border accent (left-bar) */
    borderStyle: { borderLeftColor: hex },
  }
}

/** Returns the category accent color for a materia's categoria string */
export function catColor(categoria) {
  return CAT_COLOR[categoria] ?? CAT_COLOR_DEFAULT
}
