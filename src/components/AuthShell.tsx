import Link from "next/link";
import { Logo } from "@/components/Logo";
import { c, font } from "@/lib/theme";

/** Carte centrée réutilisée par les pages login / signup. */
export function AuthShell({ title, sub, children, footer }: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: c.cream, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .4s ease both" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Link href="/"><Logo size={28} /></Link>
        </div>
        <div className="card" style={{ padding: "32px 28px" }}>
          <h1 style={{ fontFamily: font.display, fontSize: 25, color: c.ink, marginBottom: 6 }}>{title}</h1>
          {sub && <p style={{ color: c.muted, fontSize: 14.5, marginBottom: 24 }}>{sub}</p>}
          {children}
        </div>
        {footer && <p style={{ textAlign: "center", fontSize: 14, color: c.muted, marginTop: 20 }}>{footer}</p>}
      </div>
    </div>
  );
}

/** Champ de formulaire contrôlé, aligné sur le design system (.input). */
export function Field({ label, type, value, onChange, placeholder, autoComplete }: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">{label}</label>
      <input
        className="input"
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
