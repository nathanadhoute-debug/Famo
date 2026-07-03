-- Seed de développement Famō
-- Crée une famille fictive pour tester sans passer par le flow signup

-- Note : en local, l'UUID des users auth est généré par Supabase.
-- Ce seed ne peut pas insérer de vrais users auth (géré par Supabase Auth).
-- Pour tester en dev : utiliser le flow signup normal sur localhost:3000.

-- Seed vide — les données sont créées via le flow onboarding.
-- Pour un seed de démo complet, utiliser le script scripts/seed-demo.ts

SELECT 'Famō seed prêt — créez votre compte via http://localhost:3000/signup' as message;
