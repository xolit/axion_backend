# Movies Backend

Simple production-ready backend for a movies app using Express, MongoDB, Mongoose, and Redis caching.

Quick start:

1. Install deps

```bash
npm install
```

2. Copy `.env.example` to `.env` and set `MONGO_URI` and `REDIS_URL`.

3. Seed sample data:

```bash
npm run seed
```

4. Start dev server:

```bash
npm run dev
```

APIs:
- `GET /movie/:movieName` — returns movies matching the title (case-insensitive substring).
- `GET /home?page=1` — returns 10 movies per page and `nextPage` if available.
