import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFamilyEmails, sendCronEmail } from "@/lib/cron-mail";

function isAuthorized(req: Request) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

const GRACE_MINUTES = 60;

/**
 * Alerte le cercle familial quand une dose prévue n'est toujours pas cochée
 * comme prise 1h après l'heure prévue. Appelée par un service de cron
 * externe (pas Vercel Cron : plan Hobby limité à 1 exécution/jour).
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: overdue, error } = await admin.rpc("overdue_doses", { grace_minutes: GRACE_MINUTES });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Pas d'embed PostgREST doses->parents : le fichier de types Supabase est
  // maintenu à la main sans métadonnées de relations, ce qui casse le
  // typage de l'embed même si la clé étrangère existe bien en base.
  const parentIds = [...new Set((overdue ?? []).map((d) => d.parent_id))];
  const { data: parents } = parentIds.length > 0
    ? await admin.from("parents").select("id, name").in("id", parentIds)
    : { data: [] };
  const parentNames = new Map((parents ?? []).map((p) => [p.id, p.name]));

  const byFamily = new Map<string, { doseId: string; medName: string; medDose: string; parentName: string }[]>();
  for (const d of overdue ?? []) {
    const list = byFamily.get(d.family_id) ?? [];
    list.push({ doseId: d.dose_id, medName: d.med_name, medDose: d.med_dose, parentName: parentNames.get(d.parent_id) ?? "votre proche" });
    byFamily.set(d.family_id, list);
  }

  let emailsSent = 0;
  const alertedIds: string[] = [];
  for (const [familyId, items] of byFamily) {
    const emails = await getFamilyEmails(admin, familyId);
    const rows = items.map((i) => `<li><strong>${i.medName}</strong> (${i.medDose}) — ${i.parentName}</li>`).join("");
    await sendCronEmail({
      to: emails,
      subject: "Médicament non pris",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
          <h1 style="font-size:22px;color:#1E3830;margin-bottom:8px;">Médicament non pris</h1>
          <p style="color:#555;line-height:1.6;">La prise prévue des médicaments suivants n'a pas été enregistrée :</p>
          <ul style="color:#333;line-height:1.8;">${rows}</ul>
        </div>`,
    });
    emailsSent += emails.length ? 1 : 0;
    alertedIds.push(...items.map((i) => i.doseId));
  }

  if (alertedIds.length > 0) {
    await admin.from("doses").update({ alert_sent_at: new Date().toISOString() }).in("id", alertedIds);
  }

  return NextResponse.json({ ok: true, cron: "overdue-doses", familiesAlerted: emailsSent, ts: new Date().toISOString() });
}
