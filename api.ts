import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops, type Shop, type User } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function requireShop(): Promise<{ user: User; shop: Shop } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const [shop] = await db.select().from(shops).where(eq(shops.ownerId, user.id)).limit(1);
  if (!shop) return null;
  return { user, shop };
}

export function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function dateOrNow(value: unknown) {
  if (typeof value !== "string" || !value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
