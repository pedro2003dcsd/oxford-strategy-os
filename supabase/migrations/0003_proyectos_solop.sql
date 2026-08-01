-- Proyectos SOLOP: carga (por ahora manual) de horas, facturación y costos
-- por cliente/proyecto. Es la fuente del margen real que alimenta las alertas
-- de rentabilidad y la Estrella Polar.
create table proyectos_solop (
  id uuid primary key default gen_random_uuid(),
  cliente varchar not null,
  tipo_contrato varchar not null check (tipo_contrato in ('Fee', 'AdHoc')),
  kr_id uuid references key_results(id) on delete set null,
  horas_presupuestadas numeric not null default 0,
  horas_consumidas numeric not null default 0,
  facturacion_total numeric not null default 0,
  costo_operativo numeric not null default 0,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index idx_proyectos_solop_kr on proyectos_solop(kr_id);
create index idx_proyectos_solop_cliente on proyectos_solop(cliente);

alter table proyectos_solop enable row level security;

create policy "authenticated full access" on proyectos_solop for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on proyectos_solop to authenticated;
