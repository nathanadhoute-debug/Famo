import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily, getFamilyMembers } from "@/lib/family";
import { PageHead } from "@/components/dashboard/editorial";
import { SettingsManager } from "@/components/dashboard/SettingsManager";
import { ProfessionalSettings } from "@/components/dashboard/ProfessionalSettings";

export const metadata = { title: "Réglages — Famō" };

export default async function ReglagesPage() {
  const ctx = await getCurrentFamily();
  if (!ctx) redirect("/onboarding");
  const supabase = await createClient();

  // Un professionnel n'a accès qu'à son propre profil — pas à la liste des
  // membres du cercle, à sa gestion, ni aux notifications (obligatoires,
  // voir lib/invitations.ts). On évite même de charger ces données.
  if (ctx.role === "professional") {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle();
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(20px,3vw,34px) clamp(16px,4vw,36px) 48px" }}>
        <PageHead eyebrow="Réglages" title="Mon profil" subtitle="Vos informations personnelles" />
        <ProfessionalSettings profileName={profile?.full_name ?? ""} userEmail={ctx.user.email ?? ""} family={ctx.family} />
      </div>
    );
  }

  const [{ data: profile }, members, { data: invites }, { data: myPrefs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", ctx.user.id).maybeSingle(),
    getFamilyMembers(ctx.family.id),
    supabase.from("invitations")
      .select("id, email, role, profession_category")
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
        members={members.map((m) => ({ userId: m.userId, name: m.name, role: m.role, professionCategory: m.professionCategory, professionDetail: m.professionDetail, authorizedParentIds: m.authorizedParentIds }))}
        pendingInvites={(invites ?? []).map((i) => ({ id: i.id, email: i.email, role: i.role, professionCategory: i.profession_category }))}
        currentUserId={ctx.user.id}
        userEmail={ctx.user.email ?? ""}
        notificationPrefs={{
          rxExpiry: myPrefs?.notify_rx_expiry ?? true,
          visitReminder: myPrefs?.notify_visit_reminder ?? true,
          overdueDoses: myPrefs?.notify_overdue_doses ?? true,
        }}
        parents={ctx.parents.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, birthDate: p.birth_date }))}
      />
    </div>
  );
}
