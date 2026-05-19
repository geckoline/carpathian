import { existsSync, cpSync, readdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, join, basename } from 'node:path';
import process from 'node:process';

const repoRoot = resolve(import.meta.dirname, '..');
const distDir = join(repoRoot, 'dist');

const DEFAULT_THEME_BUILD = 'build';
const BUILD_HASH_FILE = '.build-hash';

function printUsage() {
  console.log('Usage: node scripts/deploy-to-wp.mjs [target] [--with-hash]');
  console.log('');
  console.log('  target       WP theme build directory (default: $WP_THEME_BUILD_DIR or ./build)');
  console.log('  --with-hash  Append build hash for cache busting');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/deploy-to-wp.mjs /path/to/wp-content/themes/hestia/build');
  console.log('  WP_THEME_BUILD_DIR=/path node scripts/deploy-to-wp.mjs --with-hash');
  process.exit(1);
}

const args = process.argv.slice(2);
const hashIndex = args.indexOf('--with-hash');
const withHash = hashIndex !== -1;
if (hashIndex !== -1) args.splice(hashIndex, 1);

const targetDir = args[0] || process.env.WP_THEME_BUILD_DIR || DEFAULT_THEME_BUILD;
if (!targetDir || targetDir === '--help' || targetDir === '-h') {
  printUsage();
}

const targetPath = resolve(targetDir);

console.log(' Building app...');
execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

if (!existsSync(distDir)) {
  console.error(` Build output not found at ${distDir}. Run 'npm run build' first.`);
  process.exit(1);
}

if (existsSync(targetPath)) {
  console.log(` Cleaning target: ${targetPath}`);
  for (const entry of readdirSync(targetPath)) {
    if (entry.startsWith('.')) continue;
    rmSync(join(targetPath, entry), { recursive: true, force: true });
  }
}

console.log(` Copying dist/ → ${targetPath}`);
cpSync(distDir, targetPath, { recursive: true, force: true });

if (withHash) {
  const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const hashContent = `${hash}\n${Date.now()}\n`;
  execSync(`echo "${hashContent.replace(/\n/g, '\\n')}" > ${join(targetPath, BUILD_HASH_FILE)}`, {
    cwd: repoRoot,
  });
  console.log(` Build hash written: ${hash}`);
}

const fileCount = readdirSync(targetPath, { recursive: true }).length;
console.log(` Deployed ${fileCount} files to ${targetPath}`);
console.log(' Done.');
