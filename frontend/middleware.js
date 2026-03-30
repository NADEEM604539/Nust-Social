import { NextResponse } from 'next/server';

// Define public routes (no authentication required)
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/otp-verify',
  '/',
];

// Define protected routes (authentication required)
const protectedRoutes = [
  '/create',
  '/post',
  '/user/profile',
  '/settings',
  '/messages',
  '/notifications',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const userId = request.cookies.get('user_id')?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/post/');

  // If user is authenticated and trying to access auth pages, redirect to home
  if (accessToken && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If route is protected and user is not authenticated, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
