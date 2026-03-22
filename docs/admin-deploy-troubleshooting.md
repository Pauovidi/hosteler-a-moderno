# Admin Deploy Troubleshooting

## Causa raíz exacta

El proyecto correcto en Vercel es `devestial/v0-personalizados-hosteleria`.

La rama que contiene el panel admin es `codex/feat-admin-panel-v1`. Incluye:

- `4243e43` `feat(admin): add panel foundation`
- `c8892dd` `feat(admin): manage products with db fallback`
- `2b8682c` `feat(admin): manage blog with db fallback`
- `d53056d` `feat(admin): harden env workflow and qa`
- `44d3177` `Hotfix DB bootstrap out of public reads`

`main` no contiene esos commits ni el árbol `app/admin/*` / `lib/content/*`, por eso Production sigue sin panel admin mientras despliegue `main`.

En Vercel:

- Production está desplegando `main`
- Preview sí está desplegando `codex/feat-admin-panel-v1`
- no hay variables branch-specific para `codex/feat-admin-panel-v1`
- por tanto Preview toma las variables generales de `Preview`

El fallo real del login en Preview no era que Vercel “ignorase” variables, sino una combinación de configuración ambigua:

- existían `ADMIN_PASSWORD_HASH` y `ADMIN_PASSWORD` a la vez
- `ADMIN_PASSWORD_HASH` no tenía el formato esperado por el código: `scrypt:<salt_hex>:<derived_key_hex>`
- el código antiguo priorizaba silenciosamente `ADMIN_PASSWORD_HASH`
- resultado: aunque `ADMIN_PASSWORD` fuese correcto, el login fallaba como “credenciales incorrectas”

## Estado actual de ramas y despliegues

- rama con admin: `codex/feat-admin-panel-v1`
- rama de Production en Vercel: `main`
- alias Preview observado: `v0-personalizados-hosteleria-git-codex-feat-ad-934610-devestial.vercel.app`
- alias Production observado: `v0-personalizados-hosteleria-git-main-devestial.vercel.app`

Implicación:

- Preview puede validar el panel admin ya mismo
- Production no mostrará el panel admin hasta que `main` reciba esa línea de cambios

## Política final de variables del admin

Variables esperadas por el login:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_MAX_AGE_SECONDS`
- `ADMIN_SESSION_SECURE`
- `DATABASE_URL`

Precedencia y reglas:

1. Si existe `ADMIN_PASSWORD_HASH` y tiene formato válido `scrypt:...`, el login usa hash.
2. Si no existe hash válido pero existe `ADMIN_PASSWORD`, el login usa la contraseña en claro.
3. Si existen `ADMIN_PASSWORD_HASH` y `ADMIN_PASSWORD` a la vez, ambas deben representar la misma contraseña.
4. Si el hash es inválido o ambas variables no coinciden, el login se deshabilita con error de configuración explícito.
5. `DATABASE_URL` es necesaria para CRUD y persistencia editable, pero no para mostrar `/admin/login`.

Recomendación operativa:

- Preview y Production pueden mantener ambas variables si están alineadas.
- Si quieres eliminar ambigüedad por completo, deja solo `ADMIN_PASSWORD_HASH` en entornos remotos.

## Pasos exactos para login en Preview

1. Confirmar que el deployment Preview apunta a `codex/feat-admin-panel-v1`.
2. Confirmar que Preview usa las variables generales de `Preview` o unas branch-specific correctas.
3. Verificar que `ADMIN_PASSWORD_HASH` usa formato `scrypt:<salt_hex>:<derived_key_hex>`.
4. Si también existe `ADMIN_PASSWORD`, verificar que corresponde al mismo password que el hash.
5. Redeploy del Preview después de cambiar variables o empujar un commit nuevo a la rama.

## Pasos exactos para promover el admin a Production

1. Revisar el diff de `main..codex/feat-admin-panel-v1`.
2. Hacer merge o PR de la rama del admin hacia `main` cuando el estado sea correcto.
3. Mantener en Production las variables del admin ya alineadas.
4. Lanzar un deploy de Production desde `main`.

## Cómo evitar que Preview “ignore” variables

- no confiar en que “si está la variable, el login la usará bien”
- evitar hashes con formatos no soportados
- no dejar `ADMIN_PASSWORD_HASH` y `ADMIN_PASSWORD` desalineados
- comprobar branch-specific env vars con `vercel env ls preview <rama>`
- tras cambiar env vars, forzar un nuevo deploy o empujar un commit para que Preview vuelva a construirse con la configuración correcta
