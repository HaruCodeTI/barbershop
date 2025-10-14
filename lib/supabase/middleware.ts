import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // NOTE: Middleware auth protection is disabled because we're using custom authentication
  // with localStorage tokens instead of Supabase Auth. Auth guards are handled on the
  // client-side via AuthContext and page-level checks.
  //
  // If you need server-side route protection, you'll need to:
  // 1. Move auth tokens from localStorage to cookies
  // 2. Validate session tokens in this middleware
  //
  // For now, all route protection is done client-side.

  return supabaseResponse
}
