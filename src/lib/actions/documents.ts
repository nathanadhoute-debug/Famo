"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/types";

const BUCKET = "documents";
const MAX_SIZE = 15 * 1024 * 1024; // 15 Mo

/** Téléverse un document dans le coffre-fort (storage + table documents). */
export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const familyId = String(formData.get("familyId") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  const category = String(formData.get("category") ?? "Autre");
  const label = String(formData.get("label") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Sélectionnez un fichier." };
  if (!parentId) return { ok: false, error: "Ajoutez d'abord un proche dans le cercle." };
  if (file.size > MAX_SIZE) return { ok: false, error: "Fichier trop volumineux (max 15 Mo)." };

  try {
    const { userId } = await requireMembership(familyId);
    const admin = createAdminClient();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${familyId}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upErr) return { ok: false, error: `Envoi impossible : ${upErr.message}` };

    const { error: dbErr } = await admin.from("documents").insert({
      family_id: familyId,
      parent_id: parentId,
      uploaded_by: userId,
      category,
      label: label || file.name,
      file_url: path,
      file_size: file.size,
      mime_type: file.type || null,
    });
    if (dbErr) {
      // Nettoyage : on retire le fichier orphelin si l'insert échoue.
      await admin.storage.from(BUCKET).remove([path]);
      return { ok: false, error: dbErr.message };
    }

    revalidatePath("/dashboard/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Génère une URL signée temporaire pour télécharger un document. */
export async function getDocumentUrl(documentId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient();
    const { data: doc } = await admin
      .from("documents").select("family_id, file_url").eq("id", documentId).maybeSingle();
    if (!doc) return { ok: false, error: "Document introuvable." };
    await requireMembership(doc.family_id);

    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(doc.file_url, 60);
    if (error || !data) return { ok: false, error: error?.message ?? "Lien indisponible." };
    return { ok: true, url: data.signedUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Supprime un document (fichier + entrée). */
export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: doc } = await admin
      .from("documents").select("family_id, file_url, uploaded_by").eq("id", documentId).maybeSingle();
    if (!doc) return { ok: false, error: "Document introuvable." };
    const { userId, role } = await requireMembership(doc.family_id);
    if (doc.uploaded_by !== userId && role !== "admin") {
      return { ok: false, error: "Seul l'auteur ou un admin peut supprimer ce document." };
    }

    await admin.storage.from(BUCKET).remove([doc.file_url]);
    const { error } = await admin.from("documents").delete().eq("id", documentId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
