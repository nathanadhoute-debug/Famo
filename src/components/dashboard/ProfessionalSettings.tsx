"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { c } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline } from "@/components/dashboard/editorial";
import { ProfileSection } from "@/components/dashboard/SettingsManager";

/**
 * Réglages d'un professionnel invité : uniquement son profil et la
 * déconnexion — pas de liste des membres du cercle, pas de gestion du
 * cercle/des proches, pas de notifications (obligatoires, non modifiables,
 * voir lib/invitations.ts et lib/actions/circle.ts).
 */
export function ProfessionalSettings({ profileName, userEmail }: { profileName: string; userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <div>
      <ProfileSection initial={profileName} email={userEmail} />
      <Hairline margin="28px 0" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Eyebrow>Session</Eyebrow>
          <p style={{ fontSize: 13.5, color: c.sub, marginTop: 6 }}>Connecté·e en tant que {userEmail}</p>
        </div>
        <button className="btn" onClick={async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }}
          style={{ background: "transparent", color: c.danger, border: `1px solid ${c.hairline}`, borderRadius: 9, padding: "9px 16px" }}>
          <Icon name="logout" size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
