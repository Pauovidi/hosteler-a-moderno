# QA MVP Headless

## Precondiciones

- `npm run lint`
- `npm run build`
- Importador ejecutado en `dry-run` al menos una vez
- Si hay entorno preview con WordPress/Woo:
  - categorías y productos visibles en Woo
  - credenciales cargadas en Next

## Checklist funcional

### Routing público

- `/p<ID>-<slug>.html` sigue resolviendo producto correcto
- `/c<ID>-<slug>.html` sigue resolviendo listing correcto
- `/<categoria>` sigue resolviendo listing correcto
- `/blog` sigue cargando
- `/blog/p<ID>-<slug>.html` histórico sigue cargando

### Catálogo

- Menú principal muestra categorías y subcategorías actuales
- Las URLs del menú son del frontend, no del CMS
- El listing de una categoría no mezcla productos ajenos
- La PDP conserva título, descripción, imágenes y opciones de catálogo

### Fallback

- Con `HEADLESS_PRODUCTS_MODE=fallback` la web sigue funcionando sin WordPress
- Con `HEADLESS_PRODUCTS_MODE=prefer-woo` un producto importado se sigue resolviendo por su URL legacy
- Si Woo no devuelve un dato, el frontend no rompe y cae al dato actual

### Blog

- El histórico actual sigue saliendo del dataset existente
- Un post nuevo en WordPress aparece en `/blog`
- Un post nuevo sin `legacyUrl` usa ruta `/blog/<slug>`

### Importación

- No hay duplicados tras reejecutar el importador
- Las imágenes principales están presentes
- Las categorías padre/hija quedan anidadas correctamente
- El reporte de importación no tiene fallos críticos no revisados

## QA recomendada por fases

### Fase 1

- `fallback` en productos y categorías
- validar que los cambios no rompen la web actual

### Fase 2

- `prefer-woo` en preview
- validar PDP, categorías y menú contra Woo

### Fase 3

- `prefer-wp` para posts futuros
- validar convivencia con histórico legacy

## Riesgos a vigilar

- categorías Woo sin slug alineado al frontend
- productos Woo sin `ph_legacy_id`
- imágenes faltantes en media upload
- posts nuevos WP con slugs que colisionen con histórico
