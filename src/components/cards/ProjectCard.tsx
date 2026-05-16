import { useMemo, useCallback, memo } from 'react';
import { useAppStore } from '@/store/appStore';
import { highlightText } from '@/utils/highlightText';
import { getCompactCategoryLabel, getProjectStatusLabel } from '@/utils/projectBadges';
import { getCountryName } from '@/utils/countries';
import { extractFirstSentence } from '@/utils/cardInteraction';
import { CardShell } from './CardShell';

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
  expertIds: string[];
  teamMembers: { id: string; name: string }[];
  cardSummary?: string;
  focusSummary?: string;
  outputsSummary?: string;
  website?: string;
  isCitizenScience?: boolean;
  contact?: string;
  countries?: string[];
}

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

export const ProjectCard = memo<ProjectCardProps>(({
  id,
  name,
  status,
  field,
  description,
  location,
  displayLocation,
  regionLabel,
  yearRange,
  teamMembers,
  cardSummary,
  focusSummary,
  outputsSummary,
  website,
  isCitizenScience,
  contact,
  countries,
}) => {
  const dataset = useAppStore((s) => s.dataset);
  const searchTerm = useAppStore((s) => s.filters?.searchTerm ?? '');
  const reducedMotion = useAppStore((s) => s.a11y.reducedMotion);
  const setSelectedExpertId = useAppStore((s) => s.setSelectedExpertId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const projectSummary = useMemo(
    () => cardSummary ?? extractFirstSentence(description, 160),
    [cardSummary, description]
  );
  const resolvedRegionLabel = useMemo(
    () => getRegionLabel(regionLabel, displayLocation, location),
    [regionLabel, displayLocation, location]
  );
  const focusLabel = useMemo(
    () => focusSummary ?? getFocusLabel(field),
    [focusSummary, field]
  );
  const outputsLabel = useMemo(
    () => outputsSummary ?? getOutputsLabel(isCitizenScience),
    [outputsSummary, isCitizenScience]
  );
  const statusLabel = useMemo(() => getProjectStatusLabel(status), [status]);
  const compactFieldLabel = useMemo(() => getCompactCategoryLabel(field), [field]);
  const handleTeamMemberClick = useCallback((e: React.MouseEvent, expertId: string) => {
    e.stopPropagation();
    if (!expertId) return;

    setSelectedExpertId(expertId);
    setActiveTab('experts');

    const attemptScroll = (attempt: number) => {
      const el = document.getElementById(`expert-card-${expertId}`);
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        el.classList.add('animate-pulse-ring');
        setTimeout(() => el.classList.remove('animate-pulse-ring'), 3000);
      } else if (attempt < 20) {
        setTimeout(() => attemptScroll(attempt + 1), 100);
      }
    };
    attemptScroll(0);
  }, [reducedMotion, setSelectedExpertId, setActiveTab]);

  return (
    <CardShell
      id={id}
      cardType="project"
      dataset={dataset}
      front={({ toggle, isFlipping, handleCopy, copied }) => (
        <>
          <header data-testid="project-front-header" className="header project-card-header">
            <div className="project-title-row" data-testid="project-title-row">
              <h3
                id={`project-card-title-${id}`}
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
              {countries && countries.length > 0 && (
                <div className="meta-chip">
                  <strong>{countries.length === 1 ? 'Country' : 'Countries'}</strong>
                  <span data-testid="project-countries">{countries.map(getCountryName).join(', ')}</span>
                </div>
              )}
              <div className="meta-chip team-meta-row" data-testid="project-team">
                <strong>{teamMembers.length === 1 ? 'Expert' : 'Experts'}</strong>
                {teamMembers.length === 1 ? (
                  <span>
                    <button
                      type="button"
                      onClick={(e) => handleTeamMemberClick(e, teamMembers[0]!.id)}
                      className="team-pill"
                      data-testid={`team-member-${teamMembers[0]!.id}`}
                      aria-label={`Show expert ${teamMembers[0]!.name}`}
                    >
                      {teamMembers[0]!.name}
                    </button>
                  </span>
                ) : (
                  <span className="flex flex-col gap-1.5">
                    {teamMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={(e) => handleTeamMemberClick(e, member.id)}
                        className="team-pill self-start"
                        data-testid={`team-member-${member.id}`}
                        aria-label={`Show expert ${member.name}`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </div>
            <p
              className="summary project-summary-copy"
              data-testid="project-summary"
              dangerouslySetInnerHTML={highlightText(projectSummary, searchTerm)}
            />
          </div>

          <div className="footer project-footer-actions">
            <div className="footer-actions project-footer-left">
              <button
                type="button"
                onClick={(e: React.MouseEvent) => handleCopy(e)}
                className="button outline"
                data-testid="copy-project-link"
                aria-label="Copy project link"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="footer-actions project-footer-center">
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
            </div>
            <div className="footer-actions project-footer-right">
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
        </>
      )}
      back={({ toggle: backToggle, isFlipping: backIsFlipping, handleCopy: backHandleCopy, copied: backCopied }) => (
        <>
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
                <p>
                  <a
                    href={`mailto:${contact}`}
                    className="notebook-link"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Email ${contact}`}
                  >
                    {contact}
                  </a>
                </p>
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
                onClick={(e: React.MouseEvent) => backHandleCopy(e)}
                className="button outline"
                data-testid="copy-project-back-link"
                aria-label="Copy project link"
              >
                {backCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="footer-actions">
              <button
                type="button"
                onClick={backToggle}
                disabled={backIsFlipping}
                className="button"
                data-testid="flip-to-front"
                aria-label="Back to project summary"
              >
                Back ↻
              </button>
            </div>
          </div>
        </>
      )}
    />
  );
});

export default ProjectCard;
