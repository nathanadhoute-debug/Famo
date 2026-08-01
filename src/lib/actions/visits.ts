"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/types";

/**
 * Programme une visite (ou un rendez-vous) auprès du proche. Un professionnel
 * ne peut se programmer que lui-même, jamais assigner un tiers — mais toutes
 * les catégories professionnelles peuvent le faire (initialement réservé aux
 * catégories à domicile, étendu à médecin traitant/chirurgien le 01/08/2026 :
 * un rendez-vous en cabinet se programme de la même façon qu'un passage).
 */
export async function addVisit(input: {
  familyId: string;
  parentId: string;
  visitDate: string;      // ISO (date ou datetime)
  visitorId?: string | null;
  note?: string;
}): Promise<ActionResult> {
  if (!input.visitDate) return { ok: false, error: "Choisissez une date." };
  try {
    const { userId, role } = await requireMembership(input.familyId, { allowProfessional: true });
    const visitorId = role === "professional" ? userId : (input.visitorId || null);
    const admin = createAdminClient();
    const { error } = await admin.from("visits").insert({
      family_id: input.familyId,
      parent_id: input.parentId,
      visit_date: input.visitDate,
      visitor_id: visitorId,
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

/** Annule une visite. Un professionnel ne peut annuler que son propre passage. */
export async function deleteVisit(visitId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: visit } = await admin.from("visits").select("family_id, visitor_id").eq("id", visitId).maybeSingle();
    if (!visit) return { ok: false, error: "Visite introuvable." };
    const { userId, role } = await requireMembership(visit.family_id, { allowProfessional: true });
    if (role === "professional" && visit.visitor_id !== userId) {
      return { ok: false, error: "Vous ne pouvez annuler que votre propre passage." };
    }
    const { error } = await admin.from("visits").delete().eq("id", visitId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/relais");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
