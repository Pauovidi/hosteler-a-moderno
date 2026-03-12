import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAdminAction } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/content/auth";
import { hasAdminPasswordConfigured } from "@/lib/content/env";

export const dynamic = "force-dynamic";

function getErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "credentials":
      return "Usuario o contraseña incorrectos.";
    case "config":
      return "Falta configurar el acceso admin en las variables de entorno.";
    default:
      return null;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  const params = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(params.error);
  const hasPassword = hasAdminPasswordConfigured();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f5f5f4_55%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-8 shadow-xl shadow-stone-300/30 backdrop-blur">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Acceso privado
            </p>
            <h1 className="font-display text-4xl leading-tight text-stone-950">
              Panel mínimo para autogestión de catálogo y blog
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              Este panel convive con la web pública actual. Los cambios se publican sobre la misma aplicación y conservan las URLs legacy y el fallback existente mientras no haya contenido editable en base de datos.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <h2 className="text-sm font-semibold text-stone-950">Productos</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Alta, edición, borrado y publicación con revalidación de rutas.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <h2 className="text-sm font-semibold text-stone-950">Blog</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Editor Markdown simple, imagen destacada y publicación controlada.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl shadow-stone-300/30">
            <h2 className="font-display text-2xl text-stone-950">Iniciar sesión</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Acceso pensado para un único administrador inicial. Usa cookie segura y sesión firmada en servidor.
            </p>

            {!hasPassword ? (
              <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Falta configurar `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` o `ADMIN_PASSWORD`.
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {errorMessage}
              </div>
            ) : null}

            <form action={loginAdminAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Usuario</span>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Contraseña</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                  required
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Entrar al panel
              </button>
            </form>

            <p className="mt-6 text-xs leading-5 text-stone-500">
              La web pública sigue disponible en{" "}
              <Link href="/" className="font-semibold text-stone-700 underline-offset-2 hover:underline">
                inicio
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
