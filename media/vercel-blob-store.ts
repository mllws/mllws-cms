import type {
  Media,
  MediaList,
  MediaListOptions,
  MediaStore,
  MediaUploadOptions,
} from "tinacms";
import { DEFAULT_MEDIA_UPLOAD_TYPES, sanitizeFilename } from "tinacms";

const API_PATH = "/api/blob/media";

export class VercelBlobMediaStore implements MediaStore {
  accept = DEFAULT_MEDIA_UPLOAD_TYPES;

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const uploaded: Media[] = [];

    for (const item of files) {
      let directory = item.directory || "";
      if (directory.endsWith("/")) directory = directory.slice(0, -1);
      if (directory === "/") directory = "";

      const filename = sanitizeFilename(item.file.name);
      const form = new FormData();
      form.append("file", item.file, filename);
      form.append("directory", directory);
      form.append("filename", filename);

      const res = await fetch(API_PATH, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Upload failed (${res.status})`);
      }

      const media = (await res.json()) as Media;
      uploaded.push(media);
    }

    return uploaded;
  }

  async list(options: MediaListOptions = {}): Promise<MediaList> {
    const params = new URLSearchParams();
    if (options.directory) params.set("directory", String(options.directory));
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));

    const res = await fetch(`${API_PATH}?${params.toString()}`, {
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Not signed in — open /admin and log in, then try again.");
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Could not list media (${res.status})`);
    }

    const { items, offset } = await res.json();
    return { items, nextOffset: offset };
  }

  async delete(media: Media): Promise<void> {
    const params = new URLSearchParams();
    params.set("id", media.id);
    const res = await fetch(`${API_PATH}?${params.toString()}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Could not delete media (${res.status})`);
    }
  }

  previewSrc(src: string) {
    return src;
  }

  parse(img: { src?: string } | string) {
    return typeof img === "string" ? img : img?.src || "";
  }
}
