# Novel Studio on Vercel

1. Put this folder in a GitHub repo (or run `npx vercel` inside it).
2. In Vercel: import the project → **Storage** tab → add **Upstash Redis** (Marketplace). This sets the KV_REST_API_URL / KV_REST_API_TOKEN variables for you.
3. **Settings → Environment Variables**: add `APP_PASSWORD` = a passphrase only you know.
4. Deploy. Open the site on your phone and laptop, enter the passphrase once on each, and your novels sync (refreshes every ~20 seconds, and when you return to the tab).
