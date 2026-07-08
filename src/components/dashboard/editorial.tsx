import { c, font } from "@/lib/theme";
import { initials as toInitials } from "@/lib/format";

/** Sur-titre en petites capitales espacées. */
export function Eyebrow({ children, color = c.eyebrow }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontSize: 11, color, textTransform: "uppercase", letterSpacing: "1.5px", margin: 0, fontWeight: 500 }}>
      {children}
    </p>
  );
}

/** En-tête éditorial d'une page dashboard. */
export function PageHead({ eyebrow, title, subtitle }: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 30 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 500, color: c.sage900, margin: "6px 0 0", letterSpacing: "-0.2px" }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 14, color: c.sub, margin: "6px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

/** Séparateur fin (hairline). */
export function Hairline({ margin = "28px 0" }: { margin?: string }) {
  return <div style={{ height: 1, background: c.hairline, margin }} />;
}

/** Pastille d'initiales. */
export function Avatar({ name, size = 34, bg = c.sage700, fg = "#F4F2EC", ring }: {
  name: string;
  size?: number;
  bg?: string;
  fg?: string;
  ring?: string;
}) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.34), fontWeight: 500, flexShrink: 0,
      fontFamily: font.body, border: ring ? `2px solid ${ring}` : undefined,
    }}>
      {toInitials(name)}
    </span>
  );
}

/** Sparkline SVG à courbe fluide, avec point terracotta en fin de courbe. */
export function Sparkline({ values, width = 200, height = 34, stroke = c.spark }: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values || values.length < 2) {
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={c.hairline} strokeWidth="1.5" />
        {values?.length === 1 && <circle cx={width} cy={height / 2} r="3" fill={c.terracotta} />}
      </svg>
    );
  }

  const pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));

  // Catmull-Rom → cubic Bézier pour une courbe douce.
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last.x} cy={last.y} r="3" fill={c.terracotta} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
