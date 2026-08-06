-- ============================================================
-- Responsables múltiples en OKRs colaborativos
--
-- `okr_trimestral.responsable` es un solo nombre y se conserva: es quien
-- rinde cuentas del objetivo y es lo que mira "Mis Objetivos".
--
-- Un OKR transversal, en cambio, tiene un referente por área. Eso no entra
-- en una columna de texto ni se deduce de `areas_involucradas`, que nombra
-- áreas y no personas.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

create table if not exists okr_responsables (
  id uuid primary key default gen_random_uuid(),
  okr_trimestral_id uuid not null references okr_trimestral(id) on delete cascade,
  usuario_id uuid not null references usuarios_autorizados(id) on delete cascade,
  -- Por qué área entra esta persona. Puede diferir del área principal del
  -- OKR: en "Vender más Oxford" entra Comercial, pero también Digital.
  area varchar not null check (area in (
    'Comercial / Clientes', 'Digital', 'Arte / Diseño', 'Consultoría',
    'Planificación y Operaciones', 'Administración y Finanzas',
    'Equipo Consciente / Cultura', 'Dirección General'
  )),
  creado_at timestamptz not null default now(),
  unique (okr_trimestral_id, usuario_id, area)
);

create index if not exists idx_okr_responsables_okr on okr_responsables(okr_trimestral_id);
create index if not exists idx_okr_responsables_usuario on okr_responsables(usuario_id);

alter table okr_responsables enable row level security;

drop policy if exists "authenticated full access" on okr_responsables;
create policy "authenticated full access" on okr_responsables for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on okr_responsables to authenticated;
