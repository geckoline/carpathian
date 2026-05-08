import { useMemo, useState } from 'react';
import { ProjectData } from '@/types/project';

export type SortKey = 'name' | 'status' | 'field' | 'yearRange';
export type SortDirection = 'asc' | 'desc';

export const useSorting = (projects: ProjectData[]) => {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [projects, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { sortedProjects, sortKey, sortDirection, setSortKey, setSortDirection, toggleSort };
};
