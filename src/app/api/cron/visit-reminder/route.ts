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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  const { data: visits, error } = await admin
    .from("visits")
    .select("family_id, parent_id, visitor_id")
    .eq("visit_date", tomorrowDate)
    .not("visitor_id", "is", null);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let remindersSent = 0;
  for (const visit of visits ?? []) {
    // Pas d'embed PostgREST visits->parents : le fichier de types Supabase
    // est maintenu à la main sans métadonnées de relations, ce qui casse le
    // typage de l'embed même si la clé étrangère existe bien en base.
    const { data: parent } = await admin.from("parents").select("name").eq("id", visit.parent_id).maybeSingle();
    const parentName = parent?.name ?? "votre proche";

    const { data: visitor } = await admin
      .from("profiles").select("full_name").eq("id", visit.visitor_id!).maybeSingle();
    const visitorName = visitor?.full_name || "Quelqu'un du cercle";

    const emails = await getFamilyEmails(admin, visit.family_id);
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
  }

  return NextResponse.json({ ok: true, cron: "visit-reminder", remindersSent, ts: new Date().toISOString() });
}
