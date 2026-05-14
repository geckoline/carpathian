-- Assign available local profile pictures to the v3 demo experts.
-- Safe to run after importing supabase/seed-v3-adjusted-data.sql.

update public.experts as e
set avatar_url = portrait.avatar_url
from (values
  ('0159d6c7-973f-5e7a-a9a0-d195d0ea6fe2'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174015.jpg'::text),
  ('0e3b230a-0509-55d8-96a0-9875f387a2be'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174016.jpg'::text),
  ('0ff1e264-520d-543a-87dd-181a491e667e'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174017.jpg'::text),
  ('123e4567-e89b-12d3-a456-426614174001'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174001.jpg'::text),
  ('123e4567-e89b-12d3-a456-426614174004'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174004.jpg'::text),
  ('123e4567-e89b-12d3-a456-426614174006'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174006.jpg'::text),
  ('123e4567-e89b-12d3-a456-426614174009'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174009.jpg'::text),
  ('123e4567-e89b-12d3-a456-426614174014'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174014.jpg'::text),
  ('23986425-d3a5-5e13-8bab-299745777a8d'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174018.jpg'::text),
  ('292c8e99-2378-55aa-83d8-350e0ac3f1cc'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174019.jpg'::text),
  ('35140057-a2a4-5adb-a500-46f8ed8b66a9'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174020.jpg'::text),
  ('4b166dbe-d99d-5091-abdd-95b83330ed3a'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174021.jpg'::text),
  ('4c507660-a83b-55c0-9b2b-83eccb07723d'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174022.jpg'::text),
  ('52524d6e-10dc-5261-aa36-8b2efcbaa5f0'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174023.jpg'::text),
  ('66e549b7-01e2-5d07-98d5-430f74d8d3b2'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174024.jpg'::text),
  ('6ed955c6-506a-5343-9be4-2c0afae02eef'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174025.jpg'::text),
  ('7fef88f7-411d-5669-b42d-bf5fc7f9b58b'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174026.jpg'::text),
  ('91c274f2-9a0d-5ce6-ac3d-7529f452df21'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174027.jpg'::text),
  ('98123fde-012f-5ff3-8b50-881449dac91a'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174028.jpg'::text),
  ('a1b9b633-da11-58be-b1a9-5cfa2848f186'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174029.jpg'::text),
  ('a6c4fc8f-6950-51de-a9ae-2c519c465071'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174030.jpg'::text),
  ('a9f96b98-dd44-5216-ab0d-dbfc6b262edf'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174031.jpg'::text),
  ('b04965e6-a9bb-591f-8f8a-1adcb2c8dc39'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174032.jpg'::text),
  ('c15b38c9-9a3e-543c-a703-dd742f25b4d5'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174033.jpg'::text),
  ('c2708a8b-120a-56f5-a30d-990048af87cc'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174034.jpg'::text),
  ('c8691da2-158a-5ed6-8537-0e6f140801f2'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174035.jpg'::text),
  ('cadb7952-2bba-5609-88d4-8e47ec4e7920'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174036.jpg'::text),
  ('ce1ae2d5-3454-5952-97ff-36ff935bcfe9'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174037.jpg'::text),
  ('db680066-c83d-5ed7-89a4-1d79466ea62d'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174038.jpg'::text),
  ('e4d80b30-151e-51b5-9f4f-18a3b82718e6'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174039.jpg'::text),
  ('e7263999-68b6-5a23-b530-af25b7efd632'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174040.jpg'::text),
  ('e99caacd-6c45-5906-bd9f-b79e62f25963'::uuid, '/profile-pictures/123e4567-e89b-12d3-a456-426614174041.jpg'::text)
) as portrait(id, avatar_url)
where e.id = portrait.id;
