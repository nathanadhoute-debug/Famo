import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type MemberRole = "admin" | "member" | "readonly" | "professional";
export type ProfessionCategory = "aide_soignant" | "infirmier" | "kine" | "medecin_traitant" | "chirurgien" | "autre";
export type ParentLite = { id: string; name: string; birth_date: string | null };

export type FamilyLite = { id: string; name: string };

export type CurrentFamily = {
  user:    { id: string; email: string | null };
  family:  { id: string; name: string };
  role:    MemberRole;
  professionCategory: ProfessionCategory | null;
  parent:  ParentLite | null;
  parents: ParentLite[];
  families: FamilyLite[];
};

const ACTIVE_PARENT_COOKIE = "active_parent_id";
const ACTIVE_FAMILY_COOKIE = "active_family_id";

/**
 * Récupère le contexte familial de l'utilisateur connecté :
 * user → cercle actif → proche actif. Un utilisateur (typiquement un
 * professionnel de santé invité par plusieurs familles avec le même compte)
 * peut avoir plusieurs lignes `family_members` : le cercle actif est
 * sélectionné via le cookie `active_family_id`, sinon le premier rejoint
 * (comportement inchangé pour un compte à un seul cercle). Le proche actif
 * reste résolu comme avant via `active_parent_id`, à l'intérieur du cercle actif.
 * Retourne `null` si non connecté ou sans famille (→ à rediriger vers /onboarding).
 * Lecture via le client serveur authentifié (RLS respectée).
 */
export async function getCurrentFamily(): Promise<CurrentFamily | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("family_members")
    .select("family_id, role, profession_category, authorized_parent_ids")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!memberships || memberships.length === 0) return null;

  const cookieStore = await cookies();
  const activeFamilyId = cookieStore.get(ACTIVE_FAMILY_COOKIE)?.value;
  const membership = memberships.find((m) => m.family_id === activeFamilyId) ?? memberships[0];

  const { data: familiesRaw } = await supabase
    .from("families")
    .select("id, name")
    .in("id", memberships.map((m) => m.family_id));

  const family = (familiesRaw ?? []).find((f) => f.id === membership.family_id);
  if (!family) return null;

  const families = memberships
    .map((m) => (familiesRaw ?? []).find((f) => f.id === m.family_id))
    .filter((f): f is FamilyLite => !!f);

  const { data: parentsRaw } = await supabase
    .from("parents")
    .select("id, name, birth_date")
    .eq("family_id", family.id)
    .order("created_at", { ascending: true });

  // Un professionnel avec des proches autorisés explicitement listés ne voit
  // que ceux-là — jamais les autres proches du cercle. Une invitation créée
  // avant cette restriction (authorized_parent_ids vide/null) garde l'accès
  // à tous les proches, pour ne pas casser silencieusement un compte existant.
  const authorizedIds = membership.authorized_parent_ids as string[] | null;
  const parents = membership.role === "professional" && authorizedIds && authorizedIds.length > 0
    ? (parentsRaw ?? []).filter((p) => authorizedIds.includes(p.id))
    : (parentsRaw ?? []);
  const activeParentId = cookieStore.get(ACTIVE_PARENT_COOKIE)?.value;
  const parent = parents.find((p) => p.id === activeParentId) ?? parents[0] ?? null;

  return {
    user:   { id: user.id, email: user.email ?? null },
    family: { id: family.id, name: family.name },
    role:   membership.role as MemberRole,
    professionCategory: (membership.profession_category as ProfessionCategory | null) ?? null,
    parent,
    parents,
    families,
  };
}

export type FamilyMember = {
  userId: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
  professionCategory: ProfessionCategory | null;
  professionDetail: string | null;
  authorizedParentIds: string[] | null;
};

/**
 * Membres du cercle avec leur nom d'affichage.
 * On évite l'embed PostgREST `profiles(...)` (pas de FK directe entre
 * family_members et profiles) : on récupère les profils séparément et on mappe.
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role, joined_at, profession_category, profession_detail, authorized_parent_ids")
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
    professionCategory: (m.profession_category as ProfessionCategory | null) ?? null,
    professionDetail: m.profession_detail ?? null,
    authorizedParentIds: (m.authorized_parent_ids as string[] | null) ?? null,
  }));
}
