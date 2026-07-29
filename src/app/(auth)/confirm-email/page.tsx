"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

/**
 * Interstitiel obligatoire entre l'email et la confirmation réelle
 * (/auth/confirm). Un lien de confirmation cliqué directement (comme
 * l'ancien {{ .ConfirmationURL }} pointant vers Supabase) peut être
 * "pré-visité" par un scanner de sécurité automatique (Mail Privacy
 * Protection d'Apple, antivirus...) qui consomme le lien à usage unique
 * avant que l'utilisateur ne clique vraiment — vécu concrètement le
 * 29/07/2026 (compte confirmé à la même seconde que l'envoi de l'email).
 * Un scanner charge cette page mais ne clique jamais sur un bouton, donc
 * le jeton n'est plus consommé que par un vrai clic humain.
 */
export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const params = useSearchParams();
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const next = params.get("next");
  const isRecovery = type === "recovery";

  if (!tokenHash || !type || !next) {
    return (
      <AuthShell title="Lien invalide" sub="Ce lien n'est plus valable.">
        <p style={{ color: "#66756F", fontSize: 14, lineHeight: 1.6 }}>
          Redemandez un email depuis la page de connexion.
        </p>
      </AuthShell>
    );
  }

  const confirmUrl = `${next}${next.includes("?") ? "&" : "?"}token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;

  return (
    <AuthShell
      title={isRecovery ? "Réinitialiser votre mot de passe" : "Confirmez votre email"}
      sub="Dernière étape"
    >
      <p style={{ color: "#66756F", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        {isRecovery
          ? "Cliquez ci-dessous pour choisir un nouveau mot de passe."
          : "Cliquez ci-dessous pour confirmer votre adresse email et activer votre compte."}
      </p>
      <a href={confirmUrl} className="btn btn-primary" style={{ width: "100%", display: "block", textAlign: "center" }}>
        {isRecovery ? "Réinitialiser mon mot de passe" : "Confirmer mon email"}
      </a>
    </AuthShell>
  );
}
