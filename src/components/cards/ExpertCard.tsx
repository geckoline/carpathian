import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { Mail, Copy, RotateCw, Building2, MapPin, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

const LinkedInIcon = () => (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500 hover:text-primary-600 transition-colors"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);
const ScopusIcon = () => (<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary-500 hover:text-primary-600 transition-colors"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>);

export interface ExpertCardProps {
  id: string; name: string; institution: string; country: string; degree: string;
  bio: string; expertise: string[]; publications?: number; projects?: number;
  email?: string; linkedin?: string; scopus?: string; avatarUrl?: string;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({
  id, name, institution, country, degree, bio, expertise, publications = 0, projects = 0,
  email, linkedin, scopus, avatarUrl
}) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const [expandedBio, setExpandedBio] = useState(false);
  const selectedExpertId = useAppStore((s) => s.ui.selectedExpertId);
  const isSelected = selectedExpertId === id;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/expert/${id}`).catch(() => {});
  };

  return (
    <article className={`relative w-full h-[440px] rounded-xl overflow-hidden shadow-lg transition-all duration-500 ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''} ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} data-testid={`expert-card-${isFlipped ? 'back' : 'front'}`} aria-labelledby={`expert-card-${id}`}>
      
      {/* FRONT FACE */}
      {!isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col bg-white">
          <header className="relative bg-gradient-to-br from-primary-400 to-primary-600 px-4 py-4 text-white pb-6">
            <h3 id={`expert-card-${id}`} className="font-semibold text-lg">{name}</h3>
            {avatarUrl && <img src={avatarUrl} alt={`${name} portrait`} className="absolute right-3 top-2 w-20 h-20 rounded-full border-2 border-white shadow-md object-cover -mt-8 mb-2" loading="lazy" />}
          </header>
          <div className="flex-1 px-4 py-3 flex flex-col gap-3 text-sm text-gray-700">
            <div className="grid gap-2">
              <span className="flex items-center gap-2" data-testid="expert-institution"><Building2 size={16} /> {institution}</span>
              <span className="flex items-center gap-2" data-testid="expert-location-degree"><MapPin size={16} /> {country} · <GraduationCap size={16} className="ml-1" /> {degree}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-surface-muted rounded p-2 text-center" data-testid="expert-pubs"><span className="font-semibold">{publications}</span> Pubs</div>
              <div className="bg-surface-muted rounded p-2 text-center" data-testid="expert-projects"><span className="font-semibold">{projects}</span> Projects</div>
            </div>
          </div>
          <footer className="px-4 py-2 border-t border-surface-muted flex flex-col gap-2 text-sm">
            <div className="flex gap-3 justify-center">
              {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="expert-front-linkedin-btn" aria-label="LinkedIn profile"><LinkedInIcon /></a>}
              {scopus && <a href={scopus} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="expert-front-scopus-btn" aria-label="Scopus profile"><ScopusIcon /></a>}
              {email && <a href={`mailto:${email}`} className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="expert-front-contact-email-btn" aria-label="Send email"><Mail size={20} /></a>}
            </div>
            <div className="flex justify-between items-center">
              <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-expert-link" aria-label="Copy expert link"><Copy size={16} /></button>
              <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-back" aria-label="View expert details">Details <RotateCw size={14} /></button>
            </div>
          </footer>
        </div>
      )}

      {/* BACK FACE */}
      {isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col bg-white">
          <header className="relative bg-gradient-to-br from-primary-400 to-primary-600 px-4 py-3 text-white">
            <h3 className="font-semibold text-lg">{name}</h3>
            <div className="text-xs text-white/90 mt-1">{degree} • {institution}</div>
            {avatarUrl && <img src={avatarUrl} alt="" className="absolute right-3 top-2 w-16 h-16 rounded-full border-2 border-white shadow-md object-cover -mt-8 mb-2" loading="lazy" aria-hidden="true" />}
          </header>
          
          <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3 text-sm">
            <div className="flex flex-wrap gap-1.5" data-testid="expert-tags">
              {expertise.map(tag => <span key={tag} className="px-2 py-0.5 bg-surface-muted text-xs rounded-full text-text-muted">{tag}</span>)}
            </div>

            <div>
              <p className={`text-gray-700 transition-all ${expandedBio ? 'line-clamp-none' : 'line-clamp-4'}`} data-testid="expert-bio">{bio}</p>
              <button onClick={(e) => { e.stopPropagation(); setExpandedBio(p => !p); }} className="mt-1 text-xs text-primary-500 hover:underline flex items-center gap-1" data-testid="toggle-bio" aria-expanded={expandedBio}>
                {expandedBio ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {expandedBio ? 'Show less' : 'Read more'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-muted rounded p-2 text-center">
                <span className="font-bold text-lg text-primary-600">{publications}</span>
                <div className="text-xs text-text-muted">Publications</div>
              </div>
              <div className="bg-surface-muted rounded p-2 text-center">
                <span className="font-bold text-lg text-primary-600">{projects}</span>
                <div className="text-xs text-text-muted">Projects</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-surface-muted">
              {email && <a href={`mailto:${email}`} className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Email"><Mail size={18} /></a>}
              {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="LinkedIn"><LinkedInIcon /></a>}
              {scopus && <a href={scopus} target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Scopus"><ScopusIcon /></a>}
            </div>
          </div>

          <footer className="px-4 py-2 border-t border-surface-muted flex justify-between items-center text-sm mt-auto">
            <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-expert-back-link" aria-label="Copy expert link"><Copy size={16} /></button>
            <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-front" aria-label="Back to expert summary"><RotateCw size={14} /> Back</button>
          </footer>
        </div>
      )}
    </article>
  );
};

export default ExpertCard;
