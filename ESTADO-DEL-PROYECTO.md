# Estado del proyecto — Oxford Strategy OS

_Última actualización: 1 de agosto de 2026_

Documento de traspaso: si empezás una conversación nueva con Claude sobre este
proyecto, pedile que lea este archivo primero.

## Qué es

App interna de Grupo Oxford que reemplaza a Tability: OKRs, check-ins
semanales, tablero de dirección (LOM), control de rentabilidad (SOLOP) e
informes ejecutivos. **Está en producción y el equipo la puede usar.**

## Accesos

| Qué | Dónde |
|---|---|
| App en vivo | https://oxford-strategy-os.vercel.app |
| Código | https://github.com/pedro2003dcsd/oxford-strategy-os |
| Base de datos (Supabase) | Proyecto `yxfjimahoxeaebrovkwp` — https://supabase.com/dashboard/project/yxfjimahoxeaebrovkwp |
| Hosting (Vercel) | https://vercel.com/pedro2003dcsds-projects/oxford-strategy-os |
| Copia local | `C:\Users\pedro\Downloads\oxford-strategy-os` |

Cuentas de GitHub, Supabase y Vercel: usuario `pedro2003dcsd` /
`pedrogrupooxford@gmail.com`.

**Crear usuarios para el equipo:** Supabase → Authentication → Users → "Add
user", con "Auto Confirm User" activado. No hay registro público (es
herramienta interna).

## Stack

- **Next.js 16** (App Router, React 19, Tailwind v4). Ojo: Next.js 16 tiene
  cambios respecto a versiones anteriores — `middleware.ts` se llama ahora
  `proxy.ts`, los `params` son `Promise`. Ver `AGENTS.md`.
- **Supabase** (Postgres + Auth). Local vía Docker Desktop + Supabase CLI.
- **Recharts** para gráficos, **@anthropic-ai/sdk** para los informes con IA.

## Módulos construidos

1. **Estructura estratégica** (`/`, `/okrs`) — Estrella Polar, filtros por
   trimestre y área, árbol Pilar → OKR Anual → OKR Trimestral → KR en
   acordeón, modal de crear/editar KRs con checklist de hitos.
2. **Check-in Express** (`/checkin`) — inbox semanal por responsable, carga en
   menos de 2 minutos, botones +/- rápidos, hitos tildables, comentario de
   bloqueos obligatorio en amarillo/rojo, recordatorio SOLOP.
3. **Modo LOM** (`/lom`) — solo desvíos por defecto, sparklines de los últimos
   6 check-ins, último bloqueo citado, compromisos de destrabe, resumen
   ejecutivo descargable.
4. **Torre de Control SOLOP** (`/solop`) — matriz de rentabilidad por
   cliente/proyecto, barras de horas que cambian de color al 75% y 90%,
   filtros por tipo de contrato y estado financiero, modal de sincronización
   con conciliación por hora-hombre. Al guardar, propaga el margen real al KR
   asociado, lo que alimenta las alertas y la Estrella Polar.
5. **Informes automáticos** (`/informes`) — LOM semanal, retrospectiva
   trimestral y reporte de área. Usa la API de Claude si hay
   `ANTHROPIC_API_KEY`; si no, genera el informe por reglas sobre los mismos
   datos y lo avisa en pantalla.

## Base de datos

Migraciones en `supabase/migrations/`:

- `0001_init.sql` — pilares, okr_anual, okr_trimestral, key_results, hitos_kr,
  check_ins. Incluye trigger que sincroniza `key_results` con el último
  check-in, vistas de estado/alertas, RLS y GRANTs.
- `0002_compromisos_lom.sql` — compromisos de destrabe de la LOM.
- `0003_proyectos_solop.sql` — proyectos con horas, facturación y costos.

**Importante:** las migraciones se aplican a mano en la nube. Cuando se crea
una tabla nueva, hay que pegar el SQL en el editor de Supabase
(`https://supabase.com/dashboard/project/yxfjimahoxeaebrovkwp/sql/new`) además
de correrla en local. Las tres ya están aplicadas en producción.

## Pendientes / decisiones tomadas

- **Datos de ejemplo:** hay KRs marcados `[DEMO]` y proyectos SOLOP de prueba
  (Acme, Globex, Initech). Reemplazarlos cuando el equipo cargue lo real.
- **Margen SOLOP: carga manual.** Se decidió cargar el margen a mano desde la
  Torre de Control. El campo queda listo para integrar una API o export de
  SOLOP más adelante.
- **IA en informes: opcional.** Falta configurar `ANTHROPIC_API_KEY` en Vercel
  (crear cuenta en console.anthropic.com, cargar crédito, generar key,
  agregarla en Settings → Environment Variables). Sin eso el módulo funciona
  igual con informes por reglas.
- `npm audit` reporta vulnerabilidades en `postcss`/`sharp` que vienen dentro
  de `node_modules/next`. Arreglarlas con `--force` bajaría Next.js a la v9 y
  rompería el proyecto; se dejaron como están a la espera de una actualización
  de Next.

## Flujo de trabajo

1. Editar código en local.
2. `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. Probar en local (necesita Docker Desktop abierto + `npx supabase start`).
4. `git push` → Vercel despliega solo en 1-2 minutos.
