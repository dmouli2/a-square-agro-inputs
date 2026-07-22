import type { Order, OrderStatus } from "@/types";

/** The store's WhatsApp Business number, international format without "+". Used by the
 *  floating "Chat with us" button (src/components/storefront/WhatsAppButton.tsx). */
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
