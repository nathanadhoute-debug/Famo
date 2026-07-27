import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline, Sparkline } from "@/components/dashboard/editorial";
import { ParentSwitcher } from "@/components/dashboard/ParentSwitcher";
import { ProfessionalVisitScheduler } from "@/components/dashboard/ProfessionalVisitScheduler";
import { timeAgo, parseNumeric } from "@/lib/format";
import { c, font } from "@/lib/theme";
import type { ParentLite } from "@/lib/family";

const HOME_VISITING_CATEGORIES = ["aide_soignant", "infirmier", "kine", "autre"];

/**
 * Accueil d'un professionnel de santé invité dans le cercle : vue centrée
 * sur le proche suivi (pas d'éléments sociaux familiaux — pas de timeline
 * de relais, pas d'avatars des membres). Réutilise les données déjà
 * récupérées par la page (pas de requête dupliquée).
 */
export function ProfessionalHome({
  parent, parents, activeParentId,
  overdueDoses, latestVital, vitalHistory, lastEntry,
  professionCategory, familyId, myVisits,
}: {
  parent: ParentLite | null;
  parents: ParentLite[];
  activeParentId: string;
  overdueDoses: number;
  latestVital: { label: string; value: string; unit: string | null; recorded_at: string } | null;
  vitalHistory: number[];
  lastEntry: { content: string; authorName: string; created_at: string } | null;
  professionCategory: string | null;
  familyId: string;
  myVisits: { id: string; visit_date: string; note: string | null }[];
}) {
  const canScheduleVisit = HOME_VISITING_CATEGORIES.includes(professionCategory ?? "");
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <section style={{ position: "relative", background: c.sage900, borderRadius: 20, padding: "clamp(28px,4vw,42px)", overflow: "hidden", marginBottom: 40 }}>
        <div style={{ position: "relative" }}>
          <Eyebrow color="#7E9689">Suivi professionnel</Eyebrow>

          {parents.length > 1 && (
            <div style={{ margin: "18px 0" }}>
              <ParentSwitcher parents={parents} activeId={activeParentId} />
            </div>
          )}

          <h1 style={{ fontFamily: font.display, fontSize: "clamp(26px,4vw,32px)", fontWeight: 500, lineHeight: 1.3, color: "#F4F2EC", margin: parents.length > 1 ? 0 : "18px 0 0", maxWidth: 500, letterSpacing: "-0.2px" }}>
            {parent ? parent.name : "Aucun proche sélectionné"}
          </h1>

          {overdueDoses > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, paddingTop: 18, marginTop: 20, borderTop: "1px solid rgba(244,242,236,0.12)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.terracotta, display: "inline-block", marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#B7C6BC", lineHeight: 1.5 }}>
                {overdueDoses} {overdueDoses > 1 ? "prises en retard" : "prise en retard"}
              </span>
            </div>
          )}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ paddingRight: "clamp(16px,4vw,34px)", borderRight: `1px solid ${c.hairline}` }}>
          <Eyebrow>{latestVital?.label ?? "Santé"}</Eyebrow>
          {latestVital ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "12px 0 10px" }}>
                <span style={{ fontFamily: font.display, fontSize: 44, fontWeight: 300, color: c.sage900, lineHeight: 1 }}>
                  {parseNumeric(latestVital.value) ?? latestVital.value}
                </span>
                {latestVital.unit && <span style={{ fontSize: 13, color: c.eyebrow }}>{latestVital.unit}</span>}
              </div>
              <Sparkline values={vitalHistory} height={34} />
              <p style={{ fontSize: 12, color: c.eyebrow, margin: "10px 0 0" }}>
                Dernière mesure {timeAgo(latestVital.recorded_at)}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 14, color: c.sub, margin: "14px 0 0", lineHeight: 1.6 }}>
              Aucun indicateur.{" "}
              <Link href="/dashboard/sante" style={{ color: c.terracotta, fontWeight: 500 }}>En ajouter un</Link>
            </p>
          )}
        </div>

        <div style={{ paddingLeft: "clamp(16px,4vw,34px)" }}>
          <Eyebrow>Médicaments</Eyebrow>
          <p style={{ fontSize: 14, color: c.sub, margin: "12px 0 0", lineHeight: 1.6 }}>
            {overdueDoses > 0
              ? `${overdueDoses} ${overdueDoses > 1 ? "prises en retard aujourd'hui" : "prise en retard aujourd'hui"}.`
              : "Aucune prise en retard aujourd'hui."}
          </p>
          <Link href="/dashboard/sante" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: c.terracotta, fontWeight: 500, marginTop: 14 }}>
            Voir le détail <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>

      <Hairline margin="30px 0" />

      <section>
        <Eyebrow>Journal</Eyebrow>
        {lastEntry ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: font.display, fontStyle: "italic", fontSize: 21, fontWeight: 400, lineHeight: 1.55, color: c.sage900, margin: 0 }}>
              «&nbsp;{lastEntry.content}&nbsp;»
            </p>
            <p style={{ fontSize: 12.5, color: c.eyebrow, margin: "12px 0 0" }}>
              {lastEntry.authorName} · {timeAgo(lastEntry.created_at)}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: c.sub, margin: "14px 0 0", lineHeight: 1.6 }}>
            Le journal est vide.{" "}
            <Link href="/dashboard/journal" style={{ color: c.terracotta, fontWeight: 500 }}>Écrire la première note</Link>
          </p>
        )}
        <Link href="/dashboard/journal" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: c.terracotta, fontWeight: 500, marginTop: 18 }}>
          Ajouter une note <Icon name="arrow-right" size={14} />
        </Link>
      </section>

      {canScheduleVisit && (
        <>
          <Hairline margin="30px 0" />
          <ProfessionalVisitScheduler initial={myVisits} familyId={familyId} parentId={parent?.id ?? null} />
        </>
      )}
    </div>
  );
}
