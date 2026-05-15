import { useRef, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedCardGridProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateHeight?: number;
  overscan?: number;
  minVirtualizeCount?: number;
}

const getColumnCount = (width: number) => {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
};

export const VirtualizedCardGrid = <T extends { id: string }>({
  items,
  renderItem,
  estimateHeight = 560,
  overscan = 3,
  minVirtualizeCount = 50,
}: VirtualizedCardGridProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setColumns(getColumnCount(entry.contentRect.width));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length < minVirtualizeCount) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              {renderItem(item, i)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  const rows = useMemo(() => {
    const result: { items: typeof items; startIndex: number }[] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push({ items: items.slice(i, i + columns), startIndex: i });
    }
    return result;
  }, [items, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateHeight,
    overscan,
  });

  const gridClass = columns === 3
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    : columns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1';

  return (
    <div ref={containerRef} style={{ overflow: 'auto', maxHeight: '80vh' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]!;
          const { items: rowItems, startIndex } = row;
          return (
            <motion.div
              key={virtualRow.index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`grid gap-4 sm:gap-6 ${gridClass}`}
            >
              {rowItems.map((item: T, colIndex: number) => renderItem(item, startIndex + colIndex))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
