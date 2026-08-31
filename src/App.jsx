import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { 
  Plus, Trash2, Printer, Wallet, Cloud, RefreshCw, Gift 
} from "lucide-react";

const INITIAL_INCOMES = [
  { id: "inc-1", name: "كاش متوفر", amount: 0, status: "available" }
];

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "إكمال وتشطيب البناء", description: "دهان، كهرباء، سباكة...", items: [] },
  { id: "cat-2", name: "التأثيث والتجهيز", description: "أجهزة كهرومنزلية، أثاث الغرفة، صالون...", items: [] },
  { id: "cat-3", name: "تجهيزات المطبخ والحمام", description: "أواني، تجهيزات صحية، مستلزمات...", items: [] },
  { id: "cat-4", name: "مستلزمات ومصاريف العرس", description: "قاعة، إطعام، كسوة، ليلة العرس...", items: [] }
];

export default function App() {
  const [incomes, setIncomes] = useState(INITIAL_INCOMES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [syncStatus, setSyncStatus] = useState("جاري جلب البيانات...");

  // جلب البيانات من السحابة
  const fetchData = async () => {
    setSyncStatus("جاري المزامنة...");
    try {
      const { data, error } = await supabase
        .from("budget_data")
        .select("data")
        .eq("id", "main_budget")
        .single();

      if (data && data.data) {
        if (data.data.incomes && data.data.incomes.length > 0) setIncomes(data.data.incomes);
        if (data.data.categories && data.data.categories.length > 0) setCategories(data.data.categories);
        setSyncStatus("متصل ومزامن سحابياً ✓");
      } else {
        setSyncStatus("متصل ومزامن سحابياً ✓");
      }
    } catch (err) {
      setSyncStatus("خطأ في الاتصال");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // الحفظ السحابي
  const saveDataToCloud = async (newIncomes, newCategories) => {
    setSyncStatus("جاري الحفظ...");
    try {
      const { error } = await supabase.from("budget_data").upsert({
        id: "main_budget",
        data: {
          incomes: newIncomes,
          categories: newCategories
        },
        updated_at: new Date().toISOString()
      });

      if (!error) {
        setSyncStatus("تم الحفظ في السحابة ✓");
      } else {
        setSyncStatus("فشل الحفظ: " + error.message);
      }
    } catch (err) {
      setSyncStatus("خطأ أثناء الحفظ");
    }
  };

  // مدخلات الدخل
  const [newIncName, setNewIncName] = useState("");
  const [newIncAmount, setNewIncAmount] = useState("");
  const [newIncStatus, setNewIncStatus] = useState("available");

  // مدخلات البنود
  const [newItemName, setNewItemName] = useState({});
  const [newItemAmount, setNewItemAmount] = useState({});
  const [newItemPaid, setNewItemPaid] = useState({});
  const [newItemStatus, setNewItemStatus] = useState({});

  // الحسابات المالية
  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const availableCash = incomes
    .filter((i) => i.status === "available")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const allItems = categories.flatMap((c) => c.items);
  
  const totalEstimated = allItems.reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
  const totalPaid = allItems.reduce((acc, curr) => acc + Number(curr.paid || 0), 0);

  // حساب الديون
  const debtUncle = allItems
    .filter((i) => i.status === "debt_uncle")
    .reduce((acc, curr) => acc + (Number(curr.estimated || 0) - Number(curr.paid || 0)), 0);

  const debtOther = allItems
    .filter((i) => i.status === "debt_other")
    .reduce((acc, curr) => acc + (Number(curr.estimated || 0) - Number(curr.paid || 0)), 0);

  // مصاريف قابلة للاستغناء
  const totalOptional = allItems
    .filter((i) => i.status === "optional")
    .reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);

  // هدايا متوقعة
  const totalGifts = allItems
    .filter((i) => i.status === "gift")
    .reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);

  // السيولة المتبقية بعد الدفع كاش
  const remainingCash = availableCash - totalPaid;

  const addIncome = () => {
    if (!newIncName || !newIncAmount) return;
    const updated = [
      ...incomes,
      { id: "inc-" + Date.now(), name: newIncName, amount: Number(newIncAmount), status: newIncStatus }
    ];
    setIncomes(updated);
    saveDataToCloud(updated, categories);
    setNewIncName("");
    setNewIncAmount("");
  };

  const deleteIncome = (id) => {
    const updated = incomes.filter((i) => i.id !== id);
    setIncomes(updated);
    saveDataToCloud(updated, categories);
  };

  const addItem = (catId) => {
    const name = newItemName[catId];
    const amount = newItemAmount[catId];
    if (!name || !amount) return;

    const status = newItemStatus[catId] || "pending";
    const paid = status === "completed" ? Number(amount) : Number(newItemPaid[catId] || 0);

    const updated = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: [
            ...cat.items,
            {
              id: "item-" + Date.now(),
              name,
              estimated: Number(amount),
              paid,
              status
            }
          ]
        };
      }
      return cat;
    });

    setCategories(updated);
    saveDataToCloud(incomes, updated);
    setNewItemName({ ...newItemName, [catId]: "" });
    setNewItemAmount({ ...newItemAmount, [catId]: "" });
    setNewItemPaid({ ...newItemPaid, [catId]: "" });
    setNewItemStatus({ ...newItemStatus, [catId]: "pending" });
  };

  const deleteItem = (catId, itemId) => {
    const updated = categories.map((cat) => {
      if (cat.id === catId) {
        return { ...cat, items: cat.items.filter((i) => i.id !== itemId) };
      }
      return cat;
    });
    setCategories(updated);
    saveDataToCloud(incomes, updated);
  };

  // شارات التمييز
  const getStatusBadge = (status) => {
    switch(status) {
      case "completed":
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">مدفوع كاش</span>;
      case "debt_uncle":
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">دين من الخال</span>;
      case "debt_other":
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">دين آخر</span>;
      case "optional":
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">يمكن الاستغناء عنه</span>;
      case "gift":
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">🎁 هدية محتملة</span>;
      default:
        return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">قيد الانتظار</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#2c2a29] font-sans p-4 md:p-8 dir-rtl" dir="rtl">
      {/* الرأس */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 border-b border-[#e6e2d8] gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">ميزانية الزواج وإكمال البيت</h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#059669]">
            <Cloud size={14} />
            <span className="font-medium">{syncStatus}</span>
            <button onClick={fetchData} title="إعادة مزامنة" className="text-gray-500 hover:text-black mr-2">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] text-white rounded-lg text-sm hover:bg-black transition-colors shadow-sm">
          <Printer size={16} /> طباعة / تصدير PDF
        </button>
      </header>

      {/* شريط الإحصائيات والتحليلات */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 my-6">
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">الميزانية الكلية</span>
          <div className="text-base font-bold text-[#1f2937] mt-1">{totalIncome.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">المصاريف المقدرة</span>
          <div className="text-base font-bold text-[#1f2937] mt-1">{totalEstimated.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-emerald-700 font-medium">المدفوع كاش</span>
          <div className="text-base font-bold text-emerald-600 mt-1">{totalPaid.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-purple-700 font-medium">دين الخال</span>
          <div className="text-base font-bold text-purple-700 mt-1">{debtUncle.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-teal-700 font-medium">هدايا محتملة</span>
          <div className="text-base font-bold text-teal-700 mt-1">{totalGifts.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-amber-700 font-medium">قابل للاستغناء</span>
          <div className="text-base font-bold text-amber-600 mt-1">{totalOptional.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs text-[#6b7280]">السيولة المتبقية</span>
          <div className={`text-base font-bold mt-1 ${remainingCash >= 0 ? "text-blue-600" : "text-rose-600"}`}>
            {remainingCash.toLocaleString()} دج
          </div>
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* مصادر الدخل */}
        <div className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm h-fit">
          <h2 className="text-base font-bold text-[#1f2937] flex items-center gap-2 mb-4">
            <Wallet size={18} /> مصادر الدخل والتمويل
          </h2>
          <div className="space-y-3 mb-4">
            {incomes.map((inc) => (
              <div key={inc.id} className="flex justify-between items-center p-3 bg-[#f9fafb] rounded-lg border border-[#f3f4f6]">
                <div>
                  <div className="font-semibold text-sm">{inc.name}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${inc.status === "available" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {inc.status === "available" ? "كاش متوفر" : "متوقع لاحقاً"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{Number(inc.amount).toLocaleString()} دج</span>
                  <button onClick={() => deleteIncome(inc.id)} className="text-gray-400 hover:text-rose-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#f3f4f6] space-y-2">
            <input
              type="text"
              placeholder="اسم المصدر (مثال: راتب، ادخار...)"
              value={newIncName}
              onChange={(e) => setNewIncName(e.target.value)}
              className="w-full text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="المبلغ (دج)"
                value={newIncAmount}
                onChange={(e) => setNewIncAmount(e.target.value)}
                className="w-1/2 text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <select
                value={newIncStatus}
                onChange={(e) => setNewIncStatus(e.target.value)}
                className="w-1/2 text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
              >
                <option value="available">كاش متوفر حالياً</option>
                <option value="expected">متوقع لاحقاً</option>
              </select>
            </div>
            <button onClick={addIncome} className="w-full py-2.5 bg-[#1f2937] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors">
              + إضافة مصدر تمويل
            </button>
          </div>
        </div>

        {/* أقسام المصاريف */}
        <div className="lg:col-span-2 space-y-4">
          {categories.map((cat) => {
            const catTotal = cat.items.reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
            return (
              <div key={cat.id} className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#1f2937]">{cat.name}</h3>
                    <p className="text-xs text-[#6b7280]">{cat.description}</p>
                  </div>
                  <span className="font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">
                    {catTotal.toLocaleString()} دج
                  </span>
                </div>

                {/* قائمة البنود */}
                <div className="space-y-2 mb-4">
                  {cat.items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400">لا توجد بنود في هذا القسم بعد.</div>
                  ) : (
                    cat.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-[#f9fafb] rounded-lg border border-[#f3f4f6] gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{item.name}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-[#1f2937]">المقدر: {Number(item.estimated).toLocaleString()} دج</div>
                            {item.paid > 0 && item.status !== "completed" && (
                              <div className="text-[11px] text-emerald-600">المدفوع: {Number(item.paid).toLocaleString()} دج</div>
                            )}
                          </div>
                          <button onClick={() => deleteItem(cat.id, item.id)} className="text-gray-400 hover:text-rose-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* إضافة بند */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#f3f4f6]">
                  <input
                    type="text"
                    placeholder="اسم البند"
                    value={newItemName[cat.id] || ""}
                    onChange={(e) => setNewItemName({ ...newItemName, [cat.id]: e.target.value })}
                    className="flex-1 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                  <input
                    type="number"
                    placeholder="المبلغ (دج)"
                    value={newItemAmount[cat.id] || ""}
                    onChange={(e) => setNewItemAmount({ ...newItemAmount, [cat.id]: e.target.value })}
                    className="w-full sm:w-28 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                  <select
                    value={newItemStatus[cat.id] || "pending"}
                    onChange={(e) => setNewItemStatus({ ...newItemStatus, [cat.id]: e.target.value })}
                    className="w-full sm:w-44 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black bg-white"
                  >
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="completed">✓ تم شراؤه (كاش)</option>
                    <option value="debt_uncle">🤝 دين من الخال</option>
                    <option value="gift">🎁 هدية محتملة</option>
                    <option value="optional">⭐ يمكن الاستغناء عنه</option>
                    <option value="debt_other">💳 دين آخر</option>
                  </select>
                  <button onClick={() => addItem(cat.id)} className="px-4 py-2 bg-[#1f2937] text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap">
                    + إضافة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}