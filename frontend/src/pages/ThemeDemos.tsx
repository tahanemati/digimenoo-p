import { useState } from "react";
import {
  Store,
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  CheckCircle2,
  X,
  Loader2,
  MapPin,
  Phone,
  Search,
  AtSign,
} from "lucide-react";

// =====================================
// دیتای تستی مشترک برای جلوگیری از تداخل متغیرها
// =====================================
const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "نوشیدنی گرم",
    items: [
      {
        id: 101,
        name: "لته آرت ویژه",
        price: 85000,
        description: "اسپرسو سینگل، شیر فوم گرفته شده",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
      },
      {
        id: 102,
        name: "کاپوچینو",
        price: 75000,
        description: "اسپرسو دبل، فوم شیر کلاسیک",
        image:
          "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    id: 2,
    name: "غذای اصلی",
    items: [
      {
        id: 201,
        name: "پاستا آلفردو",
        price: 220000,
        description: "پنه، سس آلفردو، مرغ گریل شده، قارچ",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
      },
    ],
  },
];

const LOGO_URL =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop";

// =====================================
// 1. قالب مدرن دمو (Modern Demo)
// =====================================
export const ModernDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "success"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);

  const brandColor = "#10b981"; // Emerald

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const getItemQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

  const addToCart = (product: any) =>
    setCart((p) =>
      p.find((i) => i.id === product.id)
        ? p.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...p, { ...product, qty: 1 }],
    );
  const removeFromCart = (id: number) =>
    setCart((p) =>
      p.find((i) => i.id === id)?.qty > 1
        ? p.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        : p.filter((i) => i.id !== id),
    );

  const handleFinalCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus("success");
      setCart([]);
    }, 1500);
  };

  // 🔴 فیلتر جستجوی کاملاً ضدکِرَش (Crash-Proof)
  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const n = (item.name || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return n.includes(q) || d.includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center font-sans text-slate-800"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-x-hidden pb-24 flex flex-col">
        <div
          className="relative h-56 w-full overflow-hidden transition-colors duration-500"
          style={{ backgroundColor: brandColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20"></div>
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-slate-50 -mt-10 rounded-t-[40px] relative z-10 pt-14 pb-6 px-4 flex flex-col items-center">
          <div className="absolute -top-14 w-28 h-28 rounded-[32px] border-4 border-slate-50 bg-white overflow-hidden shadow-xl flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            رستوران مدرن دمو
          </h1>
          <p
            className="text-sm font-bold mt-2 opacity-80"
            style={{ color: brandColor }}
          >
            تجربه طعم‌های ماندگار در محیطی مدرن.
          </p>
        </div>

        <div className="px-5 mb-4 sticky top-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white flex items-center px-4 py-3.5">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-slate-800 font-bold text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="sticky top-[88px] z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 py-3 mb-2">
          <div
            className="flex overflow-x-auto px-5 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-2xl font-bold border transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#fff",
                  color: activeCategory === cat.id ? "#fff" : "#64748b",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#e2e8f0",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-10 pb-10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="font-bold">محصولی یافت نشد.</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-xl font-black text-slate-800 mb-5 pr-4 relative flex items-center">
                  <span
                    className="absolute right-0 w-2 h-8 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  ></span>
                  {category.name}
                </h2>
                <div className="space-y-4">
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-[24px] p-3 flex gap-4 shadow-sm border border-slate-100"
                      >
                        <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1.5">
                          <div>
                            <h3 className="font-black text-slate-900 mb-1.5">
                              {item.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex justify-between items-end mt-3">
                            <div
                              className="font-black text-lg tracking-tight"
                              style={{ color: brandColor }}
                            >
                              {(item.price || 0).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] text-slate-400">
                                تومان
                              </span>
                            </div>
                            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center font-black text-sm">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto bg-white rounded-t-[40px] pt-10 pb-24 px-6 border-t border-slate-100 relative overflow-hidden">
          <div
            className="absolute -bottom-20 -right-20 w-64 h-64 opacity-5 rounded-full"
            style={{ backgroundColor: brandColor }}
          ></div>
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-black text-slate-800 mb-4">
              تماس با ما
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <MapPin size={20} style={{ color: brandColor }} />
                <p className="text-sm font-bold text-slate-600">
                  تهران، دمو خیابان اول
                </p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <Phone size={20} style={{ color: brandColor }} />
                <p className="text-sm font-bold text-slate-600" dir="ltr">
                  021-12345678
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* سبد خرید */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-2xl shadow-xl flex items-center justify-between transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                </div>
                <span className="font-bold text-sm">تکمیل سفارش</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {cartTotal.toLocaleString("fa-IR")}
                </span>
                <ChevronLeft size={20} />
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-6">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">تکمیل سفارش (تستی)</h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-bold">
                          x{item.qty} {item.name}
                        </span>
                        <span>
                          {((item.price || 0) * item.qty).toLocaleString(
                            "fa-IR",
                          )}{" "}
                          تومان
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-2xl font-black flex justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "ثبت سفارش دمو"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={64}
                    className="text-emerald-500 mx-auto mb-4"
                  />
                  <h2 className="text-2xl font-black mb-2">
                    سفارش تستی ثبت شد!
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-slate-500 font-bold bg-slate-100 px-6 py-2 rounded-xl"
                  >
                    بازگشت به منو
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// 2. قالب مینیمال دمو (Minimal Demo)
// =====================================
export const MinimalDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "success"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);

  const brandColor = "#f43f5e"; // Rose

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const getItemQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

  const addToCart = (product: any) =>
    setCart((p) =>
      p.find((i) => i.id === product.id)
        ? p.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...p, { ...product, qty: 1 }],
    );
  const removeFromCart = (id: number) =>
    setCart((p) =>
      p.find((i) => i.id === id)?.qty > 1
        ? p.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        : p.filter((i) => i.id !== id),
    );

  const handleFinalCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus("success");
      setCart([]);
    }, 1500);
  };

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const n = (item.name || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return n.includes(q) || d.includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-[#fafafa] flex justify-center font-sans text-zinc-900"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#fafafa] min-h-screen relative overflow-x-hidden selection:bg-zinc-200 flex flex-col">
        <div className="pt-20 pb-10 px-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-8 shadow-sm border border-zinc-200">
            <img
              src={LOGO_URL}
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">
            کافه مینیمال
          </h1>
          <p
            className="text-[11px] uppercase tracking-[0.3em] font-bold"
            style={{ color: brandColor }}
          >
            Aesthetics of Taste
          </p>
        </div>

        <div className="px-8 mb-8 sticky top-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-zinc-200 flex items-center px-5 py-3">
            <Search className="text-zinc-400 shrink-0" size={18} />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-zinc-800 font-bold text-sm"
            />
          </div>
        </div>

        <div className="sticky top-[84px] z-40 px-6 mb-12 flex justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-2xl border border-zinc-200/80 shadow-sm rounded-full p-1.5 flex gap-1 pointer-events-auto overflow-x-auto hide-scrollbar">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-5 py-2.5 rounded-full text-[13px] font-bold transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "transparent",
                  color: activeCategory === cat.id ? "#fff" : "#a1a1aa",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-8 space-y-24 pb-12">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <h2
                className="text-3xl font-black mb-10 tracking-tight"
                style={{ color: brandColor }}
              >
                {category.name}.
              </h2>
              <div className="flex flex-col gap-12">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div key={item.id} className="flex gap-6 items-start group">
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-baseline mb-2 gap-4">
                          <h3 className="font-bold text-lg text-zinc-900">
                            {item.name}
                          </h3>
                          <div className="flex-1 border-b border-dotted border-zinc-300 mx-2 opacity-30"></div>
                          <div className="flex items-center gap-3">
                            <div
                              className="font-bold text-lg font-mono tracking-tighter"
                              style={{ color: brandColor }}
                            >
                              {((item.price || 0) / 1000).toLocaleString(
                                "fa-IR",
                              )}
                              <span className="text-[10px] font-sans text-zinc-400 mr-1 font-normal">
                                هزار
                              </span>
                            </div>
                            {qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-1">
                                <button onClick={() => removeFromCart(item.id)}>
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-mono font-black">
                                  {qty}
                                </span>
                                <button onClick={() => addToCart(item)}>
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] text-zinc-500 leading-relaxed max-w-[85%]">
                          {item.description}
                        </p>
                      </div>
                      <div className="w-20 h-28 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/50">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-full shadow-xl flex items-center justify-between"
              style={{ backgroundColor: "#18181B" }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <span className="font-bold text-sm">
                  {cartItemCount} انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {cartTotal.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col p-8">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl tracking-tighter">
                      سفارش شما.
                    </h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={24} />
                    </button>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-full font-black text-lg"
                    style={{ backgroundColor: "#18181B" }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin mx-auto" />
                    ) : (
                      "ثبت دمو"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={80}
                    className="mx-auto mb-6"
                    style={{ color: brandColor }}
                  />
                  <h2 className="text-3xl font-black tracking-tighter mb-2">
                    ثبت شد.
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-zinc-500 font-bold bg-zinc-100 px-8 py-3 rounded-full"
                  >
                    بستن
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// 3. قالب کلاسیک دمو (Classic Demo)
// =====================================
export const ClassicDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "success"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);

  const brandColor = "#f59e0b"; // Amber

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const getItemQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

  const addToCart = (product: any) =>
    setCart((p) =>
      p.find((i) => i.id === product.id)
        ? p.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...p, { ...product, qty: 1 }],
    );
  const removeFromCart = (id: number) =>
    setCart((p) =>
      p.find((i) => i.id === id)?.qty > 1
        ? p.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        : p.filter((i) => i.id !== id),
    );

  const handleFinalCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus("success");
      setCart([]);
    }, 1500);
  };

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const n = (item.name || "").toLowerCase();
      const d = (item.description || "").toLowerCase();
      return n.includes(q) || d.includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-[#f5f3ef] flex justify-center font-sans text-[#2c2c2c]"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#faf9f6] min-h-screen shadow-2xl relative overflow-x-hidden border-x border-[#e8e4d9] pb-24 flex flex-col">
        <div className="pt-12 pb-8 px-6 flex flex-col items-center text-center relative">
          <div
            className="absolute top-0 left-0 right-0 h-32 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#2c2c2c 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
          <div
            className="relative z-10 w-24 h-24 p-1 rounded-full border-2 border-double mb-4 bg-[#faf9f6]"
            style={{ borderColor: brandColor }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex justify-center items-center">
              <img src={LOGO_URL} className="w-full h-full object-cover" />
            </div>
          </div>
          <h1
            className="text-3xl font-black text-[#1a1a1a] mb-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            رستوران سنتی دمو
          </h1>
          <div className="flex items-center justify-center gap-3 w-full max-w-[200px]">
            <div className="flex-1 h-px bg-[#e8e4d9]"></div>
            <div
              className="w-1.5 h-1.5 rotate-45"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex-1 h-px bg-[#e8e4d9]"></div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-[#faf9f6] border border-[#d4d0c5] flex items-center px-4 py-3 rounded-lg shadow-inner">
            <Search className="text-[#a3a3a3] shrink-0" size={18} />
            <input
              type="text"
              placeholder="جستجو در منو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-[#1a1a1a] font-medium text-sm"
            />
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-sm border-y border-[#e8e4d9] py-3 shadow-sm mb-6">
          <div
            className="flex overflow-x-auto px-4 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold border transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#ffffff",
                  color: activeCategory === cat.id ? "#ffffff" : "#737373",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#e8e4d9",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 space-y-10 pb-12">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-[#1a1a1a]">
                  {category.name}
                </h2>
                <div className="flex-1 border-b border-dashed border-[#d4d0c5]"></div>
              </div>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-3 flex gap-4 shadow-sm border border-[#e8e4d9]"
                    >
                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#f5f3ef] border border-[#e8e4d9] p-0.5">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-[#1a1a1a] text-[15px] mb-1.5">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#737373] line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div
                            className="font-bold text-base px-3 py-1 rounded-md border border-[#e8e4d9]"
                            style={{ color: brandColor }}
                          >
                            {(item.price || 0).toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-[#a3a3a3]">
                              تومان
                            </span>
                          </div>
                          <div className="flex items-center">
                            {qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-[#faf9f6] border border-[#e8e4d9] rounded-md p-1">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 flex items-center justify-center"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-5 text-center font-bold text-sm">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 flex items-center justify-center text-white rounded"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 rounded-md border border-[#e8e4d9] bg-[#faf9f6] flex items-center justify-center"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-2xl shadow-xl flex items-center justify-between"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <span className="font-bold text-sm">
                  {cartItemCount} انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {cartTotal.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] flex flex-col p-6 border-4 border-double border-[#e8e4d9]">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3
                      className="font-black text-lg"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      تکمیل سفارش دمو
                    </h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={20} />
                    </button>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-xl font-bold flex justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "ثبت نهایی سفارش"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={64}
                    className="mx-auto mb-4"
                    style={{ color: brandColor }}
                  />
                  <h2
                    className="text-2xl font-black mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    سفارش ثبت شد
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-slate-600 font-bold border border-[#d4d0c5] bg-[#faf9f6] px-6 py-2 rounded-xl"
                  >
                    بازگشت
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
