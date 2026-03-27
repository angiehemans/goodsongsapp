# PRD: Band Subdomain Routing

**GoodSongs Frontend**
**Status:** Draft
**Last Updated:** 2026-03-27

---

## Overview

By default, band profile URLs currently follow the pattern `goodsongs.app/bands/bandslug`. This PRD covers implementing subdomain routing so that every band profile is also accessible at `bandslug.goodsongs.app`, with the existing path-based URL preserved as a functional fallback.

This is a purely frontend concern. No backend changes are required. The Rails API continues to identify bands by slug regardless of which URL the request originated from.

---

## Goals

- Every band profile is accessible at `bandslug.goodsongs.app`
- The existing route `goodsongs.app/bands/bandslug` continues to work as a fallback
- No duplicate content — the subdomain is the canonical URL for band profiles
- The fallback path redirects (301) to the canonical subdomain URL
- No change to the band profile page component itself
- Infrastructure is compatible with the custom domain system (Approximated) planned for a future release

---

## Non-Goals

- Custom domain support (`www.theirband.com`) — covered in a separate PRD
- Subdomain routing for blogger profiles — out of scope for this release
- Any backend or API changes
- Changes to band profile page UI or content

---

## URL Behavior

| Incoming URL                       | Behavior                                 | Notes                                |
| ---------------------------------- | ---------------------------------------- | ------------------------------------ |
| `bandslug.goodsongs.app/`          | Renders band profile                     | Canonical URL                        |
| `bandslug.goodsongs.app/shows`     | Renders band shows tab                   | Subdomain applies to all band routes |
| `goodsongs.app/bands/bandslug`     | 301 redirect to `bandslug.goodsongs.app` | Fallback redirects to canonical      |
| `www.goodsongs.app/bands/bandslug` | 301 redirect to `bandslug.goodsongs.app` | Same as above                        |
| `goodsongs.app/`                   | No change — renders homepage             | Root and www unaffected              |
| `www.goodsongs.app/`               | No change — renders homepage             | Root and www unaffected              |

---

## Technical Implementation

### 1. DNS — Wildcard Record

Add a wildcard DNS record in Vercel:

```
*.goodsongs.app  →  [Vercel deployment]
```

In the Vercel dashboard, add `*.goodsongs.app` as a custom domain on the project. Vercel provisions a wildcard SSL certificate automatically, covering all subdomains.

### 2. Next.js Middleware

Create or update `middleware.ts` at the project root. The middleware intercepts every request before rendering and handles two cases:

**Case A — Subdomain request:** Rewrite internally to `/bands/[slug]` so the band profile page renders, while the browser URL stays as `bandslug.goodsongs.app`.

**Case B — Path-based fallback:** Redirect `goodsongs.app/bands/bandslug` with a 301 to `bandslug.goodsongs.app`.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "goodsongs.app";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // Strip port for local development
  const host = hostname.replace(":3000", "").replace(":3001", "");

  const isRootOrWww =
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === "localhost";

  // Case A: Subdomain request — rewrite to /bands/[slug]
  if (!isRootOrWww && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = host.replace(`.${ROOT_DOMAIN}`, "");

    // Protect internal Next.js paths from being rewritten
    if (
      url.pathname.startsWith("/_next") ||
      url.pathname.startsWith("/api") ||
      url.pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    url.pathname = `/bands/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case B: Path-based fallback — redirect /bands/[slug] to subdomain
  if (isRootOrWww && url.pathname.startsWith("/bands/")) {
    const slug = url.pathname.split("/")[2];
    if (slug) {
      const remainingPath = url.pathname.replace(`/bands/${slug}`, "") || "";
      return NextResponse.redirect(
        `https://${slug}.${ROOT_DOMAIN}${remainingPath}${url.search}`,
        301,
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 3. Local Development

Subdomains do not work on `localhost` out of the box. Two options for local testing:

**Option A — `/etc/hosts` entries (recommended for occasional testing):**

```
127.0.0.1  testband.localhost
```

Then visit `testband.localhost:3000` in the browser.

**Option B — `.env.local` flag to bypass subdomain logic during development:**

```
NEXT_PUBLIC_DISABLE_SUBDOMAIN_ROUTING=true
```

Add a check in middleware to skip rewriting when this flag is set, so `/bands/bandslug` works normally during local development.

### 4. SEO — Canonical Tags

The band profile page should emit a canonical tag pointing to the subdomain URL. This prevents search engines from indexing both the subdomain and the fallback path if a bot somehow bypasses the middleware redirect.

In the band profile page (or its layout):

```typescript
// app/bands/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return {
    alternates: {
      canonical: `https://${params.slug}.goodsongs.app`,
    },
  };
}
```

---

## Future Compatibility — Custom Domains

This implementation is deliberately structured to slot into the custom domain system (Approximated) with minimal changes. When a band has a verified custom domain, the middleware lookup will be extended as follows:

```typescript
// Future addition — check custom domain before subdomain logic
const customDomain = await lookupCustomDomain(host);
if (customDomain) {
  url.pathname = `/bands/${customDomain.bandSlug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}
```

The band profile page component requires no changes for either routing path.

---

## Rollout

Since the fallback path (`/bands/bandslug`) issues a 301 redirect rather than silently breaking, rollout risk is low. The recommended sequence:

1. Add wildcard DNS record in Vercel and confirm SSL certificate provisioning
2. Deploy middleware to staging and verify subdomain rewriting with a test band slug
3. Verify 301 redirect from `/bands/bandslug` path
4. Verify root and www routes are unaffected
5. Confirm canonical tags are emitting correctly
6. Deploy to production

---

## Open Questions

- Should subdomains be enabled for all bands immediately, or only for bands on paid plans? (Current assumption: all bands, including free tier)
- Are there any reserved subdomains that need to be blocked from band slugs — e.g., `api`, `www`, `app`, `mail`, `status`? A blocklist should be enforced at band slug creation time in Rails, but middleware should also handle gracefully if a reserved slug is somehow requested.
- Should the subdomain URL appear anywhere in the band's profile UI (e.g., a "your profile URL" field in settings)? Not in scope for this PRD but worth noting for the settings UI.
