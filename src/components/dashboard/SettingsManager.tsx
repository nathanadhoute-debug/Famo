"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { c, font } from "@/lib/theme";
import { updateProfile, renameFamily, removeMember, cancelInvite } from "@/lib/actions/circle";
import { createInvite } from "@/lib/actions/invites";

type Member = { userId: string; name: string; role: string };
type Invite = { id: string; email: string; role: string };

const ROLE_LABEL: Record<string, string> = { admin: "Admin", member: "Membre", readonly: "Lecture seule" };

export function SettingsManager({
  profileName, family, isAdmin, members, pendingInvites, currentUserId, userEmail,
}: {
  profileName: string;
  family: { id: string; name: string };
  isAdmin: boolean;
  members: Member[];
  pendingInvites: Invite[];
  currentUserId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <ProfileCard initial={profileName} email={userEmail} />

      <CircleCard family={family} isAdmin={isAdmin} />

      <MembersCard
        family={family} isAdmin={isAdmin} members={members}
        pendingInvites={pendingInvites} currentUserId={currentUserId}
      />

      {/* Déconnexion */}
      <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: font.display, fontSize: 18 }}>Session</h2>
          <p style={{ color: c.muted, fontSize: 13.5, marginTop: 4 }}>Connecté·e en tant que {userEmail}</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function ProfileCard({ initial, email }: { initial: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const save = () => {
    setMsg(""); setErr("");
    start(async () => {
      const res = await updateProfile(name);
      if (!res.ok) return setErr(res.error);
      setMsg("Profil enregistré.");
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Mon profil</h2>
      <label className="field-label">Nom complet</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
      <label className="field-label">Email</label>
      <input className="input" value={email} disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
      {msg && <p style={{ color: c.success, fontSize: 13.5, marginTop: 10 }}>{msg}</p>}
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save} disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}

function CircleCard({ family, isAdmin }: { family: { id: string; name: string }; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(family.name);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const save = () => {
    setMsg(""); setErr("");
    start(async () => {
      const res = await renameFamily(family.id, name);
      if (!res.ok) return setErr(res.error);
      setMsg("Cercle renommé.");
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Le cercle</h2>
      <label className="field-label">Nom du cercle</label>
      <input className="input" value={name} disabled={!isAdmin}
        onChange={(e) => setName(e.target.value)} style={!isAdmin ? { opacity: 0.7 } : undefined} />
      {!isAdmin && <p style={{ color: c.muted, fontSize: 13, marginTop: 10 }}>Seuls les administrateurs peuvent renommer le cercle.</p>}
      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
      {msg && <p style={{ color: c.success, fontSize: 13.5, marginTop: 10 }}>{msg}</p>}
      {isAdmin && (
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Renommer"}
        </button>
      )}
    </div>
  );
}

function MembersCard({ family, isAdmin, members, pendingInvites, currentUserId }: {
  family: { id: string; name: string };
  isAdmin: boolean;
  members: Member[];
  pendingInvites: Invite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pending, start] = useTransition();

  const invite = () => {
    if (!email.trim()) return;
    setErr(""); setInfo("");
    start(async () => {
      const res = await createInvite({ familyId: family.id, email, role: role as any });
      if (!res.ok) return setErr(res.error);
      setInfo(res.emailSent
        ? `Invitation envoyée à ${email}.`
        : `Invitation créée. Lien : ${location.origin}/invite/${res.token}`);
      setEmail("");
      router.refresh();
    });
  };

  const kick = (userId: string) => {
    start(async () => {
      const res = await removeMember(family.id, userId);
      if (!res.ok) return setErr(res.error);
      router.refresh();
    });
  };

  const cancel = (id: string) => {
    start(async () => {
      const res = await cancelInvite(id);
      if (!res.ok) return setErr(res.error);
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, marginBottom: 16 }}>Membres du cercle</h2>

      <div style={{ display: "grid", gap: 8, marginBottom: pendingInvites.length || isAdmin ? 20 : 0 }}>
        {members.map((m) => (
          <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream, borderRadius: 12, padding: "11px 14px" }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: c.sage050, color: c.sage700, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              {m.name.slice(0, 2).toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14.5, fontWeight: 600, color: c.ink }}>
                {m.name}{m.userId === currentUserId && <span style={{ color: c.muted, fontWeight: 400 }}> (moi)</span>}
              </p>
              <p style={{ fontSize: 12.5, color: c.muted }}>{ROLE_LABEL[m.role] ?? m.role}</p>
            </div>
            {isAdmin && m.userId !== currentUserId && (
              <button onClick={() => kick(m.userId)} disabled={pending} className="btn btn-danger" style={{ padding: "6px 12px", fontSize: 13 }}>
                Retirer
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invitations en attente */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: c.muted, marginBottom: 8 }}>INVITATIONS EN ATTENTE</p>
          <div style={{ display: "grid", gap: 8 }}>
            {pendingInvites.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, background: c.cream2, border: `1px dashed ${c.line}`, borderRadius: 12, padding: "10px 14px" }}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <span style={{ flex: 1, fontSize: 14, color: c.ink }}>{i.email}</span>
                <span style={{ fontSize: 12, color: c.muted }}>{ROLE_LABEL[i.role] ?? i.role}</span>
                {isAdmin && (
                  <button onClick={() => cancel(i.id)} disabled={pending} aria-label="Annuler"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: c.muted, fontSize: 18 }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inviter */}
      {isAdmin && (
        <>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: c.muted, marginBottom: 8 }}>INVITER UN PROCHE</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="input" type="email" value={email} placeholder="proche@exemple.fr"
              style={{ flex: "1 1 200px" }}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()} />
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 150 }}>
              <option value="member">Membre</option>
              <option value="admin">Admin</option>
              <option value="readonly">Lecture seule</option>
            </select>
            <button className="btn btn-primary" onClick={invite} disabled={pending}>
              {pending ? "…" : "Inviter"}
            </button>
          </div>
        </>
      )}

      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{err}</p>}
      {info && <p style={{ color: c.success, fontSize: 13.5, marginTop: 12, wordBreak: "break-all" }}>{info}</p>}
    </div>
  );
}
