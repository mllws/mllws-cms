import type { Collection } from "tinacms";
import { coverImageFields, draftField, slugify } from "./shared";

export const EventCollection: Collection = {
  name: "event",
  label: "Events",
  path: "content/events",
  format: "mdx",
  ui: {
    filename: {
      slugify: (values) => slugify(values.title),
    },
  },
  defaultItem: () => ({
    title: "New event",
    date: new Date().toISOString().slice(0, 10),
    category: "community",
    featured: false,
    draft: true,
    sponsors: [],
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
      name: "location",
      label: "Location",
    },
    {
      type: "string",
      name: "dateLocation",
      label: "Date / time display",
      description: "Human-readable line shown on cards, e.g. Sunday, August 9, 2026 · 4:00 PM – 7:00 PM",
    },
    {
      type: "string",
      name: "description",
      label: "Short description",
      ui: { component: "textarea" },
    },
    {
      type: "string",
      name: "category",
      label: "Category",
      options: [
        { value: "festivals", label: "Festivals" },
        { value: "advocacy", label: "Advocacy" },
        { value: "memorial", label: "Memorial" },
        { value: "community", label: "Community" },
        { value: "milestone", label: "Milestone" },
      ],
    },
    {
      type: "string",
      name: "tag",
      label: "Badge label",
      description: "Short uppercase label on the event card, e.g. FESTIVAL",
    },
    {
      type: "string",
      name: "tags",
      label: "Tags",
      list: true,
    },
    ...coverImageFields,
    {
      type: "string",
      name: "mapHref",
      label: "Map link",
    },
    {
      type: "string",
      name: "cityHref",
      label: "City / official listing link",
    },
    {
      type: "string",
      name: "facebookHref",
      label: "Facebook event link",
    },
    {
      type: "string",
      name: "sponsors",
      label: "Sponsors",
      list: true,
    },
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
