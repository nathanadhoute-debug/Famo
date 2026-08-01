"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { c } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline } from "@/components/dashboard/editorial";
import { ProfileSection } from "@/components/dashboard/SettingsManager";
import { leaveFamily } from "@/lib/actions/circle";
import { signOutAction } from "@/lib/actions/auth";

/**
 * Réglages d'un professionnel invité : son profil, quitter le cercle et la
 * déconnexion — pas de liste des membres du cercle, pas de gestion du
 * cercle/des proches, pas de notifications (obligatoires, non modifiables,
 * voir lib/invitations.ts et lib/actions/circle.ts).
 */
export function ProfessionalSettings({ profileName, userEmail, family }: { profileName: string; userEmail: string; family: { id: string; name: string } }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const leave = () => {
    if (!window.confirm(`Quitter le cercle « ${family.name} » ? Vous perdrez l'accès aux informations des proches suivis.`)) return;
    setErr("");
    start(async () => { const r = await leaveFamily(family.id); if (!r.ok) return setErr(r.error); router.refresh(); });
  };

  return (
    <div>
      <ProfileSection initial={profileName} email={userEmail} />
      <Hairline margin="28px 0" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Eyebrow>Cercle</Eyebrow>
          <p style={{ fontSize: 13.5, color: c.sub, marginTop: 6 }}>Membre de {family.name}</p>
        </div>
        <button className="btn" onClick={leave} disabled={pending}
          style={{ background: "transparent", color: c.danger, border: `1px solid ${c.hairline}`, borderRadius: 9, padding: "9px 16px" }}>
          Quitter le cercle
        </button>
      </div>
      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
      <Hairline margin="28px 0" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Eyebrow>Session</Eyebrow>
          <p style={{ fontSize: 13.5, color: c.sub, marginTop: 6 }}>Connecté·e en tant que {userEmail}</p>
        </div>
        <button className="btn" onClick={() => signOutAction()}
          style={{ background: "transparent", color: c.danger, border: `1px solid ${c.hairline}`, borderRadius: 9, padding: "9px 16px" }}>
          <Icon name="logout" size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
