import type { ExpertFormData } from './expert';

export type DatasetMode = 'cs' | 'all';
export type ThemeMode = 'light' | 'dark' | 'reduced';
export type SortKey = 'name' | 'status' | 'field' | 'yearRange';
export type SortDirection = 'asc' | 'desc';

export type FilterState = {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'past' | 'planned';
  fieldFilter: string;
  countryFilter: string;
  activeTab: 'projects' | 'experts';
  sortKey: SortKey;
  sortDirection: SortDirection;
};

export type A11yState = {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
};

export type ExpertImportDialog = {
  isOpen: boolean;
  importedData: Partial<ExpertFormData> | null;
  existingData: Partial<ExpertFormData> | null;
};
