-- ============================================================
-- Oxford Strategy OS — cambios de esquema para la base de la nube
--
-- Pegar TODO esto en el SQL editor de Supabase y apretar Run:
-- https://supabase.com/dashboard/project/yxfjimahoxeaebrovkwp/sql/new
--
-- Contiene las migraciones 0004 a 0007. Es idempotente: se puede correr más
-- de una vez sin romper nada, y no toca los datos existentes.
--
-- DESPUÉS, si querés recargar los datos de demo, pegá por separado el
-- contenido de `supabase/seed.sql` (ese sí borra y recarga el árbol
-- estratégico). Este archivo ya no duplica el seed: mantener dos copias
-- del mismo SQL las desincroniza.
-- ============================================================

-- ------------------------------------------------------------
-- 0005 — Iniciativas (capa operativa)
-- ------------------------------------------------------------
-- Va primero porque agrega una columna a key_results, y las vistas del
-- bloque siguiente se arman con un select * sobre esa tabla.
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
-- 0006 — Compromisos con dueño e histórico de informes
-- ------------------------------------------------------------
alter table compromisos_lom add column if not exists responsable varchar;
alter table compromisos_lom add column if not exists fecha_limite date;

create table if not exists informes_guardados (
  id uuid primary key default gen_random_uuid(),
  tipo_reporte varchar not null,
  titulo varchar not null,
  markdown text not null,
  fuente varchar not null default 'reglas' check (fuente in ('ia', 'reglas')),
  area varchar,
  trimestre varchar,
  anio int,
  creado_por varchar,
  creado_at timestamptz not null default now()
);

create index if not exists idx_informes_guardados_fecha
  on informes_guardados(creado_at desc);

alter table informes_guardados enable row level security;

drop policy if exists "authenticated full access" on informes_guardados;
create policy "authenticated full access" on informes_guardados for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on informes_guardados to authenticated;

-- ------------------------------------------------------------
-- 0004 — KRs descendentes
-- ------------------------------------------------------------
-- Las vistas daban por cumplido cualquier KR con valor_actual >= valor_meta,
-- lo que es falso para las métricas que bajan (plazo de cobro de 45 a 25
-- días, reducción de costos, rotación).
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
-- 0007 — Lista de autorizados y perfiles
-- ------------------------------------------------------------
-- ⚠ CORRER ESTO ANTES de que salga el deploy con login de Google. Con el
-- login habilitado, cualquiera con Gmail puede intentar entrar: esta lista
-- es la única puerta.
create table if not exists usuarios_autorizados (
  id uuid primary key default gen_random_uuid(),
  email varchar not null,
  nombre varchar not null,
  responsable varchar,
  rol varchar not null default 'lider' check (rol in ('direccion', 'lider', 'lectura')),
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

create unique index if not exists idx_usuarios_autorizados_email
  on usuarios_autorizados (lower(email));

-- Semilla: sin esto queda el candado cerrado con la llave adentro.
-- No hay ningún mail escrito a mano: se autorizan las cuentas que ya
-- existen en Supabase, así nadie que hoy entra queda afuera mañana.
insert into usuarios_autorizados (email, nombre, rol)
select
  u.email,
  initcap(replace(split_part(u.email, '@', 1), '.', ' ')),
  'lider'
from auth.users u
where u.email is not null
on conflict do nothing;

-- La cuenta más antigua queda como Dirección, para que haya alguien que
-- pueda administrar la lista. Solo si todavía no hay ninguna.
update usuarios_autorizados
set rol = 'direccion'
where id = (
  select ua.id
  from usuarios_autorizados ua
  join auth.users u on lower(u.email) = lower(ua.email)
  order by u.created_at
  limit 1
)
and not exists (
  select 1 from usuarios_autorizados where rol = 'direccion' and activo
);

-- SECURITY DEFINER a propósito: si leyeran la tabla con RLS puesta, la
-- política que las usa se llamaría a sí misma y entraría en recursión.
create or replace function esta_autorizado()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from usuarios_autorizados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and activo
  );
$$;

create or replace function es_direccion()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from usuarios_autorizados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and rol = 'direccion' and activo
  );
$$;

grant execute on function esta_autorizado() to authenticated;
grant execute on function es_direccion() to authenticated;

alter table usuarios_autorizados enable row level security;

drop policy if exists "lectura autenticada" on usuarios_autorizados;
create policy "lectura autenticada" on usuarios_autorizados
  for select using (auth.role() = 'authenticated');

drop policy if exists "solo direccion administra" on usuarios_autorizados;
create policy "solo direccion administra" on usuarios_autorizados
  for all using (es_direccion()) with check (es_direccion());

grant select, insert, update, delete on usuarios_autorizados to authenticated;
