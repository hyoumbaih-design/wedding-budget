import React, { useState, useMemo, useRef } from "react";
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp,
  Wallet, PiggyBank, Banknote, HandCoins, Download, Upload,
  Printer, Circle, CheckCircle2, Gift, Users, Clock, CreditCard,
} from "lucide-react";

/* ---------- design tokens ---------- */
const C = {
  bg: "#FBF7F0",
  panel: "#FFFFFF",
  ink: "#1E2420",
  inkSoft: "#5B5A52",
  line: "#E6E0D4",
  lineStrong: "#CFC7B4",
  teal: "#173F3A",
  tealSoft: "#2C5D54",
  gold: "#B6902F",
  goldSoft: "#EFE3C2",
  rust: "#93472F",
  rustSoft: "#F3E1DA",
  blue: "#2E5978",
  blueSoft: "#DDE7EE",
  grayPill: "#8A8578",
  graySoft: "#EFEDE6",
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US") + " دج";
};

const STATUS_META = {
  pending: { label: "قيد الانتظار", icon: Clock, color: C.grayPill, soft: C.graySoft },
  paid: { label: "مدفوع كاش", icon: Banknote, color: C.tealSoft, soft: "#E1EDE9" },
  debt: { label: "بالدين", icon: CreditCard, color: C.rust, soft: C.rustSoft },
  gift: { label: "هدية / كادو", icon: Gift, color: C.gold, soft: C.goldSoft },
  support: { label: "دعم عائلي", icon: Users, color: C.blue, soft: C.blueSoft },
};

const DEFAULT_CATEGORIES = [
  { id: uid(), name: "إكمال وتشطيب البناء", note: "دهان، كهرباء، سباكة...", items: [] },
  { id: uid(), name: "التأثيث والتجهيز", note: "أجهزة كهرومنزلية، أثاث الغرفة، صالون...", items: [] },
  { id: uid(), name: "تجهيزات المطبخ والحمام", note: "", items: [] },
  { id: uid(), name: "الإطعام وعشاء العرس", note: "لحوم، حلويات، فواكه، سلع جافة...", items: [] },
  { id: uid(), name: "مستلزمات العروسين والمظهر", note: "محبس/ذهب، لباس، حلاقة...", items: [] },
  { id: uid(), name: "مصاريف الحفلة والكراء والتنظيم", note: "", items: [] },
  { id: uid(), name: "مصاريف متنوعة وطوارئ", note: "", items: [] },
];

const DEFAULT_INCOMES = [
  { id: uid(), name: "كاش متوفر", amount: 0, status: "available" },
];

/* ---------- small building blocks ---------- */

function KPI({ label, value, sub, tone }) {
  return (
    <div className="flex flex-col justify-between px-5 py-4 min-w-[168px] border-l first:border-l-0 sm:first:border-l"
      style={{ borderColor: C.line }}>
      <span className="text-xs" style={{ color: C.inkSoft }}>{label}</span>
      <span className="text-2xl font-black mt-1" style={{ color: tone || C.ink, fontVariantNumeric: "tabular-nums" }}>
        {fmt(value)}
      </span>
      {sub ? <span className="text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{sub}</span> : null}
    </div>
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="no-print inline-flex items-center justify-center w-8 h-8 rounded transition-colors"
      style={{ color: danger ? C.rust : C.inkSoft, background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? C.rustSoft : C.graySoft)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-sm font-medium"
      style={{ background: meta.soft, color: meta.color === meta.soft ? C.ink : meta.color }}
    >
      <Icon size={13} strokeWidth={2.4} />
      {meta.label}
    </span>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [incomes, setIncomes] = useState(DEFAULT_INCOMES);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [expanded, setExpanded] = useState(() => new Set(DEFAULT_CATEGORIES.map((c) => c.id)));

  // income form / edit state
  const [incomeDraft, setIncomeDraft] = useState({ name: "", amount: "", status: "available" });
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editIncomeDraft, setEditIncomeDraft] = useState(null);

  // category name editing
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [newCatName, setNewCatName] = useState("");

  // item add drafts per category id
  const [itemDrafts, setItemDrafts] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editItemDraft, setEditItemDraft] = useState(null);

  const fileInputRef = useRef(null);

  /* ----- derived numbers ----- */
  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);

  const totalIncomeAvailable = incomes.filter((i) => i.status === "available").reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalIncomeExpected = incomes.filter((i) => i.status === "expected").reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalIncomeAll = totalIncomeAvailable + totalIncomeExpected;

  const totalPlanned = allItems.reduce((s, i) => s + Number(i.estimated || 0), 0);
  const cashPaid = allItems.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.estimated || 0), 0);
  const totalDebt = allItems.filter((i) => i.status === "debt").reduce((s, i) => s + Number(i.estimated || 0), 0);
  const cashSurplus = totalIncomeAvailable - cashPaid;

  /* ----- incomes: add / edit / delete ----- */
  function addIncome() {
    if (!incomeDraft.name.trim()) return;
    setIncomes((prev) => [...prev, { id: uid(), name: incomeDraft.name.trim(), amount: Number(incomeDraft.amount) || 0, status: incomeDraft.status }]);
    setIncomeDraft({ name: "", amount: "", status: "available" });
  }
  function startEditIncome(inc) {
    setEditingIncomeId(inc.id);
    setEditIncomeDraft({ ...inc });
  }
  function saveEditIncome() {
    setIncomes((prev) => prev.map((i) => (i.id === editingIncomeId ? { ...editIncomeDraft, amount: Number(editIncomeDraft.amount) || 0 } : i)));
    setEditingIncomeId(null);
    setEditIncomeDraft(null);
  }
  function deleteIncome(id) {
    if (!window.confirm("حذف هذا المصدر نهائياً؟")) return;
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  }
  function toggleIncomeStatus(id) {
    setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, status: i.status === "available" ? "expected" : "available" } : i)));
  }

  /* ----- categories ----- */
  function addCategory() {
    if (!newCatName.trim()) return;
    setCategories((prev) => [...prev, { id: uid(), name: newCatName.trim(), note: "", items: [] }]);
    setNewCatName("");
  }
  function startEditCat(cat) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
  }
  function saveEditCat() {
    setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, name: editCatName.trim() || c.name } : c)));
    setEditingCatId(null);
  }
  function deleteCategory(id) {
    if (!window.confirm("حذف هذا القسم وكل بنوده نهائياً؟")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }
  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ----- items ----- */
  function getDraft(catId) {
    return itemDrafts[catId] || { name: "", estimated: "", costType: "pending", creditor: "" };
  }
  function setDraft(catId, patch) {
    setItemDrafts((prev) => ({ ...prev, [catId]: { ...getDraft(catId), ...patch } }));
  }
  function addItem(catId) {
    const d = getDraft(catId);
    if (!d.name.trim()) return;
    const newItem = {
      id: uid(),
      name: d.name.trim(),
      estimated: Number(d.estimated) || 0,
      status: d.costType,
      creditor: d.costType === "debt" ? d.creditor.trim() : "",
      done: d.costType === "paid" || d.costType === "gift",
    };
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, items: [...c.items, newItem] } : c)));
    setItemDrafts((prev) => ({ ...prev, [catId]: { name: "", estimated: "", costType: "pending", creditor: "" } }));
  }
  function deleteItem(catId, itemId) {
    if (!window.confirm("حذف هذا البند نهائياً؟")) return;
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)));
  }
  function startEditItem(catId, item) {
    setEditingItem({ catId, itemId: item.id });
    setEditItemDraft({ ...item });
  }
  function saveEditItem() {
    const { catId, itemId } = editingItem;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...editItemDraft, estimated: Number(editItemDraft.estimated) || 0 } : i)) }
          : c
      )
    );
    setEditingItem(null);
    setEditItemDraft(null);
  }
  function setItemStatus(catId, itemId, status) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.id !== itemId) return i;
                let creditor = i.creditor;
                if (status === "debt") {
                  creditor = window.prompt("اسم الدائن (اختياري):", i.creditor || "") || i.creditor || "";
                } else {
                  creditor = "";
                }
                return { ...i, status, creditor, done: status === "paid" || status === "gift" ? true : i.done };
              }),
            }
          : c
      )
    );
  }
  function toggleDone(catId, itemId) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : c
      )
    );
  }

  /* ----- export / import / print ----- */
  function exportJSON() {
    const payload = { incomes, categories, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ميزانية-الزواج-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.incomes) || !Array.isArray(data.categories)) throw new Error("shape");
        setIncomes(data.incomes);
        setCategories(data.categories);
        setExpanded(new Set(data.categories.map((c) => c.id)));
      } catch {
        alert("تعذّرت قراءة الملف. تأكد أنه ملف JSON تم تصديره من هذا التطبيق.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div dir="rtl" className="min-h-screen w-full" style={{ background: C.bg, color: C.ink, fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: inherit; }
        input:focus, select:focus { outline: 2px solid ${C.tealSoft}; outline-offset: 1px; }
        ::selection { background: ${C.goldSoft}; }
        @media print {
          .no-print { display: none !important; }
          .cat-body.hidden { display: block !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* header */}
      <header className="px-5 sm:px-10 pt-8 pb-6 border-b" style={{ borderColor: C.line }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: C.teal }}>ميزانية الزواج وإكمال البيت</h1>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>دفتر متابعة موحّد للمداخيل والمصاريف — من الإسمنت إلى ليلة العرس</p>
          </div>
          <div className="no-print flex gap-2 flex-wrap">
            <button onClick={exportJSON} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-sm border" style={{ borderColor: C.lineStrong, color: C.ink }}>
              <Download size={15} /> تصدير JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-sm border" style={{ borderColor: C.lineStrong, color: C.ink }}>
              <Upload size={15} /> استيراد JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-sm text-white" style={{ background: C.teal }}>
              <Printer size={15} /> طباعة / PDF
            </button>
          </div>
        </div>
        <p className="no-print text-[11px] mt-3" style={{ color: C.inkSoft }}>
          ملاحظة: البيانات محفوظة في هذه الجلسة فقط داخل صفحة المحادثة. اضغط «تصدير JSON» قبل إغلاق الصفحة لحفظ نسختك، ثم «استيراد JSON» لاسترجاعها لاحقاً.
        </p>
      </header>

      {/* KPI ledger strip */}
      <div className="mx-5 sm:mx-10 mt-6 border rounded-sm overflow-x-auto" style={{ borderColor: C.line, background: C.panel }}>
        <div className="flex min-w-max">
          <KPI label="الميزانية الكلية" value={totalIncomeAll} sub="مجموع كل المداخيل" tone={C.teal} />
          <KPI label="المصاريف المخططة" value={totalPlanned} sub="مجموع كل البنود المقدرة" />
          <KPI label="المدفوع كاش" value={cashPaid} sub="ما دُفع فعلياً حتى الآن" tone={C.tealSoft} />
          <KPI label="الديون المستحقة" value={totalDebt} sub="بنود اشتُريت بالدين" tone={C.rust} />
          <KPI label="الفائض المتبقي" value={cashSurplus} sub="المداخيل المتوفرة − المدفوع كاش" tone={cashSurplus < 0 ? C.rust : C.gold} />
        </div>
      </div>

      <main className="px-5 sm:px-10 py-8 grid gap-8 lg:grid-cols-[340px_1fr] items-start">
        {/* incomes */}
        <section className="border rounded-sm" style={{ borderColor: C.line, background: C.panel }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.line }}>
            <Wallet size={17} style={{ color: C.teal }} />
            <h2 className="font-bold">مصادر الدخل والتمويل</h2>
          </div>
          <div className="divide-y" style={{ borderColor: C.line }}>
            {incomes.map((inc) =>
              editingIncomeId === inc.id ? (
                <div key={inc.id} className="p-3 flex flex-col gap-2" style={{ borderColor: C.line }}>
                  <input value={editIncomeDraft.name} onChange={(e) => setEditIncomeDraft({ ...editIncomeDraft, name: e.target.value })}
                    className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }} placeholder="اسم المصدر" />
                  <input type="number" value={editIncomeDraft.amount} onChange={(e) => setEditIncomeDraft({ ...editIncomeDraft, amount: e.target.value })}
                    className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }} placeholder="المبلغ" />
                  <select value={editIncomeDraft.status} onChange={(e) => setEditIncomeDraft({ ...editIncomeDraft, status: e.target.value })}
                    className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }}>
                    <option value="available">متوفر حالياً</option>
                    <option value="expected">متوقع تحصيله</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveEditIncome} className="flex items-center gap-1 text-sm px-2 py-1 rounded-sm text-white" style={{ background: C.teal }}><Check size={14} /> حفظ</button>
                    <button onClick={() => setEditingIncomeId(null)} className="flex items-center gap-1 text-sm px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}><X size={14} /> إلغاء</button>
                  </div>
                </div>
              ) : (
                <div key={inc.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inc.name}</p>
                    <p className="text-sm font-bold" style={{ color: C.teal }}>{fmt(inc.amount)}</p>
                    <button onClick={() => toggleIncomeStatus(inc.id)} className="no-print mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-sm"
                        style={{ background: inc.status === "available" ? "#E1EDE9" : C.graySoft, color: inc.status === "available" ? C.tealSoft : C.inkSoft }}>
                        {inc.status === "available" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {inc.status === "available" ? "متوفر حالياً" : "متوقع تحصيله"}
                      </span>
                    </button>
                  </div>
                  <div className="flex shrink-0">
                    <IconBtn onClick={() => startEditIncome(inc)} title="تعديل"><Pencil size={15} /></IconBtn>
                    <IconBtn onClick={() => deleteIncome(inc.id)} title="حذف" danger><Trash2 size={15} /></IconBtn>
                  </div>
                </div>
              )
            )}
            {incomes.length === 0 && <p className="p-4 text-sm" style={{ color: C.inkSoft }}>لا توجد مصادر دخل بعد.</p>}
          </div>
          <div className="no-print p-3 border-t flex flex-col gap-2" style={{ borderColor: C.line }}>
            <input value={incomeDraft.name} onChange={(e) => setIncomeDraft({ ...incomeDraft, name: e.target.value })}
              placeholder="اسم المصدر (مثال: بيع قطعة أرض)" className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }} />
            <div className="flex gap-2">
              <input type="number" value={incomeDraft.amount} onChange={(e) => setIncomeDraft({ ...incomeDraft, amount: e.target.value })}
                placeholder="المبلغ" className="border rounded-sm px-2 py-1.5 text-sm w-1/2" style={{ borderColor: C.lineStrong }} />
              <select value={incomeDraft.status} onChange={(e) => setIncomeDraft({ ...incomeDraft, status: e.target.value })}
                className="border rounded-sm px-2 py-1.5 text-sm w-1/2" style={{ borderColor: C.lineStrong }}>
                <option value="available">متوفر حالياً</option>
                <option value="expected">متوقع تحصيله</option>
              </select>
            </div>
            <button onClick={addIncome} className="flex items-center justify-center gap-1 text-sm px-2 py-2 rounded-sm text-white" style={{ background: C.teal }}>
              <Plus size={15} /> إضافة مصدر دخل
            </button>
          </div>
        </section>

        {/* expenses */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank size={17} style={{ color: C.teal }} />
            <h2 className="font-bold">الأقسام والمصاريف</h2>
          </div>

          <div className="flex flex-col gap-4">
            {categories.map((cat) => {
              const catTotal = cat.items.reduce((s, i) => s + Number(i.estimated || 0), 0);
              const isOpen = expanded.has(cat.id);
              return (
                <div key={cat.id} className="border rounded-sm" style={{ borderColor: C.line, background: C.panel }}>
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: C.line }}>
                    <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-2 min-w-0 text-right flex-1">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <div className="min-w-0">
                        {editingCatId === cat.id ? (
                          <input autoFocus value={editCatName} onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="border rounded-sm px-2 py-1 text-sm" style={{ borderColor: C.lineStrong }} />
                        ) : (
                          <p className="font-bold truncate">{cat.name}</p>
                        )}
                        {cat.note ? <p className="text-[11px] truncate" style={{ color: C.inkSoft }}>{cat.note}</p> : null}
                      </div>
                    </button>
                    <span className="text-sm font-bold shrink-0" style={{ color: C.teal }}>{fmt(catTotal)}</span>
                    <div className="no-print flex shrink-0">
                      {editingCatId === cat.id ? (
                        <>
                          <IconBtn onClick={saveEditCat} title="حفظ"><Check size={15} /></IconBtn>
                          <IconBtn onClick={() => setEditingCatId(null)} title="إلغاء"><X size={15} /></IconBtn>
                        </>
                      ) : (
                        <>
                          <IconBtn onClick={() => startEditCat(cat)} title="إعادة تسمية"><Pencil size={15} /></IconBtn>
                          <IconBtn onClick={() => deleteCategory(cat.id)} title="حذف القسم" danger><Trash2 size={15} /></IconBtn>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`cat-body ${isOpen ? "" : "hidden"}`}>
                    <div className="divide-y" style={{ borderColor: C.line }}>
                      {cat.items.map((item) => {
                        const editingThis = editingItem && editingItem.catId === cat.id && editingItem.itemId === item.id;
                        if (editingThis) {
                          return (
                            <div key={item.id} className="p-3 flex flex-col gap-2">
                              <input value={editItemDraft.name} onChange={(e) => setEditItemDraft({ ...editItemDraft, name: e.target.value })}
                                className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }} placeholder="اسم البند" />
                              <input type="number" value={editItemDraft.estimated} onChange={(e) => setEditItemDraft({ ...editItemDraft, estimated: e.target.value })}
                                className="border rounded-sm px-2 py-1.5 text-sm" style={{ borderColor: C.lineStrong }} placeholder="المبلغ المقدر" />
                              <div className="flex gap-2">
                                <button onClick={saveEditItem} className="flex items-center gap-1 text-sm px-2 py-1 rounded-sm text-white" style={{ background: C.teal }}><Check size={14} /> حفظ</button>
                                <button onClick={() => setEditingItem(null)} className="flex items-center gap-1 text-sm px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}><X size={14} /> إلغاء</button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={item.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <button onClick={() => toggleDone(cat.id, item.id)} className="no-print shrink-0" title="تحديد كمُنجز">
                              {item.done ? <CheckCircle2 size={19} style={{ color: C.tealSoft }} /> : <Circle size={19} style={{ color: C.lineStrong }} />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${item.done ? "line-through" : ""}`} style={{ color: item.done ? C.inkSoft : C.ink }}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-sm font-bold" style={{ color: C.teal }}>{fmt(item.estimated)}</span>
                                <StatusPill status={item.status} />
                                {item.status === "debt" && item.creditor ? (
                                  <span className="text-[11px]" style={{ color: C.inkSoft }}>(دين من: {item.creditor})</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="no-print flex flex-wrap gap-1 shrink-0">
                              <button onClick={() => setItemStatus(cat.id, item.id, "paid")} className="text-[11px] px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}>تم الدفع كاش</button>
                              <button onClick={() => setItemStatus(cat.id, item.id, "debt")} className="text-[11px] px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}>تم الشراء بالدين</button>
                              <button onClick={() => setItemStatus(cat.id, item.id, "gift")} className="text-[11px] px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}>هدية / كادو</button>
                              <button onClick={() => setItemStatus(cat.id, item.id, "support")} className="text-[11px] px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}>دعم عائلي</button>
                              <button onClick={() => setItemStatus(cat.id, item.id, "pending")} className="text-[11px] px-2 py-1 rounded-sm border" style={{ borderColor: C.lineStrong }}>قيد الانتظار</button>
                              <IconBtn onClick={() => startEditItem(cat.id, item)} title="تعديل"><Pencil size={14} /></IconBtn>
                              <IconBtn onClick={() => deleteItem(cat.id, item.id)} title="حذف" danger><Trash2 size={14} /></IconBtn>
                            </div>
                          </div>
                        );
                      })}
                      {cat.items.length === 0 && <p className="p-3 text-sm" style={{ color: C.inkSoft }}>لا توجد بنود في هذا القسم بعد.</p>}
                    </div>

                    <div className="no-print p-3 border-t flex flex-col sm:flex-row gap-2" style={{ borderColor: C.line }}>
                      <input value={getDraft(cat.id).name} onChange={(e) => setDraft(cat.id, { name: e.target.value })}
                        placeholder="اسم البند الجديد" className="border rounded-sm px-2 py-1.5 text-sm flex-1" style={{ borderColor: C.lineStrong }} />
                      <input type="number" value={getDraft(cat.id).estimated} onChange={(e) => setDraft(cat.id, { estimated: e.target.value })}
                        placeholder="المبلغ المقدر" className="border rounded-sm px-2 py-1.5 text-sm sm:w-32" style={{ borderColor: C.lineStrong }} />
                      <select value={getDraft(cat.id).costType} onChange={(e) => setDraft(cat.id, { costType: e.target.value })}
                        className="border rounded-sm px-2 py-1.5 text-sm sm:w-44" style={{ borderColor: C.lineStrong }}>
                        <option value="pending">قيد الانتظار</option>
                        <option value="paid">شراء مدفوع كاش</option>
                        <option value="debt">شراء بالدين</option>
                        <option value="gift">هدية / كادو بتكلفة 0</option>
                        <option value="support">دعم ومساهمة عائلية</option>
                      </select>
                      <button onClick={() => addItem(cat.id)} className="flex items-center justify-center gap-1 text-sm px-3 py-1.5 rounded-sm text-white shrink-0" style={{ background: C.teal }}>
                        <Plus size={15} /> إضافة بند
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="no-print flex gap-2 mt-4">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="اسم قسم جديد"
              className="border rounded-sm px-2 py-2 text-sm flex-1" style={{ borderColor: C.lineStrong, background: C.panel }} />
            <button onClick={addCategory} className="flex items-center gap-1 text-sm px-3 py-2 rounded-sm border" style={{ borderColor: C.lineStrong, color: C.teal }}>
              <Plus size={15} /> إضافة قسم
            </button>
          </div>
        </section>
      </main>

      <footer className="no-print px-5 sm:px-10 py-6 text-[11px] flex items-center gap-1.5" style={{ color: C.inkSoft }}>
        <HandCoins size={13} /> راقب صندوقك: الفائض هو المداخيل المتوفرة ناقص ما دُفع كاش فعلياً.
      </footer>
    </div>
  );
}