"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowUpRight, BarChart3, BookOpenText,
  Boxes, Calculator, CalendarDays, Check, ChevronLeft, CircleDollarSign, ClipboardList,
  Copy, Download, FileText, LayoutDashboard, LogOut, Menu, Package, Pencil, PieChart,
  Plus, ReceiptText, Search, Settings2, Share2, ShieldAlert, Sparkles, Store, Trash2,
  TrendingUp, Users, Wallet, X,
} from "lucide-react";
import {
  ACTIVITY_MAP, EXPENSE_CATEGORIES, dealFinancials, formatMoney, formatNumber,
  inPeriod, periodRange, type ActivityType, type PeriodKey,
} from "@/lib/business";
import type { DashboardData, DealView, ExpenseView, ProductView, ShareView, ShopView } from "@/lib/types";
import { DealForm, ExpenseForm, PricingCalculator, ProductForm, type DealDraft } from "@/components/Forms";
import { EmptyState, Modal, Spinner, TableSkeleton, Toast } from "@/components/ui";

type View = "overview" | "deals" | "expenses" | "products" | "pricing" | "reports" | "settings";

const NAV: Array<{ key: View; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "deals", label: "الصفقات", icon: ReceiptText },
  { key: "expenses", label: "المصاريف الخفية", icon: Wallet },
  { key: "products", label: "السلع والمخزون", icon: Package },
  { key: "pricing", label: "حاسبة التسعير", icon: Calculator },
  { key: "reports", label: "التقارير والمشاركة", icon: PieChart },
  { key: "settings", label: "إعدادات الدفتر", icon: Settings2 },
];

const VIEW_TITLES: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "نظرة عامة", subtitle: "ملخص أداء محلك وأرباحك الحقيقية" },
  deals: { title: "الصفقات", subtitle: "كل عملية بيع مع المصاريف الخفية وصافي الربح" },
  expenses: { title: "المصاريف الخفية", subtitle: "كراء المحل، الأجور، النقل والأكل والمصاريف اليومية" },
  products: { title: "السلع والمخزون", subtitle: "أضف سلعك مرة واحدة واستخدمها في كل صفقة" },
  pricing: { title: "حاسبة التسعير الذكي", subtitle: "سعر بيع مدروس حسب نشاطك وتكاليفك الحقيقية" },
  reports: { title: "التقارير والمشاركة", subtitle: "سجل يومي أو شهري أو سنوي جاهز للمشاركة والتصدير" },
  settings: { title: "إعدادات الدفتر", subtitle: "بيانات المحل والنشاطات المسموح بها" },
};

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "حدث خطأ غير متوقع");
  return data as T;
}

function dealView(value: Record<string, unknown>): DealView {
  return { ...value, createdAt: new Date(String(value.createdAt)).toISOString(), date: new Date(String(value.date)).toISOString() } as DealView;
}
function expenseView(value: Record<string, unknown>): ExpenseView {
  return { ...value, createdAt: new Date(String(value.createdAt)).toISOString(), date: new Date(String(value.date)).toISOString() } as ExpenseView;
}
function productView(value: Record<string, unknown>): ProductView {
  return { ...value, createdAt: new Date(String(value.createdAt)).toISOString(), updatedAt: new Date(String(value.updatedAt)).toISOString() } as ProductView;
}

function StatCard({ label, value, sub, icon, tone = "teal" }: {
  label: string; value: string; sub: string; icon: React.ReactNode; tone?: "teal" | "emerald" | "amber" | "slate";
}) {
  const tones = {
    teal: "bg-[#e7f5f1] text-[#0f766e]",
    emerald: "bg-[#e8f7f0] text-[#15805a]",
    amber: "bg-[#fff4df] text-[#a46f15]",
    slate: "bg-[#eef2f0] text-[#52635c]",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${tones[tone]}`}>{icon}</div>
        <span className="text-[11px] text-[#9aa9a2]">المحل</span>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-[#7b8c84]">{label}</p>
      <p className="number mt-1 text-[22px] font-bold leading-tight text-[#172c27]">{value}</p>
      <p className="mt-1 text-[11px] text-[#9aa9a2]">{sub}</p>
    </div>
  );
}

function ActivityBadge({ type }: { type: string }) {
  const def = ACTIVITY_MAP[type as ActivityType];
  return <span className="badge badge-slate"><span>{def?.icon ?? "📦"}</span> {def?.short ?? "عام"}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: "مكتملة", className: "badge-emerald" },
    pending: { label: "قيد الانتظار", className: "badge-amber" },
    cancelled: { label: "ملغية", className: "badge-rose" },
  };
  const item = map[status] ?? map.completed;
  return <span className={`badge ${item.className}`}>{item.label}</span>;
}

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [deals, setDeals] = useState(initialData.deals);
  const [expenses, setExpenses] = useState(initialData.expenses);
  const [products, setProducts] = useState(initialData.products);
  const [shares, setShares] = useState(initialData.shares);
  const [activities, setActivities] = useState(initialData.activities);
  const [shop, setShop] = useState(initialData.shop);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [expenseFilter, setExpenseFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dealModal, setDealModal] = useState<{ open: boolean; deal: DealView | null }>({ open: false, deal: null });
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense: ExpenseView | null }>({ open: false, expense: null });
  const [productModal, setProductModal] = useState<{ open: boolean; product: ProductView | null }>({ open: false, product: null });
  const [pricingModal, setPricingModal] = useState(false);
  const [detailDeal, setDetailDeal] = useState<DealView | null>(null);
  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const range = useMemo(() => periodRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const currency = shop.currency;
  const activeActivities = activities.filter((item) => item.active);

  const periodDeals = useMemo(() => deals.filter((deal) => inPeriod(deal.date, range)), [deals, range]);
  const periodExpenses = useMemo(() => expenses.filter((item) => inPeriod(item.date, range)), [expenses, range]);
  const completed = periodDeals.filter((deal) => deal.status === "completed");
  const revenue = completed.reduce((sum, deal) => sum + dealFinancials(deal).revenue, 0);
  const dealProfit = completed.reduce((sum, deal) => sum + dealFinancials(deal).profit, 0);
  const hiddenOnDeals = completed.reduce((sum, deal) => sum + dealFinancials(deal).hidden, 0);
  const generalExpenses = periodExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = dealProfit - generalExpenses;
  const hiddenRatio = revenue > 0 ? ((hiddenOnDeals + generalExpenses) / revenue) * 100 : 0;

  function changeView(next: View) {
    setView(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notify(message: string, kind: "success" | "error" = "success") {
    setToast({ message, kind });
  }

  async function saveDeal(draft: DealDraft, existing?: DealView | null) {
    const tempId = existing?.id ?? -Date.now();
    const optimistic: DealView = {
      id: tempId,
      shopId: shop.id,
      productId: draft.productId,
      customerName: draft.customerName,
      itemName: draft.itemName,
      activityType: draft.activityType,
      quantity: draft.quantity,
      unitPrice: draft.unitPrice,
      unitCost: draft.unitCost,
      rent: draft.rent,
      wages: draft.wages,
      transport: draft.transport,
      food: draft.food,
      other: draft.other,
      status: draft.status,
      note: draft.note,
      date: draft.date ? new Date(draft.date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setDeals((current) => existing ? current.map((item) => item.id === existing.id ? optimistic : item) : [optimistic, ...current]);
    setDealModal({ open: false, deal: null });
    setMutating(true);
    try {
      const result = await apiRequest<{ deal: Record<string, unknown> }>(
        existing ? `/api/deals/${existing.id}` : "/api/deals",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const saved = dealView(result.deal);
      setDeals((current) => current.map((item) => item.id === tempId ? saved : item));
      notify(existing ? "تم تحديث الصفقة" : "تمت إضافة الصفقة بنجاح");
    } catch (error) {
      setDeals((current) => existing ? current.map((item) => item.id === tempId ? existing : item) : current.filter((item) => item.id !== tempId));
      setDealModal({ open: true, deal: existing ?? null });
      notify(error instanceof Error ? error.message : "تعذر حفظ الصفقة", "error");
      throw error;
    } finally {
      setMutating(false);
    }
  }

  async function removeDeal(deal: DealView) {
    if (!window.confirm(`حذف صفقة «${deal.itemName}» نهائياً؟`)) return;
    const backup = deals;
    setDeals((current) => current.filter((item) => item.id !== deal.id));
    setMutating(true);
    try {
      await apiRequest(`/api/deals/${deal.id}`, { method: "DELETE" });
      notify("تم حذف الصفقة");
    } catch {
      setDeals(backup);
      notify("تعذر حذف الصفقة", "error");
    } finally {
      setMutating(false);
    }
  }

  async function saveExpense(draft: { category: string; amount: number; note: string; vendor: string; date: string }, existing?: ExpenseView | null) {
    const tempId = existing?.id ?? -Date.now();
    const optimistic: ExpenseView = {
      ...draft,
      id: tempId,
      shopId: shop.id,
      createdAt: new Date().toISOString(),
      date: draft.date ? new Date(draft.date).toISOString() : new Date().toISOString(),
    };
    setExpenses((current) => existing ? current.map((item) => item.id === existing.id ? optimistic : item) : [optimistic, ...current]);
    setExpenseModal({ open: false, expense: null });
    setMutating(true);
    try {
      const result = await apiRequest<{ expense: Record<string, unknown> }>(
        existing ? `/api/expenses/${existing.id}` : "/api/expenses",
        { method: existing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) },
      );
      const saved = expenseView(result.expense);
      setExpenses((current) => current.map((item) => item.id === tempId ? saved : item));
      notify(existing ? "تم تحديث المصروف" : "تم تسجيل المصروف");
    } catch (error) {
      setExpenses((current) => existing ? current.map((item) => item.id === tempId ? existing : item) : current.filter((item) => item.id !== tempId));
      setExpenseModal({ open: true, expense: existing ?? null });
      notify(error instanceof Error ? error.message : "تعذر حفظ المصروف", "error");
      throw error;
    } finally {
      setMutating(false);
    }
  }

  async function removeExpense(expense: ExpenseView) {
    if (!window.confirm("حذف هذا المصروف؟")) return;
    const backup = expenses;
    setExpenses((current) => current.filter((item) => item.id !== expense.id));
    try {
      await apiRequest(`/api/expenses/${expense.id}`, { method: "DELETE" });
      notify("تم حذف المصروف");
    } catch {
      setExpenses(backup);
      notify("تعذر حذف المصروف", "error");
    }
  }

  async function saveProduct(draft: { name: string; sku: string; activityType: string; purchasePrice: number; stock: number; unit: string }, existing?: ProductView | null) {
    const tempId = existing?.id ?? -Date.now();
    const optimistic: ProductView = { ...draft, id: tempId, shopId: shop.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setProducts((current) => existing ? current.map((item) => item.id === existing.id ? optimistic : item) : [optimistic, ...current]);
    setProductModal({ open: false, product: null });
    setMutating(true);
    try {
      const result = await apiRequest<{ product: Record<string, unknown> }>(
        existing ? `/api/products/${existing.id}` : "/api/products",
        { method: existing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) },
      );
      const saved = productView(result.product);
      setProducts((current) => current.map((item) => item.id === tempId ? saved : item));
      notify(existing ? "تم تحديث السلعة" : "تمت إضافة السلعة");
    } catch (error) {
      setProducts((current) => existing ? current.map((item) => item.id === tempId ? existing : item) : current.filter((item) => item.id !== tempId));
      setProductModal({ open: true, product: existing ?? null });
      notify(error instanceof Error ? error.message : "تعذر حفظ السلعة", "error");
      throw error;
    } finally {
      setMutating(false);
    }
  }

  async function removeProduct(product: ProductView) {
    if (!window.confirm(`حذف سلعة «${product.name}»؟`)) return;
    const backup = products;
    setProducts((current) => current.filter((item) => item.id !== product.id));
    try {
      await apiRequest(`/api/products/${product.id}`, { method: "DELETE" });
      notify("تم حذف السلعة");
    } catch {
      setProducts(backup);
      notify("تعذر حذف السلعة", "error");
    }
  }

  async function createShare() {
    setMutating(true);
    try {
      const titleMap: Record<string, string> = { today: "السجل اليومي", week: "سجل آخر 7 أيام", month: "السجل الشهري", year: "السجل السنوي", all: "كل السجلات", custom: "سجل فترة مخصصة" };
      const result = await apiRequest<{ link: ShareView & { url: string } }>("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleMap[period],
          periodStart: range.start?.toISOString() ?? null,
          periodEnd: range.end?.toISOString() ?? null,
        }),
      });
      setShares((current) => [result.link, ...current]);
      const fullUrl = `${window.location.origin}${result.link.url}`;
      await navigator.clipboard?.writeText(fullUrl);
      notify("تم إنشاء رابط المشاركة ونسخه");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر إنشاء الرابط", "error");
    } finally {
      setMutating(false);
    }
  }

  async function removeShare(id: number) {
    const backup = shares;
    setShares((current) => current.filter((item) => item.id !== id));
    try {
      await apiRequest(`/api/shares/${id}`, { method: "DELETE" });
      notify("تم إلغاء رابط المشاركة");
    } catch {
      setShares(backup);
      notify("تعذر إلغاء الرابط", "error");
    }
  }

  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function exportCSV() {
    const rows = [
      ["التاريخ", "السلعة", "النشاط", "الزبون", "الكمية", "سعر البيع", "سعر الشراء", "المصاريف الخفية", "الربح", "الحالة"],
      ...periodDeals.map((deal) => {
        const finance = dealFinancials(deal);
        return [new Date(deal.date).toLocaleDateString("ar-DZ"), deal.itemName, ACTIVITY_MAP[deal.activityType as ActivityType]?.short ?? deal.activityType, deal.customerName, deal.quantity, finance.revenue, finance.directCost, finance.hidden, finance.profit, deal.status];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `merchant-ledger-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("تم تصدير التقرير");
  }

  const filteredDeals = periodDeals.filter((deal) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || deal.itemName.toLowerCase().includes(query) || deal.customerName.toLowerCase().includes(query);
    return matchesQuery && (statusFilter === "all" || deal.status === statusFilter) && (activityFilter === "all" || deal.activityType === activityFilter);
  });

  return (
    <div className="min-h-screen">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-[#0d1f1a]/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-[268px] flex-col border-l border-[#e5ece8] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#eef2f0] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0d3d36] text-white shadow-[0_6px_16px_rgba(13,61,54,.22)]"><BookOpenText size={20} /></div>
            <div>
              <p className="text-[17px] font-bold leading-5">الكناش</p>
              <p className="text-[10.5px] text-[#8c9c94]">دفتر التاجر الذكي</p>
            </div>
          </div>
          <button className="btn btn-icon btn-outline lg:hidden" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
        </div>
        <div className="mx-5 mt-5 rounded-2xl bg-[#f2f8f5] p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#0f766e] shadow-sm"><Store size={17} /></div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{shop.name}</p>
              <p className="text-[10.5px] text-[#8c9c94]">{activeActivities.length} نشاطات مسجلة</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-[#a2afa8]">القائمة الرئيسية</p>
          {NAV.map((item) => (
            <button key={item.key} className={`nav-item ${view === item.key ? "nav-active" : ""}`} onClick={() => changeView(item.key)}>
              <item.icon size={18} strokeWidth={1.9} />
              <span className="flex-1 text-right">{item.label}</span>
              {view === item.key && <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />}
            </button>
          ))}
        </nav>
        <div className="border-t border-[#eef2f0] p-4">
          <div className="mb-3 flex items-center gap-2.5 rounded-xl p-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dcede6] text-xs font-bold text-[#0f766e]">{initialData.user.name.slice(0, 2)}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold">{initialData.user.name}</p>
              <p className="truncate text-[10px] text-[#93a19a]" dir="ltr">{initialData.user.email}</p>
            </div>
          </div>
          <button className="nav-item text-rose-600 hover:bg-rose-50" onClick={() => void logout()}><LogOut size={17} /> تسجيل الخروج</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[#e8eeea] bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1450px] items-center gap-3 px-4 py-3.5 sm:px-6">
            <button className="btn btn-icon btn-outline lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-bold sm:text-xl">{VIEW_TITLES[view].title}</h1>
              <p className="hidden truncate text-[11.5px] text-[#8c9c94] sm:block">{VIEW_TITLES[view].subtitle}</p>
            </div>
            {mutating && <div className="hidden items-center gap-1.5 text-[11px] text-[#0f766e] sm:flex"><Spinner size={13} /> جارٍ التحديث</div>}
            <button className="btn btn-outline btn-sm" onClick={() => { setPeriod("month"); changeView("reports"); }}><Share2 size={15} /> <span className="hidden sm:inline">مشاركة</span></button>
            <button className="btn btn-primary btn-sm" onClick={() => setDealModal({ open: true, deal: null })}><Plus size={16} /> صفقة جديدة</button>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-4 sm:p-6">
          {view === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] text-[#7b8c84]">مرحباً {initialData.user.name.split(" ")[0]}، إليك وضع محلك اليوم</p>
                  <h2 className="text-2xl font-bold">لوحة التحكم</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select className="select w-auto min-w-[150px]" value={period} onChange={(event) => setPeriod(event.target.value as PeriodKey)}>
                    <option value="today">اليوم</option>
                    <option value="week">آخر 7 أيام</option>
                    <option value="month">هذا الشهر</option>
                    <option value="year">هذه السنة</option>
                    <option value="all">كل الوقت</option>
                  </select>
                  <button className="btn btn-soft btn-sm" onClick={() => setPricingModal(true)}><Calculator size={15} /> تسعير</button>
                </div>
              </div>

              {hiddenRatio > 15 && revenue > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#f2dcb4] bg-[#fffaf0] p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fbeac9] text-[#a46f15]"><ShieldAlert size={19} /></span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#805715]">تنبيه: المصاريف الخفية تصل إلى {formatNumber(hiddenRatio)}% من المبيعات</p>
                    <p className="mt-1 text-[12px] leading-6 text-[#9a7741]">راجع كراء المحل والأجور والنقل والأكل قبل تحديد سعر البيع. استخدم حاسبة التسعير لتضمين هذه التكاليف تلقائياً.</p>
                  </div>
                  <button className="btn btn-sm btn-outline no-print" onClick={() => setPricingModal(true)}>احسب الآن</button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="إجمالي المبيعات" value={formatMoney(revenue, currency)} sub={`${completed.length} صفقة مكتملة`} icon={<ArrowUpRight size={20} />} tone="teal" />
                <StatCard label="الربح بعد مصاريف الصفقات" value={formatMoney(dealProfit, currency)} sub="قبل المصاريف العامة" icon={<TrendingUp size={20} />} tone="emerald" />
                <StatCard label="المصاريف الخفية" value={formatMoney(hiddenOnDeals + generalExpenses, currency)} sub={`${formatNumber(hiddenRatio)}% من المبيعات`} icon={<Wallet size={20} />} tone="amber" />
                <StatCard label="الصافي بعد كل المصاريف" value={formatMoney(netProfit, currency)} sub={`${periodExpenses.length} مصروف عام مسجل`} icon={<CircleDollarSign size={20} />} tone="slate" />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <div className="card p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">حركة المبيعات والأرباح</h3>
                      <p className="text-[11px] text-[#93a19a]">آخر 7 أيام من الفترة المحددة</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] text-[#7b8c84]">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0f766e]" /> المبيعات</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#e0ab52]" /> الأرباح</span>
                    </div>
                  </div>
                  <BarChart deals={periodDeals} currency={currency} />
                </div>
                <div className="card p-5">
                  <h3 className="font-bold">أداء النشاطات</h3>
                  <p className="mb-4 text-[11px] text-[#93a19a]">حسب نوع النشاط المسموح للمحل</p>
                  <ActivityPerformance deals={completed} currency={currency} />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <div className="card p-5">
                  <h3 className="font-bold">أين تذهب مصاريفك الخفية؟</h3>
                  <p className="mb-4 text-[11px] text-[#93a19a]">مصاريف الصفقات + المصاريف العامة</p>
                  <HiddenCostBreakdown deals={completed} expenses={periodExpenses} currency={currency} />
                </div>
                <div className="card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold">آخر الصفقات</h3>
                    <button className="text-xs font-bold text-[#0f766e] hover:underline" onClick={() => changeView("deals")}>عرض الكل ←</button>
                  </div>
                  {deals.length === 0 ? (
                    <EmptyState icon={<ReceiptText size={26} />} title="لا توجد صفقات بعد" description="أضف أول صفقة لتبدأ بحساب أرباحك الحقيقية." action={<button className="btn btn-primary btn-sm" onClick={() => setDealModal({ open: true, deal: null })}>إضافة صفقة</button>} />
                  ) : (
                    <div className="space-y-2">
                      {deals.slice(0, 5).map((deal) => {
                        const finance = dealFinancials(deal);
                        return (
                          <button key={deal.id} onClick={() => setDetailDeal(deal)} className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-right hover:border-[#e7efeb] hover:bg-[#fafcfb]">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef6f2] text-base">{ACTIVITY_MAP[deal.activityType as ActivityType]?.icon ?? "📦"}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold">{deal.itemName}</span>
                              <span className="block text-[10.5px] text-[#93a19a]">{deal.customerName || "بدون زبون"} · {new Date(deal.date).toLocaleDateString("ar-DZ")}</span>
                            </span>
                            <span className="text-left">
                              <span className={`number block text-[13px] font-bold ${finance.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatMoney(finance.profit, currency)}</span>
                              <span className="block text-[10px] text-[#9aa9a2]">الربح الصافي</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "deals" && (
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-[#eef2f0] p-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-2.5 text-[#9aa9a2]" size={17} />
                  <input className="input pr-10" placeholder="ابحث عن سلعة أو زبون..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
                <select className="select w-auto min-w-[140px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">كل الحالات</option>
                  <option value="completed">مكتملة</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="cancelled">ملغية</option>
                </select>
                <select className="select w-auto min-w-[150px]" value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
                  <option value="all">كل النشاطات</option>
                  {activeActivities.map((item) => <option key={item.id} value={item.type}>{ACTIVITY_MAP[item.type as ActivityType]?.short ?? item.type}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => setDealModal({ open: true, deal: null })}><Plus size={16} /> صفقة جديدة</button>
              </div>
              {filteredDeals.length === 0 ? (
                <EmptyState icon={<ReceiptText size={28} />} title="لا توجد صفقات مطابقة" description="جرّب تغيير الفلاتر أو أضف صفقة جديدة ليظهر هنا ملخص الربح والمصاريف الخفية." action={<button className="btn btn-primary btn-sm" onClick={() => setDealModal({ open: true, deal: null })}>إضافة صفقة</button>} />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>السلعة / الزبون</th><th>النشاط</th><th>الكمية</th><th>المبيعات</th><th>مصاريف خفية</th><th>الربح الصافي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                    <tbody>
                      {filteredDeals.map((deal) => {
                        const finance = dealFinancials(deal);
                        return (
                          <tr key={deal.id} className={deal.id < 0 ? "opacity-60" : ""}>
                            <td>
                              <button className="text-right" onClick={() => setDetailDeal(deal)}>
                                <span className="block max-w-[190px] truncate font-semibold hover:text-[#0f766e]">{deal.itemName}</span>
                                <span className="block text-[11px] text-[#93a19a]">{deal.customerName || "—"}</span>
                              </button>
                            </td>
                            <td><ActivityBadge type={deal.activityType} /></td>
                            <td className="number">{formatNumber(deal.quantity)}</td>
                            <td className="number font-semibold">{formatMoney(finance.revenue, currency)}</td>
                            <td className="number text-[#a46f15]">{formatMoney(finance.hidden, currency)}</td>
                            <td className={`number font-bold ${finance.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatMoney(finance.profit, currency)}</td>
                            <td><StatusBadge status={deal.status} /></td>
                            <td className="whitespace-nowrap text-[12px] text-[#7b8c84]">{new Date(deal.date).toLocaleDateString("ar-DZ")}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-icon btn-outline" title="تعديل" onClick={() => setDealModal({ open: true, deal })}><Pencil size={14} /></button>
                                <button className="btn btn-icon btn-danger" title="حذف" onClick={() => void removeDeal(deal)}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-[#eef2f0] px-5 py-3 text-[12px] text-[#7b8c84]">
                عدد النتائج: {filteredDeals.length} — المبيعات: {formatMoney(filteredDeals.filter((d) => d.status === "completed").reduce((sum, d) => sum + dealFinancials(d).revenue, 0), currency)}
              </div>
            </div>
          )}

          {view === "expenses" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="card p-4"><p className="text-xs text-[#84938c]">إجمالي مصاريف الفترة</p><p className="number mt-1 text-xl font-bold">{formatMoney(generalExpenses, currency)}</p></div>
                <div className="card p-4"><p className="text-xs text-[#84938c]">مصاريف خفية داخل الصفقات</p><p className="number mt-1 text-xl font-bold text-[#a46f15]">{formatMoney(hiddenOnDeals, currency)}</p></div>
                <div className="card p-4"><p className="text-xs text-[#84938c]">إجمالي التكاليف</p><p className="number mt-1 text-xl font-bold text-rose-700">{formatMoney(generalExpenses + hiddenOnDeals, currency)}</p></div>
              </div>
              <div className="card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-[#eef2f0] p-4 sm:flex-row sm:items-center">
                  <select className="select w-auto min-w-[190px]" value={expenseFilter} onChange={(event) => setExpenseFilter(event.target.value)}>
                    <option value="all">كل أنواع المصاريف</option>
                    {EXPENSE_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                  <span className="text-xs text-[#93a19a]">سجّل كراء المحل والأجور والنقل والأكل أولاً بأول لتعرف ربحك الحقيقي.</span>
                  <button className="btn btn-primary mr-auto" onClick={() => setExpenseModal({ open: true, expense: null })}><Plus size={16} /> مصروف جديد</button>
                </div>
                {expenses.filter((item) => expenseFilter === "all" || item.category === expenseFilter).length === 0 ? (
                  <EmptyState icon={<Wallet size={28} />} title="لا توجد مصاريف مسجلة" description="أضف مصاريف المحل مثل الكراء والأجور والنقل ليظهر أثرها في حساب الربح." action={<button className="btn btn-primary btn-sm" onClick={() => setExpenseModal({ open: true, expense: null })}>إضافة مصروف</button>} />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>النوع</th><th>المبلغ</th><th>الجهة</th><th>ملاحظة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
                      <tbody>
                        {expenses.filter((item) => expenseFilter === "all" || item.category === expenseFilter).map((expense) => {
                          const category = EXPENSE_CATEGORIES.find((item) => item.key === expense.category);
                          return (
                            <tr key={expense.id}>
                              <td><span className="flex items-center gap-2 font-semibold"><span>{category?.icon ?? "🧾"}</span>{category?.label ?? "أخرى"}</span></td>
                              <td className="number font-bold text-rose-700">{formatMoney(expense.amount, currency)}</td>
                              <td>{expense.vendor || "—"}</td>
                              <td className="max-w-[220px] truncate text-[#7b8c84]">{expense.note || "—"}</td>
                              <td className="whitespace-nowrap text-[12px] text-[#7b8c84]">{new Date(expense.date).toLocaleDateString("ar-DZ")}</td>
                              <td>
                                <div className="flex gap-1">
                                  <button className="btn btn-icon btn-outline" onClick={() => setExpenseModal({ open: true, expense })}><Pencil size={14} /></button>
                                  <button className="btn btn-icon btn-danger" onClick={() => void removeExpense(expense)}><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "products" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute right-3 top-2.5 text-[#9aa9a2]" size={17} />
                  <input className="input pr-10" placeholder="ابحث عن سلعة..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={() => setProductModal({ open: true, product: null })}><Plus size={16} /> سلعة جديدة</button>
              </div>
              {products.filter((product) => product.name.includes(search.trim())).length === 0 ? (
                <div className="card"><EmptyState icon={<Boxes size={28} />} title="المخزون فارغ" description="أضف السلع التي تتعامل بها مرة واحدة، وسيتم ملؤها تلقائياً عند إنشاء الصفقة." action={<button className="btn btn-primary btn-sm" onClick={() => setProductModal({ open: true, product: null })}>إضافة سلعة</button>} /></div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.filter((product) => product.name.includes(search.trim())).map((product) => (
                    <div key={product.id} className="card p-5">
                      <div className="flex items-start justify-between">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef6f2] text-xl">{ACTIVITY_MAP[product.activityType as ActivityType]?.icon ?? "📦"}</div>
                        <div className="flex gap-1">
                          <button className="btn btn-icon btn-outline" onClick={() => setProductModal({ open: true, product })}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-danger" onClick={() => void removeProduct(product)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 className="mt-4 truncate font-bold">{product.name}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <ActivityBadge type={product.activityType} />
                        <span className={`badge ${product.stock < 5 ? "badge-rose" : "badge-emerald"}`}>المخزون: {formatNumber(product.stock)} {product.unit}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#eef2f0] pt-4">
                        <div><p className="text-[11px] text-[#93a19a]">سعر الشراء</p><p className="number font-bold">{formatMoney(product.purchasePrice, currency)}</p></div>
                        <button className="btn btn-sm btn-soft" onClick={() => setPricingModal(true)}><Calculator size={14} /> سعر البيع</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "pricing" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: "📱", title: "الإلكترونيات", text: "سعر الشراء + الكراء + الأجور + النقل + المصاريف + هامش الربح" },
                  { icon: "🐑", title: "الحيوانات", text: "سعر الشراء + مدة العلف × السعر اليومي + الصحة + النقل + هامش الربح" },
                  { icon: "⚡", title: "إدخال سريع", text: "اكتب اسم السلعة ويُحدد النشاط تلقائياً من قائمة نشاطات محلك" },
                ].map((item) => (
                  <div key={item.title} className="card flex gap-3 p-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-[11.5px] leading-5 text-[#84938c]">{item.text}</p></div>
                  </div>
                ))}
              </div>
              <div className="card p-5 sm:p-7"><PricingCalculator activities={activities} currency={currency} onClose={() => {}} /></div>
            </div>
          )}

          {view === "reports" && (
            <ReportsView
              period={period}
              setPeriod={setPeriod}
              customStart={customStart}
              customEnd={customEnd}
              setCustomStart={setCustomStart}
              setCustomEnd={setCustomEnd}
              deals={periodDeals}
              expenses={periodExpenses}
              shares={shares}
              currency={currency}
              onExport={exportCSV}
              onShare={() => void createShare()}
              onRemoveShare={(id) => void removeShare(id)}
              onOpenDeal={(deal) => setDetailDeal(deal)}
            />
          )}

          {view === "settings" && (
            <SettingsView
              key={`${shop.updatedAt}-${activities.map((item) => item.active).join("-")}`}
              shop={shop}
              activities={activities}
              onSave={async (values, selectedActivities) => {
                setMutating(true);
                try {
                  const result = await apiRequest<{ shop: ShopView }>("/api/shop", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...values, activities: selectedActivities }),
                  });
                  setShop(result.shop);
                  setActivities((current) => current.map((item) => ({ ...item, active: selectedActivities.includes(item.type) })));
                  notify("تم حفظ إعدادات الدفتر");
                } catch (error) {
                  notify(error instanceof Error ? error.message : "تعذر الحفظ", "error");
                  throw error;
                } finally {
                  setMutating(false);
                }
              }}
              onLogout={() => void logout()}
            />
          )}
        </main>
      </div>

      <Modal open={dealModal.open} onClose={() => setDealModal({ open: false, deal: null })} title={dealModal.deal ? "تعديل الصفقة" : "صفقة جديدة"} subtitle="اكتب اسم السلعة ثم يُصنّف تلقائياً — والمصاريف الخفية محسوبة داخل الصفقة" size="lg">
        <DealForm
          products={products}
          activities={activities}
          currency={currency}
          initial={dealModal.deal}
          onSave={(draft) => saveDeal(draft, dealModal.deal)}
          onClose={() => setDealModal({ open: false, deal: null })}
          onOpenPricing={() => setPricingModal(true)}
        />
      </Modal>

      <Modal open={expenseModal.open} onClose={() => setExpenseModal({ open: false, expense: null })} title={expenseModal.expense ? "تعديل المصروف" : "مصروف جديد"} subtitle="سجّل المصروف ليظهر في التحليلات والتقارير" size="md">
        <ExpenseForm currency={currency} initial={expenseModal.expense} onSave={(draft) => saveExpense(draft, expenseModal.expense)} onClose={() => setExpenseModal({ open: false, expense: null })} />
      </Modal>

      <Modal open={productModal.open} onClose={() => setProductModal({ open: false, product: null })} title={productModal.product ? "تعديل السلعة" : "سلعة جديدة"} subtitle="التصنيف يتم تلقائياً حسب الاسم" size="md">
        <ProductForm activities={activities} currency={currency} initial={productModal.product} onSave={(draft) => saveProduct(draft, productModal.product)} onClose={() => setProductModal({ open: false, product: null })} />
      </Modal>

      <Modal open={pricingModal} onClose={() => setPricingModal(false)} title="حاسبة السعر المقترح" subtitle="احسب الحد الأدنى والأعلى والسعر المقترح بعد كل المصاريف" size="lg">
        <PricingCalculator activities={activities} currency={currency} onClose={() => setPricingModal(false)} />
      </Modal>

      <Modal open={Boolean(detailDeal)} onClose={() => setDetailDeal(null)} title="تفاصيل الصفقة" subtitle="نظرة كاملة على التكاليف والربح" size="sm">
        {detailDeal && <DealDetails deal={detailDeal} currency={currency} onEdit={() => { setDealModal({ open: true, deal: detailDeal }); setDetailDeal(null); }} />}
      </Modal>

      <Toast message={toast?.message ?? ""} kind={toast?.kind ?? null} />
    </div>
  );
}

function BarChart({ deals, currency }: { deals: DealView[]; currency: string }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const data = days.map((day) => {
    const key = day.toDateString();
    const dayDeals = deals.filter((deal) => new Date(deal.date).toDateString() === key && deal.status === "completed");
    return {
      label: new Intl.DateTimeFormat("ar-DZ", { weekday: "short" }).format(day),
      revenue: dayDeals.reduce((sum, deal) => sum + dealFinancials(deal).revenue, 0),
      profit: dayDeals.reduce((sum, deal) => sum + dealFinancials(deal).profit, 0),
    };
  });
  const max = Math.max(...data.map((item) => item.revenue), 1);
  return (
    <div className="flex h-56 items-end gap-2 sm:gap-4">
      {data.map((item, index) => (
        <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-full w-full items-end justify-center gap-1">
            <div className="group relative w-1/2 max-w-6 rounded-t-lg bg-[#0f766e] transition-all hover:bg-[#0b5d57]" style={{ height: `${Math.max((item.revenue / max) * 100, 2)}%` }}>
              <span className="pointer-events-none absolute -top-8 right-1/2 z-10 hidden whitespace-nowrap rounded-lg bg-[#172c27] px-2 py-1 text-[10px] text-white group-hover:block">{formatMoney(item.revenue, currency)}</span>
            </div>
            <div className="w-1/2 max-w-6 rounded-t-lg bg-[#e0ab52]" style={{ height: `${Math.max((Math.max(item.profit, 0) / max) * 100, 2)}%` }} />
          </div>
          <span className="text-[10px] text-[#93a19a]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityPerformance({ deals, currency }: { deals: DealView[]; currency: string }) {
  const grouped = Object.values(
    deals.reduce<Record<string, { type: string; count: number; revenue: number; profit: number }>>((acc, deal) => {
      const key = deal.activityType;
      acc[key] ??= { type: key, count: 0, revenue: 0, profit: 0 };
      acc[key].count += 1;
      const finance = dealFinancials(deal);
      acc[key].revenue += finance.revenue;
      acc[key].profit += finance.profit;
      return acc;
    }, {}),
  );
  if (!grouped.length) return <EmptyState icon={<Activity size={24} />} title="لا توجد بيانات" description="ستظهر هنا مقارنة أداء نشاطاتك بعد تسجيل الصفقات." />;
  const max = Math.max(...grouped.map((item) => item.revenue), 1);
  return (
    <div className="space-y-4">
      {grouped.map((item) => {
        const def = ACTIVITY_MAP[item.type as ActivityType];
        return (
          <div key={item.type}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2 font-semibold"><span>{def?.icon ?? "📦"}</span>{def?.short ?? "عام"} <span className="text-[10px] text-[#9aa9a2]">({item.count})</span></span>
              <span className="number font-bold">{formatMoney(item.revenue, currency)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f0f4f2]"><div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${(item.revenue / max) * 100}%` }} /></div>
            <p className="mt-1 text-[10.5px] text-[#84938c]">الربح: {formatMoney(item.profit, currency)}</p>
          </div>
        );
      })}
    </div>
  );
}

function HiddenCostBreakdown({ deals, expenses, currency }: { deals: DealView[]; expenses: ExpenseView[]; currency: string }) {
  const values: Record<string, number> = { rent: 0, wages: 0, transport: 0, food: 0, electricity: 0, feed: 0, veterinary: 0, marketing: 0, other: 0 };
  for (const deal of deals) {
    values.rent += deal.rent;
    values.wages += deal.wages;
    values.transport += deal.transport;
    values.food += deal.food;
    values.other += deal.other;
  }
  for (const expense of expenses) values[expense.category] = (values[expense.category] ?? 0) + expense.amount;
  const items = EXPENSE_CATEGORIES.map((category) => ({ ...category, value: values[category.key] ?? 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!items.length) return <EmptyState icon={<Wallet size={24} />} title="لا توجد مصاريف" description="سجّل المصاريف الخفية لتعرف أين تذهب أرباحك." />;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f5f8f6] text-sm">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-[12px]"><span className="truncate font-semibold">{item.label}</span><span className="number">{formatMoney(item.value, currency)}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f4f2]"><div className="h-full rounded-full bg-[#e0ab52]" style={{ width: `${(item.value / total) * 100}%` }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DealDetails({ deal, currency, onEdit }: { deal: DealView; currency: string; onEdit: () => void }) {
  const finance = dealFinancials(deal);
  const rows = [
    ["المبيعات", finance.revenue, "#243a33"],
    ["تكلفة الشراء", -finance.directCost, "#a63a34"],
    ["كراء المحل", -deal.rent, "#a46f15"],
    ["أجرة العمال", -deal.wages, "#a46f15"],
    ["النقل", -deal.transport, "#a46f15"],
    ["الأكل والمصاريف", -deal.food, "#a46f15"],
    ["مصاريف أخرى", -deal.other, "#a46f15"],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#f5f9f7] p-4">
        <p className="text-sm font-bold">{deal.itemName}</p>
        <p className="mt-1 text-xs text-[#84938c]">{deal.customerName || "بدون زبون"} · {new Date(deal.date).toLocaleString("ar-DZ")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><ActivityBadge type={deal.activityType} /><StatusBadge status={deal.status} /></div>
      </div>
      <div className="space-y-2">
        {rows.map(([label, value, color]) => (
          <div key={label} className="flex justify-between text-[13px]"><span className="text-[#7b8c84]">{label}</span><span className="number font-semibold" style={{ color }}>{formatMoney(value, currency)}</span></div>
        ))}
        <div className="divider my-2" />
        <div className="flex justify-between text-sm font-bold"><span>الربح الصافي</span><span className={`number ${finance.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatMoney(finance.profit, currency)}</span></div>
        <div className="flex justify-between text-[12px] text-[#84938c]"><span>هامش الربح</span><span className="number">{formatNumber(finance.margin)}%</span></div>
      </div>
      {deal.note && <p className="rounded-xl bg-[#fffaf0] p-3 text-xs text-[#8a6b31]">ملاحظة: {deal.note}</p>}
      <button className="btn btn-primary w-full" onClick={onEdit}><Pencil size={15} /> تعديل الصفقة</button>
    </div>
  );
}

function ReportsView({
  period, setPeriod, customStart, customEnd, setCustomStart, setCustomEnd,
  deals, expenses, shares, currency, onExport, onShare, onRemoveShare, onOpenDeal,
}: {
  period: PeriodKey;
  setPeriod: (value: PeriodKey) => void;
  customStart: string;
  customEnd: string;
  setCustomStart: (value: string) => void;
  setCustomEnd: (value: string) => void;
  deals: DealView[];
  expenses: ExpenseView[];
  shares: ShareView[];
  currency: string;
  onExport: () => void;
  onShare: () => void;
  onRemoveShare: (id: number) => void;
  onOpenDeal: (deal: DealView) => void;
}) {
  const completed = deals.filter((deal) => deal.status === "completed");
  const revenue = completed.reduce((sum, deal) => sum + dealFinancials(deal).revenue, 0);
  const profit = completed.reduce((sum, deal) => sum + dealFinancials(deal).profit, 0);
  const hidden = completed.reduce((sum, deal) => sum + dealFinancials(deal).hidden, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const periodLabels: Record<PeriodKey, string> = { today: "اليوم", week: "آخر 7 أيام", month: "هذا الشهر", year: "هذه السنة", custom: "فترة مخصصة", all: "كل الوقت" };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "week", "month", "year", "all", "custom"] as PeriodKey[]).map((key) => (
            <button key={key} className={`chip ${period === key ? "chip-active" : ""}`} onClick={() => setPeriod(key)}>{periodLabels[key]}</button>
          ))}
          <div className="mr-auto flex flex-wrap gap-2">
            <button className="btn btn-outline btn-sm no-print" onClick={onExport}><Download size={15} /> تصدير CSV</button>
            <button className="btn btn-primary btn-sm no-print" onClick={onShare}><Share2 size={15} /> إنشاء رابط مشاركة</button>
          </div>
        </div>
        {period === "custom" && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-[#eef2f0] pt-4">
            <div><label className="label">من تاريخ</label><input className="input w-auto" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div>
            <div><label className="label">إلى تاريخ</label><input className="input w-auto" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`المبيعات — ${periodLabels[period]}`} value={formatMoney(revenue, currency)} sub={`${completed.length} صفقة`} icon={<ArrowUpRight size={20} />} />
        <StatCard label="الربح بعد مصاريف الصفقات" value={formatMoney(profit, currency)} sub="قبل المصاريف العامة" icon={<TrendingUp size={20} />} tone="emerald" />
        <StatCard label="المصاريف الخفية" value={formatMoney(hidden, currency)} sub="ضمن الصفقات" icon={<Wallet size={20} />} tone="amber" />
        <StatCard label="المصاريف العامة" value={formatMoney(expenseTotal, currency)} sub={`${expenses.length} مصروف`} icon={<ReceiptText size={20} />} tone="slate" />
      </div>

      <div className="card p-5">
        <h3 className="mb-1 font-bold">سجل الصفقات</h3>
        <p className="mb-4 text-[11px] text-[#93a19a]">يمكن نسخ هذا الجدول أو مشاركته عبر رابط قراءة فقط</p>
        {deals.length === 0 ? (
          <EmptyState icon={<FileText size={26} />} title="لا توجد صفقات في هذه الفترة" description="جرّب اختيار فترة أخرى أو أضف صفقات جديدة." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>السلعة</th><th>النشاط</th><th>الزبون</th><th>المبيعات</th><th>المصاريف الخفية</th><th>الربح</th></tr></thead>
              <tbody>
                {deals.map((deal) => {
                  const finance = dealFinancials(deal);
                  return (
                    <tr key={deal.id} className="cursor-pointer" onClick={() => onOpenDeal(deal)}>
                      <td className="whitespace-nowrap text-[12px]">{new Date(deal.date).toLocaleDateString("ar-DZ")}</td>
                      <td className="font-semibold">{deal.itemName}</td>
                      <td><ActivityBadge type={deal.activityType} /></td>
                      <td>{deal.customerName || "—"}</td>
                      <td className="number">{formatMoney(finance.revenue, currency)}</td>
                      <td className="number text-[#a46f15]">{formatMoney(finance.hidden, currency)}</td>
                      <td className={`number font-bold ${finance.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatMoney(finance.profit, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-bold">روابط المشاركة</h3>
        <p className="mb-4 text-[11px] text-[#93a19a]">كل رابط يعرض نسخة للقراءة فقط من السجل في الفترة المحددة</p>
        {shares.length === 0 ? (
          <EmptyState icon={<Share2 size={26} />} title="لا توجد روابط مشاركة" description="أنشئ رابطاً للمشاركة مع شريكك أو محاسبك، ويمكنك إلغاؤه في أي وقت." action={<button className="btn btn-primary btn-sm" onClick={onShare}>إنشاء رابط</button>} />
        ) : (
          <div className="space-y-2">
            {shares.map((link) => (
              <div key={link.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e9efec] p-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef6f2] text-[#0f766e]"><Share2 size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{link.title}</p>
                  <p className="truncate text-[10.5px] text-[#93a19a]" dir="ltr">/share/{link.token}</p>
                </div>
                <button className="btn btn-sm btn-outline" onClick={async () => { await navigator.clipboard?.writeText(`${window.location.origin}/share/${link.token}`); }}><Copy size={14} /> نسخ</button>
                <a className="btn btn-sm btn-soft" href={`/share/${link.token}`} target="_blank" rel="noreferrer"><ArrowLeft size={14} /> فتح</a>
                <button className="btn btn-sm btn-danger" onClick={() => onRemoveShare(link.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView({
  shop, activities, onSave, onLogout,
}: {
  shop: ShopView;
  activities: { id: number; type: string; active: boolean }[];
  onSave: (values: { name: string; ownerName: string; phone: string; address: string; currency: string }, selected: string[]) => Promise<void>;
  onLogout: () => void;
}) {
  const [values, setValues] = useState({ name: shop.name, ownerName: shop.ownerName, phone: shop.phone, address: shop.address, currency: shop.currency });
  const [selected, setSelected] = useState(activities.filter((item) => item.active).map((item) => item.type));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(values, selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="card p-6">
        <h3 className="font-bold">بيانات المحل</h3>
        <p className="mb-5 mt-1 text-[11.5px] text-[#84938c]">تظهر هذه البيانات في التقارير وروابط المشاركة</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">اسم المحل</label><input className="input" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></div>
          <div><label className="label">اسم صاحب المحل</label><input className="input" value={values.ownerName} onChange={(event) => setValues({ ...values, ownerName: event.target.value })} /></div>
          <div><label className="label">رقم الهاتف</label><input className="input" dir="ltr" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">العنوان</label><input className="input" value={values.address} onChange={(event) => setValues({ ...values, address: event.target.value })} /></div>
          <div><label className="label">العملة</label><select className="select" value={values.currency} onChange={(event) => setValues({ ...values, currency: event.target.value })}>{["د.ج", "د.م", "د.ت", "$", "€", "ر.س"].map((item) => <option key={item}>{item}</option>)}</select></div>
        </div>
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{error}</p>}
        <div className="mt-6 flex gap-2 border-t border-[#eef2f0] pt-5">
          <button className="btn btn-primary" disabled={saving}>{saving ? <><Spinner /> جارٍ الحفظ...</> : <><Check size={16} /> حفظ التغييرات</>}</button>
          <button type="button" className="btn btn-danger" onClick={onLogout}><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-bold">نشاطات المحل</h3>
        <p className="mb-5 mt-1 text-[11.5px] text-[#84938c]">ستظهر في الصفقات وسلع المخزون وحاسبة التسعير فقط النشاطات المفعّلة هنا</p>
        <div className="space-y-2">
          {Object.values(ACTIVITY_MAP).filter((item) => item.type !== "general").map((activity) => {
            const active = selected.includes(activity.type);
            return (
              <button type="button" key={activity.type} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-right ${active ? "border-[#0f766e] bg-[#f2faf7]" : "border-[#e8eeea]"}`} onClick={() => setSelected(active ? selected.filter((item) => item !== activity.type) : [...selected, activity.type])}>
                <span className="text-xl">{activity.icon}</span>
                <span className="flex-1 text-[13px] font-semibold">{activity.label}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-md border ${active ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-[#d5dfda]"}`}>{active && <Check size={13} />}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 rounded-xl bg-[#f5f9f7] p-3 text-[11.5px] leading-6 text-[#687d73]">
          <Sparkles size={14} className="mb-1 text-[#0f766e]" />
          التصنيف التلقائي يعتمد على هذه القائمة؛ عند كتابة «خروف» مثلاً سيُحدد نشاط الحيوانات فقط إذا كان مفعّلاً هنا.
        </div>
      </div>
    </form>
  );
}
