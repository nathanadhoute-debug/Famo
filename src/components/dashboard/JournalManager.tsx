"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline } from "@/components/dashboard/editorial";
import { timeAgo } from "@/lib/format";
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
const TAG_COLOR: Record<string, string> = {
  urgence: c.danger, santé: c.sage700, rdv: c.terracotta, humeur: c.amber,
  repas: "#6B8E9E", "médicament": "#8E6B9E", note: c.eyebrow,
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

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

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
    <div>
      {/* Composer */}
      <Eyebrow>Nouvelle note</Eyebrow>
      <textarea className="textarea" value={content} placeholder="Comment s'est passée la journée ?"
        onChange={(e) => setContent(e.target.value)}
        style={{ marginTop: 12, background: c.card, border: `1px solid ${c.hairline}` }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, margin: "12px 0" }}>
        {TAGS.map((t) => {
          const active = tags.includes(t);
          const col = TAG_COLOR[t] ?? c.sage700;
          return (
            <button key={t} type="button" onClick={() => toggleTag(t)}
              style={{ cursor: "pointer", padding: "5px 12px", fontSize: 12.5, borderRadius: 999, fontFamily: font.body,
                background: active ? col : "transparent", color: active ? "#fff" : col, border: `1px solid ${active ? col : c.hairline}` }}>
              {t}
            </button>
          );
        })}
      </div>
      {error && <p style={{ color: c.danger, fontSize: 13.5, marginBottom: 10 }}>{error}</p>}
      <button className="btn btn-primary" onClick={submit} disabled={pending} style={{ borderRadius: 9 }}>
        {pending ? "Publication…" : "Publier la note"}
      </button>

      <Hairline margin="30px 0 24px" />

      {/* Fil */}
      {initial.length === 0 ? (
        <p style={{ fontSize: 14.5, color: c.sub, lineHeight: 1.6 }}>Le journal est vide. Partagez la première nouvelle du quotidien.</p>
      ) : (
        <div style={{ display: "grid", gap: 26 }}>
          {initial.map((e, i) => {
            const canDelete = e.author_id === currentUserId || isAdmin;
            return (
              <div key={e.id} style={{ borderLeft: `2px solid ${i === 0 ? c.sage700 : c.hairline}`, paddingLeft: 18, opacity: i === 0 ? 1 : 0.6 }}>
                <p style={{ fontFamily: font.display, fontStyle: "italic", fontSize: 20, fontWeight: 400, lineHeight: 1.55, color: c.sage900, margin: 0 }}>
                  «&nbsp;{e.content}&nbsp;»
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 12.5, color: c.eyebrow }}>
                    {e.author_id === currentUserId ? "Vous" : e.authorName} · {timeAgo(e.created_at)}
                  </span>
                  {e.tags.map((t) => {
                    const col = TAG_COLOR[t] ?? c.sage700;
                    return <span key={t} style={{ fontSize: 11, color: col, border: `1px solid ${col}44`, borderRadius: 999, padding: "1px 8px" }}>{t}</span>;
                  })}
                  {canDelete && (
                    <button onClick={() => remove(e.id)} disabled={pending} aria-label="Supprimer"
                      style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 2 }}>
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
