# OhioismQuant VIP portal

Private Next.js course portal for OhioismQuant. Local only — do not deploy from this restore unless you choose to.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill the **original** Atlas values (do not invent new secrets):

```
AUTH_SECRET=
MONGODB_URI=
MONGODB_DB=ohioismquant
APP_URL=http://localhost:3000
NOWPAYMENTS_API_KEY=
NOWPAYMENTS_IPN_SECRET=
```

`MONGODB_DB` must stay `ohioismquant`. The app reads and writes the existing collections: `members`, `videos`, `orders`, `settings`.

3. Optional public files you can drop into `public/` yourself:

- `program-preview.mp4` (hero preview)
- GSC HTML verification file
- `ohioismquant-logo.png` if you still have the original logo (the app currently uses `ohioismquant-logo.svg`)

4. Install and run with **npm** (webpack on Windows):

```
npm install
npm run dev
```

Open `http://localhost:3000` and `/login`.

## Admin

Create or update a member (including the first admin) from the CLI:

```
npm run member -- you@email.com a-strong-password admin
```

Plans: `free | basic | pro | admin`. VIP is `basic`, `pro`, or `admin`.

## Product notes

- Cookie: httpOnly JWT `oq_session`, 14 days
- Pay: NOWPayments invoices only. IPN HMAC unlocks on `finished | confirmed | sending`
- Prices: Basic $499, Pro $999, Basic→Pro $499, Assist $49/hr (`https://t.me/ohioism1`)
- Pro-only lessons: 9, 21, 31, 32, 34, 35, 37, 43, 44, 46
- Source zips: Pro/admin only via `/api/source/[id]`
