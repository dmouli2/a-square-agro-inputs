import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRevalidatePath } from "../../../vitest.setup";
import { requireRole } from "@/lib/dal";
import { getDb } from "@/lib/db";
import { getImageStorage } from "@/lib/storage";
import { uploadProductImage, removeProductImage } from "./productImages";
import type { ProductWithVariants, Staff } from "@/types";

vi.mock("@/lib/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/storage", () => ({ getImageStorage: vi.fn() }));

const admin: Staff = { id: "s1", name: "Admin", email: "admin@example.com", passwordHash: "hash", role: "admin", active: true };

const product: ProductWithVariants = {
  id: "prod-1",
  slug: "taqat",
  name: "Taqat",
  brand: "Tata Rallis",
  categoryId: "c1",
  description: "d",
  images: ["prod-1/existing.jpg"],
  status: "active",
  cropCompatibility: [],
  isBestseller: false,
  variants: [],
};

function withFile(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.set("image", file);
  return fd;
}

describe("uploadProductImage", () => {
  const findById = vi.fn();
  const update = vi.fn();
  const upload = vi.fn();

  beforeEach(() => {
    findById.mockReset();
    update.mockReset();
    upload.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { findById, update } } as never);
    vi.mocked(getImageStorage).mockReturnValue({ upload, remove: vi.fn(), getPublicUrl: vi.fn() });
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role before doing anything else", async () => {
    await uploadProductImage("prod-1", withFile(null));
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("no-ops when no file (or an empty file) is provided", async () => {
    await uploadProductImage("prod-1", withFile(null));
    expect(upload).not.toHaveBeenCalled();

    const empty = new File([], "empty.jpg", { type: "image/jpeg" });
    await uploadProductImage("prod-1", withFile(empty));
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a file larger than the 4MB limit", async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    await uploadProductImage("prod-1", withFile(big));
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a disallowed content type", async () => {
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await uploadProductImage("prod-1", withFile(svg));
    expect(upload).not.toHaveBeenCalled();
  });

  it("no-ops when the product doesn't exist", async () => {
    findById.mockResolvedValue(null);
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    await uploadProductImage("prod-1", withFile(file));
    expect(upload).not.toHaveBeenCalled();
  });

  it("sanitizes the filename, uploads, and appends the new path to the product's images", async () => {
    findById.mockResolvedValue(product);
    upload.mockResolvedValue(undefined);
    const file = new File(["data"], "my photo (1)!.jpg", { type: "image/jpeg" });
    await uploadProductImage("prod-1", withFile(file));

    expect(upload).toHaveBeenCalledTimes(1);
    const [, path] = upload.mock.calls[0] as [File, string];
    expect(path).toMatch(/^prod-1\/\d+-my-photo--1--\.jpg$/);
    expect(update).toHaveBeenCalledWith("prod-1", { images: [...product.images, path] });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("removeProductImage", () => {
  const findById = vi.fn();
  const update = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    findById.mockReset();
    update.mockReset();
    remove.mockReset();
    vi.mocked(requireRole).mockResolvedValue(admin);
    vi.mocked(getDb).mockReturnValue({ products: { findById, update } } as never);
    vi.mocked(getImageStorage).mockReturnValue({ upload: vi.fn(), remove, getPublicUrl: vi.fn() });
    mockRevalidatePath.mockClear();
  });

  it("requires the admin role before doing anything else", async () => {
    findById.mockResolvedValue(null);
    await removeProductImage("prod-1", "prod-1/existing.jpg");
    expect(requireRole).toHaveBeenCalledWith(["admin"]);
  });

  it("no-ops when the product doesn't exist", async () => {
    findById.mockResolvedValue(null);
    await removeProductImage("prod-1", "prod-1/existing.jpg");
    expect(remove).not.toHaveBeenCalled();
  });

  it("no-ops when the path doesn't belong to the product (would otherwise orphan another product's image)", async () => {
    findById.mockResolvedValue(product);
    await removeProductImage("prod-1", "other-product/photo.jpg");
    expect(remove).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("removes the file from storage and drops it from the product's image list", async () => {
    findById.mockResolvedValue(product);
    await removeProductImage("prod-1", "prod-1/existing.jpg");
    expect(remove).toHaveBeenCalledWith(["prod-1/existing.jpg"]);
    expect(update).toHaveBeenCalledWith("prod-1", { images: [] });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products/prod-1/edit");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shop");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});
