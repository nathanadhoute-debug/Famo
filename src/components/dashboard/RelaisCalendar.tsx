"use client";
import { useState } from "react";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/dashboard/editorial";
import { mondayOf, parisDateKey, initials } from "@/lib/format";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

type VisitLite = { visit_date: string; visitorName: string | null };

/**
 * Frise de la semaine (avec flèches précédent/suivant) + calendrier mensuel
 * en overlay au clic sur un jour précis — partagé entre l'Accueil famille,
 * la page Relais et l'Accueil professionnel. Prend la liste COMPLÈTE des
 * visites (pas de fenêtre de dates) : le filtrage par semaine/mois se fait
 * ici côté client, pas de requête réseau supplémentaire à la navigation.
 * Le nom du visiteur est déjà résolu en chaîne par l'appelant (jamais une
 * fonction) : ce composant peut être rendu depuis un Server Component, et
 * seules des données sérialisables peuvent traverser cette frontière.
 */
export function RelaisCalendar({ visits }: { visits: VisitLite[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthView, setMonthView] = useState<Date | null>(null);

  const now = new Date();
  const monday = new Date(mondayOf(now));
  monday.setDate(monday.getDate() + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const v = visits.find((x) => parisDateKey(new Date(x.visit_date)) === parisDateKey(d));
    return { date: d, weekday: WEEKDAYS[i], isToday: parisDateKey(d) === parisDateKey(now), name: v?.visitorName ?? null };
  });
  const assignedIdx = days.map((d, i) => (d.name ? i : -1)).filter((i) => i >= 0);

  const arrowStyle: React.CSSProperties = {
    background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow,
    display: "flex", padding: 4, borderRadius: 6,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginBottom: 6 }}>
        <button aria-label="Semaine précédente" onClick={() => setWeekOffset((w) => w - 1)} style={arrowStyle}>
          <Icon name="chevron-left" size={16} />
        </button>
        <button aria-label="Semaine suivante" onClick={() => setWeekOffset((w) => w + 1)} style={arrowStyle}>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <div style={{ position: "relative", padding: "4px 0 6px" }}>
        <div style={{ position: "absolute", top: 24, left: `${(0.5 / 7) * 100}%`, width: `${(6 / 7) * 100}%`, height: 1, background: "#E6E0CE" }} />
        {assignedIdx.length >= 2 && (
          <div style={{
            position: "absolute", top: 24,
            left: `${((assignedIdx[0] + 0.5) / 7) * 100}%`,
            width: `${((assignedIdx[assignedIdx.length - 1] - assignedIdx[0]) / 7) * 100}%`,
            height: 1, background: c.sage700,
          }} />
        )}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {days.map((d, i) => (
            <button key={i} onClick={() => setMonthView(new Date(d.date.getFullYear(), d.date.getMonth(), 1))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              {d.name ? (
                <Avatar name={d.name} size={40} bg={d.isToday ? c.terracotta : c.sage700} ring={d.isToday ? c.terracotta : undefined} />
              ) : (
                <span style={{
                  width: 40, height: 40, borderRadius: "50%", background: c.creamPage,
                  border: `1.5px dashed ${d.isToday ? c.terracotta : "#E1DAC4"}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: d.isToday ? c.terracotta : "#C7BFA6",
                }}>
                  <Icon name="plus" size={14} />
                </span>
              )}
              <span style={{ fontSize: 11, color: d.isToday ? c.terracotta : c.eyebrow, fontWeight: d.isToday ? 500 : 400 }}>
                {d.isToday ? "Auj." : d.weekday}
              </span>
            </button>
          ))}
        </div>
      </div>

      {monthView && (
        <MonthOverlay month={monthView} visits={visits}
          onClose={() => setMonthView(null)} onChangeMonth={setMonthView} />
      )}
    </div>
  );
}

function monthGrid(monthStart: Date): Date[] {
  const firstMonday = mondayOf(monthStart);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstMonday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function MonthOverlay({ month, visits, onClose, onChangeMonth }: {
  month: Date;
  visits: VisitLite[];
  onClose: () => void;
  onChangeMonth: (d: Date) => void;
}) {
  const now = new Date();
  const grid = monthGrid(month);
  const shift = (delta: number) => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,38,34,0.45)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: c.card, borderRadius: 18, padding: "24px 26px 20px", width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(26,38,34,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <button aria-label="Mois précédent" onClick={() => shift(-1)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 6 }}>
            <Icon name="chevron-left" size={18} />
          </button>
          <p style={{ fontFamily: font.display, fontSize: 18, fontWeight: 500, color: c.sage900, margin: 0 }}>
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
          <button aria-label="Mois suivant" onClick={() => shift(1)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 6 }}>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <span key={w} style={{ textAlign: "center", fontSize: 10.5, color: c.eyebrow, fontWeight: 500 }}>{w[0]}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth();
            const isToday = parisDateKey(d) === parisDateKey(now);
            const v = visits.find((x) => parisDateKey(new Date(x.visit_date)) === parisDateKey(d));
            const bg = v ? (isToday ? c.terracotta : c.sage700) : "transparent";
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "3px 0" }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12.5, background: bg, color: v ? "#F4F2EC" : inMonth ? c.sage900 : "#C7BFA6",
                  border: !v && isToday ? `1.5px solid ${c.terracotta}` : "none",
                  opacity: inMonth ? 1 : 0.5,
                }}>
                  {d.getDate()}
                </span>
                {v?.visitorName && (
                  <span style={{ fontSize: 8.5, color: c.eyebrow, fontWeight: 500 }}>{initials(v.visitorName)}</span>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="btn" style={{ marginTop: 18, width: "100%", background: "transparent", color: c.sub, border: `1px solid ${c.hairline}`, borderRadius: 9 }}>
          Fermer
        </button>
      </div>
    </div>
  );
}
