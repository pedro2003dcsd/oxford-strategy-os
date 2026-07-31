-- Oxford Strategy OS — esquema inicial
-- Reemplaza a Tability: Pilares > OKR Anual > OKR Trimestral (por área) > Key Results > Check-ins

create extension if not exists "pgcrypto";

-- 1. Pilares Estratégicos
create table pilares (
  id uuid primary key default gen_random_uuid(),
  nombre varchar not null,
  descripcion text,
  anio int not null default 2026,
  created_at timestamptz not null default now()
);

-- 2. OKRs Anuales de la Empresa
create table okr_anual (
  id uuid primary key default gen_random_uuid(),
  pilar_id uuid references pilares(id) on delete set null,
  titulo varchar not null,
  objetivo text,
  responsable varchar,
  created_at timestamptz not null default now()
);

-- 3. OKRs Trimestrales por Área
-- okr_anual_id es nullable a propósito: permite que un área cree su OKR trimestral
-- y lo alinee a un OKR anual más tarde (o nunca), sin bloquear agilidad ("alineación flexible").
create table okr_trimestral (
  id uuid primary key default gen_random_uuid(),
  okr_anual_id uuid references okr_anual(id) on delete set null,
  area varchar not null check (area in (
    'Comercial / Clientes', 'Digital', 'Arte / Diseño', 'Consultoría',
    'Planificación y Operaciones', 'Administración y Finanzas',
    'Equipo Consciente / Cultura', 'Dirección General'
  )),
  titulo varchar not null,
  trimestre varchar not null check (trimestre in ('Q1', 'Q2', 'Q3', 'Q4')),
  anio int not null default 2026,
  responsable varchar not null,
  created_at timestamptz not null default now()
);

-- 4. Key Results (Resultados Clave)
create table key_results (
  id uuid primary key default gen_random_uuid(),
  okr_trimestral_id uuid references okr_trimestral(id) on delete cascade,
  titulo text not null,
  tipo_medicion varchar not null check (tipo_medicion in ('porcentaje', 'moneda', 'numerico', 'hitos')),
  valor_inicial numeric not null default 0,
  valor_meta numeric not null,
  valor_actual numeric not null default 0,
  estado_semaforo varchar not null default 'verde' check (estado_semaforo in ('verde', 'amarillo', 'rojo')),
  cliente_asociado varchar,
  -- Margen esperado (definido al planificar) vs. margen real (cargado a mano desde SOLOP).
  -- Cuando el KR se da por cumplido con margen_actual_pct por debajo del esperado,
  -- se dispara la alerta de rentabilidad (scope creep).
  margen_utilidad_esperado numeric not null default 65.0,
  margen_actual_pct numeric,
  margen_actualizado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Hitos de KRs Cualitativos
create table hitos_kr (
  id uuid primary key default gen_random_uuid(),
  kr_id uuid not null references key_results(id) on delete cascade,
  titulo varchar not null,
  cumplido boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Histórico de Check-ins Semanales
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  kr_id uuid not null references key_results(id) on delete cascade,
  usuario varchar not null,
  valor_registrado numeric not null,
  estado_semaforo varchar not null check (estado_semaforo in ('verde', 'amarillo', 'rojo')),
  comentario_bloqueos text,
  creado_at timestamptz not null default now()
);

create index idx_okr_anual_pilar on okr_anual(pilar_id);
create index idx_okr_trimestral_anual on okr_trimestral(okr_anual_id);
create index idx_okr_trimestral_area on okr_trimestral(area, anio, trimestre);
create index idx_key_results_okr_trimestral on key_results(okr_trimestral_id);
create index idx_key_results_semaforo on key_results(estado_semaforo);
create index idx_hitos_kr_kr on hitos_kr(kr_id);
create index idx_check_ins_kr on check_ins(kr_id, creado_at desc);

-- Cada check-in nuevo es la foto más reciente del KR: sincroniza valor_actual y semáforo.
create or replace function sync_key_result_from_checkin()
returns trigger as $$
begin
  update key_results
  set valor_actual = new.valor_registrado,
      estado_semaforo = new.estado_semaforo,
      updated_at = now()
  where id = new.kr_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_sync_key_result_from_checkin
after insert on check_ins
for each row execute function sync_key_result_from_checkin();

-- Vista: KR dado por cumplido (numérico llegó a la meta, o todos sus hitos están cumplidos)
create or replace view v_key_results_estado as
select
  kr.*,
  case
    when kr.tipo_medicion = 'hitos' then
      exists (select 1 from hitos_kr h where h.kr_id = kr.id)
      and not exists (select 1 from hitos_kr h where h.kr_id = kr.id and h.cumplido = false)
    else
      kr.valor_actual >= kr.valor_meta
  end as cumplido
from key_results kr;

-- Vista: alerta de rentabilidad — KR cumplido pero con margen real por debajo del esperado
create or replace view v_alertas_rentabilidad as
select *
from v_key_results_estado
where cumplido = true
  and margen_actual_pct is not null
  and margen_actual_pct < margen_utilidad_esperado;

-- RLS: herramienta interna, cualquier usuario autenticado de Grupo Oxford puede leer/escribir.
alter table pilares enable row level security;
alter table okr_anual enable row level security;
alter table okr_trimestral enable row level security;
alter table key_results enable row level security;
alter table hitos_kr enable row level security;
alter table check_ins enable row level security;

create policy "authenticated full access" on pilares for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on okr_anual for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on okr_trimestral for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on key_results for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on hitos_kr for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on check_ins for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- RLS controla qué filas se ven, pero Postgres además exige el GRANT de base
-- para que el rol pueda tocar la tabla; sin esto PostgREST devuelve
-- "permission denied" antes de siquiera evaluar las policies.
grant select, insert, update, delete on
  pilares, okr_anual, okr_trimestral, key_results, hitos_kr, check_ins
to authenticated;
grant select on v_key_results_estado, v_alertas_rentabilidad to authenticated;
