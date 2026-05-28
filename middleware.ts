import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const expected = process.env.STATS_TOKEN;
  if (!expected) {
    return new NextResponse(
      'Misconfigured: STATS_TOKEN env var is not set.',
      { status: 500 },
    );
  }

  // Accept either ?token=... or a "stats_token" cookie (set on first valid visit)
  const tokenFromQuery = req.nextUrl.searchParams.get('token');
  const tokenFromCookie = req.cookies.get('stats_token')?.value;
  const provided = tokenFromQuery ?? tokenFromCookie;

  if (provided !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // If query param was used, set cookie so refreshes work
  const res = NextResponse.next();
  if (tokenFromQuery && tokenFromQuery === expected) {
    res.cookies.set('stats_token', expected, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/stats',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ['/stats/:path*'],
};
