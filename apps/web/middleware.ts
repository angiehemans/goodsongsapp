import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'goodsongs.app';

const RESERVED_SUBDOMAINS = new Set([
  'api',
  'www',
  'app',
  'mail',
  'status',
  'admin',
  'blog',
]);

export function middleware(req: NextRequest) {
  // Allow bypassing subdomain routing in local development
  if (process.env.NEXT_PUBLIC_DISABLE_SUBDOMAIN_ROUTING === 'true') {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Strip port for local development
  const host = hostname.replace(/:\d+$/, '');

  // Detect localhost subdomain (e.g., bandslug.localhost:3001)
  const isLocalhost = host === 'localhost' || host.endsWith('.localhost');
  const localhostSlug = isLocalhost && host !== 'localhost'
    ? host.replace('.localhost', '')
    : null;

  const isRootOrWww =
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === 'localhost';

  // Case A: Subdomain request — rewrite to /bands/[slug]
  const slug = localhostSlug || (
    !isRootOrWww && host.endsWith(`.${ROOT_DOMAIN}`)
      ? host.replace(`.${ROOT_DOMAIN}`, '')
      : null
  );

  if (slug) {
    // Don't rewrite reserved subdomains
    if (RESERVED_SUBDOMAINS.has(slug)) {
      return NextResponse.next();
    }

    // Protect internal Next.js paths from being rewritten
    if (
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/api') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/favicon.png'
    ) {
      return NextResponse.next();
    }

    url.pathname = `/bands/${slug}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Case B: Path-based fallback — redirect /bands/[slug] to subdomain
  if (isRootOrWww && url.pathname.startsWith('/bands/')) {
    const pathSlug = url.pathname.split('/')[2];
    if (pathSlug) {
      // In local dev, redirect to subdomain on localhost
      if (isLocalhost) {
        const port = hostname.includes(':') ? `:${hostname.split(':')[1]}` : '';
        const remainingPath = url.pathname.replace(`/bands/${pathSlug}`, '') || '';
        return NextResponse.redirect(
          `http://${pathSlug}.localhost${port}${remainingPath}${url.search}`,
          302
        );
      }
      const remainingPath = url.pathname.replace(`/bands/${pathSlug}`, '') || '';
      return NextResponse.redirect(
        `https://${pathSlug}.${ROOT_DOMAIN}${remainingPath}${url.search}`,
        308
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
