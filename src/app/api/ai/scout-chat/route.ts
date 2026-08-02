import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  referenciasKr,
  respuestaFallback,
  systemPromptScout,
  type DatosScout,
  type ScoutMessage,
} from "@/lib/scout";
import type {
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
  ProyectoSolop,
} from "@/lib/types";

/** Tope de historial que mandamos a la IA: alcanza para mantener el hilo sin
 * inflar el costo de cada consulta. */
const MAX_MENSAJES = 20;
const MAX_CARACTERES = 4000;

function trimestreActual(): { trimestre: string; anio: number } {
  const hoy = new Date();
  return {
    trimestre: `Q${Math.floor(hoy.getMonth() / 3) + 1}`,
    anio: hoy.getFullYear(),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: "Falta el historial de mensajes." },
      { status: 400 }
    );
  }

  const messages: ScoutMessage[] = [];
  for (const m of body.messages) {
    if (
      typeof m !== "object" ||
      m === null ||
      !("role" in m) ||
      !("content" in m)
    ) {
      return Response.json({ error: "Mensaje inválido." }, { status: 400 });
    }
    const { role, content } = m as { role: unknown; content: unknown };
    if (role !== "user" && role !== "assistant") {
      return Response.json({ error: "Rol inválido." }, { status: 400 });
    }
    if (typeof content !== "string" || content.trim() === "") continue;
    messages.push({ role, content: content.slice(0, MAX_CARACTERES) });
  }

  const historial = messages.slice(-MAX_MENSAJES);
  const ultimo = [...historial].reverse().find((m) => m.role === "user");
  if (!ultimo || historial[historial.length - 1]?.role !== "user") {
    return Response.json(
      { error: "El último mensaje tiene que ser del usuario." },
      { status: 400 }
    );
  }

  const { trimestre, anio } = trimestreActual();

  const { data: krsData, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      okr_trimestral!inner (
        *,
        okr_anual ( *, pilares ( * ) )
      )`
    )
    .eq("okr_trimestral.trimestre", trimestre)
    .eq("okr_trimestral.anio", anio)
    .order("titulo");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const krs = (krsData ?? []) as unknown as KeyResultCompleto[];
  const ids = krs.map((kr) => kr.id);

  let checkIns: CheckIn[] = [];
  let compromisos: CompromisoLom[] = [];
  if (ids.length > 0) {
    const [{ data: c }, { data: comp }] = await Promise.all([
      supabase
        .from("check_ins")
        .select("*")
        .in("kr_id", ids)
        .order("creado_at", { ascending: true }),
      supabase.from("compromisos_lom").select("*").in("kr_id", ids),
    ]);
    checkIns = (c ?? []) as CheckIn[];
    compromisos = (comp ?? []) as CompromisoLom[];
  }

  // La Torre de Control es opcional: si la tabla no existe en esta base,
  // Scout responde igual pero sin datos de rentabilidad.
  const { data: proyectosData } = await supabase
    .from("proyectos_solop")
    .select("*");
  const proyectos = (proyectosData ?? []) as ProyectoSolop[];

  const datos: DatosScout = {
    krs,
    checkIns,
    compromisos,
    proyectos,
    trimestre,
    anio,
  };
  const referencias = referenciasKr(krs);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      respuesta: respuestaFallback(ultimo.content, datos),
      fuente: "reglas",
      motivo: "Falta configurar ANTHROPIC_API_KEY.",
      referencias,
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: systemPromptScout(datos),
      messages: historial.map((m) => ({ role: m.role, content: m.content })),
    });

    if (message.stop_reason === "refusal") {
      return Response.json({
        respuesta: respuestaFallback(ultimo.content, datos),
        fuente: "reglas",
        motivo: "La IA no pudo procesar la consulta; se respondió por reglas.",
        referencias,
      });
    }

    const respuesta = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!respuesta) {
      return Response.json({
        respuesta: respuestaFallback(ultimo.content, datos),
        fuente: "reglas",
        motivo: "La IA devolvió una respuesta vacía; se respondió por reglas.",
        referencias,
      });
    }

    return Response.json({ respuesta, fuente: "ia", referencias });
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({
      respuesta: respuestaFallback(ultimo.content, datos),
      fuente: "reglas",
      motivo: `No se pudo usar la IA (${motivo}); se respondió por reglas.`,
      referencias,
    });
  }
}
