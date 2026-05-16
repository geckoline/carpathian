-- Schema v4: Flat team model + ISO country codes
-- 
-- Changes:
-- 1. projects: drop lead_expert_id, country → countries text[]
-- 2. experts: country → countries text[]
-- 3. project_experts: drop role column, add sort_order
-- 4. Migrate existing free-text countries to ISO alpha-2 codes
-- 5. Remove lead-related triggers and functions
-- 6. Update app_projects / app_experts views

-- ============================================================
-- Step 1: Drop dependent objects
-- ============================================================

drop trigger if exists project_experts_validate_role on public.project_experts;
drop trigger if exists project_experts_protect_lead_link on public.project_experts;
drop trigger if exists projects_sync_lead_expert on public.projects;

drop function if exists public.validate_project_expert_role();
drop function if exists public.protect_project_lead_link();
drop function if exists public.sync_project_lead_expert();

drop view if exists public.app_projects;
drop view if exists public.app_experts;

-- ============================================================
-- Step 2: Drop lead_expert_id from projects
-- ============================================================

drop index if exists public.projects_lead_expert_idx;
alter table public.projects drop constraint if exists projects_lead_expert_id_fkey;
alter table public.projects drop column lead_expert_id;

comment on column public.projects.lead_expert_id is null;

-- ============================================================
-- Step 3: country → countries on projects
-- ============================================================

alter table public.projects add column countries text[] not null default '{}';

-- ============================================================
-- Step 4: country → countries on experts
-- ============================================================

alter table public.experts add column countries text[] not null default '{}';

-- ============================================================
-- Step 5: project_experts — drop role, add sort_order
-- ============================================================

drop index if exists public.project_experts_one_lead_idx;
alter table public.project_experts drop column role;
alter table public.project_experts add column sort_order int not null default 0;

-- ============================================================
-- Step 6: Migrate project country data → ISO codes
-- ============================================================

create or replace function public.country_name_to_code(name text)
returns text
language sql
immutable
as $$
  select case name
    when 'Austria'     then 'AT'
    when 'Czech Republic' then 'CZ'
    when 'Hungary'     then 'HU'
    when 'Poland'      then 'PL'
    when 'Romania'     then 'RO'
    when 'Serbia'      then 'RS'
    when 'Slovakia'    then 'SK'
    when 'Ukraine'     then 'UA'
    when 'Germany'     then 'DE'
    when 'Moldova'     then 'MD'
    else null
  end;
$$;

update public.projects p
set countries = (
  select array_agg(public.country_name_to_code(trim(part)))
  from unnest(string_to_array(p.country, '/')) as part
)
where p.country is not null and p.country != ''
  and p.country != 'Multiple';

-- Handle "Multiple" → empty array (project spans many, no single country)
update public.projects set countries = '{}' where country = 'Multiple';

-- ============================================================
-- Step 7: Migrate expert country data → ISO codes
-- ============================================================

update public.experts e
set countries = array[public.country_name_to_code(e.country)]
where e.country is not null and e.country != '';

-- ============================================================
-- Step 8: Drop old country columns
-- ============================================================

alter table public.projects drop column country;
alter table public.experts drop column country;

-- ============================================================
-- Step 9: Drop helper function (no longer needed at runtime)
-- ============================================================

drop function if exists public.country_name_to_code;

-- ============================================================
-- Step 10: Recreate app_projects view
-- ============================================================

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
  coalesce(pl.label, p.region_label, array_to_string(p.countries, ', '), p.location, 'Carpathian region') as display_location,
  coalesce(p.region_label, pl.label, array_to_string(p.countries, ', '), p.location, 'Carpathian region') as region_label,
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
  pe.expert_ids,
  p.website,
  null::text as area,
  p.countries,
  coalesce(contact_expert.email, pe.first_expert_email) as contact,
  p.card_summary,
  p.focus_summary,
  p.outputs_summary,
  p.is_cs
from public.projects p
join public.categories c on c.id = p.category_id
left join public.project_locations pl on pl.project_id = p.id and pl.is_primary
left join lateral (
  select
    array_agg(pe2.expert_id order by pe2.sort_order, pe2.created_at) as expert_ids,
    (select e2.email from public.experts e2 where e2.id = pe2_lead.expert_id) as first_expert_email
  from public.project_experts pe2
  left join public.project_experts pe2_lead on pe2_lead.project_id = pe2.project_id
    and pe2_lead.sort_order = 0
  where pe2.project_id = p.id
  group by pe2.project_id
) pe on true
left join lateral (
  select ce.email
  from public.project_experts pe3
  join public.experts ce on ce.id = pe3.expert_id
  where pe3.project_id = p.id
    and ce.email is not null
  order by pe3.sort_order, pe3.created_at
  limit 1
) contact_expert on true;

grant select on public.app_projects to anon, authenticated;

-- ============================================================
-- Step 11: Recreate app_experts view
-- ============================================================

create view public.app_experts as
select
  e.id,
  e.name,
  e.institution_id,
  i.name as institution,
  i.website as institution_website,
  e.countries,
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
  e.import_metadata,
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
join public.institutions i on i.id = e.institution_id
left join lateral (
  select count(distinct pe.project_id)::integer as projects
  from public.project_experts pe
  where pe.expert_id = e.id
) project_counts on true;

grant select on public.app_experts to anon, authenticated;
