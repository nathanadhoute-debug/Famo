// Config Supabase avec repli en dur.
//
// L'URL et la clé "anon" ne sont PAS des secrets : Supabase les conçoit pour
// être publiques dans le code client (c'est même leur rôle). On les garde ici
// en repli au cas où la variable Vercel NEXT_PUBLIC_SUPABASE_ANON_KEY serait
// à nouveau corrompue (bug observé : le champ masqué de Vercel a laissé des
// caractères de masquage "•" dans la valeur enregistrée). process.env reste
// prioritaire — ce repli ne joue que si la variable est vide/invalide.
const FALLBACK_URL = "https://gsrprbmiaxkwxyunjjvc.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcnByYm1pYXhrd3h5dW5qanZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTI5NTMsImV4cCI6MjA5ODU2ODk1M30.cpM9xxz2FabvF_ITcPj__hY-173UT8OZOFsRLpc5640";

// "•" = trace du bug de masquage Vercel (valeur corrompue) → on l'ignore et
// on retombe sur le repli plutôt que d'envoyer une clé invalide à Supabase.
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const envAnonKeyValid = envAnonKey && !envAnonKey.includes("•");

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = envAnonKeyValid ? envAnonKey : FALLBACK_ANON_KEY;
