"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { addVisit, deleteVisit } from "@/lib/actions/visits";

type Visit = {
  id: string;
  visit_date: string;
  note: string | null;
  visitor_id: string | null;
};
type Member = { userId: string; name: string };

export function VisitsManager({ initial, members, familyId, parentId, currentUserId }: {
  initial: Visit[];
  members: Member[];
  familyId: string;
  parentId: string | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ date: "", visitorId: currentUserId, note: "" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const nameFor = (id: string | null) =>
    id ? (members.find((m) => m.userId === id)?.name ?? "Membre") : "Visite";

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!form.date) { setError("Choisissez une date."); return; }
    setError("");
    start(async () => {
      const res = await addVisit({
        familyId, parentId, visitDate: form.date,
        visitorId: form.visitorId || null, note: form.note,
      });
      if (!res.ok) return setError(res.error);
      setForm({ date: "", visitorId: currentUserId, note: "" });
      router.refresh();
    });
  };

  const remove = (id: string) => {
    start(async () => {
      const res = await deleteVisit(id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  const now = new Date();
  const upcoming = initial.filter((v) => new Date(v.visit_date) >= new Date(now.toDateString()));
  const past = initial.filter((v) => new Date(v.visit_date) < new Date(now.toDateString()));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 22 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Programmer une visite</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="field-label">Date & heure</label>
            <input className="input" type="datetime-local" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="field-label">Qui passe ?</label>
            <select className="select" value={form.visitorId}
              onChange={(e) => setForm((f) => ({ ...f, visitorId: e.target.value }))}>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.userId === currentUserId ? `${m.name} (moi)` : m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="field-label">Note <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
          <input className="input" value={form.note} placeholder="Courses, rendez-vous médecin…"
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={pending}>
          {pending ? "Enregistrement…" : "Programmer"}
        </button>
      </div>

      <VisitGroup title="À venir" visits={upcoming} nameFor={nameFor} remove={remove} pending={pending} empty="Aucune visite à venir." />
      {past.length > 0 && (
        <VisitGroup title="Passées" visits={past} nameFor={nameFor} remove={remove} pending={pending} muted />
      )}
    </div>
  );
}

function VisitGroup({ title, visits, nameFor, remove, pending, empty, muted }: {
  title: string;
  visits: Visit[];
  nameFor: (id: string | null) => string;
  remove: (id: string) => void;
  pending: boolean;
  empty?: string;
  muted?: boolean;
}) {
  return (
    <div className="card" style={{ padding: 22, opacity: muted ? 0.85 : 1 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>{title}</h2>
      {visits.length === 0 ? (
        <p style={{ color: c.muted, fontSize: 14.5 }}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {visits.map((v) => {
            const d = new Date(v.visit_date);
            return (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream, borderRadius: 12, padding: "11px 12px" }}>
                <div style={{ width: 48, flexShrink: 0, textAlign: "center", background: "#fff", borderRadius: 10, padding: "6px 0", border: `1px solid ${c.line}` }}>
                  <div style={{ fontSize: 11, color: c.muted, textTransform: "uppercase" }}>{d.toLocaleDateString("fr-FR", { month: "short" })}</div>
                  <div style={{ fontFamily: font.display, fontSize: 18, color: c.sage900, fontWeight: 600 }}>{d.getDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: c.ink }}>{nameFor(v.visitor_id)}</p>
                  <p style={{ fontSize: 12.5, color: c.muted }}>
                    {d.toLocaleDateString("fr-FR", { weekday: "long" })} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    {v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <button onClick={() => remove(v.id)} disabled={pending} aria-label="Annuler"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.muted, fontSize: 18, padding: 4 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
