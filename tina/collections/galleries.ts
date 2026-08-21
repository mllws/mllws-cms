import type { Collection } from "tinacms";
import { coverImageFields, draftField, slugify } from "./shared";

export const GalleryCollection: Collection = {
  name: "gallery",
  label: "Photo galleries",
  path: "content/galleries",
  format: "mdx",
  ui: {
    filename: {
      slugify: (values) => slugify(values.title),
    },
  },
  defaultItem: () => ({
    title: "New album",
    date: new Date().toISOString().slice(0, 10),
    draft: true,
    images: [],
  }),
  fields: [
    {
      type: "string",
      name: "title",
      label: "Title",
      isTitle: true,
      required: true,
    },
    {
      type: "datetime",
      name: "date",
      label: "Date",
      required: true,
      ui: { dateFormat: "YYYY-MM-DD" },
    },
    {
      type: "string",
      name: "event",
      label: "Linked event slug",
      description: "Filename of the related event, without .mdx",
    },
    ...coverImageFields,
    {
      type: "object",
      name: "images",
      label: "Images",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: item?.caption || item?.alt || "Image",
        }),
      },
      fields: [
        {
          type: "image",
          name: "src",
          label: "Photo",
          required: true,
        },
        {
          type: "string",
          name: "alt",
          label: "Alt text",
          required: true,
        },
        {
          type: "string",
          name: "caption",
          label: "Caption",
        },
      ],
    },
    draftField,
    {
      type: "rich-text",
      name: "body",
      label: "Description",
      isBody: true,
    },
  ],
};
