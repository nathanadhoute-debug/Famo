"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMembership } from "@/lib/auth-guard";
import type { ActionResult } from "@/lib/actions/types";

/** Enregistre un indicateur de santé (tension, poids, glycémie…). */
export async function addVital(input: {
  familyId: string;
  parentId: string;
  label: string;
  value: string;
  unit?: string;
  icon?: string;
}): Promise<ActionResult> {
  if (!input.label.trim() || !input.value.trim()) {
    return { ok: false, error: "Indiquez un intitulé et une valeur." };
  }
  try {
    const { userId } = await requireMembership(input.familyId);
    const admin = createAdminClient();
    const { error } = await admin.from("vitals").insert({
      family_id: input.familyId,
      parent_id: input.parentId,
      recorded_by: userId,
      label: input.label.trim(),
      value: input.value.trim(),
      unit: input.unit?.trim() || null,
      icon: input.icon || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/sante");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Supprime un indicateur. */
export async function deleteVital(vitalId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: vital } = await admin.from("vitals").select("family_id").eq("id", vitalId).maybeSingle();
    if (!vital) return { ok: false, error: "Indicateur introuvable." };
    await requireMembership(vital.family_id);
    const { error } = await admin.from("vitals").delete().eq("id", vitalId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/sante");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/** Marque une prise de médicament comme donnée / non donnée. */
export async function toggleDose(doseId: string, given: boolean): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { data: dose } = await admin.from("doses").select("family_id").eq("id", doseId).maybeSingle();
    if (!dose) return { ok: false, error: "Prise introuvable." };
    const { userId } = await requireMembership(dose.family_id);
    const { error } = await admin.from("doses").update({
      given,
      given_by: given ? userId : null,
      given_at: given ? new Date().toISOString() : null,
    }).eq("id", doseId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
