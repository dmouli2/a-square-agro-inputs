import type { Order, OrderStatus } from "@/types";

/** The store's WhatsApp Business number, international format without "+". */
export const STORE_WHATSAPP_NUMBER = "916374597757";

export function buildWaLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * wa.me needs the country code; checkout only accepts 10-digit Indian
 * mobile numbers, so the prefix is always 91.
 */
export function customerWaNumber(phone: string): string {
  return `91${phone}`;
}

const inr = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/**
 * Customer → store message: the full order summary, sent from the order
 * confirmation page. Doubles as the store's new-order notification and the
 * customer's receipt thread.
 */
export function orderSummaryMessage(order: Order): string {
  const a = order.shippingAddress;
  const address = [a.line1, a.line2, a.village, a.district, a.state].filter(Boolean).join(", ");
  return [
    `Hi, I just placed order #${order.id} on A Square Agro Inputs.`,
    "",
    ...order.items.map(
      (item) =>
        `• ${item.productName} (${item.variantLabel}) × ${item.quantity} — ${inr(item.priceAtPurchase * item.quantity)}`
    ),
    "",
    `Total: ${inr(order.total)} (Cash on Delivery)`,
    `Deliver to: ${a.fullName}, ${a.phone}`,
    `${address} — ${a.pincode}`,
  ].join("\n");
}

const STATUS_LINES: Record<OrderStatus, string> = {
  pending: "we've received your order and will call you shortly to confirm it.",
  confirmed: "your order is confirmed and is being prepared.",
  packed: "your order is packed and ready for dispatch.",
  shipped: "your order has been shipped and is on its way.",
  delivered: "your order has been delivered. Thank you for shopping with us!",
  cancelled: "your order has been cancelled. Reply here if this is unexpected.",
  returned: "your order has been marked as returned.",
};

/**
 * Store → customer message: prefilled status update the admin sends from the
 * order detail page after changing the status.
 */
export function statusUpdateMessage(order: Order): string {
  return [
    `Hi ${order.shippingAddress.fullName}, ${STATUS_LINES[order.status]}`,
    "",
    `Order #${order.id} — ${inr(order.total)} (Cash on Delivery)`,
    "— A Square Agro Inputs",
  ].join("\n");
}
