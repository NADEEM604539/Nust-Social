import { NextResponse } from 'next/server';

// Define public/auth routes (accessible WITHOUT authentication)
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/otp-verify',
];

// Define protected routes (require authentication)
const protectedRoutes = [
  '/create',
  '/post',
  '/user',
  '/profile',
  '/settings',
  '/messages',
  '/notifications',
  '/',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get the access token from cookies or localStorage (via headers)
  const accessToken = request.cookies.get('access_token')?.value;

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // CASE 1: User is NOT logged in
  if (!accessToken) {
    // If trying to access protected route, redirect to login
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // If trying to access public route (auth pages), allow access
    if (isPublicRoute) {
      return NextResponse.next();
    }
  }

  // CASE 2: User IS logged in
  if (accessToken) {
    // If trying to access auth pages while logged in, redirect to home
    if (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/otp-verify') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // If accessing protected routes, allow access
    if (isProtectedRoute) {
      return NextResponse.next();
    }
    // Default allow
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
