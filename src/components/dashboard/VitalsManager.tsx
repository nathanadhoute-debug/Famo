"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline, Sparkline } from "@/components/dashboard/editorial";
import { parseNumeric, timeAgo } from "@/lib/format";
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
  { label: "Tension", unit: "mmHg", icon: "droplet" },
  { label: "Poids", unit: "kg", icon: "scale" },
  { label: "Glycémie", unit: "g/L", icon: "droplet" },
  { label: "Température", unit: "°C", icon: "temperature" },
  { label: "Pouls", unit: "bpm", icon: "heartbeat" },
  { label: "Saturation", unit: "%", icon: "activity" },
];

function iconFor(label: string): string {
  const p = PRESETS.find((x) => x.label.toLowerCase() === label.toLowerCase());
  return p?.icon ?? "activity";
}

export function VitalsManager({ initial, familyId, parentId }: {
  initial: Vital[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ label: "", value: "", unit: "" });
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // Regroupe par intitulé pour les indicateurs en vedette.
  const groups = useMemo(() => {
    const map = new Map<string, Vital[]>();
    for (const v of initial) {
      const arr = map.get(v.label) ?? [];
      arr.push(v);
      map.set(v.label, arr);
    }
    return Array.from(map.entries()).map(([label, rows]) => {
      const latest = rows[0];
      const history = rows.map((r) => parseNumeric(r.value)).filter((n): n is number => n !== null).reverse();
      return { label, latest, history };
    });
  }, [initial]);

  const pickPreset = (p: typeof PRESETS[number]) =>
    setForm((f) => ({ ...f, label: p.label, unit: p.unit }));

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!form.label.trim() || !form.value.trim()) { setError("Intitulé et valeur requis."); return; }
    setError("");
    start(async () => {
      const res = await addVital({ familyId, parentId, label: form.label, value: form.value, unit: form.unit });
      if (!res.ok) return setError(res.error);
      setForm({ label: "", value: "", unit: "" });
      setOpen(false);
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
    <div>
      {/* Indicateurs en vedette */}
      {groups.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0 }}>
          {groups.slice(0, 4).map((g, i) => (
            <div key={g.label} style={{
              padding: "18px 26px 22px",
              borderRight: `1px solid ${c.hairline}`,
              borderTop: i >= 2 ? `1px solid ${c.hairline}` : undefined,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: c.eyebrow, marginBottom: 10 }}>
                <Icon name={iconFor(g.label)} size={14} />
                <Eyebrow>{g.label}</Eyebrow>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                <span style={{ fontFamily: font.display, fontSize: 40, fontWeight: 300, color: c.sage900, lineHeight: 1 }}>
                  {parseNumeric(g.latest.value) ?? g.latest.value}
                </span>
                {g.latest.unit && <span style={{ fontSize: 12.5, color: c.eyebrow }}>{g.latest.unit}</span>}
              </div>
              <Sparkline values={g.history} height={30} />
              <p style={{ fontSize: 11.5, color: c.eyebrow, margin: "10px 0 0" }}>{timeAgo(g.latest.recorded_at)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 15, color: c.sub, lineHeight: 1.6, padding: "8px 0 20px" }}>
          Aucun indicateur enregistré. Ajoutez une première mesure ci-dessous.
        </p>
      )}

      <Hairline margin="26px 0" />

      {/* Ajout */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Nouvelle mesure</Eyebrow>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Ajouter
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {PRESETS.map((p) => {
              const active = form.label === p.label;
              return (
                <button key={p.label} type="button" onClick={() => pickPreset(p)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "6px 12px", borderRadius: 999, fontSize: 13, fontFamily: font.body,
                    background: active ? c.sage700 : "transparent", color: active ? "#fff" : c.sageSoft,
                    border: `1px solid ${active ? c.sage700 : c.hairline}`,
                  }}>
                  <Icon name={p.icon} size={13} /> {p.label}
                </button>
              );
            })}
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

      {/* Historique */}
      {initial.length > 0 && (
        <>
          <Hairline margin="26px 0" />
          <Eyebrow>Historique</Eyebrow>
          <div style={{ marginTop: 6 }}>
            {initial.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: `1px solid ${c.hairline}` }}>
                <span style={{ color: c.sageSoft, display: "flex" }}><Icon name={iconFor(v.label)} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: c.sage900, margin: 0, fontWeight: 500 }}>{v.label}</p>
                  <p style={{ fontSize: 12, color: c.eyebrow, margin: "2px 0 0" }}>
                    {new Date(v.recorded_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                  </p>
                </div>
                <p style={{ fontFamily: font.display, fontSize: 19, fontWeight: 400, color: c.sage900, margin: 0 }}>
                  {parseNumeric(v.value) ?? v.value}<span style={{ fontSize: 12, color: c.eyebrow }}> {v.unit ?? ""}</span>
                </p>
                <button onClick={() => remove(v.id)} disabled={pending} aria-label="Supprimer"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
