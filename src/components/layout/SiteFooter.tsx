export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary-900 text-primary-50 pb-20 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <span className="font-display font-extrabold text-lg text-white">A Square Agro Inputs</span>
          <p className="text-sm text-primary-100/80 max-w-xs">
            Quality seeds, fertilizers, crop protection and farm tools — sourced from trusted
            manufacturers, delivered to your doorstep.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-white mb-1">Shop</span>
          <a href="/shop?category=seeds" className="text-primary-100/80 hover:text-white transition-colors">Seeds</a>
          <a href="/shop?category=fertilizers" className="text-primary-100/80 hover:text-white transition-colors">Fertilizers</a>
          <a href="/shop?category=crop-protection" className="text-primary-100/80 hover:text-white transition-colors">Crop Protection</a>
          <a href="/shop?category=tools-equipment" className="text-primary-100/80 hover:text-white transition-colors">Tools & Equipment</a>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-white mb-1">Support</span>
          <span className="text-primary-100/80">Call us: +91 00000 00000</span>
          <span className="text-primary-100/80">Mon–Sat, 9am–7pm</span>
        </div>
      </div>
      <div className="border-t border-primary-800/60">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-100/60">
          © {new Date().getFullYear()} A Square Agro Inputs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
