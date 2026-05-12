import DOMPurify from 'dompurify';

export const highlightText = (text: string, searchTerm: string): { __html: string } => {
  if (!searchTerm.trim()) {
    return { __html: DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }) };
  }
  
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(`^${escaped}$`, 'i');
  const parts = text.split(splitRegex);
  
  const html = parts
    .map((part) => 
      matchRegex.test(part) 
        ? `<mark class="bg-yellow-200 px-0.5 rounded">${DOMPurify.sanitize(part)}</mark>` 
        : DOMPurify.sanitize(part)
    )
    .join('');
    
  return { __html: html };
};
