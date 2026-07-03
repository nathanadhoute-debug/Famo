-- Famō — Vérification post-migration
-- Coller dans Supabase Dashboard → SQL Editor après les 3 migrations

-- 1. Tables créées
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_name = t.table_name AND table_schema = 'public') as colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Vues créées
SELECT table_name as vue
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. RLS activé sur toutes les tables
SELECT tablename,
       CASE WHEN rowsecurity THEN '✓ Activé' ELSE '✗ DÉSACTIVÉ' END as rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Politiques RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Fonctions créées
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 6. Bucket storage
SELECT id, name, public FROM storage.buckets;
