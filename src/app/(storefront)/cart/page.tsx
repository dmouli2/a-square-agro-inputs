import { getDb } from "@/lib/db";
import { getCartMap } from "@/lib/cart";
import { getImageStorage } from "@/lib/storage";
import { getCategoryFallbackImage } from "@/lib/categoryImages";
import { CartItemsList, type CartItemData } from "@/components/storefront/CartItemsList";
import { CartCleanup } from "@/components/storefront/CartCleanup";
import { ButtonLink } from "@/components/ui/Button";

export default async function CartPage() {
  const cart = await getCartMap();
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 pb-24 md:pb-16 flex flex-col items-center text-center gap-4">
        <span className="text-4xl">🧺</span>
        <h1 className="font-display font-bold text-xl text-foreground">Your cart is empty</h1>
        <p className="text-sm text-muted max-w-xs">Browse the catalog and add items to get started.</p>
        <ButtonLink href="/shop" size="lg">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const db = getDb();
  const resolvedOrNull = await Promise.all(
    entries.map(async ([variantId, quantity]) => {
      const product = await db.products.findByVariantId(variantId);
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!product || !variant) return null;
      return { variantId, quantity, product, variant };
    })
  );
  const resolved = resolvedOrNull.filter((item) => item !== null);
  const staleVariantIds = entries
    .map(([variantId]) => variantId)
    .filter((variantId) => !resolved.some((item) => item.variantId === variantId));

  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 pb-24 md:pb-16 flex flex-col items-center text-center gap-4">
        {staleVariantIds.length > 0 && <CartCleanup staleVariantIds={staleVariantIds} />}
        <span className="text-4xl">🧺</span>
        <h1 className="font-display font-bold text-xl text-foreground">Your cart is empty</h1>
        <p className="text-sm text-muted max-w-xs">Browse the catalog and add items to get started.</p>
        <ButtonLink href="/shop" size="lg">
          Browse products
        </ButtonLink>
      </div>
    );
  }

  const categories = await db.categories.list();
  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));
  const imageStorage = getImageStorage();

  const items: CartItemData[] = resolved.map((item) => {
    const ownImage = item.product.images[0] ? imageStorage.getPublicUrl(item.product.images[0]) : null;
    const fallbackImage = getCategoryFallbackImage(categorySlugById.get(item.product.categoryId));
    return {
      variantId: item.variantId,
      productName: item.product.name,
      brand: item.product.brand,
      variantLabel: item.variant.label,
      price: item.variant.price,
      quantity: item.quantity,
      imageUrl: ownImage ?? fallbackImage,
    };
  });

  return (
    <div className="mx-auto max-w-2xl md:max-w-5xl px-4 py-8 pb-40 md:pb-8">
      {staleVariantIds.length > 0 && <CartCleanup staleVariantIds={staleVariantIds} />}
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Your cart</h1>

      <CartItemsList initialItems={items} />
    </div>
  );
}
