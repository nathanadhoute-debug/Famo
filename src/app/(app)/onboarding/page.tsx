"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Step = "family" | "parent" | "invite";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("family");
  const [familyId, setFamilyId] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitesSent, setInvitesSent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ["family","parent","invite"];
  const labels = ["Votre cercle","Votre proche","Inviter"];
  const current = steps.indexOf(step);

  const createFamily = async () => {
    if (!familyName.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: fam } = await supabase.from("families")
      .insert({ name: familyName, created_by: user!.id }).select("id").single() as any;
    if (!fam) { setLoading(false); return; }
    await supabase.from("family_members")
      .insert({ family_id: fam.id, user_id: user!.id, role: "admin" });
    setFamilyId(fam.id); setLoading(false); setStep("parent");
  };

  const createParent = async () => {
    if (!parentName.trim()) return;
    setLoading(true);
    await supabase.from("parents").insert({ family_id: familyId, name: parentName });
    setLoading(false); setStep("invite");
  };

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    const { sendInvitation } = await import("@/lib/invitations");
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles")
      .select("full_name").eq("id", user!.id).single() as any;
    await sendInvitation({ familyId, familyName, email: inviteEmail,
      inviterName: profile?.full_name ?? "Un membre" });
    setInvitesSent(s => [...s, inviteEmail]); setInviteEmail(""); setLoading(false);
  };

  const S = { fontFamily:"'Inter',system-ui,sans-serif" };

  return (
    <div style={{ minHeight:"100vh",background:"#F4F2EC",display:"grid",placeItems:"center",padding:24,...S }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .ob-input{width:100%;padding:11px 14px;border:1px solid #DDD9CF;border-radius:10px;font-size:15px;font-family:inherit;color:#1A2622;background:#FAFAF7;display:block;}
        .ob-input:focus{outline:none;border-color:#3A6B5E;}
        .ob-btn{width:100%;padding:12px;border-radius:10px;background:#3A6B5E;color:#fff;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;border:none;margin-top:14px;}
        .ob-btn:disabled{opacity:0.5;cursor:not-allowed;}
      `}</style>
      <div style={{ width:"100%",maxWidth:480 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:28,justifyContent:"center" }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#3A6B5E"/>
            <path d="M14 21c-.35 0-.7-.13-.96-.37C9.9 17.4 7.75 15.4 7.75 13 7.75 11.07 9.3 9.5 11.2 9.5c1.04 0 2.04.5 2.8 1.3.76-.8 1.76-1.3 2.8-1.3 1.9 0 3.45 1.57 3.45 3.5 0 2.4-2.15 4.4-5.29 7.13-.26.24-.6.37-.96.37z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:600,color:"#233F36" }}>Famō</span>
        </div>
        <div style={{ display:"flex",gap:8,marginBottom:28 }}>
          {steps.map((s,i) => (
            <div key={s} style={{ flex:1 }}>
              <div style={{ height:4,borderRadius:999,background:i<=current?"#3A6B5E":"#DDD9CF" }} />
              <div style={{ fontSize:11,color:i<=current?"#3A6B5E":"#9AA69F",marginTop:5,fontWeight:500 }}>{labels[i]}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fff",borderRadius:20,padding:"32px 28px",boxShadow:"0 2px 20px rgba(0,0,0,0.06)" }}>
          {step==="family" && <>
            <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:22,marginBottom:8 }}>Donnez un nom à votre cercle</h2>
            <p style={{ color:"#66756F",fontSize:14,marginBottom:22,lineHeight:1.6 }}>Généralement le nom de famille.</p>
            <input className="ob-input" value={familyName} onChange={e=>setFamilyName(e.target.value)}
              placeholder="Ex : Famille Moreau" onKeyDown={e=>e.key==="Enter"&&createFamily()} />
            <button className="ob-btn" onClick={createFamily} disabled={loading||!familyName.trim()}>
              {loading?"Création…":"Créer le cercle →"}
            </button>
          </>}
          {step==="parent" && <>
            <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:22,marginBottom:8 }}>Qui prenez-vous en soin ?</h2>
            <p style={{ color:"#66756F",fontSize:14,marginBottom:22,lineHeight:1.6 }}>Le prénom visible par tous les membres.</p>
            <input className="ob-input" value={parentName} onChange={e=>setParentName(e.target.value)}
              placeholder="Ex : Jeanne" onKeyDown={e=>e.key==="Enter"&&createParent()} />
            <button className="ob-btn" onClick={createParent} disabled={loading||!parentName.trim()}>
              {loading?"Enregistrement…":"Continuer →"}
            </button>
          </>}
          {step==="invite" && <>
            <h2 style={{ fontFamily:"'Fraunces',serif",fontSize:22,marginBottom:8 }}>Invitez vos proches</h2>
            <p style={{ color:"#66756F",fontSize:14,marginBottom:22,lineHeight:1.6 }}>Ils recevront un email d'invitation.</p>
            <div style={{ display:"flex",gap:8 }}>
              <input className="ob-input" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                placeholder="email@exemple.fr" onKeyDown={e=>e.key==="Enter"&&invite()} style={{ flex:1 }} />
              <button onClick={invite} disabled={loading||!inviteEmail.trim()}
                style={{ padding:"11px 16px",borderRadius:10,background:"#3A6B5E",color:"#fff",
                  border:"none",cursor:"pointer",fontWeight:600,fontFamily:"inherit",fontSize:14,
                  opacity:loading||!inviteEmail.trim()?0.5:1 }}>
                Inviter
              </button>
            </div>
            {invitesSent.map(e=>(
              <div key={e} style={{ fontSize:13,color:"#3A6B5E",padding:"8px 0",
                borderBottom:"1px solid #E4EFEB",display:"flex",gap:8,marginTop:8 }}>
                <span>✓</span>{e}
              </div>
            ))}
            <button className="ob-btn" style={{ background:"#233F36",marginTop:20 }}
              onClick={()=>router.push("/dashboard")}>
              {invitesSent.length>0?"Accéder au tableau de bord →":"Passer cette étape →"}
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}
