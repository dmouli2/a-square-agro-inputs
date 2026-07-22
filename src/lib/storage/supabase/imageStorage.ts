import { getSupabaseClient } from "@/lib/supabase/client";
import type { ImageStorage } from "@/lib/storage/types";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function createSupabaseImageStorage(): ImageStorage {
  return {
    async upload(file, path) {
      const { error } = await getSupabaseClient()
        .storage.from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
    },
    async remove(paths) {
      const { error } = await getSupabaseClient().storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
      if (error) throw error;
    },
    getPublicUrl(path) {
      return getSupabaseClient().storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}
