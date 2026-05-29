import { Redis } from '@upstash/redis';

// The Vercel "Upstash for Redis" integration may name the injected vars
// with a custom prefix (e.g. STORAGE_*, KV_*) instead of the plain
// UPSTASH_REDIS_* names that Redis.fromEnv() expects. Resolve from any of
// the common schemes so the store works regardless of the chosen prefix.
function pickEnv(suffix: 'URL' | 'TOKEN'): string | undefined {
  const env = process.env;
  const candidates =
    suffix === 'URL'
      ? [
          'UPSTASH_REDIS_REST_URL',
          'KV_REST_API_URL',
          'STORAGE_REST_API_URL',
          'STORAGE_KV_REST_API_URL',
          'REDIS_REST_API_URL',
        ]
      : [
          'UPSTASH_REDIS_REST_TOKEN',
          'KV_REST_API_TOKEN',
          'STORAGE_REST_API_TOKEN',
          'STORAGE_KV_REST_API_TOKEN',
          'REDIS_REST_API_TOKEN',
        ];

  for (const name of candidates) {
    if (env[name]) return env[name];
  }

  // Fallback: any var that ends in the expected REST suffix (covers an
  // arbitrary custom prefix like MYPREFIX_UPSTASH_REDIS_REST_URL).
  const tail = suffix === 'URL' ? 'REST_URL' : 'REST_TOKEN';
  for (const [name, value] of Object.entries(env)) {
    if (value && name.endsWith(tail) && name.toUpperCase().includes('REDIS')) {
      return value;
    }
  }
  return undefined;
}

const url = pickEnv('URL');
const token = pickEnv('TOKEN');

if (!url || !token) {
  // Surfaced at request time by /go and /stats rather than crashing the build.
  console.error(
    'Redis env vars not found. Expected UPSTASH_REDIS_REST_URL/TOKEN ' +
      '(or the prefixed equivalents created by the Vercel Upstash integration).',
  );
}

export const redis = new Redis({ url: url ?? '', token: token ?? '' });

// Keys
export const TOTAL_KEY = 'scans:total';
export const LIST_KEY = 'scans:list';

// Keep the most recent N events in the capped list.
export const LIST_CAP = 5000;

export type ScanEvent = {
  ts: number; // epoch ms
  ip: string;
  country: string;
  city: string;
  region: string;
  ua: string;
  referrer: string;
};
