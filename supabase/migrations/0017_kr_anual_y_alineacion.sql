-- ============================================================
-- KR anual y la alineación muchos-a-muchos (OKR y KR)
--
-- Hasta acá los Key Results vivían solo a nivel trimestral. El OKR anual
-- tenía título y objetivo, pero ningún resultado propio. La reunión del
-- 11/09 (Mateo, Mariana, Pedro) definió sumar el "KR anual" y poder trazar
-- qué empuja a qué, en un mapa ANUALES | TRIMESTRALES.
--
-- Decisiones que se reflejan en el esquema:
--
--   1. El KR anual tiene meta propia (valor_meta), que carga Dirección/CEO
--      una vez al año y ajusta si cambia la estrategia. Su avance NO se
--      calcula a partir de los KR trimestrales: quedaron en que la relación
--      es solo para el mapa, no para computar un porcentaje. Por eso acá no
--      hay valor_actual ni semáforo; el KR anual es la meta, no un número
--      que se sigue día a día.
--
--   2. La alineación es muchos-a-muchos en LOS DOS niveles:
--        - un OKR trimestral puede colgar de varios OKR anuales;
--        - un KR trimestral puede empujar a varios KR anuales.
--      De ahí dos tablas puente. Sin peso: cada vínculo cuenta igual, es
--      solo relación.
--
-- Aditiva y segura: crea tablas nuevas y semilla la alineación de OKR con
-- los vínculos que YA existen (okr_trimestral.okr_anual_id), sin borrar ni
-- pisar nada. No se resetea ningún dato: lo cargado en Q3 (colaborativos,
-- iniciativas, check-ins) queda intacto, igual que SOLOP y Clientes. El
-- retiro de `pilares` va en una migración posterior, cuando el código ya no
-- lo lea.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. KR anual: resultado que cuelga del OKR anual
-- ------------------------------------------------------------
create table if not exists kr_anual (
  id uuid primary key default gen_random_uuid(),
  okr_anual_id uuid not null references okr_anual(id) on delete cascade,
  titulo text not null,
  tipo_medicion varchar not null default 'porcentaje'
    check (tipo_medicion in ('porcentaje', 'moneda', 'numerico', 'hitos')),
  valor_inicial numeric not null default 0,
  -- La meta que fija el CEO. No hay valor_actual: el KR anual no lleva
  -- seguimiento propio, y su avance tampoco se deriva de los trimestrales.
  valor_meta numeric not null,
  -- Para numerar KR1/KR2 dentro de su OKR anual, igual que el trimestral.
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kr_anual_okr_anual on kr_anual(okr_anual_id);

-- ------------------------------------------------------------
-- 2. Puente OKR trimestral ↔ OKR anual (muchos-a-muchos)
--
-- Reemplaza como fuente de verdad al okr_trimestral.okr_anual_id de un solo
-- padre. Esa columna se mantiene por ahora (la leen las consultas viejas) y
-- se retira más adelante; acá la usamos para sembrar los vínculos actuales.
-- ------------------------------------------------------------
create table if not exists okr_alineacion (
  id uuid primary key default gen_random_uuid(),
  okr_trimestral_id uuid not null references okr_trimestral(id) on delete cascade,
  okr_anual_id uuid not null references okr_anual(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (okr_trimestral_id, okr_anual_id)
);

create index if not exists idx_okr_alineacion_trimestral on okr_alineacion(okr_trimestral_id);
create index if not exists idx_okr_alineacion_anual on okr_alineacion(okr_anual_id);

-- Semilla: todo OKR trimestral que hoy apunta a un anual entra al puente.
-- on conflict do nothing lo hace repetible sin duplicar.
insert into okr_alineacion (okr_trimestral_id, okr_anual_id)
select id, okr_anual_id
from okr_trimestral
where okr_anual_id is not null
on conflict (okr_trimestral_id, okr_anual_id) do nothing;

-- ------------------------------------------------------------
-- 3. Puente KR trimestral ↔ KR anual (muchos-a-muchos)
--
-- Arranca vacío: los KR anuales todavía no existen. Se cargan y vinculan
-- desde el mapa. El par es único, no tiene sentido repetir un vínculo.
-- ------------------------------------------------------------
create table if not exists kr_alineacion (
  id uuid primary key default gen_random_uuid(),
  kr_trimestral_id uuid not null references key_results(id) on delete cascade,
  kr_anual_id uuid not null references kr_anual(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kr_trimestral_id, kr_anual_id)
);

create index if not exists idx_kr_alineacion_trimestral on kr_alineacion(kr_trimestral_id);
create index if not exists idx_kr_alineacion_anual on kr_alineacion(kr_anual_id);

-- ------------------------------------------------------------
-- 4. RLS: mismo criterio que el resto (0015)
--
-- Leer, cualquier autenticado. Escribir, cualquiera menos el rol lectura.
-- ------------------------------------------------------------
alter table kr_anual enable row level security;
alter table okr_alineacion enable row level security;
alter table kr_alineacion enable row level security;

do $$
declare t text;
begin
  foreach t in array array['kr_anual', 'okr_alineacion', 'kr_alineacion'] loop
    execute format('drop policy if exists "lectura autenticada" on %I', t);
    execute format('drop policy if exists "escritura sin rol lectura" on %I', t);
    execute format('drop policy if exists "modificacion sin rol lectura" on %I', t);
    execute format('drop policy if exists "borrado sin rol lectura" on %I', t);

    execute format(
      'create policy "lectura autenticada" on %I
         for select using (auth.role() = ''authenticated'')', t);
    execute format(
      'create policy "escritura sin rol lectura" on %I
         for insert with check (puede_escribir())', t);
    execute format(
      'create policy "modificacion sin rol lectura" on %I
         for update using (puede_escribir()) with check (puede_escribir())', t);
    execute format(
      'create policy "borrado sin rol lectura" on %I
         for delete using (puede_escribir())', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 5. Control: cada tabla nueva tiene que quedar con 4 políticas.
-- ------------------------------------------------------------
select tablename, count(*) as politicas
from pg_policies
where schemaname = 'public'
  and tablename in ('kr_anual', 'okr_alineacion', 'kr_alineacion')
group by tablename
order by tablename;
