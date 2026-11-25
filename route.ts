import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, shops } from "@/db/schema";
import { requireShop, str } from "@/lib/api";
import { ACTIVITY_DEFS } from "@/lib/business";

export async function PATCH(request: Request) {
  const context = await requireShop();
  if (!context) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of ["name", "ownerName", "phone", "address", "currency"] as const) {
    if (field in body) updates[field] = str(body[field]);
  }
  if (updates.name === "") {
    return NextResponse.json({ error: "اسم المحل مطلوب" }, { status: 400 });
  }

  const [shop] = await db
    .update(shops)
    .set(updates)
    .where(eq(shops.id, context.shop.id))
    .returning();

  if (Array.isArray(body.activities)) {
    const requested = body.activities.map(String);
    const valid = ACTIVITY_DEFS.map((item) => item.type).filter((type) => requested.includes(type));
    if (valid.length) {
      await db
        .update(activities)
        .set({ active: false })
        .where(and(eq(activities.shopId, context.shop.id)));
      for (const type of valid) {
        const existing = await db
          .select({ id: activities.id })
          .from(activities)
          .where(and(eq(activities.shopId, context.shop.id), eq(activities.type, type)))
          .limit(1);
        if (existing.length) {
          await db.update(activities).set({ active: true }).where(eq(activities.id, existing[0].id));
        } else {
          await db.insert(activities).values({ shopId: context.shop.id, type, active: true });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, shop });
}
