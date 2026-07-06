"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/health";

/** Met à jour le nom affiché de l'utilisateur connecté. */
export async function updateProfile(fullName: string): Promise<ActionResult> {
  const name = fullName.trim();
  if (!name) return { ok: false, error: "Le nom ne peut pas être vide." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Vous devez être connecté." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: name, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/reglages");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Renomme le cercle (admin uniquement). */
export async function renameFamily(familyId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Le nom du cercle ne peut pas être vide." };
  try {
    await requireMembership(familyId, { admin: true });
    const admin = createAdminClient();
    const { error } = await admin.from("families").update({ name: trimmed }).eq("id", familyId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Retire un membre du cercle (admin, pas soi-même). */
export async function removeMember(familyId: string, userId: string): Promise<ActionResult> {
  try {
    const { userId: me } = await requireMembership(familyId, { admin: true });
    if (userId === me) return { ok: false, error: "Utilisez « Quitter le cercle » pour vous retirer." };
    const admin = createAdminClient();
    const { error } = await admin.from("family_members").delete()
      .eq("family_id", familyId).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Annule une invitation en attente (admin). */
export async function cancelInvite(inviteId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invitations").select("family_id").eq("id", inviteId).maybeSingle();
    if (!invite) return { ok: false, error: "Invitation introuvable." };
    await requireMembership(invite.family_id, { admin: true });
    const { error } = await admin.from("invitations").delete().eq("id", inviteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
