-- Vue sécurisée exposant les emails (service_role uniquement — utilisée par les crons)
create or replace view public.auth_users as
  select id, email from auth.users;

revoke all on public.auth_users from anon, authenticated;
grant select on public.auth_users to service_role;
