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

## Phase 4 — Config Supabase, sécurité RLS, mot de passe oublié, favicon (quatrième chantier, 12/07/2026)

### 1. Lien de confirmation email → redirigeait vers `localhost:3000`
Cause : contrairement à la Phase 3 #2/#4 (déjà réglées côté code), ici le problème était purement dans le **dashboard Supabase** (Authentication → URL Configuration), jamais synchronisé avec le domaine prod : **Site URL** était resté sur `localhost:3000` et **Redirect URLs** était complètement vide. Supabase ignore `emailRedirectTo` si l'URL n'est pas dans la liste blanche Redirect URLs, et retombe sur le Site URL par défaut. Fix (dashboard, pas de code) : Site URL → `https://famo.health`, Redirect URLs → `https://famo.health/**`.

### 2. `email rate limit exceeded` en créant des comptes
Cause : les emails de confirmation d'inscription passaient par le mailer intégré gratuit de Supabase (expéditeur "Supabase Auth"), limité à quelques emails/heure — épuisé après plusieurs tests de signup. Différent des emails d'invitation, qui passent par Resend directement via `lib/actions/invites.ts`. Fix : **SMTP personnalisé activé** dans Supabase (Authentication → Emails → SMTP Settings) pointant vers Resend (`smtp.resend.com:465`, user `resend`, nouvelle clé API Resend dédiée `famo-smtp-supabase`, distincte de la clé prod existante pour ne pas la toucher). Limite passée à 30 emails/heure (ajustable). Tous les emails auth (confirmation, reset password) partent maintenant via Resend, expéditeur "Famō".

### 3. Flux d'invitation : faux message d'erreur après inscription
Cause : sur `/invite/[token]`, `handleAuth()` appelait `accept()` immédiatement après `signUp()`, sans vérifier qu'une session existait — or avec confirmation email obligatoire, `signUp()` ne crée pas de session tant que le lien n'est pas cliqué. Résultat : message "Invitation invalide — vous devez être connecté" juste après une inscription pourtant réussie. Fix : `src/app/(auth)/invite/[token]/page.tsx` vérifie `data.session` après `signUp()` ; si absent, affiche un écran "Vérifiez vos emails" au lieu d'appeler `accept()` prématurément.

### 4. Ajout du flux "mot de passe oublié"
N'existait pas du tout. Ajouté : lien sur `/login`, page `/forgot-password` (`resetPasswordForEmail`, message identique que l'email existe ou non — anti-énumération), page `/reset-password` (`updateUser({ password })`, vérifie qu'une session de récupération existe). Passe par la route `/auth/confirm` existante, inchangée. `middleware.ts` : ces deux routes ajoutées aux `publicRoutes`.

### 5. Réactivation de RLS sur `families` / `family_members`
La migration `004_reenable_rls.sql` (écrite en Phase 1, jamais appliquée) a été exécutée manuellement dans le SQL Editor Supabase. Vérification préalable : les 6 policies de la migration 001 (`families_select/insert/update`, `members_select/insert_admin/delete`) existaient toujours en base (`select * from pg_policies where tablename in (...)`) malgré RLS désactivé — donc `enable row level security` a suffi, pas besoin de recréer les policies. Toutes les écritures passent déjà par le client admin (bypass RLS), toutes les lectures identifiées (`lib/family.ts`, `lib/auth-guard.ts`) sont déjà correctement scopées par `user_id`/`family_id` → aucune régression attendue. Vérifié fonctionnel avec le compte admin. Rollback si besoin : `alter table public.families/family_members disable row level security;`.

### 6. Favicon : logo Vercel par défaut au lieu du logo Famō
Cause : `src/app/favicon.ico` était resté le fichier par défaut de `create-next-app` (contient littéralement le logo Vercel — triangle noir) depuis le tout début du projet, jamais remplacé. De plus, aucune icône pour les aperçus de lien iOS/iMessage (`apple-touch-icon`) n'existait. Fix : `src/app/icon.tsx` et `src/app/apple-icon.tsx` génèrent le mark du logo (carré sauge + cœur) via `next/og` (`ImageResponse`), pas d'image statique à gérer. `favicon.ico` par défaut supprimé.

**Bug additionnel découvert en testant** : le matcher du middleware n'excluait que `favicon.ico`, donc `/icon` et `/apple-icon` étaient interceptés comme des pages protégées — un crawler sans session (Apple, curl) recevait une redirection 307 vers `/login` au lieu de l'image. Fix : ajout de `icon|apple-icon` à l'exclusion du matcher.

**Piège à connaître** : même après le fix (vérifié correct côté serveur : `/favicon.ico` → 404, `/icon` et `/apple-icon` → 200 avec la bonne image), l'ancienne icône peut continuer à s'afficher dans Safari/iMessage sur tous les appareils (y compris navigation privée) — c'est le **cache d'icônes propre à Apple** (partagé via iCloud pour l'historique, les suggestions, les Top Sites), pas un bug résiduel côté app. Se corrige tout seul en quelques jours, rien à re-déboguer si ça revient.

### 7. Ajustement mineur du macron du logo
Taille réduite (`0.58em/0.085em` → `0.5em/0.07em` dans `.fm-o::after`, `globals.css`) sur demande, cosmétique uniquement.

## État actuel (déployé sur famo.health)

✅ Fonctionnel : landing, auth (login/signup/confirmation email/**mot de passe oublié**), onboarding, dashboard (6 pages, design éditorial), invitations (création, email, acceptation), connexion Supabase (avec filet de sécurité en dur), **SMTP personnalisé Resend pour tous les emails auth**, **RLS actif sur families/family_members**, **favicon/icônes de lien corrects**, **suivi médicaments (ajout, horaires, ordonnance) + les 3 crons (daily-doses, rx-expiry, visit-reminder) réellement implémentés**.

⚠️ Pas encore fait :
- **Stripe** : infra présente (`lib/stripe.ts`, webhook, cron) mais non branchée à l'UI, pas de mur de paiement.
- **Réputation email Resend** : domaine vérifié mais jeune, les emails peuvent atterrir en spam au début.
- Test RLS avec un compte membre non-admin non réalisé (seul le compte admin a été vérifié après réactivation) — à garder en tête si un membre signale un souci d'affichage.
- **Pas de page de confidentialité/mentions légales** — l'app manipule des données de santé (médicaments, journal), catégorie sensible en RGPD. À faire avant une candidature/démo externe.
- **Rendu mobile jamais vérifié** — l'app est probablement utilisée depuis un téléphone en priorité par les familles, à tester.
- Les emails des 2 nouveaux crons (rx-expiry, visit-reminder) n'ont pas encore pu être testés en conditions réelles (aucune donnée ne matche encore les critères de déclenchement).

### Phase 5 — Suivi médicaments + crons fonctionnels (13/07/2026)

Les crons existaient depuis la Phase 1 mais étaient des coquilles vides (`// TODO`). En creusant pour les implémenter, découverte que **rien dans l'UI ne permettait de créer un médicament** — les tables `medications`/`medication_schedules`/`doses`/`prescriptions` existaient en base depuis le début mais avaient été laissées de côté pendant le redesign éditorial (remplacées par le système générique `vitals`). `DoseList.tsx` et `toggleDose()` existaient déjà et fonctionnaient, mais rien ne les alimentait.

Ajouté :
- `lib/actions/health.ts` : `addMedication()` (+ horaires de prise) et `deactivateMedication()` (désactivation plutôt que suppression, conserve l'historique des prises).
- `components/dashboard/MedicationsManager.tsx` : formulaire médicament (nom, dose, catégorie, horaires, ordonnance + date d'expiration, critique).
- Page Santé : affiche maintenant `DoseList` (prises du jour, déjà existant) + `MedicationsManager` + `VitalsManager`.
- `lib/cron-mail.ts` : utilitaire partagé (emails du cercle + envoi Resend) pour les crons.
- **daily-doses** : appelle `generate_daily_doses()` (RPC).
- **rx-expiry** : alerte le cercle quand une ordonnance expire dans exactement 30 jours (déclenchement unique, pas de répétition quotidienne).
- **visit-reminder** : alerte le cercle la veille d'une visite avec visiteur assigné.
- Destinataire des alertes : tout le cercle familial (décision produit, pas juste la personne concernée).
- `types.ts` : ajout du type pour la vue `auth_users` (existait en SQL, jamais déclarée côté TS).

## Règles à ne jamais casser

1. **Ne jamais modifier les variables d'environnement Vercel liées à Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) sans raison impérieuse — historique de corruption via le champ masqué Vercel. Les filets de sécurité en dur (`lib/supabase/config.ts`, `lib/site.ts`) doivent rester en place.
2. **Logo** : jamais le glyphe `ō` — toujours `Fam<span class="fm-o">o</span>` avec le CSS de `globals.css`.
3. **Server Actions** : toujours retourner `{ ok, error }`, jamais `throw` directement vers un composant client (sinon Next.js masque le message en production).
4. **Écritures sensibles** : toujours via Server Action + `requireMembership()` + client admin, jamais insert client direct.
5. Pas de Node/npm installé sur la machine de dev habituelle — validation par build Vercel au push, pas de build local possible.
6. **Config Supabase Auth (Site URL, Redirect URLs, SMTP Settings) vit dans le dashboard, pas dans le code/git** — si un comportement d'auth casse sans changement de code correspondant, vérifier ces réglages en premier avant de chercher un bug applicatif.
7. **Nouvelle route publique ajoutée dans `app/`** (favicon, icônes, futures routes techniques) → toujours vérifier qu'elle est exclue du matcher de `middleware.ts`, sinon elle sera traitée comme une page protégée et redirigée vers `/login`.
