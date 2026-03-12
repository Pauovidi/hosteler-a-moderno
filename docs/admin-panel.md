# Panel admin v1

## Objetivo

Panel mínimo dentro de la misma app Next.js para que un único cliente administre:

- productos: crear, editar, borrar, publicar/despublicar
- blog: crear, editar, borrar, publicar/despublicar

La web pública y sus URLs legacy se mantienen. El contenido editable en base de datos tendrá prioridad sobre el sistema actual; si no existe, se conserva el fallback a JSON/CSV.

## Arquitectura

- UI admin bajo `/admin`
- autenticación simple por cookie `HttpOnly` firmada
- persistencia en Postgres compatible con Vercel mediante `DATABASE_URL`
- imágenes nuevas en Vercel Blob mediante `BLOB_READ_WRITE_TOKEN`
- revalidación de rutas públicas al guardar/publicar/borrar
- render público con estrategia `DB -> fallback actual`

## Variables de entorno

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:...
ADMIN_SESSION_SECRET=...
DATABASE_URL=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Notas:

- en local también se admite `ADMIN_PASSWORD` para acelerar setup, pero en producción se recomienda `ADMIN_PASSWORD_HASH`
- el hash se genera con `npm run admin:hash -- <password>`
- si `DATABASE_URL` no está configurado, la web pública sigue estable y el panel entra en modo seguro sin persistencia editable
- si falta `BLOB_READ_WRITE_TOKEN`, el panel puede funcionar sin nuevas subidas de imagen

## Esquema inicial

Se crean de forma idempotente dos tablas:

- `editable_products`
- `editable_blog_posts`

Ambas guardan metadatos de listado (`slug`, `title`, `status`, etc.) y un `payload` JSONB con el contenido completo para no forzar una migración grande del modelo actual.

## Fases

1. Infraestructura base: auth, DB, shell admin, documentación.
2. CRUD de productos y lectura pública desde DB con fallback.
3. CRUD de blog y lectura pública desde DB con fallback.
4. Validación, revalidación de rutas y cierre técnico.
