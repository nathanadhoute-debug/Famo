import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHead } from "@/components/dashboard/editorial";
import { JournalManager } from "@/components/dashboard/JournalManager";

export const metadata = { title: "Journal — Famō" };

export default async function JournalPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const [{ data: entriesRaw }, members] = await Promise.all([
    supabase.from("journal_entries")
      .select("id, content, tags, created_at, author_id")
      .eq("family_id", ctx.family.id)
      .order("created_at", { ascending: false }),
    getFamilyMembers(ctx.family.id),
  ]);

  const names = new Map(members.map((m) => [m.userId, m.name]));
  const entries = (entriesRaw ?? []).map((e) => ({
    ...e,
    tags: e.tags ?? [],
    authorName: e.author_id === ctx.user.id ? "Moi" : (names.get(e.author_id) || "Membre"),
  }));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead
        eyebrow="Journal"
        title="Les nouvelles du quotidien"
        subtitle="Partagées avec tout le cercle"
      />
      <JournalManager
        initial={entries}
        familyId={ctx.family.id}
        parentId={ctx.parent?.id ?? null}
        currentUserId={ctx.user.id}
        isAdmin={ctx.role === "admin"}
      />
    </div>
  );
}
