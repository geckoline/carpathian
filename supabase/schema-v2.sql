-- Carpathian schema v2
-- Full rebuild target for Supabase/Postgres with PostGIS.
-- Migration note: legacy "air" project data is mapped to Climate Change and
-- should be reviewed manually before production launch.

create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  label text not null unique,
  sort_order integer not null,
  active boolean not null default true
);

insert into public.categories (id, label, sort_order, active) values
  ('biodiversity', 'Biodiversity', 10, true),
  ('spatial-planning', 'Spatial Planning', 20, true),
  ('water', 'Water', 30, true),
  ('agriculture', 'Agriculture', 40, true),
  ('forests', 'Forests', 50, true),
  ('tourism', 'Tourism', 60, true),
  ('cultural-heritage', 'Cultural Heritage', 70, true),
  ('industry-infrastructure', 'Industry & Infrastructure', 80, true),
  ('awareness-education', 'Awareness & Education', 90, true),
  ('climate-change', 'Climate Change', 100, true)
on conflict (id) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text not null,
  country text not null,
  degree text,
  headline text,
  expertise_subtitle text,
  bio text,
  expertise text[] not null default '{}',
  publications integer default 0,
  projects integer default 0,
  email varchar,
  linkedin text,
  scopus text,
  orcid text,
  google_scholar text,
  avatar_url text,
  is_cs boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'planned' check (status in ('active', 'past', 'planned')),
  category_id text not null references public.categories(id),
  description text,
  location text not null,
  start_year integer,
  end_year integer,
  region_label text,
  card_summary text,
  focus_summary text,
  outputs_summary text,
  lead_expert_id uuid not null references public.experts(id),
  website text,
  country text,
  contact_name text,
  contact_email text,
  is_cs boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_year is null or start_year is null or end_year >= start_year)
);

create table if not exists public.project_locations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  geom geometry(Geometry, 4326) not null,
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists project_locations_geom_idx
  on public.project_locations using gist (geom);

create unique index if not exists project_locations_one_primary_idx
  on public.project_locations (project_id)
  where is_primary;

create table if not exists public.project_experts (
  project_id uuid not null references public.projects(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  role text not null check (role in ('lead', 'contact', 'contributor')),
  primary key (project_id, expert_id, role)
);

create or replace function public.sync_project_lead_expert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.lead_expert_id is distinct from new.lead_expert_id then
    delete from public.project_experts
    where project_id = old.id
      and expert_id = old.lead_expert_id
      and role = 'lead';
  end if;

  insert into public.project_experts (project_id, expert_id, role)
  values (new.id, new.lead_expert_id, 'lead')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists projects_sync_lead_expert on public.projects;
create trigger projects_sync_lead_expert
after insert or update of lead_expert_id on public.projects
for each row
execute function public.sync_project_lead_expert();

create table if not exists public.volunteer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email varchar not null,
  city text not null,
  country text not null,
  home_location geography(Point, 4326) not null,
  radius_km numeric not null check (radius_km > 0 and radius_km <= 500),
  note text,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'pending_review')),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists volunteer_subscriptions_home_location_idx
  on public.volunteer_subscriptions using gist (home_location);

create table if not exists public.volunteer_subscription_categories (
  subscription_id uuid not null references public.volunteer_subscriptions(id) on delete cascade,
  category_id text not null references public.categories(id),
  primary key (subscription_id, category_id)
);

drop view if exists public.app_projects;
create view public.app_projects as
select
  p.id,
  p.name,
  p.status,
  p.category_id,
  c.label as field,
  coalesce(p.description, '') as description,
  p.location,
  coalesce(pl.label, p.region_label, p.country, 'Carpathian region') as display_location,
  coalesce(p.region_label, pl.label, p.country, 'Carpathian region') as region_label,
  case
    when p.start_year is not null and p.end_year is not null then p.start_year::text || '-' || p.end_year::text
    when p.start_year is not null then p.start_year::text || '-' || p.start_year::text
    else null
  end as year_range,
  p.start_year,
  p.end_year,
  st_y(st_centroid(coalesce(pl.geom, st_geomfromtext('POINT(25 47.5)', 4326)))) as lat,
  st_x(st_centroid(coalesce(pl.geom, st_geomfromtext('POINT(25 47.5)', 4326)))) as lng,
  p.lead_expert_id as lead_expert_id,
  e.name as lead_expert_name,
  coalesce(linked.linked_expert_ids, array[p.lead_expert_id::text]) as linked_expert_ids,
  p.website,
  null::text as area,
  p.country,
  coalesce(p.contact_email, e.email) as contact,
  p.contact_name,
  p.contact_email,
  p.card_summary,
  p.focus_summary,
  p.outputs_summary,
  p.is_cs
from public.projects p
join public.categories c on c.id = p.category_id
left join public.project_locations pl on pl.project_id = p.id and pl.is_primary
left join lateral (
  select array_agg(distinct pe.expert_id::text) as linked_expert_ids
  from public.project_experts pe
  where pe.project_id = p.id
) linked on true
join public.experts e on e.id = p.lead_expert_id;

drop view if exists public.app_experts;
create view public.app_experts as
select * from public.experts;

create or replace function public.find_volunteers_for_project(project_id uuid)
returns table (
  subscription_id uuid,
  full_name text,
  email varchar,
  city text,
  country text,
  radius_km numeric,
  distance_km double precision,
  matched_category text
)
language sql
stable
security definer
set search_path = public
as $$
  with target_project as (
    select
      p.id,
      p.category_id,
      p.is_cs,
      geography(st_centroid(pl.geom)) as project_location
    from public.projects p
    join public.project_locations pl on pl.project_id = p.id and pl.is_primary
    where p.id = find_volunteers_for_project.project_id
  )
  select
    vs.id as subscription_id,
    vs.full_name,
    vs.email,
    vs.city,
    vs.country,
    vs.radius_km,
    st_distance(vs.home_location, tp.project_location) / 1000.0 as distance_km,
    tp.category_id as matched_category
  from target_project tp
  join public.volunteer_subscription_categories vsc on vsc.category_id = tp.category_id
  join public.volunteer_subscriptions vs on vs.id = vsc.subscription_id
  where tp.is_cs = true
    and vs.status = 'active'
    and vs.consent_at is not null
    and st_dwithin(vs.home_location, tp.project_location, vs.radius_km * 1000.0)
  order by distance_km asc;
$$;

alter table public.volunteer_subscriptions enable row level security;
alter table public.volunteer_subscription_categories enable row level security;

drop policy if exists volunteer_subscriptions_insert_public on public.volunteer_subscriptions;
create policy volunteer_subscriptions_insert_public
on public.volunteer_subscriptions
for insert
to anon, authenticated
with check (consent_at is not null and status = 'active');

drop policy if exists volunteer_subscription_categories_insert_public on public.volunteer_subscription_categories;
create policy volunteer_subscription_categories_insert_public
on public.volunteer_subscription_categories
for insert
to anon, authenticated
with check (true);
