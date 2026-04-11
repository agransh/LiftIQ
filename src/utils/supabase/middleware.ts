import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Set AUTH_REQUIRED=true (e.g. on Vercel) to require Supabase login again.
 * When unset/false, all routes are open and /login redirects to /.
 */
const LOGIN_GATE_ENABLED = process.env.AUTH_REQUIRED === "true";

/** Routes that never require a Supabase session (auth pages + OAuth return). */
const PUBLIC_PATH_PREFIXES = ["/login", "/auth/callback"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!LOGIN_GATE_ENABLED) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Missing server env: do not leave the app wide open — force login for protected routes.
  if (!supabaseUrl || !supabaseKey) {
    if (!isPublicPath(pathname)) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath(pathname)) {
      return redirectToLogin(request);
    }

    if (user && pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("[middleware] supabase.auth.getUser failed:", err);
    if (!isPublicPath(pathname)) {
      return redirectToLogin(request);
    }
  }

  return supabaseResponse;
}
