import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentFamily } from "@/lib/family";
import { Shell } from "@/components/dashboard/Shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentFamily();
  if (!ctx) {
    // Un utilisateur peut arriver ici sans cercle alors qu'une invitation
    // l'attend : le lien de confirmation email n'a pas toujours ramené sur
    // /invite/{token} (ex. scanner de liens Gmail/Outlook qui consomme le
    // lien à usage unique avant le vrai clic de l'utilisateur), ou il s'est
    // connecté depuis /login au lieu de repartir du lien d'invitation. Sans
    // ce filet, il atterrit sur "Créez votre cercle" au lieu de rejoindre le
    // cercle qui l'attend réellement.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const admin = createAdminClient();
      const { data: pending } = await admin
        .from("invitations")
        .select("token")
        .eq("email", user.email.toLowerCase())
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pending) redirect(`/invite/${pending.token}`);
    }
    redirect("/onboarding");
  }

  // Nom affiché : profil → sinon email.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle();
  const userName = profile?.full_name || ctx.user.email || "Vous";

  return (
    <Shell familyName={ctx.family.name} parentName={ctx.parent?.name ?? null} userName={userName} role={ctx.role}>
      {children}
    </Shell>
  );
}
