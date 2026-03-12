import "server-only";

import { put } from "@vercel/blob";

import {
  getBlobReadWriteToken,
  hasBlobReadWriteToken,
} from "@/lib/content/env";
import { AdminAssetUploadResult } from "@/lib/content/types";

export function isBlobStorageAvailable(): boolean {
  return hasBlobReadWriteToken();
}

export async function uploadAdminAsset(input: {
  filename: string;
  file: File;
  folder: "products" | "blog";
}): Promise<AdminAssetUploadResult> {
  if (!hasBlobReadWriteToken()) {
    throw new Error("BLOB_READ_WRITE_TOKEN no está configurado.");
  }

  const extension = input.filename.includes(".")
    ? input.filename.split(".").pop()
    : "";
  const safeExtension = extension ? `.${extension.toLowerCase()}` : "";
  const pathname = `admin/${input.folder}/${Date.now()}-${crypto.randomUUID()}${safeExtension}`;

  const blob = await put(pathname, input.file, {
    access: "public",
    addRandomSuffix: false,
    token: getBlobReadWriteToken(),
    contentType: input.file.type || undefined,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
  };
}
