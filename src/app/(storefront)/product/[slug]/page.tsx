import { notFound } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { getImageStorage } from "@/lib/storage";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const product = await db.products.findBySlug(slug);
  if (!product) notFound();

  const cart = await getCartMap();
  const initialCartQuantities = Object.fromEntries(product.variants.map((v) => [v.id, cart[v.id] ?? 0]));

  const category = await db.categories.list().then((cats) => cats.find((c) => c.id === product.categoryId));
  const hasComplianceInfo = product.activeIngredient || product.composition || product.registrationNumber || product.hsnCode;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      <nav className="text-xs text-muted mb-6 flex items-center gap-1.5">
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <ProductImageGallery
          imageUrls={product.images.map((path) => getImageStorage().getPublicUrl(path))}
          brandInitial={product.brand.slice(0, 1)}
          productName={product.name}
        />

        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wide">{product.brand}</span>
            <h1 className="font-display font-bold text-2xl text-foreground mt-1">{product.name}</h1>
          </div>

          {product.cropCompatibility.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.cropCompatibility.map((crop) => (
                <span key={crop} className="rounded-full bg-primary-50 text-primary-800 text-xs font-medium px-2.5 py-1">
                  {crop}
                </span>
              ))}
            </div>
          )}

          <ProductPurchasePanel variants={product.variants} initialCartQuantities={initialCartQuantities} />

          <p className="text-[15px] leading-relaxed text-foreground/85">{product.description}</p>

          {product.usageInstructions && (
            <div className="rounded-card border border-border bg-surface p-4">
              <span className="text-sm font-semibold text-foreground">Usage instructions</span>
              <p className="text-sm text-muted mt-1 leading-relaxed">{product.usageInstructions}</p>
            </div>
          )}

          {hasComplianceInfo && (
            <div className="rounded-card border border-border bg-primary-50/50 p-4 flex flex-col gap-1.5 text-sm">
              {product.activeIngredient && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Active ingredient</span>
                  <span className="text-foreground font-medium text-right">{product.activeIngredient}</span>
                </div>
              )}
              {product.composition && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Composition</span>
                  <span className="text-foreground font-medium text-right">{product.composition}</span>
                </div>
              )}
              {product.registrationNumber && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">CIB&amp;RC registration</span>
                  <span className="text-foreground font-medium text-right">{product.registrationNumber}</span>
                </div>
              )}
              {product.hsnCode && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">HSN code</span>
                  <span className="text-foreground font-medium text-right">{product.hsnCode}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
