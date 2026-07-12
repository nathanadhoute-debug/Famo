"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { AuthShell, Field } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    // On affiche toujours le même message, que l'email existe ou non
    // (évite de révéler si une adresse est inscrite).
    if (error && error.message !== "Email rate limit exceeded") {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Vérifiez vos emails" sub="Une dernière étape">
        <p style={{ color: "#66756F", fontSize: 15, lineHeight: 1.6 }}>
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé.
          Cliquez dessus pour choisir un nouveau mot de passe.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ width: "100%", marginTop: 20 }}>
          Retour à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      sub="Recevez un lien pour en choisir un nouveau"
      footer={<Link href="/login" style={{ color: "#3A6B5E", fontWeight: 600 }}>Retour à la connexion</Link>}
    >
      <form onSubmit={handle}>
        <Field label="Email" type="email" value={email} autoComplete="email"
          onChange={setEmail} placeholder="vous@exemple.fr" />
        {error && <p style={{ color: "#B04B3C", fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Envoi…" : "Envoyer le lien"}
        </button>
      </form>
    </AuthShell>
  );
}
