import type { Collection } from "tinacms";
import { coverImageFields, draftField, slugify } from "./shared";

export const PostCollection: Collection = {
  name: "post",
  label: "Blog posts",
  path: "content/posts",
  format: "mdx",
  ui: {
    filename: {
      slugify: (values) => slugify(values.title),
    },
  },
  defaultItem: () => ({
    title: "New post",
    date: new Date().toISOString().slice(0, 10),
    author: "MLLWS",
    draft: true,
    tags: [],
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
      name: "author",
      label: "Author",
      required: true,
    },
    {
      type: "string",
      name: "excerpt",
      label: "Excerpt",
      required: true,
      ui: { component: "textarea" },
    },
    {
      type: "string",
      name: "tags",
      label: "Tags",
      list: true,
    },
    ...coverImageFields,
    draftField,
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
    },
  ],
};
