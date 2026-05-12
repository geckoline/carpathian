import { describe, expect, it, vi, afterEach } from 'vitest';

describe('supabase client bootstrap', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not throw during import when Supabase env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.resetModules();

    const module = await import('../supabase');

    expect(module.isSupabaseConfigured).toBe(false);
    expect(module.supabase).toBeNull();
    expect(() => module.getSupabaseClient()).toThrow(/Supabase is not configured/i);
  });
});
