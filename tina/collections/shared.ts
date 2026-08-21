export function slugify(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const draftField = {
  type: "boolean" as const,
  name: "draft",
  label: "Draft",
  description: "Hidden on the public site until this is turned off.",
};

export const coverImageFields = [
  {
    type: "image" as const,
    name: "coverImage",
    label: "Cover image",
    description: "Uploads go to Vercel Blob. Existing motherlanguagelovers.com URLs still work.",
  },
  {
    type: "string" as const,
    name: "imageAlt",
    label: "Cover image alt text",
  },
];
