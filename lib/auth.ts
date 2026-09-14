import { cookies } from "next/headers";
import { cache } from "react";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";

const scryptAsync = promisify(scrypt);
const cookieName = "coverme_session";
const issuer = "coverme";
const jwtSecret = process.env.JWT_SECRET ?? "dev-only-change-me-before-real-users";

type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  exp: number;
  iss: string;
};

function base64url(input: string | ArrayBuffer) {
  const bytes = typeof input === "string" ? Buffer.from(input) : Buffer.from(input);
  return bytes.toString("base64url");
}

async function sign(data: string) {
  const key = await crypto.subtle.importKey("raw", Buffer.from(jwtSecret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return base64url(await crypto.subtle.sign("HMAC", key, Buffer.from(data)));
}

export async function createToken(user: { id: string; name: string; email: string }) {
  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    iss: issuer,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14,
  };
  const body = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(payload))}`;
  return `${body}.${await sign(body)}`;
}

export async function verifyToken(token?: string) {
  try {
    if (!token) return null;
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const expected = Buffer.from(await sign(`${header}.${payload}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionPayload;
    if (data.iss !== issuer || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = crypto.randomUUID();
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, saved: string) {
  const [salt, hash] = saved.split(":");
  if (!salt || !hash) return false;
  const savedHash = Buffer.from(hash, "base64url");
  const testHash = (await scryptAsync(password, salt, 64)) as Buffer;
  return savedHash.length === testHash.length && timingSafeEqual(savedHash, testHash);
}

export async function setSession(user: { id: string; name: string; email: string }) {
  const jar = await cookies();
  jar.set(cookieName, await createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const session = await verifyToken(jar.get(cookieName)?.value);
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true },
  });
});
