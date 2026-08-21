import type { Collection } from "tinacms";
import { coverImageFields, draftField, slugify } from "./shared";

export const StoryCollection: Collection = {
  name: "story",
  label: "Stories",
  path: "content/stories",
  format: "mdx",
  ui: {
    filename: {
      slugify: (values) => slugify(values.title),
    },
  },
  defaultItem: () => ({
    title: "New story",
    date: new Date().toISOString().slice(0, 10),
    author: "MLLWS",
    category: "recaps",
    featured: false,
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
      name: "category",
      label: "Category",
      options: [
        { value: "milestones", label: "Milestones" },
        { value: "origins", label: "Origins" },
        { value: "recaps", label: "Recaps" },
        { value: "spotlights", label: "Spotlights" },
      ],
    },
    {
      type: "string",
      name: "tag",
      label: "Badge label",
    },
    {
      type: "string",
      name: "tags",
      label: "Tags",
      list: true,
    },
    ...coverImageFields,
    {
      type: "boolean",
      name: "featured",
      label: "Featured",
    },
    draftField,
    {
      type: "rich-text",
      name: "body",
      label: "Body",
      isBody: true,
    },
  ],
};
