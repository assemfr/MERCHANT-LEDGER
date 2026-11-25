import { db } from "@/db";
import { activities, deals, expenses, products, shops, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { detectActivityType } from "@/lib/business";

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 13) % 60, 0, 0);
  return date;
};

export async function ensureSeed() {
  const existing = await db.select({ id: shops.id }).from(shops).limit(1);
  if (existing.length > 0) return;

  const [demo] = await db
    .insert(users)
    .values({
      name: "أحمد المصري",
      email: "demo@merchant-ledger.app",
      passwordHash: hashPassword("demo1234"),
    })
    .returning();

  const [shop] = await db
    .insert(shops)
    .values({
      ownerId: demo.id,
      name: "متجر النور للتجارة",
      ownerName: "أحمد المصري",
      phone: "0550 12 34 56",
      address: "شارع الاستقلال، الجزائر العاصمة",
      currency: "د.ج",
    })
    .returning();

  await db.insert(activities).values(
    ["electronics", "animals", "general"].map((type) => ({
      shopId: shop.id,
      type,
      active: true,
    })),
  );

  const productSeed = [
    { name: "هاتف iPhone 13 - 128G", sku: "PH-101", activityType: "electronics", purchasePrice: 68000, stock: 4, unit: "قطعة" },
    { name: "سماعات لاسلكية Bluetooth", sku: "PH-118", activityType: "electronics", purchasePrice: 3200, stock: 12, unit: "قطعة" },
    { name: "لابتوب Lenovo IdeaPad", sku: "LP-204", activityType: "electronics", purchasePrice: 87000, stock: 2, unit: "قطعة" },
    { name: "شاحن سريع 65 واط", sku: "AC-311", activityType: "electronics", purchasePrice: 1450, stock: 25, unit: "قطعة" },
    { name: "خروف بلدي", sku: "AN-010", activityType: "animals", purchasePrice: 42000, stock: 6, unit: "رأس" },
    { name: "علف مركّز 25 كغ", sku: "AN-055", activityType: "animals", purchasePrice: 2800, stock: 18, unit: "كيس" },
    { name: "دجاج منني 45 يوم", sku: "AN-077", activityType: "animals", purchasePrice: 650, stock: 40, unit: "قطعة" },
    { name: "منظف متعدد الاستعمالات", sku: "GN-009", activityType: "general", purchasePrice: 380, stock: 30, unit: "قطعة" },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productSeed.map((item) => ({ ...item, shopId: shop.id })))
    .returning();

  const byName = Object.fromEntries(insertedProducts.map((item) => [item.name, item.id]));

  const dealSeed = [
    { p: "هاتف iPhone 13 - 128G", customer: "ياسين ب.", qty: 1, price: 82500, days: 0, rent: 900, wages: 600, transport: 250, food: 180, other: 70, status: "completed", note: "مع حافظة وهدية" },
    { p: "سماعات لاسلكية Bluetooth", customer: "سارة ع.", qty: 2, price: 4650, days: 0, rent: 700, wages: 400, transport: 150, food: 120, other: 40, status: "completed", note: "طلب عبر واتساب" },
    { p: "خروف بلدي", customer: "محمد ك.", qty: 1, price: 57500, days: 1, rent: 600, wages: 500, transport: 800, food: 250, other: 100, status: "completed", note: "علف 20 يوماً محسوب في التكلفة" },
    { p: "شاحن سريع 65 واط", customer: "عمر د.", qty: 3, price: 2150, days: 1, rent: 500, wages: 300, transport: 100, food: 90, other: 30, status: "completed", note: "" },
    { p: "لابتوب Lenovo IdeaPad", customer: "شركة الأفق", qty: 1, price: 104000, days: 2, rent: 900, wages: 800, transport: 400, food: 200, other: 150, status: "completed", note: "فاتورة شركة" },
    { p: "علف مركّز 25 كغ", customer: "مربي الحاج ب.", qty: 4, price: 3550, days: 3, rent: 450, wages: 350, transport: 600, food: 120, other: 50, status: "completed", note: "توصيل للمزرعة" },
    { p: "دجاج منني 45 يوم", customer: "سوق الجمعة", qty: 12, price: 980, days: 4, rent: 500, wages: 400, transport: 350, food: 180, other: 60, status: "completed", note: "بيع بالجملة" },
    { p: "هاتف iPhone 13 - 128G", customer: "ليلى م.", qty: 1, price: 79000, days: 5, rent: 850, wages: 550, transport: 200, food: 140, other: 50, status: "pending", note: "في انتظار التحويل" },
    { p: "منظف متعدد الاستعمالات", customer: "عميل عابر", qty: 5, price: 590, days: 6, rent: 400, wages: 250, transport: 90, food: 80, other: 20, status: "completed", note: "" },
    { p: "سماعات لاسلكية Bluetooth", customer: "نور الدين", qty: 1, price: 4900, days: 7, rent: 700, wages: 400, transport: 120, food: 100, other: 30, status: "completed", note: "" },
    { p: "خروف بلدي", customer: "عائلة بن يوسف", qty: 2, price: 54000, days: 8, rent: 700, wages: 600, transport: 900, food: 300, other: 120, status: "completed", note: "عيد ميلاد" },
    { p: "شاحن سريع 65 واط", customer: "أمينة", qty: 2, price: 2200, days: 10, rent: 500, wages: 300, transport: 100, food: 80, other: 20, status: "cancelled", note: "أُلغي من الزبون" },
    { p: "لابتوب Lenovo IdeaPad", customer: "مجتمع المبدعين", qty: 1, price: 99000, days: 11, rent: 900, wages: 700, transport: 350, food: 180, other: 90, status: "completed", note: "" },
    { p: "دجاج منني 45 يوم", customer: "مطعم الأصالة", qty: 20, price: 920, days: 13, rent: 600, wages: 500, transport: 500, food: 240, other: 80, status: "completed", note: "عقد أسبوعي" },
    { p: "علف مركّز 25 كغ", customer: "مربي الشرق", qty: 3, price: 3400, days: 16, rent: 450, wages: 300, transport: 700, food: 110, other: 40, status: "completed", note: "" },
    { p: "هاتف iPhone 13 - 128G", customer: "رضا أ.", qty: 1, price: 84000, days: 19, rent: 900, wages: 600, transport: 200, food: 160, other: 60, status: "completed", note: "" },
  ];

  await db.insert(deals).values(
    dealSeed.map((deal) => {
      const product = insertedProducts.find((item) => item.id === byName[deal.p])!;
      return {
        shopId: shop.id,
        productId: product.id,
        customerName: deal.customer,
        itemName: product.name,
        activityType: detectActivityType(product.name),
        quantity: deal.qty,
        unitPrice: deal.price,
        unitCost: product.purchasePrice,
        rent: deal.rent,
        wages: deal.wages,
        transport: deal.transport,
        food: deal.food,
        other: deal.other,
        status: deal.status,
        note: deal.note,
        date: daysAgo(deal.days, 9 + (deal.days % 8)),
      };
    }),
  );

  const expenseSeed: Array<[string, number, number, string, string]> = [
    ["rent", 18000, 1, "كراء المحل - شهر", "المالك"],
    ["wages", 12000, 1, "أجرة العامل", "يوسف"],
    ["electricity", 3400, 2, "فاتورة الكهرباء", "سونلغاز"],
    ["transport", 2200, 3, "نقل بضائع", "نقل السريع"],
    ["food", 1800, 3, "وجبات اليوم", ""],
    ["marketing", 5000, 4, "إعلان فيسبوك", "Meta"],
    ["rent", 18000, 5, "كراء المحل", "المالك"],
    ["wages", 12000, 5, "أجرة العمال", "يوسف"],
    ["feed", 9500, 6, "شراء علف", "مزارع الوادي"],
    ["veterinary", 3200, 7, "لقاحات الأغنام", "عيادة بيطرية"],
    ["transport", 3100, 8, "نقل الأغنام", "نقل الريف"],
    ["food", 2100, 9, "مصاريف يومية", ""],
    ["electricity", 2900, 10, "فاتورة الماء والكهرباء", ""],
    ["other", 1400, 11, "أكياس تغليف", ""],
    ["feed", 7200, 12, "علف مركّز", "مزارع الوادي"],
    ["rent", 18000, 14, "كراء المحل", "المالك"],
    ["wages", 12000, 14, "أجرة العمال", "يوسف"],
    ["transport", 1900, 15, "توصيل طلبات", ""],
    ["food", 1600, 17, "وجبات العمال", ""],
    ["other", 2750, 18, "صيانة الواجهة", ""],
  ];

  await db.insert(expenses).values(
    expenseSeed.map(([category, amount, days, note, vendor]) => ({
      shopId: shop.id,
      category,
      amount,
      note,
      vendor,
      date: daysAgo(days, 16),
    })),
  );
}
