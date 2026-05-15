import type { DatasetMode, FilterState } from '@/types/app';

export type ShareCardKind = 'project' | 'expert';

export type BuildCardShareUrlOptions = {
  kind: ShareCardKind;
  id: string;
  dataset: DatasetMode;
  origin?: string;
  pathname?: string;
};

export const getShareTab = (kind: ShareCardKind): FilterState['activeTab'] =>
  kind === 'project' ? 'projects' : 'experts';

export const getCardAnchorId = (kind: ShareCardKind, id: string) => `${kind}-card-${id}`;

export const buildCardShareUrl = ({
  kind,
  id,
  dataset,
  origin = window.location.origin,
  pathname = window.location.pathname || '/',
}: BuildCardShareUrlOptions) => {
  const url = new URL(pathname, origin);
  url.searchParams.set('dataset', dataset);
  url.searchParams.set('tab', getShareTab(kind));
  url.searchParams.set('card', kind);
  url.searchParams.set('id', id);
  url.hash = getCardAnchorId(kind, id);
  return url.toString();
};
