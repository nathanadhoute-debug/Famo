"use client";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { initials } from "@/lib/format";

type ParentLite = { id: string; name: string };

/**
 * Sélecteur de proche affiché uniquement s'il y en a plus d'un dans le
 * cercle — ne change rien à l'affichage tant qu'un seul proche existe.
 * Le choix est mémorisé côté client via un cookie lu par getCurrentFamily().
 */
export function ParentSwitcher({ parents, activeId }: { parents: ParentLite[]; activeId: string }) {
  const router = useRouter();
  if (parents.length < 2) return null;

  const select = (id: string) => {
    if (id === activeId) return;
    document.cookie = `active_parent_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {parents.map((p) => {
        const active = p.id === activeId;
        return (
          <button key={p.id} type="button" onClick={() => select(p.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
              padding: "6px 12px 6px 6px", borderRadius: 999, fontSize: 13.5, fontFamily: font.body,
              background: active ? "rgba(244,242,236,0.14)" : "transparent",
              color: active ? "#F4F2EC" : "#B7C6BC",
              border: `1px solid ${active ? "rgba(244,242,236,0.3)" : "rgba(244,242,236,0.14)"}`,
            }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%", background: active ? c.terracotta : "rgba(244,242,236,0.16)",
              color: "#fff", fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", flexShrink: 0,
            }}>{initials(p.name)}</span>
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
