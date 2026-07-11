# Journal du projet Famō

Ce document résume tout le travail effectué sur l'app Famō (famo.health) — utile pour reprendre le projet dans une nouvelle session Claude Code sans avoir à tout réexpliquer. Le code est sur GitHub (`nathanadhoute-debug/Famo`, branche `main`) et se déploie automatiquement sur Vercel à chaque push.

## Contexte du projet

Famō est une app de coordination familiale pour aider à prendre soin d'un parent âgé — cible à la fois le parent et ses enfants adultes aidants (aidants). Stack : Next.js 16.2.10 (App Router, Turbopack), Supabase (auth + DB + storage), déploiement Vercel, domaine famo.health. Styles en inline + CSS string (pas de Tailwind, contrainte du projet). Textes en français partout.

## Phase 1 — Refonte complète de l'app (premier chantier)

Le repo existant avait une bonne base technique (Supabase bien branché, schéma DB riche, middleware d'auth) mais des pages dashboard quasi vides/buguées (mauvais noms de colonnes, pas de formulaires). Reconstruction complète en 6 phases :

- **Phase 0** — Socle : `globals.css` (design system vert sauge/crème), `lib/theme.ts`, `lib/family.ts` (`getCurrentFamily()`), `lib/auth-guard.ts` (`requireMembership()` — garde de sécurité pour les Server Actions).
- **Phase 1** — Landing publique (`/`) + auth (login/signup) retravaillés.
- **Phase 2** — Onboarding 3 étapes réécrit en **Server Actions** (`lib/actions/onboarding.ts`, `lib/actions/invites.ts`) utilisant le client **service role**, pour contourner le RLS désactivé sur `families`/`family_members`.
- **Phase 3** — Shell dashboard avec sidebar (`components/dashboard/Shell.tsx`) + page Accueil.
- **Phase 4** — Les 5 pages métier (Santé, Relais, Journal, Documents, Réglages), chacune avec Server Actions dédiées dans `lib/actions/*.ts` suivant le pattern `{ ok: true } | { ok: false, error }`.
- **Phase 5** — Finitions, gestion d'erreurs, migration `004_reenable_rls.sql` documentée (non appliquée).

**Principe d'architecture central** : toutes les écritures sensibles passent par des **Server Actions** qui vérifient l'appartenance via `requireMembership()` (client authentifié), puis écrivent via `createAdminClient()` (service role). Jamais d'insert client direct sur les tables sensibles.

## Phase 2 — Redesign éditorial "santé premium" (deuxième chantier)

Direction demandée : style éditorial type Oura/Levels/Ro — vert sauge profond (#1E3830, hero uniquement), terracotta (#B8794A, accent parcimonieux), crème (#F9F7F0), hairlines fines plutôt que cartes empilées, Fraunces pour titres/gros chiffres, icônes Tabler outline (jamais d'emoji).

- **Logo Famō** — bug récurrent du macron mal aligné réglé définitivement : le macron n'est **jamais** le glyphe Unicode `ō` (rendu instable), il est dessiné en CSS pur via `.fm-o::after` dans `globals.css` (`top: 0.22em`, calé au pixel avec l'utilisateur). HTML : `Fam<span class="fm-o">o</span>`.
- **Fondations** : `components/Icon.tsx` (icônes Tabler en SVG inline, zéro dépendance CDN), tokens éditoriaux dans `theme.ts`, `lib/format.ts` (helpers), `components/dashboard/editorial.tsx` (Eyebrow, PageHead, Hairline, Avatar, Sparkline SVG à courbe fluide).
- **Accueil** reconstruit : hero sauge plein-large avec texture de points SVG, timeline relais 7 jours (avatars reliés, jour courant en anneau pointillé terracotta), indicateur santé en Fraunces léger + sparkline, extrait journal en citation italique. `lib/status.ts` dérive un **état global dynamique** du parent (calme/attention) à partir des vraies données (médicaments en retard, mesures anormales, tag "urgence" du journal) — pas de valeur statique.
- **Les 5 autres pages** redesignées dans le même langage, logique Supabase inchangée.

## Phase 3 — Saga de débogage production (troisième chantier, le plus long)

Après déploiement, une série de bugs interconnectés a demandé beaucoup d'aller-retours. Résumé des causes racines et fixes :

### 1. Emails d'invitation qui ne partaient pas
Cause : domaine `famo.health` non vérifié dans Resend. Fix : configuration DNS complète chez Namecheap (DKIM, MX, SPF, DMARC) + bascule du "Mail Settings" de "Email Forwarding" à "Custom MX" pour débloquer le champ MX Record. Domaine vérifié, emails opérationnels. **Note** : nouveaux domaines d'envoi atterrissent souvent en Indésirables au début (comportement normal, se résout avec la réputation).

### 2. Lien de confirmation email → page introuvable
Cause : route `/auth/confirm` manquante. Fix : création de `src/app/auth/confirm/route.ts` (gère `exchangeCodeForSession` / `verifyOtp`), middleware mis à jour pour autoriser `/auth/*` en public, `emailRedirectTo` ajouté aux appels `signUp()`.

### 3. **Bug majeur** — Connexion complètement cassée en production
Cause : en éditant les variables d'environnement Vercel (pour Resend), la variable **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** s'est corrompue à plusieurs reprises — le champ masqué "Sensitive" de Vercel laissait des caractères de masquage `•` collés dans la valeur enregistrée au lieu de la vraie clé (`eyJhbGci••••••••...` au lieu de la vraie clé JWT). Diagnostiqué en téléchargeant et inspectant directement le JS déployé sur famo.health (aucun autre moyen de voir la vraie valeur stockée). Plusieurs tentatives de suppression/recréation de la variable ont échoué à corriger le problème durablement.

**Fix définitif** : plutôt que de continuer à dépendre du champ Vercel fragile, l'URL et la clé anon Supabase sont maintenant **fixées en dur** dans `src/lib/supabase/config.ts` (ce ne sont pas des secrets — Supabase les conçoit pour être publiques côté client). `process.env` reste prioritaire s'il est valide (détection des `•` parasites), sinon repli automatique sur les valeurs en dur. Utilisé par `client.ts`, `server.ts`, `middleware.ts`, `admin.ts`.

### 4. Lien d'invitation email pointait vers un mauvais domaine
Cause similaire : `NEXT_PUBLIC_APP_URL` avait une mauvaise valeur enregistrée dans Vercel depuis le tout début du projet (un sous-domaine `vercel.app` qui n'a jamais existé), donc le fallback `?? "https://famo.health"` ne se déclenchait jamais (la variable existait, juste avec une mauvaise valeur). Fix : même stratégie, `src/lib/site.ts` exporte `SITE_URL = "https://famo.health"` en dur, plus aucune dépendance à cette variable d'environnement.

### 5. Message d'erreur de la page d'invitation illisible
Cause : `acceptInvitation()` (`lib/invitations.ts`) utilisait `throw new Error(...)`, appelé directement depuis un composant client. **Next.js masque automatiquement le message des exceptions qui traversent la frontière serveur→client d'une Server Action en production** (sécurité, remplacé par un message générique anglais). Fix : conversion au pattern `{ ok, error }` utilisé partout ailleurs dans le code (les autres actions ne souffraient pas de ce bug car leurs `throw`, via `requireMembership()`, sont interceptés **côté serveur** avant de repartir vers le client).

## État actuel (déployé sur famo.health)

✅ Fonctionnel : landing, auth (login/signup/confirmation email), onboarding, dashboard (6 pages, design éditorial), invitations (création, email, acceptation), connexion Supabase (avec filet de sécurité en dur).

⚠️ Pas encore fait :
- **RLS désactivé** sur `families`/`family_members` — migration `supabase/migrations/004_reenable_rls.sql` écrite mais **non appliquée**. À tester en staging avant activation.
- **Stripe** : infra présente (`lib/stripe.ts`, webhook, cron) mais non branchée à l'UI, pas de mur de paiement.
- **Réputation email Resend** : domaine vérifié mais jeune, les emails peuvent atterrir en spam au début.
- **Crons** (`daily-doses`, `rx-expiry`, `visit-reminder`) : présents mais pas vérifiés/testés dans cette session.

## Règles à ne jamais casser

1. **Ne jamais modifier les variables d'environnement Vercel liées à Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) sans raison impérieuse — historique de corruption via le champ masqué Vercel. Les filets de sécurité en dur (`lib/supabase/config.ts`, `lib/site.ts`) doivent rester en place.
2. **Logo** : jamais le glyphe `ō` — toujours `Fam<span class="fm-o">o</span>` avec le CSS de `globals.css`.
3. **Server Actions** : toujours retourner `{ ok, error }`, jamais `throw` directement vers un composant client (sinon Next.js masque le message en production).
4. **Écritures sensibles** : toujours via Server Action + `requireMembership()` + client admin, jamais insert client direct.
5. Pas de Node/npm installé sur la machine de dev habituelle — validation par build Vercel au push, pas de build local possible.
