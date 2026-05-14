import { useMemo } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { DatasetMode } from '@/store/appStore';
import { buildCardShareUrl, type ShareCardKind } from '@/utils/cardShare';

const copyWithLegacySelection = (text: string) => {
  if (typeof document.execCommand !== 'function') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};

const copyShareUrl = async (url: string) => {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API is unavailable');
    }

    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return copyWithLegacySelection(url);
  }
};

type UseCardShareOptions = {
  kind: ShareCardKind;
  id: string;
  dataset: DatasetMode;
};

export const useCardShare = ({ kind, id, dataset }: UseCardShareOptions) => {
  const shareUrl = useMemo(() => buildCardShareUrl({ kind, id, dataset }), [dataset, id, kind]);

  const copy = async (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    await copyShareUrl(shareUrl);
  };

  return { copy, shareUrl };
};
