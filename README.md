# Oxford Strategy OS

Reemplazo interno de Tability para Grupo Oxford: OKRs anuales/trimestrales,
Key Results, check-ins semanales y alertas de rentabilidad, corriendo sobre
Next.js 16 + Supabase (Postgres).

## Stack

- **Frontend**: Next.js 16 (App Router, React 19, Tailwind v4)
- **Backend**: Supabase local (Postgres + Auth), vía Supabase CLI y Docker
- **Gráficos**: Recharts

> **Nota para agentes de IA**: este proyecto usa Next.js 16, que tiene cambios
> respecto a versiones anteriores (`middleware.ts` → `proxy.ts`, `params`
> ahora son `Promise`, etc.). Ver `AGENTS.md` y
> `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
> antes de asumir APIs de versiones previas.

## Requisitos

- Node.js 20.9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — necesario
  para levantar el stack local de Supabase (Postgres, Auth, Studio)

## Setup local

1. **Instalar Docker Desktop** y dejarlo corriendo.

2. **Levantar Supabase local** (desde la carpeta del proyecto):

   ```bash
   npx supabase start
   ```

   La primera vez descarga las imágenes de Docker, puede tardar unos minutos.
   Al terminar, muestra `API URL`, `anon key`, `service_role key` y el link a
   **Supabase Studio** (normalmente `http://127.0.0.1:54323`).

3. **Variables de entorno**: ya existe `.env.local` con los valores por
   defecto que usa Supabase CLI en local (`http://127.0.0.1:54321` + el
   `anon key` demo fijo). Si tu `supabase start` te muestra valores distintos,
   copiá `API URL` y `anon key` a `.env.local`.

4. **Instalar dependencias y correr la app**:

   ```bash
   npm install
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

5. **Crear tu primer usuario**: esta app no tiene registro público (es una
   herramienta interna). Andá a Supabase Studio → Authentication → Users →
   "Add user" y creá un usuario con email/contraseña para poder loguearte.

### Datos

- `supabase/migrations/0001_init.sql` crea las 6 tablas del enunciado (más
  columnas de soporte: `margen_actual_pct` para la carga manual del margen
  real desde SOLOP, timestamps, y un trigger que sincroniza
  `key_results.valor_actual`/`estado_semaforo` con el último check-in).
- `supabase/seed.sql` carga los 3 pilares 2026 reales de Grupo Oxford, más un
  set de datos `[DEMO]` para poder probar la app de entrada. Borrá o
  reemplazá el bloque `DEMO` cuando carguen los OKRs reales.
- Para resetear la base local con las migraciones + seed: `npx supabase db reset`.

## Cómo resuelve los 5 problemas de Tability

1. **Sobrecarga de datos** → el toggle **"Modo LOM"** en el dashboard filtra
   todo lo que no esté en amarillo/rojo.
2. **Check-ins rápidos** → formulario de check-in en la página de cada KR con
   3 campos (usuario, valor, semáforo) + comentario opcional.
3. **Tendencias, no fotos** → cada KR numérico muestra un gráfico de línea
   con el historial completo de check-ins (Recharts).
4. **Alerta de rentabilidad** → cuando un KR se marca como cumplido (llegó a
   la meta, o completó todos sus hitos) pero el `margen_actual_pct` cargado a
   mano está por debajo de `margen_utilidad_esperado`, aparece una alerta en
   el dashboard y en el detalle del KR. Hoy la carga de margen es manual
   (según lo definido); el campo queda listo para integrarlo con una
   exportación/API de SOLOP más adelante.
5. **Alineación flexible** → `okr_trimestral.okr_anual_id` es nullable: un
   área puede crear su OKR trimestral y alinearlo a un OKR anual más tarde
   (o nunca), sin bloquear el arranque del trimestre. La vista `/okrs`
   muestra estos casos en secciones "sin alinear" en vez de impedir crearlos.

## Notas

- `npm audit` reporta 3 vulnerabilidades "high" en `postcss`/`sharp`
  **empaquetadas dentro de `node_modules/next`** por el propio `create-next-app`
  (no por dependencias agregadas). `npm audit fix --force` las resolvería
  bajando Next.js a una versión `9.x`, lo cual rompería el proyecto — no se
  aplicó. Revisar cuando Next.js publique una actualización de esas
  dependencias internas.
- Producción: cuando se quiera pasar de local a Supabase Cloud, correr
  `npx supabase link` y `npx supabase db push`, y actualizar las env vars con
  las credenciales del proyecto cloud.
