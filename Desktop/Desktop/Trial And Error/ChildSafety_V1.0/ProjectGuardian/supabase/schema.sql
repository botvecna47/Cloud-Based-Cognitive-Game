-- Project Guardian — minimal Supabase schema (run in SQL editor)
-- For hackathon MVP, RLS is left **disabled**; enable + policies before production.

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  captured_at timestamptz not null,
  window_title text,
  process_name text,
  text_snippet text,
  sentiment_score double precision,
  sentiment_label text,
  risk_score double precision,
  risk_label text,
  alert boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_events_device_time on public.events (device_id, captured_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

-- RLS off for MVP so Streamlit + brain can use service role without policy friction.
alter table public.events disable row level security;
alter table public.alerts disable row level security;

-- Production checklist:
-- alter table public.events enable row level security;
-- create policy ... using (auth.uid() = parent_id) etc.
