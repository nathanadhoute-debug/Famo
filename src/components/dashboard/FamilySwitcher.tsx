"use client";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { initials } from "@/lib/format";

type FamilyLite = { id: string; name: string };

/**
 * Sélecteur de cercle affiché uniquement si le compte connecté appartient à
 * plusieurs familles (typiquement un professionnel de santé invité par
 * plusieurs cercles avec le même compte) — même principe que ParentSwitcher.
 * Le choix est mémorisé côté client via un cookie lu par getCurrentFamily().
 */
export function FamilySwitcher({ families, activeId }: { families: FamilyLite[]; activeId: string }) {
  const router = useRouter();
  if (families.length < 2) return null;

  const select = (id: string) => {
    if (id === activeId) return;
    document.cookie = `active_family_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {families.map((f) => {
        const active = f.id === activeId;
        return (
          <button key={f.id} type="button" onClick={() => select(f.id)}
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
            }}>{initials(f.name)}</span>
            {f.name}
          </button>
        );
      })}
    </div>
  );
}
