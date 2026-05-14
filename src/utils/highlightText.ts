import DOMPurify from 'dompurify';

const purify = (s: string) => DOMPurify.sanitize(s, { ALLOWED_TAGS: [] });

export const highlightText = (text: string, searchTerm: string): { __html: string } => {
  if (!searchTerm.trim()) {
    return { __html: purify(text) };
  }
  
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(`^${escaped}$`, 'i');
  const parts = text.split(splitRegex);
  
  const html = parts
    .map((part) => 
      matchRegex.test(part) 
        ? `<mark class="bg-yellow-200 px-0.5 rounded">${purify(part)}</mark>` 
        : purify(part)
    )
    .join('');
    
  return { __html: html };
};
