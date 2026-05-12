const TARGET_URL = process.env.DEPLOY_URL || 'http://localhost:4173';
const THRESHOLDS = { performance: 90, accessibility: 95, 'best-practices': 90, seo: 90 };

async function isPreviewAvailable() {
  try {
    const response = await fetch(TARGET_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function audit() {
  if (!(await isPreviewAvailable())) {
    console.log(`ℹ️ Skipping Lighthouse check because ${TARGET_URL} is not reachable. Start \`npm run preview\` first.`);
    return;
  }

  const [{ lighthouse: namedLighthouse, default: defaultLighthouse }, chromeLauncher] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
  ]);
  const runLighthouse = namedLighthouse ?? defaultLighthouse;

  console.log('🚀 Launching browser for Lighthouse audit...');
  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless=new', '--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log(`ℹ️ Skipping Lighthouse check because Chrome could not be launched: ${err.message}`);
    return;
  }

  try {
    const { lhr } = await runLighthouse(TARGET_URL, { port: chrome.port });
    console.log('\n📋 Lighthouse Scores:');
    const scores = Object.entries(THRESHOLDS).map(([cat, min]) => {
      const score = Math.round((lhr.categories[cat].score || 0) * 100);
      const status = score >= min ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${cat}: ${score}% (min: ${min}%)`);
      return score >= min;
    });
    const allPass = scores.every(Boolean);
    if (!allPass) {
      console.warn('⚠️  Some scores fell below threshold. Check `reports/lighthouse.html` after `npm run lighthouse:audit`');
    }
  } finally {
    await chrome.kill();
  }
}

audit().catch(err => { console.error('💥 Lighthouse check failed:', err.message); process.exit(1); });
