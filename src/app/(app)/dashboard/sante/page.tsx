import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { PageHeader } from "@/components/dashboard/Shell";
import { VitalsManager } from "@/components/dashboard/VitalsManager";

export const metadata = { title: "Santé — Famō" };

export default async function SantePage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const { data: vitals } = await supabase
    .from("vitals")
    .select("id, label, value, unit, icon, recorded_at")
    .eq("family_id", ctx.family.id)
    .order("recorded_at", { ascending: false });

  return (
    <div style={{ padding: "28px clamp(16px,4vw,36px)", maxWidth: 820, margin: "0 auto" }}>
      <PageHeader
        title="Santé"
        subtitle={ctx.parent ? `Suivi de ${ctx.parent.name}` : "Suivi des indicateurs"}
      />
      <VitalsManager initial={vitals ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} />
    </div>
  );
}
