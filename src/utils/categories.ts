export type CategoryId =
  | 'biodiversity'
  | 'spatial-planning'
  | 'water'
  | 'agriculture'
  | 'forests'
  | 'tourism'
  | 'cultural-heritage'
  | 'industry-infrastructure'
  | 'awareness-education'
  | 'climate-change';

export type CategoryOption = {
  id: CategoryId;
  label: string;
  sortOrder: number;
};

export const CANONICAL_CATEGORIES: CategoryOption[] = [
  { id: 'biodiversity', label: 'Biodiversity', sortOrder: 10 },
  { id: 'spatial-planning', label: 'Spatial Planning', sortOrder: 20 },
  { id: 'water', label: 'Water', sortOrder: 30 },
  { id: 'agriculture', label: 'Agriculture', sortOrder: 40 },
  { id: 'forests', label: 'Forests', sortOrder: 50 },
  { id: 'tourism', label: 'Tourism', sortOrder: 60 },
  { id: 'cultural-heritage', label: 'Cultural Heritage', sortOrder: 70 },
  { id: 'industry-infrastructure', label: 'Industry & Infrastructure', sortOrder: 80 },
  { id: 'awareness-education', label: 'Awareness & Education', sortOrder: 90 },
  { id: 'climate-change', label: 'Climate Change', sortOrder: 100 },
];

const CATEGORY_BY_ID = new Map(CANONICAL_CATEGORIES.map((category) => [category.id, category]));
const CATEGORY_BY_LABEL = new Map(
  CANONICAL_CATEGORIES.map((category) => [category.label.toLowerCase(), category.id]),
);

const CATEGORY_ALIASES: Record<string, CategoryId> = {
  bio: 'biodiversity',
  wildlife: 'biodiversity',
  ecology: 'biodiversity',
  hydrology: 'water',
  wather: 'water',
  forest: 'forests',
  forestry: 'forests',
  agreculture: 'agriculture',
  'spatial development': 'spatial-planning',
  'spatial planning': 'spatial-planning',
  'cultural heritage & traditional knowledge': 'cultural-heritage',
  'traditional knowledge': 'cultural-heritage',
  'industry & energy': 'industry-infrastructure',
  'industry, energy, transport & infrastructure': 'industry-infrastructure',
  'industry energy transport infrastructure': 'industry-infrastructure',
  infrastructure: 'industry-infrastructure',
  'education & awareness': 'awareness-education',
  'awareness & education': 'awareness-education',
  education: 'awareness-education',
  climate: 'climate-change',
  air: 'climate-change',
};

const normalizeLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[,_]+/g, ' ')
    .replace(/\s+/g, ' ');

export const normalizeCategoryId = (value: string | null | undefined): CategoryId | undefined => {
  if (!value) return undefined;

  const key = normalizeLookupKey(value);
  if (CATEGORY_BY_ID.has(key as CategoryId)) return key as CategoryId;
  return CATEGORY_BY_LABEL.get(key) ?? CATEGORY_ALIASES[key];
};

export const getCategoryLabel = (value: string | null | undefined, fallback = 'Biodiversity') => {
  const categoryId = normalizeCategoryId(value);
  return categoryId ? CATEGORY_BY_ID.get(categoryId)?.label ?? fallback : fallback;
};

export const getCategoryOptions = () => [...CANONICAL_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
