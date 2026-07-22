import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "a2_session";

export interface SessionPayload {
  staffId: string;
}

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.staffId !== "string") return null;
    return { staffId: payload.staffId };
  } catch {
    return null;
  }
}
