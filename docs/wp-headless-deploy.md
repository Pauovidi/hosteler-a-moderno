# Deploy Headless WordPress + Next

## Topología

- Next.js público en Vercel
- WordPress nuevo separado
- WooCommerce en el mismo WordPress
- Next mantiene el routing público

## Backoffice WordPress/Woo

### Instalar y dejar mínimo

1. Instalar WordPress en un dominio o subdominio privado de CMS.
2. Instalar WooCommerce.
3. Desactivar o ignorar:
   - checkout
   - carrito
   - pedidos
   - pasarelas de pago
4. Mantener el catálogo publicado.

### Credenciales

Crear:

- WooCommerce REST API keys:
  - `WC_CONSUMER_KEY`
  - `WC_CONSUMER_SECRET`
- WordPress Application Password:
  - `WP_APP_USER`
  - `WP_APP_PASSWORD`

## Variables de entorno en Next

- `WP_BASE_URL`
- `WC_CONSUMER_KEY`
- `WC_CONSUMER_SECRET`
- `WP_APP_USER`
- `WP_APP_PASSWORD`
- `NEXT_REVALIDATE_SECRET`
- `HEADLESS_PRODUCTS_MODE`
- `HEADLESS_CATEGORIES_MODE`
- `HEADLESS_POSTS_MODE`
- `HEADLESS_REVALIDATE_SECONDS`
- `HEADLESS_SOURCE_SITE_URL`

## Modos recomendados por entorno

### Local

- `HEADLESS_PRODUCTS_MODE=fallback`
- `HEADLESS_CATEGORIES_MODE=fallback`
- `HEADLESS_POSTS_MODE=fallback`

### Preview

- `HEADLESS_PRODUCTS_MODE=prefer-woo`
- `HEADLESS_CATEGORIES_MODE=prefer-woo`
- `HEADLESS_POSTS_MODE=prefer-wp`

### Producción

Arrancar así:

- `HEADLESS_PRODUCTS_MODE=fallback`
- `HEADLESS_CATEGORIES_MODE=fallback`
- `HEADLESS_POSTS_MODE=prefer-wp`

Subir a:

- `HEADLESS_PRODUCTS_MODE=prefer-woo`
- `HEADLESS_CATEGORIES_MODE=prefer-woo`

solo cuando la importación y el mapping estén validados.

## Revalidación

Endpoint preparado:

- `POST /api/revalidate`

Payload mínimo:

```json
{
  "secret": "NEXT_REVALIDATE_SECRET",
  "paths": ["/blog", "/cristaleria-personalizada"],
  "tags": ["headless-products", "headless-categories", "headless-posts"]
}
```

Si no se envían tags, invalida por defecto:

- `headless-products`
- `headless-categories`
- `headless-posts`

## Orden recomendado de activación

1. Levantar WordPress/Woo
2. Crear credenciales
3. Ejecutar importador en dry-run
4. Ejecutar importación real
5. Validar en preview con modos `prefer-*`
6. Revisar URLs legacy y categorías públicas
7. Promocionar a producción manteniendo fallback disponible

## Estado de verdad durante migración

- Fuente de verdad efectiva: frontend actual y sus datos
- WordPress/Woo:
  - nuevo backoffice
  - destino de importación
  - fuente headless opcional por flags

No se recomienda cambiar a `required` en producción en esta fase.
