"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/net";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export interface LoginState {
  error: string | null;
}

// A valid-shaped bcrypt hash of a value nobody will ever type as a password.
// Used to keep the login response time constant whether or not the email
// matches an account, so timing can't be used to enumerate valid admin
// emails (a real bcrypt.compare() and this dummy one cost about the same).
const DUMMY_PASSWORD_HASH = "$2b$10$U635vaF8l/Gb1yh3aBwK8u2KeD/GJaOEMyDe.bbBNdfaFTLPYrKmm";

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return { error: "Please enter your email and password." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const ip = await getClientIp();
  const rateLimit = await getDb().loginRateLimiter.checkAndRecord({ ip, email: normalizedEmail });
  if (!rateLimit.allowed) {
    return { error: "Too many login attempts. Please wait a few minutes and try again." };
  }

  const staff = await getDb().staff.findByEmail(normalizedEmail);
  const valid = await bcrypt.compare(password, staff && staff.active ? staff.passwordHash : DUMMY_PASSWORD_HASH);

  if (!staff || !staff.active || !valid) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken({ staffId: staff.id });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
