import { lighthouse } from 'lighthouse';
import puppeteer from 'puppeteer';

const TARGET_URL = 'http://localhost:4173';
const THRESHOLDS = { performance: 90, accessibility: 95, 'best-practices': 90, seo: 90 };

async function audit() {
  console.log('🚀 Launching browser for Lighthouse audit...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const { lhr } = await lighthouse(TARGET_URL, { port: new URL(browser.wsEndpoint()).port }, THRESHOLDS);
    console.log('\n📋 Lighthouse Scores:');
    Object.entries(THRESHOLDS).forEach(([cat, min]) => {
      const score = Math.round((lhr.categories[cat].score || 0) * 100);
      const status = score >= min ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${cat}: ${score}% (min: ${min}%)`);
    });
    const allPass = Object.values(lhr.categories).every(c => (c.score || 0) * 100 >= THRESHOLDS[c.id]);
    if (!allPass) {
      console.warn('⚠️  Some scores fell below threshold. Check `reports/lighthouse.html` after `npm run lighthouse:audit`');
    }
  } finally {
    await browser.close();
  }
}

audit().catch(err => { console.error('💥 Lighthouse check failed:', err.message); process.exit(1); });
