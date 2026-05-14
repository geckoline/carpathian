import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { useCardShare } from '@/hooks/useCardShare';
import { getLocalExpertPortraitPath } from './expertProfileImage';

const getInitials = (name: string) => {
  const parts = name.replace(/^dr\.\s*/i, '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
};

const buildAvatarDataUrl = (name: string) => {
  const initials = getInitials(name);
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
  const palettes = [
    ['#f3d1b0', '#7bb2a2', '#4f392a'],
    ['#efd9ad', '#98b7a5', '#553f2e'],
    ['#edd5bf', '#8fb4c2', '#4b3f35'],
  ] as const;
  const [bgStart, bgEnd, hairColor] = palettes[seed % palettes.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${bgStart}"/>
          <stop offset="1" stop-color="${bgEnd}"/>
        </linearGradient>
      </defs>
      <rect width="180" height="180" fill="url(#bg)"/>
      <circle cx="90" cy="70" r="34" fill="#f6e6d2"/>
      <path d="M47 166c10-32 34-48 60-48 27 0 50 16 58 48" fill="#f6e6d2"/>
      <path d="M54 68c2-17 11-30 24-39 14-10 32-13 47-5 17 7 30 27 24 52-8-9-15-13-22-15-10 10-29 18-53 18-7 0-13 0-18-2-2-3-2-5-2-9z" fill="${hairColor}"/>
      <text x="90" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#fff">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getExpertSummary = (bio: string) => {
  const normalized = bio.trim();
  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if (firstSentence) {
    return firstSentence;
  }
  return normalized.slice(0, 110).trimEnd() + (normalized.length > 110 ? '...' : '');
};

const getFrontSubtitle = (bio: string) => getExpertSummary(bio);
const getBackSubtitle = (expertise: string[]) => expertise.slice(0, 3).join(' • ');
const isLocalProfilePicture = (value?: string) =>
  Boolean(value?.startsWith('/profile-pictures/') && !value.includes('..'));

type SocialLink = {
  href: string;
  label: string;
  ariaLabel: string;
  testKey: string;
  external?: boolean;
};

export interface ExpertCardProps {
  id: string;
  name: string;
  institution: string;
  country: string;
  degree?: string;
  headline?: string;
  expertiseSubtitle?: string;
  bio: string;
  expertise: string[];
  publications?: number;
  projects?: number;
  email?: string;
  linkedin?: string;
  scopus?: string;
  orcid?: string;
  googleScholar?: string;
  avatarUrl?: string;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({
  id,
  name,
  institution,
  country,
  degree,
  headline,
  expertiseSubtitle,
  bio,
  expertise,
  publications = 0,
  projects = 0,
  email,
  linkedin,
  scopus,
  orcid,
  googleScholar,
  avatarUrl,
}) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const dataset = useAppStore((s) => s.dataset);
  const selectedExpertId = useAppStore((s) => s.ui.selectedExpertId);
  const reducedMotion = useAppStore((s) => s.a11y.reducedMotion);
  const isSelected = selectedExpertId === id;
  const frontSubtitle = headline ?? getFrontSubtitle(bio);
  const backSubtitle = expertiseSubtitle ?? getBackSubtitle(expertise);
  const fallbackAvatarUrl = buildAvatarDataUrl(name);
  const idProfilePictureSrc = getLocalExpertPortraitPath(id);
  const profilePictureSrc = isLocalProfilePicture(avatarUrl) ? avatarUrl : idProfilePictureSrc;
  const secondaryAvatarSrc = profilePictureSrc === idProfilePictureSrc ? avatarUrl : idProfilePictureSrc;
  const { copy: handleCopy } = useCardShare({
    kind: 'expert',
    id,
    dataset,
  });
  const socialLinks: SocialLink[] = [
    ...(email ? [{ href: `mailto:${email}`, label: 'Mail', ariaLabel: 'Send email', testKey: 'contact-email' }] : []),
    ...(linkedin ? [{ href: linkedin, label: 'LinkedIn', ariaLabel: 'LinkedIn profile', testKey: 'linkedin', external: true }] : []),
    ...(scopus ? [{ href: scopus, label: 'Scopus', ariaLabel: 'Scopus profile', testKey: 'scopus', external: true }] : []),
    ...(googleScholar ? [{ href: googleScholar, label: 'Scholar', ariaLabel: 'Google Scholar profile', testKey: 'google-scholar', external: true }] : []),
    ...(orcid ? [{ href: orcid, label: 'ORCID', ariaLabel: 'ORCID profile', testKey: 'orcid', external: true }] : []),
  ];

  const handleSurfaceFlip = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"], [data-no-card-flip="true"]')) {
      return;
    }
    toggle();
  };

  const handleAvatarError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const fallbackStep = image.dataset.fallbackStep;

    if (secondaryAvatarSrc && fallbackStep !== 'secondary-avatar') {
      image.dataset.fallbackStep = 'secondary-avatar';
      image.src = secondaryAvatarSrc;
      return;
    }

    if (fallbackStep !== 'generated') {
      image.dataset.fallbackStep = 'generated';
      image.src = fallbackAvatarUrl;
    }
  };

  const renderAvatar = (hidden = false) => (
    <div className="avatar profile-avatar" aria-hidden={hidden} data-testid="expert-avatar">
      <img
        src={profilePictureSrc}
        alt={`${name} portrait`}
        loading="lazy"
        onError={handleAvatarError}
      />
    </div>
  );

  const renderSocialLinks = (surface: 'front' | 'back') => (
    <div className="social-row" data-testid={surface === 'front' ? 'expert-social-row' : `expert-${surface}-social-row`}>
      {socialLinks.map((link) => (
        <a
          key={`${surface}-${link.testKey}`}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          className="social-pill"
          data-testid={`expert-${surface}-${link.testKey}-btn`}
          aria-label={link.ariaLabel}
        >
          {link.label}
        </a>
      ))}
    </div>
  );

  return (
    <article
      className={`card-interactive-shell card-auto-height-shell expert-card-shell relative w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-soft-border)] shadow-[var(--shadow-card)] motion-reduce:transition-none ${
        reducedMotion
          ? 'hover:shadow-[var(--shadow-card)]'
          : 'transition-all duration-200 [perspective:1600px] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1'
      } ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''} focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2`}
      id={`expert-card-${id}`}
      data-testid={`expert-card-${isFlipped ? 'back' : 'front'}`}
      aria-labelledby={`expert-card-title-${id}`}
    >
      <div
        data-testid="expert-card-stage"
        className={`card-flip-stage relative motion-reduce:transition-none ${reducedMotion ? '' : 'transition-transform duration-600'} ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <section
          data-testid="expert-face-front"
          aria-hidden={isFlipped}
          className={`card-face card expert-front ${isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
        >
          <header data-testid="expert-front-header" className="header profile-header profile-header-safe">
            <h3 id={`expert-card-title-${id}`}>{name}</h3>
            <p className="expert-subtitle" data-testid="expert-subtitle">{frontSubtitle}</p>
            {renderAvatar()}
          </header>

          <div className="body card-content-scroll expert-front-content" data-testid="expert-front-content">
            <div className="expert-identity">
              <div data-testid="expert-institution"><strong>Institution:</strong> {institution}</div>
              <div data-testid="expert-country"><strong>Country:</strong> {country}</div>
              <div data-testid="expert-degree"><strong>Degree:</strong> {degree || 'N/A'}</div>
            </div>
            <div className="stat-grid">
              <div className="stat-card" data-testid="expert-pubs">
                <strong>Publications</strong>
                <span>{publications}</span>
              </div>
              <div className="stat-card" data-testid="expert-projects">
                <strong>Projects</strong>
                <span>{projects}</span>
              </div>
            </div>
          </div>

          <div className="footer expert-footer-column">
            {renderSocialLinks('front')}
            <div className="footer-actions footer-actions-spread">
              <button type="button" onClick={handleCopy} className="button outline" data-testid="copy-expert-link" aria-label="Copy expert link">
                Copy
              </button>
              <button type="button" onClick={toggle} disabled={isFlipping} className="button" data-testid="flip-to-back" aria-label="View expert details">
                Details ↻
              </button>
            </div>
          </div>
        </section>

        <section
          data-testid="expert-face-back"
          aria-hidden={!isFlipped}
          className={`card-face card card-face-back expert-back expert-card-backdrop ${!isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
        >
          <header className="header profile-header profile-header-safe">
            <h3>{name}</h3>
            <p className="expert-subtitle" data-testid="expert-back-subtitle">{backSubtitle}</p>
            {renderAvatar(true)}
          </header>

          <div className="body card-content-scroll expert-back-body notebook-body" data-testid="expert-back-scroll">
            <section className="notebook-section" aria-labelledby={`expert-expertise-${id}`}>
              <h4 id={`expert-expertise-${id}`} className="notebook-section-title">Expertise</h4>
              <div className="tag-row notebook-chip-row" data-testid="expert-tags">
                {expertise.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </section>
            <section className="notebook-section" aria-labelledby={`expert-bio-section-${id}`}>
              <h4 id={`expert-bio-section-${id}`} className="notebook-section-title">Bio</h4>
              <div className="bio-box notebook-panel" data-testid="expert-bio-box">
                <p data-testid="expert-bio">{bio}</p>
              </div>
            </section>
          </div>

          <div className="footer expert-footer-column">
            {renderSocialLinks('back')}
            <div className="footer-actions footer-actions-spread">
              <button type="button" onClick={handleCopy} className="button outline" data-testid="copy-expert-back-link" aria-label="Copy expert link">
                Copy
              </button>
              <button type="button" onClick={toggle} disabled={isFlipping} className="button" data-testid="flip-to-front" aria-label="Back to expert summary">
                Back ↻
              </button>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};

export default ExpertCard;
