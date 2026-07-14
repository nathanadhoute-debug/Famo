"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline, Avatar } from "@/components/dashboard/editorial";
import { mondayOf, parisDateKey } from "@/lib/format";
import { addVisit, deleteVisit } from "@/lib/actions/visits";

type Visit = { id: string; visit_date: string; note: string | null; visitor_id: string | null };
type Member = { userId: string; name: string };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function VisitsManager({ initial, members, familyId, parentId, currentUserId }: {
  initial: Visit[];
  members: Member[];
  familyId: string;
  parentId: string | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ date: "", visitorId: currentUserId, note: "" });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const nameFor = (id: string | null) =>
    id ? (id === currentUserId ? "Vous" : members.find((m) => m.userId === id)?.name ?? "Membre") : "Visite";

  const now = new Date();
  const monday = mondayOf(now);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const v = initial.find((x) => parisDateKey(new Date(x.visit_date)) === parisDateKey(d));
    return { date: d, weekday: WEEKDAYS[i], isToday: parisDateKey(d) === parisDateKey(now), name: v ? nameFor(v.visitor_id) : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [initial]);
  const assignedIdx = days.map((d, i) => (d.name ? i : -1)).filter((i) => i >= 0);

  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const upcoming = initial.filter((v) => new Date(v.visit_date) >= today0).sort((a, b) => +new Date(a.visit_date) - +new Date(b.visit_date));
  const past = initial.filter((v) => new Date(v.visit_date) < today0);

  const submit = () => {
    if (!parentId) { setError("Ajoutez d'abord un proche dans le cercle."); return; }
    if (!form.date) { setError("Choisissez une date."); return; }
    setError("");
    start(async () => {
      // form.date (datetime-local) est une heure locale sans fuseau : new Date()
      // l'interprète dans le fuseau du navigateur, .toISOString() la convertit
      // en instant UTC correct avant l'envoi au serveur.
      const visitDate = new Date(form.date).toISOString();
      const res = await addVisit({ familyId, parentId, visitDate, visitorId: form.visitorId || null, note: form.note });
      if (!res.ok) return setError(res.error);
      setForm({ date: "", visitorId: currentUserId, note: "" });
      setOpen(false);
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

  return (
    <div>
      {/* Timeline de la semaine */}
      <Eyebrow>Cette semaine</Eyebrow>
      <div style={{ position: "relative", padding: "18px 0 6px", marginBottom: 4 }}>
        <div style={{ position: "absolute", top: 38, left: `${(0.5 / 7) * 100}%`, width: `${(6 / 7) * 100}%`, height: 1, background: "#E6E0CE" }} />
        {assignedIdx.length >= 2 && (
          <div style={{ position: "absolute", top: 38, left: `${((assignedIdx[0] + 0.5) / 7) * 100}%`, width: `${((assignedIdx[assignedIdx.length - 1] - assignedIdx[0]) / 7) * 100}%`, height: 1, background: c.sage700 }} />
        )}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              {d.name ? (
                <Avatar name={d.name} size={40} bg={d.isToday ? c.terracotta : c.sage700} ring={d.isToday ? c.terracotta : undefined} />
              ) : (
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: c.creamPage, border: `1.5px dashed ${d.isToday ? c.terracotta : "#E1DAC4"}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: d.isToday ? c.terracotta : "#C7BFA6" }}>
                  <Icon name="plus" size={14} />
                </span>
              )}
              <span style={{ fontSize: 11, color: d.isToday ? c.terracotta : c.eyebrow, fontWeight: d.isToday ? 500 : 400 }}>{d.isToday ? "Auj." : d.weekday}</span>
            </div>
          ))}
        </div>
      </div>

      <Hairline margin="24px 0" />

      {/* Programmer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Programmer une visite</Eyebrow>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Ajouter
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="field-label">Date & heure</label>
              <input className="input" type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Qui passe ?</label>
              <select className="select" value={form.visitorId} onChange={(e) => setForm((f) => ({ ...f, visitorId: e.target.value }))}>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.userId === currentUserId ? `${m.name} (moi)` : m.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="field-label">Note <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
            <input className="input" value={form.note} placeholder="Rendez-vous médecin, courses…" onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={submit} disabled={pending} style={{ borderRadius: 9 }}>{pending ? "Enregistrement…" : "Programmer"}</button>
            <button className="btn" onClick={() => { setOpen(false); setError(""); }} style={{ background: "transparent", color: c.sub, borderRadius: 9 }}>Annuler</button>
          </div>
        </div>
      )}
      {error && !open && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{error}</p>}

      <VisitList title="À venir" visits={upcoming} nameFor={nameFor} remove={remove} pending={pending} empty="Aucune visite à venir." />
      {past.length > 0 && <VisitList title="Passées" visits={past} nameFor={nameFor} remove={remove} pending={pending} muted />}
    </div>
  );
}

function VisitList({ title, visits, nameFor, remove, pending, empty, muted }: {
  title: string;
  visits: Visit[];
  nameFor: (id: string | null) => string;
  remove: (id: string) => void;
  pending: boolean;
  empty?: string;
  muted?: boolean;
}) {
  return (
    <div style={{ marginTop: 28, opacity: muted ? 0.62 : 1 }}>
      <Eyebrow>{title}</Eyebrow>
      {visits.length === 0 ? (
        <p style={{ fontSize: 14, color: c.sub, margin: "12px 0 0" }}>{empty}</p>
      ) : (
        <div style={{ marginTop: 6 }}>
          {visits.map((v) => {
            const d = new Date(v.visit_date);
            return (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: `1px solid ${c.hairline}` }}>
                <div style={{ width: 46, flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: c.eyebrow, textTransform: "uppercase" }}>{d.toLocaleDateString("fr-FR", { month: "short", timeZone: "Europe/Paris" })}</div>
                  <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 400, color: c.sage900, lineHeight: 1.1 }}>{Number(parisDateKey(d).slice(8))}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: c.sage900, margin: 0 }}>{nameFor(v.visitor_id)}</p>
                  <p style={{ fontSize: 12.5, color: c.sub, margin: "2px 0 0" }}>
                    {d.toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" })} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}{v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <button onClick={() => remove(v.id)} disabled={pending} aria-label="Annuler" style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
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
