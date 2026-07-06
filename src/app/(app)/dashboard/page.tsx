import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { PageHeader } from "@/components/dashboard/Shell";
import { DoseList, type Dose } from "@/components/dashboard/DoseList";
import { c, font } from "@/lib/theme";

export default async function DashboardHome() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const [{ data: dosesRaw }, { data: visitsRaw }, { data: vitalsRaw }, { count: membersCount }] = await Promise.all([
    supabase.from("today_doses").select("*").eq("family_id", ctx.family.id).order("scheduled_time"),
    supabase.from("week_visits").select("*").eq("family_id", ctx.family.id).gte("day_offset", 0).order("visit_date"),
    supabase.from("vitals").select("*").eq("family_id", ctx.family.id).order("recorded_at", { ascending: false }).limit(4),
    supabase.from("family_members").select("*", { count: "exact", head: true }).eq("family_id", ctx.family.id),
  ]);

  const doses = (dosesRaw ?? []) as Dose[];
  const visits = (visitsRaw ?? []) as any[];
  const vitals = (vitalsRaw ?? []) as any[];

  const givenCount = doses.filter((d) => d.given).length;
  const overdue = doses.filter((d) => !d.given && d.is_overdue).length;

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ padding: "28px clamp(16px,4vw,36px)", maxWidth: 1080, margin: "0 auto" }}>
      <PageHeader
        title="Bonjour 👋"
        subtitle={`${today.charAt(0).toUpperCase() + today.slice(1)} · Cercle ${ctx.family.name}`}
      />

      {/* Bandeau d'alerte */}
      {overdue > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FBEEEC", border: "1px solid #EED3CE", borderRadius: 14, padding: "13px 16px", marginBottom: 22 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ fontSize: 14.5, color: c.danger, fontWeight: 500 }}>
            {overdue} prise{overdue > 1 ? "s" : ""} de médicament en retard aujourd'hui.
          </p>
        </div>
      )}

      {/* Statistiques rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 22 }}>
        <Stat label="Médicaments du jour" value={`${givenCount}/${doses.length}`} hint={doses.length ? "pris" : "aucun prévu"} />
        <Stat label="Visites à venir" value={String(visits.length)} hint="cette semaine" />
        <Stat label="Proche suivi" value={ctx.parent?.name ?? "—"} hint="au centre du cercle" small />
        <Stat label="Membres" value={String(membersCount ?? 1)} hint="dans le cercle" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        {/* Médicaments */}
        <section className="card" style={{ padding: 22 }}>
          <SectionTitle icon="💊" title="Médicaments du jour" href="/dashboard/sante" />
          <DoseList initial={doses} />
        </section>

        {/* Visites */}
        <section className="card" style={{ padding: 22 }}>
          <SectionTitle icon="🤝" title="Prochaines visites" href="/dashboard/relais" />
          {visits.length === 0 ? (
            <Empty text="Aucune visite programmée." cta="Planifier une visite" href="/dashboard/relais" />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {visits.slice(0, 4).map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream, borderRadius: 12, padding: "11px 12px" }}>
                  <div style={{ width: 44, flexShrink: 0, textAlign: "center", background: "#fff", borderRadius: 10, padding: "5px 0", border: `1px solid ${c.line}` }}>
                    <div style={{ fontSize: 11, color: c.muted, textTransform: "uppercase" }}>{new Date(v.visit_date).toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                    <div style={{ fontFamily: font.display, fontSize: 17, color: c.sage900, fontWeight: 600 }}>{new Date(v.visit_date).getDate()}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 500, color: c.ink }}>{v.visitor_name ?? "Visite"}</p>
                    {v.note && <p style={{ fontSize: 13, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Indicateurs */}
        <section className="card" style={{ padding: 22 }}>
          <SectionTitle icon="💚" title="Derniers indicateurs" href="/dashboard/sante" />
          {vitals.length === 0 ? (
            <Empty text="Aucun indicateur enregistré." cta="Ajouter un indicateur" href="/dashboard/sante" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {vitals.map((v) => (
                <div key={v.id} style={{ background: c.sage050, borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 12.5, color: c.muted, marginBottom: 4 }}>{v.icon ? `${v.icon} ` : ""}{v.label}</p>
                  <p style={{ fontFamily: font.display, fontSize: 20, color: c.sage900, fontWeight: 600 }}>
                    {v.value}<span style={{ fontSize: 13, color: c.muted, fontWeight: 400 }}> {v.unit ?? ""}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, small }: { label: string; value: string; hint: string; small?: boolean }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <p style={{ fontSize: 12.5, color: c.muted, marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: font.display, fontSize: small ? 18 : 26, color: c.sage900, fontWeight: 600, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      <p style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{hint}</p>
    </div>
  );
}

function SectionTitle({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, color: c.sage900, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>{title}
      </h2>
      <Link href={href} style={{ fontSize: 13, color: c.sage700, fontWeight: 600 }}>Voir →</Link>
    </div>
  );
}

function Empty({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div style={{ textAlign: "center", padding: "18px 8px" }}>
      <p style={{ color: c.muted, fontSize: 14, marginBottom: 12 }}>{text}</p>
      <Link href={href} className="btn btn-outline" style={{ fontSize: 14, padding: "9px 16px" }}>{cta}</Link>
    </div>
  );
}
