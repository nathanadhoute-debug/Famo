"use server";
import { cookies } from "next/headers";
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
    .select("id, family_id, role, email, expires_at, accepted_at, profession_category, profession_detail, authorized_parent_ids")
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
    const isProfessional = invite.role === "professional";
    // Un professionnel ne reçoit jamais le rappel de visite (il ne participe
    // pas au planning familial) ni l'alerte de médicament non pris (réservée
    // à la famille). Toutes les catégories professionnelles peuvent gérer le
    // traitement (voir health.ts) et reçoivent donc le rappel d'ordonnance à
    // renouveler. Non modifiable ensuite (voir circle.ts).
    const { error: memErr } = await admin.from("family_members").insert({
      family_id: invite.family_id,
      user_id: user.id,
      role: invite.role,
      profession_category: isProfessional ? invite.profession_category : null,
      profession_detail: isProfessional ? invite.profession_detail : null,
      authorized_parent_ids: isProfessional ? invite.authorized_parent_ids : null,
      ...(isProfessional
        ? { notify_rx_expiry: true, notify_visit_reminder: false, notify_overdue_doses: false }
        : {}),
    });
    if (memErr) return { ok: false, error: memErr.message };
  }

  await admin.from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Un compte peut déjà appartenir à une autre famille (ex. un professionnel
  // réutilisant son compte pour un 2e cercle) — sans ça, getCurrentFamily()
  // renverrait le tout premier cercle rejoint et l'utilisateur atterrirait
  // sur le mauvais cercle juste après avoir accepté cette invitation.
  const cookieStore = await cookies();
  cookieStore.set("active_family_id", invite.family_id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  return { ok: true, familyId: invite.family_id };
}
