import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit2, Check, Download, Upload, 
  Printer, Wallet, DollarSign, PieChart, TrendingUp, AlertCircle 
} from "lucide-react";

const INITIAL_INCOMES = [
  { id: "inc-1", name: "كاش متوفر", amount: 0, status: "available" }
];

const INITIAL_CATEGORIES = [
  {
    id: "cat-1",
    name: "إكمال وتشطيب البناء",
    description: "دهان، كهرباء، سباكة...",
    items: []
  },
  {
    id: "cat-2",
    name: "التأثيث والتجهيز",
    description: "أجهزة كهرومنزلية، أثاث الغرفة، صالون...",
    items: []
  },
  {
    id: "cat-3",
    name: "تجهيزات المطبخ والحمام",
    description: "أواني، تجهيزات صحية، مستلزمات...",
    items: []
  },
  {
    id: "cat-4",
    name: "مستلزمات ومصاريف العرس",
    description: "قاعة، إطعام، كسوة، ليلة العرس...",
    items: []
  }
];

export default function App() {
  // استرجاع البيانات المحفوظة تلقائياً أو استخدام الافتراضية
  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem("wb_incomes");
    return saved ? JSON.parse(saved) : INITIAL_INCOMES;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("wb_categories");
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // حفظ تلقائي فوري عند أي تعديل
  useEffect(() => {
    localStorage.setItem("wb_incomes", JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem("wb_categories", JSON.stringify(categories));
  }, [categories]);

  // مدخلات الإضافة الجديدة
  const [newIncName, setNewIncName] = useState("");
  const [newIncAmount, setNewIncAmount] = useState("");
  const [newIncStatus, setNewIncStatus] = useState("available");

  const [newItemName, setNewItemName] = useState({});
  const [newItemAmount, setNewItemAmount] = useState({});
  const [newItemPaid, setNewItemPaid] = useState({});
  const [newItemStatus, setNewItemStatus] = useState({});

  // حساب الإجماليات
  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const availableIncome = incomes
    .filter((i) => i.status === "available")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const allItems = categories.flatMap((c) => c.items);
  const totalEstimated = allItems.reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
  const totalPaid = allItems.reduce((acc, curr) => acc + Number(curr.paid || 0), 0);
  const totalDebt = allItems
    .filter((i) => i.status === "debt")
    .reduce((acc, curr) => acc + (Number(curr.estimated || 0) - Number(curr.paid || 0)), 0);

  const remainingCash = availableIncome - totalPaid;

  // دوال الدخل
  const addIncome = () => {
    if (!newIncName || !newIncAmount) return;
    setIncomes([
      ...incomes,
      {
        id: "inc-" + Date.now(),
        name: newIncName,
        amount: Number(newIncAmount),
        status: newIncStatus
      }
    ]);
    setNewIncName("");
    setNewIncAmount("");
  };

  const deleteIncome = (id) => {
    setIncomes(incomes.filter((i) => i.id !== id));
  };

  // دوال المصاريف
  const addItem = (catId) => {
    const name = newItemName[catId];
    const amount = newItemAmount[catId];
    if (!name || !amount) return;

    const paid = Number(newItemPaid[catId] || 0);
    const status = newItemStatus[catId] || "pending";

    setCategories(
      categories.map((cat) => {
        if (cat.id === catId) {
          return {
            ...cat,
            items: [
              ...cat.items,
              {
                id: "item-" + Date.now(),
                name,
                estimated: Number(amount),
                paid: status === "completed" ? Number(amount) : paid,
                status
              }
            ]
          };
        }
        return cat;
      })
    );

    setNewItemName({ ...newItemName, [catId]: "" });
    setNewItemAmount({ ...newItemAmount, [catId]: "" });
    setNewItemPaid({ ...newItemPaid, [catId]: "" });
  };

  const deleteItem = (catId, itemId) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === catId) {
          return { ...cat, items: cat.items.filter((i) => i.id !== itemId) };
        }
        return cat;
      })
    );
  };

  // تصدير واستيراد JSON
  const exportJSON = () => {
    const data = JSON.stringify({ incomes, categories }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ميزانية-الزواج-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importJSON = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.incomes && parsed.categories) {
          setIncomes(parsed.incomes);
          setCategories(parsed.categories);
        }
      } catch (err) {
        alert("ملف غير صالح!");
      }
    };
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#2c2a29] font-sans p-4 md:p-8 dir-rtl" dir="rtl">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 border-b border-[#e6e2d8] gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">ميزانية الزواج وإكمال البيت</h1>
          <p className="text-sm text-[#6b7280] mt-1">دفتر متابعة موحد للمداخيل والمصاريف — البيانات تُحفظ تلقائياً في جهازك</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm cursor-pointer hover:bg-[#f3f4f6]">
            <Upload size={16} /> استيراد JSON
            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
          </label>
          <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm hover:bg-[#f3f4f6]">
            <Download size={16} /> تصدير نسخة
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2937] text-white rounded-lg text-sm hover:bg-black">
            <Printer size={16} /> طباعة / PDF
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
        <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">الميزانية الكلية</span>
          <div className="text-lg font-bold text-[#1f2937] mt-1">{totalIncome.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">المصاريف المخططة</span>
          <div className="text-lg font-bold text-[#1f2937] mt-1">{totalEstimated.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">المدفوع كاش</span>
          <div className="text-lg font-bold text-[#059669] mt-1">{totalPaid.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] shadow-sm">
          <span className="text-xs text-[#6b7280]">الديون المستحقة</span>
          <div className="text-lg font-bold text-[#dc2626] mt-1">{totalDebt.toLocaleString()} دج</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] shadow-sm col-span-2 md:col-span-1">
          <span className="text-xs text-[#6b7280]">الفائض المتبقي</span>
          <div className={`text-lg font-bold mt-1 ${remainingCash >= 0 ? "text-[#2563eb]" : "text-[#dc2626]"}`}>
            {remainingCash.toLocaleString()} دج
          </div>
        </div>
      </section>

      {/* Main Grid */}
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
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inc.status === "available" ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef9c3] text-[#854d0e]"}`}>
                    {inc.status === "available" ? "متوفر حالياً" : "متوقع لاحقاً"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{Number(inc.amount).toLocaleString()} دج</span>
                  <button onClick={() => deleteIncome(inc.id)} className="text-[#9ca3af] hover:text-[#dc2626]">
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
              className="w-full text-sm p-2 border border-[#d1d5db] rounded-lg"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="المبلغ (دج)"
                value={newIncAmount}
                onChange={(e) => setNewIncAmount(e.target.value)}
                className="w-1/2 text-sm p-2 border border-[#d1d5db] rounded-lg"
              />
              <select
                value={newIncStatus}
                onChange={(e) => setNewIncStatus(e.target.value)}
                className="w-1/2 text-sm p-2 border border-[#d1d5db] rounded-lg"
              >
                <option value="available">متوفر حالياً</option>
                <option value="expected">متوقع لاحقاً</option>
              </select>
            </div>
            <button onClick={addIncome} className="w-full py-2 bg-[#1f2937] text-white rounded-lg text-sm font-medium hover:bg-black">
              + إضافة مصدر دخل
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
                  <span className="font-bold text-sm bg-[#f3f4f6] px-3 py-1 rounded-lg">
                    {catTotal.toLocaleString()} دج
                  </span>
                </div>

                {/* قائمة البنود */}
                <div className="space-y-2 mb-4">
                  {cat.items.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#9ca3af]">لا توجد بنود في هذا القسم بعد.</div>
                  ) : (
                    cat.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-[#f9fafb] rounded-lg border border-[#f3f4f6] gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                            item.status === "completed" ? "bg-[#dcfce7] text-[#166534]" :
                            item.status === "debt" ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#fef9c3] text-[#854d0e]"
                          }`}>
                            {item.status === "completed" ? "مدفوع بالكامل" : item.status === "debt" ? "شراء بالدين" : "قيد الانتظار"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-[#1f2937]">المقدر: {Number(item.estimated).toLocaleString()} دج</div>
                            {item.paid > 0 && <div className="text-[11px] text-[#059669]">المدفوع: {Number(item.paid).toLocaleString()} دج</div>}
                          </div>
                          <button onClick={() => deleteItem(cat.id, item.id)} className="text-[#9ca3af] hover:text-[#dc2626]">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* إضافة بند جديد */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#f3f4f6]">
                  <input
                    type="text"
                    placeholder="اسم البند الجديد"
                    value={newItemName[cat.id] || ""}
                    onChange={(e) => setNewItemName({ ...newItemName, [cat.id]: e.target.value })}
                    className="flex-1 text-sm p-2 border border-[#d1d5db] rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="المبلغ المقدر"
                    value={newItemAmount[cat.id] || ""}
                    onChange={(e) => setNewItemAmount({ ...newItemAmount, [cat.id]: e.target.value })}
                    className="w-full sm:w-28 text-sm p-2 border border-[#d1d5db] rounded-lg"
                  />
                  <select
                    value={newItemStatus[cat.id] || "pending"}
                    onChange={(e) => setNewItemStatus({ ...newItemStatus, [cat.id]: e.target.value })}
                    className="w-full sm:w-32 text-sm p-2 border border-[#d1d5db] rounded-lg"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="completed">تم شراؤه (كاش)</option>
                    <option value="debt">شراء بالدين</option>
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