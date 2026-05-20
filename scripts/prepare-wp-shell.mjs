import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sourceHtmlPath = path.join(repoRoot, 'reference/wp/climate-change-original.html');
const curlConfigPath = path.join(repoRoot, 'reference/wp/assets.curl-config');
const outputHtmlPath = path.join(repoRoot, 'citizen-science-page.html');
const publicRoot = path.join(repoRoot, 'public/wp-snapshot');
const origin = 'http://www.carpathianconvention.org';
const pageUrl = `${origin}/topics/climate-change-2/`;
const citizenSciencePath = '/topics/citizen-science/';

const resourceExtensions = new Set([
  '.css',
  '.js',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

const html = readFileSync(sourceHtmlPath, 'utf8');
const assetUrls = new Map();

const isInternalAssetUrl = (value, base = pageUrl) => {
  if (!value || /^(data:|mailto:|tel:|#|javascript:)/i.test(value.trim())) return null;
  try {
    const url = new URL(value.replace(/&amp;/g, '&'), base);
    if (url.hostname !== 'www.carpathianconvention.org') return null;
    const extension = path.posix.extname(url.pathname).toLowerCase();
    if (!resourceExtensions.has(extension)) return null;
    if (!url.pathname.startsWith('/wp-content/') && !url.pathname.startsWith('/wp-includes/')) return null;
    return url;
  } catch {
    return null;
  }
};

const localPublicHref = (url) => `/wp-snapshot${url.pathname}`;
const localFsPath = (url) => path.join(publicRoot, url.pathname);

const addAsset = (value, base = pageUrl) => {
  const url = isInternalAssetUrl(value, base);
  if (!url) return;
  assetUrls.set(`${url.origin}${url.pathname}${url.search}`, url);
};

const collectAttr = (tagPattern, attrName) => {
  for (const tagMatch of html.matchAll(tagPattern)) {
    const tag = tagMatch[0];
    const attr = tag.match(new RegExp(`${attrName}=(["'])(.*?)\\1`, 'i'));
    if (attr?.[2]) addAsset(attr[2]);
  }
};

collectAttr(/<link\b[^>]*>/gi, 'href');
collectAttr(/<script\b[^>]*>/gi, 'src');
collectAttr(/<img\b[^>]*>/gi, 'src');

for (const match of html.matchAll(/\b(?:srcset|data-src|data-lazy-src)=(["'])(.*?)\1/gi)) {
  for (const item of match[2].split(',')) {
    addAsset(item.trim().split(/\s+/)[0]);
  }
}

for (const match of html.matchAll(/<meta\b[^>]*content=(["'])(.*?)\1[^>]*>/gi)) {
  addAsset(match[2]);
}

for (const match of html.matchAll(/url\((["']?)(.*?)\1\)/gi)) {
  addAsset(match[2]);
}

for (const match of html.matchAll(/https?:\/\/www\.carpathianconvention\.org\/(?:wp-content|wp-includes)\/[^"'<>)\s,\\]+/gi)) {
  addAsset(match[0]);
}

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) return walk(fullPath);
    return fullPath;
  });
};

const cssFiles = walk(publicRoot).filter((file) => file.endsWith('.css'));
for (const cssFile of cssFiles) {
  const relativeCssPath = path.relative(publicRoot, cssFile).split(path.sep).join('/');
  const cssBaseUrl = `${origin}/${relativeCssPath}`;
  const css = readFileSync(cssFile, 'utf8');
  for (const match of css.matchAll(/url\((["']?)(.*?)\1\)/gi)) {
    addAsset(match[2], cssBaseUrl);
  }
}

mkdirSync(path.dirname(curlConfigPath), { recursive: true });
const curlLines = [
  'location',
  'create-dirs',
  'connect-timeout = 10',
  'max-time = 40',
  'retry = 2',
  'retry-delay = 1',
  '',
];

for (const url of assetUrls.values()) {
  curlLines.push(`url = "${url.href}"`);
  curlLines.push(`output = "${path.relative(repoRoot, localFsPath(url)).split(path.sep).join('/')}"`);
  curlLines.push('');
}

writeFileSync(curlConfigPath, curlLines.join('\n'));

for (const cssFile of cssFiles) {
  const relativeCssPath = path.relative(publicRoot, cssFile).split(path.sep).join('/');
  const cssUrl = new URL(`${origin}/${relativeCssPath}`);
  let css = readFileSync(cssFile, 'utf8');
  css = css.replace(/url\((["']?)(https?:\/\/www\.carpathianconvention\.org\/[^)"']+)\1\)/gi, (full, quote, rawUrl) => {
    const assetUrl = isInternalAssetUrl(rawUrl, cssUrl.href);
    if (!assetUrl) return full;
    const fromDir = path.posix.dirname(relativeCssPath);
    const toPath = assetUrl.pathname.replace(/^\//, '');
    const relative = path.posix.relative(fromDir, toPath);
    return `url("${relative}")`;
  });
  writeFileSync(cssFile, css);
}

const replaceAttrUrl = (markup, tagPattern, attrName) => markup.replace(tagPattern, (tag) => {
  const attrPattern = new RegExp(`${attrName}=(["'])(.*?)\\1`, 'i');
  return tag.replace(attrPattern, (full, quote, value) => {
    const url = isInternalAssetUrl(value);
    return url ? `${attrName}=${quote}${localPublicHref(url)}${quote}` : full;
  });
});

const replaceSrcsetUrls = (markup) => markup.replace(/\b(srcset|data-srcset)=(["'])(.*?)\2/gi, (full, attrName, quote, value) => {
  const rewritten = value.split(',').map((candidate) => {
    const trimmed = candidate.trim();
    const [rawUrl, ...descriptor] = trimmed.split(/\s+/);
    const url = isInternalAssetUrl(rawUrl);
    return url ? [localPublicHref(url), ...descriptor].join(' ') : trimmed;
  }).join(', ');

  return `${attrName}=${quote}${rewritten}${quote}`;
});

const replaceLiteralAssetUrls = (markup) => markup.replace(/https?:\/\/www\.carpathianconvention\.org\/(?:wp-content|wp-includes)\/[^"'<>)\s,\\]+/gi, (rawUrl) => {
  const url = isInternalAssetUrl(rawUrl);
  return url ? localPublicHref(url) : rawUrl;
});

const replaceJsonAssetBases = (markup) => markup
  .replace(/http:\\\/\\\/www\.carpathianconvention\.org\\\/wp-content\\\/plugins\\\//g, '\\/wp-snapshot\\/wp-content\\/plugins\\/')
  .replace(/http:\/\/www\.carpathianconvention\.org\/wp-content\/plugins\//g, '/wp-snapshot/wp-content/plugins/');

const mainSection = String.raw`<section class="has_eae_slider elementor-section elementor-top-section elementor-element elementor-element-de75f08 elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-id="de75f08" data-element_type="section" data-settings="{&quot;_ha_eqh_enable&quot;:false}" data-elementor-no-reinit="true" data-eae-no-animation="true">
						<div class="elementor-container elementor-column-gap-default">
					<div class="has_eae_slider elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-51c955f" data-id="51c955f" data-element_type="column">
			<div class="elementor-widget-wrap elementor-element-populated">
								<div class="elementor-element elementor-element-690d21c elementor-widget elementor-widget-heading" data-id="690d21c" data-element_type="widget" data-widget_type="heading.default">
				<div class="elementor-widget-container">
			<h2 class="elementor-heading-title elementor-size-default">Citizen Science</h2>		</div>
				</div>
				<div class="elementor-element elementor-element-c315fbf elementor-widget-divider--view-line elementor-widget elementor-widget-divider" data-id="c315fbf" data-element_type="widget" data-widget_type="divider.default">
				<div class="elementor-widget-container">
					<div class="elementor-divider">
			<span class="elementor-divider-separator">
						</span>
		</div>
				</div>
				</div>
				<div class="elementor-element elementor-element-3f44612 elementor-widget elementor-widget-text-editor" data-id="3f44612" data-element_type="widget" data-widget_type="text-editor.default">
				<div class="elementor-widget-container">
							<div id="citizen-science-root"></div>						</div>
				</div>
					</div>
		</div>
							</div>
		</section>`;

let shell = html;
shell = shell.replace(/\sdata-effect\s*=>/g, ' data-effect="">');
shell = shell.replace(/<title>.*?<\/title>/i, '<title>Citizen Science &#8211; Carpathianconvention</title>');
shell = shell.replace(/<link rel="canonical" href="[^"]+" \/>/i, `<link rel="canonical" href="${origin}${citizenSciencePath}" />`);
shell = shell.replace(/(<li id="menu-item-7370"[^>]*>\s*<a title=")Climate Change(" href=")[^"]+(">).*?(<\/a>)/s, `$1Citizen Science$2${origin}${citizenSciencePath}$3Citizen Science$4`);
shell = shell.replace(/<a style="color: white;" href="http:\/\/www\.carpathianconvention\.org\/climate-change-2\/">Climate Change<\/a>/, `<a style="color: white;" href="${origin}${citizenSciencePath}">Citizen Science</a>`);
shell = shell.replace(/Climate%20Change%20%E2%80%93%20Carpathianconvention/g, 'Citizen%20Science%20%E2%80%93%20Carpathianconvention');
shell = replaceAttrUrl(shell, /<link\b[^>]*>/gi, 'href');
shell = replaceAttrUrl(shell, /<script\b[^>]*>/gi, 'src');
shell = replaceAttrUrl(shell, /<img\b[^>]*>/gi, 'src');
shell = replaceSrcsetUrls(shell);
shell = shell.replace(/(<meta\b[^>]*content=(["']))(.*?)(\2[^>]*>)/gi, (full, prefix, quote, value, suffix) => {
  const url = isInternalAssetUrl(value);
  return url ? `${prefix}${localPublicHref(url)}${suffix}` : full;
});
shell = replaceLiteralAssetUrls(shell);
shell = replaceJsonAssetBases(shell);

const mainStart = shell.search(/<section\b[^>]*elementor-element-de75f08[^>]*>/);
const footerStart = shell.search(/<section\b[^>]*elementor-element-afbaad9[^>]*>/);
if (mainStart === -1 || footerStart === -1 || footerStart <= mainStart) {
  throw new Error('Could not find the expected Elementor main/footer section boundaries.');
}
shell = `${shell.slice(0, mainStart)}${mainSection}\n				${shell.slice(footerStart)}`;

shell = shell.replace('<div id="citizen-science-root"></div>', '<iframe src="/index.html" style="width: 100%; height: calc(70vh + 56px); border: none; display: block;" title="Citizen Science App" loading="lazy"></iframe>');
shell = shell.replace(/(class="elementor-widget-container")(>)(\s*)(<iframe)/, '$1 style="background: #0d7377; border-radius: 12px; overflow: hidden;"$2$3$4');

shell = shell.replace(
  /<script\b[^>]*\bsrc=["'][^"']*\/(?:elementor\/(?:assets\/js|assets\/lib)|addon-elements-for-elementor-page-builder|happy-elementor-addons|anwp-post-grid-for-elementor)[^"']*["'][^>]*><\/script>\s*/gi,
  '',
);
shell = shell.replace(
  /<script\b[^>]*\bid=["'](?:elementor-frontend-js-before|eae-main-js-extra|happy-elementor-addons-js-extra|anwp-pg-scripts-js-extra)["'][^>]*>.*?<\/script>\s*/gis,
  '',
);
shell = shell.replace('</html>', '');
shell += '\n</html>';

writeFileSync(outputHtmlPath, shell);

console.log(`Prepared ${path.relative(repoRoot, outputHtmlPath)}`);
console.log(`Wrote ${assetUrls.size} asset download entries to ${path.relative(repoRoot, curlConfigPath)}`);
