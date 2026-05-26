import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const sourceShellPath = path.join(repoRoot, 'citizen-science-page.html');
const distShellPath = path.join(distDir, 'citizen-science-page.html');

const requireFile = (filePath) => {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.relative(repoRoot, filePath)}`);
  }
};

const rewriteSrcset = (html) => html.replace(/\b(srcset|data-srcset)=(["'])(.*?)\2/gi, (full, attr, quote, value) => {
  const rewritten = value
    .split(',')
    .map((candidate) => candidate.trim().replace(/^\/wp-snapshot\//, './wp-snapshot/'))
    .join(', ');

  return `${attr}=${quote}${rewritten}${quote}`;
});

const rewriteForProjectPages = (html) => rewriteSrcset(html)
  .replace(/\b(href|src)=(["'])\/(wp-snapshot\/[^"']*)\2/g, '$1=$2./$3$2')
  .replace(/\b(href|src)=(["'])\/(index\.html)\2/g, '$1=$2./$3$2')
  .replace(/url\((["']?)\/(wp-snapshot\/[^)"']+)\1\)/g, 'url($1./$2$1)')
  .replace(/\\\/wp-snapshot\\\//g, '.\\/wp-snapshot\\/')
  .replace(/"\/wp-snapshot\//g, '"./wp-snapshot/')
  .replace(/'\/wp-snapshot\//g, "'./wp-snapshot/");

requireFile(path.join(distDir, 'index.html'));
requireFile(sourceShellPath);

mkdirSync(distDir, { recursive: true });
copyFileSync(sourceShellPath, distShellPath);

const shell = rewriteForProjectPages(readFileSync(distShellPath, 'utf8'));
writeFileSync(distShellPath, shell);
writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log('Prepared GitHub Pages static example in dist/');
