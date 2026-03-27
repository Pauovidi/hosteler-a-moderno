# WordPress Headless MVP Plan

## Estado de partida auditado

### Fuente de verdad actual

- Productos:
  - Origen operativo actual: `data/exportProducts.csv`
  - Transformación actual: `scripts/import-catalog.js`
  - Salida consumida por el frontend: `lib/data/products.json`
  - Capa runtime actual: `lib/data/products.ts`
- Categorías y subcategorías públicas:
  - Fuente actual para las rutas públicas modernas y el árbol navegable: `data/visibility/products.csv`
  - Índice actual parcial: `lib/catalog/category-index.ts`
  - Menú hardcoded actual: `components/header.tsx`
- Blog:
  - Origen actual: `data/exportBlog.csv`
  - Transformación histórica: `scripts/blog-migrate.js`
  - Salida consumida por el frontend: `lib/data/generated-blog.json`
  - Capa runtime actual: `lib/data/blog.ts` y `lib/content/blog-store.ts`
- Overrides del admin propio actual:
  - Productos y posts editables en DB: `lib/content/db.ts`
  - Publicación pública actual con fallback a JSON: `lib/content/products-store.ts` y `lib/content/blog-store.ts`

### Rutas públicas actuales que no se pueden romper

- Producto legacy canónico:
  - `/p<ID>-<slug>.html`
  - Rewrites actuales en `next.config.mjs` hacia `app/legacy-product/[id]/page.tsx`
- Categoría legacy canónica:
  - `/c<ID>-<slug>.html`
  - Rewrites actuales en `next.config.mjs` hacia `app/legacy-category/[id]/page.tsx`
- Rutas de categoría/subcategoría controladas por Next:
  - `/<category-slug>` por `app/[...legacy]/page.tsx`
  - `/producto/<categoria>` por `app/producto/[categoria]/page.tsx`
- Blog:
  - `/blog`
  - `/blog/p<ID>-<slug>.html`
  - Resuelto por `app/blog/page.tsx` y `app/blog/[slug]/page.tsx`

### Dependencias reales del contrato de URLs

- Canonical product path generado desde `product.id` + slug legacy en `lib/content/products-store.ts`.
- Canonical blog path generado desde `legacyUrl` o `id + slug` en `lib/data/blog.ts` y `lib/content/blog-store.ts`.
- Listados legacy de categorías basados en ID de menú legacy en `app/legacy-category/[id]/page.tsx`.
- Listados públicos modernos basados en slugs presentes en `data/visibility/products.csv`.

## Restricción operativa que gobierna este MVP

Mientras no se valide la importación y el mapping, Next sigue siendo la fuente de verdad efectiva. WordPress/WooCommerce se monta como:

- destino de importación inicial
- nuevo backoffice operativo
- fuente headless opcional por fases, activable con flags

No se cambia ninguna URL pública existente y WordPress no gobierna el routing del frontend.

## Arquitectura MVP propuesta

### Reparto de responsabilidades

- Next.js:
  - sigue siendo el frontend público
  - sigue controlando todas las URLs públicas
  - mantiene fallback al dataset actual
  - hace el mapping entre rutas actuales y contenido Woo/WP
- WordPress:
  - nuevo backoffice headless
  - origen futuro de posts nuevos
- WooCommerce:
  - catálogo de productos editable
  - categorías/subcategorías de producto
  - sin checkout, carrito, pedidos ni lógica de venta

### Modelo de contenidos

- WordPress native posts:
  - posts futuros del blog
  - no se migra el histórico completo en esta fase
- WooCommerce product categories:
  - árbol de navegación de catálogo
  - slugs alineados con las rutas públicas actuales del frontend
- WooCommerce simple products:
  - producto editable en backoffice
  - precio base opcional
  - imágenes
  - descripción larga/corta
  - categorías
  - metadatos custom para preservar el contrato actual

### Metadatos de mapping Next <-> Woo/WP

Cada producto importado a WooCommerce debe conservar metadatos estables:

- `ph_legacy_id`
- `ph_frontend_slug`
- `ph_frontend_path`
- `ph_data_slug`
- `ph_category_paths`
- `ph_option_tiers`
- `ph_personalizations`
- `ph_features`
- `ph_source_hash`

Cada categoría WooCommerce debe conservar:

- `ph_frontend_slug`
- `ph_frontend_path`
- `ph_parent_frontend_slug`

Con esto el frontend puede seguir resolviendo:

- URLs legacy por `legacy_id`
- slugs actuales por `frontend_slug`
- datasets heredados por `ph_data_slug`

## Estrategia de lectura por fases

### Productos

Se introduce una capa adaptadora en Next con tres modos:

- `fallback`: usa solo la fuente actual
- `prefer-woo`: intenta leer WooCommerce y cae al fallback actual si falta mapping o dato
- `required`: exige WooCommerce y solo cae donde esté documentado

La idea del MVP es dejar el código preparado y mantener por defecto `fallback` o `prefer-woo`, nunca forzar el corte todavía.

### Blog

Se introduce una capa adaptadora similar:

- histórico actual: sigue saliendo del dataset existente
- posts futuros: pueden venir de `wp/v2/posts`
- convivencia temporal:
  - si un post existe en WordPress y coincide por slug o mapping, WordPress puede prevalecer
  - si no existe, se mantiene el histórico actual

## Estrategia de importación de productos

### Fuente de importación

- `lib/data/products.json` como representación normalizada del catálogo actual
- `data/visibility/products.csv` como fuente de slugs públicos, categorías/subcategorías y legacy URLs
- `public/media/...` como fuente de binarios de imagen para subir a WordPress

### Reglas del importador

- one-shot pero repetible
- `dry-run`
- idempotencia por `legacy_id` y/o `sku`
- no abortar todo el proceso por conflictos parciales
- generar reporte operativo
- crear primero categorías y luego productos
- subir imágenes de forma robusta reutilizando caché local de media cuando sea posible

### Decisión para WooCommerce

- productos tipo `simple`
- sin stock/checkout/ecommerce avanzado
- las variantes complejas actuales permanecen como metadatos de catálogo, no como variaciones Woo en esta fase

## Estrategia de menú automático

- El menú público del catálogo seguirá viviendo en Next.
- La estructura base será el árbol de categorías/subcategorías.
- En `fallback`, el árbol se obtiene de `data/visibility/products.csv`.
- En `prefer-woo` o `required`, se intenta leer de WooCommerce y se cae al árbol fallback si no cuadra.
- El frontend nunca usa los permalinks públicos de WordPress para decidir enlaces.
- Los enlaces del menú siempre son las rutas públicas actuales del frontend.

## Estrategia de revalidación

- Usar `fetch` cacheado con `revalidate` y tags separadas para:
  - productos
  - categorías
  - posts
- Preparar un endpoint de revalidación de Next protegido por secreto.
- Revalidar por tags y por paths canónicos del frontend.
- La invalidación seguirá orientada a rutas Next, no a permalinks WordPress.

## Riesgos y límites del MVP

- No se migra el histórico completo del blog.
- No hay sincronización bidireccional.
- No se implementa venta online.
- El árbol de categorías Woo debe alinearse estrictamente con los slugs actuales; si no, Next seguirá imponiendo el routing vía mapping.
- El catálogo textil legacy no aparece hoy en el árbol moderno derivado de `data/visibility/products.csv`; se mantendrá en fallback legacy mientras no exista mapping limpio a Woo.
- Sin credenciales reales de WordPress/WooCommerce solo se puede dejar:
  - integración lista
  - importador listo
  - documentación exacta
  - validación local contra fallback

## Plan de implementación aprobado para este repo

1. Crear la capa headless en Next para productos, categorías y blog con fallback por modos.
2. Reusar esa capa dentro de `products-store` y `blog-store` para no romper el admin propio actual.
3. Montar un importador repetible a WooCommerce basado en `products.json` + `visibility/products.csv`.
4. Hacer el menú automático desde categorías manteniendo exactamente las URLs públicas actuales.
5. Preparar blog futuro desde WordPress sin tocar el histórico actual.
6. Añadir endpoint/estrategia de revalidación y documentación operativa.
7. Validar con `npm run lint` y `npm run build`.
