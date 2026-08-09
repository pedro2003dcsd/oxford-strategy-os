"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribir, vetoDeEscritura } from "@/lib/permisos";

export type FormActionState = { error?: string } | undefined;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string) {
  return str(formData, key) || null;
}

function num(formData: FormData, key: string) {
  return Number(formData.get(key)) || 0;
}

/** Las ceremonias se cargan en un campo de texto separado por comas: son
 * tres o cuatro por cuenta y una tabla aparte para eso sería ceremonia. */
function lista(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function revalidarClientes() {
  revalidatePath("/clientes");
  revalidatePath("/solop");
  revalidatePath("/kata");
  revalidatePath("/kpis-clientes");
}

// ------------------------------------------------------------
// Clientes
// ------------------------------------------------------------

export async function createCliente(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const nombre = str(formData, "nombre");
  if (!nombre) return { error: "El nombre del cliente es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    nombre,
    estado: str(formData, "estado") || "activo",
    fee_mensual: num(formData, "fee_mensual"),
    pod_asignado: optionalStr(formData, "pod_asignado"),
    looker_studio_url: optionalStr(formData, "looker_studio_url"),
    logo_url: optionalStr(formData, "logo_url"),
    ceremonias: lista(formData, "ceremonias"),
  });

  // 23505 = unique_violation sobre lower(nombre). El mensaje de Postgres no
  // le dice nada a quien está cargando la cuenta.
  if (error) {
    return {
      error:
        error.code === "23505"
          ? `Ya existe un cliente llamado "${nombre}".`
          : error.message,
    };
  }

  revalidarClientes();
  return undefined;
}

export async function updateCliente(
  clienteId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const nombre = str(formData, "nombre");
  if (!nombre) return { error: "El nombre del cliente es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nombre,
      estado: str(formData, "estado") || "activo",
      fee_mensual: num(formData, "fee_mensual"),
      pod_asignado: optionalStr(formData, "pod_asignado"),
      looker_studio_url: optionalStr(formData, "looker_studio_url"),
      logo_url: optionalStr(formData, "logo_url"),
      ceremonias: lista(formData, "ceremonias"),
      actualizado_at: new Date().toISOString(),
    })
    .eq("id", clienteId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? `Ya existe un cliente llamado "${nombre}".`
          : error.message,
    };
  }

  revalidarClientes();
  return undefined;
}

export async function deleteCliente(clienteId: string): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", clienteId);

  // 23503 = foreign_key_violation. proyectos_solop.cliente_id es RESTRICT a
  // propósito: borrar una cuenta con horas cargadas dejaría la rentabilidad
  // histórica huérfana.
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "No se puede borrar: el cliente tiene proyectos cargados en SOLOP. Reasignálos o borrálos primero."
          : error.message,
    };
  }

  revalidarClientes();
  return undefined;
}

// ------------------------------------------------------------
// Squad
// ------------------------------------------------------------

export async function addSquadMiembro(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const clienteId = str(formData, "cliente_id");
  const nombre = str(formData, "nombre");
  const rolSquad = str(formData, "rol_squad");

  if (!clienteId || !nombre || !rolSquad) {
    return { error: "Completá el nombre y el rol en el squad." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("squad_miembros").insert({
    cliente_id: clienteId,
    nombre,
    // Opcional: la mitad del squad son proveedores externos sin cuenta.
    usuario_id: optionalStr(formData, "usuario_id"),
    rol_squad: rolSquad,
    especialidad: optionalStr(formData, "especialidad"),
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? `${nombre} ya está cargado como ${rolSquad} en esta cuenta.`
          : error.message,
    };
  }

  revalidarClientes();
  return undefined;
}

export async function removeSquadMiembro(miembroId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("squad_miembros").delete().eq("id", miembroId);
  revalidarClientes();
}

// ------------------------------------------------------------
// Métricas
// ------------------------------------------------------------

export async function upsertMetrica(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const clienteId = str(formData, "cliente_id");
  const titulo = str(formData, "titulo");
  const nivel = Number(formData.get("nivel"));

  if (!clienteId || !titulo || ![1, 2, 3].includes(nivel)) {
    return { error: "Completá el título y elegí un nivel válido." };
  }

  const progreso = num(formData, "progreso_porcentaje");
  if (progreso < 0 || progreso > 100) {
    return { error: "El progreso va de 0 a 100." };
  }

  const campos = {
    cliente_id: clienteId,
    nivel,
    titulo,
    meta: optionalStr(formData, "meta"),
    valor_actual: optionalStr(formData, "valor_actual"),
    unidad: optionalStr(formData, "unidad"),
    progreso_porcentaje: progreso,
    detalle: optionalStr(formData, "detalle"),
    kr_asociado_id: optionalStr(formData, "kr_asociado_id"),
    actualizado_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const metricaId = optionalStr(formData, "metrica_id");

  const { error } = metricaId
    ? await supabase.from("metricas_cliente").update(campos).eq("id", metricaId)
    : await supabase.from("metricas_cliente").insert(campos);

  if (error) return { error: error.message };

  revalidarClientes();
  return undefined;
}

export async function deleteMetrica(metricaId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("metricas_cliente").delete().eq("id", metricaId);
  revalidarClientes();
}
