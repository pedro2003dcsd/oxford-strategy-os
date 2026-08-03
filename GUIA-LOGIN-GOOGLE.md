# Cómo activar el ingreso con Google

_Se hace una sola vez. Toma unos cinco minutos._

Hay un solo dato que vas a tener que pegar en Google. Copialo ahora y tenelo
a mano:

```
https://yxfjimahoxeaebrovkwp.supabase.co/auth/v1/callback
```

---

## Parte A: Google Cloud

### A1. Crear el proyecto

1. Entrá a **https://console.cloud.google.com**
2. Arriba a la izquierda, al lado del logo, hay un selector de proyecto.
   Tocalo y elegí **Proyecto nuevo**.
3. Nombre: `Oxford Strategy OS`. Tocá **Crear**.
4. Esperá unos segundos y asegurate de que el selector de arriba muestre ese
   proyecto y no otro. Es el error más común: configurar todo en el proyecto
   equivocado.

### A2. Configurar la pantalla de permisos

1. En el buscador de arriba escribí **Google Auth Platform** y entrá.
   (En cuentas más viejas aparece como *Pantalla de consentimiento de OAuth*.)
2. Tocá **Comenzar**.
3. Completá:
   - **Nombre de la aplicación:** `Oxford Strategy OS`
   - **Correo de asistencia:** tu mail
   - **Público / Tipo de usuario:** elegí **Externo**
   - **Datos de contacto:** tu mail
4. Aceptá y tocá **Crear**.

### A3. Publicar la aplicación

**Este es el paso donde se traba todo el mundo.** Si lo salteás, solo van a
poder entrar los mails que cargues a mano como usuarios de prueba, y el
resto del equipo va a ver un error.

1. En el menú izquierdo entrá a **Público** (o *Audience*).
2. Vas a ver que el estado dice **Prueba** o *Testing*.
3. Tocá **Publicar aplicación** y confirmá.

No hace falta que Google verifique nada, porque la app solo pide el mail y
el nombre. Eso no cuenta como permiso sensible.

### A4. Crear las credenciales

1. En el menú izquierdo entrá a **Clientes** (o *Credenciales*).
2. Tocá **Crear cliente** / **Crear credenciales → ID de cliente de OAuth**.
3. **Tipo de aplicación:** elegí **Aplicación web**.
4. **Nombre:** `Oxford Strategy OS`
5. Bajá hasta **URI de redireccionamiento autorizados** y tocá **Agregar
   URI**. Pegá exactamente esto, sin espacios ni barra al final:

   ```
   https://yxfjimahoxeaebrovkwp.supabase.co/auth/v1/callback
   ```

   Cuidado: hay dos campos parecidos. El de arriba dice *Orígenes autorizados
   de JavaScript* y ese lo dejás vacío. El que importa es el de
   **redireccionamiento**.

6. Tocá **Crear**.
7. Se abre una ventana con **ID de cliente** y **Secreto del cliente**.
   Dejala abierta o copiá los dos valores a algún lado.

---

## Parte B: Supabase

1. Entrá a **https://supabase.com/dashboard/project/yxfjimahoxeaebrovkwp/auth/providers**
2. Buscá **Google** en la lista y desplegalo.
3. Activá el interruptor **Enable Sign in with Google**.
4. Pegá el **ID de cliente** en `Client ID`.
5. Pegá el **Secreto del cliente** en `Client Secret`.
6. Tocá **Save**.

---

## Parte C: Probar

No hace falta volver a desplegar nada. El botón ya está en el login.

1. Entrá a **https://oxford-strategy-os.vercel.app** y cerrá sesión.
2. Tocá **Entrar con Google** y elegí tu cuenta.
3. Tenés que caer en el Dashboard.

Para confirmar que el filtro funciona, probá con un Gmail que **no** esté
cargado en la pantalla de Equipo. Tiene que rebotarte al login con el
mensaje de que pidas acceso a Dirección.

---

## Si algo falla

**"Error 400: redirect_uri_mismatch"**
La URI de redireccionamiento no coincide. Volvé a A4 y verificá que esté
escrita exactamente igual, sin barra al final.

**"Acceso bloqueado: la app no completó el proceso de verificación"**
Quedó en modo Prueba. Volvé a A3 y publicá la aplicación.

**Entra pero te saca al login diciendo que no estás autorizado**
El mail de Google no está en la lista. Entrá con email y contraseña, andá a
**Equipo** y agregalo.

**No aparece el botón de Google**
Refrescá con `Ctrl+Shift+R`. Si sigue sin verse, revisá que en Supabase el
proveedor haya quedado guardado como activo.

---

## Si preferís no hacerlo ahora

Es opcional. El ingreso con email y contraseña sigue funcionando, y podés
seguir creando cuentas a mano desde Supabase en **Authentication → Users →
Add user**, con *Auto Confirm User* activado. La lista de autorizados aplica
igual a esas cuentas.
