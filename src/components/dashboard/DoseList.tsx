"use client";
import { useState, useTransition } from "react";
import { c } from "@/lib/theme";
import { toggleDose } from "@/lib/actions/health";

export type Dose = {
  id: string;
  med_name: string;
  med_dose: string;
  scheduled_time: string;
  given: boolean;
  is_overdue: boolean;
  critical: boolean;
  given_by_name: string | null;
};

export function DoseList({ initial }: { initial: Dose[] }) {
  const [doses, setDoses] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const flip = (d: Dose) => {
    const next = !d.given;
    setDoses((list) => list.map((x) => (x.id === d.id ? { ...x, given: next } : x)));
    setError("");
    start(async () => {
      const res = await toggleDose(d.id, next);
      if (!res.ok) {
        setError(res.error);
        setDoses((list) => list.map((x) => (x.id === d.id ? { ...x, given: !next } : x))); // rollback
      }
    });
  };

  if (doses.length === 0) {
    return <p style={{ color: c.muted, fontSize: 14.5 }}>Aucune prise prévue aujourd'hui.</p>;
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 8 }}>
        {doses.map((d) => {
          const time = d.scheduled_time?.slice(0, 5);
          const alert = !d.given && d.is_overdue;
          return (
            <button
              key={d.id}
              onClick={() => flip(d)}
              disabled={pending}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                padding: "11px 12px", borderRadius: 12, cursor: "pointer",
                background: alert ? "#FBEEEC" : c.cream,
                border: `1px solid ${alert ? "#EED3CE" : "transparent"}`,
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: d.given ? c.sage700 : "#fff",
                border: `1.5px solid ${d.given ? c.sage700 : c.line}`,
                display: "grid", placeItems: "center", color: "#fff", fontSize: 13,
              }}>{d.given ? "✓" : ""}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: "block", fontSize: 14.5, fontWeight: 500, color: c.ink,
                  textDecoration: d.given ? "line-through" : "none", opacity: d.given ? 0.55 : 1,
                }}>
                  {d.med_name} <span style={{ color: c.muted, fontWeight: 400 }}>· {d.med_dose}</span>
                  {d.critical && <span style={{ marginLeft: 6, color: c.danger, fontSize: 12 }}>●</span>}
                </span>
                {d.given && d.given_by_name && (
                  <span style={{ fontSize: 12, color: c.muted }}>Donné par {d.given_by_name}</span>
                )}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: alert ? c.danger : c.muted, flexShrink: 0 }}>
                {alert ? "En retard" : time}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p style={{ color: c.danger, fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  );
}
