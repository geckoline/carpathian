-- Migration: normalize expert institutions.
-- Experts store institution_id; institution display data and website live in public.institutions.

drop view if exists public.app_experts;

create table if not exists public.institutions (
  id text primary key,
  name text not null,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institution_id_format check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint institution_website_format check (website is null or website ~* '^https?://')
);

create unique index if not exists institutions_name_unique_idx
  on public.institutions (lower(name));

insert into public.institutions (id, name)
select distinct
  case institution
    when 'Slovak University of Technology' then 'slovak-university-of-technology'
    when 'Transilvania University of Brașov' then 'transilvania-university-of-brasov'
    when 'University of Bucharest' then 'university-of-bucharest'
    when 'Univ. of Bucharest' then 'univ-of-bucharest'
    when 'Transylvania Univ.' then 'transylvania-univ'
    when 'Jagiellonian Univ.' then 'jagiellonian-univ'
    when 'Carpathian Wildlife Inst.' then 'carpathian-wildlife-inst'
    when 'Slovak Academy of Sciences' then 'slovak-academy-of-sciences'
    when 'Technical University of Cluj-Napoca' then 'technical-university-of-cluj-napoca'
    when 'AGH University of Science and Technology' then 'agh-university-of-science-and-technology'
    when 'Lviv National University' then 'lviv-national-university'
    when 'Ovidius University of Constanța' then 'ovidius-university-of-constanta'
    when 'Taras Shevchenko National University' then 'taras-shevchenko-national-university'
    when 'National University of Life and Environmental Sciences' then 'national-university-of-life-and-environmental-sciences'
    when 'Comenius University' then 'comenius-university'
    when 'Nicolaus Copernicus University' then 'nicolaus-copernicus-university'
    when 'Alexandru Ioan Cuza University' then 'alexandru-ioan-cuza-university'
    when 'Gdańsk University of Technology' then 'gdansk-university-of-technology'
    when 'Politehnica University of Bucharest' then 'politehnica-university-of-bucharest'
    when 'Jagiellonian University' then 'jagiellonian-university'
    when 'West University of Timișoara' then 'west-university-of-timisoara'
    when 'Corvinus University of Budapest' then 'corvinus-university-of-budapest'
    when 'University of Belgrade' then 'university-of-belgrade'
    when 'Hungarian Academy of Sciences' then 'hungarian-academy-of-sciences'
    when 'University of Warsaw' then 'university-of-warsaw'
    when 'Eötvös Loránd University' then 'eotvos-lorand-university'
    when 'National Technical University of Ukraine' then 'national-technical-university-of-ukraine'
    when 'Warsaw University' then 'warsaw-university'
    else trim(both '-' from regexp_replace(lower(institution), '[^a-z0-9]+', '-', 'g'))
  end as id,
  institution as name
from public.experts
where institution is not null
on conflict (id) do update set name = excluded.name;

alter table public.experts
  add column if not exists institution_id text;

update public.experts
set institution_id = case institution
  when 'Slovak University of Technology' then 'slovak-university-of-technology'
  when 'Transilvania University of Brașov' then 'transilvania-university-of-brasov'
  when 'University of Bucharest' then 'university-of-bucharest'
  when 'Univ. of Bucharest' then 'univ-of-bucharest'
  when 'Transylvania Univ.' then 'transylvania-univ'
  when 'Jagiellonian Univ.' then 'jagiellonian-univ'
  when 'Carpathian Wildlife Inst.' then 'carpathian-wildlife-inst'
  when 'Slovak Academy of Sciences' then 'slovak-academy-of-sciences'
  when 'Technical University of Cluj-Napoca' then 'technical-university-of-cluj-napoca'
  when 'AGH University of Science and Technology' then 'agh-university-of-science-and-technology'
  when 'Lviv National University' then 'lviv-national-university'
  when 'Ovidius University of Constanța' then 'ovidius-university-of-constanta'
  when 'Taras Shevchenko National University' then 'taras-shevchenko-national-university'
  when 'National University of Life and Environmental Sciences' then 'national-university-of-life-and-environmental-sciences'
  when 'Comenius University' then 'comenius-university'
  when 'Nicolaus Copernicus University' then 'nicolaus-copernicus-university'
  when 'Alexandru Ioan Cuza University' then 'alexandru-ioan-cuza-university'
  when 'Gdańsk University of Technology' then 'gdansk-university-of-technology'
  when 'Politehnica University of Bucharest' then 'politehnica-university-of-bucharest'
  when 'Jagiellonian University' then 'jagiellonian-university'
  when 'West University of Timișoara' then 'west-university-of-timisoara'
  when 'Corvinus University of Budapest' then 'corvinus-university-of-budapest'
  when 'University of Belgrade' then 'university-of-belgrade'
  when 'Hungarian Academy of Sciences' then 'hungarian-academy-of-sciences'
  when 'University of Warsaw' then 'university-of-warsaw'
  when 'Eötvös Loránd University' then 'eotvos-lorand-university'
  when 'National Technical University of Ukraine' then 'national-technical-university-of-ukraine'
  when 'Warsaw University' then 'warsaw-university'
  else trim(both '-' from regexp_replace(lower(institution), '[^a-z0-9]+', '-', 'g'))
end
where institution_id is null;

alter table public.experts
  alter column institution_id set not null,
  add constraint experts_institution_id_fkey
    foreign key (institution_id) references public.institutions(id);

alter table public.experts
  drop column if exists institution;

create view public.app_experts as
select
  e.id,
  e.name,
  e.institution_id,
  i.name as institution,
  i.website as institution_website,
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

grant select on public.institutions to anon, authenticated;
grant select on public.app_experts to anon, authenticated;
