"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, Field } from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Indiquez votre prénom et nom."); return; }
    if (form.password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name.trim() } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    // Selon la config Supabase, la session peut nécessiter une confirmation d'email.
    if (!data.session) {
      setError("");
      setLoading(false);
      setConfirm(true);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  };

  if (confirm) {
    return (
      <AuthShell title="Vérifiez vos emails" sub="Une dernière étape">
        <p style={{ color: "#66756F", fontSize: 15, lineHeight: 1.6 }}>
          Nous avons envoyé un lien de confirmation à <strong>{form.email}</strong>.
          Cliquez dessus pour activer votre compte, puis connectez-vous.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ width: "100%", marginTop: 20 }}>
          Aller à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer un compte"
      sub="Coordination familiale pour vos proches"
      footer={<>Déjà un compte ? <Link href="/login" style={{ color: "#3A6B5E", fontWeight: 600 }}>Se connecter</Link></>}
    >
      <form onSubmit={handle}>
        <Field label="Prénom et nom" type="text" value={form.name} autoComplete="name"
          onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Nathan Dupont" />
        <Field label="Email" type="email" value={form.email} autoComplete="email"
          onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password} autoComplete="new-password"
          onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="8 caractères minimum" />
        {error && <p style={{ color: "#B04B3C", fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </AuthShell>
  );
}
