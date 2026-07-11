// Adresse publique du site — fixée en dur.
//
// Ce n'est pas un secret (c'est littéralement l'URL publique du site).
// On ne dépend plus de la variable Vercel NEXT_PUBLIC_APP_URL : elle avait
// une mauvaise valeur enregistrée depuis le tout début du projet (pointait
// vers un sous-domaine vercel.app qui n'existe pas), ce qui cassait les
// liens d'invitation envoyés par email. Plus de dépendance à une variable
// d'environnement pour cette valeur = plus de risque de ce genre de bug.
export const SITE_URL = "https://famo.health";
