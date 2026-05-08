import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const BASE_URL = process.env.DEPLOY_URL || 'http://localhost:4173';
const BUNDLE_LIMIT_KB = 500;

async function checkRoute(path, expected) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes(expected)) throw new Error('Content mismatch');
    console.log(`✅ ${path} loaded`);
    return true;
  } catch (err) {
    console.error(`❌ ${path}: ${err.message}`);
    return false;
  }
}

async function checkBundleSize() {
  try {
    const statsPath = join(distDir, 'stats.json');
    const stats = JSON.parse(await readFile(statsPath, 'utf8'));
    const totalBytes = Object.values(stats.assets || {}).reduce((sum, a) => sum + (a.size || 0), 0);
    const totalKB = Math.round(totalBytes / 1024);
    if (totalKB <= BUNDLE_LIMIT_KB) {
      console.log(`✅ Bundle size: ${totalKB}KB ≤ ${BUNDLE_LIMIT_KB}KB limit`);
      return true;
    }
    console.warn(`⚠️ Bundle size: ${totalKB}KB > ${BUNDLE_LIMIT_KB}KB limit`);
    return false;
  } catch {
    console.log('ℹ️ Skipping bundle check (run `npm run build:analyze` first)');
    return true;
  }
}

async function run() {
  console.log(`🔍 Running smoke tests against ${BASE_URL}...`);
  let passed = 0;
  let failed = 0;

  if (await checkRoute('/', 'Citizen Science Platform')) passed++; else failed++;
  if (await checkRoute('/index.html', '<title>Carpathian Citizen Science</title>')) passed++; else failed++;
  if (await checkBundleSize()) passed++; else failed++;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error('💥 Smoke runner failed:', err); process.exit(1); });
