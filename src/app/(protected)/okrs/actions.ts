"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribir, vetoDeBorrado, vetoDeEscritura } from "@/lib/permisos";
import { registrarCambios } from "@/lib/historial-server";
import type { Area } from "@/lib/types";

export type FormActionState = { error?: string } | undefined;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

/** Alinea un OKR trimestral huérfano a un OKR anual sin abrir el formulario
 * completo: en la práctica los objetivos se crean primero y se alinean
 * después, y esa fricción hace que queden sueltos para siempre. */
export async function alinearOkrTrimestral(
  okrTrimestralId: string,
  okrAnualId: string | null
) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase
    .from("okr_trimestral")
    .update({ okr_anual_id: okrAnualId })
    .eq("id", okrTrimestralId);
  revalidatePath("/okrs");
  revalidatePath("/");
}

export async function createPilar(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const nombre = str(formData, "nombre");
  if (!nombre) return { error: "El nombre del pilar es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("pilares").insert({
    nombre,
    descripcion: optionalStr(formData, "descripcion"),
    anio: Number(formData.get("anio")) || 2026,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function createOkrAnual(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const responsableId = optionalStr(formData, "responsable_id");
  const responsable = await nombreDeResponsable(supabase, responsableId);

  const { data: creado, error } = await supabase
    .from("okr_anual")
    .insert({
      pilar_id: optionalStr(formData, "pilar_id"),
      titulo,
      objetivo: optionalStr(formData, "objetivo"),
      responsable_id: responsableId,
      responsable,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await guardarCoResponsables(
    supabase,
    { okrAnualId: creado.id as string },
    coResponsables(formData),
    responsableId
  );

  revalidatePath("/okrs");
  return undefined;
}

export async function updateOkrAnual(
  okrAnualId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const responsableId = optionalStr(formData, "responsable_id");
  const responsable = await nombreDeResponsable(supabase, responsableId);

  const { error } = await supabase
    .from("okr_anual")
    .update({
      pilar_id: optionalStr(formData, "pilar_id"),
      titulo,
      objetivo: optionalStr(formData, "objetivo"),
      responsable_id: responsableId,
      responsable,
    })
    .eq("id", okrAnualId);
  if (error) return { error: error.message };

  await guardarCoResponsables(
    supabase,
    { okrAnualId },
    coResponsables(formData),
    responsableId
  );

  revalidatePath("/okrs");
  return undefined;
}

export async function createOkrTrimestral(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  const trimestre = str(formData, "trimestre");
  const responsableId = str(formData, "responsable_id");
  const esColaborativo = formData.get("es_colaborativo") === "on";
  const areas = areasInvolucradas(formData, esColaborativo);

  if (esColaborativo && areas.length < 2) {
    return {
      error:
        "Un OKR colaborativo necesita al menos dos áreas involucradas. Si es de una sola área, destildá la casilla.",
    };
  }

  // En un colaborativo no hay área padre: se guarda la primera involucrada
  // como referencia técnica, porque la columna es NOT NULL. Las áreas reales
  // del objetivo son areas_involucradas, y de ahí sale en qué tableros
  // aparece.
  const area = esColaborativo ? areas[0] : str(formData, "area");

  if (!titulo || !area || !trimestre || !responsableId) {
    return {
      error: esColaborativo
        ? "Completá título, trimestre y quién rinde cuentas, y marcá las áreas."
        : "Completá título, área, trimestre y quién rinde cuentas.",
    };
  }

  const supabase = await createClient();
  const responsable = await nombreDeResponsable(supabase, responsableId);
  if (!responsable) {
    return { error: "No se encontró a esa persona en la lista de accesos." };
  }

  const { data: creado, error } = await supabase
    .from("okr_trimestral")
    .insert({
      // okr_anual_id es opcional a propósito: un área puede alinear su OKR
      // trimestral más tarde sin bloquear el arranque del trimestre.
      okr_anual_id: optionalStr(formData, "okr_anual_id"),
      area,
      titulo,
      trimestre,
      anio: Number(formData.get("anio")) || 2026,
      responsable_id: responsableId,
      responsable,
      es_colaborativo: esColaborativo,
      areas_involucradas: areas,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await guardarCoResponsables(
    supabase,
    { okrTrimestralId: creado.id as string },
    coResponsables(formData),
    responsableId
  );

  revalidatePath("/okrs");
  revalidatePath("/okrs/colaborativos");
  revalidatePath("/");
  return undefined;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** El nombre con el que se conoce a esa persona en los OKRs.
 *
 * Se usa para mantener sincronizada la columna de texto: la leen los
 * informes, Scout, el resumen de la LOM y el mail de recordatorio. Mientras
 * exista, tiene que decir lo mismo que el id. */
async function nombreDeResponsable(
  supabase: Supabase,
  usuarioId: string | null
): Promise<string | null> {
  if (!usuarioId) return null;
  const { data } = await supabase
    .from("usuarios_autorizados")
    .select("nombre, responsable")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!data) return null;
  const u = data as { nombre: string; responsable: string | null };
  return u.responsable?.trim() || u.nombre;
}

/** Nombre del cliente, para mantener sincronizada la columna de texto.
 *
 * cliente_asociado la siguen leyendo Scout, los informes y la Estrella
 * Polar. Mientras exista, tiene que decir lo mismo que cliente_id. */
async function nombreDeCliente(
  supabase: Supabase,
  clienteId: string | null
): Promise<string | null> {
  if (!clienteId) return null;
  const { data } = await supabase
    .from("clientes")
    .select("nombre")
    .eq("id", clienteId)
    .maybeSingle();
  return (data as { nombre: string } | null)?.nombre ?? null;
}

/** Sincroniza los co-responsables por diferencia, no borrando todo.
 *
 * Borrar y reinsertar perdería el área de los referentes cargados desde la
 * pantalla de colaborativos, que este formulario no conoce. */
async function guardarCoResponsables(
  supabase: Supabase,
  destino: { okrTrimestralId?: string; okrAnualId?: string },
  idsElegidos: string[],
  principalId: string | null
) {
  const columna = destino.okrTrimestralId ? "okr_trimestral_id" : "okr_anual_id";
  const valor = destino.okrTrimestralId ?? destino.okrAnualId!;

  // Quien rinde cuentas no va también en la lista: aparecería con el avatar
  // duplicado en cada tarjeta.
  const elegidos = [...new Set(idsElegidos)].filter(
    (id) => id && id !== principalId
  );

  const { data: actuales } = await supabase
    .from("okr_responsables")
    .select("id, usuario_id")
    .eq(columna, valor);

  const filas = (actuales ?? []) as { id: string; usuario_id: string }[];

  const aBorrar = filas
    .filter((f) => !elegidos.includes(f.usuario_id))
    .map((f) => f.id);
  if (aBorrar.length > 0) {
    await supabase.from("okr_responsables").delete().in("id", aBorrar);
  }

  const yaEstan = filas.map((f) => f.usuario_id);
  const aAgregar = elegidos.filter((id) => !yaEstan.includes(id));
  if (aAgregar.length > 0) {
    await supabase
      .from("okr_responsables")
      .insert(aAgregar.map((usuario_id) => ({ [columna]: valor, usuario_id })));
  }
}

function coResponsables(formData: FormData): string[] {
  return formData
    .getAll("co_responsables")
    .map((v) => String(v).trim())
    .filter(Boolean);
}

/** Las áreas involucradas viajan como checkboxes repetidos con el mismo
 * name. Un OKR no colaborativo no guarda ninguna: si después se destilda la
 * casilla, la lista vieja quedaría colgada y los filtros la seguirían
 * levantando. */
function areasInvolucradas(formData: FormData, esColaborativo: boolean): Area[] {
  if (!esColaborativo) return [];
  return formData
    .getAll("areas_involucradas")
    .map((a) => String(a).trim())
    .filter(Boolean) as Area[];
}

export async function updateOkrTrimestral(
  okrId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  const trimestre = str(formData, "trimestre");
  const responsableId = str(formData, "responsable_id");
  const esColaborativo = formData.get("es_colaborativo") === "on";
  const areas = areasInvolucradas(formData, esColaborativo);

  if (esColaborativo && areas.length < 2) {
    return {
      error:
        "Un OKR colaborativo necesita al menos dos áreas involucradas. Si es de una sola área, destildá la casilla.",
    };
  }

  // En un colaborativo no hay área padre: se guarda la primera involucrada
  // como referencia técnica, porque la columna es NOT NULL. Las áreas reales
  // del objetivo son areas_involucradas, y de ahí sale en qué tableros
  // aparece.
  const area = esColaborativo ? areas[0] : str(formData, "area");

  if (!titulo || !area || !trimestre || !responsableId) {
    return {
      error: esColaborativo
        ? "Completá título, trimestre y quién rinde cuentas, y marcá las áreas."
        : "Completá título, área, trimestre y quién rinde cuentas.",
    };
  }

  const supabase = await createClient();
  const responsable = await nombreDeResponsable(supabase, responsableId);
  if (!responsable) {
    return { error: "No se encontró a esa persona en la lista de accesos." };
  }

  const { data: anterior } = await supabase
    .from("okr_trimestral")
    .select("*")
    .eq("id", okrId)
    .maybeSingle();

  const campos = {
    okr_anual_id: optionalStr(formData, "okr_anual_id"),
    area,
    titulo,
    trimestre,
    anio: Number(formData.get("anio")) || 2026,
    responsable_id: responsableId,
    responsable,
    es_colaborativo: esColaborativo,
    areas_involucradas: areas,
  };

  const { error } = await supabase
    .from("okr_trimestral")
    .update(campos)
    .eq("id", okrId);
  if (error) return { error: error.message };

  await guardarCoResponsables(
    supabase,
    { okrTrimestralId: okrId },
    coResponsables(formData),
    responsableId
  );

  if (anterior) {
    await registrarCambios({ okrId }, anterior, campos);
  }

  revalidatePath("/okrs");
  revalidatePath("/okrs/colaborativos");
  revalidatePath("/");
  return undefined;
}

export async function agregarResponsable(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const okrTrimestralId = str(formData, "okr_trimestral_id");
  const usuarioId = str(formData, "usuario_id");
  const area = str(formData, "area");

  if (!okrTrimestralId || !usuarioId || !area) {
    return { error: "Elegí la persona y el área con la que participa." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("okr_responsables")
    .insert({ okr_trimestral_id: okrTrimestralId, usuario_id: usuarioId, area });

  // 23505 = unique_violation. Que ya esté cargada no es un error para quien
  // usa la pantalla: el estado final es el que quería.
  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath("/okrs/colaborativos");
  return undefined;
}

export async function quitarResponsable(responsableId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("okr_responsables").delete().eq("id", responsableId);
  revalidatePath("/okrs/colaborativos");
}

// ------------------------------------------------------------
// KR anual
//
// El KR anual cuelga de un OKR anual y tiene meta propia. No lleva avance:
// su relación con los KR trimestrales es solo para el mapa, no para computar
// un porcentaje (decisión de la reunión del 11/09).
// ------------------------------------------------------------

export async function createKrAnual(
  okrAnualId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  const tipoMedicion = str(formData, "tipo_medicion");
  if (!titulo || !tipoMedicion) {
    return { error: "Completá el título y el tipo de medición." };
  }

  const valorMeta = Number(formData.get("valor_meta"));
  if (Number.isNaN(valorMeta)) return { error: "Ingresá una meta numérica." };

  const supabase = await createClient();

  // El nuevo KR anual va al final de la lista de su OKR anual.
  const { data: ultimo } = await supabase
    .from("kr_anual")
    .select("orden")
    .eq("okr_anual_id", okrAnualId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("kr_anual").insert({
    okr_anual_id: okrAnualId,
    titulo,
    tipo_medicion: tipoMedicion,
    valor_inicial: Number(formData.get("valor_inicial")) || 0,
    valor_meta: valorMeta,
    orden: ((ultimo?.orden as number | undefined) ?? 0) + 1,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function updateKrAnual(
  krAnualId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  const tipoMedicion = str(formData, "tipo_medicion");
  if (!titulo || !tipoMedicion) {
    return { error: "Completá el título y el tipo de medición." };
  }

  const valorMeta = Number(formData.get("valor_meta"));
  if (Number.isNaN(valorMeta)) return { error: "Ingresá una meta numérica." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("kr_anual")
    .update({
      titulo,
      tipo_medicion: tipoMedicion,
      valor_inicial: Number(formData.get("valor_inicial")) || 0,
      valor_meta: valorMeta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", krAnualId);
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function deleteKrAnual(krAnualId: string): Promise<FormActionState> {
  const veto = await vetoDeBorrado();
  if (veto) return { error: veto };

  const supabase = await createClient();
  // Los vínculos en kr_alineacion se van solos por FK on delete cascade.
  const { error } = await supabase.from("kr_anual").delete().eq("id", krAnualId);
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

// ------------------------------------------------------------
// Alineación muchos-a-muchos (el mapa)
//
// Dos niveles independientes: OKR trimestral ↔ OKR anual, y KR trimestral ↔
// KR anual. Vincular ya existente no es un error (23505): el estado final es
// el que se quería.
// ------------------------------------------------------------

/** Guarda dónde quedó un cuadro en el mapa. No pasa por el historial ni
 * revalida: mover algo es cosa de la vista, no un cambio del objetivo, y
 * refrescar en cada gota del arrastre pelearía con la posición local. */
export async function moverNodo(
  tipo: "anual" | "trimestral",
  id: string,
  x: number,
  y: number
) {
  if (!(await puedeEscribir())) return;
  const supabase = await createClient();
  const tabla = tipo === "anual" ? "okr_anual" : "okr_trimestral";
  await supabase.from(tabla).update({ pos_x: x, pos_y: y }).eq("id", id);
}

/** Guarda de una sola vez la posición de muchos cuadros, para "Ordenar
 * automáticamente": una sola llamada en vez de N. No revalida por lo mismo
 * que moverNodo. */
export async function moverNodosBatch(
  items: { tipo: "anual" | "trimestral"; id: string; x: number; y: number }[]
) {
  if (!(await puedeEscribir())) return;
  if (items.length === 0) return;
  const supabase = await createClient();
  await Promise.all(
    items.map((it) =>
      supabase
        .from(it.tipo === "anual" ? "okr_anual" : "okr_trimestral")
        .update({ pos_x: it.x, pos_y: it.y })
        .eq("id", it.id)
    )
  );
}

export async function vincularOkr(
  okrTrimestralId: string,
  okrAnualId: string
) {
  if (!(await puedeEscribir())) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("okr_alineacion")
    .insert({ okr_trimestral_id: okrTrimestralId, okr_anual_id: okrAnualId });
  if (error && error.code !== "23505") return;
  revalidatePath("/okrs");
}

export async function desvincularOkr(
  okrTrimestralId: string,
  okrAnualId: string
) {
  if (!(await puedeEscribir())) return;
  const supabase = await createClient();
  await supabase
    .from("okr_alineacion")
    .delete()
    .eq("okr_trimestral_id", okrTrimestralId)
    .eq("okr_anual_id", okrAnualId);
  revalidatePath("/okrs");
}

export async function vincularKr(krTrimestralId: string, krAnualId: string) {
  if (!(await puedeEscribir())) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("kr_alineacion")
    .insert({ kr_trimestral_id: krTrimestralId, kr_anual_id: krAnualId });
  if (error && error.code !== "23505") return;
  revalidatePath("/okrs");
}

export async function desvincularKr(krTrimestralId: string, krAnualId: string) {
  if (!(await puedeEscribir())) return;
  const supabase = await createClient();
  await supabase
    .from("kr_alineacion")
    .delete()
    .eq("kr_trimestral_id", krTrimestralId)
    .eq("kr_anual_id", krAnualId);
  revalidatePath("/okrs");
}

export async function createKeyResult(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const okrTrimestralId = str(formData, "okr_trimestral_id");
  const titulo = str(formData, "titulo");
  const tipoMedicion = str(formData, "tipo_medicion");

  if (!okrTrimestralId || !titulo || !tipoMedicion) {
    return { error: "Completá el OKR trimestral, el título y el tipo de medición." };
  }

  const valorMeta = Number(formData.get("valor_meta"));
  if (tipoMedicion !== "hitos" && Number.isNaN(valorMeta)) {
    return { error: "Ingresá una meta numérica." };
  }

  const supabase = await createClient();
  const clienteId = optionalStr(formData, "cliente_id");
  const clienteNombre = await nombreDeCliente(supabase, clienteId);

  const { data: created, error } = await supabase
    .from("key_results")
    .insert({
      okr_trimestral_id: okrTrimestralId,
      titulo,
      tipo_medicion: tipoMedicion,
      valor_inicial: Number(formData.get("valor_inicial")) || 0,
      valor_meta: tipoMedicion === "hitos" ? 1 : valorMeta,
      cliente_id: clienteId,
      cliente_asociado: clienteNombre,
      margen_utilidad_esperado:
        Number(formData.get("margen_utilidad_esperado")) || 65.0,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (tipoMedicion === "hitos") {
    const titulos = formData
      .getAll("hito_titulo")
      .map((t) => String(t).trim())
      .filter(Boolean);
    if (titulos.length > 0) {
      const { error: hitosError } = await supabase.from("hitos_kr").insert(
        titulos.map((t, i) => ({ kr_id: created.id, titulo: t, orden: i + 1 }))
      );
      if (hitosError) return { error: hitosError.message };
    }
  }

  revalidatePath("/okrs");
  revalidatePath("/");
  return undefined;
}

export async function updateKeyResult(
  krId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = str(formData, "titulo");
  const tipoMedicion = str(formData, "tipo_medicion");

  if (!titulo || !tipoMedicion) {
    return { error: "Completá el título y el tipo de medición." };
  }

  const valorMeta = Number(formData.get("valor_meta"));
  if (tipoMedicion !== "hitos" && Number.isNaN(valorMeta)) {
    return { error: "Ingresá una meta numérica." };
  }

  const supabase = await createClient();

  // Se lee antes de escribir: el historial necesita el valor viejo y una vez
  // hecho el update ya no está en ningún lado.
  const { data: anterior } = await supabase
    .from("key_results")
    .select("*")
    .eq("id", krId)
    .maybeSingle();

  const clienteId = optionalStr(formData, "cliente_id");
  const clienteNombre = await nombreDeCliente(supabase, clienteId);

  const campos = {
    titulo,
    tipo_medicion: tipoMedicion,
    valor_inicial: Number(formData.get("valor_inicial")) || 0,
    valor_meta: tipoMedicion === "hitos" ? 1 : valorMeta,
    cliente_id: clienteId,
    cliente_asociado: clienteNombre,
    margen_utilidad_esperado:
      Number(formData.get("margen_utilidad_esperado")) || 65.0,
  };

  const { error } = await supabase
    .from("key_results")
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq("id", krId);
  if (error) return { error: error.message };

  if (anterior) {
    await registrarCambios({ krId }, anterior, campos);
  }

  if (tipoMedicion === "hitos") {
    // Cada fila del checklist viaja como par (hito_id, hito_titulo); id vacío = fila nueva.
    // Las filas que el usuario eliminó no viajan, así que: existentes - enviados = a borrar.
    const ids = formData.getAll("hito_id").map(String);
    const titulos = formData.getAll("hito_titulo").map((t) => String(t).trim());

    const { data: existentes } = await supabase
      .from("hitos_kr")
      .select("id")
      .eq("kr_id", krId);
    const idsExistentes = (existentes ?? []).map((h) => h.id as string);

    const keptIds: string[] = [];
    for (let i = 0; i < titulos.length; i++) {
      if (!titulos[i]) continue;
      if (ids[i]) {
        keptIds.push(ids[i]);
        await supabase
          .from("hitos_kr")
          .update({ titulo: titulos[i], orden: i + 1 })
          .eq("id", ids[i]);
      } else {
        await supabase
          .from("hitos_kr")
          .insert({ kr_id: krId, titulo: titulos[i], orden: i + 1 });
      }
    }

    const aBorrar = idsExistentes.filter((id) => !keptIds.includes(id));
    if (aBorrar.length > 0) {
      await supabase.from("hitos_kr").delete().in("id", aBorrar);
    }
  }

  revalidatePath("/okrs");
  revalidatePath("/");
  revalidatePath(`/kr/${krId}`);
  return undefined;
}

// ------------------------------------------------------------
// Borrado
//
// La app no tenía forma de borrar objetivos ni KRs: se podían crear y
// editar, pero no dar de baja. Es lo que faltaba para poder limpiar datos
// de prueba desde la pantalla, sin un script contra la base.
//
// El borrado es en cascada por FK: un OKR trimestral se lleva sus KRs, y
// cada KR sus check-ins, hitos, iniciativas y compromisos. SOLOP y las
// métricas de cliente solo se desasocian (on delete set null), no se
// borran. La confirmación vive en el cliente.
// ------------------------------------------------------------

export async function deleteKeyResult(krId: string): Promise<FormActionState> {
  const veto = await vetoDeBorrado();
  if (veto) return { error: veto };

  const supabase = await createClient();
  const { error } = await supabase.from("key_results").delete().eq("id", krId);
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  revalidatePath("/okrs/colaborativos");
  revalidatePath("/");
  return undefined;
}

export async function deleteOkrTrimestral(
  okrId: string
): Promise<FormActionState> {
  const veto = await vetoDeBorrado();
  if (veto) return { error: veto };

  const supabase = await createClient();
  const { error } = await supabase
    .from("okr_trimestral")
    .delete()
    .eq("id", okrId);
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  revalidatePath("/okrs/colaborativos");
  revalidatePath("/");
  return undefined;
}
