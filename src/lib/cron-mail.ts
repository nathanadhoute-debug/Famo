import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Emails de tous les membres d'un cercle familial (pour les alertes cron). */
export async function getFamilyEmails(admin: AdminClient, familyId: string): Promise<string[]> {
  const { data: members } = await admin
    .from("family_members").select("user_id").eq("family_id", familyId);
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
