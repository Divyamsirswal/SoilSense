import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Configure paths that require authentication and those that are public
const protectedPaths = [
  "/dashboard",
  "/farms",
  "/devices",
  "/soil-data",
  "/weather",
  "/analytics",
  "/settings",
  "/profile",
];

const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some((path) => 
    pathname.startsWith(path) || pathname === path
  );
  
  // Check if the path is an auth route (login, register)
  const isAuthRoute = authRoutes.some((route) => 
    pathname.startsWith(route) || pathname === route
  );

  // Get the token from the session
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login if they try to access protected routes
  if (isProtectedPath && !token) {
    const url = new URL("/login", request.url);
    // Add the callback URL to redirect after login
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // For API routes requiring authentication
  if (pathname.startsWith("/api/") && 
      !pathname.startsWith("/api/auth/") && 
      !pathname.startsWith("/api/register") &&
      !token) {
    return new NextResponse(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Continue for public routes or authenticated users on protected routes
  return NextResponse.next();
}

// Configure the paths that trigger this middleware
export const config = {
  matcher: [
    // Match all paths except static files, API auth routes, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
