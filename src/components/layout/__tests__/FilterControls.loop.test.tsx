import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEffect, useState } from 'react';

describe('FilterControls loop prevention', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('Effect 1 should not fire when searchTerm changes without debouncedSearch change', () => {
    const effect1FireCount = vi.fn();
    const setSearchTerm = vi.fn();

    function TestComponent({ debouncedSearch, searchTerm }: { debouncedSearch: string; searchTerm: string }) {
      useEffect(() => {
        effect1FireCount();
        if (debouncedSearch === searchTerm) return;
        setSearchTerm(debouncedSearch);
      }, [debouncedSearch, setSearchTerm]); // NOTE: searchTerm intentionally NOT in deps
      return null;
    }

    // Initial render: both empty
    const { rerender } = renderHook(
      (props: { debouncedSearch: string; searchTerm: string }) => TestComponent(props),
      { initialProps: { debouncedSearch: '', searchTerm: '' } }
    );
    expect(effect1FireCount).toHaveBeenCalledTimes(1);
    effect1FireCount.mockClear();

    // Simulate external store update (searchTerm changes from another instance)
    rerender({ debouncedSearch: '', searchTerm: 'River' });
    expect(effect1FireCount).toHaveBeenCalledTimes(0); // deps unchanged → no re-fire
    expect(setSearchTerm).not.toHaveBeenCalled(); // no reset!

    // Simulate debounce firing (debouncedSearch catches up)
    rerender({ debouncedSearch: 'River', searchTerm: 'River' });
    expect(effect1FireCount).toHaveBeenCalledTimes(1);
    expect(setSearchTerm).not.toHaveBeenCalled(); // guard catches: equal values
  });

  it('original bug: effect fires when searchTerm changes, even with stale debouncedSearch', () => {
    const setSearchTerm = vi.fn();

    function BuggyComponent({ debouncedSearch, searchTerm }: { debouncedSearch: string; searchTerm: string }) {
      useEffect(() => {
        if (debouncedSearch === searchTerm) return;
        setSearchTerm(debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [debouncedSearch, searchTerm, setSearchTerm]); // searchTerm IS in deps (BUG)
      return null;
    }

    const { rerender } = renderHook(
      (props: { debouncedSearch: string; searchTerm: string }) => BuggyComponent(props),
      { initialProps: { debouncedSearch: '', searchTerm: '' } }
    );
    setSearchTerm.mockClear();

    // External store update while debouncedSearch is stale
    rerender({ debouncedSearch: '', searchTerm: 'River' });
    // Effect fires because searchTerm changed
    expect(setSearchTerm).toHaveBeenCalledWith(''); // ← BUG: resets to ''!
  });

  it('two FilterControls instances do not ping-pong', () => {
    const setSearchTerm = vi.fn();


    function InstanceA({ debouncedSearch, searchTerm }: { debouncedSearch: string; searchTerm: string }) {
      useEffect(() => {
        if (debouncedSearch === searchTerm) return;
        setSearchTerm(debouncedSearch);
      }, [debouncedSearch, setSearchTerm]);
      return null;
    }

    function InstanceB({ debouncedSearch, searchTerm }: { debouncedSearch: string; searchTerm: string }) {
      // Effect 2: sync store → local (when external change)
      const [localSearch, setLocalSearch] = useState(searchTerm);
      useEffect(() => {
        if (localSearch === searchTerm) return;
        setLocalSearch(searchTerm);
      }, [searchTerm]);

      // Effect 1: sync local → store (debounced)
      useEffect(() => {
        if (debouncedSearch === searchTerm) return;
        setSearchTerm(debouncedSearch);
      }, [debouncedSearch, setSearchTerm]);
      return null;
    }

    // Simulate: Instance A types 'River', store hasn't updated yet
    const { rerender: rerenderA } = renderHook(
      (p: { d: string; s: string }) => InstanceA({ debouncedSearch: p.d, searchTerm: p.s }),
      { initialProps: { d: '', s: '' } }
    );
    const { rerender: rerenderB } = renderHook(
      (p: { d: string; s: string }) => InstanceB({ debouncedSearch: p.d, searchTerm: p.s }),
      { initialProps: { d: '', s: '' } }
    );
    setSearchTerm.mockClear();

    // Instance A's debounce fires: debouncedSearch='River', searchTerm=''
    rerenderA({ d: 'River', s: '' });
    // Effect 1 fires → setSearchTerm('River')
    expect(setSearchTerm).toHaveBeenCalledWith('River');
    setSearchTerm.mockClear();

    // Store updated both instances with searchTerm='River'
    // Instance A: debouncedSearch='River', searchTerm='River'
    rerenderA({ d: 'River', s: 'River' });
    // Instance B: debouncedSearch='' (stale!), searchTerm='River'
    rerenderB({ d: '', s: 'River' });

    // Instance B's Effect 2 should fire (sync to local)
    // Instance B's Effect 1 should NOT fire (debouncedSearch unchanged)
    expect(setSearchTerm).not.toHaveBeenCalled(); // no reset!

    // Instance B's debounce eventually fires
    rerenderB({ d: 'River', s: 'River' });
    expect(setSearchTerm).not.toHaveBeenCalled(); // guard catches: equal
  });
});
