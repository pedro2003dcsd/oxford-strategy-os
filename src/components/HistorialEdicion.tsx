import { etiquetaCampo, leyendaEdicion } from "@/lib/historial";
import type { CambioConAutor } from "@/lib/historial-server";

/** Línea gris al pie de la tarjeta. Discreta a propósito: informa que algo
 * se editó sin competir con el dato del KR. */
export function LeyendaEdicion({
  edicion,
}: {
  edicion: { fecha: string; autor: string | null } | undefined;
}) {
  if (!edicion) return null;
  return (
    <p className="text-[11px] italic text-tenue">
      {leyendaEdicion({ fecha: edicion.fecha, autor: edicion.autor })}
    </p>
  );
}

/** Historial completo, para la ficha del KR. Muestra el antes y el después:
 * saber que alguien tocó la meta no sirve si no se ve de cuánto a cuánto. */
export function HistorialLista({ cambios }: { cambios: CambioConAutor[] }) {
  if (cambios.length === 0) {
    return (
      <p className="text-sm text-tenue">
        Sin ediciones registradas. Los cambios de meta o texto van a aparecer acá.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {cambios.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-linea bg-panel px-3 py-2 text-sm"
        >
          <p className="font-medium">{etiquetaCampo(c.campo_modificado)}</p>
          <p className="text-tenue">
            <span className="line-through">{c.valor_anterior ?? "—"}</span>
            {" → "}
            <span className="text-current">{c.valor_nuevo ?? "—"}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-tenue">
            {leyendaEdicion({
              fecha: c.fecha,
              autor: c.usuarios_autorizados?.nombre ?? null,
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
