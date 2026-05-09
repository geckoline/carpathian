import React from 'react';

export const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;

  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitRegex = new RegExp(`(${escaped})`, 'gi');
  const matchRegex = new RegExp(`^${escaped}$`, 'i');
  const parts = text.split(splitRegex);

  return parts.map((part, i) =>
    matchRegex.test(part)
      ? React.createElement('mark', { key: i, className: 'bg-yellow-200 px-0.5 rounded' }, part)
      : part
  );
};
