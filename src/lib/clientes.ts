import { createClient } from "@/lib/supabase/server";
import { resumenSolop, type ResumenSolop } from "@/lib/clientes-logic";
import type {
  Cliente,
  Evaluacion360,
  KataCondicion,
  MetricaCliente,
  PdcaExperimento,
  ProyectoSolop,
  SquadMiembro,
} from "@/lib/types";

export interface ClienteCompleto extends Cliente {
  squad_miembros: SquadMiembro[];
  metricas_cliente: MetricaCliente[];
  /** Espejo consolidado de SOLOP. Ya no se carga a mano: sale de los
   * proyectos que apuntan a este cliente. */
  solop: ResumenSolop;
}

/** Cartera completa, con squad, métricas y el consolidado de SOLOP.
 *
 * Los proyectos se traen en una sola consulta y se agrupan en memoria: son
 * decenas de filas, no miles, y una consulta por cliente sería un N+1 para
 * pintar seis tarjetas. */
export async function listarClientes(): Promise<ClienteCompleto[]> {
  const supabase = await createClient();

  const [{ data: clientes }, { data: proyectos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("*, squad_miembros ( * ), metricas_cliente ( * )")
      .order("nombre"),
    supabase.from("proyectos_solop").select("*"),
  ]);

  const proyectosPorCliente = new Map<string, ProyectoSolop[]>();
  for (const p of (proyectos ?? []) as ProyectoSolop[]) {
    if (!p.cliente_id) continue;
    if (!proyectosPorCliente.has(p.cliente_id)) {
      proyectosPorCliente.set(p.cliente_id, []);
    }
    proyectosPorCliente.get(p.cliente_id)!.push(p);
  }

  return ((clientes ?? []) as unknown as ClienteCompleto[]).map((c) => ({
    ...c,
    squad_miembros: c.squad_miembros ?? [],
    metricas_cliente: c.metricas_cliente ?? [],
    solop: resumenSolop(proyectosPorCliente.get(c.id) ?? []),
  }));
}

/** Lista mínima para los desplegables de los formularios. */
export async function listarClientesSimple(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").order("nombre");
  return (data ?? []) as Cliente[];
}

export interface CondicionConExperimentos extends KataCondicion {
  pdca_experimentos: PdcaExperimento[];
}

export async function listarCondicionesKata(): Promise<CondicionConExperimentos[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kata_condiciones")
    .select("*, pdca_experimentos ( * )")
    .order("creado_at", { ascending: false });

  return ((data ?? []) as unknown as CondicionConExperimentos[]).map((c) => ({
    ...c,
    pdca_experimentos: c.pdca_experimentos ?? [],
  }));
}

/** Evaluaciones 360, la más reciente de cada cliente primero. */
export async function listarEvaluaciones(): Promise<Evaluacion360[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluaciones_360")
    .select("*")
    .order("periodo", { ascending: false });

  // Los bloques jsonb pueden venir como objeto vacío si la fila se creó
  // sin datos; las pantallas los recorren como array.
  return ((data ?? []) as Evaluacion360[]).map((e) => ({
    ...e,
    notas_comerciales_json: comoArray(e.notas_comerciales_json),
    notas_performance_json: comoArray(e.notas_performance_json),
    notas_relacionamiento_json: comoArray(e.notas_relacionamiento_json),
    kpis_calidad_json: comoArray(e.kpis_calidad_json),
    tendencia_json: comoArray(e.tendencia_json),
    matriz_json: comoArray(e.matriz_json),
  }));
}

function comoArray<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}
