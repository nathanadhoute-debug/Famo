# Famō

Coordination familiale pour l'aide à un proche âgé.  
Planning des visites · Médicaments · Journal · Documents

---

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** (Auth, PostgreSQL, Realtime, Storage)
- **Stripe** (abonnement 9€/mois, 14j d'essai)
- **Resend** (emails transactionnels)
- **Vercel** (hosting + crons)

---

## Setup local

### 1. Prérequis

```bash
node --version  # >= 18
npm --version   # >= 9
```

### 2. Cloner et installer

```bash
git clone <repo-url> famo
cd famo
npm install
cp .env.local.example .env.local
```

### 3. Configurer Supabase

**Option A — Script automatique (recommandé)**

```bash
bash scripts/setup-supabase.sh
```

**Option B — Manuel**

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Ouvrir **SQL Editor** dans le Dashboard
3. Coller et exécuter les migrations **dans l'ordre** :
   - `supabase/migrations/001_auth_families.sql`
   - `supabase/migrations/002_schema_complet.sql`
   - `supabase/migrations/003_auth_users_view.sql`
4. Vérifier avec `scripts/check-db.sql`
5. Générer les types TypeScript :
   ```bash
   npx supabase gen types typescript \
     --project-id <YOUR_PROJECT_REF> \
     > src/lib/supabase/types.ts
   ```

### 4. Activer Realtime

Dashboard Supabase → **Database → Replication** :

| Table             | Events              |
|-------------------|---------------------|
| `doses`           | INSERT UPDATE DELETE |
| `visits`          | INSERT UPDATE DELETE |
| `journal_entries` | INSERT UPDATE DELETE |
| `vitals`          | INSERT DELETE        |

### 5. Remplir `.env.local`

```bash
# Supabase — Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (compte test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...

# Crons
CRON_SECRET=<openssl rand -hex 32>
```

### 6. Lancer en dev

```bash
npm run dev
# → http://localhost:3000
```

---

## Structure du projet

```
famo/
├── src/
│   ├── app/
│   │   ├── (auth)/           # login · signup · invite/[token]
│   │   ├── (app)/
│   │   │   ├── dashboard/    # Vue d'ensemble (Server Component)
│   │   │   ├── dashboard/sante/
│   │   │   ├── dashboard/relais/
│   │   │   ├── dashboard/journal/
│   │   │   ├── dashboard/documents/
│   │   │   ├── dashboard/reglages/
│   │   │   └── onboarding/
│   │   ├── api/
│   │   │   ├── cron/daily-doses/    # 00:01 UTC
│   │   │   ├── cron/rx-expiry/      # 08:00 UTC
│   │   │   ├── cron/visit-reminder/ # 17:00 UTC
│   │   │   └── webhooks/stripe/
│   │   └── layout.tsx
│   ├── actions/              # Server Actions
│   ├── components/dashboard/ # Client Components
│   ├── hooks/                # useRealtimeFamily
│   └── lib/
│       ├── supabase/         # client · server · admin · types
│       ├── stripe.ts
│       └── invitations.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_auth_families.sql
│   │   ├── 002_schema_complet.sql
│   │   └── 003_auth_users_view.sql
│   └── seed.sql
├── scripts/
│   ├── setup-supabase.sh    # Configuration guidée
│   └── check-db.sql         # Vérification post-migration
├── vercel.json              # Crons Vercel
└── next.config.ts
```

---

## Déploiement Vercel

```bash
npm install -g vercel
vercel login
vercel link

# Ajouter les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_PREMIUM_PRICE_ID production
vercel env add RESEND_API_KEY production
vercel env add CRON_SECRET production

# Premier déploiement
git push origin main
```

### Webhook Stripe

```
URL : https://famo.app/api/webhooks/stripe

Events :
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  checkout.session.completed
```

### Tester les crons manuellement

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://famo.app/api/cron/daily-doses
```

---

## Auth redirect URLs (Supabase Dashboard)

```
Site URL     : https://famo.app
Redirect URLs: https://famo.app/**
               http://localhost:3000/**
```

---

## Commandes utiles

```bash
npm run dev          # Dev local
npm run build        # Build production
npm run type-check   # Vérification TypeScript

# Supabase
supabase db push     # Appliquer les migrations
supabase db diff     # Voir les différences
supabase gen types typescript --linked > src/lib/supabase/types.ts

# Stripe (dev)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Pages connectées

| Page        | Status  | Notes                          |
|-------------|---------|--------------------------------|
| Dashboard   | ✓ Live  | Server Component + Supabase    |
| Santé       | Stub    | Coller SantePage.tsx           |
| Relais      | Stub    | Coller RelaisPage.tsx          |
| Journal     | Stub    | Coller JournalPage.tsx         |
| Documents   | Stub    | Coller DocumentsPage.tsx       |
| Réglages    | Stub    | Coller ReglagesPage.tsx        |

Pour connecter une page stub, remplacer le contenu de `page.tsx`
par le Server Component correspondant + importer le Client Component.
