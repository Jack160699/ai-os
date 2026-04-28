import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/v2/rbac";

function getUserRole(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const routeMap = new Map([
    ["/admin", "/v2"],
    ["/inbox", "/v2/inbox"],
    ["/payments", "/v2/payments"],
    ["/team", "/v2/team"],
    ["/settings", "/v2/settings"],
  ]);

  const mapped = routeMap.get(pathname);
  if (mapped) {
    return NextResponse.redirect(new URL(mapped, request.url));
  }

  if (pathname.startsWith("/legacy-admin")) {
    const tail = pathname.replace(/^\/legacy-admin/, "") || "";
    const legacyTarget = `/admin${tail}` || "/admin";
    const url = new URL(legacyTarget, request.url);
    url.searchParams.set("legacy", "1");
    return NextResponse.rewrite(url);
  }

  if (!pathname.startsWith("/v2")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname !== "/v2/login") {
    return NextResponse.redirect(new URL("/v2/login", request.url));
  }

  if (user && pathname === "/v2/login") {
    return NextResponse.redirect(new URL("/v2", request.url));
  }

  if (user && pathname !== "/v2/login") {
    const role = getUserRole(user);
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL("/v2?access=denied", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/v2/:path*", "/admin/:path*", "/inbox/:path*", "/payments/:path*", "/team/:path*", "/settings/:path*", "/legacy-admin/:path*"],
};
