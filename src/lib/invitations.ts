"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Accepte une invitation : rattache l'utilisateur connecté au cercle.
 * La création d'invitations + l'envoi d'email vivent dans lib/actions/invites.ts.
 */
export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté pour accepter l'invitation.");

  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("invitations")
    .select("id, family_id, role, email, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) throw new Error("Invitation invalide ou expirée.");
  if (invite.accepted_at) throw new Error("Cette invitation a déjà été acceptée.");
  if (new Date(invite.expires_at) < new Date()) throw new Error("Cette invitation a expiré.");
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    throw new Error("Cette invitation ne correspond pas à votre adresse email.");
  }

  // Déjà membre ? On marque simplement l'invitation comme acceptée.
  const { data: existing } = await admin
    .from("family_members").select("id")
    .eq("family_id", invite.family_id).eq("user_id", user.id).maybeSingle();

  if (!existing) {
    const { error: memErr } = await admin.from("family_members").insert({
      family_id: invite.family_id, user_id: user.id, role: invite.role,
    });
    if (memErr) throw new Error(memErr.message);
  }

  await admin.from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return invite.family_id as string;
}
