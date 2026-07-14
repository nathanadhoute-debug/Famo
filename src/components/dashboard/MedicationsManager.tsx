"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline } from "@/components/dashboard/editorial";
import { addMedication, deactivateMedication } from "@/lib/actions/health";

const CATEGORIES = ["Cardiologie", "Diabète", "Antalgique", "Neurologie", "Pneumologie", "Rhumatologie", "Autre"];

type Medication = {
  id: string;
  name: string;
  dose: string;
  category: string;
  critical: boolean;
  rx_label: string | null;
  rx_expires_at: string | null;
  medication_schedules: { id: string; scheduled_time: string }[];
};

const emptyForm = { name: "", dose: "", category: "Autre", critical: false, rxLabel: "", rxExpiresAt: "", times: "" };

export function MedicationsManager({ initial, familyId, parentId }: {
  initial: Medication[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    setError("");
    start(async () => {
      const res = await addMedication({
        familyId,
        parentId,
        name: form.name,
        dose: form.dose,
        category: form.category,
        critical: form.critical,
        rxLabel: form.rxLabel,
        rxExpiresAt: form.rxExpiresAt || undefined,
        times: form.times.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (!res.ok) return setError(res.error);
      setForm(emptyForm);
      setOpen(false);
      router.refresh();
    });
  };

  const deactivate = (id: string) => {
    start(async () => {
      const res = await deactivateMedication(id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  return (
    <div>
      {initial.length > 0 ? (
        <div>
          {initial.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderTop: `1px solid ${c.hairline}` }}>
              <span style={{ color: c.sageSoft, display: "flex", marginTop: 2 }}><Icon name="pill" size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14.5, color: c.sage900, margin: 0, fontWeight: 500 }}>
                  {m.name} <span style={{ color: c.muted, fontWeight: 400 }}>· {m.dose}</span>
                  {m.critical && <span style={{ marginLeft: 6, color: c.danger, fontSize: 12 }}>●</span>}
                </p>
                <p style={{ fontSize: 12, color: c.eyebrow, margin: "3px 0 0" }}>
                  {m.category}
                  {m.medication_schedules.length > 0 && ` · ${m.medication_schedules.map((s) => s.scheduled_time.slice(0, 5)).join(", ")}`}
                  {m.rx_expires_at && ` · Ordonnance jusqu'au ${new Date(m.rx_expires_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`}
                </p>
              </div>
              <button onClick={() => deactivate(m.id)} disabled={pending} aria-label="Désactiver"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                <Icon name="x" size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 15, color: c.sub, lineHeight: 1.6, padding: "8px 0 20px" }}>
          Aucun médicament suivi. Ajoutez-en un ci-dessous.
        </p>
      )}

      <Hairline margin="26px 0" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Nouveau médicament</Eyebrow>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Ajouter
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
            <div>
              <label className="field-label">Nom</label>
              <input className="input" value={form.name} placeholder="Doliprane"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Dose</label>
              <input className="input" value={form.dose} placeholder="500mg"
                onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <label className="field-label">Catégorie</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Horaires (ex : 08:00, 20:00)</label>
              <input className="input" value={form.times} placeholder="08:00, 20:00"
                onChange={(e) => setForm((f) => ({ ...f, times: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginTop: 10 }}>
            <div>
              <label className="field-label">Ordonnance (libellé, optionnel)</label>
              <input className="input" value={form.rxLabel} placeholder="Dr Martin — 12/06/2026"
                onChange={(e) => setForm((f) => ({ ...f, rxLabel: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Expiration ordonnance</label>
              <input className="input" type="date" value={form.rxExpiresAt}
                onChange={(e) => setForm((f) => ({ ...f, rxExpiresAt: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13.5, color: c.sub, cursor: "pointer" }}>
            <input type="checkbox" checked={form.critical}
              onChange={(e) => setForm((f) => ({ ...f, critical: e.target.checked }))} />
            Médicament critique (ne jamais oublier)
          </label>
          {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={submit} disabled={pending} style={{ borderRadius: 9 }}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button className="btn" onClick={() => { setOpen(false); setError(""); }} style={{ background: "transparent", color: c.sub, borderRadius: 9 }}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {error && !open && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
    </div>
  );
}
