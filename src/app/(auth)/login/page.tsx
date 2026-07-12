"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, Field } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : error.message);
      setLoading(false);
      return;
    }
    const { data: membership } = await supabase
      .from("family_members").select("family_id").limit(1).maybeSingle();
    router.push(membership ? "/dashboard" : "/onboarding");
    router.refresh();
  };

  return (
    <AuthShell
      title="Bon retour"
      sub="Connexion à votre cercle Famō"
      footer={<>Pas encore de compte ? <Link href="/signup" style={{ color: "#3A6B5E", fontWeight: 600 }}>S'inscrire</Link></>}
    >
      <form onSubmit={handle}>
        <Field label="Email" type="email" value={form.email} autoComplete="email"
          onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password} autoComplete="current-password"
          onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="••••••••" />
        <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
          <Link href="/forgot-password" style={{ color: "#66756F", fontSize: 13.5 }}>Mot de passe oublié ?</Link>
        </div>
        {error && <p style={{ color: "#B04B3C", fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}
