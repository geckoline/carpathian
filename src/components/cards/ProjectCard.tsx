import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { highlightText } from '@/utils/text/highlightText';
import { MapPin, Calendar, User, ExternalLink, Copy, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ProjectCardProps {
  id: string; name: string; status: 'active' | 'past' | 'planned'; field: string;
  description: string; location: string; yearRange: string;
  leadExpertId?: string; leadExpertName?: string; website?: string;
  onVolunteer?: () => void;
  searchTerm?: string;
}

const statusColors: Record<ProjectCardProps['status'], string> = {
  active: 'bg-status-active', past: 'bg-status-past', planned: 'bg-status-planned',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id, name, status, field, description, location, yearRange, leadExpertId, leadExpertName, website, onVolunteer, searchTerm: propSearchTerm
}) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const [expandedDesc, setExpandedDesc] = useState(false);
  const storeSearchTerm = useAppStore((s) => s.filters?.searchTerm ?? '');
  const searchTerm = propSearchTerm ?? storeSearchTerm;
  const setSelectedExpertId = useAppStore((s) => s.setSelectedExpertId);
  const hoveredProjectId = useAppStore(s => s.ui.hoveredProjectId);
  const setHoveredProjectId = useAppStore(s => s.setHoveredProjectId);
  const isHovered = hoveredProjectId === id;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/project/${id}`).catch(() => {});
  };

  const handleLeadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (leadExpertId) setSelectedExpertId(leadExpertId);
  };

  return (
    <article onMouseEnter={() => setHoveredProjectId(id)} onMouseLeave={() => setHoveredProjectId(null)} className={`relative w-full h-[380px] rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isHovered ? 'ring-2 ring-primary-500 scale-[1.01]' : ''} ${isFlipped ? '[transform:rotateY(180deg)]' : ''} motion-safe:[transform-style:preserve-3d]`} data-testid={`project-card-${isFlipped ? 'back' : 'front'}`} aria-labelledby={`project-card-${id}`}>
      {!isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col bg-white">
            <header className="bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-3 text-white flex justify-between items-start">
              <h3 id={`project-card-${id}`} className="font-semibold text-lg leading-tight" dangerouslySetInnerHTML={highlightText(name, searchTerm)} />
              <div className="flex flex-col gap-1 text-right text-xs font-medium">
              <span className={`px-2 py-0.5 rounded-full bg-white/20 ${statusColors[status]}`} data-testid="project-status">{status.toUpperCase()}</span>
              <span className="text-white/90" data-testid="project-field">{field}</span>
            </div>
          </header>
            <div className="flex-1 px-4 py-3 flex flex-col gap-3">
              <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                <span className="flex items-center gap-1" data-testid="project-location"><MapPin size={14} aria-hidden="true" /> <span dangerouslySetInnerHTML={highlightText(location, searchTerm)} /></span>
                <span className="flex items-center gap-1" data-testid="project-year"><Calendar size={14} aria-hidden="true" /> {yearRange}</span>
              {leadExpertName && (
                <button onClick={handleLeadClick} className="flex items-center gap-1 text-primary-500 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1" data-testid="lead-expert-link" aria-label={`View ${leadExpertName}'s expert card`}>
                  <User size={14} className="animate-pulse motion-safe:animate-[pulse_2s_ease-in-out_infinite]" aria-hidden="true" /> {leadExpertName}
                </button>
              )}
            </div>
          </div>
          <footer className="px-4 py-2 border-t border-surface-muted flex justify-between items-center text-sm">
            {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline" data-testid="project-website-link" aria-label="Visit project website"><ExternalLink size={14} aria-hidden="true" /> Website</a> : <span />}
            <div className="flex items-center gap-3">
              {onVolunteer && <button onClick={(e) => { e.stopPropagation(); onVolunteer(); }} className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="project-volunteer-btn" aria-label="Volunteer for this project">Volunteer</button>}
              <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-project-link" aria-label="Copy project link"><Copy size={16} aria-hidden="true" /></button>
              <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-back" aria-label="View project details" aria-pressed={false}>Details <RotateCw size={14} aria-hidden="true" /></button>
            </div>
          </footer>
        </div>
      )}
      {isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col bg-white">
          <header className="bg-primary-700 border-b-4 border-accent px-4 py-3 text-white">
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-xs text-white/80 mt-1">Status: {status.charAt(0).toUpperCase() + status.slice(1)} | Field: {field}</p>
          </header>
            <div className="flex-1 px-4 py-3 overflow-hidden">
              <p className={`text-sm text-gray-700 transition-all ${expandedDesc ? 'line-clamp-none' : 'line-clamp-3'}`} data-testid="project-description" dangerouslySetInnerHTML={highlightText(description, searchTerm)} />
            <button onClick={(e) => { e.stopPropagation(); setExpandedDesc(p => !p); }} className="mt-1 text-xs text-primary-500 hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1" data-testid="toggle-description" aria-expanded={expandedDesc} aria-controls="project-description">
              {expandedDesc ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />} {expandedDesc ? 'Read less' : 'Read more'}
            </button>
          </div>
          <footer className="px-4 py-2 border-t border-surface-muted flex justify-between items-center text-sm">
            <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-project-back-link" aria-label="Copy project link"><Copy size={16} aria-hidden="true" /></button>
            <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-front" aria-label="Back to project summary" aria-pressed={true}><RotateCw size={14} aria-hidden="true" /> Back</button>
          </footer>
        </div>
      )}
    </article>
  );
};

export default ProjectCard;
