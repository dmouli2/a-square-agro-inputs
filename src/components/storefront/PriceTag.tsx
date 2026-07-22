export function PriceTag({ price, mrp }: { price: number; mrp?: number }) {
  const hasDiscount = mrp && mrp > price;
  const percentOff = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display font-bold text-lg text-foreground">
        {price.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-muted line-through">
            {mrp.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs font-semibold text-primary-700">{percentOff}% off</span>
        </>
      )}
    </div>
  );
}
