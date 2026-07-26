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

  // Un professionnel ne voit que les pièces à caractère médical — jamais
  // les papiers personnels (identité, assurance...).
  const isProfessional = ctx.role === "professional";
  let docsQuery = supabase
    .from("documents")
    .select("id, label, category, file_size, mime_type, created_at, uploaded_by")
    .eq("family_id", ctx.family.id)
    .eq("parent_id", ctx.parent?.id ?? "");
  if (isProfessional) docsQuery = docsQuery.in("category", ["Ordonnance", "Analyse", "Compte-rendu"]);
  const { data: docs } = await docsQuery.order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead
        eyebrow="Documents"
        title="Le coffre-fort du cercle"
        subtitle="Ordonnances, analyses, papiers importants"
      />
      <DocumentsManager initial={docs ?? []} familyId={ctx.family.id} parentId={ctx.parent?.id ?? null} role={ctx.role} />
    </div>
  );
}
