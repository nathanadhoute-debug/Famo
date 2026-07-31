"use client";
import { useEffect, useRef, useState } from "react";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a: Date, b: Date) => dateStr(a) === dateStr(b);

function parseValue(value: string): { date: Date | null; hour: number | null; minute: number | null } {
  if (!value) return { date: null, hour: null, minute: null };
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return { date: null, hour: null, minute: null };
  const date = new Date(y, m - 1, d);
  if (!timePart) return { date, hour: null, minute: null };
  const [h, min] = timePart.split(":").map(Number);
  return { date, hour: h ?? 0, minute: min ?? 0 };
}

function monthGrid(monthStart: Date): Date[] {
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const dow = (first.getDay() + 6) % 7; // 0 = lundi
  const firstMonday = new Date(first);
  firstMonday.setDate(first.getDate() - dow);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstMonday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Sélecteur date/heure maison — remplace les <input type="date"> et
 * type="datetime-local"> natifs, qui n'offrent aucun moyen de défiler les
 * mois ou les heures à la souris sur certains navigateurs (uniquement la
 * saisie brute au clavier). Calendrier cliquable avec navigation mois par
 * mois, colonnes heure/minute défilables. Même format de valeur que les
 * inputs natifs ("YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm") pour rester un
 * remplacement direct, sans toucher la logique de conversion en UTC autour.
 */
export function DateTimePicker({ value, onChange, mode = "datetime", placeholder }: {
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "datetime";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const parsed = parseValue(value);
  const [viewMonth, setViewMonth] = useState(() => parsed.date ?? new Date());

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openPicker = () => {
    setViewMonth(parsed.date ?? new Date());
    setOpen(true);
  };

  const commit = (date: Date, hour: number | null, minute: number | null) => {
    const ds = dateStr(date);
    if (mode === "date") { onChange(ds); return; }
    onChange(`${ds}T${pad(hour ?? 0)}:${pad(minute ?? 0)}`);
  };

  const selectDay = (d: Date) => {
    commit(d, parsed.hour, parsed.minute);
    if (mode === "date") setOpen(false);
  };
  const selectHour = (h: number) => commit(parsed.date ?? new Date(), h, parsed.minute ?? 0);
  const selectMinute = (m: number) => commit(parsed.date ?? new Date(), parsed.hour ?? 0, m);

  const label = value
    ? mode === "date"
      ? (parsed.date?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) ?? "")
      : `${parsed.date?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) ?? ""} · ${pad(parsed.hour ?? 0)}:${pad(parsed.minute ?? 0)}`
    : (placeholder ?? "Choisir…");

  const now = new Date();
  const grid = monthGrid(viewMonth);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={openPicker} className="input" style={{
        textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
      }}>
        <span style={{ color: value ? c.ink : c.sub, fontSize: 14 }}>{label}</span>
        <Icon name="calendar" size={16} style={{ color: c.eyebrow, flexShrink: 0, marginLeft: 8 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", zIndex: 40, top: "calc(100% + 6px)", left: 0,
          background: c.card, border: `1px solid ${c.hairline}`, borderRadius: 14,
          boxShadow: "0 16px 40px rgba(26,38,34,0.2)", padding: 16,
          display: "flex", gap: 14, minWidth: mode === "datetime" ? 320 : 250,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button type="button" aria-label="Mois précédent"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                <Icon name="chevron-left" size={16} />
              </button>
              <p style={{ fontFamily: font.display, fontSize: 14.5, fontWeight: 500, color: c.sage900, margin: 0 }}>
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </p>
              <button type="button" aria-label="Mois suivant"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {WEEKDAYS.map((w, i) => (
                <span key={i} style={{ textAlign: "center", fontSize: 10, color: c.eyebrow, fontWeight: 500 }}>{w}</span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const isToday = sameDay(d, now);
                const isSelected = parsed.date ? sameDay(d, parsed.date) : false;
                return (
                  <button key={i} type="button" onClick={() => selectDay(d)}
                    style={{
                      width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer",
                      fontSize: 12.5, fontFamily: font.body,
                      background: isSelected ? c.sage900 : "transparent",
                      color: isSelected ? "#F4F2EC" : inMonth ? c.ink : "#C7BFA6",
                      outline: !isSelected && isToday ? `1.5px solid ${c.terracotta}` : "none",
                      opacity: inMonth ? 1 : 0.55,
                    }}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "datetime" && (
            <div style={{ display: "flex", gap: 6 }}>
              <ScrollColumn count={24} selected={parsed.hour} onSelect={selectHour} />
              <ScrollColumn count={60} selected={parsed.minute} onSelect={selectMinute} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScrollColumn({ count, selected, onSelect }: {
  count: number;
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  return (
    <div style={{
      width: 44, height: 220, overflowY: "auto", border: `1px solid ${c.hairline}`, borderRadius: 8,
    }}>
      {Array.from({ length: count }, (_, n) => n).map((n) => (
        <button key={n} type="button" onClick={() => onSelect(n)}
          style={{
            display: "block", width: "100%", padding: "6px 0", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: font.body, textAlign: "center",
            background: selected === n ? c.sage900 : "transparent",
            color: selected === n ? "#F4F2EC" : c.ink,
          }}>
          {pad(n)}
        </button>
      ))}
    </div>
  );
}
