"use client";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline } from "@/components/dashboard/editorial";
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
const CAT_COLOR: Record<string, string> = {
  Ordonnance: c.sage700, Analyse: c.terracotta, "Compte-rendu": "#6B8E9E",
  Identité: "#8E6B9E", Assurance: c.amber, Autre: c.eyebrow,
};

function humanSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}
function kind(mime: string | null) {
  if (!mime) return "Fichier";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.includes("word")) return "Word";
  return "Fichier";
}

export function DocumentsManager({ initial, familyId, parentId }: {
  initial: Doc[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
      setLabel(""); setFileName(""); setOpen(false);
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
    <div>
      {/* Ajouter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Coffre-fort · {initial.length} document{initial.length > 1 ? "s" : ""}</Eyebrow>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Ajouter
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label className="field-label">Intitulé <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
              <input className="input" value={label} placeholder="Ordonnance cardiologue" onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Catégorie</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", border: `1.5px dashed ${c.hairline}`, borderRadius: 12, background: c.card, color: fileName ? c.sage900 : c.sub }}>
            <Icon name="paperclip" size={18} />
            <span style={{ fontSize: 14, flex: 1 }}>{fileName || "Choisir un fichier (max 15 Mo)"}</span>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </label>
          {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={submit} disabled={pending} style={{ borderRadius: 9 }}>{pending ? "Envoi…" : "Téléverser"}</button>
            <button className="btn" onClick={() => { setOpen(false); setError(""); }} style={{ background: "transparent", color: c.sub, borderRadius: 9 }}>Annuler</button>
          </div>
        </div>
      )}
      {error && !open && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}

      <Hairline margin="26px 0 4px" />

      {/* Liste */}
      {initial.length === 0 ? (
        <p style={{ fontSize: 14.5, color: c.sub, lineHeight: 1.6, marginTop: 22 }}>
          Aucun document. Vos ordonnances, analyses et papiers importants apparaîtront ici.
        </p>
      ) : (
        <div>
          {initial.map((d) => {
            const col = CAT_COLOR[d.category] ?? c.eyebrow;
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: `1px solid ${c.hairline}` }}>
                <span style={{ color: c.sageSoft, display: "flex" }}><Icon name="file-text" size={20} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: c.sage900, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</p>
                  <p style={{ fontSize: 12.5, color: c.sub, margin: "2px 0 0" }}>
                    {kind(d.mime_type)}{d.file_size ? ` · ${humanSize(d.file_size)}` : ""} · ajouté {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <span style={{ fontSize: 11.5, color: col }}>{d.category}</span>
                <button onClick={() => download(d.id)} disabled={busyId === d.id} aria-label="Ouvrir"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.sageSoft, display: "flex", padding: 4 }}>
                  <Icon name="download" size={18} />
                </button>
                <button onClick={() => remove(d.id)} disabled={busyId === d.id} aria-label="Supprimer"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
