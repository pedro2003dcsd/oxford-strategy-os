-- ============================================================
-- Actas de directorio
--
-- La pizarra de la LOM cruza tres cosas: los desvíos de la semana (salen
-- de los check-ins), los compromisos de destrabe (ya existen en
-- compromisos_lom) y las actas del directorio, que hasta ahora vivían en
-- un documento aparte y no se podían mirar junto al resto.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

create table if not exists actas_directorio (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  titulo varchar not null,
  contenido text,
  -- Quién la escribió. Se conserva el nombre y no solo el id: si la cuenta
  -- se da de baja, el acta tiene que seguir diciendo quién la tomó.
  autor_nombre varchar,
  autor_id uuid references usuarios_autorizados(id) on delete set null,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_actas_directorio_fecha on actas_directorio(fecha desc);

alter table actas_directorio enable row level security;

drop policy if exists "authenticated full access" on actas_directorio;
create policy "authenticated full access" on actas_directorio for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant select, insert, update, delete on actas_directorio to authenticated;
