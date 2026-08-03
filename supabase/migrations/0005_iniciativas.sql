-- Capa operativa: las Iniciativas son el trabajo concreto del POD que mueve
-- la aguja de un KR. Un KR responde "qué queremos lograr"; las iniciativas,
-- "qué estamos haciendo esta semana para lograrlo".
create table iniciativas (
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

create index idx_iniciativas_kr on iniciativas(kr_id, orden);
create index idx_iniciativas_responsable on iniciativas(responsable);

-- Link de trabajo del KR (Drive, Notion, Figma): dónde vive el material.
alter table key_results add column link_trabajo text;

alter table iniciativas enable row level security;

create policy "authenticated full access" on iniciativas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on iniciativas to authenticated;
