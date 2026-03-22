# Activación Preview WordPress/Woo Headless

## Objetivo de esta fase

Activar un preview real contra WordPress/WooCommerce sin tocar producción, sin cambiar URLs públicas y manteniendo el blog histórico en fallback.

## Estado esperado al terminar

- Importación limitada de productos hecha contra WooCommerce real
- Preview con:
  - `HEADLESS_PRODUCTS_MODE=prefer-woo`
  - `HEADLESS_CATEGORIES_MODE=prefer-woo`
  - `HEADLESS_POSTS_MODE=fallback`
- Producción intacta
- URLs públicas intactas

## Checklist mínima en WordPress nuevo

### 1. WordPress limpio

- Instalar WordPress en HTTPS.
- Crear un usuario admin técnico para la integración.
- En `Settings > Permalinks`, dejar cualquier opción que no sea `Plain`.

Nota:
- Esto es importante para la REST API de WooCommerce.

### 2. WooCommerce instalado

- Instalar y activar WooCommerce.
- Completar el asistente solo en lo imprescindible.
- No configurar pagos.
- No configurar checkout real.
- No usar WordPress como frontend público.

Decisión operativa de este MVP:
- Para preview no hace falta plugin extra de catalog mode si el frontend público sigue siendo Next y no expones cart/checkout al usuario final.
- Basta con usar WooCommerce como backoffice y dejar pagos desactivados.

### 3. REST API keys de WooCommerce

- Ir a `WooCommerce > Settings > Advanced > REST API`.
- Crear una key `Read/Write`.
- Guardar:
  - `WC_CONSUMER_KEY`
  - `WC_CONSUMER_SECRET`

### 4. Application Password de WordPress

- Ir a `Users > Profile`.
- En `Application Passwords`, crear una contraseña para la integración.
- Guardar:
  - `WP_APP_USER`
  - `WP_APP_PASSWORD`

## Variables necesarias en Preview

- `WP_BASE_URL`
- `WC_CONSUMER_KEY`
- `WC_CONSUMER_SECRET`
- `WP_APP_USER`
- `WP_APP_PASSWORD`
- `HEADLESS_PRODUCTS_MODE=prefer-woo`
- `HEADLESS_CATEGORIES_MODE=prefer-woo`
- `HEADLESS_POSTS_MODE=fallback`
- `HEADLESS_REVALIDATE_SECONDS=300`
- `NEXT_REVALIDATE_SECRET`
- `HEADLESS_SOURCE_SITE_URL`

## Flujo operativo exacto

### Paso 1. Verificación local previa

```bash
npm run lint
npm run build
```

### Paso 2. Dry run del importador

```bash
npm run wp:import:dry-run
```

Qué revisar:

- que el reporte no tenga conflictos graves de slug
- que las categorías esperadas aparezcan
- que los productos limitados tengan `frontendPath` correcto

### Paso 3. Import real pequeño

Ejemplo con lote corto:

```bash
npm run wp:import -- --limit 10
```

Ejemplo con un producto concreto:

```bash
npm run wp:import -- --product-id 7295638
```

### Paso 4. Activar preview headless

En el entorno preview de Vercel:

- `HEADLESS_PRODUCTS_MODE=prefer-woo`
- `HEADLESS_CATEGORIES_MODE=prefer-woo`
- `HEADLESS_POSTS_MODE=fallback`

### Paso 5. Revalidar preview

```bash
curl -X POST "$PREVIEW_URL/api/revalidate" ^
  -H "Content-Type: application/json" ^
  -d "{\"secret\":\"$NEXT_REVALIDATE_SECRET\",\"paths\":[\"/\",\"/blog\",\"/cristaleria-personalizada\"],\"tags\":[\"headless-products\",\"headless-categories\"]}"
```

En PowerShell, si prefieres:

```powershell
$body = @{
  secret = $env:NEXT_REVALIDATE_SECRET
  paths = @("/", "/blog", "/cristaleria-personalizada")
  tags = @("headless-products", "headless-categories")
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$env:PREVIEW_URL/api/revalidate" -ContentType "application/json" -Body $body
```

## QA ultra práctica de “listo para probar”

### Home

- abre `/`
- el menú carga
- no hay enlaces rotos
- el bloque de categorías sigue visible

### Menú de categorías

- el header muestra categorías padre
- el desplegable muestra subcategorías
- al hacer clic, los links siguen siendo rutas del frontend

### Listados

- abrir una categoría raíz como `/cristaleria-personalizada`
- abrir una subcategoría como `/copas-de-vino-personalizadas`
- comprobar que cargan productos y no un 404

### PDP

- abrir 2 o 3 URLs legacy reales `/p<ID>-slug.html`
- confirmar título, descripción, imagen principal y opciones de catálogo

### Rutas legacy

- abrir una categoría legacy `/c<ID>-slug.html`
- abrir un producto legacy `/p<ID>-slug.html`
- confirmar que la URL no cambia y la página responde

### Woo admin

- editar un producto importado en Woo
- cambiar por ejemplo el título o la descripción corta
- guardar
- lanzar revalidación
- comprobar en preview que el producto responde y que, si Woo aporta el dato, se refleja sin romper la URL

### Blog

- `/blog` sigue funcionando
- un post histórico sigue saliendo del fallback actual
- no se ha intentado migrar histórico

## Criterio de “listo para probar”

Preview está listo cuando se cumple todo esto:

- `lint` y `build` pasan
- el dry run pasa
- la importación pequeña crea o actualiza productos sin errores bloqueantes
- preview responde con `prefer-woo` en productos y categorías
- las URLs legacy siguen intactas
- el blog histórico sigue en fallback

## Referencias oficiales usadas para esta guía

- WooCommerce REST API keys:
  - [https://woocommerce.com/document/woocommerce-rest-api/](https://woocommerce.com/document/woocommerce-rest-api/)
- WordPress Application Passwords:
  - [https://developer.wordpress.org/advanced-administration/security/application-passwords/](https://developer.wordpress.org/advanced-administration/security/application-passwords/)
