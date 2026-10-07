# Real Rating

4.7 stars is average. This site re-scores App Store ratings against the real spread of their own category.

Live: https://www.tmaker.io/real-rating (rewrite in tmaker-portfolio; real-rating-chi.vercel.app redirects there)

## How it works

1. **The pile.** 4,883 apps from the US App Store top free, paid and grossing charts across 25 categories, read from Apple's public iTunes RSS and Lookup APIs (snapshot in `src/data`, date in `genres.json`). Apps with fewer than 50 ratings are left out of the spread.
2. **The shrink.** Every rating is pulled toward its category mean as if 200 average ratings were added (Bayesian average), so a 5.0 from 12 people does not beat a 4.8 from millions.
3. **The rank.** Real rating = 1 + 4 x percentile within the category (midrank). 3.0 is the middle. Categories with under 60 apps use the whole store.

Searches hit the live iTunes Search API through `/api/search` (cached 24h at the edge) and are scored against the snapshot spread. Trustpilot numbers for a set of AI video tools and TMAKER products were read from public Trustpilot pages on the snapshot date.

Public numbers and simple math. It says nothing about whether any review is fake.

## Dev

```bash
npm install
npm run dev
python3 scripts/build-data.py   # rebuild the snapshot from scripts/appstore_raw.json
```

Made by [@tibo_maker](https://x.com/tibo_maker).
