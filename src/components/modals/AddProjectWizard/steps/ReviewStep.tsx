import { useFormContext } from 'react-hook-form';
import { useAppStore } from '@/store/appStore';
import { getCategoryLabel } from '@/utils/categories';
import { getCountryName } from '@/utils/countries';
import type { WizardFormData } from '../wizardTypes';

export const ReviewStep = () => {
  const { getValues } = useFormContext<WizardFormData>();
  const experts = useAppStore(s => s.data.experts);
  const data = getValues();

  const selectedExperts = experts.filter(e => data.expertIds?.includes(e.id));
  const countryNames = (data.countries ?? []).map(getCountryName).filter(Boolean);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Project Details</h3>

      <div className="space-y-3">
        {/* Basics */}
        <Section label="Basic Information">
          <Row label="Name" value={data.name} />
          <Row label="Status" value={data.status} />
          <Row label="Field" value={getCategoryLabel(data.field)} />
          <Row label="Description" value={data.description} />
        </Section>

        {/* Experts */}
        <Section label="Experts">
          {selectedExperts.length > 0 ? (
            selectedExperts.map(e => (
              <Row key={e.id} label={e.name} value={e.institution} />
            ))
          ) : (
            <p className="text-sm text-text-muted italic">No experts selected</p>
          )}
        </Section>

        {/* Location */}
        <Section label="Location">
          <Row label="Location" value={data.location} />
          {data.areaCoords && (
            <Row label="Area" value={`${data.areaCoords.length} polygon points`} />
          )}
        </Section>

        {/* Details */}
        <Section label="Additional Details">
          <Row label="Year Range" value={data.yearRange} />
          <Row label="Countries" value={countryNames.join(', ') || 'None'} />
        </Section>
      </div>
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border border-[var(--color-soft-border)] rounded p-3">
    <h4 className="text-sm font-semibold text-text-muted mb-2">{label}</h4>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between gap-2 text-sm">
    <span className="font-medium text-text-muted">{label}</span>
    <span className="text-right max-w-[60%] truncate">{value || '—'}</span>
  </div>
);
