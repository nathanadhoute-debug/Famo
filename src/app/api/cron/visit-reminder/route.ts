import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFamilyEmails, sendCronEmail } from "@/lib/cron-mail";

function isAuthorized(req: Request) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

/** Rappelle au cercle familial qui est prévu pour la visite de demain. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const now = new Date();
  // visit_date est un timestamptz (heure réelle choisie, cf. migration 005) :
  // on ne peut plus comparer à une date exacte, on récupère une fenêtre large
  // puis on filtre sur le jour calendaire à Paris (fuseau du serveur cron = UTC).
  const parisKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);
  const tomorrowKey = parisKey(new Date(now.getTime() + 24 * 3600 * 1000));

  const { data: visits, error } = await admin
    .from("visits")
    .select("family_id, parent_id, visitor_id, visit_date")
    .not("visitor_id", "is", null)
    .gte("visit_date", new Date(now.getTime() - 24 * 3600 * 1000).toISOString())
    .lte("visit_date", new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString());

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const tomorrowVisits = (visits ?? []).filter((v) => parisKey(new Date(v.visit_date)) === tomorrowKey);

  let remindersSent = 0;
  for (const visit of tomorrowVisits) {
    // Pas d'embed PostgREST visits->parents : le fichier de types Supabase
    // est maintenu à la main sans métadonnées de relations, ce qui casse le
    // typage de l'embed même si la clé étrangère existe bien en base.
    const { data: parent } = await admin.from("parents").select("name").eq("id", visit.parent_id).maybeSingle();
    const parentName = parent?.name ?? "votre proche";

    const { data: visitor } = await admin
      .from("profiles").select("full_name").eq("id", visit.visitor_id!).maybeSingle();
    const visitorName = visitor?.full_name || "Quelqu'un du cercle";

    const emails = await getFamilyEmails(admin, visit.family_id, "notify_visit_reminder");
    await sendCronEmail({
      to: emails,
      subject: `Rappel : visite prévue demain auprès de ${parentName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
          <h1 style="font-size:22px;color:#1E3830;margin-bottom:8px;">Rappel de visite</h1>
          <p style="color:#555;line-height:1.6;">
            <strong>${visitorName}</strong> est prévu·e pour rendre visite à <strong>${parentName}</strong> demain.
          </p>
        </div>`,
    });
    remindersSent += emails.length ? 1 : 0;

    // Rappel dédié si le passage est celui d'un professionnel de santé qui
    // s'est programmé lui-même (aide-soignant/infirmier/kiné/autre) — toujours
    // envoyé, indépendamment de notify_visit_reminder (réservé à la famille).
    const { data: membership } = await admin
      .from("family_members").select("role").eq("family_id", visit.family_id).eq("user_id", visit.visitor_id!).maybeSingle();
    if (membership?.role === "professional") {
      const { data: proUser } = await admin.from("auth_users").select("email").eq("id", visit.visitor_id!).maybeSingle();
      if (proUser?.email) {
        const visitTime = new Date(visit.visit_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
        await sendCronEmail({
          to: [proUser.email],
          subject: `Rappel : votre passage prévu demain auprès de ${parentName}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
              <h1 style="font-size:22px;color:#1E3830;margin-bottom:8px;">Rappel de passage</h1>
              <p style="color:#555;line-height:1.6;">
                Vous êtes prévu·e demain à <strong>${visitTime}</strong> auprès de <strong>${parentName}</strong>.
              </p>
            </div>`,
        });
        remindersSent += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, cron: "visit-reminder", remindersSent, ts: new Date().toISOString() });
}
