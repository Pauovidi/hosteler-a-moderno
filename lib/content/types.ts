export type PublishStatus = "draft" | "published";

export type EditableProductRecord = {
  recordId: string;
  legacyId: string | null;
  slug: string;
  title: string;
  status: PublishStatus;
  payload: Record<string, unknown>;
  imageUrl: string | null;
  updatedAt: string;
  createdAt: string;
};

export type EditableBlogPostRecord = {
  recordId: string;
  legacyId: string | null;
  slug: string;
  title: string;
  status: PublishStatus;
  excerpt: string;
  legacyUrl: string | null;
  publishedAt: string | null;
  featuredImageUrl: string | null;
  payload: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
};

export type AdminAssetUploadResult = {
  url: string;
  pathname: string;
  contentType: string;
};
