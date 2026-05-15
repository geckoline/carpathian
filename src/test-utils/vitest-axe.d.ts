import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  interface Assertion<Type = never> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
