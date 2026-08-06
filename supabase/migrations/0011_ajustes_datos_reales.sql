-- ============================================================
-- Ajustes del modelo contra los datos reales del prototipo
--
-- 0008 se escribió desde la especificación. Al ir a cargar los seis
-- clientes reales aparecieron cosas que la especificación no preveía y que
-- harían imposible migrar la maqueta:
--
-- 1. Medio squad no tiene cuenta en la app. "OMG / Maribel" es una agencia
--    de pauta, "Laura / Gon" son dos personas de medios. Con usuario_id
--    obligatorio contra usuarios_autorizados no entran, y meterlos como
--    usuarios falsos ensuciaría la lista blanca de acceso.
-- 2. Las métricas de cliente no son números. Son "> 7,8x", "$8.000 a
--    $20.000", "24.800". Numeric las rechaza. El número que sí existe y
--    sirve para la barra es el progreso.
-- 3. Los estados de cliente que usa el equipo son activo / en riesgo /
--    onboarding. "pausado" y "baja" me los inventé yo.
-- 4. Las ceremonias son del squad entero, no de cada integrante.
--
-- Corre DESPUÉS de 0008. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Estados que el equipo usa de verdad
-- ------------------------------------------------------------
alter table clientes drop constraint if exists clientes_estado_check;

update clientes set estado = 'activo' where estado in ('pausado', 'baja');

alter table clientes
  add constraint clientes_estado_check
  check (estado in ('activo', 'en_riesgo', 'onboarding'));

-- Las ceremonias son el ritmo de la cuenta (Weekly Quincenal, Retro
-- Mensual), no un atributo de cada persona.
alter table clientes
  add column if not exists ceremonias text[] not null default '{}';

-- ------------------------------------------------------------
-- 2. Squad: nombre libre, cuenta opcional
--
-- `nombre` es la fuente de verdad de quién es. `usuario_id` se completa
-- solo cuando esa persona además tiene acceso a la app, y sirve para
-- cruzar con "Mis Objetivos".
-- ------------------------------------------------------------
alter table squad_miembros
  add column if not exists nombre varchar,
  add column if not exists especialidad varchar;

update squad_miembros sm
set nombre = ua.nombre
from usuarios_autorizados ua
where sm.nombre is null and sm.usuario_id = ua.id;

-- Recién ahora se puede exigir: si se pedía antes, las filas que ya
-- existieran quedarían con nombre nulo y el alter fallaría.
alter table squad_miembros alter column nombre set not null;
alter table squad_miembros alter column usuario_id drop not null;

alter table squad_miembros drop column if exists ceremonias;

-- La unicidad pasa a mirar el nombre: con usuario_id nulo, el unique
-- anterior no agrupaba nada (en SQL dos NULL nunca son iguales) y se
-- podían cargar diez veces al mismo ejecutor externo.
alter table squad_miembros
  drop constraint if exists squad_miembros_cliente_id_usuario_id_rol_squad_key;

create unique index if not exists idx_squad_miembros_unico
  on squad_miembros (cliente_id, lower(nombre), rol_squad);

-- ------------------------------------------------------------
-- 3. Métricas: el valor es texto, el progreso es el número
-- ------------------------------------------------------------
alter table metricas_cliente
  alter column meta type text using meta::text,
  alter column valor_actual type text using valor_actual::text;

alter table metricas_cliente
  add column if not exists progreso_porcentaje numeric not null default 0,
  add column if not exists detalle text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'metricas_cliente_progreso_valido'
  ) then
    alter table metricas_cliente add constraint metricas_cliente_progreso_valido
      check (progreso_porcentaje >= 0 and progreso_porcentaje <= 100);
  end if;
end $$;

-- ------------------------------------------------------------
-- 4. Kata: el responsable puede no tener cuenta
-- ------------------------------------------------------------
alter table kata_condiciones
  add column if not exists responsable_nombre varchar;

update kata_condiciones kc
set responsable_nombre = ua.nombre
from usuarios_autorizados ua
where kc.responsable_nombre is null and kc.responsable_id = ua.id;

-- ------------------------------------------------------------
-- 5. PDCA: el ciclo tiene cuatro estados, no tres
--
-- La especificación pedía en_curso / validado / descartado. Le falta el
-- primero del ciclo: un experimento diseñado y todavía no arrancado. Sin
-- `planificado` no hay dónde poner la mitad del Kata, así que se suma.
-- validado y descartado siguen siendo los cierres.
-- ------------------------------------------------------------
alter table pdca_experimentos drop constraint if exists pdca_experimentos_estado_check;

alter table pdca_experimentos
  add constraint pdca_experimentos_estado_check
  check (estado in ('planificado', 'en_curso', 'validado', 'descartado'));

alter table pdca_experimentos
  add column if not exists aprendizaje text;

-- ------------------------------------------------------------
-- 6. Evaluación 360: faltaban dos bloques
--
-- `tendencia` son los puntajes de los últimos meses y `matriz` es el
-- Tablero de Seguimiento completo. Ninguno entraba en las cuatro columnas
-- de 0008 y sin ellos la pantalla de KPIs pierde el gráfico y la grilla.
-- ------------------------------------------------------------
alter table evaluaciones_360
  add column if not exists tendencia_json jsonb not null default '[]'::jsonb,
  add column if not exists matriz_json jsonb not null default '[]'::jsonb;
