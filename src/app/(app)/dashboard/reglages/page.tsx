import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHead } from "@/components/dashboard/editorial";
import { SettingsManager } from "@/components/dashboard/SettingsManager";

export const metadata = { title: "Réglages — Famō" };

export default async function ReglagesPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  const [{ data: profile }, members, { data: invites }, { data: myPrefs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle(),
    getFamilyMembers(ctx.family.id),
    supabase.from("invitations")
      .select("id, email, role")
      .eq("family_id", ctx.family.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("family_members")
      .select("notify_rx_expiry, notify_visit_reminder, notify_overdue_doses")
      .eq("family_id", ctx.family.id).eq("user_id", ctx.user.id).maybeSingle(),
  ]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
      <PageHead eyebrow="Réglages" title="Votre cercle" subtitle={`Profil et membres de ${ctx.family.name}`} />
      <SettingsManager
        profileName={profile?.full_name ?? ""}
        family={ctx.family}
        isAdmin={ctx.role === "admin"}
        members={members.map((m) => ({ userId: m.userId, name: m.name, role: m.role }))}
        pendingInvites={invites ?? []}
        currentUserId={ctx.user.id}
        userEmail={ctx.user.email ?? ""}
        notificationPrefs={{
          rxExpiry: myPrefs?.notify_rx_expiry ?? true,
          visitReminder: myPrefs?.notify_visit_reminder ?? true,
          overdueDoses: myPrefs?.notify_overdue_doses ?? true,
        }}
      />
    </div>
  );
}
