import type { ImageStorage } from "./types";
import { createSupabaseImageStorage } from "./supabase/imageStorage";
import { hasSupabaseConfig } from "@/lib/supabase/client";

let instance: ImageStorage | null = null;

export function getImageStorage(): ImageStorage {
  if (!hasSupabaseConfig()) {
    throw new Error("Image storage requires Supabase to be configured.");
  }
  if (!instance) {
    instance = createSupabaseImageStorage();
  }
  return instance;
}

export function resetImageStorageForTests() {
  instance = null;
}
