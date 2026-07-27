import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHead, Eyebrow, Hairline } from "@/components/dashboard/editorial";
import { VitalsManager } from "@/components/dashboard/VitalsManager";
import { MedicationsManager } from "@/components/dashboard/MedicationsManager";
import { DoseList } from "@/components/dashboard/DoseList";

export const metadata = { title: "Santé — Famō" };

export default async function SantePage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const parentId = ctx.parent?.id ?? "";

  const [{ data: vitals }, { data: meds }, { data: doses }, members] = await Promise.all([
    supabase
      .from("vitals")
      .select("id, label, value, unit, icon, recorded_at, recorded_by")
      .eq("family_id", ctx.family.id)
      .eq("parent_id", parentId)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("medications")
      .select("id, name, dose, category, critical, rx_label, rx_expires_at, modified_by, modified_at")
      .eq("family_id", ctx.family.id)
      .eq("parent_id", parentId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("today_doses")
      .select("id, med_name, med_dose, scheduled_time, given, is_overdue, critical, given_by_name, given_at")
      .eq("family_id", ctx.family.id)
      .eq("parent_id", parentId)
      .order("scheduled_time", { ascending: true }),
    getFamilyMembers(ctx.family.id),
  ]);

  // Pas d'embed PostgREST medications->medication_schedules : le fichier de
  // types Supabase est maintenu à la main sans métadonnées de relations,
  // ce qui casse le typage de l'embed même si la clé étrangère existe bien.
  const { data: schedules } = meds && meds.length > 0
    ? await supabase.from("medication_schedules").select("id, medication_id, scheduled_time").in("medication_id", meds.map((m) => m.id))
    : { data: [] };
  const membersById = new Map(members.map((m) => [m.userId, m]));
  const vitalsWithAuthor = (vitals ?? []).map((v) => ({
    ...v,
    recordedByName: v.recorded_by ? (membersById.get(v.recorded_by)?.name ?? "Membre") : null,
  }));
  const medications = (meds ?? []).map((m) => {
    const modifier = m.modified_by ? membersById.get(m.modified_by) : null;
    return {
      ...m,
      medication_schedules: (schedules ?? []).filter((s) => s.medication_id === m.id).map((s) => ({ id: s.id, scheduled_time: s.scheduled_time })),
      modifiedByName: modifier?.name ?? null,
      modifiedByCategory: modifier?.professionCategory ?? null,
    };
  });

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead
        eyebrow="Santé"
        title={ctx.parent ? `Suivi de ${ctx.parent.name.split(/\s+/)[0]}` : "Suivi santé"}
        subtitle="Médicaments, tension, poids, glycémie et plus"
      />

      <Eyebrow>Aujourd&apos;hui</Eyebrow>
      <div style={{ marginTop: 14 }}>
        <DoseList initial={doses ?? []} />
      </div>

      <Hairline margin="30px 0" />

      <Eyebrow>Médicaments</Eyebrow>
      <div style={{ marginTop: 14 }}>
        <MedicationsManager initial={medications ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} role={ctx.role} professionCategory={ctx.professionCategory} />
      </div>

      <Hairline margin="30px 0" />

      <Eyebrow>Mesures</Eyebrow>
      <div style={{ marginTop: 14 }}>
        <VitalsManager initial={vitalsWithAuthor} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} />
      </div>
    </div>
  );
}
