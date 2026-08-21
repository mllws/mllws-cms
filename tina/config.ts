import "./nextauth-url";
import {
  UsernamePasswordAuthJSProvider,
  TinaUserCollection,
} from "tinacms-authjs/dist/tinacms";
import { defineConfig, LocalAuthProvider } from "tinacms";
import { PostCollection } from "./collections/posts";
import { EventCollection } from "./collections/events";
import { StoryCollection } from "./collections/stories";
import { GalleryCollection } from "./collections/galleries";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  authProvider: isLocal
    ? new LocalAuthProvider()
    : new UsernamePasswordAuthJSProvider(),
  contentApiUrlOverride: "/api/tina/gql",
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    loadCustomStore: async () => {
      const { VercelBlobMediaStore } = await import("../media/vercel-blob-store");
      return VercelBlobMediaStore;
    },
  },
  schema: {
    collections: [
      TinaUserCollection,
      PostCollection,
      EventCollection,
      StoryCollection,
      GalleryCollection,
    ],
  },
});
