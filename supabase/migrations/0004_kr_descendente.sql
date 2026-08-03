-- La vista daba por cumplido cualquier KR con valor_actual >= valor_meta, lo
-- que es falso para las métricas que bajan (plazo de cobro de 45 a 25 días,
-- reducción de costos, rotación). Un KR es descendente cuando la meta está
-- por debajo del punto de partida; ahí la comparación se invierte.
-- Se recrean desde cero en vez de con "create or replace": ese comando no
-- puede cambiar la lista de columnas, y el select * de la vista arrastra las
-- columnas nuevas de key_results.
drop view if exists v_alertas_rentabilidad;
drop view if exists v_key_results_estado;

create view v_key_results_estado as
select
  kr.*,
  case
    when kr.tipo_medicion = 'hitos' then
      exists (select 1 from hitos_kr h where h.kr_id = kr.id)
      and not exists (select 1 from hitos_kr h where h.kr_id = kr.id and h.cumplido = false)
    when kr.valor_meta < kr.valor_inicial then
      kr.valor_actual <= kr.valor_meta
    else
      kr.valor_actual >= kr.valor_meta
  end as cumplido
from key_results kr;

-- v_alertas_rentabilidad se apoya en la vista anterior, así que la recreamos
-- para que tome la definición nueva.
create view v_alertas_rentabilidad as
select *
from v_key_results_estado
where cumplido = true
  and margen_actual_pct is not null
  and margen_actual_pct < margen_utilidad_esperado;

grant select on v_key_results_estado, v_alertas_rentabilidad to authenticated;
