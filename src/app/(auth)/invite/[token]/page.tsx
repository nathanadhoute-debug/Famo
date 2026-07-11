"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitation } from "@/lib/invitations";
import { AuthShell, Field } from "@/components/AuthShell";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "auth" | "accepting" | "error">("loading");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const accept = async () => {
    setStatus("accepting");
    const res = await acceptInvitation(token);
    if (!res.ok) {
      setError(res.error);
      setStatus("error");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) accept();
      else setStatus("auth");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: { full_name: form.name.trim() },
              emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(`/invite/${token}`)}`,
            },
          })
        : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setError(error.message); return; }
    await accept();
  };

  if (status === "loading" || status === "accepting") {
    return (
      <AuthShell title="Rejoindre le cercle" sub="Un instant…">
        <p style={{ textAlign: "center", padding: "24px 0", color: "#66756F" }}>
          {status === "accepting" ? "Activation de votre accès…" : "Chargement…"}
        </p>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell title="Invitation invalide" sub="Ce lien n'est plus valable.">
        <p style={{ color: "#B04B3C", marginBottom: 16, fontSize: 14 }}>{error}</p>
        <Link href="/login" className="btn btn-primary" style={{ width: "100%" }}>Retour à la connexion</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Vous êtes invité·e" sub="Connectez-vous ou créez un compte pour rejoindre le cercle.">
      <div style={{ display: "flex", background: "#F4F2EC", borderRadius: 10, padding: 3, gap: 2, marginBottom: 20 }}>
        {(["login", "signup"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", fontFamily: "inherit",
              fontSize: 13, cursor: "pointer",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#1A2622" : "#66756F",
              fontWeight: mode === m ? 600 : 400,
            }}>
            {m === "login" ? "J'ai un compte" : "Créer un compte"}
          </button>
        ))}
      </div>
      <form onSubmit={handleAuth}>
        {mode === "signup" && (
          <Field label="Prénom et nom" type="text" value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Prénom Nom" />
        )}
        <Field label="Email" type="email" value={form.email} autoComplete="email"
          onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="vous@exemple.fr" />
        <Field label="Mot de passe" type="password" value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="••••••••" />
        {error && <p style={{ color: "#B04B3C", fontSize: 13.5, marginBottom: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          {mode === "login" ? "Me connecter et rejoindre" : "Créer mon compte et rejoindre"}
        </button>
      </form>
    </AuthShell>
  );
}
