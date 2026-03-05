# Capa de visibilidad por CSV (no destructiva)

Este proyecto aplica reglas de visibilidad **solo en listados** para productos y posts.

## Archivos de entrada

Coloca los CSV en estas rutas exactas:

- `data/visibility/blog.csv`
  - Separador: `,`
  - Columnas usadas:
    - `Páginas principales`
    - `Acción`
- `data/visibility/products.csv`
  - Separador: `;`
  - Columnas usadas:
    - `ID`
    - `QUITAR o eliminar`

Si falta alguno de los CSV, el script falla con un mensaje claro.

## Generar la visibilidad

```bash
pnpm visibility:apply
```

Esto genera:

- `lib/data/visibility-blog.json`
- `lib/data/visibility-products.json`
- `out/visibility-report.json` (diagnóstico: conteos, ejemplos, IDs/slugs no encontrados)

## Reglas aplicadas

### Blog (listados)

- Si `Acción` empieza por `ELIMINAR` (sin importar mayúsculas/minúsculas), se oculta en listados.
- Se compara por `legacyUrl` cuando existe, y en fallback por slug derivado de la URL legacy.

### Productos (listados)

- Se aplica **lista blanca**: solo se muestran IDs presentes en el CSV de productos.
- Además, si `QUITAR o eliminar` es `X`/`x`, también se oculta.

## Qué NO toca (SEO / detalle)

- No se elimina contenido.
- No se rompen URLs.
- Las páginas de detalle de producto/post siguen accesibles por URL directa.

## Comprobación rápida

1. Ejecuta `pnpm visibility:apply`.
2. Ejecuta `pnpm build`.
3. Revisa:
   - `/blog`: no deben aparecer posts marcados como ELIMINAR.
   - Listados de productos: solo IDs permitidos y no marcados con X.
   - URL directa de producto oculto: debe cargar.
   - URL directa de post oculto: debe cargar.
