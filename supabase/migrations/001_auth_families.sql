create extension if not exists "pgcrypto";

create table public.families (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz default now(),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text default 'trialing'
);

create type public.member_role as enum ('admin', 'member', 'readonly');

create table public.family_members (
  id        uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      public.member_role not null default 'member',
  joined_at timestamptz default now(),
  unique (family_id, user_id)
);

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  invited_by  uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'member',
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at  timestamptz default now() + interval '7 days',
  created_at  timestamptz default now()
);

create index on public.invitations(token);
create index on public.invitations(email);

alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.profiles       enable row level security;
alter table public.invitations    enable row level security;

create or replace function public.is_family_member(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_admin(fid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.family_members
    where family_id = fid and user_id = auth.uid() and role = 'admin'
  );
$$;

create policy "families_select" on public.families for select using (public.is_family_member(id));
create policy "families_insert" on public.families for insert with check (auth.uid() = created_by);
create policy "families_update" on public.families for update using (public.is_family_admin(id));

create policy "members_select"       on public.family_members for select using (public.is_family_member(family_id));
create policy "members_insert_admin" on public.family_members for insert with check (public.is_family_admin(family_id) or user_id = auth.uid());
create policy "members_delete"       on public.family_members for delete using (public.is_family_admin(family_id) or user_id = auth.uid());

create policy "profiles_select" on public.profiles for select using (
  auth.uid() = id or exists (
    select 1 from public.family_members fm1
    join public.family_members fm2 on fm1.family_id = fm2.family_id
    where fm1.user_id = auth.uid() and fm2.user_id = id
  )
);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

create policy "invitations_select" on public.invitations for select using (
  public.is_family_admin(family_id) or
  email = (select email from auth.users where id = auth.uid())
);
create policy "invitations_insert"        on public.invitations for insert with check (public.is_family_admin(family_id));
create policy "invitations_update_accept" on public.invitations for update using (
  email = (select email from auth.users where id = auth.uid()) and
  accepted_at is null and expires_at > now()
);
