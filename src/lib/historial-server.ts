// Solo servidor: createClient() usa cookies() de next/headers, que tira si
// alguien importa esto desde un componente cliente.
import { createClient } from "@/lib/supabase/server";
import { perfilActual } from "@/lib/perfil";
import { diffCampos } from "@/lib/historial";
import type { HistorialCambio, UsuarioAutorizado } from "@/lib/types";

type Destino = { okrId: string; krId?: never } | { krId: string; okrId?: never };

/** Registra en `okr_historial_cambios` los campos que cambiaron.
 *
 * Nunca tira: si la auditoría falla, la edición ya se guardó y hacerla
 * fallar en cascada perdería el trabajo de la persona. Queda en el log del
 * servidor, que es donde se mira cuando falta un registro. */
export async function registrarCambios(
  destino: Destino,
  anterior: Record<string, unknown>,
  nuevo: Record<string, unknown>
): Promise<void> {
  const cambios = diffCampos(anterior, nuevo);
  if (cambios.length === 0) return;

  try {
    const [supabase, perfil] = await Promise.all([createClient(), perfilActual()]);

    const { error } = await supabase.from("okr_historial_cambios").insert(
      cambios.map((c) => ({
        okr_id: destino.okrId ?? null,
        kr_id: destino.krId ?? null,
        usuario_id: perfil?.id ?? null,
        ...c,
      }))
    );
    if (error) {
      console.error("No se pudo registrar el historial:", error.message);
    }
  } catch (e) {
    console.error("No se pudo registrar el historial:", e);
  }
}

export interface CambioConAutor extends HistorialCambio {
  usuarios_autorizados: Pick<UsuarioAutorizado, "nombre"> | null;
}

/** Última edición, para la leyenda discreta de la tarjeta. */
export async function ultimaEdicion(
  destino: Destino
): Promise<{ fecha: string; autor: string | null } | null> {
  const supabase = await createClient();
  const columna = destino.okrId ? "okr_id" : "kr_id";
  const valor = destino.okrId ?? destino.krId!;

  const { data } = await supabase
    .from("okr_historial_cambios")
    .select("fecha, usuarios_autorizados(nombre)")
    .eq(columna, valor)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const fila = data as unknown as CambioConAutor;
  return { fecha: fila.fecha, autor: fila.usuarios_autorizados?.nombre ?? null };
}

/** Última edición de muchos registros de una vez.
 *
 * La alternativa era pedir el historial por tarjeta, y en /okrs eso son
 * cuarenta consultas para pintar una línea de texto gris. Trae todo
 * ordenado y se queda con la primera de cada id. */
export async function ultimasEdiciones(
  campo: "okr_id" | "kr_id",
  ids: string[]
): Promise<Map<string, { fecha: string; autor: string | null }>> {
  const mapa = new Map<string, { fecha: string; autor: string | null }>();
  if (ids.length === 0) return mapa;

  const supabase = await createClient();
  const { data } = await supabase
    .from("okr_historial_cambios")
    .select(`${campo}, fecha, usuarios_autorizados(nombre)`)
    .in(campo, ids)
    .order("fecha", { ascending: false });

  for (const fila of (data ?? []) as unknown as CambioConAutor[]) {
    const id = fila[campo];
    if (!id || mapa.has(id)) continue;
    mapa.set(id, {
      fecha: fila.fecha,
      autor: fila.usuarios_autorizados?.nombre ?? null,
    });
  }

  return mapa;
}

/** Historial completo de un KR u OKR, del más reciente al más viejo. */
export async function historialDe(destino: Destino): Promise<CambioConAutor[]> {
  const supabase = await createClient();
  const columna = destino.okrId ? "okr_id" : "kr_id";
  const valor = destino.okrId ?? destino.krId!;

  const { data } = await supabase
    .from("okr_historial_cambios")
    .select("*, usuarios_autorizados(nombre)")
    .eq(columna, valor)
    .order("fecha", { ascending: false });

  return (data ?? []) as unknown as CambioConAutor[];
}
