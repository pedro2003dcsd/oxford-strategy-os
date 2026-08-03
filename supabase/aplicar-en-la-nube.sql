-- ============================================================
-- Oxford Strategy OS — actualización de la base en la nube
--
-- Pegar TODO esto en el SQL editor de Supabase y apretar Run:
-- https://supabase.com/dashboard/project/yxfjimahoxeaebrovkwp/sql/new
--
-- Contiene, en orden:
--   1. Migración 0005 — tabla iniciativas + link de trabajo.
--   2. Migración 0004 — arreglo de los KRs descendentes.
--   3. Los datos de demo Q3 2026 con sus iniciativas.
--
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ⚠ El paso 3 BORRA y recarga el árbol estratégico (pilares, OKRs, KRs,
--   check-ins, compromisos y proyectos SOLOP). No toca usuarios.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Iniciativas (capa operativa)
-- ------------------------------------------------------------
-- Va primero porque agrega una columna a key_results, y las vistas del
-- paso 2 se arman con un select * sobre esa tabla.
create table if not exists iniciativas (
  id uuid primary key default gen_random_uuid(),
  kr_id uuid not null references key_results(id) on delete cascade,
  titulo varchar not null,
  responsable varchar,
  estado varchar not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'bloqueado', 'completado')),
  fecha_limite date,
  link_recurso text,
  orden int not null default 0,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_iniciativas_kr on iniciativas(kr_id, orden);
create index if not exists idx_iniciativas_responsable on iniciativas(responsable);

alter table key_results add column if not exists link_trabajo text;

alter table iniciativas enable row level security;

drop policy if exists "authenticated full access" on iniciativas;
create policy "authenticated full access" on iniciativas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on iniciativas to authenticated;

-- ------------------------------------------------------------
-- 2. KRs descendentes
-- ------------------------------------------------------------
-- La vista daba por cumplido cualquier KR con valor_actual >= valor_meta, lo
-- que es falso para las métricas que bajan (plazo de cobro de 45 a 25 días,
-- reducción de costos, rotación).
-- Se recrean desde cero: un "create or replace" no puede cambiar la lista de
-- columnas, y el select * ahora arrastra link_trabajo.
drop view if exists v_alertas_rentabilidad;
drop view if exists v_key_results_estado;

create view v_key_results_estado as
select
  kr.*,
  case
    when kr.tipo_medicion = 'hitos' then
      exists (select 1 from hitos_kr h where h.kr_id = kr.id)
      and not exists (select 1 from hitos_kr h where h.kr_id = kr.id and h.cumplido = false)
    when kr.valor_meta < kr.valor_inicial then
      kr.valor_actual <= kr.valor_meta
    else
      kr.valor_actual >= kr.valor_meta
  end as cumplido
from key_results kr;

create view v_alertas_rentabilidad as
select *
from v_key_results_estado
where cumplido = true
  and margen_actual_pct is not null
  and margen_actual_pct < margen_utilidad_esperado;

grant select on v_key_results_estado, v_alertas_rentabilidad to authenticated;

-- ------------------------------------------------------------
-- 3. Datos de demo Q3 2026
-- ------------------------------------------------------------
-- El contenido es el mismo que supabase/seed.sql. Si ya cargaste ese
-- archivo y solo querés las iniciativas, igual conviene correrlo entero:
-- vuelve a dejar la base exactamente como en la demo local.

begin;

delete from proyectos_solop;
delete from compromisos_lom;
delete from check_ins;
delete from hitos_kr;
delete from iniciativas;
delete from key_results;
delete from okr_trimestral;
delete from okr_anual;
delete from pilares;

insert into pilares (nombre, descripcion, anio) values
  ('Rentabilidad Interna y Excelencia Operativa',
   'Costeo eficiente, control de horas por POD y disciplina de costos fijos.', 2026),
  ('Experiencia del Cliente y Posicionamiento de Marca',
   'NPS, estandarización de entregas y retención de Clientes Estrella.', 2026),
  ('Rediseño Organizacional y Adopción de IA',
   'Agilidad por PODs/Células, mindset data-driven y adopción de IA generativa.', 2026);

do $$
declare
  pilar_rentabilidad uuid;
  pilar_cliente uuid;
  okr_facturacion uuid;
  okr_nps uuid;
  ot uuid;
  kr uuid;
  kr_batistella uuid;
begin
  select id into pilar_rentabilidad from pilares
    where nombre = 'Rentabilidad Interna y Excelencia Operativa';
  select id into pilar_cliente from pilares
    where nombre = 'Experiencia del Cliente y Posicionamiento de Marca';

  insert into okr_anual (pilar_id, titulo, objetivo, responsable)
  values (
    pilar_rentabilidad,
    'Alcanzar $800M en facturación ejecutada manteniendo un margen de utilidad bruta promedio del 68%',
    'Facturación ejecutada (no vendida) de $800M en 2026, con margen de utilidad bruta promedio del 68% sobre el total de la cartera.',
    'Mateo'
  ) returning id into okr_facturacion;

  insert into okr_anual (pilar_id, titulo, objetivo, responsable)
  values (
    pilar_cliente,
    'Lograr un NPS promedio > 70 en los Clientes Estrella de la agencia',
    'Medición trimestral de NPS sobre la cartera de Clientes Estrella (integrales de fee mensual).',
    'Mateo'
  ) returning id into okr_nps;

  -- Comercial / Clientes — Cristóbal Dávalos
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Comercial / Clientes',
          'Acelerar la captación de Clientes Estrella de Fee Mensual',
          'Q3', 2026, 'Cristóbal Dávalos')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Cerrar 3 nuevos contratos integrales de Fee mensual',
          'numerico', 0, 3, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Cristóbal Dávalos', 0, 'rojo', 'Arranque de trimestre, pipeline en armado.', now() - interval '28 days'),
    (kr, 'Cristóbal Dávalos', 1, 'amarillo', 'Primer contrato firmado: Ueno 2026.', now() - interval '21 days'),
    (kr, 'Cristóbal Dávalos', 1, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Cristóbal Dávalos', 2, 'verde', null, now() - interval '7 days'),
    (kr, 'Cristóbal Dávalos', 2, 'verde', 'Tercer contrato en revisión legal, cierre previsto para agosto.', now() - interval '2 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Cierre legal del contrato Ueno 2026', 'Cristóbal Dávalos', 'completado', current_date - 20, 1),
    (kr, 'Propuesta integral para el tercer prospecto', 'Cristóbal Dávalos', 'en_curso', current_date + 12, 2);

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Incrementar la facturación de servicios Ad-Hoc en $150M',
          'moneda', 0, 150000000, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Cristóbal Dávalos', 20000000, 'rojo', 'Ad-Hoc arranca lento, foco puesto en fee mensual.', now() - interval '28 days'),
    (kr, 'Cristóbal Dávalos', 45000000, 'amarillo', null, now() - interval '21 days'),
    (kr, 'Cristóbal Dávalos', 62000000, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Cristóbal Dávalos', 80000000, 'verde', null, now() - interval '7 days'),
    (kr, 'Cristóbal Dávalos', 95000000, 'verde', 'Buen ritmo, traccionado por Batistella y Ueno.', now() - interval '2 days');

  -- Digital — Ayelén Bruno
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Digital',
          'Optimizar la conversión y rendimiento de campañas digitales clave',
          'Q3', 2026, 'Ayelén Bruno')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo,
    cliente_asociado, margen_utilidad_esperado, margen_actual_pct, margen_actualizado_at)
  values (ot, 'Alcanzar $12M de retorno en ventas para el cliente Batistella (Bati Off)',
          'moneda', 0, 12000000, 0, 'rojo',
          'Batistella', 65.0, 54.0, now() - interval '2 days')
  returning id into kr_batistella;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr_batistella, 'Ayelén Bruno', 1500000, 'rojo', 'Campaña recién lanzada, learning phase.', now() - interval '28 days'),
    (kr_batistella, 'Ayelén Bruno', 3200000, 'amarillo', null, now() - interval '21 days'),
    (kr_batistella, 'Ayelén Bruno', 5000000, 'amarillo', 'Rendimiento por debajo de lo proyectado en formatos verticales.', now() - interval '14 days'),
    (kr_batistella, 'Ayelén Bruno', 6400000, 'amarillo', null, now() - interval '7 days'),
    (kr_batistella, 'Ayelén Bruno', 7500000, 'amarillo',
     'El equipo de Arte viene demorado con los adaptados de video en formato vertical para Meta Ads. Si no se entregan esta semana, la pauta pierde rendimiento.',
     now() - interval '2 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr_batistella, 'Adaptar los 6 videos de campaña a formato vertical 9:16',
     'Matías Merlo', 'bloqueado', current_date - 3, 1),
    (kr_batistella, 'Reconfigurar públicos de retargeting en Meta Ads',
     'Ayelén Bruno', 'completado', current_date - 8, 2),
    (kr_batistella, 'Test A/B de creatividades en carrusel',
     'Ayelén Bruno', 'en_curso', current_date + 5, 3),
    (kr_batistella, 'Informe quincenal de ROAS para el cliente',
     'Ayelén Bruno', 'pendiente', current_date + 10, 4);

  -- Arte / Diseño — Matías Merlo
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_nps, 'Arte / Diseño',
          'Estandarizar entregas creativas para cuentas principales',
          'Q3', 2026, 'Matías Merlo')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Entregar el 100% de los kits audiovisuales y creativos de campaña a tiempo',
          'porcentaje', 0, 100, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Matías Merlo', 20, 'rojo', 'Sin proceso estandarizado todavía.', now() - interval '28 days'),
    (kr, 'Matías Merlo', 35, 'rojo', 'Se definió el checklist de entrega por campaña.', now() - interval '21 days'),
    (kr, 'Matías Merlo', 45, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Matías Merlo', 55, 'amarillo', null, now() - interval '7 days'),
    (kr, 'Matías Merlo', 60, 'rojo',
     'Sobrecarga de pedidos Ad-Hoc. Necesitamos reasignar prioridad para Batistella y Ueno antes del martes.',
     now() - interval '2 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Checklist de entrega por campaña', 'Matías Merlo', 'completado', current_date - 12, 1),
    (kr, 'Plantillas maestras en Figma para kits de campaña', 'Matías Merlo', 'en_curso', current_date + 7, 2),
    (kr, 'Priorizar la cola de pedidos Ad-Hoc con Planificación',
     'Laura Bonetto', 'bloqueado', current_date - 1, 3);

  -- Planificación y Operaciones — Laura Bonetto
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Planificación y Operaciones',
          'Garantizar la eficiencia de horas y rentabilidad por proyecto',
          'Q3', 2026, 'Laura Bonetto')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Implementar el módulo de control de horas en SOLOP en el 100% de los PODs',
          'hitos', 0, 3, 0, 'amarillo')
  returning id into kr;

  insert into hitos_kr (kr_id, titulo, cumplido, orden) values
    (kr, 'Carga de plantilla de tarifas', true, 1),
    (kr, 'Capacidad de horas por POD asignada', true, 2),
    (kr, 'Auditoría quincenal de desvíos', false, 3);

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Laura Bonetto', 0, 'amarillo', 'Relevamiento de tarifas por POD en curso.', now() - interval '21 days'),
    (kr, 'Laura Bonetto', 1, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Laura Bonetto', 2, 'verde', null, now() - interval '7 days'),
    (kr, 'Laura Bonetto', 2, 'verde', 'Falta la auditoría quincenal de desvíos, prevista para la semana próxima.', now() - interval '2 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Cargar la plantilla de tarifas por rol', 'Laura Bonetto', 'completado', current_date - 18, 1),
    (kr, 'Asignar capacidad de horas por POD', 'Laura Bonetto', 'completado', current_date - 9, 2),
    (kr, 'Definir la auditoría quincenal de desvíos', 'Laura Bonetto', 'pendiente', current_date + 14, 3);

  -- Administración y Finanzas — Dolores García Díaz
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Administración y Finanzas',
          'Control de costos fijos y cobranzas quincenales',
          'Q3', 2026, 'Dolores García Díaz')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Reducir el plazo medio de cobro a clientes de 45 a 25 días',
          'numerico', 45, 25, 45, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Dolores García Díaz', 45, 'rojo', 'Sin cambios respecto del cierre de Q2.', now() - interval '24 days'),
    (kr, 'Dolores García Díaz', 40, 'amarillo', 'Se depuró la cartera de deudores viejos.', now() - interval '17 days'),
    (kr, 'Dolores García Díaz', 30, 'verde', 'Se implementó el recordatorio automático de vencimientos.', now() - interval '10 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Recordatorio automático de vencimientos', 'Dolores García Díaz', 'completado', current_date - 11, 1),
    (kr, 'Revisión quincenal de cartera con Dirección', 'Dolores García Díaz', 'pendiente', current_date + 6, 2);

  -- Equipo Consciente / Cultura — Mariana García Díaz
  insert into okr_trimestral (area, titulo, trimestre, anio, responsable)
  values ('Equipo Consciente / Cultura',
          'Fomentar el bienestar y la adopción de IA en los PODs',
          'Q3', 2026, 'Mariana García Díaz')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, '100% del equipo capacitado en herramientas de IA generativa',
          'porcentaje', 0, 100, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Mariana García Díaz', 25, 'amarillo', 'Primer taller dictado para Comercial y Digital.', now() - interval '24 days'),
    (kr, 'Mariana García Díaz', 50, 'verde', null, now() - interval '17 days'),
    (kr, 'Mariana García Díaz', 80, 'verde', 'Falta el módulo de práctica con casos reales para el POD de Arte.', now() - interval '10 days');

  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Taller de IA generativa para Comercial y Digital', 'Mariana García Díaz', 'completado', current_date - 22, 1),
    (kr, 'Módulo de práctica con casos reales para el POD de Arte', 'Mariana García Díaz', 'en_curso', current_date + 9, 2);

  -- Torre de Control SOLOP
  insert into proyectos_solop (cliente, tipo_contrato, kr_id,
    horas_presupuestadas, horas_consumidas, facturacion_total, costo_operativo)
  values ('Batistella (Bati Off)', 'Fee', kr_batistella, 100, 88, 12000000, 5520000);

  insert into proyectos_solop (cliente, tipo_contrato,
    horas_presupuestadas, horas_consumidas, facturacion_total, costo_operativo)
  values ('Ueno 2026', 'Fee', 150, 60, 18000000, 5040000);
end $$;

commit;
