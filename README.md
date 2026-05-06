# Knowin

Webs y automatización con IA para empresas | Andorra

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Installs dependencies                       |
| `npm run dev`     | Starts local dev server at `localhost:4321`  |
| `npm run build`   | Build your production site to `./dist/`     |
| `npm run preview` | Preview your build locally, before deploying|

## Meta Pixel + Conversions API (CAPI)

### Variables de entorno

| Variable               | Scope       | Descripcion                                     |
| :--------------------- | :---------- | :----------------------------------------------- |
| `PUBLIC_FB_PIXEL_ID`   | Client      | ID del Pixel de Meta (expuesta al navegador)     |
| `META_PIXEL_ID`        | Server      | Mismo ID, usado en el endpoint CAPI              |
| `META_CAPI_TOKEN`      | Server      | Token de acceso de la API de Conversiones        |
| `META_TEST_EVENT_CODE` | Server (opt)| Codigo de Test Events para validar en Events Manager |

Las variables ya estan configuradas en Vercel (Production + Preview). Para desarrollo local, crea un archivo `.env` basandote en `.env.example`.

### Arquitectura

1. **Pixel (cliente)** — `src/components/MetaPixel.astro` inyecta el snippet oficial en el `<head>`. Lee `PUBLIC_FB_PIXEL_ID`.
2. **CAPI (servidor)** — `src/pages/api/meta-capi.ts` recibe eventos via POST y los envia a la Graph API con IP, user-agent y PII hasheado (SHA-256).
3. **Helper de tracking** — `src/lib/track.ts` genera un `event_id` unico, dispara `fbq()` en el cliente y llama al endpoint CAPI en paralelo. El `event_id` compartido permite a Meta deduplicar.
4. **Formulario de contacto** — Al enviar con exito, se dispara un evento `Lead` con deduplicacion automatica.

### Testear con Test Events

1. En [Events Manager](https://business.facebook.com/events_manager), ve a **Test Events**.
2. Copia el codigo de test (ej. `TEST12345`).
3. En Vercel, anade la variable `META_TEST_EVENT_CODE` con ese valor en el entorno Preview.
4. Visita la preview URL y envia el formulario.
5. Los eventos apareceran en la pestana **Test Events** en tiempo real.

### Desactivar el codigo de prueba

Simplemente elimina la variable `META_TEST_EVENT_CODE` de Vercel (o dejala vacia). No es necesario modificar codigo.
