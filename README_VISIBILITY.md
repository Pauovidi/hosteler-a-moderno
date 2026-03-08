# Capa de visibilidad por CSV (no destructiva)

Este proyecto aplica reglas de visibilidad solo en listados para productos y posts.

## Archivos de entrada

Usa estas rutas exactas:

- `data/visibility/blog.csv`
- `data/visibility/products.csv`

El script detecta automaticamente el separador (coma o punto y coma) y elimina BOM UTF-8 si existe.

Columnas esperadas:

- Blog: URL legacy (por ejemplo `Paginas principales`) y accion (por ejemplo `Accion`).
- Productos: `ID` y opcionalmente `QUITAR o eliminar`.

La deteccion de cabeceras es tolerante (aproximada, case-insensitive y sin acentos).

## Generar visibilidad

```bash
pnpm visibility:apply
```

Genera:

- `lib/data/visibility-blog.json`
- `lib/data/visibility-products.json`
- `out/visibility-report.json` (diagnostico con conteos, columnas detectadas y filas problematicas)

## Reglas aplicadas

### Blog (solo listado `/blog`)

- Si `Accion` empieza por `ELIMINAR` (case-insensitive), se oculta en listados.
- Coincidencia por `legacyUrl` si existe; fallback por pathname derivado de la URL legacy.

### Productos (solo listados)

- Lista blanca: si un producto no esta en `products.csv`, se oculta en listados.
- Si `QUITAR o eliminar` tiene `X`/`x`, tambien se oculta aunque este en la lista blanca.

## SEO y detalle

- No se bloquea URL directa.
- No se eliminan fichas de producto ni posts.
- Solo cambia la visibilidad en listados.

## Como probar (flujo PR)

1. Edita `data/visibility/blog.csv` y/o `data/visibility/products.csv`.
2. Ejecuta `pnpm visibility:apply`.
3. Ejecuta `pnpm build`.
4. Verifica:
   - `/blog` sin posts marcados para eliminar.
   - Listados de productos/categorias solo con IDs permitidos y no marcados con `X`.
   - URLs directas de detalle siguen accesibles.