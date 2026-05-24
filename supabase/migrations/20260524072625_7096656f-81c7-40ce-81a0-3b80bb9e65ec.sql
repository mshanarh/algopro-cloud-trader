
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  mentor_id text not null default ('AP-' || upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 8))),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- timestamp helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- EXPERT ADVISORS
create table public.expert_advisors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  file_url text,
  created_at timestamptz not null default now()
);
alter table public.expert_advisors enable row level security;

create policy "Owner select EAs" on public.expert_advisors for select using (auth.uid() = owner_id);
create policy "Owner insert EAs" on public.expert_advisors for insert with check (auth.uid() = owner_id);
create policy "Owner update EAs" on public.expert_advisors for update using (auth.uid() = owner_id);
create policy "Owner delete EAs" on public.expert_advisors for delete using (auth.uid() = owner_id);

-- LICENSE PLAN ENUM
create type public.license_plan as enum ('3_days','5_days','30_days','3_months','6_months','1_year');
create type public.license_status as enum ('active','expired','revoked');

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ea_id uuid references public.expert_advisors(id) on delete set null,
  username text not null,
  client_email text,
  plan public.license_plan not null,
  key text not null unique,
  status public.license_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.licenses enable row level security;

create policy "Owner select licenses" on public.licenses for select using (auth.uid() = owner_id);
create policy "Owner insert licenses" on public.licenses for insert with check (auth.uid() = owner_id);
create policy "Owner update licenses" on public.licenses for update using (auth.uid() = owner_id);
create policy "Owner delete licenses" on public.licenses for delete using (auth.uid() = owner_id);

create index licenses_owner_idx on public.licenses(owner_id);
create index eas_owner_idx on public.expert_advisors(owner_id);
