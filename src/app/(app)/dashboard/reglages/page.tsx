import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHeader } from "@/components/dashboard/Shell";
import { SettingsManager } from "@/components/dashboard/SettingsManager";

export const metadata = { title: "Réglages — Famō" };

export default async function ReglagesPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const [{ data: profile }, members, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle(),
    getFamilyMembers(ctx.family.id),
    supabase.from("invitations")
      .select("id, email, role")
      .eq("family_id", ctx.family.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div style={{ padding: "28px clamp(16px,4vw,36px)", maxWidth: 720, margin: "0 auto" }}>
      <PageHeader title="Réglages" subtitle="Votre profil et la gestion du cercle." />
      <SettingsManager
        profileName={profile?.full_name ?? ""}
        family={ctx.family}
        isAdmin={ctx.role === "admin"}
        members={members.map((m) => ({ userId: m.userId, name: m.name, role: m.role }))}
        pendingInvites={invites ?? []}
        currentUserId={ctx.user.id}
        userEmail={ctx.user.email ?? ""}
      />
    </div>
  );
}
