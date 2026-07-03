"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitation } from "@/lib/invitations";
import { AuthLayout, Field } from "../../login/page";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading"|"auth"|"accepting"|"error">("loading");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [form, setForm] = useState({ email:"", password:"", name:"" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setStatus("accepting"); accept(); }
      else setStatus("auth");
    });
  }, []);

  const accept = async () => {
    setStatus("accepting");
    try {
      const familyId = await acceptInvitation(token);
      router.push(`/dashboard?welcome=1`);
    } catch (e: any) { setError(e.message); setStatus("error"); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus("loading");
    if (mode === "signup") {
      await supabase.auth.signUp({ email:form.email, password:form.password,
        options: { data: { full_name: form.name } } });
    } else {
      await supabase.auth.signInWithPassword({ email:form.email, password:form.password });
    }
    accept();
  };

  if (status === "loading" || status === "accepting")
    return <AuthLayout title="Rejoindre le cercle" sub="Vérification en cours…">
      <div style={{ textAlign:"center",padding:"32px 0",color:"#66756F" }}>
        {status === "accepting" ? "Activation de votre accès…" : "Chargement…"}
      </div>
    </AuthLayout>;

  if (status === "error")
    return <AuthLayout title="Invitation invalide" sub="">
      <p style={{ color:"#A84848",marginBottom:16 }}>{error}</p>
      <a href="/login" style={{ display:"block",textAlign:"center",padding:"12px",background:"#3A6B5E",color:"#fff",borderRadius:10,textDecoration:"none",fontWeight:600 }}>Retour à la connexion</a>
    </AuthLayout>;

  return (
    <AuthLayout title="Vous avez été invité" sub="Connectez-vous ou créez un compte pour rejoindre le cercle.">
      <div style={{ display:"flex",background:"#F4F2EC",borderRadius:10,padding:3,gap:2,marginBottom:20 }}>
        {(["login","signup"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex:1,padding:"8px",borderRadius:8,border:"none",fontFamily:"inherit",
              fontSize:13,cursor:"pointer",
              background: mode===m?"#fff":"transparent",
              color: mode===m?"#1A2622":"#66756F",
              fontWeight: mode===m?600:400 }}>
            {m === "login" ? "J'ai un compte" : "Créer un compte"}
          </button>
        ))}
      </div>
      <form onSubmit={handleAuth}>
        {mode === "signup" && <Field label="Prénom et nom" type="text" value={form.name}
          onChange={v => setForm(f => ({ ...f, name:v }))} placeholder="Prénom Nom" />}
        <Field label="Email" type="email" value={form.email}
          onChange={v => setForm(f => ({ ...f, email:v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password}
          onChange={v => setForm(f => ({ ...f, password:v }))} placeholder="••••••••" />
        <button type="submit" className="auth-submit">
          {mode === "login" ? "Me connecter et rejoindre" : "Créer mon compte et rejoindre"}
        </button>
      </form>
    </AuthLayout>
  );
}
