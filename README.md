# ShopNear

ShopNear is a hyperlocal shop discovery platform: it lets a customer search
for an everyday item — atta, milk, a phone charger — and see, in real time,
which nearby neighbourhood shops actually have it in stock, at what price,
and how fresh that availability information is, so trips to the shop stop
being a gamble.

## Project status: Phase 1 (foundation)

This repository currently contains the **foundation** only: the Postgres +
PostGIS schema, a deterministic demo-data seed, and a minimal Express API
with a single health-check endpoint. There is no customer, merchant, or
admin web/mobile client yet — those are later phases. What you can do today
is reset the database to a fully-seeded demo dataset and confirm the API can
reach it.

## Prerequisites

- **Node.js 22 or later** (`node --version`)
- **Docker** (Docker Desktop on Windows/macOS, or the Docker Engine on
  Linux), running, with `docker compose` available

## Setup

Run these commands in order from the repository root:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:reset
```

- `cp .env.example .env` creates your local environment file. Open it and
  set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true`. This flag
  authorises Prisma's destructive `migrate reset` — it must only ever be set
  against the local Docker dev database described below, **never** against
  a staging or production database.
- `docker compose up -d` starts a Postgres 16 + PostGIS 3.4 container
  (`shopnear-db`) on host port **5436**.
- `npm install` installs all workspace dependencies.
- `npm run db:reset` applies every migration and runs the seed script,
  producing the full demo dataset (see below). This is the one command that
  ties the whole foundation together — after it succeeds, Phase 1 is
  functionally complete.

### What you should see

`npm run db:reset` ends with a banner similar to:

```
────────────────────────────────────────────────────────
  ShopNear seeded in 18.1s
────────────────────────────────────────────────────────
  342 products · 14 shops · 1903 inventory rows · 120 orders

  DEMO ACCOUNTS
  Customer : 9000000001            OTP ....... 123456
  Merchant : 9000000010            password .. demo1234   (Shreeji Kirana, 80 m away)
  Merchant : 9000000011            password .. demo1234   (Patel General Store, 340 m away)
  Admin    : admin@shopnear.local  password .. admin1234
────────────────────────────────────────────────────────
```

The seed is deterministic: resetting twice in a row reproduces the same
data (same products, prices, shops, and availability states — timestamps
and generated ids intentionally shift, since they're wall-clock- and
database-relative).

## Demo accounts

| Role      | Identifier                | Credential          | Notes                              |
|-----------|---------------------------|----------------------|-------------------------------------|
| Customer  | `9000000001`               | OTP `123456`         | Default customer, at the map anchor |
| Merchant  | `9000000010`               | password `demo1234`  | Shreeji Kirana, 80 m away           |
| Merchant  | `9000000011`               | password `demo1234`  | Patel General Store, 340 m away     |
| Admin     | `admin@shopnear.local`     | password `admin1234` | Platform admin                      |

## Everyday commands

```bash
npm test          # run the full test suite (Vitest)
npm run dev       # start the API (http://localhost:4000) — the only client for now
npm run db:studio # open Prisma Studio (http://localhost:5555) to browse the data
npm run db:reset  # wipe and re-seed the local database
```

> **`npm test` truncates the seeded data.** Several test suites clean up
> their own fixtures against the same local Postgres database, so running
> `npm test` after `npm run db:reset` leaves the tables empty. If you want
> to inspect the demo dataset (e.g. in Prisma Studio) after running the
> tests, re-run `npm run db:reset` afterwards to get it back — an empty
> database at that point doesn't mean the seed is broken.

Once the API is running, `GET /health` reports API, database, and PostGIS
status:

```bash
curl http://localhost:4000/health
# {"status":"ok","database":"connected","postgis":"3.4.3","timestamp":"..."}
```

## Troubleshooting

**Docker isn't running / `docker compose up -d` fails to connect.**
Start Docker Desktop (or the Docker daemon) first, then re-run the command.
`docker ps` should list a running `shopnear-db` container before you
continue to `npm install` / `npm run db:reset`.

**Port 5436 is already in use on your machine.**
This project uses host port 5436 (instead of the Postgres default 5432, or
5433/5434/5435) specifically to avoid clashing with other local databases.
If 5436 is *also* taken on your machine, change it consistently in **both**
places:
1. `docker-compose.yml` — the host side of the `ports` mapping (`"5436:5432"`).
2. `.env` — the port in `DATABASE_URL`.

Then run `docker compose down && docker compose up -d` and re-run
`npm run db:reset`.

**`npm run db:reset` fails with a Prisma consent/guard error.**
Check that `.env` has `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION=true`.
This exists to stop an unattended reset from ever running against the wrong
database — only set it in your local `.env`, never in a shared or
production environment.

**`npm test` fails with a connection error.**
Confirm the `shopnear-db` container is up (`docker ps`) and that `.env`
matches `docker-compose.yml`'s port before running tests again.

**Prisma Studio (or a manual query) shows zero rows after running `npm test`.**
This is expected, not a broken seed — see the note under "Everyday
commands" above. Run `npm run db:reset` again to get the demo dataset back.

**Verifying the seed is deterministic by hand.**
`prisma db execute --stdin` needs an explicit `--schema` flag outside its
own project directory and doesn't print `SELECT` output at all (it's built
for DDL), and ordering by `id` isn't actually deterministic across resets
since ids are randomly-generated `cuid()`s — so a hash check needs to order
by stable content instead. Query Postgres directly, e.g. via
`docker exec -i shopnear-db psql -U shopnear -d shopnear`:

```sql
SELECT md5(string_agg(p.name || s.price::text, '' ORDER BY p.name, sh.name)) AS content_hash
FROM "ShopInventory" s
JOIN "Product" p ON p.id = s."productId"
JOIN "Shop" sh ON sh.id = s."shopId";
```

Run it after two separate `npm run db:reset` runs — the hash should be
identical both times.

## The `legacy/` directory

`legacy/` holds an archived pre-rebuild prototype (Express + MySQL backend,
Next.js web, Expo mobile). It is kept for reference only, is excluded from
this project's build and test tooling, and is the **only remaining copy**
of some of that prototype's source. **Do not delete or modify it.**
