import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseImageStorage, PRODUCT_IMAGES_BUCKET } from "./imageStorage";

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient: vi.fn() }));

describe("createSupabaseImageStorage", () => {
  const upload = vi.fn();
  const remove = vi.fn();
  const getPublicUrl = vi.fn();
  const from = vi.fn(() => ({ upload, remove, getPublicUrl }));

  beforeEach(() => {
    upload.mockReset();
    remove.mockReset();
    getPublicUrl.mockReset();
    from.mockClear();
    vi.mocked(getSupabaseClient).mockReturnValue({ storage: { from } } as never);
  });

  it("upload sends the file to the product-images bucket with its content type, upserting", async () => {
    upload.mockResolvedValue({ error: null });
    const storage = createSupabaseImageStorage();
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    await storage.upload(file, "p1/photo.jpg");
    expect(from).toHaveBeenCalledWith(PRODUCT_IMAGES_BUCKET);
    expect(upload).toHaveBeenCalledWith("p1/photo.jpg", file, { upsert: true, contentType: "image/jpeg" });
  });

  it("upload throws on a storage error", async () => {
    upload.mockResolvedValue({ error: { message: "upload failed" } });
    const storage = createSupabaseImageStorage();
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    await expect(storage.upload(file, "p1/photo.jpg")).rejects.toEqual({ message: "upload failed" });
  });

  it("remove deletes every given path", async () => {
    remove.mockResolvedValue({ error: null });
    const storage = createSupabaseImageStorage();
    await storage.remove(["p1/a.jpg", "p1/b.jpg"]);
    expect(remove).toHaveBeenCalledWith(["p1/a.jpg", "p1/b.jpg"]);
  });

  it("remove throws on a storage error", async () => {
    remove.mockResolvedValue({ error: { message: "remove failed" } });
    const storage = createSupabaseImageStorage();
    await expect(storage.remove(["p1/a.jpg"])).rejects.toEqual({ message: "remove failed" });
  });

  it("getPublicUrl returns the bucket's public URL for the given path", () => {
    getPublicUrl.mockReturnValue({ data: { publicUrl: "https://x.supabase.co/storage/v1/object/public/product-images/p1/a.jpg" } });
    const storage = createSupabaseImageStorage();
    expect(storage.getPublicUrl("p1/a.jpg")).toBe("https://x.supabase.co/storage/v1/object/public/product-images/p1/a.jpg");
  });
});
