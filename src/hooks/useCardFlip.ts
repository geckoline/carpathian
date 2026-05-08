// src/hooks/useCardFlip.ts
import { useState, useCallback, useRef, useEffect } from 'react';

export type UseCardFlipOptions = {
  durationMs?: number;
  onFlip?: (isFlipped: boolean) => void;
};

export const useCardFlip = ({ durationMs = 600, onFlip }: UseCardFlipOptions = {}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isFlippingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFlippingRef.current) return;
    
    setIsFlipped((prev) => {
      const next = !prev;
      onFlip?.(next);
      return next;
    });
    
    setIsFlipping(true);
    isFlippingRef.current = true;
    
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setIsFlipping(false);
      isFlippingRef.current = false;
      timerRef.current = null;
    }, durationMs);
  }, [durationMs, onFlip, clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { 
    isFlipped, 
    isFlipping, 
    flip: toggle,
    toggle, 
    clear: clearTimer 
  };
};

export default useCardFlip;
