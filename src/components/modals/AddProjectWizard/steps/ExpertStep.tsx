import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAppStore } from '@/store/appStore';
import type { WizardFormData } from '../wizardTypes';
import type { ExpertFormData, ExpertData } from '@/types/expert';

const AddExpertModal = lazy(() => import('@/components/modals/AddExpertModal'));

export const ExpertStep = () => {
  const { setValue, watch, formState: { errors } } = useFormContext<WizardFormData>();
  const experts = useAppStore(s => s.data.experts);
  const addExpert = useAppStore(s => s.addExpert);
  const expertIds = watch('expertIds');

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddExpertModal, setShowAddExpertModal] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return experts;
    const q = searchQuery.toLowerCase();
    return experts.filter(
      e => e.name.toLowerCase().includes(q) || e.institution.toLowerCase().includes(q)
    );
  }, [experts, searchQuery]);

  const toggleExpert = useCallback((id: string) => {
    const current = expertIds ?? [];
    setValue('expertIds', current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id],
      { shouldDirty: true }
    );
  }, [expertIds, setValue]);

  const handleAddExpertSubmit = useCallback(async (data: ExpertFormData): Promise<ExpertData | void> => {
    const id = crypto.randomUUID();
    const expert: Partial<ExpertData> = {
      id,
      name: data.name,
      institution: data.institution,
      countries: data.countries,
      degree: data.degree,
      headline: data.headline,
      expertiseSubtitle: data.expertiseSubtitle,
      bio: data.bio,
      expertise: data.expertise,
      email: data.email,
      linkedin: data.linkedin,
      scopus: data.scopus,
      orcid: data.orcid,
      googleScholar: data.googleScholar,
      publications: data.publications,
    };
    addExpert(expert);
    setValue('expertIds', [...(expertIds ?? []), id], { shouldDirty: true });
    setShowAddExpertModal(false);
    return expert as ExpertData;
  }, [addExpert, setValue, expertIds]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Experts</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Select Experts *</label>

        <input
          type="text"
          placeholder="Search experts by name or institution..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--color-soft-border)] rounded mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <div className="space-y-1 max-h-48 overflow-y-auto border border-[var(--color-soft-border)] rounded p-2 mb-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-text-muted p-2">
              {searchQuery ? 'No experts match your search.' : 'No experts yet. Add one below.'}
            </p>
          ) : (
            filtered.map((expert) => {
              const isSelected = expertIds?.includes(expert.id) ?? false;
              return (
                <label
                  key={expert.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors text-sm ${
                    isSelected ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleExpert(expert.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expert.name}</p>
                    <p className="text-xs text-text-muted truncate">{expert.institution}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {errors.expertIds && <p className="text-xs text-red-600 mt-1">{errors.expertIds.message}</p>}
      </div>

      <div className="border-t pt-3">
        <button
          type="button"
          onClick={() => setShowAddExpertModal(true)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
        >
          + Add new expert
        </button>
      </div>

      {showAddExpertModal && (
        <Suspense fallback={null}>
          <AddExpertModal
            isOpen={showAddExpertModal}
            onClose={() => setShowAddExpertModal(false)}
            onSubmit={handleAddExpertSubmit}
          />
        </Suspense>
      )}
    </div>
  );
};
