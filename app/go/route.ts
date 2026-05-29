import { NextRequest, NextResponse } from 'next/server';
import { redis, TOTAL_KEY, LIST_KEY, LIST_CAP, type ScanEvent } from '@/lib/redis';

// Always run at request time — never cache a tracking endpoint.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const destination = process.env.DESTINATION_URL;
  if (!destination) {
    return new NextResponse(
      'Misconfigured: DESTINATION_URL env var is not set.',
      { status: 500 },
    );
  }

  const h = req.headers;
  const event: ScanEvent = {
    ts: Date.now(),
    ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim(),
    country: h.get('x-vercel-ip-country') ?? '',
    city: decodeGeo(h.get('x-vercel-ip-city')),
    region: h.get('x-vercel-ip-country-region') ?? '',
    ua: h.get('user-agent') ?? '',
    referrer: h.get('referer') ?? '',
  };

  // Best-effort logging — never block (or fail) the redirect on a write error.
  try {
    await Promise.all([
      redis.incr(TOTAL_KEY),
      redis
        .lpush(LIST_KEY, JSON.stringify(event))
        .then(() => redis.ltrim(LIST_KEY, 0, LIST_CAP - 1)),
    ]);
  } catch (err) {
    console.error('Failed to log scan', err);
  }

  return NextResponse.redirect(destination, 302);
}

// Vercel URL-encodes the city header (e.g. "San%20Francisco").
function decodeGeo(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
