-- Migration: remove redundant expert avatar_url storage.
-- Portraits are derived from /profile-pictures/{expert_id}.{jpg|png|webp}.

drop view if exists public.app_experts;

alter table public.experts
  drop column if exists avatar_url;

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
left join lateral (
  select count(distinct pe.project_id)::integer as projects
  from public.project_experts pe
  where pe.expert_id = e.id
) project_counts on true;
