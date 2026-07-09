import { parseNumeric, timeAgo } from "@/lib/format";

export type VitalLite = { label: string; value: string; unit: string | null; recorded_at: string };
export type EntryLite = { content: string; tags: string[]; created_at: string; authorName: string } | null;

export type ParentStatus = {
  line: string;              // titre du hero
  tone: "calm" | "attention";
  detail: string;            // ligne de synthèse sous le titre
};

/** Tension systolique estimée en mmHg à partir d'une valeur libre ("12.8", "128", "16/9"). */
function systolicMmHg(value: string): number | null {
  const first = value.replace(",", ".").split("/")[0];
  const n = parseNumeric(first);
  if (n === null) return null;
  return n < 30 ? Math.round(n * 10) : Math.round(n); // cmHg → mmHg
}

/**
 * Dérive l'état global du proche à partir des données réelles :
 * médicaments en retard, dernières mesures de santé anormales, et journal.
 * Sert de "capteur" affiché sur l'accueil — il se recalcule à chaque chargement
 * (les Server Actions revalident /dashboard après chaque écriture).
 */
export function deriveParentStatus(input: {
  parentFirstName: string | null;
  overdueDoses: number;
  vitals: VitalLite[];
  lastEntry: EntryLite;
}): ParentStatus {
  const { parentFirstName, overdueDoses, vitals, lastEntry } = input;
  const alerts: string[] = [];

  if (overdueDoses > 0) {
    alerts.push(`${overdueDoses} prise${overdueDoses > 1 ? "s" : ""} de médicament en retard`);
  }

  // Dernière mesure par intitulé.
  const latestByLabel = new Map<string, VitalLite>();
  for (const v of vitals) {
    const key = v.label.toLowerCase();
    if (!latestByLabel.has(key)) latestByLabel.set(key, v);
  }
  for (const [key, v] of latestByLabel) {
    const n = parseNumeric(v.value);
    if (n === null) continue;
    if (/temp/.test(key) && n >= 38) alerts.push(`fièvre (${v.value}${v.unit ?? "°C"})`);
    else if (/(pouls|fréquence|fc|cardiaque)/.test(key)) {
      if (n > 100) alerts.push(`pouls élevé (${v.value})`);
      else if (n < 50 && n > 0) alerts.push(`pouls bas (${v.value})`);
    } else if (/(saturation|spo2|sat)/.test(key) && n < 92) {
      alerts.push(`saturation basse (${v.value}%)`);
    } else if (/tension/.test(key)) {
      const sys = systolicMmHg(v.value);
      if (sys !== null && sys >= 160) alerts.push(`tension élevée (${v.value}${v.unit ?? ""})`);
      else if (sys !== null && sys <= 90) alerts.push(`tension basse (${v.value}${v.unit ?? ""})`);
    }
  }

  const hasUrgence = !!lastEntry?.tags?.includes("urgence");
  if (hasUrgence) alerts.push("note d'urgence dans le journal");

  const who = parentFirstName ?? "Votre proche";

  if (alerts.length > 0) {
    return {
      tone: "attention",
      line: parentFirstName ? `${who} a besoin d'attention aujourd'hui` : "Attention requise aujourd'hui",
      detail: alerts.slice(0, 3).join(" · "),
    };
  }

  // État calme : on reflète la dernière information concrète disponible.
  let detail: string;
  const freshEntry = lastEntry && (Date.now() - +new Date(lastEntry.created_at)) < 1000 * 60 * 60 * 72;
  const latestVital = vitals[0] ?? null;
  if (freshEntry && lastEntry) {
    const snippet = lastEntry.content.length > 90 ? `${lastEntry.content.slice(0, 90).trimEnd()}…` : lastEntry.content;
    detail = `« ${snippet} » — ${lastEntry.authorName}, ${timeAgo(lastEntry.created_at)}`;
  } else if (latestVital) {
    detail = `${latestVital.label} ${latestVital.value}${latestVital.unit ? ` ${latestVital.unit}` : ""} · ${timeAgo(latestVital.recorded_at)}`;
  } else {
    detail = "Rien à signaler pour le moment";
  }

  return {
    tone: "calm",
    line: parentFirstName ? `${who} va bien aujourd'hui` : "Bienvenue dans votre cercle",
    detail,
  };
}
