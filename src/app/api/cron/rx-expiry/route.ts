import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFamilyEmails, sendCronEmail } from "@/lib/cron-mail";

function isAuthorized(req: Request) {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

const WARNING_DAYS_AHEAD = 30;

/**
 * Alerte le cercle familial quand une ordonnance expire dans exactement
 * WARNING_DAYS_AHEAD jours (déclenchement une seule fois, pas de répétition
 * quotidienne pendant toute la fenêtre des 30 jours).
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const target = new Date();
  target.setDate(target.getDate() + WARNING_DAYS_AHEAD);
  const targetDate = target.toISOString().slice(0, 10);

  const { data: meds, error } = await admin
    .from("medications")
    .select("family_id, name, rx_label, parents(name)")
    .eq("active", true)
    .eq("rx_expires_at", targetDate);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const byFamily = new Map<string, { medName: string; rxLabel: string | null; parentName: string }[]>();
  for (const m of meds ?? []) {
    const list = byFamily.get(m.family_id) ?? [];
    list.push({ medName: m.name, rxLabel: m.rx_label, parentName: (m.parents as { name: string } | null)?.name ?? "votre proche" });
    byFamily.set(m.family_id, list);
  }

  let emailsSent = 0;
  for (const [familyId, items] of byFamily) {
    const emails = await getFamilyEmails(admin, familyId);
    const rows = items.map((i) => `<li><strong>${i.medName}</strong>${i.rxLabel ? ` (${i.rxLabel})` : ""} — ${i.parentName}</li>`).join("");
    await sendCronEmail({
      to: emails,
      subject: "Une ordonnance arrive à expiration dans 30 jours",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
          <h1 style="font-size:22px;color:#1E3830;margin-bottom:8px;">Ordonnance à renouveler</h1>
          <p style="color:#555;line-height:1.6;">L'ordonnance des médicaments suivants arrive à expiration dans 30 jours :</p>
          <ul style="color:#333;line-height:1.8;">${rows}</ul>
          <p style="color:#555;line-height:1.6;">Pensez à prendre rendez-vous pour la renouveler à temps.</p>
        </div>`,
    });
    emailsSent += emails.length ? 1 : 0;
  }

  return NextResponse.json({ ok: true, cron: "rx-expiry", familiesAlerted: emailsSent, ts: new Date().toISOString() });
}
