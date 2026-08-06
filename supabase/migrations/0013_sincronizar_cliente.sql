-- ============================================================
-- Que el cliente_id se resuelva solo
--
-- El backfill de 0008 corrige lo que ya estaba cargado, pero no lo que
-- venga después. La Torre de Control escribe `cliente` como texto libre y
-- no sabe nada de `cliente_id`: cada proyecto nuevo nacía huérfano y la
-- ficha del cliente no lo veía, que es exactamente el problema de dos
-- listas que la tabla `clientes` venía a resolver.
--
-- Se vio al levantar la base local: `db reset` corre las migraciones antes
-- del seed, así que 0008 no encontró ninguna fila y la Cartera quedó vacía.
--
-- El trigger resuelve el cliente por nombre y lo crea si no existe. Así
-- da igual quién escriba: SOLOP, la pantalla de Cartera o el seed.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

create or replace function sincronizar_cliente_por_nombre(nombre_texto text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_nombre text := trim(nombre_texto);
begin
  if v_nombre is null or v_nombre = '' then
    return null;
  end if;

  select id into v_id from clientes where lower(nombre) = lower(v_nombre);
  if v_id is not null then
    return v_id;
  end if;

  insert into clientes (nombre) values (v_nombre)
  on conflict do nothing
  returning id into v_id;

  -- Si otra transacción ganó el insert, el returning viene vacío: se
  -- vuelve a leer en vez de fallar.
  if v_id is null then
    select id into v_id from clientes where lower(nombre) = lower(v_nombre);
  end if;

  return v_id;
end;
$$;

-- ------------------------------------------------------------
-- proyectos_solop
-- ------------------------------------------------------------
create or replace function trg_cliente_proyectos_solop()
returns trigger
language plpgsql
as $$
begin
  -- Si vino explícito, se respeta: la pantalla nueva ya elige el cliente.
  if new.cliente_id is null then
    new.cliente_id := sincronizar_cliente_por_nombre(new.cliente);
  end if;
  return new;
end;
$$;

drop trigger if exists sincronizar_cliente on proyectos_solop;
create trigger sincronizar_cliente
  before insert or update of cliente, cliente_id on proyectos_solop
  for each row execute function trg_cliente_proyectos_solop();

-- ------------------------------------------------------------
-- key_results
-- ------------------------------------------------------------
create or replace function trg_cliente_key_results()
returns trigger
language plpgsql
as $$
begin
  if new.cliente_id is null then
    new.cliente_id := sincronizar_cliente_por_nombre(new.cliente_asociado);
  end if;
  return new;
end;
$$;

drop trigger if exists sincronizar_cliente on key_results;
create trigger sincronizar_cliente
  before insert or update of cliente_asociado, cliente_id on key_results
  for each row execute function trg_cliente_key_results();

-- ------------------------------------------------------------
-- Y se vuelve a pasar por lo que ya está cargado.
--
-- Repetido de 0008 a propósito: acá corre después del seed y después de
-- cualquier fila que se haya insertado entre una migración y otra.
-- ------------------------------------------------------------
update proyectos_solop
set cliente_id = sincronizar_cliente_por_nombre(cliente)
where cliente_id is null;

update key_results
set cliente_id = sincronizar_cliente_por_nombre(cliente_asociado)
where cliente_id is null and cliente_asociado is not null;

grant execute on function sincronizar_cliente_por_nombre(text) to authenticated;
