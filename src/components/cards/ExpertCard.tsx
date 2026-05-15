import { useAppStore } from '@/store/appStore';
import { extractFirstSentence } from '@/utils/cardInteraction';
import { LinkedInIcon, ScopusIcon, GoogleScholarIcon, OrcidIcon } from '@/components/ui/SocialIcons';
import { Mail } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { getLocalExpertPortraitPaths, buildUiAvatarUrl } from './expertProfileImage';
import { CardShell } from './CardShell';

const getFrontSubtitle = (bio: string) => extractFirstSentence(bio, 110);
const getBackSubtitle = (expertise: string[]) => expertise.slice(0, 3).join(' • ');

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
  institutionWebsite?: string;
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
}

export const ExpertCard = memo<ExpertCardProps>(({
  id,
  name,
  institution,
  institutionWebsite,
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
}) => {
  const selectedExpertId = useAppStore((s) => s.ui.selectedExpertId);
  const isSelected = selectedExpertId === id;
  const frontSubtitle = headline ?? getFrontSubtitle(bio);
  const backSubtitle = expertiseSubtitle ?? getBackSubtitle(expertise);
  const portraitSources = useMemo(() => getLocalExpertPortraitPaths(id), [id]);
  const fallbackSrc = useMemo(() => buildUiAvatarUrl(name), [name]);
  const [useFallback, setUseFallback] = useState(false);
  const [portraitSourceIndex, setPortraitSourceIndex] = useState(0);
  const portraitSrc = portraitSources[portraitSourceIndex] ?? fallbackSrc;

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setUseFallback(false); };
    img.onerror = () => {
      if (cancelled) return;
      const nextIndex = portraitSourceIndex + 1;
      if (nextIndex < portraitSources.length) {
        setPortraitSourceIndex(nextIndex);
        return;
      }
      setUseFallback(true);
    };
    img.src = portraitSrc;
    return () => { cancelled = true; };
  }, [portraitSourceIndex, portraitSrc, portraitSources.length]);

  useEffect(() => {
    setPortraitSourceIndex(0);
    setUseFallback(false);
  }, [portraitSources]);

  const socialLinks = useMemo((): (SocialLink & { icon: React.ReactNode })[] => [
    ...(email ? [{ href: `mailto:${email}`, label: 'Mail', icon: <Mail size={14} />, ariaLabel: 'Send email', testKey: 'contact-email' }] : []),
    ...(linkedin ? [{ href: linkedin, label: 'LinkedIn', icon: <LinkedInIcon size={14} />, ariaLabel: 'LinkedIn profile', testKey: 'linkedin', external: true }] : []),
    ...(scopus ? [{ href: scopus, label: 'Scopus', icon: <ScopusIcon size={14} />, ariaLabel: 'Scopus profile', testKey: 'scopus', external: true }] : []),
    ...(googleScholar ? [{ href: googleScholar, label: 'Scholar', icon: <GoogleScholarIcon size={14} />, ariaLabel: 'Google Scholar profile', testKey: 'google-scholar', external: true }] : []),
    ...(orcid ? [{ href: orcid, label: 'ORCID', icon: <OrcidIcon size={14} />, ariaLabel: 'ORCID profile', testKey: 'orcid', external: true }] : []),
  ], [email, linkedin, scopus, googleScholar, orcid]);

  const renderAvatar = useCallback((hidden = false) => (
    <div className="avatar profile-avatar" aria-hidden={hidden} data-testid="expert-avatar">
      <img src={useFallback ? fallbackSrc : portraitSrc} alt={`${name} portrait`} loading="lazy" />
    </div>
  ), [useFallback, fallbackSrc, portraitSrc, name]);

  const renderInstitution = useCallback(() => (
    <div data-testid="expert-institution">
      <strong>Institution:</strong>{' '}
      {institutionWebsite ? (
        <a
          href={institutionWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="notebook-link"
          onClick={(event) => event.stopPropagation()}
        >
          {institution}
        </a>
      ) : institution}
    </div>
  ), [institution, institutionWebsite]);

  const renderSocialLinks = useCallback((surface: 'front' | 'back') => (
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
          <span className="inline-flex items-center gap-1.5">
            {link.icon}
            <span>{link.label}</span>
          </span>
        </a>
      ))}
    </div>
  ), [socialLinks]);

  return (
    <CardShell
      id={id}
      cardType="expert"
      isSelected={isSelected}
      front={({ toggle, isFlipping, handleCopy, copied }) => (
        <>
          <header data-testid="expert-front-header" className="header profile-header profile-header-safe">
            <h3 id={`expert-card-title-${id}`}>{name}</h3>
            <p className="expert-subtitle" data-testid="expert-subtitle">{frontSubtitle}</p>
            {renderAvatar()}
          </header>

          <div className="body card-content-scroll expert-front-content" data-testid="expert-front-content">
            <div className="expert-identity">
              {renderInstitution()}
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
              <button type="button" onClick={(e: React.MouseEvent) => handleCopy(e)} className="button outline" data-testid="copy-expert-link" aria-label="Copy expert link">
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button type="button" onClick={toggle} disabled={isFlipping} className="button" data-testid="flip-to-back" aria-label="View expert details">
                Details ↻
              </button>
            </div>
          </div>
        </>
      )}
      back={({ toggle: backToggle, isFlipping: backIsFlipping, handleCopy: backHandleCopy, copied: backCopied }) => (
        <>
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
              <button type="button" onClick={(e: React.MouseEvent) => backHandleCopy(e)} className="button outline" data-testid="copy-expert-back-link" aria-label="Copy expert link">
                {backCopied ? 'Copied!' : 'Copy'}
              </button>
              <button type="button" onClick={backToggle} disabled={backIsFlipping} className="button" data-testid="flip-to-front" aria-label="Back to expert summary">
                Back ↻
              </button>
            </div>
          </div>
        </>
      )}
    />
  );
});

export default ExpertCard;
