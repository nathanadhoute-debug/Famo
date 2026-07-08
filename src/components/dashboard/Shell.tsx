"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { c, font } from "@/lib/theme";

const NAV = [
  { href: "/dashboard",           label: "Accueil",   icon: "home" },
  { href: "/dashboard/sante",     label: "Santé",     icon: "activity" },
  { href: "/dashboard/relais",    label: "Relais",    icon: "users" },
  { href: "/dashboard/journal",   label: "Journal",   icon: "book" },
  { href: "/dashboard/documents", label: "Documents", icon: "folder" },
  { href: "/dashboard/reglages",  label: "Réglages",  icon: "settings" },
];

export function Shell({
  familyName, parentName, userName, children,
}: {
  familyName: string;
  parentName: string | null;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const nav = (
    <nav style={{ display: "grid", gap: 4 }}>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 12,
              fontSize: 15, fontWeight: active ? 600 : 500,
              color: active ? "#fff" : "rgba(255,255,255,.72)",
              background: active ? "rgba(255,255,255,.14)" : "transparent",
              transition: "background .15s, color .15s",
            }}
          >
            <Icon name={item.icon} size={19} stroke={active ? 1.9 : 1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 20 }}>
      <div style={{ marginBottom: 26, paddingLeft: 6 }}>
        <Logo size={26} color="#fff" mark={c.sage700} light />
      </div>
      <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "12px 14px", marginBottom: 22 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginBottom: 2 }}>Cercle</p>
        <p style={{ fontFamily: font.display, fontSize: 16, color: "#fff", fontWeight: 600 }}>{familyName}</p>
        {parentName && <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.6)", marginTop: 2 }}>Proche · {parentName}</p>}
      </div>
      {nav}
      <div style={{ marginTop: "auto" }}>
        <Link href="/dashboard/reglages" onClick={() => setOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 12 }}>
          <span style={{
            width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.16)", color: "#fff",
            display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>{initials}</span>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: c.creamPage }}>
      <style>{`
        .dash-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 250px;
          background: ${c.sage900}; z-index: 40; }
        .dash-main { margin-left: 250px; min-height: 100vh; }
        .dash-topbar { display: none; }
        .dash-scrim { display: none; }
        @media (max-width: 880px) {
          .dash-sidebar { transform: translateX(-100%); transition: transform .25s ease; box-shadow: 0 0 40px rgba(0,0,0,.3); }
          .dash-sidebar.is-open { transform: translateX(0); }
          .dash-main { margin-left: 0; }
          .dash-topbar { display: flex; }
          .dash-scrim.is-open { display: block; position: fixed; inset: 0; background: rgba(30,56,48,.4); z-index: 35; }
        }
      `}</style>

      {/* Barre du haut (mobile) */}
      <div className="dash-topbar" style={{
        position: "sticky", top: 0, zIndex: 30, height: 58, alignItems: "center", gap: 12,
        padding: "0 16px", background: "rgba(249,247,240,.9)", backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${c.hairline}`,
      }}>
        <button onClick={() => setOpen(true)} aria-label="Menu" style={{
          background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", color: c.sage900,
        }}>
          <Icon name="menu" size={22} />
        </button>
        <Logo size={22} />
      </div>

      <aside className={`dash-sidebar${open ? " is-open" : ""}`}>{sidebarInner}</aside>
      <div className={`dash-scrim${open ? " is-open" : ""}`} onClick={() => setOpen(false)} />

      <main className="dash-main">{children}</main>
    </div>
  );
}

/** En-tête de page réutilisable dans le dashboard. */
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 26, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: font.display, fontSize: 30, color: c.sage900 }}>{title}</h1>
        {subtitle && <p style={{ color: c.muted, fontSize: 15, marginTop: 6 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
