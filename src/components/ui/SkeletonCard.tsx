export const SkeletonCard = ({ type = 'project' }: { type?: 'project' | 'expert' }) => (
  <div className="relative w-full rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-soft-border)] bg-[var(--color-panel-surface)] animate-pulse" aria-hidden="true" role="presentation">
    <div className="h-12 w-full bg-[var(--color-panel-surface-soft)]" />
    <div className="p-4 space-y-3">
      <div className="h-4 rounded-full w-3/4 bg-[var(--color-panel-surface-soft)]" />
      <div className="h-4 rounded-full w-1/2 bg-[var(--color-panel-surface-soft)]" />
      {type === 'project' ? (
        <>
          <div className="h-3 rounded-full w-full bg-[var(--color-soft-border)]" />
          <div className="h-3 rounded-full w-5/6 bg-[var(--color-soft-border)]" />
        </>
      ) : (
        <>
          <div className="h-8 rounded-full w-8 ml-auto -mt-16 border-4 border-[var(--color-panel-surface)] bg-[var(--color-panel-surface-soft)]" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="h-10 rounded-[var(--radius-panel)] bg-[var(--color-soft-border)]" />
            <div className="h-10 rounded-[var(--radius-panel)] bg-[var(--color-soft-border)]" />
          </div>
        </>
      )}
    </div>
    <div className="border-t border-[var(--color-soft-border)] bg-[var(--color-panel-surface-soft)] h-12" />
  </div>
);
