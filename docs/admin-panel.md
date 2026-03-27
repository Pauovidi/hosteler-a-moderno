# Panel admin v1

## Objetivo

Panel mínimo dentro de la misma app Next.js para que un único cliente administre:

- productos: crear, editar, borrar, publicar/despublicar
- blog: crear, editar, borrar, publicar/despublicar

La web pública y sus URLs legacy se mantienen. El contenido editable en base de datos tiene prioridad sobre el sistema actual; si no existe, se conserva el fallback actual.

## Arquitectura final

- web pública en Next.js App Router
- panel admin bajo `/admin`
- autenticación admin por cookie `HttpOnly` firmada
- persistencia editable en DB compatible con Vercel mediante `DATABASE_URL`
- soporte local de QA sin Docker mediante `PGlite` en `scripts/qa-smoke.mjs`
- imágenes opcionales en Vercel Blob mediante `BLOB_READ_WRITE_TOKEN`
- revalidación de listados, detalle y `sitemap.xml` al guardar/publicar/borrar
- lectura pública con estrategia `DB -> fallback actual`

## Estado actual del panel

- `/admin/productos`: listado mixto entre catálogo legacy y registros editables
- `/admin/productos/nuevo` y `/admin/productos/editar`: CRUD de producto con imagen opcional, estado publicado/borrador y SEO básico
- `/admin/blog`: listado mixto entre blog legacy y registros editables
- `/admin/blog/nuevo` y `/admin/blog/editar`: CRUD de entradas con Markdown simple e imagen destacada opcional
- un registro editable publicado en DB pasa a ser la fuente de verdad pública
- un registro editable en borrador oculta el fallback legacy correspondiente
- si se elimina un registro editable ligado a contenido legacy, la web pública recupera el fallback actual

## Variables de entorno

### Base compartida

```bash
NEXT_PUBLIC_WHATSAPP_PHONE=34693039422
ADMIN_USERNAME=admin
ADMIN_SESSION_MAX_AGE_SECONDS=43200
ADMIN_SESSION_SECURE=true
```

### Admin

```bash
ADMIN_PASSWORD=solo_local
ADMIN_PASSWORD_HASH=scrypt:...
ADMIN_SESSION_SECRET=una_cadena_larga_y_aleatoria
```

Notas:

- en local se admite `ADMIN_PASSWORD`
- en preview/production se recomienda `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECURE=true` en preview/production
- en local sobre HTTP conviene `ADMIN_SESSION_SECURE=false`

### Persistencia y media

```bash
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Notas:

- si `DATABASE_URL` no está configurado, la web pública sigue estable y el panel queda sin persistencia editable
- si falta `BLOB_READ_WRITE_TOKEN`, el panel sigue funcionando sin nuevas subidas de imagen

## Archivos de ejemplo

- `.env.example`: inventario completo
- `.env.local.example`: ejemplo local
- `.env.shared.example`: variables comunes
- `.env.preview.example`: ejemplo de preview
- `.env.production.example`: ejemplo de production

No se versionan secretos reales. Los archivos locales esperados para trabajar son, por ejemplo:

- `.env.local`
- `.env.shared`
- `.env.preview`
- `.env.production`

## Estrategia de entorno

### Local

Opción mínima:

```bash
cp .env.local.example .env.local
```

Recomendación:

- usar `ADMIN_PASSWORD` y `ADMIN_SESSION_SECURE=false`
- usar Postgres real si quieres persistencia local estable
- el smoke local usa `PGlite` sin depender de Docker

### Preview

- copiar `.env.preview.example` a `.env.preview`
- completar secretos reales
- empujar variables con Vercel CLI antes del despliegue preview

### Production

- copiar `.env.production.example` a `.env.production`
- completar secretos reales
- empujar variables con Vercel CLI antes del despliegue production

## Hash de contraseña

```bash
npm run admin:hash -- "TuPasswordSegura"
```

Salida esperada:

```bash
scrypt:<salt_hex>:<derived_key_hex>
```

Usa ese valor como `ADMIN_PASSWORD_HASH`.

## Push de variables a Vercel

Script incluido:

```bash
node scripts/push-vercel-env.mjs --common-file .env.shared --preview-file .env.preview --production-file .env.production
```

Alias npm:

```bash
npm run vercel:env:push -- --common-file .env.shared --preview-file .env.preview --production-file .env.production
```

Opciones soportadas:

- `--common-file <ruta>`
- `--preview-file <ruta>`
- `--production-file <ruta>`
- `--token <token>`
- `--scope <scope>`
- `--dry-run`

Comportamiento:

- lee archivos locales no versionados
- hace `vercel env update`
- si la variable no existe, hace fallback a `vercel env add`

Requisitos:

- `vercel` CLI instalada
- proyecto enlazado con `vercel link`, o `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`

Fallback manual documentado:

- si el CLI no puede actualizar alguna variable, usar `vercel env ls`, `vercel env add` o el dashboard solo para ese caso puntual

## Preparar preview

1. Completar `.env.shared` y `.env.preview`.
2. Empujar variables:
   `npm run vercel:env:push -- --common-file .env.shared --preview-file .env.preview`
3. Lanzar deploy preview con Vercel.
4. Validar el panel sobre HTTPS.

## Desplegar a producción

1. Completar `.env.shared` y `.env.production`.
2. Empujar variables:
   `npm run vercel:env:push -- --common-file .env.shared --production-file .env.production`
3. Lanzar deploy production.
4. Validar panel y web pública.

## QA automatizado

Script incluido:

```bash
npm run qa:smoke
```

Qué hace:

- build local de la app
- arranque local en un puerto libre, empezando por `3100`
- smoke de rutas públicas clave con la web pública en modo fallback actual
- validación del contrato `DB -> fallback` contra filas editables reales en una DB local `PGlite`
- CRUD local de productos y blog a nivel de persistencia editable
- deja trazas en `out/qa-smoke-progress.log`
- deja el detalle en `out/qa-smoke-report.json`

Alias útil cuando ya has ejecutado build:

```bash
npm run qa:smoke -- --skip-build
```

## QA preview/prod checklist

### Admin

- `/admin/login` carga sin warning de configuración
- login correcto con credencial real
- logout correcto
- crear producto nuevo
- editar producto
- publicar/despublicar producto
- borrar producto
- crear post nuevo
- editar post
- publicar/despublicar post
- borrar post
- subir imagen si `BLOB_READ_WRITE_TOKEN` está activo

### Pública

- productos legacy `.html`
- blog legacy `p<ID>-...html`
- categorías/subcategorías actuales
- `/p/[slug]`
- `/blog`
- `/blog/[slug]`
- `sitemap.xml`
- `404`

### Fallback DB -> actual

- crear override editable de un producto legacy y comprobar que manda la DB
- dejarlo en borrador y comprobar que desaparece
- eliminar el registro editable y comprobar que vuelve el fallback legacy
- repetir el mismo ciclo con una entrada del blog legacy

## Validación realizada en esta fase

Comprobaciones ejecutadas localmente:

- `npm run lint`
- `npm run build`
- `npm run qa:smoke -- --skip-build`

Resultado:

- lint correcto
- build correcta
- smoke QA correcto con reporte en `out/qa-smoke-report.json`

Warnings no bloqueantes actuales:

- `eslint.config.js` como ESM sin `"type": "module"` en `package.json`
- `baseline-browser-mapping` desactualizado en build

## Limitaciones locales conocidas

En este runner local quedan dos límites conocidos:

- el QA end-to-end del login/logout admin sobre `next start` en HTTP simple no es estable; la validación final del flujo real debe hacerse en preview HTTPS
- la app pública con `DATABASE_URL=pglite://...` devuelve `500` en algunas rutas legacy locales; por eso el smoke valida la web pública en modo fallback y valida `DB -> fallback` directamente sobre la persistencia editable de prueba

Implicación práctica:

- preview y production deben usar Postgres real en `DATABASE_URL`
- la validación final del login/logout real y de subida de imagen debe hacerse en preview HTTPS con credenciales reales
- el resto de endurecimiento, build, estructura de entornos, script de Vercel, QA pública y contrato de fallback quedan implementados y documentados

## Fallback actual que sigue vivo

Mientras no exista un registro editable correspondiente en DB, siguen mandando:

- catálogo legacy importado desde `lib/data/products.json`
- blog legacy importado desde `lib/data/generated-blog.json`
- resolución legacy de productos `.html`
- resolución legacy de blog `p<ID>-...html`
- slugs actuales de categorías/subcategorías

## Estado de Verdad

### Archivos clave

- `app/admin/...`
- `components/admin/...`
- `lib/content/auth.ts`
- `lib/content/db.ts`
- `lib/content/env.ts`
- `lib/content/products-store.ts`
- `lib/content/blog-store.ts`
- `lib/content/revalidate.ts`
- `scripts/admin-password-hash.mjs`
- `scripts/push-vercel-env.mjs`
- `scripts/qa-smoke.mjs`

### Scripts creados o consolidados

- `npm run admin:hash`
- `npm run vercel:env:push`
- `npm run qa:smoke`

### Qué funciona ya

- panel admin embebido en el mismo proyecto
- CRUD de productos y blog
- prioridad `DB -> fallback actual`
- revalidación de rutas públicas
- soporte opcional de Vercel Blob
- documentación operativa para local/preview/production
- push automatizado de variables a Vercel por CLI
- lint, build y smoke QA correctos

### Qué depende de credenciales reales

- acceso admin definitivo del cliente
- DB de preview/production
- subida real de imágenes a Blob
- validación final del login/logout en preview HTTPS
