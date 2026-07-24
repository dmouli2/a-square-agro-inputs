// Order ids are full UUIDs; showing all 36 characters in admin tables/headings
// is unreadable and makes the layout wider than it needs to be. The first 8
// characters (the UUID's first hyphen-delimited segment) are unique enough in
// practice for a single store's order volume and are what admins actually
// read off to find/reference an order — full id stays in the href/title for
// anyone who needs to copy the exact value.
export function shortOrderId(id: string): string {
  return id.slice(0, 8);
}
