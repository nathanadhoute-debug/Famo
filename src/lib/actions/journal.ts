"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/health";

/** Ajoute une note au journal partagé. */
export async function addEntry(input: {
  familyId: string;
  parentId: string;
  content: string;
  tags?: string[];
}): Promise<ActionResult> {
  if (!input.content.trim()) return { ok: false, error: "La note est vide." };
  try {
    const { userId } = await requireMembership(input.familyId);
    const admin = createAdminClient();
    const { error } = await admin.from("journal_entries").insert({
      family_id: input.familyId,
      parent_id: input.parentId,
      author_id: userId,
      content: input.content.trim(),
      tags: input.tags ?? [],
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/journal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Supprime une note (auteur ou admin uniquement). */
export async function deleteEntry(entryId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: entry } = await admin
      .from("journal_entries").select("family_id, author_id").eq("id", entryId).maybeSingle();
    if (!entry) return { ok: false, error: "Note introuvable." };
    const { userId, role } = await requireMembership(entry.family_id);
    if (entry.author_id !== userId && role !== "admin") {
      return { ok: false, error: "Seul l'auteur ou un admin peut supprimer cette note." };
    }
    const { error } = await admin.from("journal_entries").delete().eq("id", entryId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/journal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
