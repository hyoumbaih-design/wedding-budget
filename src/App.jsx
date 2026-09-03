import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { 
  Plus, Trash2, Printer, Wallet, Cloud, RefreshCw, Gift,
  LayoutDashboard, ShoppingBag, CheckSquare, Users, History, Check, X, Phone
} from "lucide-react";

// الهيكل المبدئي لقاعدة البيانات السحابية
const DEFAULT_APP_DATA = {
  incomes: [{ id: "inc-1", name: "كاش متوفر", amount: 0, status: "available" }],
  categories: [
    { id: "cat-1", name: "إكمال وتشطيب البناء", description: "دهان، كهرباء، سباكة...", items: [] },
    { id: "cat-2", name: "التأثيث والتجهيز", description: "أجهزة كهرومنزلية، أثاث الغرفة، صالون...", items: [] },
    { id: "cat-3", name: "تجهيزات المطبخ والحمام", description: "أواني، تجهيزات صحية، مستلزمات...", items: [] },
    { id: "cat-4", name: "مستلزمات ومصاريف العرس", description: "قاعة، إطعام، كسوة، ليلة العرس...", items: [] }
  ],
  potentialCategories: [
    { id: "pcat-1", name: "أفكار وتحسينات محتملة", items: [] }
  ],
  weddingShoppingCategories: [
    { id: "wcat-1", name: "مشتريات العريس", items: [] },
    { id: "wcat-2", name: "لوازم يوم الزفاف والمائدة", items: [] }
  ],
  guestGroups: [
    { id: "grp-1", name: "أصدقاء الدراسة", guests: [] },
    { id: "grp-2", name: "أصدقاء العمل", guests: [] },
    { id: "grp-3", name: "أقارب وعائلة (أبناء العم والخال)", guests: [] },
    { id: "grp-4", name: "ضيوف من خارج الولاية", guests: [] }
  ],
  purchasedLog: []
};

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [data, setData] = useState(DEFAULT_APP_DATA);
  const [syncStatus, setSyncStatus] = useState("جاري جلب البيانات...");

  // جلب البيانات من السحابة
  const fetchData = async () => {
    setSyncStatus("جاري المزامنة...");
    try {
      const { data: cloudData, error } = await supabase
        .from("budget_data")
        .select("data")
        .eq("id", "main_budget")
        .single();

      if (cloudData && cloudData.data) {
        setData({
          ...DEFAULT_APP_DATA,
          ...cloudData.data
        });
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

  // الحفظ في السحابة
  const saveToCloud = async (updatedData) => {
    setData(updatedData);
    setSyncStatus("جاري الحفظ...");
    try {
      const { error } = await supabase.from("budget_data").upsert({
        id: "main_budget",
        data: updatedData,
        updated_at: new Date().toISOString()
      });
      if (!error) setSyncStatus("تم الحفظ في السحابة ✓");
      else setSyncStatus("فشل الحفظ: " + error.message);
    } catch (e) {
      setSyncStatus("خطأ في الاتصال");
    }
  };

  // --- حالات النماذج والإدخال ---
  const [newIncName, setNewIncName] = useState("");
  const [newIncAmount, setNewIncAmount] = useState("");
  const [newIncStatus, setNewIncStatus] = useState("available");

  const [newItemName, setNewItemName] = useState({});
  const [newItemAmount, setNewItemAmount] = useState({});
  const [newItemStatus, setNewItemStatus] = useState({});

  // مدخلات تبويب المحتملة
  const [newPCatTitle, setNewPCatTitle] = useState("");
  const [newPItemName, setNewPItemName] = useState({});
  const [newPItemPrice, setNewPItemPrice] = useState({});

  // مدخلات مشتريات الزواج
  const [newWCatTitle, setNewWCatTitle] = useState("");
  const [newWItemName, setNewWItemName] = useState({});
  const [newWItemPrice, setNewWItemPrice] = useState({});

  // مدخلات المدعوين
  const [newGroupName, setNewGroupName] = useState("");
  const [newGuestName, setNewGuestName] = useState({});
  const [newGuestPhone, setNewGuestPhone] = useState({});

  // مدخلات سجل المشتريات اليدوي
  const [manualLogName, setManualLogName] = useState("");
  const [manualLogPrice, setManualLogPrice] = useState("");
  const [manualLogCategory, setManualLogCategory] = useState("");

  // --- العمليات المالية ---
  const incomes = data.incomes || [];
  const categories = data.categories || [];
  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const availableCash = incomes.filter(i => i.status === "available").reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  
  const allItems = categories.flatMap(c => c.items || []);
  const totalEstimated = allItems.reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
  const totalPaid = allItems.reduce((acc, curr) => acc + Number(curr.paid || 0), 0);

  const debtUncle = allItems.filter(i => i.status === "debt_uncle").reduce((acc, curr) => acc + (Number(curr.estimated || 0) - Number(curr.paid || 0)), 0);
  const totalGifts = allItems.filter(i => i.status === "gift").reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
  const netEstimatedExpense = totalEstimated - debtUncle - totalGifts;
  const remainingCash = availableCash - totalPaid;

  // إضافة وحذف الدخل
  const addIncome = () => {
    if (!newIncName || !newIncAmount) return;
    const updated = {
      ...data,
      incomes: [...incomes, { id: "inc-" + Date.now(), name: newIncName, amount: Number(newIncAmount), status: newIncStatus }]
    };
    saveToCloud(updated);
    setNewIncName("");
    setNewIncAmount("");
  };

  const deleteIncome = (id) => {
    const updated = { ...data, incomes: incomes.filter(i => i.id !== id) };
    saveToCloud(updated);
  };

  // إضافة وحذف عناصر الميزانية الرئيسية
  const addItem = (catId) => {
    const name = newItemName[catId];
    const amount = newItemAmount[catId];
    if (!name || !amount) return;

    const status = newItemStatus[catId] || "pending";
    const paid = status === "completed" ? Number(amount) : 0;

    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: [...(cat.items || []), { id: "item-" + Date.now(), name, estimated: Number(amount), paid, status }]
        };
      }
      return cat;
    });

    saveToCloud({ ...data, categories: updatedCategories });
    setNewItemName({ ...newItemName, [catId]: "" });
    setNewItemAmount({ ...newItemAmount, [catId]: "" });
    setNewItemStatus({ ...newItemStatus, [catId]: "pending" });
  };

  const deleteItem = (catId, itemId) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, items: (cat.items || []).filter(i => i.id !== itemId) };
      }
      return cat;
    });
    saveToCloud({ ...data, categories: updatedCategories });
  };

  // شارة الحالة
  const getStatusBadge = (status) => {
    switch(status) {
      case "completed": return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">مدفوع كاش</span>;
      case "debt_uncle": return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">دين من الخال</span>;
      case "gift": return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">🎁 هدية محتملة</span>;
      case "optional": return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">يمكن الاستغناء عنه</span>;
      default: return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">قيد الانتظار</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-[#2c2a29] font-sans flex flex-col md:flex-row dir-rtl" dir="rtl">
      
      {/* 1. القائمة الجانبية (Sidebar) في اليمين */}
      <aside className="w-full md:w-64 bg-white border-l border-[#e6e2d8] p-4 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          <div className="pb-4 mb-4 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-800">منظّم حفل الزفاف</h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600">
              <Cloud size={13} />
              <span className="font-medium truncate">{syncStatus}</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setCurrentTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentTab === "dashboard" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <LayoutDashboard size={18} /> الميزانية والتشطيب
            </button>

            <button
              onClick={() => setCurrentTab("potential")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentTab === "potential" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <ShoppingBag size={18} /> مصاريف ومشتريات محتملة
            </button>

            <button
              onClick={() => setCurrentTab("weddingShopping")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentTab === "weddingShopping" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <CheckSquare size={18} /> مستلزمات يوم الزواج
            </button>

            <button
              onClick={() => setCurrentTab("guests")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentTab === "guests" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Users size={18} /> قائمة المدعوين (المعازيم)
            </button>

            <button
              onClick={() => setCurrentTab("history")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${currentTab === "history" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <History size={18} /> سجل المشتريات المنجزة
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
          <button onClick={fetchData} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:bg-gray-50 rounded-lg">
            <RefreshCw size={13} /> مزامنة سحابية يدوية
          </button>
          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200">
            <Printer size={14} /> طباعة أو حفظ PDF
          </button>
        </div>
      </aside>

      {/* 2. منطقة المحتوى الديناميكية */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* التبويب 1: الميزانية والتشطيب الرئيسية */}
        {currentTab === "dashboard" && (
          <div>
            <header className="pb-4 mb-6 border-b border-[#e6e2d8]">
              <h1 className="text-2xl font-bold text-[#1f2937]">الميزانية الرئيسية وتشطيب البيت</h1>
            </header>

            {/* لوحة المؤشرات المالية */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
                <span className="text-xs text-gray-500">الميزانية الكلية</span>
                <div className="text-base font-bold text-gray-900 mt-1">{totalIncome.toLocaleString()} دج</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
                <span className="text-xs text-gray-500">المصاريف الكلية</span>
                <div className="text-base font-bold text-gray-900 mt-1">{totalEstimated.toLocaleString()} دج</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-sm">
                <span className="text-xs text-indigo-700 font-semibold">المصاريف (بدون الخال والهدايا)</span>
                <div className="text-base font-bold text-indigo-950 mt-1">{netEstimatedExpense.toLocaleString()} دج</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/30 shadow-sm">
                <span className="text-xs text-purple-700 font-medium">دين الخال</span>
                <div className="text-base font-bold text-purple-800 mt-1">{debtUncle.toLocaleString()} دج</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 shadow-sm">
                <span className="text-xs text-teal-700 font-medium">هدايا محتملة</span>
                <div className="text-base font-bold text-teal-800 mt-1">{totalGifts.toLocaleString()} دج</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#e6e2d8] shadow-sm">
                <span className="text-xs text-gray-500">السيولة المتبقية كاش</span>
                <div className={`text-base font-bold mt-1 ${remainingCash >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {remainingCash.toLocaleString()} دج
                </div>
              </div>
            </div>

            {/* الأقسام والمداخيل */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* مصادر الدخل */}
              <div className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm h-fit">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Wallet size={18} /> مصادر الدخل والتمويل
                </h3>
                <div className="space-y-3 mb-4">
                  {incomes.map((inc) => (
                    <div key={inc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
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

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <input
                    type="text"
                    placeholder="اسم المصدر (مثال: راتب، بيع أرض...)"
                    value={newIncName}
                    onChange={(e) => setNewIncName(e.target.value)}
                    className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="المبلغ (دج)"
                      value={newIncAmount}
                      onChange={(e) => setNewIncAmount(e.target.value)}
                      className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                    <select
                      value={newIncStatus}
                      onChange={(e) => setNewIncStatus(e.target.value)}
                      className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-black"
                    >
                      <option value="available">كاش متوفر</option>
                      <option value="expected">متوقع لاحقاً</option>
                    </select>
                  </div>
                  <button onClick={addIncome} className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black">
                    + إضافة مصدر تمويل
                  </button>
                </div>
              </div>

              {/* أقسام المصاريف */}
              <div className="lg:col-span-2 space-y-4">
                {categories.map((cat) => {
                  const catTotal = (cat.items || []).reduce((acc, curr) => acc + Number(curr.estimated || 0), 0);
                  return (
                    <div key={cat.id} className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-bold text-base text-gray-900">{cat.name}</h4>
                          <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                        <span className="font-bold text-sm bg-gray-100 px-3 py-1 rounded-lg">
                          {catTotal.toLocaleString()} دج
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {(cat.items || []).length === 0 ? (
                          <div className="text-center py-3 text-xs text-gray-400">لا توجد بنود بعد.</div>
                        ) : (
                          cat.items.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-[#f9fafb] rounded-lg border border-gray-100 gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{item.name}</span>
                                {getStatusBadge(item.status)}
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-left sm:text-right">
                                  <div className="text-xs font-bold text-gray-900">المقدر: {Number(item.estimated).toLocaleString()} دج</div>
                                </div>
                                <button onClick={() => deleteItem(cat.id, item.id)} className="text-gray-400 hover:text-rose-600">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
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
                          className="w-full sm:w-44 text-sm p-2 border border-gray-300 rounded-lg bg-white outline-none focus:border-black"
                        >
                          <option value="pending">⏳ قيد الانتظار</option>
                          <option value="completed">✓ تم شراؤه (كاش)</option>
                          <option value="debt_uncle">🤝 دين من الخال</option>
                          <option value="gift">🎁 هدية محتملة</option>
                          <option value="optional">⭐ يمكن الاستغناء عنه</option>
                        </select>
                        <button onClick={() => addItem(cat.id)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap">
                          + إضافة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* التبويب 2: مصاريف ومشتريات محتملة مع تقسيمات مخصصة */}
        {currentTab === "potential" && (
          <div>
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#e6e2d8]">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مصاريف ومشتريات محتملة</h1>
                <p className="text-xs text-gray-500 mt-1">أنشئ الأقسام التي تريدها للبنود الثانوية أو المقترحة وقارن تكاليفها.</p>
              </div>
            </div>

            {/* إضافة قسم جديد يحدده المستخدم */}
            <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] mb-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="اسم القسم الجديد (مثال: ديكور إضافي، أدوات كهرومنزلية غير أساسية...)"
                value={newPCatTitle}
                onChange={(e) => setNewPCatTitle(e.target.value)}
                className="flex-1 text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <button
                onClick={() => {
                  if (!newPCatTitle.trim()) return;
                  const updated = {
                    ...data,
                    potentialCategories: [...(data.potentialCategories || []), { id: "pcat-" + Date.now(), name: newPCatTitle, items: [] }]
                  };
                  saveToCloud(updated);
                  setNewPCatTitle("");
                }}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap"
              >
                + إنشاء قسم جديد
              </button>
            </div>

            {/* عرض الأقسام والبنود */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(data.potentialCategories || []).map((cat) => {
                const total = (cat.items || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
                return (
                  <div key={cat.id} className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-base text-gray-900">{cat.name}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-lg border border-amber-200">
                          {total.toLocaleString()} دج
                        </span>
                        <button
                          onClick={() => {
                            const updated = {
                              ...data,
                              potentialCategories: data.potentialCategories.filter(c => c.id !== cat.id)
                            };
                            saveToCloud(updated);
                          }}
                          className="text-gray-300 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(cat.items || []).map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium">{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-700">{Number(item.price).toLocaleString()} دج</span>
                            <button
                              onClick={() => {
                                const updated = {
                                  ...data,
                                  potentialCategories: data.potentialCategories.map(c => c.id === cat.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c)
                                };
                                saveToCloud(updated);
                              }}
                              className="text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <input
                        type="text"
                        placeholder="اسم الشيء المحتمل"
                        value={newPItemName[cat.id] || ""}
                        onChange={(e) => setNewPItemName({ ...newPItemName, [cat.id]: e.target.value })}
                        className="flex-1 text-sm p-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="السعر (دج)"
                        value={newPItemPrice[cat.id] || ""}
                        onChange={(e) => setNewPItemPrice({ ...newPItemPrice, [cat.id]: e.target.value })}
                        className="w-28 text-sm p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          const name = newPItemName[cat.id];
                          const price = newPItemPrice[cat.id];
                          if (!name || !price) return;
                          const updated = {
                            ...data,
                            potentialCategories: data.potentialCategories.map(c => c.id === cat.id ? { ...c, items: [...(c.items || []), { id: "pitem-" + Date.now(), name, price: Number(price) }] } : c)
                          };
                          saveToCloud(updated);
                          setNewPItemName({ ...newPItemName, [cat.id]: "" });
                          setNewPItemPrice({ ...newPItemPrice, [cat.id]: "" });
                        }}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* التبويب 3: مستلزمات يوم الزواج مع حالة (تم الشراء / لم يتم) */}
        {currentTab === "weddingShopping" && (
          <div>
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#e6e2d8]">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مستلزمات ومشتريات وقت الزواج</h1>
                <p className="text-xs text-gray-500 mt-1">قائمة دقيقة لجميع الحاجيات مع تتبع ما تم شراؤه وما تبقى بالتفصيل.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] mb-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="اسم القسم (مثال: كسوة العريس، لوازم القاعة، المشروبات والحلويات...)"
                value={newWCatTitle}
                onChange={(e) => setNewWCatTitle(e.target.value)}
                className="flex-1 text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <button
                onClick={() => {
                  if (!newWCatTitle.trim()) return;
                  const updated = {
                    ...data,
                    weddingShoppingCategories: [...(data.weddingShoppingCategories || []), { id: "wcat-" + Date.now(), name: newWCatTitle, items: [] }]
                  };
                  saveToCloud(updated);
                  setNewWCatTitle("");
                }}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap"
              >
                + إنشاء قسم مستلزمات
              </button>
            </div>

            <div className="space-y-6">
              {(data.weddingShoppingCategories || []).map((cat) => (
                <div key={cat.id} className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-base text-gray-900">{cat.name}</h3>
                    <button
                      onClick={() => {
                        const updated = {
                          ...data,
                          weddingShoppingCategories: data.weddingShoppingCategories.filter(c => c.id !== cat.id)
                        };
                        saveToCloud(updated);
                      }}
                      className="text-gray-300 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {(cat.items || []).map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          item.bought ? "bg-emerald-50/70 border-emerald-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                weddingShoppingCategories: data.weddingShoppingCategories.map(c => c.id === cat.id ? {
                                  ...c,
                                  items: c.items.map(i => i.id === item.id ? { ...i, bought: !i.bought } : i)
                                } : c)
                              };
                              saveToCloud(updated);
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                              item.bought ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-gray-300 text-transparent"
                            }`}
                          >
                            <Check size={14} className={item.bought ? "text-white" : "hidden"} />
                          </button>
                          <div>
                            <div className={`text-sm font-semibold ${item.bought ? "line-through text-gray-500" : "text-gray-900"}`}>{item.name}</div>
                            <div className="text-xs text-gray-500">{Number(item.price || 0).toLocaleString()} دج</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.bought ? "bg-emerald-200 text-emerald-900" : "bg-amber-100 text-amber-800"}`}>
                            {item.bought ? "تم الشراء ✓" : "مزال لم يشترَ"}
                          </span>
                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                weddingShoppingCategories: data.weddingShoppingCategories.map(c => c.id === cat.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c)
                              };
                              saveToCloud(updated);
                            }}
                            className="text-gray-400 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="اسم المستلزم (مثال: عطر، قميص أبيض، صحون تقديم...)"
                      value={newWItemName[cat.id] || ""}
                      onChange={(e) => setNewWItemName({ ...newWItemName, [cat.id]: e.target.value })}
                      className="flex-1 text-sm p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="المبلغ التقديري (دج)"
                      value={newWItemPrice[cat.id] || ""}
                      onChange={(e) => setNewWItemPrice({ ...newWItemPrice, [cat.id]: e.target.value })}
                      className="w-32 text-sm p-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const name = newWItemName[cat.id];
                        const price = newWItemPrice[cat.id];
                        if (!name) return;
                        const updated = {
                          ...data,
                          weddingShoppingCategories: data.weddingShoppingCategories.map(c => c.id === cat.id ? {
                            ...c,
                            items: [...(c.items || []), { id: "witem-" + Date.now(), name, price: Number(price || 0), bought: false }]
                          } : c)
                        };
                        saveToCloud(updated);
                        setNewWItemName({ ...newWItemName, [cat.id]: "" });
                        setNewWItemPrice({ ...newWItemPrice, [cat.id]: "" });
                      }}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب 4: قائمة المدعوين (المعازيم) مقسمين حسب رغبتك */}
        {currentTab === "guests" && (
          <div>
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#e6e2d8]">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">قائمة المدعوين لحفل الزفاف</h1>
                <p className="text-xs text-gray-500 mt-1">تنظيم المعازيم حسب المجموعات مع أرقام هواتفهم وحالة تأكيد حضورهم.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e6e2d8] mb-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="اسم تصنيف جديد (مثال: جيران الحي، أصدقاء الولاية الفلانية، زملاء الرياضة...)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
              />
              <button
                onClick={() => {
                  if (!newGroupName.trim()) return;
                  const updated = {
                    ...data,
                    guestGroups: [...(data.guestGroups || []), { id: "grp-" + Date.now(), name: newGroupName, guests: [] }]
                  };
                  saveToCloud(updated);
                  setNewGroupName("");
                }}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap"
              >
                + إنشاء مجموعة معازيم
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(data.guestGroups || []).map((grp) => (
                <div key={grp.id} className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-base text-gray-900">{grp.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
                        {(grp.guests || []).length} مدعو
                      </span>
                      <button
                        onClick={() => {
                          const updated = {
                            ...data,
                            guestGroups: data.guestGroups.filter(g => g.id !== grp.id)
                          };
                          saveToCloud(updated);
                        }}
                        className="text-gray-300 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(grp.guests || []).map((gst) => (
                      <div key={gst.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{gst.name}</div>
                          {gst.phone ? (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5" dir="ltr">
                              <Phone size={11} /> {gst.phone}
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-400">بدون هاتف</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                guestGroups: data.guestGroups.map(g => g.id === grp.id ? {
                                  ...g,
                                  guests: g.guests.map(x => x.id === gst.id ? { ...x, confirmed: !x.confirmed } : x)
                                } : g)
                              };
                              saveToCloud(updated);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                              gst.confirmed ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-gray-100 border-gray-200 text-gray-600"
                            }`}
                          >
                            {gst.confirmed ? "تم التأكيد ✓" : "لم يؤكد"}
                          </button>
                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                guestGroups: data.guestGroups.map(g => g.id === grp.id ? {
                                  ...g,
                                  guests: g.guests.filter(x => x.id !== gst.id)
                                } : g)
                              };
                              saveToCloud(updated);
                            }}
                            className="text-gray-400 hover:text-rose-600 ml-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="اسم المدعو"
                      value={newGuestName[grp.id] || ""}
                      onChange={(e) => setNewGuestName({ ...newGuestName, [grp.id]: e.target.value })}
                      className="flex-1 text-sm p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="رقم الهاتف (اختياري)"
                      value={newGuestPhone[grp.id] || ""}
                      onChange={(e) => setNewGuestPhone({ ...newGuestPhone, [grp.id]: e.target.value })}
                      className="w-full sm:w-36 text-sm p-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const name = newGuestName[grp.id];
                        if (!name) return;
                        const phone = newGuestPhone[grp.id] || "";
                        const updated = {
                          ...data,
                          guestGroups: data.guestGroups.map(g => g.id === grp.id ? {
                            ...g,
                            guests: [...(g.guests || []), { id: "gst-" + Date.now(), name, phone, confirmed: false }]
                          } : g)
                        };
                        saveToCloud(updated);
                        setNewGuestName({ ...newGuestName, [grp.id]: "" });
                        setNewGuestPhone({ ...newGuestPhone, [grp.id]: "" });
                      }}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* التبويب 5: سجل المشتريات المنجزة يدوياً */}
        {currentTab === "history" && (
          <div>
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#e6e2d8]">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">سجل المشتريات المنجزة يدوياً</h1>
                <p className="text-xs text-gray-500 mt-1">دفتر تدوين ما تم شراؤه فعلياً مع السعر المدفوع وتاريخ الشراء للرجوع إليه.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e6e2d8] shadow-sm mb-6">
              <h3 className="font-bold text-sm text-gray-800 mb-3">تسجيل مشتريات جديدة:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="اسم الشيء المشترى (مثال: سخان ماء، ثريات صالون...)"
                  value={manualLogName}
                  onChange={(e) => setManualLogName(e.target.value)}
                  className="text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
                />
                <input
                  type="number"
                  placeholder="المبلغ المدفوع فعلياً (دج)"
                  value={manualLogPrice}
                  onChange={(e) => setManualLogPrice(e.target.value)}
                  className="text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder="القسم أو التصنيف (مثال: سباكة، أثاث...)"
                  value={manualLogCategory}
                  onChange={(e) => setManualLogCategory(e.target.value)}
                  className="text-sm p-2.5 border border-gray-300 rounded-lg outline-none focus:border-black"
                />
              </div>
              <button
                onClick={() => {
                  if (!manualLogName || !manualLogPrice) return;
                  const newEntry = {
                    id: "log-" + Date.now(),
                    name: manualLogName,
                    price: Number(manualLogPrice),
                    category: manualLogCategory || "عام",
                    date: new Date().toLocaleDateString("ar-DZ")
                  };
                  const updated = {
                    ...data,
                    purchasedLog: [newEntry, ...(data.purchasedLog || [])]
                  };
                  saveToCloud(updated);
                  setManualLogName("");
                  setManualLogPrice("");
                  setManualLogCategory("");
                }}
                className="mt-3 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black"
              >
                + حفظ في السجل
              </button>
            </div>

            {/* عرض السجل */}
            <div className="bg-white rounded-xl border border-[#e6e2d8] overflow-hidden shadow-sm">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="p-3.5">الشيء المشترى</th>
                    <th className="p-3.5">المبلغ المدفوع</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">تاريخ الإدخال</th>
                    <th className="p-3.5 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.purchasedLog || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-400">لا توجد مشتريات مسجلة بعد.</td>
                    </tr>
                  ) : (
                    data.purchasedLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3.5 font-semibold text-gray-900">{log.name}</td>
                        <td className="p-3.5 font-bold text-emerald-600">{Number(log.price).toLocaleString()} دج</td>
                        <td className="p-3.5 text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{log.category}</span></td>
                        <td className="p-3.5 text-gray-500 text-xs">{log.date}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                purchasedLog: data.purchasedLog.filter(l => l.id !== log.id)
                              };
                              saveToCloud(updated);
                            }}
                            className="text-gray-400 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}