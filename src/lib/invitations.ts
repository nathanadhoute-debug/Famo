"use server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitation({
  familyId, familyName, email, role = "member", inviterName,
}: {
  familyId: string; familyName: string; email: string;
  role?: "admin" | "member" | "readonly"; inviterName: string;
}) {
  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({ family_id: familyId, email, role,
      invited_by: (await supabase.auth.getUser()).data.user!.id })
    .select("token")
    .single() as any;

  if (error || !invite) throw new Error(error?.message ?? "Invitation échouée");

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

  await resend.emails.send({
    from:    "Famō <noreply@famo.app>",
    to:      email,
    subject: `${inviterName} vous invite à rejoindre "${familyName}" sur Famō`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:22px;color:#233F36;margin-bottom:8px;">Rejoindre Famō</h1>
        <p style="color:#555;line-height:1.6;">
          <strong>${inviterName}</strong> vous invite à coordonner les soins
          de votre proche sur Famō — planning des visites, médicaments, journal partagé.
        </p>
        <a href="${inviteUrl}"
          style="display:inline-block;margin:24px 0;padding:13px 26px;
            background:#3A6B5E;color:#fff;border-radius:10px;
            text-decoration:none;font-weight:600;font-size:15px;">
          Accepter l'invitation →
        </a>
        <p style="font-size:12px;color:#999;">
          Lien valable 7 jours. Si vous n'attendiez pas cet email, ignorez-le.
        </p>
      </div>`,
  });

  return invite.token;
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: invite, error } = await supabase
    .from("invitations")
    .select("id, family_id, role, email, expires_at, accepted_at")
    .eq("token", token)
    .single() as any;

  if (error || !invite)     throw new Error("Invitation invalide ou expirée");
  if (invite.accepted_at)   throw new Error("Cette invitation a déjà été acceptée");
  if (new Date(invite.expires_at) < new Date()) throw new Error("Invitation expirée");
  if (invite.email !== user.email) throw new Error("Cette invitation ne vous est pas destinée");

  await supabase.from("family_members").insert({
    family_id: invite.family_id, user_id: user.id, role: invite.role,
  });
  await supabase.from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return invite.family_id as string;
}
