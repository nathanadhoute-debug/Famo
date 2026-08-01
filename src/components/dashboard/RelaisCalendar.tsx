"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { c, font } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/dashboard/editorial";
import { mondayOf, parisDateKey, initials } from "@/lib/format";

const pad2 = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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
 * `onAddDay` (fonction) n'a de sens que si l'appelant est lui-même un
 * Client Component avec un formulaire à pré-remplir (Planning, Accueil
 * pro). `addHref` (simple chaîne, donc utilisable depuis un Server
 * Component) sert d'alternative pour un simple lien de navigation avec
 * la date en query param — cas de l'Accueil famille, qui n'a pas de
 * formulaire inline.
 */
export function RelaisCalendar({ visits, onAddDay, addHref }: {
  visits: VisitLite[];
  onAddDay?: (date: Date) => void;
  addHref?: string;
}) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthView, setMonthView] = useState<Date | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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

  // Clic sur un jour du calendrier mensuel : ramène la frise de la semaine
  // sur la semaine de ce jour, puis referme l'overlay.
  const jumpToDate = (target: Date) => {
    const targetMonday = mondayOf(target);
    const currentMonday = mondayOf(now);
    const diffDays = Math.round((targetMonday.getTime() - currentMonday.getTime()) / 86400000);
    setWeekOffset(Math.round(diffDays / 7));
    setMonthView(null);
  };

  // Sur la frise, tout clic sur un jour (vide ou déjà assigné) pré-remplit le
  // formulaire sur cette date. Dans le calendrier mensuel (MonthOverlay plus
  // bas), seul un jour VIDE déclenche ce comportement — un jour déjà pris y
  // navigue simplement dessus (voir onSelectDay).
  const handleEmptyDayClick = onAddDay
    ? onAddDay
    : addHref
      ? (d: Date) => router.push(`${addHref}?date=${dateKey(d)}`)
      : undefined;

  // Libellé du mois affiché au-dessus de la frise — une semaine peut chevaucher
  // deux mois (ex. 27 juillet → 2 août), sinon un seul suffit.
  const firstDay = days[0].date;
  const lastDay = days[6].date;
  const monthLabel = firstDay.getMonth() === lastDay.getMonth()
    ? `${MONTHS[firstDay.getMonth()]} ${firstDay.getFullYear()}`
    : `${MONTHS[firstDay.getMonth()]} – ${MONTHS[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: c.sub, fontFamily: font.body }}>{monthLabel}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button aria-label="Voir le calendrier du mois"
            onClick={() => setMonthView(new Date(days[3].date.getFullYear(), days[3].date.getMonth(), 1))}
            style={arrowStyle}>
            <Icon name="calendar" size={15} />
          </button>
          <button aria-label="Semaine précédente" onClick={() => setWeekOffset((w) => w - 1)} style={arrowStyle}>
            <Icon name="chevron-left" size={16} />
          </button>
          <button aria-label="Semaine suivante" onClick={() => setWeekOffset((w) => w + 1)} style={arrowStyle}>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
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
            <button key={i}
              onClick={() => {
                if (handleEmptyDayClick) { handleEmptyDayClick(d.date); return; }
                setMonthView(new Date(d.date.getFullYear(), d.date.getMonth(), 1));
              }}
              onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 12,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
                transform: hoverIdx === i ? "scale(1.06)" : "scale(1)", transition: "transform .12s ease",
              }}>
              {d.name ? (
                <Avatar name={d.name} size={40} bg={d.isToday ? c.terracotta : c.sage700} ring={d.isToday || hoverIdx === i ? c.terracotta : undefined} />
              ) : (
                <span style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: hoverIdx === i ? c.sage050 : c.creamPage,
                  border: `1.5px dashed ${d.isToday ? c.terracotta : hoverIdx === i ? c.sage700 : "#E1DAC4"}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: d.isToday ? c.terracotta : hoverIdx === i ? c.sage700 : "#C7BFA6",
                }}>
                  <Icon name="plus" size={14} />
                </span>
              )}
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontSize: 11, color: d.isToday ? c.terracotta : c.eyebrow, fontWeight: d.isToday ? 500 : 400 }}>
                  {d.isToday ? "Auj." : d.weekday}
                </span>
                <span style={{ fontSize: 10, color: d.isToday ? c.terracotta : "#C7BFA6" }}>
                  {d.date.getDate()}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {monthView && (
        <MonthOverlay month={monthView} visits={visits}
          onClose={() => setMonthView(null)} onChangeMonth={setMonthView} onSelectDay={jumpToDate}
          onAddDay={handleEmptyDayClick} />
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

function MonthOverlay({ month, visits, onClose, onChangeMonth, onSelectDay, onAddDay }: {
  month: Date;
  visits: VisitLite[];
  onClose: () => void;
  onChangeMonth: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onAddDay?: (d: Date) => void;
}) {
  const now = new Date();
  const grid = monthGrid(month);
  const shift = (delta: number) => onChangeMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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
            const hovered = hoverIdx === i;
            const bg = v ? (isToday ? c.terracotta : c.sage700) : hovered ? c.sage050 : "transparent";
            return (
              <button key={i}
                onClick={() => {
                  if (!v && onAddDay) { onAddDay(d); onClose(); return; }
                  onSelectDay(d);
                }}
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12.5, fontFamily: font.body, background: bg, color: v ? "#F4F2EC" : inMonth ? c.sage900 : "#C7BFA6",
                  border: !v && isToday ? `1.5px solid ${c.terracotta}` : !v && hovered ? `1.5px solid ${c.sage700}` : "none",
                  opacity: inMonth ? 1 : 0.5,
                  transition: "background .1s ease",
                }}>
                  {d.getDate()}
                </span>
                {v?.visitorName && (
                  <span style={{ fontSize: 8.5, color: c.eyebrow, fontWeight: 500 }}>{initials(v.visitorName)}</span>
                )}
              </button>
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
