"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AcceptResult = { ok: true; familyId: string } | { ok: false; error: string };

/**
 * Accepte une invitation : rattache l'utilisateur connecté au cercle.
 * Retourne { ok, error } au lieu de `throw` : une Server Action qui lance une
 * exception voit son message effacé par Next.js en production (sécurité —
 * remplacé par "An error occurred in the Server Components render...").
 * Ce pattern est celui utilisé par toutes les autres actions (lib/actions/*).
 * La création d'invitations + l'envoi d'email vivent dans lib/actions/invites.ts.
 */
export async function acceptInvitation(token: string): Promise<AcceptResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté pour accepter l'invitation." };

  const admin = createAdminClient();

  const { data: invite, error } = await admin
    .from("invitations")
    .select("id, family_id, role, email, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) return { ok: false, error: "Invitation invalide ou expirée." };
  if (invite.accepted_at) return { ok: false, error: "Cette invitation a déjà été acceptée." };
  if (new Date(invite.expires_at) < new Date()) return { ok: false, error: "Cette invitation a expiré." };
  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "Cette invitation ne correspond pas à votre adresse email." };
  }

  // Déjà membre ? On marque simplement l'invitation comme acceptée.
  const { data: existing } = await admin
    .from("family_members").select("id")
    .eq("family_id", invite.family_id).eq("user_id", user.id).maybeSingle();

  if (!existing) {
    const { error: memErr } = await admin.from("family_members").insert({
      family_id: invite.family_id, user_id: user.id, role: invite.role,
    });
    if (memErr) return { ok: false, error: memErr.message };
  }

  await admin.from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return { ok: true, familyId: invite.family_id };
}
