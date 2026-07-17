"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { c } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { Eyebrow, Hairline, Avatar } from "@/components/dashboard/editorial";
import { updateProfile, renameFamily, removeMember, cancelInvite, updateNotificationPrefs, addAnotherParent, removeParent } from "@/lib/actions/circle";
import { createInvite } from "@/lib/actions/invites";

type Member = { userId: string; name: string; role: string };
type Invite = { id: string; email: string; role: string };
type NotificationPrefs = { rxExpiry: boolean; visitReminder: boolean; overdueDoses: boolean };
type Parent = { id: string; name: string };

const ROLE_LABEL: Record<string, string> = { admin: "Admin", member: "Membre", readonly: "Lecture seule" };

export function SettingsManager({
  profileName, family, isAdmin, members, pendingInvites, currentUserId, userEmail, notificationPrefs, parents,
}: {
  profileName: string;
  family: { id: string; name: string };
  isAdmin: boolean;
  members: Member[];
  pendingInvites: Invite[];
  currentUserId: string;
  userEmail: string;
  notificationPrefs: NotificationPrefs;
  parents: Parent[];
}) {
  const router = useRouter();
  const supabase = createClient();

  return (
    <div>
      <ProfileSection initial={profileName} email={userEmail} />
      <Hairline margin="28px 0" />
      <CircleSection family={family} isAdmin={isAdmin} />
      <Hairline margin="28px 0" />
      <ParentsSection familyId={family.id} isAdmin={isAdmin} parents={parents} />
      <Hairline margin="28px 0" />
      <MembersSection family={family} isAdmin={isAdmin} members={members} pendingInvites={pendingInvites} currentUserId={currentUserId} />
      <Hairline margin="28px 0" />
      <NotificationsSection familyId={family.id} initial={notificationPrefs} />
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

function Saveable({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 420 }}>{children}</div>;
}

function ProfileSection({ initial, email }: { initial: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const save = () => { setMsg(""); setErr(""); start(async () => { const r = await updateProfile(name); if (!r.ok) return setErr(r.error); setMsg("Profil enregistré."); router.refresh(); }); };
  return (
    <section>
      <Eyebrow>Mon profil</Eyebrow>
      <Saveable>
        <label className="field-label" style={{ marginTop: 14 }}>Nom complet</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 10 }} />
        <label className="field-label">Email</label>
        <input className="input" value={email} disabled style={{ opacity: 0.65, cursor: "not-allowed" }} />
        {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
        {msg && <p style={{ color: c.success, fontSize: 13.5, marginTop: 10 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 9 }} onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </Saveable>
    </section>
  );
}

function CircleSection({ family, isAdmin }: { family: { id: string; name: string }; isAdmin: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(family.name);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const save = () => { setMsg(""); setErr(""); start(async () => { const r = await renameFamily(family.id, name); if (!r.ok) return setErr(r.error); setMsg("Cercle renommé."); router.refresh(); }); };
  return (
    <section>
      <Eyebrow>Le cercle</Eyebrow>
      <Saveable>
        <label className="field-label" style={{ marginTop: 14 }}>Nom du cercle</label>
        <input className="input" value={name} disabled={!isAdmin} onChange={(e) => setName(e.target.value)} style={!isAdmin ? { opacity: 0.65 } : undefined} />
        {!isAdmin && <p style={{ color: c.sub, fontSize: 13, marginTop: 10 }}>Seuls les administrateurs peuvent renommer le cercle.</p>}
        {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
        {msg && <p style={{ color: c.success, fontSize: 13.5, marginTop: 10 }}>{msg}</p>}
        {isAdmin && (
          <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 9 }} onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Renommer"}
          </button>
        )}
      </Saveable>
    </section>
  );
}

const NOTIF_OPTIONS: { key: keyof NotificationPrefs; label: string; help: string }[] = [
  { key: "rxExpiry", label: "Ordonnance à renouveler", help: "Quand une ordonnance expire dans 30 jours." },
  { key: "visitReminder", label: "Rappel de visite", help: "La veille d'une visite programmée." },
  { key: "overdueDoses", label: "Médicament non pris", help: "1h après l'heure prévue si pas coché comme pris." },
];

function NotificationsSection({ familyId, initial }: { familyId: string; initial: NotificationPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const toggle = (key: keyof NotificationPrefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = () => {
    setMsg(""); setErr("");
    start(async () => {
      const r = await updateNotificationPrefs(familyId, {
        notifyRxExpiry: prefs.rxExpiry,
        notifyVisitReminder: prefs.visitReminder,
        notifyOverdueDoses: prefs.overdueDoses,
      });
      if (!r.ok) return setErr(r.error);
      setMsg("Préférences enregistrées.");
      router.refresh();
    });
  };

  return (
    <section>
      <Eyebrow>Notifications</Eyebrow>
      <p style={{ fontSize: 13.5, color: c.sub, margin: "6px 0 14px" }}>Emails que vous recevez pour ce cercle (les autres membres ne sont pas concernés).</p>
      <Saveable>
        {NOTIF_OPTIONS.map((opt) => (
          <label key={opt.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={prefs[opt.key]} onChange={() => toggle(opt.key)} style={{ marginTop: 3 }} />
            <span>
              <span style={{ display: "block", fontSize: 14, color: c.sage900, fontWeight: 500 }}>{opt.label}</span>
              <span style={{ display: "block", fontSize: 12.5, color: c.sub, marginTop: 2 }}>{opt.help}</span>
            </span>
          </label>
        ))}
        {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{err}</p>}
        {msg && <p style={{ color: c.success, fontSize: 13.5, marginTop: 10 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ marginTop: 14, borderRadius: 9 }} onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </Saveable>
    </section>
  );
}

function ParentsSection({ familyId, isAdmin, parents }: { familyId: string; isAdmin: boolean; parents: Parent[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const add = () => {
    if (!name.trim()) return;
    setErr("");
    start(async () => {
      const r = await addAnotherParent(familyId, name);
      if (!r.ok) return setErr(r.error);
      setName(""); setOpen(false);
      router.refresh();
    });
  };

  const remove = (parentId: string, parentName: string) => {
    if (!window.confirm(`Supprimer ${parentName} ? Tout son historique (médicaments, visites, mesures, journal) sera définitivement perdu.`)) return;
    setErr("");
    start(async () => {
      const r = await removeParent(parentId);
      if (!r.ok) return setErr(r.error);
      router.refresh();
    });
  };

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Proches suivis</Eyebrow>
        {isAdmin && !open && (
          <button onClick={() => setOpen(true)} className="btn" style={{ background: c.sage900, color: "#F4F2EC", padding: "8px 15px", fontSize: 13, borderRadius: 9 }}>
            <Icon name="plus" size={15} /> Ajouter
          </button>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        {parents.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: `1px solid ${c.hairline}` }}>
            <Avatar name={p.name} size={34} bg={c.sageSoft} />
            <p style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: c.sage900, margin: 0 }}>{p.name}</p>
            {isAdmin && (
              <button onClick={() => remove(p.id, p.name)} disabled={pending} aria-label="Supprimer"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                <Icon name="x" size={17} />
              </button>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="input" value={name} placeholder="Nom du proche"
            style={{ flex: "1 1 200px" }}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="btn btn-primary" onClick={add} disabled={pending} style={{ borderRadius: 9 }}>{pending ? "…" : "Ajouter"}</button>
          <button className="btn" onClick={() => { setOpen(false); setErr(""); }} style={{ background: "transparent", color: c.sub, borderRadius: 9 }}>Annuler</button>
        </div>
      )}

      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{err}</p>}
    </section>
  );
}

function MembersSection({ family, isAdmin, members, pendingInvites, currentUserId }: {
  family: { id: string; name: string };
  isAdmin: boolean;
  members: Member[];
  pendingInvites: Invite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [role, setRole] = useState("member");
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ email: string; link: string; emailSent: boolean; emailError?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const invite = () => {
    if (!email.trim()) return;
    setErr(""); setResult(null); setCopied(false);
    const target = email.trim();
    start(async () => {
      const r = await createInvite({ familyId: family.id, email: target, role: role as any });
      if (!r.ok) return setErr(r.error);
      setResult({ email: target, link: `${location.origin}/invite/${r.token}`, emailSent: r.emailSent, emailError: r.emailError });
      setEmail(""); router.refresh();
    });
  };

  const copyLink = async () => {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard indisponible */ }
  };
  const kick = (userId: string) => start(async () => { const r = await removeMember(family.id, userId); if (!r.ok) return setErr(r.error); router.refresh(); });
  const cancel = (id: string) => start(async () => { const r = await cancelInvite(id); if (!r.ok) return setErr(r.error); router.refresh(); });

  return (
    <section>
      <Eyebrow>Membres du cercle</Eyebrow>
      <div style={{ marginTop: 8 }}>
        {members.map((m) => (
          <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: `1px solid ${c.hairline}` }}>
            <Avatar name={m.name} size={34} bg={m.userId === currentUserId ? c.sage700 : c.sageSoft} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14.5, fontWeight: 500, color: c.sage900, margin: 0 }}>
                {m.name}{m.userId === currentUserId && <span style={{ color: c.eyebrow, fontWeight: 400 }}> · vous</span>}
              </p>
              <p style={{ fontSize: 12.5, color: c.eyebrow, margin: "1px 0 0" }}>{ROLE_LABEL[m.role] ?? m.role}</p>
            </div>
            {isAdmin && m.userId !== currentUserId && (
              <button onClick={() => kick(m.userId)} disabled={pending} aria-label="Retirer"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                <Icon name="x" size={17} />
              </button>
            )}
          </div>
        ))}
      </div>

      {pendingInvites.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, color: c.eyebrow, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 8px" }}>Invitations en attente</p>
          {pendingInvites.map((i) => (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px dashed ${c.hairline}` }}>
              <span style={{ color: c.eyebrow, display: "flex" }}><Icon name="mail" size={17} /></span>
              <span style={{ flex: 1, fontSize: 14, color: c.sage900 }}>{i.email}</span>
              <span style={{ fontSize: 12, color: c.eyebrow }}>{ROLE_LABEL[i.role] ?? i.role}</span>
              {isAdmin && (
                <button onClick={() => cancel(i.id)} disabled={pending} aria-label="Annuler"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: c.eyebrow, display: "flex", padding: 4 }}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 11, color: c.eyebrow, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 10px" }}>Inviter un proche</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="input" type="email" value={email} placeholder="proche@exemple.fr" style={{ flex: "1 1 200px" }}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && invite()} />
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 150 }}>
              <option value="member">Membre</option>
              <option value="admin">Admin</option>
              <option value="readonly">Lecture seule</option>
            </select>
            <button className="btn btn-primary" onClick={invite} disabled={pending} style={{ borderRadius: 9 }}>{pending ? "…" : "Inviter"}</button>
          </div>
        </div>
      )}

      {err && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 12 }}>{err}</p>}

      {result && (
        <div style={{ marginTop: 16, border: `1px solid ${c.hairline}`, borderRadius: 12, padding: "14px 16px", background: c.card }}>
          {result.emailSent ? (
            <p style={{ fontSize: 13.5, color: c.success, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="check" size={16} /> Invitation envoyée à {result.email}.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: c.sub, margin: 0, lineHeight: 1.5 }}>
              Invitation créée pour <strong style={{ color: c.sage900 }}>{result.email}</strong>.
              L'email n'a pas pu être envoyé{result.emailError ? ` (${result.emailError})` : ""} —
              partagez ce lien directement&nbsp;:
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <input readOnly value={result.link} onFocus={(e) => e.currentTarget.select()}
              className="input" style={{ flex: 1, fontSize: 12.5, color: c.sub }} />
            <button onClick={copyLink} className="btn" style={{ background: c.sage900, color: "#F4F2EC", borderRadius: 9, padding: "9px 14px", fontSize: 13, whiteSpace: "nowrap" }}>
              <Icon name={copied ? "check" : "file-text"} size={15} /> {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
