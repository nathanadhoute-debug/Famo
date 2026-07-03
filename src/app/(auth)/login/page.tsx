"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: membership } = await supabase
      .from("family_members").select("family_id").limit(1).single();
    router.push(membership ? "/dashboard" : "/onboarding");
  };

  return (
    <AuthLayout title="Bon retour" sub="Connexion à votre cercle Famō">
      <form onSubmit={handle}>
        <Field label="Email" type="email" value={form.email}
          onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password}
          onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="••••••••" />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="auth-footer">Pas encore de compte ? <Link href="/signup">S'inscrire</Link></p>
    </AuthLayout>
  );
}

export function AuthLayout({ title, sub, children }: { title:string; sub:string; children:React.ReactNode }) {
  return (
    <div style={{ minHeight:"100vh",background:"#F4F2EC",display:"grid",placeItems:"center",padding:24,fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .auth-input{width:100%;padding:11px 14px;border:1px solid #DDD9CF;border-radius:10px;font-size:15px;font-family:inherit;color:#1A2622;background:#FAFAF7;margin-bottom:14px;display:block;}
        .auth-input:focus{outline:none;border-color:#3A6B5E;}
        .auth-submit{width:100%;padding:12px;border-radius:10px;background:#3A6B5E;color:#fff;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;border:none;margin-top:4px;transition:background .15s;}
        .auth-submit:hover:not(:disabled){background:#233F36;}
        .auth-submit:disabled{opacity:0.5;cursor:not-allowed;}
        .auth-error{color:#A84848;font-size:13.5px;margin-bottom:12px;}
        .auth-footer{text-align:center;font-size:13.5px;color:#66756F;margin-top:20px;}
        .auth-footer a{color:#3A6B5E;font-weight:600;text-decoration:none;}
        label{display:block;font-size:13px;font-weight:600;color:#66756F;margin-bottom:6px;}
      `}</style>
      <div style={{ width:"100%",maxWidth:420 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:32,justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#3A6B5E"/>
            <path d="M14 21c-.35 0-.7-.13-.96-.37C9.9 17.4 7.75 15.4 7.75 13 7.75 11.07 9.3 9.5 11.2 9.5c1.04 0 2.04.5 2.8 1.3.76-.8 1.76-1.3 2.8-1.3 1.9 0 3.45 1.57 3.45 3.5 0 2.4-2.15 4.4-5.29 7.13-.26.24-.6.37-.96.37z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:600,color:"#233F36" }}>Famō</span>
        </div>
        <div style={{ background:"#fff",borderRadius:20,padding:"32px 28px",boxShadow:"0 2px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:600,color:"#1A2622",marginBottom:6 }}>{title}</h1>
          {sub && <p style={{ color:"#66756F",fontSize:14,marginBottom:24 }}>{sub}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type, value, onChange, placeholder }: {
  label:string; type:string; value:string; onChange:(v:string)=>void; placeholder:string;
}) {
  return (
    <div style={{ marginBottom:4 }}>
      <label>{label}</label>
      <input className="auth-input" type={type} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
