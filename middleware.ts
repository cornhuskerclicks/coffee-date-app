import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const MAIN_DOMAIN = "aetherrevive.com"
const ALLOWED_HOSTS = ["localhost", "127.0.0.1", "vercel.app"]

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // Check if this is a subdomain request
  const isSubdomain = hostname.includes(MAIN_DOMAIN) && !hostname.startsWith("www.") && hostname !== MAIN_DOMAIN

  // Skip subdomain logic for local development and vercel preview deployments
  const isLocalOrPreview = ALLOWED_HOSTS.some((h) => hostname.includes(h))

  if (isSubdomain && !isLocalOrPreview) {
    const subdomain = hostname.split(".")[0]

    // Only rewrite public routes (quiz, audit) for subdomains
    if (pathname.startsWith("/quiz/") || pathname.startsWith("/audit/")) {
      // Add subdomain to request headers for the page to use
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-subdomain", subdomain)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // For other routes on subdomain, redirect to main domain with same path
    if (!pathname.startsWith("/quiz") && !pathname.startsWith("/audit")) {
      return NextResponse.redirect(new URL(pathname, `https://${MAIN_DOMAIN}`))
    }
  }

  // Handle normal auth session
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
