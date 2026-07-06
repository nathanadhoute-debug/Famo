import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";
import { Shell } from "@/components/dashboard/Shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");

  // Nom affiché : profil → sinon email.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle();
  const userName = profile?.full_name || ctx.user.email || "Vous";

  return (
    <Shell familyName={ctx.family.name} parentName={ctx.parent?.name ?? null} userName={userName}>
      {children}
    </Shell>
  );
}
