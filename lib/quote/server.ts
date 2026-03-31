import "server-only";

import nodemailer from "nodemailer";
import { z } from "zod";

import {
  getWordPressAppPassword,
  getWordPressAppUser,
  getWordPressBaseUrl,
} from "@/lib/headless/env";
import {
  QUOTE_ATTACHMENT_FIELD_NAME,
  QUOTE_CATEGORIES,
  QUOTE_MAX_FILE_SIZE_BYTES,
  getAllowedQuoteMimeType,
  isQuoteCategory,
} from "@/lib/quote/shared";

type QuoteFields = {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  categoria: (typeof QUOTE_CATEGORIES)[number];
  mensaje: string;
};

type QuoteAttachment = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
};

export type UploadedWordPressMedia = {
  id: number;
  sourceUrl: string;
  filename: string;
  mimeType: string;
};

export type QuoteSubmissionResult = {
  media: UploadedWordPressMedia | null;
};

type WordPressMediaResponse = {
  id?: number;
  source_url?: string;
  mime_type?: string;
  guid?: {
    rendered?: string;
  };
  message?: string;
  code?: string;
};

const quoteFieldsSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  email: z.string().trim().email("Introduce un email válido."),
  telefono: z.string().trim(),
  empresa: z.string().trim(),
  categoria: z
    .string()
    .trim()
    .refine((value) => isQuoteCategory(value), "Selecciona una sola categoría válida."),
  mensaje: z.string().trim().min(1, "El mensaje es obligatorio."),
});

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const value = readEnv(name)?.toLowerCase();
  if (!value) {
    return fallback;
  }

  return value === "true" || value === "1" || value === "yes";
}

function parsePortEnv(name: string, fallback: number): number {
  const raw = Number(readEnv(name));
  if (!Number.isFinite(raw) || raw <= 0) {
    return fallback;
  }

  return Math.floor(raw);
}

function getTextField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function buildFormValidationError(message: string): QuoteRequestError {
  return new QuoteRequestError(400, message);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\r\n"]/g, "_").trim() || "adjunto";
}

function getContentDisposition(filename: string): string {
  const safeFilename = sanitizeFilename(filename);
  return `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatOptionalLine(label: string, value: string): string {
  return `${label}: ${value || "-"}`;
}

function getMissingWordPressMediaEnv(): string[] {
  const missing: string[] = [];

  if (!getWordPressBaseUrl()) {
    missing.push("WP_BASE_URL");
  }
  if (!getWordPressAppUser()) {
    missing.push("WP_APP_USER");
  }
  if (!getWordPressAppPassword()) {
    missing.push("WP_APP_PASSWORD");
  }

  return missing;
}

function getEmailConfig() {
  const adminEmail = readEnv("QUOTE_ADMIN_EMAIL");
  const host = readEnv("SMTP_HOST");
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const fromEmail = readEnv("SMTP_FROM_EMAIL");
  const fromName = readEnv("SMTP_FROM_NAME") || "Personalizados Hosteleria";
  const port = parsePortEnv("SMTP_PORT", 587);
  const secure = parseBooleanEnv("SMTP_SECURE", port === 465);

  const missing = [
    ["QUOTE_ADMIN_EMAIL", adminEmail],
    ["SMTP_HOST", host],
    ["SMTP_USER", user],
    ["SMTP_PASS", pass],
    ["SMTP_FROM_EMAIL", fromEmail],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new QuoteRequestError(
      500,
      `Falta configuración de email para presupuestos: ${missing.join(", ")}.`,
    );
  }

  return {
    adminEmail: adminEmail!,
    host: host!,
    user: user!,
    pass: pass!,
    fromEmail: fromEmail!,
    fromName,
    port,
    secure,
  };
}

async function parseAttachment(formData: FormData): Promise<QuoteAttachment | null> {
  const fileEntry = formData.get(QUOTE_ATTACHMENT_FIELD_NAME);
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return null;
  }

  if (fileEntry.size > QUOTE_MAX_FILE_SIZE_BYTES) {
    throw buildFormValidationError("El archivo supera el máximo de 5 MB.");
  }

  const mimeType = getAllowedQuoteMimeType(fileEntry.type, fileEntry.name);
  if (!mimeType) {
    throw buildFormValidationError("Adjunta un archivo PNG, JPG, WEBP o SVG válido.");
  }

  const arrayBuffer = await fileEntry.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    filename: sanitizeFilename(fileEntry.name),
    mimeType,
    size: fileEntry.size,
  };
}

async function parseQuoteFormData(formData: FormData): Promise<{ fields: QuoteFields; attachment: QuoteAttachment | null }> {
  const categoriaValues = formData
    .getAll("categoria")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (categoriaValues.length !== 1) {
    throw buildFormValidationError("Selecciona una sola categoría.");
  }

  const parsed = quoteFieldsSchema.safeParse({
    nombre: getTextField(formData, "nombre"),
    email: getTextField(formData, "email"),
    telefono: getTextField(formData, "telefono"),
    empresa: getTextField(formData, "empresa"),
    categoria: categoriaValues[0],
    mensaje: getTextField(formData, "mensaje"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw buildFormValidationError(issue?.message || "Revisa los datos del formulario.");
  }

  const attachment = await parseAttachment(formData);

  return {
    fields: parsed.data as QuoteFields,
    attachment,
  };
}

async function uploadAttachmentToWordPress(attachment: QuoteAttachment): Promise<UploadedWordPressMedia> {
  const missing = getMissingWordPressMediaEnv();
  if (missing.length > 0) {
    throw new QuoteRequestError(
      500,
      `Falta configuración de WordPress Media para subir adjuntos: ${missing.join(", ")}.`,
    );
  }

  const auth = Buffer.from(`${getWordPressAppUser()!}:${getWordPressAppPassword()!}`).toString("base64");
  const response = await fetch(`${getWordPressBaseUrl()!}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Disposition": getContentDisposition(attachment.filename),
      "Content-Type": attachment.mimeType,
    },
    body: attachment.buffer,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as WordPressMediaResponse | null;
  if (!response.ok) {
    const reason = payload?.message || `WordPress Media devolvió ${response.status}.`;
    throw new QuoteRequestError(502, `No se pudo subir el adjunto a WordPress: ${reason}`);
  }

  const mediaId = Number(payload?.id);
  const sourceUrl = String(payload?.source_url || payload?.guid?.rendered || "").trim();
  if (!Number.isFinite(mediaId) || !sourceUrl) {
    throw new QuoteRequestError(
      502,
      "WordPress no devolvió un media id o source_url válido tras subir el adjunto.",
    );
  }

  return {
    id: mediaId,
    sourceUrl,
    filename: attachment.filename,
    mimeType: payload?.mime_type || attachment.mimeType,
  };
}

function buildEmailText(fields: QuoteFields, media: UploadedWordPressMedia | null, attachment: QuoteAttachment | null): string {
  return [
    "Nueva solicitud de presupuesto",
    "",
    `Nombre: ${fields.nombre}`,
    `Empresa: ${fields.empresa || "-"}`,
    formatOptionalLine("Teléfono", fields.telefono),
    `Email cliente: ${fields.email}`,
    `Categoría: ${fields.categoria}`,
    "",
    "Mensaje:",
    fields.mensaje,
    "",
    `Archivo adjunto en email: ${attachment ? attachment.filename : "-"}`,
    `Archivo subido a WordPress: ${media ? media.filename : "-"}`,
    `Media URL WordPress: ${media?.sourceUrl || "-"}`,
    `Media ID WordPress: ${media ? String(media.id) : "-"}`,
  ].join("\n");
}

function buildEmailHtml(fields: QuoteFields, media: UploadedWordPressMedia | null, attachment: QuoteAttachment | null): string {
  const rows = [
    { label: "Nombre", valueHtml: escapeHtml(fields.nombre) },
    { label: "Empresa", valueHtml: escapeHtml(fields.empresa || "-") },
    { label: "Teléfono", valueHtml: escapeHtml(fields.telefono || "-") },
    { label: "Email cliente", valueHtml: escapeHtml(fields.email) },
    { label: "Categoría", valueHtml: escapeHtml(fields.categoria) },
    { label: "Archivo adjunto en email", valueHtml: escapeHtml(attachment ? attachment.filename : "-") },
    { label: "Archivo subido a WordPress", valueHtml: escapeHtml(media ? media.filename : "-") },
    {
      label: "Media URL WordPress",
      valueHtml: media?.sourceUrl
        ? `<a href="${escapeHtml(media.sourceUrl)}">${escapeHtml(media.sourceUrl)}</a>`
        : "-",
    },
    { label: "Media ID WordPress", valueHtml: escapeHtml(media ? String(media.id) : "-") },
  ];

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f1f1f;">
      <h2>Nueva solicitud de presupuesto</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
        <tbody>
          ${rows
            .map(
              ({ label, valueHtml }) => `
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: 600; width: 220px;">${escapeHtml(label)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #ddd;">${valueHtml}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <h3 style="margin-top: 24px;">Mensaje</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(fields.mensaje)}</p>
    </div>
  `;
}

async function sendQuoteEmail(fields: QuoteFields, media: UploadedWordPressMedia | null, attachment: QuoteAttachment | null) {
  const config = getEmailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: config.adminEmail,
    replyTo: fields.email,
    subject: `Nuevo presupuesto: ${fields.categoria} - ${fields.empresa || fields.nombre}`,
    text: buildEmailText(fields, media, attachment),
    html: buildEmailHtml(fields, media, attachment),
    attachments: attachment
      ? [
          {
            filename: attachment.filename,
            content: attachment.buffer,
            contentType: attachment.mimeType,
          },
        ]
      : undefined,
  });
}

export class QuoteRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "QuoteRequestError";
  }
}

export async function submitQuoteRequest(formData: FormData): Promise<QuoteSubmissionResult> {
  const { fields, attachment } = await parseQuoteFormData(formData);
  const media = attachment ? await uploadAttachmentToWordPress(attachment) : null;

  try {
    await sendQuoteEmail(fields, media, attachment);
  } catch (error) {
    if (error instanceof QuoteRequestError) {
      throw error;
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "No se pudo enviar el email al administrador.";

    throw new QuoteRequestError(502, `No se pudo enviar el email al administrador: ${message}`);
  }

  return { media };
}
