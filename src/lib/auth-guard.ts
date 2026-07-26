import { createClient } from "@/lib/supabase/server";
import type { MemberRole, ProfessionCategory } from "@/lib/family";

/**
 * Garde de sécurité pour les Server Actions.
 * Vérifie que l'utilisateur connecté appartient bien à la famille visée,
 * en s'appuyant sur le client authentifié (cookies). Retourne l'utilisateur
 * et son rôle. Les écritures qui suivent utilisent le client admin (service
 * role) pour contourner proprement les soucis de RLS — l'autorisation est
 * donc portée ici, côté serveur, avant toute écriture.
 *
 * `allowProfessional` : refus par défaut pour le rôle `professional` — chaque
 * action doit explicitement l'autoriser. Un professionnel invité par la
 * famille a un accès volontairement plus restreint qu'un membre (voir le
 * plan "Accès professionnel de santé").
 */
export async function requireMembership(
  familyId: string,
  opts: { admin?: boolean; allowProfessional?: boolean } = {}
): Promise<{ userId: string; email: string | null; role: MemberRole; professionCategory: ProfessionCategory | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Vous devez être connecté.");

  const { data: membership } = await supabase
    .from("family_members")
    .select("role, profession_category")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("Vous n'avez pas accès à ce cercle.");

  const role = membership.role as MemberRole;
  if (opts.admin && role !== "admin") {
    throw new Error("Cette action est réservée aux administrateurs du cercle.");
  }
  if (role === "readonly") {
    throw new Error("Votre accès est en lecture seule.");
  }
  if (role === "professional" && !opts.allowProfessional) {
    throw new Error("Cette action n'est pas disponible pour votre profil professionnel.");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    professionCategory: (membership.profession_category as ProfessionCategory | null) ?? null,
  };
}
