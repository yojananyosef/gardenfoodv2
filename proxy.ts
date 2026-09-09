import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = [
  "/",
  "/explorar",
  "/especies",
  "/pricing",
  "/registro",
  "/login",
  "/api",
  "/auth",
  "/legal",
  "/recuperar",
  "/restablecer",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/offline.html",
  "/sw.js",
  "/og.png",
  "/icons",
  "/propuestas",
];

export function esRutaProtegida(pathname: string): boolean {
  return !RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  const scriptSrc = dev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${dev ? "ws:" : ""} https://*.supabase.co wss://*.supabase.co`,
    "frame-ancestors 'none'",
    "form-action 'self' https://www.mercadopago.com https://*.mercadopago.com",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  if (dev) {
    csp[5] = "connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co";
  }
  return csp.join("; ");
}

export async function proxy(request: NextRequest) {
  // CSP con nonce por request (patrón Next): el layout lee el nonce del request
  // para los scripts inline propios; Next lo aplica automáticamente al resto.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const cspValue = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.headers.set("Content-Security-Policy", cspValue);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          supabaseResponse.headers.set("Content-Security-Policy", cspValue);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const esRutaAuth = pathname === "/login" || pathname === "/registro";

  if (!user && esRutaProtegida(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/registro";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && esRutaAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/huerto";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const { data: profile } = await supabase
      .from("perfiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.plan !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // /propuestas excluido del proxy: wireframes estáticos sin sesión ni CSP-nonce
    "/((?!_next/static|_next/image|favicon.ico|propuestas(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
