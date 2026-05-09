// scripts/seed-supabase.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use the JSON directory (adjusted source data)
const repoRoot = join(__dirname, '..', '..');
const jsonDir = join(repoRoot, 'carpathian-citizen-science-react18 Kopie', 'src', 'json');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function loadJSON(filePath) {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
}

function toUUID(id) {
  return uuidv5(String(id), UUID_NAMESPACE);
}

function projectToRow(p) {
  const startYear = new Date(p.startTime).getFullYear();
  const endYear = new Date(p.endTime).getFullYear();
  return {
    id: toUUID(p.id),
    name: p.name,
    status: p.status,
    field: p.field,
    description: p.description,
    location: p.location,
    year_range: `${startYear}-${endYear}`,
    lat: p.lat,
    lng: p.lng,
    area: p.area,
    country: p.country,
    website: p.website,
    contact: p.contact || null,
    lead_expert_name: p.contact || null,
    is_cs: p.citizen_science ?? false,
  };
}

function expertToRow(e) {
  return {
    id: toUUID(e.id),
    name: e.name,
    institution: e.institution,
    country: e.country,
    degree: e.degree || 'PhD, Environmental Science',
    bio: e.bio,
    expertise: Array.isArray(e.expertise) ? e.expertise : [e.expertise],
    publications: e.publications ?? 0,
    projects: e.projects ?? 0,
    email: e.email,
    linkedin: e.linkedin || null,
    scopus: e.scopus || null,
    avatar_url: e.avatarUrl || null,
  };
}



async function main() {
  console.log('🌱 Starting full dataset seed from JSON...\n');

  try {
    // Load projects
    const projectsRaw = await loadJSON(join(jsonDir, 'projects.json'));
    const projects = projectsRaw.projects || projectsRaw;
    const mappedProjects = projects.map(projectToRow);
    console.log(`📦 Loaded ${mappedProjects.length} projects`);

    // Load experts
    const expertsRaw = await loadJSON(join(jsonDir, 'experts.json'));
    const experts = expertsRaw.experts || expertsRaw;
    const mappedExperts = experts.map(expertToRow);
    console.log(`📦 Loaded ${mappedExperts.length} experts\n`);

    // Seed experts first (projects may reference them)
    console.log('⏳ Seeding experts...');
    const { error: expErr } = await supabase
      .from('experts')
      .upsert(mappedExperts, { onConflict: 'id' });
    if (expErr) throw expErr;
    console.log(`✅ Seeded ${mappedExperts.length} experts\n`);

    // Seed projects
    console.log('⏳ Seeding projects...');
    const { error: projErr } = await supabase
      .from('projects')
      .upsert(mappedProjects, { onConflict: 'id' });
    if (projErr) throw projErr;
    console.log(`✅ Seeded ${mappedProjects.length} projects\n`);

    console.log('🎉 Seed complete. Data is live in Supabase.');
    const csProjects = mappedProjects.filter(p => p.is_cs);
    console.log(`   ${csProjects.length} citizen science projects (IDs: ${csProjects.map(p => p.id).join(', ')})`);

  } catch (err) {
    console.error('💥 Seed failed:', err.message);
    process.exit(1);
  }
}

main();