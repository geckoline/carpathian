import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { MapPin, Calendar, User, ExternalLink, Copy, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';

export interface ProjectCardProps {
  id: string; name: string; status: 'active' | 'past' | 'planned'; field: string;
  description: string; location: string; yearRange: string;
  leadExpertId?: string; leadExpertName?: string; website?: string;
  area?: string; country?: string;
}

const statusColors: Record<ProjectCardProps['status'], string> = {
  active: 'bg-status-active', past: 'bg-status-past', planned: 'bg-status-planned',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id, name, status, field, description, location, yearRange,
  leadExpertId, leadExpertName, website, area, country
}) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const [expandedDesc, setExpandedDesc] = useState(false);
  const setSelectedExpertId = useAppStore((s) => s.setSelectedExpertId);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/project/${id}`).catch(() => {});
  };

  const handleLeadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (leadExpertId) setSelectedExpertId(leadExpertId);
  };

  return (
    <article className={`relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg transition-transform duration-600 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} data-testid={`project-card-${isFlipped ? 'back' : 'front'}`} aria-labelledby={`project-card-${id}`}>
      
      {/* FRONT FACE */}
      {!isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col bg-white">
          <header className="bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-3 text-white flex justify-between items-start">
            <h3 id={`project-card-${id}`} className="font-semibold text-lg leading-tight">{name}</h3>
            <div className="flex flex-col gap-1 text-right text-xs font-medium">
              <span className={`px-2 py-0.5 rounded-full bg-white/20 ${statusColors[status]}`} data-testid="project-status">{status.toUpperCase()}</span>
              <span className="text-white/90" data-testid="project-field">{field}</span>
            </div>
          </header>
          <div className="flex-1 px-4 py-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-3 text-sm text-text-muted">
              <span className="flex items-center gap-1" data-testid="project-location"><MapPin size={14} /> {location}</span>
              <span className="flex items-center gap-1" data-testid="project-year"><Calendar size={14} /> {yearRange}</span>
              {leadExpertName && (
                <button onClick={handleLeadClick} className="flex items-center gap-1 text-primary-500 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1" data-testid="lead-expert-link">
                  <User size={14} /> {leadExpertName}
                </button>
              )}
            </div>
          </div>
          <footer className="px-4 py-2 border-t border-surface-muted flex justify-between items-center text-sm">
            {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline" data-testid="project-website-link"><ExternalLink size={14} /> Website</a> : <span />}
            <div className="flex items-center gap-3">
              <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-project-link" aria-label="Copy project link"><Copy size={16} /></button>
              <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-back" aria-label="View project details">Details <RotateCw size={14} /></button>
            </div>
          </footer>
        </div>
      )}

      {/* BACK FACE */}
      {isFlipped && (
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col bg-white">
          <header className="bg-primary-700 px-4 py-3 text-white border-b-4 border-accent">
            <h3 className="font-semibold text-lg">{name}</h3>
            <div className="flex gap-2 mt-1 text-xs text-white/90 capitalize">
              <span>{status}</span> • <span>{field}</span>
            </div>
          </header>
          
          <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3 text-sm">
            <div>
              <p className={`text-gray-700 transition-all ${expandedDesc ? 'line-clamp-none' : 'line-clamp-3'}`} data-testid="project-description">{description}</p>
              <button onClick={(e) => { e.stopPropagation(); setExpandedDesc(p => !p); }} className="mt-1 text-xs text-primary-500 hover:underline flex items-center gap-1" data-testid="toggle-description" aria-expanded={expandedDesc}>
                {expandedDesc ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {expandedDesc ? 'Show less' : 'Read more'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div><span className="font-medium text-gray-800">Location:</span> {location}</div>
              <div><span className="font-medium text-gray-800">Period:</span> {yearRange}</div>
              {country && <div><span className="font-medium text-gray-800">Country:</span> {country}</div>}
              {area && <div><span className="font-medium text-gray-800">Region:</span> {area}</div>}
              {leadExpertName && <div className="col-span-2"><span className="font-medium text-gray-800">Lead Expert:</span> {leadExpertName}</div>}
            </div>

            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline text-xs mt-2" data-testid="project-website-link-back">
                Visit Project Website <ExternalLink size={12} />
              </a>
            )}
          </div>

          <footer className="px-4 py-2 border-t border-surface-muted flex justify-between items-center text-sm mt-auto">
            <button onClick={handleCopy} className="p-1.5 rounded hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500" data-testid="copy-project-back-link" aria-label="Copy project link"><Copy size={16} /></button>
            <button onClick={toggle} disabled={isFlipping} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-500 disabled:opacity-50" data-testid="flip-to-front" aria-label="Back to project summary"><RotateCw size={14} /> Back</button>
          </footer>
        </div>
      )}
    </article>
  );
};

export default ProjectCard;
