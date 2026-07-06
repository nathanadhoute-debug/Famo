import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { PageHeader } from "@/components/dashboard/Shell";
import { DocumentsManager } from "@/components/dashboard/DocumentsManager";

export const metadata = { title: "Documents — Famō" };

export default async function DocumentsPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const { data: docs } = await supabase
    .from("documents")
    .select("id, label, category, file_size, mime_type, created_at, uploaded_by")
    .eq("family_id", ctx.family.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: "28px clamp(16px,4vw,36px)", maxWidth: 820, margin: "0 auto" }}>
      <PageHeader
        title="Documents"
        subtitle="Le coffre-fort du cercle : ordonnances, analyses, papiers importants."
      />
      <DocumentsManager initial={docs ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} />
    </div>
  );
}
