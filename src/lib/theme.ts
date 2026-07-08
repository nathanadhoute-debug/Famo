// Constantes du design system Famō — utilisables dans les styles inline (JSX).
// Les mêmes valeurs existent en CSS variables dans globals.css.

export const c = {
  sage900: "#1E3830",
  sage700: "#3A6B5E",
  sage600: "#4C8272",
  sage050: "#EAF0ED",
  cream:   "#F4F2EC",
  cream2:  "#FAFAF7",
  card:    "#FFFFFF",
  ink:     "#1A2622",
  muted:   "#66756F",
  line:    "#E4E0D6",
  terracotta: "#B8794A",
  amber:   "#D9A05B",
  danger:  "#B04B3C",
  success: "#4C8272",

  // Tokens éditoriaux (dashboard "santé premium")
  creamPage: "#F9F7F0",  // fond de page dashboard
  hairline:  "#EBE6D8",  // séparateurs fins
  eyebrow:   "#A79D82",  // sur-titres petites capitales
  sub:       "#8B8271",  // sous-titres discrets
  spark:     "#B7CBBE",  // courbe des sparklines
  sageSoft:  "#4E6E62",  // avatars secondaires
} as const;

export const font = {
  display: "'Fraunces', Georgia, serif",
  body:    "'Inter', system-ui, -apple-system, sans-serif",
} as const;
