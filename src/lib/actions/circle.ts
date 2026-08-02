"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import { sendCronEmail } from "@/lib/cron-mail";
import type { ActionResult } from "@/lib/actions/types";

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

/**
 * Modifie a posteriori les proches qu'un professionnel de santé déjà membre
 * peut suivre (admin uniquement). Jusqu'ici ce choix n'était possible qu'à
 * l'invitation — seul moyen de le changer était de retirer puis réinviter
 * le professionnel, ce qui l'obligeait à raccepter une invitation.
 */
export async function updateProfessionalAccess(
  familyId: string, userId: string, authorizedParentIds: string[]
): Promise<ActionResult> {
  if (authorizedParentIds.length === 0) {
    return { ok: false, error: "Choisissez au moins un proche que ce professionnel peut suivre." };
  }
  try {
    await requireMembership(familyId, { admin: true });
    const admin = createAdminClient();
    const { data: member } = await admin
      .from("family_members").select("role")
      .eq("family_id", familyId).eq("user_id", userId).maybeSingle();
    if (!member) return { ok: false, error: "Membre introuvable." };
    if (member.role !== "professional") return { ok: false, error: "Cette action ne concerne que les professionnels invités." };

    const { error } = await admin.from("family_members")
      .update({ authorized_parent_ids: authorizedParentIds })
      .eq("family_id", familyId).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/**
 * Permet à l'utilisateur connecté de se retirer lui-même du cercle — seul
 * chemin self-service, pour tout rôle (membre, lecture seule, professionnel).
 * On n'utilise pas `requireMembership` : elle bloque inconditionnellement le
 * rôle `readonly` et le rôle `professional` sans `allowProfessional`, alors que
 * quitter doit rester possible pour tous. Refusé si l'appelant est le dernier
 * admin du cercle, pour ne pas laisser un cercle sans administrateur.
 */
export async function leaveFamily(familyId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Vous devez être connecté." };

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("family_members").select("role")
      .eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
    if (!membership) return { ok: false, error: "Vous n'avez pas accès à ce cercle." };

    if (membership.role === "admin") {
      const { count } = await admin
        .from("family_members")
        .select("user_id", { count: "exact", head: true })
        .eq("family_id", familyId).eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return { ok: false, error: "Vous êtes le seul administrateur de ce cercle et ne pouvez pas le quitter." };
      }
    }

    const { error } = await admin.from("family_members").delete()
      .eq("family_id", familyId).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };

    // Le pro reste libre de partir sans autorisation préalable — mais son
    // départ peut couper des alertes que la famille croit toujours actives
    // (ex. renouvellement d'ordonnance suivi par le médecin traitant), donc
    // on prévient les admins après coup. Best-effort : un échec d'email ne
    // doit jamais faire échouer le départ, déjà acté ci-dessus.
    if (membership.role === "professional") {
      try {
        await notifyAdminsOfProfessionalDeparture(admin, familyId, user.email ?? null);
      } catch {
        // best-effort, voir commentaire ci-dessus
      }
    }

    revalidatePath("/dashboard/reglages");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

async function notifyAdminsOfProfessionalDeparture(
  admin: ReturnType<typeof createAdminClient>,
  familyId: string,
  departingEmail: string | null
): Promise<void> {
  const [{ data: family }, { data: admins }] = await Promise.all([
    admin.from("families").select("name").eq("id", familyId).maybeSingle(),
    admin.from("family_members").select("user_id").eq("family_id", familyId).eq("role", "admin"),
  ]);
  if (!admins || admins.length === 0) return;

  const { data: users } = await admin
    .from("auth_users").select("email").in("id", admins.map((a) => a.user_id));
  const to = (users ?? []).map((u) => u.email).filter((e): e is string => !!e);
  if (to.length === 0) return;

  const familyName = family?.name ?? "votre cercle";
  await sendCronEmail({
    to,
    subject: `Un professionnel a quitté « ${familyName} »`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A2622;">
        <h1 style="font-size:20px;color:#1E3830;margin-bottom:8px;">Départ d'un professionnel</h1>
        <p style="color:#555;line-height:1.6;">
          ${departingEmail ? `<strong>${departingEmail}</strong>` : "Un professionnel de santé"} a quitté le cercle
          « ${familyName} ». Si des alertes reposaient sur son suivi (renouvellement d'ordonnance, etc.),
          pensez à vérifier qui les reçoit désormais.
        </p>
      </div>`,
  });
}

/**
 * Met à jour les préférences de notification email de l'utilisateur connecté.
 * Un professionnel ne peut pas appeler cette action (allowProfessional omis) :
 * ses 3 alertes sont obligatoires, posées une fois pour toutes à l'acceptation
 * de l'invitation (voir lib/invitations.ts) et non modifiables ensuite.
 */
export async function updateNotificationPrefs(familyId: string, prefs: {
  notifyRxExpiry: boolean;
  notifyVisitReminder: boolean;
  notifyOverdueDoses: boolean;
}): Promise<ActionResult> {
  try {
    const { userId } = await requireMembership(familyId);
    const admin = createAdminClient();
    const { error } = await admin.from("family_members").update({
      notify_rx_expiry: prefs.notifyRxExpiry,
      notify_visit_reminder: prefs.notifyVisitReminder,
      notify_overdue_doses: prefs.notifyOverdueDoses,
    }).eq("family_id", familyId).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/**
 * Ajoute un nouveau proche au cercle (Réglages). Contrairement à
 * `addParent` (onboarding), toujours une insertion — plusieurs proches
 * peuvent coexister dans le même cercle.
 */
export async function addAnotherParent(familyId: string, name: string, birthDate?: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Indiquez le nom du proche." };
  try {
    await requireMembership(familyId);
    const admin = createAdminClient();
    const { error } = await admin.from("parents").insert({
      family_id: familyId,
      name: trimmed,
      birth_date: birthDate || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/**
 * Retire un proche du cercle (admin uniquement). Supprime en cascade tout
 * son historique (médicaments, visites, mesures, journal, ordonnances) —
 * irréversible, à confirmer côté UI avant appel.
 */
export async function removeParent(parentId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: parent } = await admin.from("parents").select("family_id").eq("id", parentId).maybeSingle();
    if (!parent) return { ok: false, error: "Proche introuvable." };
    await requireMembership(parent.family_id, { admin: true });
    const { error } = await admin.from("parents").delete().eq("id", parentId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/reglages");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Ajoute ou remplace la photo d'un proche (onboarding, ou plus tard depuis
 * Réglages). Même niveau d'accès que `addAnotherParent` (pas admin-only).
 */
export async function updateParentPhoto(parentId: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Sélectionnez une image." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Le fichier doit être une image." };
  if (file.size > AVATAR_MAX_SIZE) return { ok: false, error: "Image trop volumineuse (max 5 Mo)." };
  // Le HEIC (format par défaut des photos iPhone) n'est affichable que dans
  // Safari — la plupart des navigateurs ne savent pas le décoder dans une
  // balise <img>. On le refuse ici plutôt que de stocker une image qui
  // s'afficherait cassée pour la moitié des utilisateurs.
  if (file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name)) {
    return { ok: false, error: "Format HEIC non pris en charge — utilisez une photo JPEG ou PNG (sur iPhone : Réglages → Appareil photo → Formats → « Le plus compatible »)." };
  }

  try {
    const admin = createAdminClient();
    const { data: parent } = await admin.from("parents").select("family_id, avatar_url").eq("id", parentId).maybeSingle();
    if (!parent) return { ok: false, error: "Proche introuvable." };
    await requireMembership(parent.family_id);

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${parent.family_id}/${parentId}-${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return { ok: false, error: `Envoi impossible : ${upErr.message}` };

    const { error: dbErr } = await admin.from("parents").update({ avatar_url: path }).eq("id", parentId);
    if (dbErr) {
      await admin.storage.from(AVATAR_BUCKET).remove([path]);
      return { ok: false, error: dbErr.message };
    }

    // Nettoyage de l'ancienne photo si on en remplace une.
    if (parent.avatar_url) await admin.storage.from(AVATAR_BUCKET).remove([parent.avatar_url]);

    revalidatePath("/dashboard/reglages");
    revalidatePath("/dashboard");
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
