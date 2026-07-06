"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { uploadDocument, getDocumentUrl, deleteDocument } from "@/lib/actions/documents";

type Doc = {
  id: string;
  label: string;
  category: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  uploaded_by: string | null;
};

const CATEGORIES = ["Ordonnance", "Analyse", "Compte-rendu", "Identité", "Assurance", "Autre"];

function humanSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}
function iconFor(mime: string | null) {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📕";
  return "📄";
}

export function DocumentsManager({ initial, familyId, parentId }: {
  initial: Doc[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const submit = () => {
    const file = fileRef.current?.files?.[0];
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!file) { setError("Sélectionnez un fichier."); return; }
    setError("");
    const fd = new FormData();
    fd.set("familyId", familyId);
    fd.set("parentId", parentId);
    fd.set("category", category);
    fd.set("label", label);
    fd.set("file", file);
    start(async () => {
      const res = await uploadDocument(fd);
      if (!res.ok) return setError(res.error);
      setLabel(""); setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  const download = async (id: string) => {
    setBusyId(id); setError("");
    const res = await getDocumentUrl(id);
    setBusyId(null);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank");
  };

  const remove = (id: string) => {
    setBusyId(id);
    start(async () => {
      const res = await deleteDocument(id);
      setBusyId(null);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Téléversement */}
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Ajouter un document</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label className="field-label">Intitulé <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
            <input className="input" value={label} placeholder="Ordonnance cardiologue"
              onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Catégorie</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <label className="field-label">Fichier <span style={{ fontWeight: 400 }}>(max 15 Mo)</span></label>
        <label style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer",
          border: `1.5px dashed ${c.line}`, borderRadius: 12, background: c.cream2,
        }}>
          <span style={{ fontSize: 22 }}>📎</span>
          <span style={{ fontSize: 14, color: fileName ? c.ink : c.muted, flex: 1 }}>
            {fileName || "Choisir un fichier à ajouter au coffre-fort"}
          </span>
          <input ref={fileRef} type="file" style={{ display: "none" }}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
        </label>

        {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={pending}>
          {pending ? "Envoi…" : "Téléverser"}
        </button>
      </div>

      {/* Coffre-fort */}
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Coffre-fort</h2>
        {initial.length === 0 ? (
          <p style={{ color: c.muted, fontSize: 14.5 }}>Aucun document. Vos ordonnances et papiers importants apparaîtront ici.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {initial.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream, borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 22 }}>{iconFor(d.mime_type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: c.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</p>
                  <p style={{ fontSize: 12.5, color: c.muted }}>
                    <span className="badge" style={{ padding: "1px 8px", fontSize: 11, marginRight: 6 }}>{d.category}</span>
                    {humanSize(d.file_size)} · {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => download(d.id)} disabled={busyId === d.id} className="btn btn-outline"
                  style={{ padding: "7px 12px", fontSize: 13 }}>
                  {busyId === d.id ? "…" : "Ouvrir"}
                </button>
                <button onClick={() => remove(d.id)} disabled={busyId === d.id} aria-label="Supprimer"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.muted, fontSize: 18 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
