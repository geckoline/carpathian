import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const readSource = (relativePath: string) => readFileSync(resolve(__dirname, relativePath), 'utf-8');

describe('CSS safety checks', () => {
  it('app CSS contains no IE-specific filter properties', () => {
    const css = readSource('../../src/index.css');
    expect(css).not.toMatch(/progid:DXImageTransform/i);
    expect(css).not.toMatch(/filter:\s*alpha/i);
    expect(css).not.toMatch(/behavior:\s*url\(/i);
  });

  it('app CSS contains -webkit-text-size-adjust for proper mobile rendering', () => {
    const css = readSource('../../src/index.css');
    expect(css).toMatch(/-webkit-text-size-adjust\s*:\s*100%/);
  });

  it('app CSS respects reduced-motion preference', () => {
    const css = readSource('../../src/index.css');
    expect(css).toMatch(/prefers-reduced-motion/i);
    expect(css).toMatch(/reduced-motion-forced/i);
    expect(css).toMatch(/high-contrast/i);
  });

  it('app map/sidebar layout has explicit mobile and desktop classes', () => {
    const app = readSource('../../src/App.tsx');

    expect(app).toMatch(/flex-col\s+lg:flex-row/);
    expect(app).toMatch(/w-full\s+lg:w-\[380px\]/);
    expect(app).toContain('h-[460px]');
    expect(app).toContain('sm:h-[560px]');
  });

  it('keeps mobile top sections compact before the map', () => {
    const app = readSource('../../src/App.tsx');
    const stats = readSource('../../src/components/layout/StatsSection.tsx');

    expect(app).toContain('pt-3 sm:pt-4');
    expect(app).toContain('mb-3 sm:mb-4');
    expect(stats).toContain('grid-cols-2');
    expect(stats).toContain('text-2xl sm:text-4xl');
  });

  it('defines and uses shared app surface tokens', () => {
    const css = readSource('../../src/index.css');
    const app = readSource('../../src/App.tsx');
    const sidebar = readSource('../../src/components/map/MapSidebar.tsx');
    const stats = readSource('../../src/components/layout/StatsSection.tsx');
    const filterBar = readSource('../../src/components/layout/FilterBar.tsx');
    const filterControls = readSource('../../src/components/layout/FilterControls.tsx');
    const modal = readSource('../../src/components/common/Modal.tsx');
    const projectCard = readSource('../../src/components/cards/ProjectCard.tsx');
    const expertCard = readSource('../../src/components/cards/ExpertCard.tsx');

    expect(css).toContain('--color-app-bg');
    expect(css).toContain('--color-panel-border');
    expect(css).toContain('--color-soft-border');
    expect(css).toContain('--color-panel-surface');
    expect(css).toContain('--color-panel-surface-soft');
    expect(css).toContain('--color-field-note');
    expect(css).toContain('--radius-panel');
    expect(css).toContain('--radius-card');
    expect(css).toContain('--shadow-panel');
    expect(css).toContain('--shadow-surface');

    expect(app).toContain('rounded-[var(--radius-panel)]');
    expect(app).toContain('shadow-[var(--shadow-panel)]');
    expect(app).toContain('bg-[var(--color-panel-surface)]');
    expect(sidebar).toContain('rounded-[var(--radius-panel)]');
    expect(sidebar).toContain('shadow-[var(--shadow-panel)]');
    expect(sidebar).toContain('bg-[var(--color-panel-surface)]');
    expect(sidebar).toContain('bg-[var(--color-panel-surface-soft)]');
    expect(stats).toContain('bg-[var(--color-panel-surface)]');
    expect(stats).toContain('border-[var(--color-soft-border)]');
    expect(filterBar).toContain('bg-[var(--color-panel-surface)]');
    expect(filterControls).toContain('text-[var(--color-field-note)]');
    expect(filterControls).toContain('border-[var(--color-soft-border)]');
    expect(modal).toContain('rounded-[var(--radius-panel)]');
    expect(modal).toContain('bg-[var(--color-panel-surface)]');
    expect(projectCard).toContain('border-[var(--color-soft-border)]');
    expect(expertCard).toContain('border-[var(--color-soft-border)]');
  });

  it('uses subtle field notebook details for card backs', () => {
    const css = readSource('../../src/index.css');
    const projectCard = readSource('../../src/components/cards/ProjectCard.tsx');
    const expertCard = readSource('../../src/components/cards/ExpertCard.tsx');

    expect(css).toContain('--color-paper-warm');
    expect(css).toContain('--color-paper-line');
    expect(css).toContain('.notebook-section-title');
    expect(css).toContain('letter-spacing: 0.06em');
    expect(projectCard).toContain('notebook-section');
    expect(projectCard).toContain('project-detail-list');
    expect(expertCard).toContain('notebook-section');
    expect(expertCard).toContain('expert-bio-box');
  });

  it('keeps phase 5 card polish responsive and scalable', () => {
    const css = readSource('../../src/index.css');
    const projectCard = readSource('../../src/components/cards/ProjectCard.tsx');
    const expertCard = readSource('../../src/components/cards/ExpertCard.tsx');
    const cardCss = css.slice(css.indexOf('.card-interactive-shell'), css.indexOf('#citizen-science-root'));

    expect(projectCard).toContain('project-title-row');
    expect(projectCard).toContain('project-badge-stack');
    expect(projectCard).toContain('getCompactCategoryLabel');
    expect(projectCard).toContain('project-category-pill');
    expect(projectCard).toContain('project-status-pill');
    expect(expertCard).toContain('orcid');
    expect(expertCard).toContain('renderSocialLinks');
    expect(css).toContain('.profile-header-safe');
    expect(css).toContain('.profile-avatar');
    expect(css).toContain('.social-pill');
    expect(css).toContain('.project-category-pill');
    expect(css).toContain('.project-status-pill-active');
    expect(css).toContain('.project-status-pill-planned');
    expect(css).toContain('.project-status-pill-past');
    expect(css).toContain('color: var(--color-field-note)');
    expect(css).toContain('padding: 0.34rem 0.58rem');
    expect(css).toContain('html.theme-dark .project-category-pill');
    expect(css).toContain('html.high-contrast .project-status-pill');
    expect(css).toContain('.project-meta-grid');
    expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(css).not.toContain('.meta-grid,\n  .stat-grid');
    expect(cardCss).not.toMatch(/font-size:\s*\d+px/);
  });

  it('mounts the accessibility hook in the app shell', () => {
    const app = readSource('../../src/App.tsx');
    expect(app).toContain('useApplyAccessibility()');
  });
});
