import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { PageHead } from "@/components/dashboard/editorial";
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
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead
        eyebrow="Santé"
        title={ctx.parent ? `Suivi de ${ctx.parent.name.split(/\s+/)[0]}` : "Suivi santé"}
        subtitle="Tension, poids, glycémie et plus"
      />
      <VitalsManager initial={vitals ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} />
    </div>
  );
}
