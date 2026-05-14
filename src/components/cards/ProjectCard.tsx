import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { highlightText } from '@/utils/highlightText';
import { getCompactCategoryLabel, getProjectStatusLabel } from '@/utils/projectBadges';

export interface ProjectCardProps {
  id: string;
  name: string;
  status: 'active' | 'past' | 'planned';
  field: string;
  description: string;
  location: string;
  displayLocation?: string;
  regionLabel?: string;
  yearRange: string;
  leadExpertId: string;
  leadExpertName: string;
  cardSummary?: string;
  focusSummary?: string;
  outputsSummary?: string;
  website?: string;
  isCitizenScience?: boolean;
  contact?: string;
  country?: string;
}

const getProjectSummary = (description: string) => {
  const normalized = description.trim();
  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence && firstSentence.length <= 160 ? firstSentence : normalized.slice(0, 160).trimEnd() + '...';
};

const getRegionLabel = (regionLabel?: string, displayLocation?: string, location?: string) => {
  if (regionLabel) return regionLabel;
  if (displayLocation === '3 Countries') return '3-country mountain corridor';
  if (displayLocation) return displayLocation;
  return location ?? 'Carpathian region';
};

const getFocusLabel = (field: string) => {
  switch (field.toLowerCase()) {
    case 'biodiversity':
      return 'Pollinators, habitat fragmentation, community mapping';
    case 'water':
      return 'Catchment resilience, restoration planning, community mapping';
    case 'climate change':
      return 'Climate resilience, field observations, community mapping';
    default:
      return `${field}, habitat resilience, community mapping`;
  }
};

const getOutputsLabel = (isCitizenScience?: boolean) =>
  isCitizenScience
    ? 'Atlas layers, species reports, volunteer participation metrics'
    : 'Atlas layers, research reports, participation metrics';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  status,
  field,
  description,
  location,
  displayLocation,
  regionLabel,
  yearRange,
  leadExpertId,
  leadExpertName,
  cardSummary,
  focusSummary,
  outputsSummary,
  website,
  isCitizenScience,
  contact,
}) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const searchTerm = useAppStore((s) => s.filters?.searchTerm ?? '');
  const reducedMotion = useAppStore((s) => s.a11y.reducedMotion);
  const setSelectedExpertId = useAppStore((s) => s.setSelectedExpertId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const projectSummary = cardSummary ?? getProjectSummary(description);
  const resolvedRegionLabel = getRegionLabel(regionLabel, displayLocation, location);
  const focusLabel = focusSummary ?? getFocusLabel(field);
  const outputsLabel = outputsSummary ?? getOutputsLabel(isCitizenScience);
  const statusLabel = getProjectStatusLabel(status);
  const compactFieldLabel = getCompactCategoryLabel(field);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/project/${id}`).catch(() => {});
  };

  const handleLeadExpertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!leadExpertId) return;

    setSelectedExpertId(leadExpertId);
    setActiveTab('experts');
    document.getElementById(`expert-card-${leadExpertId}`)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const handleSurfaceFlip = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"], [data-no-card-flip="true"]')) {
      return;
    }
    toggle();
  };

  return (
    <article
      className={`card-interactive-shell card-auto-height-shell project-card-shell relative w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-soft-border)] shadow-[var(--shadow-card)] motion-reduce:transition-none ${
        reducedMotion
          ? 'hover:shadow-[var(--shadow-card)]'
          : 'transition-all duration-200 [perspective:1600px] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1'
      }`}
      data-testid={`project-card-${isFlipped ? 'back' : 'front'}`}
      aria-labelledby={`project-card-${id}`}
    >
      <div
        data-testid="project-card-stage"
        className={`card-flip-stage relative motion-reduce:transition-none ${reducedMotion ? '' : 'transition-transform duration-600'} ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <section
          data-testid="project-face-front"
          aria-hidden={isFlipped}
          className={`card-face card project-front ${isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
        >
          <header data-testid="project-front-header" className="header project-card-header">
            <div className="project-title-row" data-testid="project-title-row">
              <h3
                id={`project-card-${id}`}
                data-testid="project-card-title"
                dangerouslySetInnerHTML={highlightText(name, searchTerm)}
              />
              <div className="project-badge-row project-badge-stack" data-testid="project-badge-row">
                <div className={`project-status-pill project-status-pill-${status} status-badge badge-single-line`} data-testid="project-status">{statusLabel}</div>
                <div
                  className="project-category-pill category-badge badge-single-line"
                  data-testid="project-field"
                  title={field}
                  aria-label={`Category: ${field}`}
                >
                  {compactFieldLabel}
                </div>
              </div>
            </div>
          </header>

          <div className="body card-content-scroll project-front-body">
            <div className="meta-grid project-meta-grid" data-testid="project-meta-grid">
              <div className="meta-chip">
                <strong>Region</strong>
                <span data-testid="project-location" dangerouslySetInnerHTML={highlightText(resolvedRegionLabel, searchTerm)} />
              </div>
              <div className="meta-chip">
                <strong>Timeline</strong>
                <span data-testid="project-year">{yearRange}</span>
              </div>
              <button
                type="button"
                onClick={handleLeadExpertClick}
                className="meta-chip lead-meta-row"
                data-testid="project-lead-expert"
                aria-label={`Show lead expert ${leadExpertName}`}
              >
                <strong>Lead</strong>
                <span className="lead-link">
                  {leadExpertName}
                </span>
              </button>
            </div>
            <p
              className="summary project-summary-copy"
              data-testid="project-summary"
              dangerouslySetInnerHTML={highlightText(projectSummary, searchTerm)}
            />
          </div>

          <div className="footer">
            <div className="footer-actions">
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button outline"
                  data-testid="project-website-link"
                >
                  Website
                </a>
              ) : null}
              <button
                type="button"
                onClick={handleCopy}
                className="button outline"
                data-testid="copy-project-link"
                aria-label="Copy project link"
              >
                Copy
              </button>
            </div>
            <div className="footer-actions">
              <button
                type="button"
                onClick={toggle}
                disabled={isFlipping}
                className="button"
                data-testid="flip-to-back"
                aria-label="View project details"
              >
                Details ↻
              </button>
            </div>
          </div>
        </section>

        <section
          data-testid="project-face-back"
          aria-hidden={!isFlipped}
          className={`card-face card card-face-back project-back project-card-backdrop ${!isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
        >
          <header className="header project-card-header">
            <div className="project-title-row" data-testid="project-title-row">
              <h3>{name}</h3>
              <div className="project-badge-row project-badge-stack" data-testid="project-badge-row">
                <div className={`project-status-pill project-status-pill-${status} status-badge badge-single-line`}>{statusLabel}</div>
                <div className="project-category-pill category-badge badge-single-line" title={field} aria-label={`Category: ${field}`}>
                  {compactFieldLabel}
                </div>
              </div>
            </div>
          </header>

          <div className="body card-content-scroll project-back-body notebook-body" data-testid="project-back-scroll">
            <section className="notebook-section" aria-labelledby={`project-overview-${id}`}>
              <h4 id={`project-overview-${id}`} className="notebook-section-title">Overview</h4>
              <div className="back-summary notebook-panel" data-testid="project-back-summary">
                <p dangerouslySetInnerHTML={highlightText(description, searchTerm)} />
              </div>
            </section>
            <div className="detail-list notebook-detail-list" data-testid="project-detail-list">
              <section className="notebook-detail-item" data-testid="project-contact-detail" aria-labelledby={`project-contact-${id}`}>
                <h4 id={`project-contact-${id}`} className="notebook-section-title">Contact</h4>
                <p>{contact ?? 'citizen-science@carpathian.org'}</p>
              </section>
              <section className="notebook-detail-item" data-testid="project-focus-detail" aria-labelledby={`project-focus-${id}`}>
                <h4 id={`project-focus-${id}`} className="notebook-section-title">Focus</h4>
                <p>{focusLabel}</p>
              </section>
              <section className="notebook-detail-item" data-testid="project-outputs-detail" aria-labelledby={`project-outputs-${id}`}>
                <h4 id={`project-outputs-${id}`} className="notebook-section-title">Outputs</h4>
                <p>{outputsLabel}</p>
              </section>
            </div>
          </div>

          <div className="footer">
            <div className="footer-actions">
              <button
                type="button"
                onClick={handleCopy}
                className="button outline"
                data-testid="copy-project-back-link"
                aria-label="Copy project link"
              >
                Copy
              </button>
            </div>
            <div className="footer-actions">
              <button
                type="button"
                onClick={toggle}
                disabled={isFlipping}
                className="button"
                data-testid="flip-to-front"
                aria-label="Back to project summary"
              >
                Back ↻
              </button>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};
