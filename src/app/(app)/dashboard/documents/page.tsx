import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { PageHead } from "@/components/dashboard/editorial";
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
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead
        eyebrow="Documents"
        title="Le coffre-fort du cercle"
        subtitle="Ordonnances, analyses, papiers importants"
      />
      <DocumentsManager initial={docs ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} />
    </div>
  );
}
