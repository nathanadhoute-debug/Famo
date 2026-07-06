"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { addVital, deleteVital } from "@/lib/actions/health";

type Vital = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  icon: string | null;
  recorded_at: string;
};

const PRESETS = [
  { label: "Tension",     unit: "mmHg",  icon: "🩸" },
  { label: "Poids",       unit: "kg",    icon: "⚖️" },
  { label: "Glycémie",    unit: "g/L",   icon: "🩸" },
  { label: "Température",  unit: "°C",    icon: "🌡️" },
  { label: "Pouls",       unit: "bpm",   icon: "❤️" },
  { label: "Saturation",  unit: "%",     icon: "🫁" },
];

export function VitalsManager({ initial, familyId, parentId }: {
  initial: Vital[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ label: "", value: "", unit: "", icon: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const pickPreset = (p: typeof PRESETS[number]) =>
    setForm((f) => ({ ...f, label: p.label, unit: p.unit, icon: p.icon }));

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!form.label.trim() || !form.value.trim()) { setError("Intitulé et valeur requis."); return; }
    setError("");
    start(async () => {
      const res = await addVital({ familyId, parentId, ...form });
      if (!res.ok) return setError(res.error);
      setForm({ label: "", value: "", unit: "", icon: "" });
      router.refresh();
    });
  };

  const remove = (id: string) => {
    start(async () => {
      const res = await deleteVital(id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Formulaire d'ajout */}
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Nouvel indicateur</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => pickPreset(p)}
              className="badge" style={{ cursor: "pointer", background: form.label === p.label ? c.sage700 : c.sage050, color: form.label === p.label ? "#fff" : c.sage700, padding: "6px 12px", fontSize: 13 }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr", gap: 10 }}>
          <div>
            <label className="field-label">Intitulé</label>
            <input className="input" value={form.label} placeholder="Tension"
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Valeur</label>
            <input className="input" value={form.value} placeholder="12.8"
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label className="field-label">Unité</label>
            <input className="input" value={form.unit} placeholder="mmHg"
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </div>
        </div>
        {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Historique */}
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Historique</h2>
        {initial.length === 0 ? (
          <p style={{ color: c.muted, fontSize: 14.5 }}>Aucun indicateur enregistré pour l'instant.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {initial.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream, borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{v.icon ?? "•"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: c.ink }}>{v.label}</p>
                  <p style={{ fontSize: 12.5, color: c.muted }}>
                    {new Date(v.recorded_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p style={{ fontFamily: font.display, fontSize: 20, color: c.sage900, fontWeight: 600 }}>
                  {v.value}<span style={{ fontSize: 13, color: c.muted, fontWeight: 400 }}> {v.unit ?? ""}</span>
                </p>
                <button onClick={() => remove(v.id)} disabled={pending} aria-label="Supprimer"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.muted, fontSize: 18, padding: 4 }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
