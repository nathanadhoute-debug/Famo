"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow } from "@/components/dashboard/editorial";
import { RelaisCalendar } from "@/components/dashboard/RelaisCalendar";
import { DateTimePicker } from "@/components/DateTimePicker";
import { addVisit, deleteVisit } from "@/lib/actions/visits";

type Visit = { id: string; visit_date: string; note: string | null };

/**
 * Un professionnel qui passe à domicile (aide-soignant, infirmier, kiné,
 * autre) peut programmer sa propre date de passage — jamais assigner
 * quelqu'un d'autre, jamais voir le reste du planning familial. Sa visite
 * apparaît ensuite normalement sur le Relais que la famille voit.
 */
export function ProfessionalVisitScheduler({ initial, familyId, parentId }: {
  initial: Visit[];
  familyId: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!parentId) { setError("Aucun proche sélectionné."); return; }
    if (!date) { setError("Choisissez une date."); return; }
    setError("");
    start(async () => {
      const visitDate = new Date(date).toISOString();
      const res = await addVisit({ familyId, parentId, visitDate, note });
      if (!res.ok) return setError(res.error);
      setDate(""); setNote(""); setOpen(false);
      router.refresh();
    });
  };

  const cancel = (id: string) => {
    start(async () => {
      const res = await deleteVisit(id);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  // initial contient tout l'historique (pour alimenter RelaisCalendar) — la
  // liste ci-dessous ne montre que ce qui reste à venir, comme auparavant.
  const now0 = new Date(); now0.setHours(0, 0, 0, 0);
  const upcoming = initial.filter((v) => new Date(v.visit_date) >= now0);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Mon prochain passage</Eyebrow>
        {!open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Programmer
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="field-label">Date & heure</label>
              <DateTimePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="field-label">Note <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
              <input className="input" value={note} placeholder="Séance, soin…" onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={submit} disabled={pending} style={{ borderRadius: 9 }}>
              {pending ? "Enregistrement…" : "Programmer"}
            </button>
            <button className="btn" onClick={() => { setOpen(false); setError(""); }} style={{ background: "transparent", color: c.sub, borderRadius: 9 }}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {error && !open && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{error}</p>}

      {initial.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 6 }}>
          <RelaisCalendar
            visits={initial.map((v) => ({ visit_date: v.visit_date, visitorName: "Vous" }))}
          />
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {upcoming.map((v) => {
            const d = new Date(v.visit_date);
            return (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${c.hairline}` }}>
                <span style={{ fontFamily: font.display, fontSize: 14.5, color: c.sage900, flex: 1 }}>
                  {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                  {" · "}{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
                  {v.note ? ` · ${v.note}` : ""}
                </span>
                <button onClick={() => cancel(v.id)} disabled={pending} aria-label="Annuler"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
