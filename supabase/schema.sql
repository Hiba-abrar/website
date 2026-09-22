-- ============================================================
-- TechFest 2026 — Supabase schema
-- Run this once in your Supabase project's SQL editor
-- Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

create table if not exists universities (
  name text primary key
);

create table if not exists interest_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  university text not null,
  created_at timestamptz not null default now()
);

insert into universities (name) values
  ('Habib University'),
  ('Jinnah University for Women'),
  ('NUST'),
  ('IBA'),
  ('FAST'),
  ('Karachi University'),
  ('Bahria University'),
  ('Dawood University'),
  ('Iqra University'),
  ('AL-Kawthar University')
on conflict (name) do nothing;

create or replace view university_interest_counts as
select
  u.name,
  count(s.id)::int as count
from universities u
left join interest_submissions s on s.university = u.name
group by u.name
order by u.name;

alter table universities enable row level security;
alter table interest_submissions enable row level security;

drop policy if exists "Public can read universities" on universities;
create policy "Public can read universities"
  on universities for select
  using (true);

drop policy if exists "Public can read interest submissions" on interest_submissions;
create policy "Public can read interest submissions"
  on interest_submissions for select
  using (true);

drop policy if exists "Public can submit interest" on interest_submissions;
create policy "Public can submit interest"
  on interest_submissions for insert
  with check (true);

-- Enable realtime for the tables that the site listens to.
-- Without this, Supabase will not broadcast inserts to the browser.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.interest_submissions;
    alter publication supabase_realtime add table public.universities;
  end if;
end $$;

grant select on university_interest_counts to anon;

select * from universities;
