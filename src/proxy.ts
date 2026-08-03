import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión válida todavía falta estar en la lista de autorizados. Se
  // controla acá y no en cada página porque esto también cubre las rutas de
  // API: si no, alguien con sesión podría consultarlas directo.
  if (user && !isPublicPath) {
    const { data: autorizado, error: errorLista } = await supabase
      .from("usuarios_autorizados")
      .select("email")
      .ilike("email", (user.email ?? "").toLowerCase())
      .eq("activo", true)
      .maybeSingle();

    // Si la consulta falla (tabla todavía no creada, base caída), se deja
    // pasar. Un problema de infraestructura no puede dejar al equipo entero
    // afuera; lo que sí cierra la puerta es una respuesta correcta y vacía.
    if (errorLista) {
      console.error("No se pudo verificar la lista de autorizados:", errorLista.message);
    } else if (!autorizado) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("error", "no-autorizado");
      if (user.email) url.searchParams.set("email", user.email);
      return NextResponse.redirect(url);
    }
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
