"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { addEntry, deleteEntry } from "@/lib/actions/journal";

type Entry = {
  id: string;
  content: string;
  tags: string[];
  created_at: string;
  author_id: string;
  authorName: string;
};

const TAGS = ["santé", "rdv", "humeur", "repas", "urgence", "note", "médicament"] as const;
const TAG_STYLE: Record<string, string> = {
  urgence: "#B04B3C", santé: "#4C8272", rdv: "#C97C5D", humeur: "#D9A05B",
  repas: "#6B8E9E", "médicament": "#8E6B9E", note: "#66756F",
};

export function JournalManager({ initial, familyId, parentId, currentUserId, isAdmin }: {
  initial: Entry[];
  familyId: string;
  parentId: string | null;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!content.trim()) { setError("Écrivez quelque chose."); return; }
    setError("");
    start(async () => {
      const res = await addEntry({ familyId, parentId, content, tags });
      if (!res.ok) return setError(res.error);
      setContent(""); setTags([]);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    start(async () => {
      const res = await deleteEntry(id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 14 }}>Nouvelle note</h2>
        <textarea className="textarea" value={content} placeholder="Comment s'est passée la journée ?"
          onChange={(e) => setContent(e.target.value)} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
          {TAGS.map((t) => {
            const active = tags.includes(t);
            const col = TAG_STYLE[t] ?? c.sage700;
            return (
              <button key={t} type="button" onClick={() => toggleTag(t)} className="badge"
                style={{ cursor: "pointer", padding: "6px 12px", fontSize: 13,
                  background: active ? col : "#fff", color: active ? "#fff" : col,
                  border: `1px solid ${active ? col : c.line}` }}>
                {t}
              </button>
            );
          })}
        </div>
        {error && <p style={{ color: c.danger, fontSize: 13.5, marginBottom: 10 }}>{error}</p>}
        <button className="btn btn-primary" onClick={submit} disabled={pending}>
          {pending ? "Enregistrement…" : "Publier la note"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {initial.length === 0 ? (
          <div className="card" style={{ padding: 22 }}>
            <p style={{ color: c.muted, fontSize: 14.5 }}>Le journal est vide. Partagez la première note.</p>
          </div>
        ) : (
          initial.map((e) => {
            const canDelete = e.author_id === currentUserId || isAdmin;
            return (
              <div key={e.id} className="card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 999, background: c.sage050, color: c.sage700, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>
                    {e.authorName.slice(0, 2).toUpperCase()}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.ink }}>{e.authorName}</p>
                    <p style={{ fontSize: 12, color: c.muted }}>
                      {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {canDelete && (
                    <button onClick={() => remove(e.id)} disabled={pending} aria-label="Supprimer"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: c.muted, fontSize: 18 }}>×</button>
                  )}
                </div>
                <p style={{ fontSize: 15, color: c.ink, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{e.content}</p>
                {e.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {e.tags.map((t) => {
                      const col = TAG_STYLE[t] ?? c.sage700;
                      return <span key={t} className="badge" style={{ background: "#fff", color: col, border: `1px solid ${col}33`, fontSize: 12 }}>{t}</span>;
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
