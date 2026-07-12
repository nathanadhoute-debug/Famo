"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, Field } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setValid(!!user);
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  };

  if (!ready) return <AuthShell title="Nouveau mot de passe" sub="Un instant…"><></></AuthShell>;

  if (!valid) {
    return (
      <AuthShell title="Lien invalide" sub="Ce lien n'est plus valable.">
        <p style={{ color: "#66756F", fontSize: 14.5, marginBottom: 16 }}>
          Il a peut-être expiré ou déjà été utilisé.
        </p>
        <Link href="/forgot-password" className="btn btn-primary" style={{ width: "100%" }}>
          Redemander un lien
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nouveau mot de passe" sub="Choisissez un mot de passe pour votre compte">
      <form onSubmit={handle}>
        <Field label="Mot de passe" type="password" value={password} autoComplete="new-password"
          onChange={setPassword} placeholder="8 caractères minimum" />
        {error && <p style={{ color: "#B04B3C", fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer et me connecter"}
        </button>
      </form>
    </AuthShell>
  );
}
