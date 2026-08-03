import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  systemPrompt,
  userPrompt,
  TIPOS_REPORTE,
  SECCIONES_INFORME,
  type DatosInforme,
  type TipoReporte,
} from "@/lib/informes";
import { generarResumenLom } from "@/lib/resumen-lom";
import { generarInformeFallback } from "@/lib/informes-fallback";
import type {
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
  ProyectoSolop,
} from "@/lib/types";

export async function POST(request: Request) {
  // La app es interna: sin sesión, no se genera nada (ni se gasta API).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  let body: {
    tipoReporte?: string;
    area?: string;
    trimestre?: string;
    anio?: number;
    secciones?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const tipoReporte = body.tipoReporte as TipoReporte;
  if (!TIPOS_REPORTE.includes(tipoReporte)) {
    return Response.json({ error: "Tipo de reporte inválido." }, { status: 400 });
  }

  const trimestre = body.trimestre ?? "Todos";
  const anio = body.anio ?? new Date().getFullYear();
  const area = body.area && body.area !== "Todas" ? body.area : undefined;

  const { data: krsData, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      okr_trimestral (
        *,
        okr_anual ( *, pilares ( * ) )
      )`
    )
    .order("titulo");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let krs = (krsData ?? []) as unknown as KeyResultCompleto[];
  krs = krs.filter((kr) => {
    if (trimestre !== "Todos" && kr.okr_trimestral?.trimestre !== trimestre) return false;
    if (area && kr.okr_trimestral?.area !== area) return false;
    return true;
  });

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

  // La Torre de Control es opcional: si la tabla no existe todavía en esta
  // base, seguimos sin datos de rentabilidad en vez de romper el informe.
  const { data: proyectosData } = await supabase.from("proyectos_solop").select("*");
  const proyectos = (proyectosData ?? []) as ProyectoSolop[];

  const seccionesPedidas = Array.isArray(body.secciones)
    ? SECCIONES_INFORME.filter((s) => (body.secciones as unknown[]).includes(s))
    : undefined;

  const datos: DatosInforme = {
    krs,
    checkIns,
    compromisos,
    proyectos,
    tipoReporte,
    area,
    trimestre,
    anio,
    secciones:
      seccionesPedidas && seccionesPedidas.length > 0
        ? seccionesPedidas
        : undefined,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      markdown: generarFallback(datos),
      fuente: "reglas",
      motivo: "Falta configurar ANTHROPIC_API_KEY.",
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: systemPrompt(tipoReporte),
      messages: [{ role: "user", content: userPrompt(datos) }],
    });

    if (message.stop_reason === "refusal") {
      return Response.json({
        markdown: generarFallback(datos),
        fuente: "reglas",
        motivo: "La IA no pudo procesar este pedido; se usó el informe automático.",
      });
    }

    const markdown = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!markdown) {
      return Response.json({
        markdown: generarFallback(datos),
        fuente: "reglas",
        motivo: "La IA devolvió una respuesta vacía; se usó el informe automático.",
      });
    }

    return Response.json({ markdown, fuente: "ia" });
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({
      markdown: generarFallback(datos),
      fuente: "reglas",
      motivo: `No se pudo usar la IA (${motivo}); se usó el informe automático.`,
    });
  }
}

function generarFallback(d: DatosInforme): string {
  if (d.tipoReporte === "semanal_lom") {
    return generarResumenLom(d.krs, d.checkIns, d.compromisos);
  }
  return generarInformeFallback(d);
}
