@AGENTS.md

# CLAUDE.md — Manual operativo de PETERBELITY

Reglas **permanentes** de cómo trabajar en este repo. El **estado** cambiante del
proyecto (módulos, migraciones, bugs, pendientes) NO va acá: vive en
`ESTADO-DEL-PROYECTO.md`. Este archivo cambia poco; ese otro cambia seguido.

## 1. Identidad del proyecto

- **Nombre interno del producto: PETERBELITY.**
- **Repo / infraestructura: `oxford-strategy-os`** (carpeta, GitHub, Vercel,
  Supabase). Es lo que se ve en las URLs y los nombres de proyecto.
- **No renombrar la infraestructura.** "PETERBELITY" es solo el nombre con el que
  el equipo habla del producto; toda la infra sigue como `oxford-strategy-os`.

## 2. Fuente de verdad

- **`ESTADO-DEL-PROYECTO.md`** — estado funcional y técnico actual (leerlo al
  empezar una sesión nueva).
- **`AGENTS.md`** (importado arriba) — reglas específicas de **Next.js 16**.
- **El código real es la fuente de verdad técnica final.** Si un documento y el
  código se contradicen, **manda el código**; marcá la contradicción y proponé
  actualizar el documento.

## 3. Reglas de Git

- **Nunca `push` / `merge` / `deploy` sin autorización explícita de Pedro.**
- **Nunca `force push`.**
- **Sin `rebase` ni `squash`** salvo pedido explícito.
- **Preferir un commit nuevo antes que `amend`.**
- **Merges fast-forward** cuando corresponda.
- **Antes de tocar git, correr `git status`** y confirmar qué está modificado.
- Commitear solo los archivos que corresponden a la tarea; nunca arrastrar
  cambios ajenos.

## 4. Reglas de Supabase

- **Las migraciones de producción se aplican a mano** (Pedro pega el SQL en el
  editor de Supabase). Este entorno no tiene —ni debe tener— credenciales de
  producción.
- **Nunca ejecutar migraciones en producción sin autorización.**
- **Nunca re-ejecutar una migración marcada como ya aplicada.**
- **Consultar `ESTADO-DEL-PROYECTO.md`** para conocer el estado actual de las
  migraciones.
- **SQL primero, código después.** Si el código sale antes de que la migración
  esté aplicada, las pantallas nuevas rompen.
- **No usar credenciales de producción** en este entorno.

## 5. Reglas de desarrollo

- **Verificar en local antes de dar algo por terminado.** No asumir que algo
  funciona sin probarlo.
- **Antes de escribir código de Next.js, leer la guía relevante en
  `node_modules/next/dist/docs/`** (ver `AGENTS.md`). Recordatorios: el
  middleware es `src/proxy.ts` (no `middleware.ts`) y los `params` de rutas son
  `Promise`.
- **Correr según corresponda** al cambio hecho:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- **No usar `npm audit fix --force`** (bajaría Next.js). Las vulns de
  `postcss`/`sharp` vienen dentro de `node_modules/next`.

## 6. Reglas funcionales que no se deben romper

- **"Pilar" está eliminado conceptualmente.** No reintroducir ese nivel. (Queda
  deuda legacy en tipos/DB documentada en `ESTADO`; no revive el concepto.)
- **Relaciones muchos-a-muchos:** OKR trimestral ↔ OKR anual y KR trimestral ↔
  KR anual. La M:N es la regla, no la excepción.
- **El KR anual tiene meta propia** (`valor_meta`); no es un rollup de los
  trimestrales.
- **Los modales del mapa usan `createPortal` + aislamiento de eventos**
  (cortan `pointerdown`/`click` para no disparar drag/pan/selección; el backdrop
  cierra). **No rediseñar ni redimensionar los modales sin pedido explícito.**
- **No borrar columnas ni tipos legacy todavía** (p. ej. `proyectos_solop.cliente`,
  `key_results.cliente_asociado`, `okr_trimestral.okr_anual_id`, `interface
  Pilar`). Rompen código desplegado.
- **El CRM de Consultoría es un módulo interno de PETERBELITY**, no una app
  aparte. Antes de tocarlo, leer `PLANO-CRM-CONSULTORIA.md`.

## 7. Seguridad y permisos

- **No modificar OKR/KR reales de Oxford salvo pedido explícito** (lectura sí).
- **Para pruebas destructivas, usar solo datos TEMP y limpiarlos después.**
- **No agregar secretos, tokens ni contraseñas** a documentos, código ni
  commits. Tampoco emails personales en la documentación de estado.

## 8. Forma de trabajar con Pedro

- **Ante tareas complejas, hacer todas las preguntas necesarias** si faltan
  decisiones. No arrancar a ciegas.
- **No asumir cambios de producto.** Las decisiones de producto las toma Pedro.
- **Separar diagnóstico, propuesta y ejecución:** primero qué encontré, después
  qué propongo, y ejecutar recién con el OK.
- **Avisar claramente cuando algo depende de estado externo no verificable**
  desde este entorno (Supabase en la nube, Preview/deploy de Vercel, runtime).
