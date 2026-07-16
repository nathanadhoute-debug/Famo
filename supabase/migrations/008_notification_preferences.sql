-- Préférences de notification par membre du cercle (opt-out, tout activé
-- par défaut pour ne rien changer au comportement existant).

alter table public.family_members
  add column notify_rx_expiry      boolean not null default true,
  add column notify_visit_reminder boolean not null default true,
  add column notify_overdue_doses  boolean not null default true;
