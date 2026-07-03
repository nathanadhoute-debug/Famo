"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout, Field } from "../login/page";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError("Minimum 8 caractères."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/onboarding");
  };

  return (
    <AuthLayout title="Créer un compte" sub="Coordination familiale pour vos proches">
      <form onSubmit={handle}>
        <Field label="Prénom et nom" type="text" value={form.name}
          onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Nathan Dupont" />
        <Field label="Email" type="email" value={form.email}
          onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password}
          onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="8 caractères minimum" />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="auth-footer">Déjà un compte ? <Link href="/login">Se connecter</Link></p>
    </AuthLayout>
  );
}
