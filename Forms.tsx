"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, Calculator, Camera, ChefHat, CircleDollarSign, ClipboardList, Info,
  Package, Sparkles, Store, Truck, Users, WandSparkles,
} from "lucide-react";
import {
  ACTIVITY_DEFS, ACTIVITY_MAP, EXPENSE_CATEGORIES, calculatePricing,
  dealFinancials, detectActivityType, formatMoney, toDateInput,
  type ActivityType,
} from "@/lib/business";
import type { ActivityView, DealView, ExpenseView, ProductView } from "@/lib/types";
import { Spinner } from "@/components/ui";

export type DealDraft = {
  productId: number | null;
  customerName: string;
  itemName: string;
  activityType: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  rent: number;
  wages: number;
  transport: number;
  food: number;
  other: number;
  status: string;
  note: string;
  date: string;
};

function NumberField({
  label, value, onChange, hint, icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {icon && <span className="absolute right-3 top-[11px] text-[#9aa9a2]">{icon}</span>}
        <input
          className={`input number ${icon ? "pr-9" : ""}`}
          type="number"
          min="0"
          step="any"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(event) => onChange(Number(event.target.value) || 0)}
        />
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function DealForm({
  products,
  activities,
  currency,
  initial,
  onSave,
  onClose,
  onOpenPricing,
}: {
  products: ProductView[];
  activities: ActivityView[];
  currency: string;
  initial?: DealView | null;
  onSave: (draft: DealDraft) => Promise<void>;
  onClose: () => void;
  onOpenPricing: () => void;
}) {
  const activeTypes = activities.filter((item) => item.active).map((item) => item.type);
  const [draft, setDraft] = useState<DealDraft>({
    productId: initial?.productId ?? null,
    customerName: initial?.customerName ?? "",
    itemName: initial?.itemName ?? "",
    activityType: initial?.activityType ?? activeTypes[0] ?? "general",
    quantity: initial?.quantity ?? 1,
    unitPrice: initial?.unitPrice ?? 0,
    unitCost: initial?.unitCost ?? 0,
    rent: initial?.rent ?? 0,
    wages: initial?.wages ?? 0,
    transport: initial?.transport ?? 0,
    food: initial?.food ?? 0,
    other: initial?.other ?? 0,
    status: initial?.status ?? "completed",
    note: initial?.note ?? "",
    date: initial ? toDateInput(initial.date) : toDateInput(new Date()),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const financials = useMemo(() => dealFinancials(draft), [draft]);
  const suggestion = useMemo(
    () => calculatePricing({ ...draft, activityType: draft.activityType as ActivityType }),
    [draft],
  );
  const autoDetected = draft.itemName
    ? detectActivityType(draft.itemName, activeTypes)
    : null;

  const update = <K extends keyof DealDraft>(key: K, value: DealDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function changeItemName(value: string) {
    const detected = detectActivityType(value, activeTypes);
    setDraft((current) => ({ ...current, itemName: value, activityType: detected }));
  }

  function changeProduct(id: number) {
    const product = products.find((item) => item.id === id);
    if (!product) {
      setDraft((current) => ({ ...current, productId: null }));
      return;
    }
    setDraft((current) => ({
      ...current,
      productId: id,
      itemName: product.name,
      unitCost: product.purchasePrice,
      activityType: product.activityType,
      unitPrice: current.unitPrice || Math.round(product.purchasePrice * 1.25),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.itemName.trim()) {
      setError("اسم السلعة أو الخدمة مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الصفقة");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="rounded-2xl border border-[#dcece6] bg-[#f4fbf8] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e]">
          <WandSparkles size={15} /> إدخال سريع — اختر السلعة أو اكتب اسمها وسيتم تصنيفها تلقائياً
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">السلعة من المخزون (اختياري)</label>
            <select className="select" value={draft.productId ?? ""} onChange={(event) => changeProduct(Number(event.target.value))}>
              <option value="">— اكتب اسماً جديداً —</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} — {formatMoney(product.purchasePrice, currency)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">اسم السلعة أو الخدمة *</label>
            <input className="input" value={draft.itemName} onChange={(event) => changeItemName(event.target.value)} placeholder="مثال: هاتف iPhone 13 أو خروف بلدي" autoFocus />
          </div>
          <div>
            <label className="label">نوع النشاط (يُحدد تلقائياً)</label>
            <div className="relative">
              <select className="select pl-9" value={draft.activityType} onChange={(event) => update("activityType", event.target.value)}>
                {activities.filter((item) => item.active).map((activity) => (
                  <option key={activity.id} value={activity.type}>{ACTIVITY_MAP[activity.type as ActivityType]?.label ?? activity.type}</option>
                ))}
                {!activities.some((item) => item.active && item.type === draft.activityType) && (
                  <option value={draft.activityType}>{ACTIVITY_MAP[draft.activityType as ActivityType]?.label ?? "عام"}</option>
                )}
              </select>
              <Sparkles className="absolute left-3 top-3 text-[#0f766e]" size={15} />
            </div>
            {autoDetected && autoDetected === draft.activityType && (
              <p className="hint text-[#0f766e]">✓ تم التصنيف تلقائياً: {ACTIVITY_MAP[autoDetected]?.short}</p>
            )}
          </div>
          <div>
            <label className="label">الزبون</label>
            <input className="input" value={draft.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder="اسم الزبون أو جهة البيع" />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#243a33]">الكمية والسعر</h3>
          <button type="button" className="btn btn-sm btn-soft" onClick={onOpenPricing}><Calculator size={14} /> احسب السعر المقترح</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <NumberField label="الكمية" value={draft.quantity} onChange={(value) => update("quantity", value)} />
          <NumberField label="سعر الشراء / الوحدة" value={draft.unitCost} onChange={(value) => update("unitCost", value)} />
          <NumberField label="سعر البيع / الوحدة" value={draft.unitPrice} onChange={(value) => update("unitPrice", value)} />
          <div>
            <label className="label">الحالة</label>
            <select className="select" value={draft.status} onChange={(event) => update("status", event.target.value)}>
              <option value="completed">مكتملة</option>
              <option value="pending">قيد الانتظار</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0e3c8] bg-[#fffcf5] p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fbefd5] text-[#a46f15]"><ClipboardList size={16} /></span>
          <div>
            <h3 className="text-sm font-bold text-[#805715]">المصاريف الخفية لهذه الصفقة</h3>
            <p className="text-[11px] text-[#a28048]">هي الفاصل بين الربح الحقيقي والربح الوهمي — تُخصم من نتيجة الصفقة تلقائياً</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <NumberField label="كراء المحل" value={draft.rent} onChange={(value) => update("rent", value)} icon={<Store size={15} />} />
          <NumberField label="أجرة العمال" value={draft.wages} onChange={(value) => update("wages", value)} icon={<Users size={15} />} />
          <NumberField label="النقل والشحن" value={draft.transport} onChange={(value) => update("transport", value)} icon={<Truck size={15} />} />
          <NumberField label="الأكل والمصاريف" value={draft.food} onChange={(value) => update("food", value)} icon={<ChefHat size={15} />} />
          <NumberField label="مصاريف أخرى" value={draft.other} onChange={(value) => update("other", value)} icon={<Camera size={15} />} />
          <div className="flex flex-col justify-end rounded-xl bg-white p-3">
            <span className="text-[11px] text-[#8b9a92]">إجمالي المصاريف الخفية</span>
            <span className="number text-lg font-bold text-[#a46f15]">{formatMoney(financials.hidden, currency)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">تاريخ الصفقة</label>
          <input className="input" type="datetime-local" value={draft.date} onChange={(event) => update("date", event.target.value)} />
        </div>
        <div>
          <label className="label">ملاحظة</label>
          <input className="input" value={draft.note} onChange={(event) => update("note", event.target.value)} placeholder="تفاصيل إضافية اختيارية" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#f6f9f7] p-3">
          <p className="text-[11px] text-[#7b8c84]">المبيعات</p>
          <p className="number text-lg font-bold text-[#243a33]">{formatMoney(financials.revenue, currency)}</p>
        </div>
        <div className="rounded-xl bg-[#f6f9f7] p-3">
          <p className="text-[11px] text-[#7b8c84]">الربح بعد المصاريف</p>
          <p className={`number text-lg font-bold ${financials.profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatMoney(financials.profit, currency)}</p>
        </div>
        <div className="rounded-xl bg-[#eef8f4] p-3">
          <p className="text-[11px] text-[#0f766e]">سعر البيع المقترح</p>
          <p className="number text-lg font-bold text-[#0f766e]">{formatMoney(suggestion.recommended, currency)}</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{error}</p>}
      <div className="flex items-center justify-between border-t border-[#eef2f0] pt-5">
        <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? <><Spinner /> جارٍ الحفظ...</> : <>{initial ? "حفظ التعديلات" : "إضافة الصفقة"} <ArrowLeft size={16} /></>}
        </button>
      </div>
    </form>
  );
}

export function ProductForm({
  activities,
  currency,
  initial,
  onSave,
  onClose,
}: {
  activities: ActivityView[];
  currency: string;
  initial?: ProductView | null;
  onSave: (draft: { name: string; sku: string; activityType: string; purchasePrice: number; stock: number; unit: string }) => Promise<void>;
  onClose: () => void;
}) {
  const activeTypes = activities.filter((item) => item.active).map((item) => item.type);
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [activityType, setActivityType] = useState(initial?.activityType ?? "electronics");
  const [purchasePrice, setPurchasePrice] = useState(initial?.purchasePrice ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [unit, setUnit] = useState(initial?.unit ?? "قطعة");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const detected = name ? detectActivityType(name, activeTypes) : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ name, sku, activityType, purchasePrice, stock, unit });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ السلعة");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="rounded-2xl border border-[#dcece6] bg-[#f4fbf8] p-4 text-xs text-[#0f766e]">
        <div className="flex items-center gap-2 font-semibold"><Sparkles size={15} /> التصنيف يتم تلقائياً بمجرد كتابة اسم السلعة</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">اسم السلعة أو الخدمة *</label>
          <input className="input" value={name} onChange={(event) => { setName(event.target.value); setActivityType(detectActivityType(event.target.value, activeTypes)); }} placeholder="مثال: هاتف سامسونج A55" autoFocus required />
          {detected && detected === activityType && <p className="hint text-[#0f766e]">✓ الصنف المتوقع: {ACTIVITY_MAP[detected]?.label}</p>}
        </div>
        <div>
          <label className="label">نوع النشاط</label>
          <select className="select" value={activityType} onChange={(event) => setActivityType(event.target.value)}>
            {activities.filter((item) => item.active).map((item) => <option key={item.id} value={item.type}>{ACTIVITY_MAP[item.type as ActivityType]?.label ?? item.type}</option>)}
          </select>
        </div>
        <div>
          <label className="label">رمز السلعة</label>
          <input className="input" value={sku} onChange={(event) => setSku(event.target.value)} placeholder="SKU-001" />
        </div>
        <NumberField label={`سعر الشراء (${currency})`} value={purchasePrice} onChange={setPurchasePrice} />
        <NumberField label="الكمية المتوفرة" value={stock} onChange={setStock} />
        <div>
          <label className="label">الوحدة</label>
          <input className="input" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="قطعة / كغ / رأس" />
        </div>
      </div>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{error}</p>}
      <div className="flex justify-between border-t border-[#eef2f0] pt-5">
        <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? <><Spinner /> جارٍ الحفظ...</> : "حفظ السلعة"}</button>
      </div>
    </form>
  );
}

export function ExpenseForm({
  currency,
  initial,
  onSave,
  onClose,
}: {
  currency: string;
  initial?: ExpenseView | null;
  onSave: (draft: { category: string; amount: number; note: string; vendor: string; date: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? "rent");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [date, setDate] = useState(initial ? toDateInput(initial.date) : toDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (amount <= 0) {
      setError("أدخل مبلغاً أكبر من صفر");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ category, amount, note, vendor, date });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ المصروف");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div>
        <label className="label">نوع المصروف</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXPENSE_CATEGORIES.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setCategory(item.key)}
              title={item.hint}
              className={`chip ${category === item.key ? "chip-active" : ""}`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label={`المبلغ (${currency})`} value={amount} onChange={setAmount} />
        <div>
          <label className="label">التاريخ</label>
          <input className="input" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div>
          <label className="label">الجهة / المورد</label>
          <input className="input" value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="مثال: صاحب المحل، شركة النقل" />
        </div>
        <div>
          <label className="label">ملاحظة</label>
          <input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="تفاصيل المصروف" />
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-[#fffaf0] p-3 text-xs leading-5 text-[#8a6b31]">
        <Info size={16} className="mt-0.5 shrink-0" />
        المصاريف العامة تظهر في لوحة التحليلات، بينما تُسجّل مصاريف الصفقة داخل الصفقة نفسها ليحسب الربح بدقة.
      </div>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{error}</p>}
      <div className="flex justify-between border-t border-[#eef2f0] pt-5">
        <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? <><Spinner /> جارٍ الحفظ...</> : "حفظ المصروف"}</button>
      </div>
    </form>
  );
}

export function PricingCalculator({
  activities,
  currency,
  onClose,
}: {
  activities: ActivityView[];
  currency: string;
  onClose: () => void;
}) {
  const activeTypes = activities.filter((item) => item.active).map((item) => item.type);
  const [itemName, setItemName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>((activeTypes[0] as ActivityType) ?? "electronics");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [rent, setRent] = useState(0);
  const [wages, setWages] = useState(0);
  const [transport, setTransport] = useState(0);
  const [food, setFood] = useState(0);
  const [electricity, setElectricity] = useState(0);
  const [other, setOther] = useState(0);
  const [veterinary, setVeterinary] = useState(0);
  const [feedDays, setFeedDays] = useState(0);
  const [feedDailyKg, setFeedDailyKg] = useState(0);
  const [feedPricePerKg, setFeedPricePerKg] = useState(0);
  const [targetMargin, setTargetMargin] = useState(ACTIVITY_MAP[activityType]?.defaultMargin ?? 25);

  const setActivity = (type: ActivityType) => {
    setActivityType(type);
    setTargetMargin(ACTIVITY_MAP[type]?.defaultMargin ?? 25);
  };

  const result = calculatePricing({
    activityType, quantity, unitCost, rent, wages, transport, food,
    electricity, other, veterinary, feedDays, feedDailyKg, feedPricePerKg, targetMargin,
  });
  const isAnimals = activityType === "animals";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#dcece6] bg-[#f4fbf8] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">اسم السلعة أو الخدمة</label>
            <input
              className="input"
              value={itemName}
              onChange={(event) => {
                setItemName(event.target.value);
                setActivity(detectActivityType(event.target.value, activeTypes));
              }}
              placeholder="اكتب الاسم وسيُحدد النظام النشاط تلقائياً"
            />
          </div>
          <div>
            <label className="label">نوع النشاط</label>
            <select className="select" value={activityType} onChange={(event) => setActivity(event.target.value as ActivityType)}>
              {activities.filter((item) => item.active).map((item) => <option key={item.id} value={item.type}>{ACTIVITY_MAP[item.type as ActivityType]?.label ?? item.type}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-[#0f766e]">
          <Info size={14} />
          {isAnimals
            ? "نظام الحيوانات: سعر الشراء + مدة العلف × الاستهلاك اليومي × سعر العلف + الصحة والنقل، ثم هامش الربح."
            : "نظام الإلكترونيات: سعر الشراء + حصة الكراء والأجور والنقل والمصاريف، ثم هامش الربح."}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="الكمية / عدد الرؤوس" value={quantity} onChange={(value) => setQuantity(Math.max(value, 1))} />
            <NumberField label="سعر الشراء للوحدة" value={unitCost} onChange={setUnitCost} />
          </div>
          <h3 className="border-t border-[#eef2f0] pt-4 text-sm font-bold">المصاريف الخفية</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="حصة كراء المحل" value={rent} onChange={setRent} />
            <NumberField label="أجرة العمال" value={wages} onChange={setWages} />
            <NumberField label="النقل" value={transport} onChange={setTransport} />
            <NumberField label="الأكل والمصاريف" value={food} onChange={setFood} />
            <NumberField label="الكهرباء والماء" value={electricity} onChange={setElectricity} />
            <NumberField label="مصاريف أخرى" value={other} onChange={setOther} />
            {isAnimals && (
              <>
                <NumberField label="مدة العلف (أيام)" value={feedDays} onChange={setFeedDays} />
                <NumberField label="الاستهلاك اليومي (كغ)" value={feedDailyKg} onChange={setFeedDailyKg} />
                <NumberField label="سعر الكغ" value={feedPricePerKg} onChange={setFeedPricePerKg} />
                <NumberField label="الصحة البيطرية" value={veterinary} onChange={setVeterinary} />
              </>
            )}
          </div>
          <NumberField label={`هامش الربح المستهدف: ${targetMargin}%`} value={targetMargin} onChange={setTargetMargin} />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-[#0d3d36] p-5 text-white">
            <p className="text-xs text-white/60">سعر البيع المقترح</p>
            <p className="number mt-2 text-3xl font-bold text-[#9fe3cf]">{formatMoney(result.recommended, currency)}</p>
            <p className="mt-1 text-xs text-white/60">للوحدة الواحدة — يشمل كل المصاريف الخفية</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">الحد الأدنى</p>
                <p className="number text-base font-bold">{formatMoney(result.minimum, currency)}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[11px] text-white/60">الحد الأعلى</p>
                <p className="number text-base font-bold">{formatMoney(result.maximum, currency)}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><CircleDollarSign size={16} className="text-[#0f766e]" /> تفصيل الحساب</h3>
            <div className="space-y-2 text-[12.5px]">
              {[
                ["سعر الشراء الكلي", result.purchase],
                ["الكراء والأجور", result.rent + result.wages],
                ["النقل والمصاريف", result.transport + result.food + result.electricity + result.other],
                ...(isAnimals ? [["العلف والصحة", result.feed + result.veterinary]] : []),
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-[#6b7c75]">
                  <span>{label}</span><span className="number font-semibold text-[#243a33]">{formatMoney(Number(value), currency)}</span>
                </div>
              ))}
              <div className="divider my-2" />
              <div className="flex justify-between font-bold"><span>التكلفة الكلية</span><span className="number">{formatMoney(result.totalCost, currency)}</span></div>
              <div className="flex justify-between font-bold text-[#0f766e]"><span>تكلفة الوحدة</span><span className="number">{formatMoney(result.unitCost, currency)}</span></div>
              <div className="flex justify-between font-bold text-emerald-700"><span>ربح الوحدة المقترح</span><span className="number">{formatMoney(result.unitProfit, currency)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-[#eef2f0] pt-4">
        <button className="btn btn-primary" onClick={onClose}>تم <CheckIcon /></button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return <Package size={15} />;
}
