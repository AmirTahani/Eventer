import { NextRequest, NextResponse } from 'next/server';

function hostname(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-host')?.split(':')[0] ??
    req.headers.get('host')?.split(':')[0] ??
    ''
  );
}

export function middleware(req: NextRequest) {
  const host = hostname(req);
  const isAdmin = host === 'admin.eventer.world' || host === 'admin.localhost';
  if (!isAdmin) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.rewrite(url);
  }

  if (pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.rewrite(url);
  }

  if (!pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
