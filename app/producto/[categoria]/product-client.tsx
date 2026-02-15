"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { type Product, getAllProducts } from "@/lib/data/products";

function toLegacySlug(product: Product) {
  // Prefer explicit legacy slug if present (coming from CSV)
  if (product.legacySlug) return product.legacySlug;
  // Fallback: create something like "c412083-foo-bar.html" if we only have id + title
  const safeTitle = (product.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-");
  return `c${product.id}-${safeTitle}.html`;
}

function normalizePhoneForWa(phone: string) {
  // WhatsApp wa.me expects digits only (no +, spaces)
  return (phone || "").replace(/[^\d]/g, "");
}

type PersonalizationField =
  | { id: string; label: string; type: "text"; placeholder?: string }
  | { id: string; label: string; type: "textarea"; placeholder?: string }
  | { id: string; label: string; type: "file"; help?: string }
  | { id: string; label: string; type: "checkbox"; help?: string };

export default function ProductClient({
  product,
  categoria,
}: {
  product: Product;
  categoria: string;
}) {
  const legacyProductHref = `/${toLegacySlug(product)}`;

  // Change this default to your real number (or set NEXT_PUBLIC_WHATSAPP_PHONE in Vercel)
  const phoneNumber = normalizePhoneForWa(
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "34693039422"
  );

  const isPremium = Boolean((product as any).isPremium);

  // ✅ Needed: used by handlePersonalizationChange + presupuestoMessage
  const [personalizationValues, setPersonalizationValues] = useState<
    Record<string, string | boolean>
  >({});

  // ✅ Only one definition (fixes build error)
  const otherProducts = useMemo(() => {
    const currentId = String(product.id);
    return getAllProducts()
      .filter((p) => String(p.id) !== currentId)
      .slice(0, 8);
  }, [product.id]);

  const personalizations: PersonalizationField[] = useMemo(() => {
    // If your product JSON includes per-product fields, use them; else fallback to a sensible default.
    const fromData = (product as any).personalizations as
      | PersonalizationField[]
      | undefined;
    if (Array.isArray(fromData) && fromData.length > 0) return fromData;

    if (!isPremium) return [];

    // Default “premium” form similar to old Palbin style (you can adjust)
    return [
      {
        id: "texto_caja",
        label: "Texto para caja 150*75 mm (sólo el texto)",
        type: "textarea",
        placeholder: "indica aquí qué quieres poner",
      },
      {
        id: "fuente",
        label: "La Fuente de letra",
        type: "textarea",
        placeholder: "indica aquí el nombre de la fuente de letra",
      },
      {
        id: "img_caja",
        label: "Adjunta aquí un logo o imagen caja",
        type: "file",
        help: "Formatos recomendados: PNG/JPG/PDF",
      },
      {
        id: "texto_copa",
        label: "Texto para copa 45*45 mm máximo",
        type: "textarea",
        placeholder: "dinos texto y fuente de letra",
      },
      {
        id: "img_copa",
        label: "Adjunta aquí logo para copa",
        type: "file",
        help: "Formatos recomendados: PNG/JPG/PDF",
      },
      {
        id: "observaciones",
        label: "Observaciones",
        type: "textarea",
        placeholder: "Cualquier detalle adicional…",
      },
    ];
  }, [product, isPremium]);

  const handlePersonalizationChange = (
    fieldId: string,
    value: string | boolean
  ) => {
    setPersonalizationValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const presupuestoMessage = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Hola, quiero presupuesto para: ${product.title}`);

    if (personalizations.length) {
      lines.push("");
      lines.push("Personalización:");
      for (const f of personalizations) {
        const v = personalizationValues[f.id];
        if (v === undefined || v === "" || v === false) continue;

        if (f.type === "checkbox") {
          lines.push(`- ${f.label}: Sí`);
        } else {
          lines.push(`- ${f.label}: ${String(v)}`);
        }
      }
    }

    lines.push("");
    lines.push("Enlace producto:");
    lines.push(legacyProductHref);

    return lines.join("\n");
  }, [legacyProductHref, personalizationValues, personalizations, product.title]);

  const whatsappHref = useMemo(() => {
    const text = encodeURIComponent(presupuestoMessage);
    return `https://wa.me/${phoneNumber}?text=${text}`;
  }, [phoneNumber, presupuestoMessage]);

  const presupuestoHref = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("producto", product.title);
    sp.set("mensaje", presupuestoMessage);
    return `/presupuesto?${sp.toString()}`;
  }, [product.title, presupuestoMessage]);

  return (
    <div className="min-h-screen bg-[#f6f0e6]">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <a
          href={legacyProductHref.replace(/\/c\d+-.*\.html$/, "/")}
          className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </a>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-white border border-neutral-200">
          <div className="aspect-square w-full flex items-center justify-center">
            {/* Use normal img for export/static simplicity */}
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          {isPremium ? (
            <div className="text-xs tracking-[0.35em] uppercase text-[#b18a2a] mb-3">
              PERSONALIZACIÓN PREMIUM
            </div>
          ) : null}

          <h1 className="font-display text-4xl md:text-5xl leading-tight text-neutral-900 mb-3">
            {product.title}
          </h1>

          {product.shortDescription ? (
            <p className="text-neutral-700 mb-6">{product.shortDescription}</p>
          ) : null}

          {product.longDescription ? (
            <div
              className="prose prose-neutral max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: product.longDescription }}
            />
          ) : null}

          <div className="flex flex-wrap gap-3 mb-10">
            <Button
              asChild
              className="bg-[#b07a00] hover:bg-[#9a6a00] text-white"
            >
              <a href={presupuestoHref}>
                <FileText className="w-4 h-4 mr-2" />
                Pedir Presupuesto
              </a>
            </Button>

            <Button asChild variant="outline" className="border-neutral-300">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
          </div>

          {/* Premium form */}
          {isPremium && personalizations.length ? (
            <div className="bg-white border border-neutral-200 p-6">
              <h2 className="font-display text-xl text-neutral-900 mb-5">
                Personalización
              </h2>

              <div className="space-y-5">
                {personalizations.map((f) => {
                  const val = personalizationValues[f.id];

                  if (f.type === "checkbox") {
                    return (
                      <div key={f.id} className="space-y-2">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) =>
                              handlePersonalizationChange(
                                f.id,
                                e.target.checked
                              )
                            }
                          />
                          <span className="text-sm text-neutral-900">
                            {f.label}
                          </span>
                        </label>
                        {"help" in f && f.help ? (
                          <p className="text-xs text-neutral-500">{f.help}</p>
                        ) : null}
                      </div>
                    );
                  }

                  if (f.type === "file") {
                    return (
                      <div key={f.id} className="space-y-2">
                        <Label className="text-sm text-neutral-900">
                          {f.label}
                        </Label>
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handlePersonalizationChange(
                              f.id,
                              file ? file.name : ""
                            );
                          }}
                        />
                        {"help" in f && f.help ? (
                          <p className="text-xs text-neutral-500">{f.help}</p>
                        ) : null}
                        {val ? (
                          <p className="text-xs text-neutral-700 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {String(val)}
                          </p>
                        ) : null}
                      </div>
                    );
                  }

                  if (f.type === "textarea") {
                    return (
                      <div key={f.id} className="space-y-2">
                        <Label className="text-sm text-neutral-900">
                          {f.label}
                        </Label>
                        <Textarea
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) =>
                            handlePersonalizationChange(f.id, e.target.value)
                          }
                          rows={4}
                          placeholder={f.placeholder}
                        />
                      </div>
                    );
                  }

                  // text
                  return (
                    <div key={f.id} className="space-y-2">
                      <Label className="text-sm text-neutral-900">
                        {f.label}
                      </Label>
                      <Input
                        value={typeof val === "string" ? val : ""}
                        onChange={(e) =>
                          handlePersonalizationChange(f.id, e.target.value)
                        }
                        placeholder={f.placeholder}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Other products */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-display text-2xl text-neutral-900 mb-6">
          Otros productos que podrían interesarte
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {otherProducts.map((p) => (
            <a
              key={p.id}
              href={`/${toLegacySlug(p)}`}
              className="bg-white border border-neutral-200 hover:border-neutral-400 transition-colors"
            >
              <div className="aspect-square w-full flex items-center justify-center">
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={p.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="font-display text-sm text-neutral-900">
                  {p.title}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
