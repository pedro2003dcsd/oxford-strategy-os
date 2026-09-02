-- ============================================================
-- Área de cada persona en la lista de accesos
--
-- La pantalla Equipo pedía un "Responsable de OKRs" que era texto libre y
-- ya no cumple función: desde que los objetivos se vinculan por id, la
-- identidad de la persona es su nombre. En su lugar se registra el área en
-- la que trabaja, que sí es información útil.
--
-- El área arranca el filtro del Dashboard en lo de cada uno (conveniencia),
-- pero no restringe: todos siguen viendo todo. El aislamiento por área es
-- otra cosa y va con la Etapa 2.
--
-- Queda nullable: los que ya están cargados no tienen área hasta que
-- Dirección se las complete. Sin área, arrancan viendo todo, como hoy.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

alter table usuarios_autorizados
  add column if not exists area varchar
    check (area is null or area in (
      'Comercial / Clientes', 'Digital', 'Arte / Diseño', 'Consultoría',
      'Planificación y Operaciones', 'Administración y Finanzas',
      'Equipo Consciente / Cultura', 'Dirección General'
    ));
