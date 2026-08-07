-- ============================================================
-- Fusionar dos filas de `clientes` que son la misma cuenta
--
-- Pasa cuando el mismo cliente venía escrito de dos formas en las columnas
-- de texto: `proyectos_solop.cliente` decía "Batistella (Bati Off)" y
-- `key_results.cliente_asociado` decía "Batistella". El backfill de 0008
-- creó una fila por cada forma, porque no tiene manera de saber que son la
-- misma cuenta.
--
-- El script mueve todo lo que cuelga del duplicado al bueno, corrige
-- ADEMÁS las columnas de texto y recién ahí borra el duplicado. Corregir el
-- texto no es opcional: si queda la forma vieja, cualquier fila nueva que
-- se cargue con ese nombre vuelve a crear el duplicado por el trigger
-- de 0013.
--
-- Cambiá los dos nombres de abajo si aparece otro caso.
-- Idempotente: si el duplicado ya no existe, no hace nada.
-- ============================================================

do $$
declare
  -- El nombre que queda.
  nombre_bueno text := 'Batistella (Bati Off)';
  -- El que se absorbe y desaparece.
  nombre_duplicado text := 'Batistella';

  v_bueno uuid;
  v_dup uuid;
  v_movidos int;
begin
  select id into v_bueno from clientes where lower(nombre) = lower(nombre_bueno);
  select id into v_dup from clientes where lower(nombre) = lower(nombre_duplicado);

  if v_bueno is null then
    raise exception 'No existe el cliente "%"', nombre_bueno;
  end if;

  if v_dup is null or v_dup = v_bueno then
    raise notice 'No hay nada que fusionar: "%" no existe como fila aparte.', nombre_duplicado;
    return;
  end if;

  -- Key Results: se corrige el id y el texto de una.
  update key_results
  set cliente_id = v_bueno, cliente_asociado = nombre_bueno
  where cliente_id = v_dup;
  get diagnostics v_movidos = row_count;
  raise notice 'Key Results movidos: %', v_movidos;

  update proyectos_solop
  set cliente_id = v_bueno, cliente = nombre_bueno
  where cliente_id = v_dup;
  get diagnostics v_movidos = row_count;
  raise notice 'Proyectos SOLOP movidos: %', v_movidos;

  -- Las evaluaciones tienen unique (cliente_id, periodo): si el bueno ya
  -- tiene ese período, la del duplicado se descarta en vez de romper.
  delete from evaluaciones_360 d
  where d.cliente_id = v_dup
    and exists (
      select 1 from evaluaciones_360 b
      where b.cliente_id = v_bueno and b.periodo = d.periodo
    );
  update evaluaciones_360 set cliente_id = v_bueno where cliente_id = v_dup;

  -- Squad: mismo criterio, el índice único es (cliente_id, nombre, rol).
  delete from squad_miembros d
  where d.cliente_id = v_dup
    and exists (
      select 1 from squad_miembros b
      where b.cliente_id = v_bueno
        and lower(b.nombre) = lower(d.nombre)
        and b.rol_squad = d.rol_squad
    );
  update squad_miembros set cliente_id = v_bueno where cliente_id = v_dup;

  update metricas_cliente set cliente_id = v_bueno where cliente_id = v_dup;
  update kata_condiciones set cliente_id = v_bueno where cliente_id = v_dup;

  delete from clientes where id = v_dup;
  raise notice 'Fusionado "%" dentro de "%".', nombre_duplicado, nombre_bueno;
end $$;

-- ------------------------------------------------------------
-- Control: no tiene que quedar ningún cliente sin nada colgando.
-- ------------------------------------------------------------
select
  c.nombre,
  (select count(*) from squad_miembros s where s.cliente_id = c.id) as squad,
  (select count(*) from metricas_cliente m where m.cliente_id = c.id) as metricas,
  (select count(*) from proyectos_solop p where p.cliente_id = c.id) as proyectos,
  (select count(*) from key_results k where k.cliente_id = c.id) as krs
from clientes c
order by c.nombre;
