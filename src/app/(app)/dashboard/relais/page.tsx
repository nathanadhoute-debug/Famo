import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHeader } from "@/components/dashboard/Shell";
import { VisitsManager } from "@/components/dashboard/VisitsManager";

export const metadata = { title: "Relais — Famō" };

export default async function RelaisPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const [{ data: visits }, memberList] = await Promise.all([
    supabase.from("visits")
      .select("id, visit_date, note, visitor_id")
      .eq("family_id", ctx.family.id)
      .order("visit_date", { ascending: false }),
    getFamilyMembers(ctx.family.id),
  ]);

  const members = memberList.map((m) => ({ userId: m.userId, name: m.name }));
  // Garantit que l'utilisateur courant est sélectionnable même sans profil complet.
  if (!members.some((m) => m.userId === ctx.user.id)) {
    members.unshift({ userId: ctx.user.id, name: "Moi" });
  }

  return (
    <div style={{ padding: "28px clamp(16px,4vw,36px)", maxWidth: 820, margin: "0 auto" }}>
      <PageHeader
        title="Relais"
        subtitle="Organisez qui passe voir votre proche, et quand."
      />
      <VisitsManager
        initial={visits ?? []}
        members={members}
        familyId={ctx.family.id}
        parentId={ctx.parent?.id ?? null}
        currentUserId={ctx.user.id}
      />
    </div>
  );
}
