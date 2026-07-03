#!/usr/bin/env bash
# Famō — Script de configuration Supabase
# Usage : bash scripts/setup-supabase.sh

set -e
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Famō — Configuration Supabase${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# 1. Vérifier supabase CLI
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠ Supabase CLI non trouvé. Installation...${RESET}"
  npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI $(supabase --version)${RESET}"

# 2. Demander le project ref
echo ""
echo -e "${CYAN}Entrez votre Project Reference Supabase${RESET}"
echo -e "  → Dashboard Supabase → Settings → General → Reference ID"
echo -e "  → Format : abcdefghijklmnop (20 caractères)"
echo ""
read -p "Project ref : " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
  echo "Project ref requis. Abandon."
  exit 1
fi

# 3. Login + link
echo ""
echo -e "${CYAN}Connexion à Supabase...${RESET}"
supabase login

echo ""
echo -e "${CYAN}Liaison au projet ${PROJECT_REF}...${RESET}"
supabase link --project-ref "$PROJECT_REF"

# 4. Push migrations
echo ""
echo -e "${CYAN}Application des migrations...${RESET}"
supabase db push

echo ""
echo -e "${GREEN}✓ Migrations appliquées !${RESET}"

# 5. Générer les types TypeScript
echo ""
echo -e "${CYAN}Génération des types TypeScript...${RESET}"
supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/supabase/types.ts
echo -e "${GREEN}✓ Types générés dans src/lib/supabase/types.ts${RESET}"

# 6. Récupérer les clés
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Clés à copier dans .env.local${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${YELLOW}Récupérez ces valeurs sur :${RESET}"
echo -e "  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
echo ""
echo -e "  NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo -e "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>"
echo -e "  SUPABASE_SERVICE_ROLE_KEY=<service_role key>"
echo ""

# 7. Activer Realtime
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Activer Realtime (manuel)${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Dashboard → Database → Replication → Tables à activer :"
echo -e "    ${GREEN}✓ doses${RESET}           INSERT UPDATE DELETE"
echo -e "    ${GREEN}✓ visits${RESET}          INSERT UPDATE DELETE"
echo -e "    ${GREEN}✓ journal_entries${RESET} INSERT UPDATE DELETE"
echo -e "    ${GREEN}✓ vitals${RESET}          INSERT DELETE"
echo ""

# 8. Auth redirect URLs
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Auth Redirect URLs (manuel)${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Dashboard → Auth → URL Configuration :"
echo -e "    Site URL     : https://famo.app"
echo -e "    Redirect URLs: https://famo.app/**"
echo -e "                   http://localhost:3000/**"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}  ✓ Configuration Supabase terminée !${RESET}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Prochaine étape : remplir .env.local puis ${BOLD}npm run dev${RESET}"
echo ""
