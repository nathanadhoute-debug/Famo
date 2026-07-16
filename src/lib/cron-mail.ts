import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type NotifyPref = "notify_rx_expiry" | "notify_visit_reminder" | "notify_overdue_doses";

/**
 * Emails des membres d'un cercle familial (pour les alertes cron).
 * `pref` filtre sur la préférence de notification correspondante (opt-out
 * par membre, réglable dans Réglages) ; omis, tout le monde est inclus.
 */
export async function getFamilyEmails(admin: AdminClient, familyId: string, pref?: NotifyPref): Promise<string[]> {
  let query = admin.from("family_members").select("user_id").eq("family_id", familyId);
  if (pref) query = query.eq(pref, true);
  const { data: members } = await query;
  if (!members || members.length === 0) return [];

  const { data: users } = await admin
    .from("auth_users").select("email").in("id", members.map((m) => m.user_id));

  return (users ?? []).map((u) => u.email).filter((e): e is string => !!e);
}

/** Envoi d'email best-effort via Resend, silencieux si non configuré (cron). */
export async function sendCronEmail(args: { to: string[]; subject: string; html: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY || args.to.length === 0) return;
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "Famō <noreply@famo.health>";
  await resend.emails.send({ from, to: args.to, subject: args.subject, html: args.html });
}
