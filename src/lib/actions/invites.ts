"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { MemberRole } from "@/lib/family";

export type InviteResult =
  | { ok: true; token: string; emailSent: boolean }
  | { ok: false; error: string };

/**
 * Crée une invitation à rejoindre un cercle et tente d'envoyer l'email.
 * Écriture via service role (admin) après vérification que l'appelant est
 * admin du cercle. L'envoi d'email est best-effort : si Resend n'est pas
 * configuré ou échoue, l'invitation reste valide (lien récupérable).
 */
export async function createInvite(input: {
  familyId: string;
  email: string;
  role?: MemberRole;
}): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  const role = input.role ?? "member";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Adresse email invalide." };
  }

  try {
    const { userId } = await requireMembership(input.familyId, { admin: true });
    const admin = createAdminClient();

    // Déjà membre ?
    const { data: family } = await admin
      .from("families").select("name").eq("id", input.familyId).maybeSingle();

    const { data: invite, error } = await admin
      .from("invitations")
      .insert({ family_id: input.familyId, email, role, invited_by: userId })
      .select("token")
      .single();

    if (error || !invite) {
      return { ok: false, error: error?.message ?? "Invitation impossible." };
    }

    const emailSent = await trySendInviteEmail({
      email,
      token: invite.token,
      familyName: family?.name ?? "votre cercle",
    });

    return { ok: true, token: invite.token, emailSent };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Envoi d'email best-effort — n'importe Resend que si la clé est présente. */
async function trySendInviteEmail(args: { email: string; token: string; familyName: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://famo.health"}/invite/${args.token}`;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await resend.emails.send({
      from: "Famō <noreply@famo.health>",
      to: args.email,
      subject: `Vous êtes invité·e à rejoindre « ${args.familyName} » sur Famō`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
          <h1 style="font-size:22px;color:#1E3830;margin-bottom:8px;">Rejoindre Famō</h1>
          <p style="color:#555;line-height:1.6;">
            ${user?.email ? `<strong>${user.email}</strong> vous` : "Vous"} invite à coordonner
            les soins d'un proche sur Famō — visites, médicaments, journal partagé.
          </p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:13px 26px;background:#3A6B5E;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">Accepter l'invitation →</a>
          <p style="font-size:12px;color:#999;">Lien valable 7 jours. Si vous n'attendiez pas cet email, ignorez-le.</p>
        </div>`,
    });
    return true;
  } catch {
    return false;
  }
}
