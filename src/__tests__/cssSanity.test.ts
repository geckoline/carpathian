import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const readSource = (relativePath: string) => readFileSync(resolve(__dirname, relativePath), 'utf-8');

describe('CSS safety checks', () => {
  it('does not import from removed shadcn package', () => {
    const css = readSource('../../src/index.css');
    expect(css).not.toMatch(/@import\s+["']shadcn/i);
  });

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
    const a11y = readSource('../../src/styles/a11y.css');
    expect(a11y).toMatch(/prefers-reduced-motion/i);
    expect(a11y).toMatch(/reduced-motion-forced/i);
    expect(a11y).toMatch(/high-contrast/i);
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
    const cardShell = readSource('../../src/components/cards/CardShell.tsx');

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
    expect(cardShell).toContain('border-[var(--color-soft-border)]');
  });

  it('uses subtle field notebook details for card backs', () => {
    const cards = readSource('../../src/styles/cards.css');
    const projectCard = readSource('../../src/components/cards/ProjectCard.tsx');
    const expertCard = readSource('../../src/components/cards/ExpertCard.tsx');

    expect(cards).toContain('.notebook-section-title');
    expect(cards).toContain('letter-spacing: 0.06em');
    expect(projectCard).toContain('notebook-section');
    expect(projectCard).toContain('project-detail-list');
    expect(expertCard).toContain('notebook-section');
    expect(expertCard).toContain('expert-bio-box');
  });

  it('keeps phase 5 card polish responsive and scalable', () => {
    const cards = readSource('../../src/styles/cards.css');
    const projectCard = readSource('../../src/components/cards/ProjectCard.tsx');
    const expertCard = readSource('../../src/components/cards/ExpertCard.tsx');

    expect(projectCard).toContain('project-title-row');
    expect(projectCard).toContain('project-badge-stack');
    expect(projectCard).toContain('getCompactCategoryLabel');
    expect(projectCard).toContain('project-category-pill');
    expect(projectCard).toContain('project-status-pill');
    expect(expertCard).toContain('orcid');
    expect(expertCard).toContain('renderSocialLinks');
    expect(cards).toContain('.profile-header-safe');
    expect(cards).toContain('.profile-avatar');
    expect(cards).toContain('.social-pill');
    expect(cards).toContain('.project-category-pill');
    expect(cards).toContain('.project-status-pill-active');
    expect(cards).toContain('.project-status-pill-planned');
    expect(cards).toContain('.project-status-pill-past');
    expect(cards).toContain('padding: 0.34rem 0.58rem');
    expect(cards).toContain('html.theme-dark .project-category-pill');
    expect(cards).toContain('html.high-contrast .project-status-pill');
    expect(cards).toContain('.project-meta-grid');
    expect(cards).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(cards).not.toContain('.meta-grid,\n  .stat-grid');
    expect(cards).not.toMatch(/font-size:\s*\d+px/);
  });

  it('mounts the accessibility hook in the app shell', () => {
    const app = readSource('../../src/App.tsx');
    expect(app).toContain('useApplyAccessibility()');
  });
});
