import { font } from "@/lib/theme";

/** Logo Famō — pictogramme feuille dans un carré vert + mot-symbole. */
export function Logo({ size = 26, color = "#233F36", mark = "#3A6B5E", light = false }: {
  size?: number;
  color?: string;
  mark?: string;
  light?: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill={light ? "#fff" : mark} />
        <path
          d="M14 21c-.35 0-.7-.13-.96-.37C9.9 17.4 7.75 15.4 7.75 13 7.75 11.07 9.3 9.5 11.2 9.5c1.04 0 2.04.5 2.8 1.3.76-.8 1.76-1.3 2.8-1.3 1.9 0 3.45 1.57 3.45 3.5 0 2.4-2.15 4.4-5.29 7.13-.26.24-.6.37-.96.37z"
          fill={light ? mark : "#fff"}
        />
      </svg>
      <span style={{ fontFamily: font.display, fontSize: size * 0.76, fontWeight: 600, color, letterSpacing: "-0.01em" }}>
        Famō
      </span>
    </span>
  );
}
