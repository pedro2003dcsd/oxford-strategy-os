-- ============================================================
-- Performance Clientes: modelo relacional
--
-- Hasta acá el cliente era texto suelto en dos lugares distintos
-- (proyectos_solop.cliente y key_results.cliente_asociado). Con dos listas
-- escritas a mano el mismo cliente termina cargado de dos formas y los
-- números dejan de cruzar. Esta migración crea `clientes` como fuente de
-- verdad y apunta las dos columnas ahí.
--
-- Las columnas de texto NO se borran todavía: la app en producción todavía
-- las lee. Se dejan sincronizadas y se quitan en una migración posterior,
-- una vez que el código nuevo esté desplegado. Si se borran acá, SOLOP se
-- rompe en el momento en que se pega este script.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Clientes — fuente de verdad
-- ------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre varchar not null,
  logo_url text,
  estado varchar not null default 'activo'
    check (estado in ('activo', 'pausado', 'baja')),
  fee_mensual numeric not null default 0,
  pod_asignado varchar,
  looker_studio_url text,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

-- Case-insensitive por el mismo motivo que el índice de usuarios_autorizados:
-- "Eseka" y "eseka" tienen que chocar, no convivir.
create unique index if not exists idx_clientes_nombre
  on clientes (lower(nombre));

-- ------------------------------------------------------------
-- 2. Backfill — los clientes que ya existen como texto
--
-- Esto no es semilla de demo: son las filas reales que ya están cargadas.
-- Sin este paso las pantallas nuevas arrancan vacías y SOLOP queda huérfano.
-- ------------------------------------------------------------
insert into clientes (nombre)
select distinct trim(cliente)
from proyectos_solop
where cliente is not null and trim(cliente) <> ''
on conflict do nothing;

insert into clientes (nombre)
select distinct trim(cliente_asociado)
from key_results
where cliente_asociado is not null and trim(cliente_asociado) <> ''
on conflict do nothing;

alter table proyectos_solop
  add column if not exists cliente_id uuid references clientes(id) on delete restrict;

alter table key_results
  add column if not exists cliente_id uuid references clientes(id) on delete set null;

update proyectos_solop p
set cliente_id = c.id
from clientes c
where p.cliente_id is null and lower(trim(p.cliente)) = lower(c.nombre);

update key_results k
set cliente_id = c.id
from clientes c
where k.cliente_id is null and lower(trim(k.cliente_asociado)) = lower(c.nombre);

create index if not exists idx_proyectos_solop_cliente_id on proyectos_solop(cliente_id);
create index if not exists idx_key_results_cliente_id on key_results(cliente_id);

-- ------------------------------------------------------------
-- 3. Squad por cliente
-- ------------------------------------------------------------
create table if not exists squad_miembros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  -- Apunta al perfil, no a auth.users: usuarios_autorizados ya es la fila
  -- que tiene nombre y rol, y es la que administra la pantalla Equipo.
  usuario_id uuid not null references usuarios_autorizados(id) on delete cascade,
  rol_squad varchar not null
    check (rol_squad in ('PO', 'Chapter Lead', 'Ejecutor')),
  ceremonias text[] not null default '{}',
  creado_at timestamptz not null default now(),
  -- Una persona puede ser Chapter Lead y Ejecutor del mismo cliente, pero no
  -- estar cargada dos veces con el mismo rol.
  unique (cliente_id, usuario_id, rol_squad)
);

create index if not exists idx_squad_miembros_cliente on squad_miembros(cliente_id);
create index if not exists idx_squad_miembros_usuario on squad_miembros(usuario_id);

-- ------------------------------------------------------------
-- 4. Métricas de cliente (tres niveles)
-- ------------------------------------------------------------
create table if not exists metricas_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  nivel smallint not null check (nivel in (1, 2, 3)),
  titulo varchar not null,
  meta numeric,
  valor_actual numeric,
  unidad varchar,
  kr_asociado_id uuid references key_results(id) on delete set null,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_metricas_cliente_cliente on metricas_cliente(cliente_id);
create index if not exists idx_metricas_cliente_kr on metricas_cliente(kr_asociado_id);

-- ------------------------------------------------------------
-- 5. Kata: condición objetivo y experimentos PDCA
-- ------------------------------------------------------------
create table if not exists kata_condiciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo varchar not null,
  meta text,
  progreso_porcentaje numeric not null default 0
    check (progreso_porcentaje >= 0 and progreso_porcentaje <= 100),
  obstaculo_actual text,
  siguiente_paso text,
  responsable_id uuid references usuarios_autorizados(id) on delete set null,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_kata_condiciones_cliente on kata_condiciones(cliente_id);

create table if not exists pdca_experimentos (
  id uuid primary key default gen_random_uuid(),
  condicion_id uuid not null references kata_condiciones(id) on delete cascade,
  hipotesis text not null,
  experimento text,
  estado varchar not null default 'en_curso'
    check (estado in ('en_curso', 'validado', 'descartado')),
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_pdca_experimentos_condicion on pdca_experimentos(condicion_id);

-- ------------------------------------------------------------
-- 6. Evaluación 360
--
-- Los cuatro bloques van como jsonb y no como tablas normalizadas porque la
-- grilla de valoración cambia de trimestre a trimestre. Normalizarla obliga
-- a migrar el esquema cada vez que el directorio agrega una fila.
-- ------------------------------------------------------------
create table if not exists evaluaciones_360 (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  periodo varchar not null,
  notas_comerciales_json jsonb not null default '{}'::jsonb,
  notas_performance_json jsonb not null default '{}'::jsonb,
  notas_relacionamiento_json jsonb not null default '{}'::jsonb,
  kpis_calidad_json jsonb not null default '{}'::jsonb,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  unique (cliente_id, periodo)
);

create index if not exists idx_evaluaciones_360_cliente on evaluaciones_360(cliente_id);

-- ------------------------------------------------------------
-- 7. OKRs colaborativos
--
-- Nombres reales de las tablas: no existen `okrs` ni `krs`. El árbol es
-- okr_anual -> okr_trimestral -> key_results.
-- ------------------------------------------------------------
alter table okr_anual
  add column if not exists es_colaborativo boolean not null default false,
  add column if not exists areas_involucradas text[] not null default '{}';

alter table okr_trimestral
  add column if not exists es_colaborativo boolean not null default false,
  add column if not exists areas_involucradas text[] not null default '{}';

alter table key_results
  add column if not exists es_colaborativo boolean not null default false,
  add column if not exists areas_involucradas text[] not null default '{}';

-- Las áreas tienen que ser las mismas ocho que ya valida okr_trimestral.area.
-- Sin esto, un typo en el array crea un área fantasma que no aparece en
-- ningún filtro.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'okr_trimestral_areas_validas'
  ) then
    alter table okr_trimestral add constraint okr_trimestral_areas_validas
      check (areas_involucradas <@ array[
        'Comercial / Clientes', 'Digital', 'Arte / Diseño', 'Consultoría',
        'Planificación y Operaciones', 'Administración y Finanzas',
        'Equipo Consciente / Cultura', 'Dirección General'
      ]::text[]);
  end if;
end $$;

-- ------------------------------------------------------------
-- 8. Historial de cambios (auditoría)
-- ------------------------------------------------------------
create table if not exists okr_historial_cambios (
  id uuid primary key default gen_random_uuid(),
  -- Uno de los dos, según qué se editó. Nunca los dos a la vez.
  okr_id uuid references okr_trimestral(id) on delete cascade,
  kr_id uuid references key_results(id) on delete cascade,
  usuario_id uuid references usuarios_autorizados(id) on delete set null,
  campo_modificado varchar not null,
  valor_anterior text,
  valor_nuevo text,
  fecha timestamptz not null default now(),
  constraint historial_apunta_a_uno check (
    (okr_id is not null and kr_id is null) or
    (okr_id is null and kr_id is not null)
  )
);

create index if not exists idx_historial_okr on okr_historial_cambios(okr_id);
create index if not exists idx_historial_kr on okr_historial_cambios(kr_id);
create index if not exists idx_historial_fecha on okr_historial_cambios(fecha desc);

-- ------------------------------------------------------------
-- 9. RLS — provisoria, igual a la del resto del proyecto
--
-- OJO: esto NO es el aislamiento multitenant. Es la misma política que ya
-- tienen pilares, key_results y proyectos_solop: cualquiera que pasó el
-- filtro de usuarios_autorizados ve todo. Hoy eso es correcto porque los
-- únicos que entran son del equipo.
--
-- El día que exista un rol `cliente` con gente de afuera, estas políticas y
-- las de 0001/0003 hay que reemplazarlas TODAS a la vez. Dejar una sola
-- tabla con "authenticated full access" alcanza para filtrar el resto.
-- ------------------------------------------------------------
alter table clientes enable row level security;
alter table squad_miembros enable row level security;
alter table metricas_cliente enable row level security;
alter table kata_condiciones enable row level security;
alter table pdca_experimentos enable row level security;
alter table evaluaciones_360 enable row level security;
alter table okr_historial_cambios enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'clientes', 'squad_miembros', 'metricas_cliente', 'kata_condiciones',
    'pdca_experimentos', 'evaluaciones_360', 'okr_historial_cambios'
  ] loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format(
      'create policy "authenticated full access" on %I for all
         using (auth.role() = ''authenticated'')
         with check (auth.role() = ''authenticated'')', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end $$;

-- El historial no se edita ni se borra: es auditoría. Se restringe después
-- de crear la política general, que la pisaría.
drop policy if exists "authenticated full access" on okr_historial_cambios;

drop policy if exists "historial solo lectura e inserción" on okr_historial_cambios;
create policy "historial solo lectura e inserción" on okr_historial_cambios
  for select using (auth.role() = 'authenticated');

drop policy if exists "historial inserta" on okr_historial_cambios;
create policy "historial inserta" on okr_historial_cambios
  for insert with check (auth.role() = 'authenticated');

revoke update, delete on okr_historial_cambios from authenticated;
