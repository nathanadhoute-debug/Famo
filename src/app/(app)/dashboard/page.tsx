import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline, Sparkline } from "@/components/dashboard/editorial";
import { ParentSwitcher } from "@/components/dashboard/ParentSwitcher";
import { ProfessionalHome } from "@/components/dashboard/ProfessionalHome";
import { RelaisCalendar } from "@/components/dashboard/RelaisCalendar";
import { initials, timeAgo, parseNumeric } from "@/lib/format";
import { deriveParentStatus } from "@/lib/status";
import { c, font } from "@/lib/theme";

const AV_COLORS = [c.sage700, c.sageSoft, c.terracotta];

export default async function DashboardHome() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const now = new Date();
  const parentId = ctx.parent?.id ?? "";

  const [members, { data: dosesRaw }, { data: visitsRaw }, { data: vitalsRaw }, { data: journalRaw }] =
    await Promise.all([
      getFamilyMembers(ctx.family.id),
      supabase.from("today_doses").select("given, is_overdue").eq("family_id", ctx.family.id).eq("parent_id", parentId),
      // Pas de fenêtre de dates : le composant RelaisCalendar gère lui-même la
      // navigation semaine/mois côté client, sans requête réseau supplémentaire.
      supabase.from("visits").select("id, visit_date, visitor_id, note")
        .eq("family_id", ctx.family.id).eq("parent_id", parentId)
        .order("visit_date", { ascending: true }),
      supabase.from("vitals").select("label, value, unit, recorded_at")
        .eq("family_id", ctx.family.id).eq("parent_id", parentId).order("recorded_at", { ascending: false }).limit(40),
      supabase.from("journal_entries").select("content, tags, author_id, created_at")
        .eq("family_id", ctx.family.id).eq("parent_id", parentId).order("created_at", { ascending: false }).limit(1),
    ]);

  const nameById = (id: string | null) =>
    id ? (id === ctx.user.id ? "Vous" : members.find((m) => m.userId === id)?.name ?? "Membre") : null;

  const doses = dosesRaw ?? [];
  const overdue = doses.filter((d) => !d.given && d.is_overdue).length;
  const visits = visitsRaw ?? [];
  const nextVisit = visits.find((v) => new Date(v.visit_date) >= now) ?? null;

  // Indicateur santé mis en avant + son historique
  const vitals = vitalsRaw ?? [];
  const latestVital = vitals[0] ?? null;
  const history = latestVital
    ? vitals.filter((v) => v.label === latestVital.label).map((v) => parseNumeric(v.value)).filter((n): n is number => n !== null).reverse()
    : [];

  // Journal
  const lastEntry = journalRaw?.[0] ?? null;

  // Un professionnel invité voit une vue centrée sur le proche, sans les
  // éléments sociaux familiaux (relais, avatars des membres, réglages).
  if (ctx.role === "professional") {
    // Ses propres passages uniquement (jamais le planning familial complet).
    // Pas de fenêtre de dates non plus, même raison que pour la famille.
    const { data: myVisits } = await supabase.from("visits")
      .select("id, visit_date, note")
      .eq("family_id", ctx.family.id).eq("parent_id", parentId).eq("visitor_id", ctx.user.id)
      .order("visit_date", { ascending: true });
    return (
      <ProfessionalHome
        parent={ctx.parent}
        parents={ctx.parents}
        activeParentId={ctx.parent?.id ?? ""}
        families={ctx.families}
        activeFamilyId={ctx.family.id}
        overdueDoses={overdue}
        latestVital={latestVital}
        vitalHistory={history}
        lastEntry={lastEntry ? {
          content: lastEntry.content,
          authorName: nameById(lastEntry.author_id) ?? "Membre",
          created_at: lastEntry.created_at,
        } : null}
        professionCategory={ctx.professionCategory}
        familyId={ctx.family.id}
        myVisits={myVisits ?? []}
      />
    );
  }

  // État global du proche, dérivé des vraies données (médicaments, santé, journal).
  const parentFirst = ctx.parent?.name.split(/\s+/)[0] ?? null;
  const status = deriveParentStatus({
    parentFirstName: parentFirst,
    overdueDoses: overdue,
    vitals,
    lastEntry: lastEntry
      ? { content: lastEntry.content, tags: lastEntry.tags ?? [], created_at: lastEntry.created_at, authorName: nameById(lastEntry.author_id) ?? "Membre" }
      : null,
  });
  const dotColor = status.tone === "attention" ? c.terracotta : c.sage600;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      {/* HERO sauge -------------------------------------------------- */}
      <section style={{ position: "relative", background: c.sage900, borderRadius: 20, padding: "clamp(28px,4vw,42px)", overflow: "hidden", marginBottom: 40 }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }} preserveAspectRatio="none" aria-hidden>
          <defs>
            <pattern id="heroDots" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill={c.sage700} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroDots)" />
        </svg>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 30 }}>
            <Eyebrow color="#7E9689">{ctx.family.name}</Eyebrow>
            <div style={{ display: "flex" }}>
              {members.slice(0, 4).map((m, i) => (
                <span key={m.userId} style={{ marginLeft: i === 0 ? 0 : -9 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", background: AV_COLORS[i % AV_COLORS.length],
                    border: `2px solid ${c.sage900}`, color: "#F9F7F0", display: "inline-flex", alignItems: "center",
                    justifyContent: "center", fontSize: 9.5, fontWeight: 500,
                  }}>{initials(m.name)}</span>
                </span>
              ))}
            </div>
          </div>

          {ctx.parents.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <ParentSwitcher parents={ctx.parents} activeId={ctx.parent?.id ?? ""} />
            </div>
          )}

          <h1 style={{ fontFamily: font.display, fontSize: "clamp(26px,4vw,32px)", fontWeight: 500, lineHeight: 1.3, color: "#F4F2EC", margin: 0, maxWidth: 500, letterSpacing: "-0.2px" }}>
            {status.line}
          </h1>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, paddingTop: 18, marginTop: 20, borderTop: "1px solid rgba(244,242,236,0.12)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block", marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#B7C6BC", lineHeight: 1.5 }}>{status.detail}</span>
          </div>
        </div>
      </section>

      {/* RELAIS de la semaine -------------------------------------- */}
      <section style={{ marginBottom: 34 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
          <Eyebrow>Le relais de la semaine</Eyebrow>
          <Link href="/dashboard/relais" style={{ fontSize: 12.5, color: c.terracotta, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            Planning <Icon name="arrow-right" size={13} />
          </Link>
        </div>

        <RelaisCalendar visits={visits.map((v) => ({ visit_date: v.visit_date, visitorName: nameById(v.visitor_id) }))} />
      </section>

      {/* SANTÉ + PROCHAINE VISITE ----------------------------------- */}
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
              <Sparkline values={history} height={34} />
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
          <Eyebrow>Prochaine visite</Eyebrow>
          {nextVisit ? (
            <>
              <p style={{ fontFamily: font.display, fontSize: 22, fontWeight: 500, color: c.sage900, margin: "12px 0 4px", lineHeight: 1.25 }}>
                {new Date(nextVisit.visit_date).toLocaleDateString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
              </p>
              <p style={{ fontSize: 13, color: c.sub, margin: "0 0 14px" }}>
                {nextVisit.note ? `${nextVisit.note} · ` : ""}{nameById(nextVisit.visitor_id) ?? "Visite"}
              </p>
              <Link href="/dashboard/relais" style={{ fontSize: 13, color: c.terracotta, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
                Voir le planning <Icon name="arrow-right" size={14} />
              </Link>
            </>
          ) : (
            <p style={{ fontSize: 14, color: c.sub, margin: "12px 0 0", lineHeight: 1.6 }}>
              Aucune visite programmée.{" "}
              <Link href="/dashboard/relais" style={{ color: c.terracotta, fontWeight: 500 }}>Planifier</Link>
            </p>
          )}
        </div>
      </div>

      <Hairline margin="30px 0" />

      {/* JOURNAL ---------------------------------------------------- */}
      <section>
        <Eyebrow>Journal</Eyebrow>
        {lastEntry ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: font.display, fontStyle: "italic", fontSize: 21, fontWeight: 400, lineHeight: 1.55, color: c.sage900, margin: 0 }}>
              «&nbsp;{lastEntry.content}&nbsp;»
            </p>
            <p style={{ fontSize: 12.5, color: c.eyebrow, margin: "12px 0 0" }}>
              {nameById(lastEntry.author_id)} · {timeAgo(lastEntry.created_at)}
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
    </div>
  );
}
