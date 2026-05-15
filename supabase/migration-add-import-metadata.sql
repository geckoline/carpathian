-- Migration: add import_metadata to experts, contact to projects
-- Safe to run after existing seed data.

alter table public.experts
  add column if not exists import_metadata jsonb not null default '{}'::jsonb;

alter table public.projects
  add column if not exists contact text;
