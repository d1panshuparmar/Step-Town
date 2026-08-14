# Step-Town

Walk to earn Step Coins and build your cozy town. Plant crops, run bakeries and coops, fill orders, dig the mine, and expand your map. Keep a daily streak, unlock badges, and grow a farm town powered by every step you take.

## Features

- Email signup / login (Supabase when configured)
- Cloud town saves
- Crops, bakery, feed mill, chicken coop, dairy
- Town orders + visiting premium orders
- Step mine (spend walk energy for ore/gems)
- Warehouse capacity, population, happiness
- Daily goals + achievement badges

## Run

```bash
npm install
cp .env.example .env   # add Supabase keys for cloud auth
npx expo start
```

Without `.env` keys, accounts work **on-device** so you can still playtest.

## Supabase setup

1. Create a project
2. Run [`supabase/schema.sql`](supabase/schema.sql)
3. Put URL + anon key in `.env`
