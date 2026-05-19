import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SCREENSHOT_DIR = join(repoRoot, 'screenshots');
const BASELINE_DIR = join(SCREENSHOT_DIR, 'baseline');
const CURRENT_DIR = join(SCREENSHOT_DIR, 'current');
const DIFF_DIR = join(SCREENSHOT_DIR, 'diff');

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

const ELEMENTS = [
  { name: 'stats-grid', selector: '[data-testid="stats-grid"]', fullPage: false },
  { name: 'first-flipcard', selector: '.card-flip-stage', fullPage: false },
  { name: 'sidebar-buttons', selector: 'aside', fullPage: false },
  { name: 'full-root', selector: '#citizen-science-root', fullPage: true },
];

async function startServer() {
  return new Promise((resolvePromise, reject) => {
    const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    const timeout = setTimeout(() => {
      reject(new Error('Server start timeout (30s)'));
    }, 30000);

    server.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Local:')) {
        clearTimeout(timeout);
        resolvePromise(server);
      }
    });

    server.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Error') || text.includes('error') || text.includes('failed')) {
        clearTimeout(timeout);
        reject(new Error(text));
      }
    });

    server.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function ensureDirs() {
  for (const dir of [BASELINE_DIR, CURRENT_DIR, DIFF_DIR]) {
    mkdirSync(dir, { recursive: true });
  }
}

async function screenshotElement(page, selector, name) {
  try {
    await page.waitForSelector(selector, { timeout: 8000 });
    const el = await page.$(selector);
    if (!el) {
      console.warn(`  ⚠️  Element "${selector}" not found for "${name}"`);
      return null;
    }
    return await el.screenshot({ type: 'png' });
  } catch (err) {
    console.warn(`  ⚠️  Screenshot failed for "${name}": ${err.message}`);
    return null;
  }
}

function compareImages(baselinePath, currentBuffer, name) {
  let baseline = PNG.sync.read(readFileSync(baselinePath));
  let current = PNG.sync.read(currentBuffer);

  if (baseline.width !== current.width || baseline.height !== current.height) {
    const w = Math.min(baseline.width, current.width);
    const h = Math.min(baseline.height, current.height);
    baseline = cropPng(baseline, w, h);
    current = cropPng(current, w, h);
    console.log(`   📐 Image resized to ${w}×${h} for comparison`);
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  );

  const totalPixels = width * height;
  const percent = (mismatchedPixels / totalPixels) * 100;

  const diffPath = join(DIFF_DIR, `${name}.png`);
  writeFileSync(diffPath, PNG.sync.write(diff));

  return percent;
}

function cropPng(png, width, height) {
  const cropped = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * png.width + x) * 4;
      const cIdx = (y * width + x) * 4;
      cropped.data[cIdx] = png.data[idx];
      cropped.data[cIdx + 1] = png.data[idx + 1];
      cropped.data[cIdx + 2] = png.data[idx + 2];
      cropped.data[cIdx + 3] = png.data[idx + 3];
    }
  }
  return cropped;
}

async function run() {
  ensureDirs();

  console.log(`\n🔍 Pixel diff — comparing against baseline screenshots\n`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const isBaseline = process.argv.includes('--record');
  const isWpShell = process.argv.includes('--wp-shell');

  if (isBaseline) {
    console.log('📸 Recording baseline screenshots...\n');
  } else if (!existsSync(BASELINE_DIR)) {
    console.log('⚠️  No baseline found. Run with --record to create baselines first.\n');
    await browser.close();
    process.exit(1);
  }

  const modeLabel = isWpShell ? 'WP shell' : 'standalone';
  const pagePath = isWpShell ? '/citizen-science-page.html' : '/index.html';

  let server;
  try {
    console.log('🚀 Starting preview server...');
    server = await startServer();
    console.log(`   Server ready at ${BASE_URL}\n`);
    console.log(`   Mode: ${modeLabel} (${pagePath})\n`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle0', timeout: 15000 });

    await new Promise(r => setTimeout(r, 2000));

    let allPassed = true;

    for (const { name, selector } of ELEMENTS) {
      const buf = await screenshotElement(page, selector, name);
      if (!buf) {
        allPassed = false;
        continue;
      }

      const baselinePath = join(BASELINE_DIR, `${name}.png`);

      if (isBaseline) {
        writeFileSync(baselinePath, buf);
        console.log(`  ✅ Baseline saved: ${name}.png`);
        continue;
      }

      const currentPath = join(CURRENT_DIR, `${name}.png`);
      writeFileSync(currentPath, buf);

      const percent = compareImages(baselinePath, buf, name);
      const target = getTarget(name);
      const status = percent <= target ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${percent.toFixed(2)}% diff (target: ≤${target}%)`);
      if (percent > target) allPassed = false;
    }

    console.log('');
    if (isBaseline) {
      console.log('📸 Baseline recording complete.\n');
    } else {
      console.log(allPassed ? '✅ All pixel diff checks passed.\n' : '❌ Some pixel diff checks exceeded targets.\n');
    }

    await browser.close();
    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    console.error(`💥 Error: ${err.message}`);
    await browser.close().catch(() => {});
    if (server) server.kill();
    process.exit(1);
  } finally {
    if (server) server.kill();
  }
}

function getTarget(name) {
  const targets = {
    'stats-grid': 3,
    'first-flipcard': 85,
    'sidebar-buttons': 20,
    'full-root': 30,
  };
  return targets[name] ?? 10;
}

run();
