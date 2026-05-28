# QR Tracker

A tiny Next.js app for Vercel that gives you:

- **`/go`** — public URL to point your QR code at. Logs each scan, then 302s to your destination.
- **`/stats?token=...`** — password-protected dashboard with total count, hourly chart, country breakdown, recent scans.

Backed by [Upstash Redis](https://upstash.com/) (free tier is plenty for a fair event).

---

## Deploy in ~5 minutes

### 1. Push to GitHub

```bash
cd qr-tracker
git init
git add .
git commit -m "Initial QR tracker"
# create a new GitHub repo, then:
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel

- Go to [vercel.com/new](https://vercel.com/new)
- Import the GitHub repo
- Leave all build settings on default (Next.js is auto-detected)
- Click **Deploy**

### 3. Add Upstash Redis

In your Vercel project dashboard:

- Open the **Storage** tab → **Create Database** → choose **Upstash for Redis**
- Pick the free plan, any region close to your users
- Click **Connect** — this auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into your project

### 4. Set the two env vars

In **Settings → Environment Variables**, add:

| Name              | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| `DESTINATION_URL` | The URL of your bank-vs-GMEBIZ comparison page         |
| `STATS_TOKEN`     | A long random string (used to access the dashboard)    |

Then go to **Deployments** and click **Redeploy** on the latest deployment to pick up the new env vars.

### 5. You're done

- **Put this in your QR code:** `https://<your-project>.vercel.app/go`
- **View stats at:** `https://<your-project>.vercel.app/stats?token=<your-STATS_TOKEN>`
  - The token gets saved in a cookie after first visit, so future loads of `/stats` work without the query param.

Generate the actual QR image with any free generator (e.g. [qr-code-generator.com](https://www.qr-code-generator.com/), or `qrencode` on the CLI).

---

## Local development

```bash
npm install
cp .env.example .env.local
# fill in DESTINATION_URL, STATS_TOKEN, and Upstash creds
npm run dev
```

Visit `http://localhost:3000/go` and `http://localhost:3000/stats?token=...`.

## What gets logged

Each scan records:

- Timestamp
- IP (from `x-forwarded-for`)
- Country / city / region (from Vercel's geo headers — free, no extra setup)
- User agent
- Referrer (usually empty for QR scans)

Stored as a capped list in Redis (keeps last 5000 events). A running total counter is incremented separately, so the **Total Scans** card stays accurate even after the list cap is reached.

## Customization ideas

- **Want CSV export?** Add a `/stats/export` route that reads the same list and returns `text/csv`.
- **Want per-day breakdown beyond 24h?** Change the bucketing logic in `app/stats/page.tsx`.
- **Want multiple QR codes tracked separately?** Make `/go` accept a `?id=` param and key the Redis writes by that ID (e.g. `scans:total:fair2026`).
