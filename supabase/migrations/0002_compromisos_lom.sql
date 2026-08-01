-- Compromisos LOM: tareas rápidas de destrabe que la dirección anota
-- sobre un KR desviado durante la reunión de liderazgo.
create table compromisos_lom (
  id uuid primary key default gen_random_uuid(),
  kr_id uuid not null references key_results(id) on delete cascade,
  descripcion text not null,
  cumplido boolean not null default false,
  creado_at timestamptz not null default now()
);

create index idx_compromisos_lom_kr on compromisos_lom(kr_id, creado_at desc);

alter table compromisos_lom enable row level security;

create policy "authenticated full access" on compromisos_lom for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on compromisos_lom to authenticated;
