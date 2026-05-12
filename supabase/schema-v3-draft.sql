-- Carpathian schema v3 draft
-- Purpose: reviewed rebuild target before any destructive database operation.
-- Status: inspection draft only. Do not run against production until the
-- export -> review -> rebuild -> import workflow has been approved.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.categories (
  id text primary key,
  sort_order integer not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is
  'Canonical category ids only. Display labels live in the application layer.';

insert into public.categories (id, sort_order, active) values
  ('biodiversity', 10, true),
  ('spatial-planning', 20, true),
  ('water', 30, true),
  ('agriculture', 40, true),
  ('forests', 50, true),
  ('tourism', 60, true),
  ('cultural-heritage', 70, true),
  ('industry-infrastructure', 80, true),
  ('awareness-education', 90, true),
  ('climate-change', 100, true);

create table public.experts (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  institution text not null,
  country text not null,
  degree text,
  headline text,
  expertise_subtitle text,
  bio text,
  expertise text[] not null default '{}',
  publications integer not null default 0 check (publications >= 0),
  email varchar,
  linkedin text,
  scopus text,
  orcid text,
  google_scholar text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index experts_email_unique_idx
  on public.experts (lower(email))
  where email is not null;

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  status text not null default 'planned' check (status in ('active', 'past', 'planned')),
  category_id text not null,
  description text,
  location text not null,
  start_year integer,
  end_year integer,
  region_label text,
  card_summary text,
  focus_summary text,
  outputs_summary text,
  lead_expert_id uuid not null,
  website text,
  country text,
  is_cs boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_category_id_fkey foreign key (category_id) references public.categories(id),
  constraint projects_lead_expert_id_fkey foreign key (lead_expert_id) references public.experts(id),
  check (start_year is null or start_year between 1900 and 2200),
  check (end_year is null or end_year between 1900 and 2200),
  check (end_year is null or start_year is null or end_year >= start_year)
);

comment on column public.projects.lead_expert_id is
  'Mandatory primary expert for the project. This id must match the project_experts expert_id row where role = lead.';

create index projects_category_idx on public.projects (category_id);
create index projects_is_cs_idx on public.projects (is_cs);
create index projects_lead_expert_idx on public.projects (lead_expert_id);

create table public.project_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  geom extensions.geometry(Geometry, 4326) not null,
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index project_locations_project_idx on public.project_locations (project_id);
create index project_locations_geom_idx on public.project_locations using gist (geom);
create unique index project_locations_one_primary_idx
  on public.project_locations (project_id)
  where is_primary;

create table public.project_experts (
  project_id uuid not null references public.projects(id) on delete cascade,
  expert_id uuid not null references public.experts(id) on delete cascade,
  role text not null check (role in ('lead', 'contact', 'contributor')),
  created_at timestamptz not null default now(),
  primary key (project_id, expert_id)
);

comment on table public.project_experts is
  'Project-to-expert relationship table. It stores the mandatory lead row plus optional contact/contributor expert rows.';

comment on column public.project_experts.role is
  'The lead role is synchronized with projects.lead_expert_id; contact and contributor are additional linked experts.';

create index project_experts_expert_idx on public.project_experts (expert_id);
create index project_experts_role_idx on public.project_experts (role);
create unique index project_experts_one_lead_idx
  on public.project_experts (project_id)
  where role = 'lead';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger experts_set_updated_at
before update on public.experts
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace function public.sync_project_lead_expert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Keep projects.lead_expert_id and project_experts(role = lead) as the same relationship.
  if tg_op = 'UPDATE' and old.lead_expert_id is distinct from new.lead_expert_id then
    delete from public.project_experts
    where project_id = old.id
      and expert_id = old.lead_expert_id
      and role = 'lead';
  end if;

  insert into public.project_experts (project_id, expert_id, role)
  values (new.id, new.lead_expert_id, 'lead')
  on conflict (project_id, expert_id) do update set role = 'lead';

  return new;
end;
$$;

create trigger projects_sync_lead_expert
after insert or update of lead_expert_id on public.projects
for each row execute function public.sync_project_lead_expert();

create or replace function public.protect_project_lead_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_lead uuid;
begin
  select p.lead_expert_id into current_lead
  from public.projects p
  where p.id = coalesce(old.project_id, new.project_id);

  if current_lead is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE'
    and old.expert_id = current_lead
    and old.role = 'lead' then
    raise exception 'Cannot delete the mandatory lead expert link for project %', old.project_id;
  end if;

  if tg_op = 'UPDATE'
    and old.expert_id = current_lead
    and old.role = 'lead'
    and (new.expert_id is distinct from old.expert_id or new.role is distinct from 'lead') then
    raise exception 'Cannot change the mandatory lead expert link for project %', old.project_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.validate_project_expert_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_lead uuid;
begin
  select p.lead_expert_id into current_lead
  from public.projects p
  where p.id = new.project_id;

  if current_lead is null then
    raise exception 'Project % does not exist for expert link', new.project_id;
  end if;

  if new.role = 'lead' and new.expert_id is distinct from current_lead then
    raise exception 'Lead expert link must match projects.lead_expert_id for project %', new.project_id;
  end if;

  return new;
end;
$$;

create trigger project_experts_validate_role
before insert or update on public.project_experts
for each row execute function public.validate_project_expert_role();

create trigger project_experts_protect_lead_link
before update or delete on public.project_experts
for each row execute function public.protect_project_lead_link();

create table public.volunteer_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null,
  email varchar not null,
  city text not null,
  country text not null,
  home_location extensions.geography(Point, 4326) not null,
  radius_km numeric not null check (radius_km > 0 and radius_km <= 500),
  note text,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'pending_review')),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volunteer_subscriptions_email_idx on public.volunteer_subscriptions (lower(email));
create index volunteer_subscriptions_status_idx on public.volunteer_subscriptions (status);
create index volunteer_subscriptions_home_location_idx
  on public.volunteer_subscriptions using gist (home_location);

create trigger volunteer_subscriptions_set_updated_at
before update on public.volunteer_subscriptions
for each row execute function public.set_updated_at();

create table public.volunteer_subscription_categories (
  subscription_id uuid not null references public.volunteer_subscriptions(id) on delete cascade,
  category_id text not null references public.categories(id),
  primary key (subscription_id, category_id)
);

create view public.app_projects as
select
  p.id,
  p.name,
  p.status,
  p.category_id,
  p.category_id as field,
  coalesce(p.description, '') as description,
  format(
    'geometry(%L, 4326)',
    extensions.st_astext(coalesce(
      pl.geom,
      extensions.st_setsrid(extensions.st_makepoint(25, 47.5), 4326)
    ))
  ) as location,
  coalesce(pl.label, p.region_label, p.country, p.location, 'Carpathian region') as display_location,
  coalesce(p.region_label, pl.label, p.country, p.location, 'Carpathian region') as region_label,
  case
    when p.start_year is not null and p.end_year is not null then p.start_year::text || '-' || p.end_year::text
    when p.start_year is not null then p.start_year::text || '-' || p.start_year::text
    else null
  end as year_range,
  p.start_year,
  p.end_year,
  extensions.st_y(extensions.st_centroid(coalesce(
    pl.geom,
    extensions.st_setsrid(extensions.st_makepoint(25, 47.5), 4326)
  ))) as lat,
  extensions.st_x(extensions.st_centroid(coalesce(
    pl.geom,
    extensions.st_setsrid(extensions.st_makepoint(25, 47.5), 4326)
  ))) as lng,
  p.lead_expert_id,
  e.name as lead_expert_name,
  coalesce(linked.linked_expert_ids, array[p.lead_expert_id::text]) as linked_expert_ids,
  p.website,
  null::text as area,
  p.country,
  coalesce(contact_expert.email, e.email) as contact,
  p.card_summary,
  p.focus_summary,
  p.outputs_summary,
  p.is_cs
from public.projects p
join public.categories c on c.id = p.category_id
join public.experts e on e.id = p.lead_expert_id
left join public.project_locations pl on pl.project_id = p.id and pl.is_primary
left join lateral (
  select ce.email
  from public.project_experts pe
  join public.experts ce on ce.id = pe.expert_id
  where pe.project_id = p.id
    and pe.role = 'contact'
    and ce.email is not null
  order by pe.created_at
  limit 1
) contact_expert on true
left join lateral (
  select array_agg(
    pe.expert_id::text
    order by
      case pe.role when 'lead' then 1 when 'contact' then 2 else 3 end,
      pe.created_at
  ) as linked_expert_ids
  from public.project_experts pe
  where pe.project_id = p.id
) linked on true;

create view public.app_experts as
select
  e.id,
  e.name,
  e.institution,
  e.country,
  e.degree,
  e.headline,
  e.expertise_subtitle,
  e.bio,
  e.expertise,
  e.publications,
  coalesce(project_counts.projects, 0) as projects,
  e.email,
  e.linkedin,
  e.scopus,
  e.orcid,
  e.google_scholar,
  e.avatar_url,
  exists (
    select 1
    from public.project_experts pe
    join public.projects p on p.id = pe.project_id
    where pe.expert_id = e.id
      and p.is_cs = true
  ) as is_cs,
  e.created_at,
  e.updated_at
from public.experts e
left join lateral (
  select count(distinct pe.project_id)::integer as projects
  from public.project_experts pe
  where pe.expert_id = e.id
) project_counts on true;

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
set search_path = public, extensions
as $$
  with target_project as (
    select
      p.id,
      p.category_id,
      p.is_cs,
      extensions.st_centroid(pl.geom)::extensions.geography as project_location
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
    extensions.st_distance(vs.home_location, tp.project_location) / 1000.0 as distance_km,
    tp.category_id as matched_category
  from target_project tp
  join public.volunteer_subscription_categories vsc on vsc.category_id = tp.category_id
  join public.volunteer_subscriptions vs on vs.id = vsc.subscription_id
  where tp.is_cs = true
    and vs.status = 'active'
    and vs.consent_at is not null
    and extensions.st_dwithin(vs.home_location, tp.project_location, vs.radius_km * 1000.0)
  order by distance_km asc;
$$;

alter table public.volunteer_subscriptions enable row level security;
alter table public.volunteer_subscription_categories enable row level security;

create policy volunteer_subscriptions_insert_public
on public.volunteer_subscriptions
for insert
to anon, authenticated
with check (consent_at is not null and status = 'active');

create policy volunteer_subscription_categories_insert_public
on public.volunteer_subscription_categories
for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.app_projects to anon, authenticated;
grant select on public.app_experts to anon, authenticated;
grant insert on public.volunteer_subscriptions to anon, authenticated;
grant insert on public.volunteer_subscription_categories to anon, authenticated;
grant execute on function public.find_volunteers_for_project(uuid) to authenticated;
