# World Cup Pool 2026

Private FIFA World Cup prediction pool for ~30 participants. Built with Next.js and Supabase.

## Features

- Sign up with first name, last name, and password; log in on any device
- Group stage drag-and-drop ranking for all 12 groups
- Knockout bracket picks with tiebreaker
- Server-enforced deadlines and locks
- Admin panel for standings, bracket, results, and deadlines
- Leaderboard with scoring and tiebreaker resolution

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) and [`supabase/migrations/002_auth.sql`](supabase/migrations/002_auth.sql) in the SQL Editor.

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SECRET=
SESSION_SECRET=
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push the project to GitHub.
2. Import the repo in Vercel (root directory: `world cup pool`).
3. Add the same environment variables in Vercel project settings.
4. Deploy.

## Admin

Visit `/admin` and enter the `ADMIN_SECRET` value. From there you can:

- Set deadlines and force lock/unlock stages
- Enter final group standings for scoring
- Build and publish the knockout bracket (31 matches)
- Record match winners and total knockout goals for tiebreakers

## Scoring

| Stage | Max points |
|-------|------------|
| Group (12 × 10) | 120 |
| Knockout (31 matches) | 100 |
| **Total** | **220** |

Group: 3/3/2/2 for correct 1st/2nd/3rd/4th.

Knockout: Ro32=2, Ro16=3, QF=5, SF=7, Final=10 per correct pick.

## Default deadline

Group stage locks **June 11, 2026 at 3:00 PM ET** (`2026-06-11T19:00:00Z`).
