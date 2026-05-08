export const SkeletonCard = ({ type = 'project' }: { type?: 'project' | 'expert' }) => (
  <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-white border border-surface-muted animate-pulse" aria-hidden="true" role="presentation">
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-12 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      {type === 'project' ? (
        <>
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-5/6" />
        </>
      ) : (
        <>
          <div className="h-8 bg-gray-200 rounded-full w-8 ml-auto -mt-16 border-4 border-white" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </>
      )}
    </div>
    <div className="border-t border-surface-muted bg-gray-50 h-12" />
  </div>
);
