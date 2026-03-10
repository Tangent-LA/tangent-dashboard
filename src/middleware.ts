import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/teams', '/admin', '/projects'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Auth routes (redirect if logged in)
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route
  );

  if (isProtectedRoute && !session) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && session) {
    // Redirect to dashboard if accessing auth routes with session
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin-only routes
  if (req.nextUrl.pathname.startsWith('/admin') && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      const redirectUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teams/:path*',
    '/admin/:path*',
    '/projects/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
};
