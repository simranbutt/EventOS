# EventOS

Production-style event management app built with React + Vite + Tailwind and Supabase.

## Features

- Signup/Login/Logout with persisted sessions
- Role-based protected routing (`user` vs `admin`)
- User dashboard with search and filters (city, category, date)
- Upcoming, trending, recommended event sections
- Event details page with:
  - register/buy ticket
  - save/unsave event
  - ticket UI + print/download
  - map link
- Saved events page
- Nearby events (browser geolocation + Haversine + 20km)
- Organizer request flow (`pending`, `approved`, `rejected`)
- Main admin request approvals (single email)
- Admin dashboard:
  - add/edit/delete events
  - view my events + seat counts
  - view registrations per event

## Tech Stack

- React + TypeScript + Vite
- React Router
- Tailwind CSS
- Supabase Auth + Postgres (RLS)

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create env file

Copy `.env.example` to `.env` and configure:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAIN_ADMIN_EMAIL=mainadmin@example.com
```

3. Setup database

- Open Supabase SQL editor
- Run `supabase-schema.sql`
- In that file, update `public.is_main_admin()` email to match your real main admin email

4. Start app

```bash
npm run dev
```

## Important Notes

- User profiles are auto-created from Auth users via trigger.
- Duplicate event registrations are blocked by `unique(user_id, event_id)`.
- Duplicate pending organizer requests are blocked by a partial unique index.
- UI restricts Admin Requests page to main admin email.
