-- ============================================================
-- Posición de cada nodo en el mapa de Alineación
--
-- El mapa deja de ser dos columnas fijas y pasa a ser un lienzo tipo mapa
-- conceptual: cada OKR (anual o trimestral) es un cuadro que se arrastra
-- libremente. Las relaciones son sólo entre niveles equivalentes —OKR anual
-- ↔ OKR trimestral y KR anual ↔ KR trimestral, nunca OKR con KR— y viven en
-- okr_alineacion / kr_alineacion, no acá. Acá sólo se guarda la posición
-- (x, y) de cada cuadro para que el acomodo quede fijo y todos vean el mismo
-- mapa.
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
