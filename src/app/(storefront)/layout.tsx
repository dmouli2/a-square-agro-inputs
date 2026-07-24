import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { CartCountProvider } from "@/components/storefront/CartCountContext";
import { getCartCount } from "@/lib/cart";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();

  return (
    <CartCountProvider initialCount={cartCount}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <MobileTabBar />
    </CartCountProvider>
  );
}
