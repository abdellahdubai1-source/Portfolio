-- ============================================================================
--  Abdellah Teha Portfolio — Admin Dashboard
--  Supabase schema: tables, security (RLS), functions, triggers, realtime
-- ============================================================================
--  HOW TO RUN THIS FILE
--  1. Go to your Supabase project → SQL Editor → New query.
--  2. Paste this entire file and click "Run".
--  3. It is safe to re-run: every statement uses IF EXISTS / IF NOT EXISTS or
--     CREATE OR REPLACE, so re-running it will not duplicate data or error
--     out on a second run (except the sample data insert at the bottom,
--     which is guarded too).
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- Admins allow-list. A row here = that Supabase Auth user is a dashboard admin.
-- You do NOT sign up through a public form — you create the Auth user yourself
-- in the Supabase dashboard (Authentication → Users → Add user), then insert
-- their user id here. See SETUP.md for the exact steps.
create table if not exists public.admins (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- Contact-form submissions from the public website.
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 120),
  email      text not null check (char_length(trim(email)) between 3 and 180),
  phone      text check (phone is null or char_length(phone) <= 40),
  subject    text check (subject is null or char_length(subject) <= 160),
  message    text not null check (char_length(trim(message)) between 1 and 4000),
  status     text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

-- Portfolio projects shown on index.html (featured) and portfolio.html (all).
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(trim(title)) between 1 and 160),
  category     text not null default '' ,
  description  text not null default '',
  image_url    text,
  project_url  text,
  badge_text   text,              -- 2-letter fallback badge shown when there is no image
  featured     boolean not null default false,   -- true = appears in the homepage "Featured Projects"
  is_published boolean not null default true,     -- false = hidden from the public site entirely
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Client testimonials shown on index.html.
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(trim(name)) between 1 and 120),
  role          text not null default '',
  quote         text not null check (char_length(trim(quote)) between 1 and 800),
  avatar_letter text,             -- single letter shown in the round avatar
  is_published  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_messages_status      on public.messages (status);
create index if not exists idx_messages_created_at  on public.messages (created_at desc);
create index if not exists idx_projects_sort        on public.projects (sort_order);
create index if not exists idx_projects_featured    on public.projects (featured);
create index if not exists idx_testimonials_sort    on public.testimonials (sort_order);

-- ----------------------------------------------------------------------------
-- 3. updated_at TRIGGER
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonials_updated_at on public.testimonials;
create trigger trg_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. is_admin() — SECURITY DEFINER helper used inside RLS policies.
--    Runs with the privileges of the function owner, so it can check the
--    `admins` table even though normal callers have no direct SELECT rights
--    on it. Returns false (never errors) for anonymous / non-admin users.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.admins       enable row level security;
alter table public.messages     enable row level security;
alter table public.projects     enable row level security;
alter table public.testimonials enable row level security;

-- ----- admins: a logged-in user may only ever see their own membership row --
drop policy if exists "admins_select_self" on public.admins;
create policy "admins_select_self"
  on public.admins for select
  to authenticated
  using (auth.uid() = id);
-- Intentionally no insert/update/delete policy for anyone: admins are added
-- only via the Supabase SQL editor / dashboard by you, never through the app.

-- ----- messages: public can INSERT (the contact form), only admins can read/manage --
drop policy if exists "messages_insert_public" on public.messages;
create policy "messages_insert_public"
  on public.messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "messages_select_admin" on public.messages;
create policy "messages_select_admin"
  on public.messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "messages_update_admin" on public.messages;
create policy "messages_update_admin"
  on public.messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "messages_delete_admin" on public.messages;
create policy "messages_delete_admin"
  on public.messages for delete
  to authenticated
  using (public.is_admin());

-- ----- projects: public can read published rows, only admins can write / see drafts --
drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public"
  on public.projects for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "projects_insert_admin" on public.projects;
create policy "projects_insert_admin"
  on public.projects for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "projects_update_admin" on public.projects;
create policy "projects_update_admin"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "projects_delete_admin" on public.projects;
create policy "projects_delete_admin"
  on public.projects for delete
  to authenticated
  using (public.is_admin());

-- ----- testimonials: same pattern as projects --
drop policy if exists "testimonials_select_public" on public.testimonials;
create policy "testimonials_select_public"
  on public.testimonials for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "testimonials_insert_admin" on public.testimonials;
create policy "testimonials_insert_admin"
  on public.testimonials for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "testimonials_update_admin" on public.testimonials;
create policy "testimonials_update_admin"
  on public.testimonials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "testimonials_delete_admin" on public.testimonials;
create policy "testimonials_delete_admin"
  on public.testimonials for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. REALTIME — so new contact messages appear in the dashboard automatically
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception when undefined_object then
  -- The supabase_realtime publication is created automatically by Supabase.
  -- If it doesn't exist yet in your project, enable Realtime for the
  -- "messages" table from Database → Replication in the dashboard instead.
  raise notice 'supabase_realtime publication not found — enable Realtime for "messages" from the dashboard (Database > Replication).';
end $$;

-- ----------------------------------------------------------------------------
-- 7. OPTIONAL SAMPLE DATA — seeds your existing 6 projects + 3 testimonials
--    so the dashboard isn't empty on first login. Safe to skip or delete.
--    Guarded so it only inserts once (checks a title that should be unique).
-- ----------------------------------------------------------------------------
insert into public.projects (title, category, description, project_url, badge_text, featured, sort_order)
select * from (values
  ('Mercy Habesha Gold',        'Luxury Jewelry',   'A premium digital presence created for a Dubai-based gold and jewelry business.', 'https://abdellahdubai1-source.github.io/mercygold/',       'MG', true,  1),
  ('Smart Mobile AI',           'Mobile Store',     'A modern product website that makes browsing devices and requesting information simple.', 'https://abdellahdubai1-source.github.io/Smart-mobile/',    'SM', true,  2),
  ('The Olive Table',           'Restaurant',        'An elegant restaurant website designed to showcase the atmosphere, menu, and reservations.', 'https://abdellahdubai1-source.github.io/The-Olive-Table/', 'OT', true,  3),
  ('Glow Beauty Salon',         'Beauty & Wellness', 'A friendly salon website that helps customers explore services and book with confidence.', 'https://abdellahdubai1-source.github.io/Glow-Beauty-Salon/', 'GB', false, 4),
  ('Bright Smile Dental Clinic','Healthcare',        'A trustworthy clinic website that makes services and appointment options easy to understand.', 'https://abdellahdubai1-source.github.io/dental-clinic/',    'BS', false, 5),
  ('Elite Medical Clinic',      'Healthcare',        'A clean medical website created to communicate professionalism and patient confidence.', 'https://abdellahdubai1-source.github.io/clinic/',           'EM', false, 6)
) as v(title, category, description, project_url, badge_text, featured, sort_order)
where not exists (select 1 from public.projects p where p.title = v.title);

insert into public.testimonials (name, role, quote, avatar_letter, sort_order)
select * from (values
  ('Rania K.',  'Jewelry Business Owner', 'Abdellah delivered a website that finally feels as premium as our products. Communication was clear from day one and the result exceeded what we expected.', 'R', 1),
  ('Youssef B.', 'Retail Store Owner',     'Fast, professional, and genuinely invested in getting the details right. Our new site loads instantly and looks great on every device.', 'Y', 2),
  ('Layla M.',  'Restaurant Owner',        'Working with Abdellah felt like working with an agency, not a freelancer. Every milestone was delivered on time and exactly as promised.', 'L', 3)
) as v(name, role, quote, avatar_letter, sort_order)
where not exists (select 1 from public.testimonials t where t.name = v.name and t.quote = v.quote);

-- ============================================================================
--  DONE. Next step: create your admin auth user and add them to `admins`.
--  See SETUP.md, section "3. Create your admin login".
-- ============================================================================
