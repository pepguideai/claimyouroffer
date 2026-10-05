# Claim your offer

Static offer page. `/` is the page itself. A vanity path such as `/Nicole` serves that same page without a redirect (the address bar stays on `/Nicole`) and records an AffiliateWP visit for that affiliate.

## Add an affiliate

Append one object to the `affiliates` array in `config/affiliates.json`:

```json
{ "slug": "nicole", "name": "Nicole", "id": "2" }
```

- `slug` is a single URL segment. It is matched without regard to letter case, so `/Nicole` and `/nicole` are the same path. A trailing slash is ignored. Do not reuse a slug that belongs to a real file or route (`index`, `config`, `wp-admin`, and anything else listed as reserved in `middleware.js`).
- `name` is the affiliate's display name.
- `id` is that affiliate's AffiliateWP id.

No other file needs to change. Push to the deployment branch and Vercel will pick up the new path. `affiliate-vanity.js` posts `action=affwp_track_visit` to `/wp-admin/admin-ajax.php`, which `vercel.json` proxies to `https://admin.ambrosiastandard.com/wp-admin/admin-ajax.php`.
