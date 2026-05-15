export const makeSurfaceFlipHandler = (toggle: () => void) => {
  return (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"], [data-no-card-flip="true"]')) {
      return;
    }
    toggle();
  };
};

export const extractFirstSentence = (text: string, maxLength: number): string => {
  const normalized = text.trim();
  const firstSentence = normalized.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }
  return normalized.slice(0, maxLength).trimEnd() + (normalized.length > maxLength ? '...' : '');
};
