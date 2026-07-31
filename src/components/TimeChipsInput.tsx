"use client";
import { useEffect, useRef, useState } from "react";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { ScrollColumn } from "@/components/DateTimePicker";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Liste d'horaires (ex. prises de médicament) sous forme de puces, avec un
 * sélecteur heure/minute défilable à la souris pour en ajouter — remplace
 * la saisie brute "08:00, 20:00". Garde le même format de valeur (chaîne
 * d'horaires séparés par des virgules) pour rester compatible avec le
 * parsing existant côté serveur (form.times.split(",")).
 */
export function TimeChipsInput({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  const times = value.split(",").map((t) => t.trim()).filter(Boolean);
  const [open, setOpen] = useState(false);
  const [h, setH] = useState<number | null>(null);
  const [m, setM] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const add = () => {
    const t = `${pad(h ?? 0)}:${pad(m ?? 0)}`;
    const next = times.includes(t) ? times : [...times, t].sort();
    onChange(next.join(", "));
    setOpen(false); setH(null); setM(null);
  };
  const remove = (t: string) => onChange(times.filter((x) => x !== t).join(", "));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 42 }}>
        {times.map((t) => (
          <span key={t} style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 6px 5px 10px",
            borderRadius: 999, fontSize: 13, fontFamily: font.body, background: c.sage050, color: c.sage900,
          }}>
            {t}
            <button type="button" onClick={() => remove(t)} aria-label="Retirer"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: c.sageSoft, display: "flex", padding: 2 }}>
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen((o) => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
            padding: "5px 10px", borderRadius: 999, fontSize: 13, fontFamily: font.body,
            background: "transparent", color: c.sage700, border: `1px dashed ${c.hairline}`,
          }}>
          <Icon name="plus" size={13} /> Ajouter
        </button>
      </div>

      {open && (
        <div style={{
          position: "absolute", zIndex: 40, top: "calc(100% + 6px)", left: 0,
          background: c.card, border: `1px solid ${c.hairline}`, borderRadius: 14,
          boxShadow: "0 16px 40px rgba(26,38,34,0.2)", padding: 12,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <ScrollColumn count={24} selected={h} onSelect={setH} />
            <ScrollColumn count={60} selected={m} onSelect={setM} />
          </div>
          <button type="button" onClick={add} className="btn btn-primary" style={{ borderRadius: 9 }}>
            Ajouter cet horaire
          </button>
        </div>
      )}
    </div>
  );
}
