import { Redis } from '@upstash/redis';

// Auto-populated by the Vercel "Upstash for Redis" integration.
export const redis = Redis.fromEnv();

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
