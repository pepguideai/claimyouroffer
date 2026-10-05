/* /Nicole (any letter case, optional trailing slash) rewrites to this site's
   offer page, index.html. The browser URL stays on the vanity path.
   affiliate-vanity.js records the AffiliateWP click. Affiliates live in
   config/affiliates.json. Any other path is left alone. */
export const config = {
  matcher: [
    '/((?!api/|config/|wp-admin|wp-content|wp-includes|wp-json|.*\\.).*)'
  ]
};

/* Single-segment paths that must never be captured by an affiliate slug. */
const RESERVED = new Set([
  'index',
  'index.html',
  'config',
  'api',
  'wp-admin',
  'wp-content',
  'wp-includes',
  'wp-json',
  'affiliate-vanity',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

let affiliateCache;

function next() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function rewrite(url, pathname) {
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL(pathname + url.search, url).toString() }
  });
}

function vanitySlug(pathname) {
  const parts = String(pathname || '').split('/').filter(Boolean);
  if (parts.length !== 1) return '';
  let slug = parts[0];
  try { slug = decodeURIComponent(slug); } catch (e) { /* keep the raw segment */ }
  return slug.replace(/\/+$/, '').trim().toLowerCase();
}

function findAffiliate(data, slug) {
  const list = data && data.affiliates;
  if (!slug || !Array.isArray(list)) return null;
  for (let i = 0; i < list.length; i++) {
    const row = list[i] || {};
    if (String(row.slug || '').trim().toLowerCase() === slug) return row;
  }
  return null;
}

/* Returns the internal rewrite path, or null to leave the request untouched. */
function matchAffiliateRewrite(pathname, data) {
  const slug = vanitySlug(pathname);
  if (!slug || RESERVED.has(slug)) return null;
  const affiliate = findAffiliate(data, slug);
  if (!affiliate) return null;
  if (RESERVED.has(String(affiliate.slug || '').trim().toLowerCase())) return null;
  return '/index.html';
}

async function loadAffiliates(requestUrl) {
  if (affiliateCache) return affiliateCache;
  const response = await fetch(new URL('/config/affiliates.json', requestUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error('affiliates.json HTTP ' + response.status);
  affiliateCache = await response.json();
  return affiliateCache;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const slug = vanitySlug(url.pathname);
  if (!slug || RESERVED.has(slug)) return next();

  let data;
  try {
    data = await loadAffiliates(url);
  } catch (e) {
    console.error('[middleware] affiliates.json read failed:', e && e.message);
    return next();
  }

  const dest = matchAffiliateRewrite(url.pathname, data);
  if (!dest) return next();
  return rewrite(url, dest);
}
