-- ============================================================
-- Posición de cada nodo en el mapa de Alineación
--
-- El mapa deja de ser dos columnas fijas y pasa a ser un lienzo tipo mapa
-- conceptual: cada OKR (anual o trimestral) es un cuadro que se arrastra a
-- donde uno quiera y se conecta con cualquier otro. Para que el acomodo
-- quede guardado y todos vean el mismo mapa, se guarda la posición (x, y) de
-- cada cuadro.
--
-- Nullable: un OKR recién creado no tiene posición hasta que alguien lo
-- mueve; mientras tanto el mapa lo ubica solo con una posición por defecto.
-- Los KR viven dentro del cuadro de su OKR, así que no llevan posición
-- propia.
--
-- Aditiva e idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

alter table okr_anual
  add column if not exists pos_x double precision,
  add column if not exists pos_y double precision;

alter table okr_trimestral
  add column if not exists pos_x double precision,
  add column if not exists pos_y double precision;
