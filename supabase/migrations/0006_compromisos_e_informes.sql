-- Los compromisos de la LOM se anotaban como texto suelto. Para poder
-- revisarlos en la reunión siguiente hace falta saber quién y para cuándo.
alter table compromisos_lom add column if not exists responsable varchar;
alter table compromisos_lom add column if not exists fecha_limite date;

-- Histórico de informes: la dirección necesita volver a la minuta de una LOM
-- pasada sin regenerarla (los datos ya cambiaron y el texto no daría igual).
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
