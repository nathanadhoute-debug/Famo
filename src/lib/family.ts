import { createClient } from "@/lib/supabase/server";

export type MemberRole = "admin" | "member" | "readonly";

export type CurrentFamily = {
  user:   { id: string; email: string | null };
  family: { id: string; name: string };
  role:   MemberRole;
  parent: { id: string; name: string; birth_date: string | null } | null;
};

/**
 * Récupère le contexte familial de l'utilisateur connecté :
 * user → membership → family → parent principal.
 * Retourne `null` si non connecté ou sans famille (→ à rediriger vers /onboarding).
 * Lecture via le client serveur authentifié (RLS respectée).
 */
export async function getCurrentFamily(): Promise<CurrentFamily | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", membership.family_id)
    .maybeSingle();

  if (!family) return null;

  const { data: parent } = await supabase
    .from("parents")
    .select("id, name, birth_date")
    .eq("family_id", family.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    user:   { id: user.id, email: user.email ?? null },
    family: { id: family.id, name: family.name },
    role:   membership.role as MemberRole,
    parent: parent ?? null,
  };
}
