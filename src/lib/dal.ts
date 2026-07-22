import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import type { Staff, StaffRole } from "@/types";

export async function verifySession(): Promise<Staff | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const staff = await getDb().staff.findById(payload.staffId);
  if (!staff || !staff.active) return null;
  return staff;
}

export async function requireRole(roles: StaffRole[]): Promise<Staff> {
  const staff = await verifySession();
  if (!staff || !roles.includes(staff.role)) {
    redirect("/admin/login");
  }
  return staff;
}
