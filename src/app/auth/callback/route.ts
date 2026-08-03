import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Vuelta de Google. Supabase entrega un código de un solo uso que hay que
 * canjear por la sesión, y recién ahí se sabe con qué mail entró la persona:
 * es el primer momento en que se puede comprobar si está autorizada. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorGoogle = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorGoogle) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorGoogle)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=sin-codigo`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=no-se-pudo-entrar`);
  }

  const { data: autorizado, error: errorLista } = await supabase
    .from("usuarios_autorizados")
    .select("email")
    .ilike("email", data.user.email.toLowerCase())
    .eq("activo", true)
    .maybeSingle();

  // Igual criterio que el proxy: solo se rechaza con una respuesta correcta
  // y vacía, no ante un error de la base.
  if (errorLista) {
    console.error("No se pudo verificar la lista de autorizados:", errorLista.message);
  } else if (!autorizado) {
    // Sesión abierta pero sin permiso: se cierra acá para no dejar una
    // sesión válida colgando en el navegador de alguien de afuera.
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=no-autorizado&email=${encodeURIComponent(data.user.email)}`
    );
  }

  // Solo rutas internas: un "next" absoluto sería un redirect abierto.
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${destino}`);
}
