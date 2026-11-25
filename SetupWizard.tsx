"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Store, WandSparkles } from "lucide-react";
import { ACTIVITY_DEFS } from "@/lib/business";

export function SetupWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState(userName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("د.ج");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish() {
    if (!selected.length) {
      setError("اختر نشاطاً واحداً على الأقل");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerName, phone, address, currency, activities: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر إنشاء الدفتر");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إنشاء الدفتر");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f7f5] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0d3d36] text-white"><Store size={21} /></div>
          <div>
            <h1 className="text-xl font-bold">إعداد دفتر جديد</h1>
            <p className="text-xs text-[#72837b]">أهلاً {userName}، لنهيئ مساحة عملك خطوة بخطوة</p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          {[1, 2].map((index) => (
            <div key={index} className="flex flex-1 items-center gap-3">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${step >= index ? "bg-[#0f766e] text-white" : "bg-white text-[#96a59e] border border-[#e1e9e5]"}`}>
                {step > index ? <Check size={15} /> : index}
              </div>
              <div className={`h-1.5 flex-1 rounded-full ${step > index ? "bg-[#0f766e]" : "bg-[#e1e9e5]"}`} />
            </div>
          ))}
        </div>

        <div className="card card-pad">
          {step === 1 ? (
            <>
              <div className="mb-6">
                <span className="badge badge-teal"><WandSparkles size={13} /> الخطوة الأولى</span>
                <h2 className="mt-3 text-2xl font-bold">عرّفنا بمحلك</h2>
                <p className="mt-1 text-sm text-[#72837b]">سيظهر اسم المحل في كل تقاريرك وروابط المشاركة.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">اسم المحل *</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: متجر النور للتجارة" />
                </div>
                <div>
                  <label className="label">اسم صاحب المحل</label>
                  <input className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </div>
                <div>
                  <label className="label">رقم الهاتف</label>
                  <input className="input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0550123456" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">العنوان</label>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="الشارع، المدينة" />
                </div>
                <div>
                  <label className="label">العملة</label>
                  <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {["د.ج", "د.م", "د.ت", "$", "€", "ر.س"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-7 flex justify-between">
                <span className="text-xs text-[#96a59e]">خطوة 1 من 2</span>
                <button className="btn btn-primary" disabled={!name.trim()} onClick={() => setStep(2)}>
                  التالي <ArrowLeft size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <span className="badge badge-teal"><Check size={13} /> الخطوة الأخيرة</span>
                <h2 className="mt-3 text-2xl font-bold">ما الذي تبيعه؟</h2>
                <p className="mt-1 text-sm text-[#72837b]">اختر النشاطات التي تمارسها. ستظهر لك فقط الخيارات المرتبطة بها عند إدخال الصفقات، وسيتغير محرك التسعير تبعاً لها.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ACTIVITY_DEFS.filter((item) => item.type !== "general").map((activity) => {
                  const active = selected.includes(activity.type);
                  return (
                    <button
                      key={activity.type}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition ${active ? "border-[#0f766e] bg-[#eef8f4] shadow-[inset_0_0_0_1px_#0f766e]" : "border-[#e5ece8] bg-white hover:border-[#a9cdc3]"}`}
                      onClick={() => setSelected(active ? selected.filter((item) => item !== activity.type) : [...selected, activity.type])}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">{activity.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{activity.label}</span>
                        <span className="mt-1 block text-[11.5px] leading-5 text-[#7d8e86]">{activity.description}</span>
                      </span>
                      <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active ? "border-[#0f766e] bg-[#0f766e] text-white" : "border-[#d5dfda]"}`}>
                        {active && <Check size={13} />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
              <div className="mt-7 flex items-center justify-between">
                <button className="btn btn-outline" onClick={() => setStep(1)}><ArrowRight size={16} /> السابق</button>
                <button className="btn btn-primary" onClick={() => void finish()} disabled={loading}>
                  {loading ? "جارٍ إنشاء الدفتر..." : "فتح الدفتر"} {!loading && <Check size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
