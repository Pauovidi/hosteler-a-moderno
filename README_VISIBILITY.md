# Capa de visibilidad por CSV (solo listados)

Este flujo oculta contenido solo en listados. No bloquea paginas de detalle por URL directa.

## Inputs obligatorios

Pon los archivos aqui:

- `data/visibility/blog.csv`
- `data/visibility/products.csv`

Si falta alguno, el proceso debe abortar.

## Reglas de negocio

### Blog

- Se lee `blog.csv` con separador coma.
- Si `Accion` empieza por `ELIMINAR` (case-insensitive), se oculta en listados.
- `MANTENER` permanece visible.

### Productos

- `products.csv` se interpreta como lista blanca por `ID`.
- Si un ID no esta en CSV, se oculta en listados.
- Si `QUITAR o eliminar` es `X/x`, se oculta aunque el ID exista.

## Generacion

```bash
pnpm visibility:apply
```

Genera:

- `lib/data/visibility-blog.json`
- `lib/data/visibility-products.json`
- `out/visibility-report.json`

`out/visibility-report.json` incluye conteos, delimitadores detectados, filas raras e IDs vacios.

## Que SI y que NO se ve afectado

- SI: listados (`/blog`, listados de productos/categorias/relacionados).
- NO: paginas de detalle de post/producto por URL directa.

## Si cambia el Excel/CSV

1. Exporta de nuevo a `data/visibility/blog.csv` y `data/visibility/products.csv`.
2. Ejecuta `pnpm visibility:apply`.
3. Ejecuta `pnpm build`.
4. Revisa listados y confirma que detalle sigue accesible por URL.