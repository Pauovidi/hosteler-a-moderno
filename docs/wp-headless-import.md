# WooCommerce Import Operativo

## Objetivo

Importar el catálogo actual del frontend hacia un WooCommerce nuevo sin cambiar las URLs públicas del sitio.

## Fuente usada por el importador

- Catálogo normalizado actual: `lib/data/products.json`
- Mapping de categorías/subcategorías y slugs públicos: `data/visibility/products.csv`
- Imágenes locales: `public/media/...`

## Script

- Dry run:
  - `npm run wp:import:dry-run`
- Importación real:
  - `npm run wp:import`

## Flags útiles

- `--dry-run`
- `--limit 10`
- `--product-id 7295638`
- `--product-slug copa-de-vino-sublym-55-grabada-con-tu-logo`
- `--skip-images`
- `--refresh-media-cache`
- `--report out/mi-reporte.json`

## Variables necesarias

- `WP_BASE_URL`
- `WC_CONSUMER_KEY`
- `WC_CONSUMER_SECRET`
- `WP_APP_USER`
- `WP_APP_PASSWORD`

Opcional:

- `HEADLESS_SOURCE_SITE_URL`
  - solo se usa como fallback para imágenes si no se suben por media API

## Qué crea/actualiza

- Categorías WooCommerce usando los slugs públicos actuales
- Subcategorías WooCommerce con parent correcto
- Productos simples WooCommerce
- Metadatos custom para mantener el mapping Next <-> Woo

## Idempotencia

La reejecución no debe duplicar productos:

- busca primero por `legacy_id` usando `sku`
- cae a búsqueda por slug Woo si hace falta
- actualiza si ya existe
- crea si no existe

## Metadatos importantes

Cada producto importado guarda:

- `ph_legacy_id`
- `ph_frontend_slug`
- `ph_frontend_path`
- `ph_data_slug`
- `ph_category_paths`
- `ph_option_tiers`
- `ph_features`
- `ph_personalizations`
- `ph_source_hash`
- `ph_legacy_url`

## Imágenes

Estrategia por orden:

1. Reutilizar caché local `out/wp-headless-media-cache.json`
2. Subir binario local por `wp/v2/media`
3. Si no hay credenciales de media y existe `HEADLESS_SOURCE_SITE_URL`, pasar URL pública como fallback

## Reporte

Por defecto genera:

- `out/wp-headless-import-report.json`

Incluye:

- categorías creadas/reutilizadas
- productos creados/actualizados/fallidos
- imágenes subidas/reutilizadas
- conflictos parciales

## Flujo recomendado

1. Ejecutar `npm run wp:import:dry-run`
2. Revisar `out/wp-headless-import-report.json`
3. Ejecutar importación real con lote pequeño
4. Validar en WooCommerce categorías, slugs, imágenes y productos
5. Ejecutar importación completa
6. Activar lectura desde Woo en `preview` con `HEADLESS_PRODUCTS_MODE=prefer-woo`

## Límites del MVP

- No crea checkout ni variaciones Woo complejas
- Las opciones actuales quedan como metadatos de catálogo
- No sincroniza cambios de vuelta al dataset actual
