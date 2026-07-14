// Helpers de présentation, sûrs côté serveur comme client (aucune dépendance).

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Temps relatif en français : « à l'instant », « il y a 2 heures », « hier », « il y a 3 jours ». */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} heure${h > 1 ? "s" : ""}`;
  const d = Math.round(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} jours`;
  const w = Math.round(d / 7);
  if (w < 5) return `il y a ${w} semaine${w > 1 ? "s" : ""}`;
  const mo = Math.round(d / 30);
  return `il y a ${mo} mois`;
}

/** Extrait le premier nombre d'une valeur texte (« 12.8 », « 12,8 mmHg » → 12.8). */
export function parseNumeric(value: string): number | null {
  const m = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

const FR_DAY = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
export function shortWeekday(date: Date): string {
  return FR_DAY[date.getDay()];
}

/** Lundi 00:00 de la semaine contenant `ref` (semaine à la française). */
export function mondayOf(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Étiquette AAAA-MM-JJ d'une date en heure de Paris — indépendante du fuseau
 * du serveur (Node/UTC en prod) ou du navigateur, pour comparer/afficher de
 * façon cohérente le "jour" d'un timestamp des deux côtés (bug découvert le
 * 14/07/2026 : Accueil en SSR/UTC affichait une heure différente de Relais
 * en CSR/Europe-Paris pour la même visite).
 */
export function parisDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(date);
}
