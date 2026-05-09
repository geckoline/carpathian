import { createClient } from '@supabase/supabase-js';
import Bottleneck from 'bottleneck';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Missing Supabase server env vars');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const limiter = new Bottleneck({ minTime: 5000 });

async function fetchOpenAlexStats(orcid) {
  if (!orcid) return { publications: 0, projects: 0 };
  const res = await fetch(`https://api.openalex.org/authors?filter=orcid:${orcid}`);
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = await res.json();
  const author = data.results[0];
  return {
    publications: author?.works_count || 0,
    projects: author?.associated_institutions?.length || 0,
  };
}

async function syncExperts() {
  console.log('🔄 Starting expert stats sync...');
  const { data: experts, error } = await supabase.from('experts').select('id, orcid');
  if (error) throw error;

  for (const expert of experts) {
    try {
      const stats = await limiter.schedule(() => fetchOpenAlexStats(expert.orcid));
      await supabase.from('experts').update({
        publications: stats.publications,
        projects: stats.projects,
      }).eq('id', expert.id);
      console.log(`✅ Updated ${expert.id}: ${stats.publications} pubs, ${stats.projects} projects`);
    } catch (err) {
      console.error(`❌ Failed ${expert.id}:`, err.message);
    }
  }
  console.log('🎉 Sync complete.');
}

syncExperts().catch(console.error);
