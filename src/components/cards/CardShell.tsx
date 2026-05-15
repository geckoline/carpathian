import { useCallback, type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { useAppStore } from '@/store/appStore';
import { useCardFlip } from '@/hooks/useCardFlip';
import { useCardShare } from '@/hooks/useCardShare';
import { makeSurfaceFlipHandler } from '@/utils/cardInteraction';
import type { DatasetMode } from '@/store/appStore';

export type CardShellContext = {
  isFlipped: boolean;
  isFlipping: boolean;
  toggle: () => void;
  handleCopy: (e: MouseEvent | KeyboardEvent) => void;
  copied: boolean;
};

type CardShellProps = {
  id: string;
  cardType: 'project' | 'expert';
  dataset?: DatasetMode;
  isSelected?: boolean;
  front: (ctx: CardShellContext) => ReactNode;
  back: (ctx: CardShellContext) => ReactNode;
};

export const CardShell = ({ id, cardType, dataset: datasetProp, isSelected, front, back }: CardShellProps) => {
  const storeDataset = useAppStore((s) => s.dataset);
  const dataset = datasetProp ?? storeDataset;
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const { copy: handleCopy, copied } = useCardShare({ kind: cardType, id, dataset });
  const reducedMotion = useAppStore((s) => s.a11y.reducedMotion);

  const handleSurfaceFlip = useCallback(makeSurfaceFlipHandler(toggle), [toggle]);
  const handleFlipKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      toggle();
    }
  }, [toggle]);

  const prefix = cardType;
  const ctx: CardShellContext = { isFlipped, isFlipping, toggle, handleCopy, copied };

  return (
    <article
      className={`card-interactive-shell card-auto-height-shell ${prefix}-card-shell relative w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-soft-border)] shadow-[var(--shadow-card)] motion-reduce:transition-none ${
        reducedMotion
          ? 'hover:shadow-[var(--shadow-card)]'
          : 'transition-all duration-200 [perspective:1600px] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1'
      } ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''} focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2`}
      id={`${prefix}-card-${id}`}
      data-testid={`${prefix}-card-${isFlipped ? 'back' : 'front'}`}
      aria-labelledby={`${prefix}-card-title-${id}`}
    >
      <div
        data-testid={`${prefix}-card-stage`}
        className={`card-flip-stage relative motion-reduce:transition-none ${reducedMotion ? '' : 'transition-transform duration-600'} ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <section
          data-testid={`${prefix}-face-front`}
          aria-hidden={isFlipped}
          className={`card-face card ${prefix}-front ${isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
          onKeyDown={handleFlipKeyDown}
          tabIndex={0}
        >
          {front(ctx)}
        </section>

        <section
          data-testid={`${prefix}-face-back`}
          aria-hidden={!isFlipped}
          className={`card-face card card-face-back ${prefix}-back ${prefix}-card-backdrop ${!isFlipped ? 'pointer-events-none' : ''}`}
          onClick={handleSurfaceFlip}
          onKeyDown={handleFlipKeyDown}
          tabIndex={0}
        >
          {back(ctx)}
        </section>
      </div>
    </article>
  );
};

export default CardShell;
