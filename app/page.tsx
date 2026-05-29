export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>QR Tracker</h1>
      <p style={{ color: '#9aa3b2', lineHeight: 1.6 }}>
        Point your QR code at <code>/go</code>. Each scan is logged and then
        redirected to the destination. View the dashboard at{' '}
        <code>/stats?token=…</code>.
      </p>
    </main>
  );
}
