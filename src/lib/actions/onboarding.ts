"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Étape 1 — Crée le cercle familial + rend le créateur admin.
 * Écritures via service role (contourne le RLS désactivé sur families/family_members).
 */
export async function createCircle(name: string): Promise<Result<{ familyId: string }>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Donnez un nom à votre cercle." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const admin = createAdminClient();

  // Idempotence douce : si l'utilisateur a déjà un cercle, on le réutilise.
  const { data: existing } = await admin
    .from("family_members").select("family_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (existing) return { ok: true, data: { familyId: existing.family_id } };

  const { data: family, error: famErr } = await admin
    .from("families")
    .insert({ name: trimmed, created_by: user.id })
    .select("id")
    .single();
  if (famErr || !family) return { ok: false, error: famErr?.message ?? "Création du cercle impossible." };

  const { error: memErr } = await admin
    .from("family_members")
    .insert({ family_id: family.id, user_id: user.id, role: "admin" });
  if (memErr) return { ok: false, error: memErr.message };

  return { ok: true, data: { familyId: family.id } };
}

/**
 * Étape 2 — Ajoute le parent (proche) au centre du cercle.
 */
export async function addParent(
  familyId: string,
  name: string,
  birthDate?: string
): Promise<Result<{ parentId: string }>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Indiquez le nom de votre proche." };

  try {
    await requireMembership(familyId);
    const admin = createAdminClient();

    // Réutilise le parent existant s'il y en a déjà un.
    const { data: existing } = await admin
      .from("parents").select("id").eq("family_id", familyId).limit(1).maybeSingle();
    if (existing) {
      await admin.from("parents").update({
        name: trimmed,
        birth_date: birthDate || null,
      }).eq("id", existing.id);
      return { ok: true, data: { parentId: existing.id } };
    }

    const { data: parent, error } = await admin
      .from("parents")
      .insert({ family_id: familyId, name: trimmed, birth_date: birthDate || null })
      .select("id")
      .single();
    if (error || !parent) return { ok: false, error: error?.message ?? "Ajout impossible." };

    return { ok: true, data: { parentId: parent.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
