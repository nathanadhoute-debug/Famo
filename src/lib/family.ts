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

export type FamilyMember = { userId: string; name: string; role: MemberRole; joinedAt: string };

/**
 * Membres du cercle avec leur nom d'affichage.
 * On évite l'embed PostgREST `profiles(...)` (pas de FK directe entre
 * family_members et profiles) : on récupère les profils séparément et on mappe.
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role, joined_at")
    .eq("family_id", familyId)
    .order("joined_at", { ascending: true });

  if (!members || members.length === 0) return [];

  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles").select("id, full_name").in("id", ids);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return members.map((m) => ({
    userId: m.user_id,
    name: names.get(m.user_id) || "Membre",
    role: m.role as MemberRole,
    joinedAt: m.joined_at,
  }));
}
