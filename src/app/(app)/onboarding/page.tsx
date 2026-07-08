"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { c, font } from "@/lib/theme";
import { createCircle, addParent } from "@/lib/actions/onboarding";
import { createInvite } from "@/lib/actions/invites";

type Step = "family" | "parent" | "invite";
const STEPS: Step[] = ["family", "parent", "invite"];
const LABELS = ["Votre cercle", "Votre proche", "Inviter"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("family");
  const [familyId, setFamilyId] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitesSent, setInvitesSent] = useState<{ email: string; link: string; emailSent: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const current = STEPS.indexOf(step);

  const submitFamily = async () => {
    setLoading(true); setError("");
    const res = await createCircle(familyName);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setFamilyId(res.data.familyId);
    setStep("parent");
  };

  const submitParent = async () => {
    setLoading(true); setError("");
    const res = await addParent(familyId, parentName, birthDate);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setStep("invite");
  };

  const submitInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setLoading(true); setError("");
    const res = await createInvite({ familyId, email });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setInvitesSent((prev) => [...prev, { email, link: `${location.origin}/invite/${res.token}`, emailSent: res.emailSent }]);
    setInviteEmail("");
  };

  const finish = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: c.cream, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460, animation: "fadeUp .4s ease both" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Logo size={28} />
        </div>

        {/* Progression */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: 5, borderRadius: 999,
                background: i <= current ? c.sage700 : c.line,
                transition: "background .3s",
              }} />
              <p style={{ fontSize: 12, marginTop: 7, color: i <= current ? c.sage900 : c.muted, fontWeight: i === current ? 600 : 500 }}>
                {LABELS[i]}
              </p>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "30px 28px" }}>
          {step === "family" && (
            <>
              <h1 style={{ fontFamily: font.display, fontSize: 24, marginBottom: 8 }}>Créez votre cercle</h1>
              <p style={{ color: c.muted, fontSize: 14.5, marginBottom: 22 }}>
                Le cercle réunit tous ceux qui prennent soin de votre proche.
              </p>
              <label className="field-label">Nom du cercle</label>
              <input className="input" value={familyName} autoFocus
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitFamily()}
                placeholder="Famille Dupont · Chez Mamie…" />
              <Actions>
                <span />
                <button className="btn btn-primary" onClick={submitFamily} disabled={loading || !familyName.trim()}>
                  {loading ? "Création…" : "Continuer →"}
                </button>
              </Actions>
            </>
          )}

          {step === "parent" && (
            <>
              <h1 style={{ fontFamily: font.display, fontSize: 24, marginBottom: 8 }}>Votre proche</h1>
              <p style={{ color: c.muted, fontSize: 14.5, marginBottom: 22 }}>
                La personne au centre de votre attention.
              </p>
              <label className="field-label">Nom du proche</label>
              <input className="input" value={parentName} autoFocus style={{ marginBottom: 16 }}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Jeanne Dupont" />
              <label className="field-label">Date de naissance <span style={{ fontWeight: 400 }}>(facultatif)</span></label>
              <input className="input" type="date" value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)} />
              <Actions>
                <button className="btn btn-ghost" onClick={() => setStep("family")}>← Retour</button>
                <button className="btn btn-primary" onClick={submitParent} disabled={loading || !parentName.trim()}>
                  {loading ? "Enregistrement…" : "Continuer →"}
                </button>
              </Actions>
            </>
          )}

          {step === "invite" && (
            <>
              <h1 style={{ fontFamily: font.display, fontSize: 24, marginBottom: 8 }}>Invitez vos proches</h1>
              <p style={{ color: c.muted, fontSize: 14.5, marginBottom: 22 }}>
                Frères, sœurs, aidants… Ils rejoindront le cercle par email.
                Vous pourrez aussi le faire plus tard.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" type="email" value={inviteEmail} style={{ flex: 1 }}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitInvite()}
                  placeholder="proche@exemple.fr" />
                <button className="btn btn-outline" onClick={submitInvite} disabled={loading || !inviteEmail.trim()}>
                  {loading ? "…" : "Inviter"}
                </button>
              </div>

              {invitesSent.length > 0 && (
                <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                  {invitesSent.map((inv) => (
                    <div key={inv.email} style={{ background: c.sage050, borderRadius: 10, padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: c.sage700 }}>✓</span>
                        <span style={{ fontSize: 14, color: c.ink }}>{inv.email}</span>
                        <span style={{ marginLeft: "auto", fontSize: 12, color: c.muted }}>{inv.emailSent ? "email envoyé" : "invité·e"}</span>
                      </div>
                      {!inv.emailSent && (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ fontSize: 11.5, color: c.muted, marginBottom: 4 }}>Partagez ce lien :</p>
                          <input readOnly value={inv.link} onFocus={(e) => e.currentTarget.select()}
                            className="input" style={{ fontSize: 12, padding: "7px 10px", background: "#fff" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Actions>
                <button className="btn btn-ghost" onClick={() => setStep("parent")}>← Retour</button>
                <button className="btn btn-primary" onClick={finish}>
                  {invitesSent.length ? "Terminer →" : "Passer et terminer →"}
                </button>
              </Actions>
            </>
          )}

          {error && <p style={{ color: c.danger, fontSize: 13.5, marginTop: 14 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
      {children}
    </div>
  );
}
