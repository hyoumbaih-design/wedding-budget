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

                  <div className="space-y-3 mb-4">
                    {(cat.items || []).map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                          item.bought ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div>
                          <div className={`text-base font-semibold ${item.bought ? "line-through text-gray-500" : "text-gray-900"}`}>
                            {item.name}
                          </div>
                          <div className="text-xs font-bold text-gray-600 mt-0.5">
                            المبلغ: {Number(item.price || 0).toLocaleString()} دج
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* زر تبديل حالة الشراء بشكل واضح وبارز */}
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
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              item.bought
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            }`}
                          >
                            {item.bought ? (
                              <>
                                <Check size={14} className="stroke-[3]" /> تم الشراء ✓
                              </>
                            ) : (
                              <>
                                🛒 تحديد كـ "تم الشراء"
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const updated = {
                                ...data,
                                weddingShoppingCategories: data.weddingShoppingCategories.map(c => c.id === cat.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c)
                              };
                              saveToCloud(updated);
                            }}
                            className="text-gray-400 hover:text-rose-600 p-1"
                            title="حذف البند"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="اسم المستلزم (مثال: عطر، قميص أبيض، صحون تقديم...)"
                      value={newWItemName[cat.id] || ""}
                      onChange={(e) => setNewWItemName({ ...newWItemName, [cat.id]: e.target.value })}
                      className="flex-1 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
                    />
                    <input
                      type="number"
                      placeholder="المبلغ التقديري (دج)"
                      value={newWItemPrice[cat.id] || ""}
                      onChange={(e) => setNewWItemPrice({ ...newWItemPrice, [cat.id]: e.target.value })}
                      className="w-full sm:w-36 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-black"
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
                      className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black whitespace-nowrap"
                    >
                      + إضافة بند
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}