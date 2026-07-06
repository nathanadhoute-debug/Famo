"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/types";

/** Programme une visite auprès du proche. */
export async function addVisit(input: {
  familyId: string;
  parentId: string;
  visitDate: string;      // ISO (date ou datetime)
  visitorId?: string | null;
  note?: string;
}): Promise<ActionResult> {
  if (!input.visitDate) return { ok: false, error: "Choisissez une date." };
  try {
    await requireMembership(input.familyId);
    const admin = createAdminClient();
    const { error } = await admin.from("visits").insert({
      family_id: input.familyId,
      parent_id: input.parentId,
      visit_date: input.visitDate,
      visitor_id: input.visitorId || null,
      note: input.note?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/relais");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Annule une visite. */
export async function deleteVisit(visitId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: visit } = await admin.from("visits").select("family_id").eq("id", visitId).maybeSingle();
    if (!visit) return { ok: false, error: "Visite introuvable." };
    await requireMembership(visit.family_id);
    const { error } = await admin.from("visits").delete().eq("id", visitId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/relais");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
