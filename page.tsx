import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { SetupWizard } from "@/components/SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [shop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, user.id)).limit(1);
  if (shop) redirect("/");
  return <SetupWizard userName={user.name} />;
}
