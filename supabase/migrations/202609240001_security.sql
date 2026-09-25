-- Sabre account/device licensing.  Apply before deploying the Edge Functions.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = upper(username)),
  office_id text not null check (office_id = upper(office_id)),
  email text not null unique,
  role text not null default 'student' check (role in ('student','supervisor')),
  device_limit smallint not null default 1 check (device_limit between 1 and 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null unique, device_name text, app_type text not null default 'web',
  activated_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  revoked_at timestamptz, revoked_by uuid references public.profiles(id), unique(user_id,device_id)
);
create table if not exists public.license_events (
  id bigint generated always as identity primary key, user_id uuid references public.profiles(id) on delete set null,
  device_id text, event_type text not null, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists devices_active_user_idx on public.devices(user_id) where revoked_at is null;
create index if not exists license_events_user_event_idx on public.license_events(user_id,event_type,created_at desc);
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.license_events enable row level security;
drop policy if exists "profile owner read" on public.profiles;
drop policy if exists "device owner read" on public.devices;
drop policy if exists "event owner read" on public.license_events;
create policy "profile owner read" on public.profiles for select to authenticated using (id=auth.uid());
create policy "device owner read" on public.devices for select to authenticated using (user_id=auth.uid());
create policy "event owner read" on public.license_events for select to authenticated using (user_id=auth.uid());
-- Browser clients receive no write policies.  Edge Functions use service_role.
