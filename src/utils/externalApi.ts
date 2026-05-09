/**
 * Rate-limited external API client for enriching expert profiles.
 * Uses Bottleneck to enforce 1 req/sec and a 5-second timeout.
 */

import Bottleneck from 'bottleneck';

const TIMEOUT_MS = 5000;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
  timeout: TIMEOUT_MS,
});

async function safeFetch(url: string, init?: RequestInit) {
  return limiter.schedule(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function fetchExpertMetadata(query: string) {
  try {
    const data = await safeFetch(
      `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(query)}&rows=1`
    );
    return { source: 'orcid', data };
  } catch (err) {
    console.debug('[API Fallback] ORCID failed:', err);
  }

  try {
    const data = await safeFetch(
      `https://api.openalex.org/authors?search=${encodeURIComponent(query)}&per_page=1`
    );
    return { source: 'openalex', data };
  } catch (err) {
    console.debug('[API Fallback] OpenAlex failed:', err);
  }

  return null;
}
