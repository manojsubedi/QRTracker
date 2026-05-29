import { redis, TOTAL_KEY, LIST_KEY, type ScanEvent } from '@/lib/redis';

// Always read fresh data.
export const dynamic = 'force-dynamic';

function parseEvent(raw: unknown): ScanEvent | null {
  // @upstash/redis auto-parses JSON, so items may already be objects.
  if (raw && typeof raw === 'object') return raw as ScanEvent;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ScanEvent;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function Stats() {
  const [total, rawList] = await Promise.all([
    redis.get<number>(TOTAL_KEY),
    redis.lrange(LIST_KEY, 0, -1),
  ]);

  const events = (rawList as unknown[])
    .map(parseEvent)
    .filter((e): e is ScanEvent => e !== null);

  // --- Hourly chart: last 24 hours ---
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const buckets = new Array(24).fill(0);
  for (const e of events) {
    const ageHours = Math.floor((now - e.ts) / hourMs);
    if (ageHours >= 0 && ageHours < 24) {
      // bucket[0] = oldest hour, bucket[23] = current hour
      buckets[23 - ageHours]++;
    }
  }
  const maxBucket = Math.max(1, ...buckets);

  // --- Country breakdown ---
  const byCountry = new Map<string, number>();
  for (const e of events) {
    const key = e.country || 'Unknown';
    byCountry.set(key, (byCountry.get(key) ?? 0) + 1);
  }
  const countries = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);

  const recent = events.slice(0, 50);

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>QR Scan Stats</h1>

      <section style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <Card label="Total Scans" value={(total ?? 0).toLocaleString()} />
        <Card label="Last 24h" value={buckets.reduce((a, b) => a + b, 0).toLocaleString()} />
        <Card label="Stored Events" value={events.length.toLocaleString()} />
      </section>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Scans by hour (last 24h)</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 140,
          marginBottom: 32,
          padding: '0 4px',
        }}
      >
        {buckets.map((count, i) => (
          <div
            key={i}
            title={`${count} scan(s)`}
            style={{
              flex: 1,
              height: `${(count / maxBucket) * 100}%`,
              minHeight: count > 0 ? 4 : 1,
              background: count > 0 ? '#4f8cff' : '#1c2130',
              borderRadius: 3,
            }}
          />
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Countries</h2>
      {countries.length === 0 ? (
        <p style={{ color: '#9aa3b2' }}>No data yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {countries.map(([country, count]) => (
            <li
              key={country}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #1c2130',
              }}
            >
              <span>{country}</span>
              <span style={{ color: '#9aa3b2' }}>{count}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Recent scans</h2>
      {recent.length === 0 ? (
        <p style={{ color: '#9aa3b2' }}>No scans recorded yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#9aa3b2' }}>
                <th style={th}>Time</th>
                <th style={th}>Country</th>
                <th style={th}>City</th>
                <th style={th}>IP</th>
                <th style={th}>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e, i) => (
                <tr key={i}>
                  <td style={td}>{new Date(e.ts).toISOString().replace('T', ' ').slice(0, 19)}</td>
                  <td style={td}>{e.country || '—'}</td>
                  <td style={td}>{e.city || '—'}</td>
                  <td style={td}>{e.ip || '—'}</td>
                  <td style={{ ...td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.ua || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#11151f',
        border: '1px solid #1c2130',
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div style={{ color: '#9aa3b2', fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #1c2130',
  fontWeight: 500,
};
const td: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #1c2130',
};
