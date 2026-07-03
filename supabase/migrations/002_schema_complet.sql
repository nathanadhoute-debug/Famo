create table public.parents (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null,
  birth_date date,
  notes      text,
  avatar_url text,
  created_at timestamptz default now()
);
create index on public.parents(family_id);

create table public.visits (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  parent_id   uuid not null references public.parents(id) on delete cascade,
  visitor_id  uuid references auth.users(id) on delete set null,
  visit_date  date not null,
  note        text,
  created_at  timestamptz default now(),
  unique (parent_id, visit_date)
);
create index on public.visits(family_id);
create index on public.visits(parent_id, visit_date);

create type public.med_category as enum (
  'Cardiologie','Diabète','Antalgique','Neurologie',
  'Pneumologie','Rhumatologie','Autre'
);

create table public.medications (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.families(id) on delete cascade,
  parent_id     uuid not null references public.parents(id) on delete cascade,
  name          text not null,
  dose          text not null,
  category      public.med_category default 'Autre',
  critical      boolean default false,
  rx_label      text,
  rx_expires_at date,
  active        boolean default true,
  created_at    timestamptz default now()
);
create index on public.medications(parent_id);

create table public.medication_schedules (
  id            uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_time time not null,
  unique (medication_id, scheduled_time)
);
create index on public.medication_schedules(medication_id);

create table public.doses (
  id            uuid primary key default gen_random_uuid(),
  schedule_id   uuid not null references public.medication_schedules(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  family_id     uuid not null references public.families(id) on delete cascade,
  dose_date     date not null,
  given         boolean default false,
  given_by      uuid references auth.users(id) on delete set null,
  given_at      timestamptz,
  note          text,
  created_at    timestamptz default now(),
  unique (schedule_id, dose_date)
);
create index on public.doses(family_id, dose_date);
create index on public.doses(medication_id, dose_date);

create table public.vitals (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  parent_id   uuid not null references public.parents(id) on delete cascade,
  recorded_by uuid references auth.users(id) on delete set null,
  label       text not null,
  value       text not null,
  unit        text,
  icon        text default '📋',
  recorded_at timestamptz default now()
);
create index on public.vitals(parent_id, recorded_at desc);

create table public.prescriptions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  parent_id  uuid not null references public.parents(id) on delete cascade,
  label      text not null,
  prescriber text,
  issued_at  date,
  expires_at date,
  file_url   text,
  created_at timestamptz default now()
);
create index on public.prescriptions(parent_id);

create type public.journal_tag as enum (
  'santé','rdv','humeur','repas','urgence','note','médicament'
);

create table public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  parent_id  uuid not null references public.parents(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  tags       public.journal_tag[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.journal_entries(family_id, created_at desc);

create type public.doc_category as enum (
  'Ordonnance','Analyse','Compte-rendu','Identité','Assurance','Autre'
);

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  parent_id   uuid not null references public.parents(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  category    public.doc_category default 'Autre',
  label       text not null,
  file_url    text not null,
  file_size   bigint,
  mime_type   text,
  created_at  timestamptz default now()
);
create index on public.documents(parent_id, category);

create table public.medical_contacts (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  parent_id    uuid not null references public.parents(id) on delete cascade,
  name         text not null,
  role         text not null,
  phone        text,
  email        text,
  address      text,
  is_emergency boolean default false,
  created_at   timestamptz default now()
);
create index on public.medical_contacts(parent_id);

-- RLS
alter table public.parents            enable row level security;
alter table public.visits             enable row level security;
alter table public.medications        enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.doses              enable row level security;
alter table public.vitals             enable row level security;
alter table public.prescriptions      enable row level security;
alter table public.journal_entries    enable row level security;
alter table public.documents          enable row level security;
alter table public.medical_contacts   enable row level security;

-- parents
create policy "parents_select" on public.parents for select using (public.is_family_member(family_id));
create policy "parents_insert" on public.parents for insert with check (public.is_family_member(family_id));
create policy "parents_update" on public.parents for update using (public.is_family_admin(family_id));
create policy "parents_delete" on public.parents for delete using (public.is_family_admin(family_id));

-- visits
create policy "visits_select" on public.visits for select using (public.is_family_member(family_id));
create policy "visits_insert" on public.visits for insert with check (public.is_family_member(family_id));
create policy "visits_update" on public.visits for update using (public.is_family_member(family_id));
create policy "visits_delete" on public.visits for delete using (public.is_family_admin(family_id) or visitor_id = auth.uid());

-- medications
create policy "meds_select" on public.medications for select using (public.is_family_member(family_id));
create policy "meds_insert" on public.medications for insert with check (public.is_family_member(family_id));
create policy "meds_update" on public.medications for update using (public.is_family_member(family_id));
create policy "meds_delete" on public.medications for delete using (public.is_family_admin(family_id));

-- medication_schedules (join via medication)
create policy "schedules_select" on public.medication_schedules for select using (
  exists (select 1 from public.medications m where m.id = medication_id and public.is_family_member(m.family_id))
);
create policy "schedules_insert" on public.medication_schedules for insert with check (
  exists (select 1 from public.medications m where m.id = medication_id and public.is_family_member(m.family_id))
);
create policy "schedules_delete" on public.medication_schedules for delete using (
  exists (select 1 from public.medications m where m.id = medication_id and public.is_family_admin(m.family_id))
);

-- doses
create policy "doses_select" on public.doses for select using (public.is_family_member(family_id));
create policy "doses_insert" on public.doses for insert with check (public.is_family_member(family_id));
create policy "doses_update" on public.doses for update using (public.is_family_member(family_id));

-- vitals
create policy "vitals_select" on public.vitals for select using (public.is_family_member(family_id));
create policy "vitals_insert" on public.vitals for insert with check (public.is_family_member(family_id));
create policy "vitals_delete" on public.vitals for delete using (public.is_family_admin(family_id) or recorded_by = auth.uid());

-- prescriptions
create policy "rx_select" on public.prescriptions for select using (public.is_family_member(family_id));
create policy "rx_insert" on public.prescriptions for insert with check (public.is_family_member(family_id));
create policy "rx_update" on public.prescriptions for update using (public.is_family_member(family_id));
create policy "rx_delete" on public.prescriptions for delete using (public.is_family_admin(family_id));

-- journal
create policy "journal_select" on public.journal_entries for select using (public.is_family_member(family_id));
create policy "journal_insert" on public.journal_entries for insert with check (public.is_family_member(family_id));
create policy "journal_update" on public.journal_entries for update using (author_id = auth.uid());
create policy "journal_delete" on public.journal_entries for delete using (author_id = auth.uid() or public.is_family_admin(family_id));

-- documents
create policy "docs_select" on public.documents for select using (public.is_family_member(family_id));
create policy "docs_insert" on public.documents for insert with check (public.is_family_member(family_id));
create policy "docs_delete" on public.documents for delete using (uploaded_by = auth.uid() or public.is_family_admin(family_id));

-- contacts
create policy "contacts_select" on public.medical_contacts for select using (public.is_family_member(family_id));
create policy "contacts_insert" on public.medical_contacts for insert with check (public.is_family_member(family_id));
create policy "contacts_update" on public.medical_contacts for update using (public.is_family_member(family_id));
create policy "contacts_delete" on public.medical_contacts for delete using (public.is_family_admin(family_id));

-- Storage bucket
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;

create policy "storage_select" on storage.objects for select using (
  bucket_id = 'documents' and public.is_family_member((storage.foldername(name))[1]::uuid)
);
create policy "storage_insert" on storage.objects for insert with check (
  bucket_id = 'documents' and public.is_family_member((storage.foldername(name))[1]::uuid)
);
create policy "storage_delete" on storage.objects for delete using (
  bucket_id = 'documents' and public.is_family_admin((storage.foldername(name))[1]::uuid)
);

-- Vues
-- vue corrigée ci-dessous
select
  d.id, d.dose_date, d.given, d.given_by, d.given_at,
  m.id          as medication_id,
  m.family_id, m.parent_id,
  m.name        as med_name,
  m.dose        as med_dose,
  m.category, m.critical,
  ms.scheduled_time,
  (not d.given and (current_time > ms.scheduled_time)) as is_overdue,
  p.full_name   as given_by_name
from public.doses d
join public.medication_schedules ms on ms.id = d.schedule_id
join public.medications m           on m.id  = d.medication_id
left join public.profiles p         on p.id  = d.given_by
where d.dose_date = current_date;

create or replace view public.week_visits as
select
  v.id, v.visit_date, v.visitor_id, v.note,
  v.parent_id, v.family_id,
  p.full_name   as visitor_name,
  (v.visit_date - current_date) as day_offset
from public.visits v
left join public.profiles p on p.id = v.visitor_id
where v.visit_date between current_date - 1 and current_date + 6;

-- Fonction cron doses
create or replace function public.generate_daily_doses(target_date date default current_date)
returns void language plpgsql security definer as $$
begin
  insert into public.doses (schedule_id, medication_id, family_id, dose_date)
  select ms.id, m.id, m.family_id, target_date
  from public.medication_schedules ms
  join public.medications m on m.id = ms.medication_id
  where m.active = true
  on conflict (schedule_id, dose_date) do nothing;
end;
$$;

-- Fonction ordonnances expirant
create or replace function public.expiring_prescriptions(days_ahead int default 30)
returns table (
  prescription_id uuid, family_id uuid,
  parent_name text, rx_label text, expires_at date
) language sql security definer stable as $$
  select m.id, m.family_id, pa.name, m.rx_label, m.rx_expires_at
  from public.medications m
  join public.parents pa on pa.id = m.parent_id
  where m.active = true
    and m.rx_expires_at is not null
    and m.rx_expires_at between current_date and current_date + days_ahead;
$$;

select public.generate_daily_doses();
