import { NextResponse } from "next/server";

import { QuoteRequestError, submitQuoteRequest } from "@/lib/quote/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      {
        ok: false,
        error: "El formulario debe enviarse como multipart/form-data.",
      },
      { status: 415 },
    );
  }

  try {
    const formData = await request.formData();
    const result = await submitQuoteRequest(formData);

    return NextResponse.json({
      ok: true,
      message: "Tu solicitud se ha enviado correctamente.",
      media: result.media,
    });
  } catch (error) {
    if (error instanceof QuoteRequestError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "No se pudo procesar la solicitud de presupuesto.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
