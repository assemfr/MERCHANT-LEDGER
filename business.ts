export type ActivityType =
  | "electronics"
  | "animals"
  | "clothing"
  | "food"
  | "services"
  | "general";

export type ActivityDef = {
  type: ActivityType;
  label: string;
  short: string;
  icon: string;
  description: string;
  unit: string;
  defaultMargin: number;
  keywords: string[];
  categories: string[];
};

export const ACTIVITY_DEFS: ActivityDef[] = [
  {
    type: "electronics",
    label: "الإلكترونيات والهواتف",
    short: "إلكترونيات",
    icon: "📱",
    description: "هواتف، حواسيب، ملحقات وصيانة أجهزة",
    unit: "قطعة",
    defaultMargin: 22,
    keywords: [
      "هاتف", "جوال", "ايفون", "آيفون", "سامسونج", "لابتوب", "حاسوب", "كمبيوتر", "شاشة",
      "سماعة", "شاحن", "بطارية", "طابعة", "كاميرا", "تابلت", "آيباد", "ايباد", "مروحة",
      "تلفاز", "تلفزيون", "راوتر", "وحدة تخزين", "فلاش", "ماوس", "كيبورد", "إلكترون",
      "متحكم", "بوردة", "معالج", " Phone", "iphone", "laptop", "samsung", "tv",
    ],
    categories: ["هاتف", "لابتوب", "ملحقات", "صيانة", "شاشات"],
  },
  {
    type: "animals",
    label: "الحيوانات والعلف",
    short: "حيوانات",
    icon: "🐑",
    description: "ماشية، أغنام، دواجن، علف وصحة حيوانية",
    unit: "رأس",
    defaultMargin: 16,
    keywords: [
      "خروف", "غنم", "أغنام", "بقرة", "بقر", "عجل", "جمل", "إبل", "ماعز", "دجاج", "فرخ",
      "بيض", "علف", "شعير", "برسيم", "تبن", "حيوان", "ماشية", "سمك", "أرنب", "لقاح",
      "دواء بيطري", "بيطري", "حليب",
    ],
    categories: ["أغنام", "ماشية", "دواجن", "علف", "صحة حيوانية"],
  },
  {
    type: "clothing",
    label: "الألبسة والأقمشة",
    short: "ألبسة",
    icon: "👕",
    description: "ملابس جاهزة، أقمشة، أحذية وإكسسوارات",
    unit: "قطعة",
    defaultMargin: 35,
    keywords: ["قميص", "فستان", "بنطال", "جاكيت", "حذاء", "جوارب", "قماش", "ملابس", "تيشيرت", "عباءة", "حجاب", "حقيبة"],
    categories: ["ملابس", "أحذية", "أقمشة", "إكسسوارات"],
  },
  {
    type: "food",
    label: "المواد الغذائية",
    short: "غذائية",
    icon: "🛒",
    description: "مواد غذائية، مشروبات وتونا",
    unit: "كغ",
    defaultMargin: 18,
    keywords: ["أرز", "زيت", "طحين", "دقيق", "سكر", "شاي", "قهوة", "حليب", "جبنة", "تونا", "خضار", "فواكه", "غذاء", "ماء", "عصير"],
    categories: ["مواد أساسية", "مشروبات", "طازج", "معلبات"],
  },
  {
    type: "services",
    label: "الخدمات والحرف",
    short: "خدمات",
    icon: "🛠️",
    description: "صيانة، تركيب، تصميم وأعمال حرفية",
    unit: "خدمة",
    defaultMargin: 45,
    keywords: ["صيانة", "تركيب", "خدمة", "تصليح", "تصميم", "طباعة", "تنظيف", "نقل", "أجرة", "اشتراك", "استشارة", "تطوير"],
    categories: ["صيانة", "تركيب", "تصميم", "استشارة"],
  },
  {
    type: "general",
    label: "نشاط عام",
    short: "عام",
    icon: "📦",
    description: "سلع متنوعة وغير مصنفة",
    unit: "قطعة",
    defaultMargin: 25,
    keywords: [],
    categories: ["متنوع"],
  },
];

export const ACTIVITY_MAP = Object.fromEntries(
  ACTIVITY_DEFS.map((item) => [item.type, item]),
) as Record<ActivityType, ActivityDef>;

export const EXPENSE_CATEGORIES = [
  { key: "rent", label: "كراء المحل", icon: "🏪", hint: "الإيجار الشهري أو اليومي" },
  { key: "wages", label: "أجرة العمال", icon: "👷", hint: "الأجور والمساعدات" },
  { key: "transport", label: "النقل والشحن", icon: "🚚", hint: "نقل البضائع والزبائن" },
  { key: "food", label: "الأكل والمصاريف اليومية", icon: "🍽️", hint: "الوجبات والمصاريف الصغيرة" },
  { key: "electricity", label: "الكهرباء والماء", icon: "💡", hint: "المرافق والفواتير" },
  { key: "feed", label: "العلف", icon: "🌾", hint: "علف الحيوانات" },
  { key: "veterinary", label: "الصحة البيطرية", icon: "💉", hint: "الأدوية واللقاحات" },
  { key: "marketing", label: "الإعلان والتسويق", icon: "📣", hint: "الإعلانات والعمولات" },
  { key: "other", label: "أخرى", icon: "🧾", hint: "مصاريف غير مصنفة" },
] as const;

export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORIES)[number]["key"];

export const DEAL_STATUSES = [
  { key: "completed", label: "مكتملة", color: "emerald" },
  { key: "pending", label: "قيد الانتظار", color: "amber" },
  { key: "cancelled", label: "ملغية", color: "rose" },
] as const;

export function detectActivityType(name: string, available?: string[]): ActivityType {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return "general";
  for (const def of ACTIVITY_DEFS) {
    if (def.type === "general") continue;
    if (def.keywords.some((word) => normalized.includes(word.toLowerCase()))) {
      if (!available || available.includes(def.type)) return def.type;
    }
  }
  if (available?.includes("general")) return "general";
  return (available?.[0] as ActivityType) ?? "general";
}

export type CostInput = {
  quantity?: number;
  unitPrice?: number;
  unitCost?: number;
  rent?: number;
  wages?: number;
  transport?: number;
  food?: number;
  other?: number;
};

export function dealFinancials(deal: CostInput) {
  const quantity = Number(deal.quantity) || 0;
  const revenue = quantity * (Number(deal.unitPrice) || 0);
  const directCost = quantity * (Number(deal.unitCost) || 0);
  const hidden =
    (Number(deal.rent) || 0) +
    (Number(deal.wages) || 0) +
    (Number(deal.transport) || 0) +
    (Number(deal.food) || 0) +
    (Number(deal.other) || 0);
  const profit = revenue - directCost - hidden;
  return {
    revenue,
    directCost,
    hidden,
    totalCost: directCost + hidden,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
  };
}

export type PricingInput = CostInput & {
  activityType?: ActivityType | string;
  feedDays?: number;
  feedDailyKg?: number;
  feedPricePerKg?: number;
  veterinary?: number;
  electricity?: number;
  targetMargin?: number;
};

export function calculatePricing(input: PricingInput) {
  const quantity = Math.max(Number(input.quantity) || 1, 1);
  const purchase = (Number(input.unitCost) || 0) * quantity;
  const rent = Number(input.rent) || 0;
  const wages = Number(input.wages) || 0;
  const transport = Number(input.transport) || 0;
  const food = Number(input.food) || 0;
  const electricity = Number(input.electricity) || 0;
  const other = Number(input.other) || 0;
  const veterinary = Number(input.veterinary) || 0;
  const feedDays = Number(input.feedDays) || 0;
  const feedDailyKg = Number(input.feedDailyKg) || 0;
  const feedPricePerKg = Number(input.feedPricePerKg) || 0;
  const feed = feedDays * feedDailyKg * feedPricePerKg;
  const activity = (input.activityType ?? "general") as ActivityType;
  const targetMargin =
    Number(input.targetMargin) || ACTIVITY_MAP[activity]?.defaultMargin || 25;

  const overhead = rent + wages + transport + food + electricity + other + veterinary + feed;
  const totalCost = purchase + overhead;
  const unitCost = totalCost / quantity;
  const minimum = unitCost * (1 + 0.1);
  const recommended = unitCost * (1 + targetMargin / 100);
  const maximum = unitCost * (1 + targetMargin / 100 + 0.15);

  return {
    purchase,
    rent,
    wages,
    transport,
    food,
    electricity,
    other,
    veterinary,
    feed,
    overhead,
    totalCost,
    unitCost,
    minimum,
    recommended,
    maximum,
    targetMargin,
    unitProfit: recommended - unitCost,
  };
}

export function formatMoney(amount: number, currency = "د.ج") {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 1 }).format(value)} ${currency}`;
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 1 }).format(Number(amount) || 0);
}

export function toDateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type PeriodKey = "today" | "week" | "month" | "year" | "custom" | "all";

export function periodRange(
  period: PeriodKey,
  customStart?: string,
  customEnd?: string,
): { start: Date | null; end: Date | null } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      return { start, end };
    case "week": {
      const s = new Date(start);
      s.setDate(s.getDate() - 6);
      return { start: s, end };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end };
    case "custom":
      return {
        start: customStart ? new Date(customStart) : null,
        end: customEnd ? new Date(`${customEnd}T23:59:59`) : null,
      };
    default:
      return { start: null, end: null };
  }
}

export function inPeriod(date: Date | string, range: { start: Date | null; end: Date | null }) {
  const value = new Date(date).getTime();
  if (range.start && value < range.start.getTime()) return false;
  if (range.end && value > range.end.getTime()) return false;
  return true;
}
