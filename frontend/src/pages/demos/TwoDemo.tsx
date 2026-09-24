import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Loader2,
  Search,
  BellRing,
  ChefHat,
  Receipt,
  Flame,
  Coffee,
  MapPin,
  Phone,
  Globe,
} from "lucide-react";

// =====================================
// دیتای تستی با پشتیبانی دو زبانه
// =====================================
const MOCK_VENUE = {
  name_fa: "کافه رستوران دمو",
  name_en: "Demo Cafe & Restaurant",
  about_us_fa:
    "زیبایی در سادگی است. ما با تمرکز بر کیفیت مواد اولیه، تجربه‌ای خالص و بی‌نظیر را به شما ارائه می‌دهیم.",
  about_us_en:
    "Beauty in simplicity. Focusing on high-quality ingredients, we offer a pure and unique experience.",
  address_fa: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  address_en: "No 1, Test Alley, Valiasr St, Tehran",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "emerald",
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "نوشیدنی گرم",
    name_en: "Hot Drinks",
    items: [
      {
        id: 101,
        name_fa: "لته آرت ویژه",
        name_en: "Special Art Latte",
        price: 85000,
        description_fa: "اسپرسو سینگل، شیر فوم گرفته شده",
        description_en: "Single espresso, steamed milk foam",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
      },
      {
        id: 102,
        name_fa: "کاپوچینو",
        name_en: "Cappuccino",
        price: 75000,
        description_fa: "اسپرسو دبل، فوم شیر کلاسیک",
        description_en: "Double espresso, classic milk foam",
        image:
          "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop",
      },
    ],
  },
];

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: Coffee },
];

// دیکشنری ترجمه‌های رابط کاربری
const TRANSLATIONS = {
  fa: {
    waiter: "احضار گارسون",
    waiter_alert: "درخواست گارسون ثبت شد",
    chef: "سفارش به آشپز",
    chef_alert: "سفارش به آشپز ثبت شد",
    search: "جستجو...",
    currency: "تومان",
    about: "درباره ما",
    checkout_btn: "مشاهده سبد خرید",
    checkout_title: "سفارش شما",
    total: "جمع کل",
    pay: "پرداخت",
    order_placed: "سفارش ثبت شد",
    receipt: "فیش",
    in_progress: "در حال انجام",
    close: "بستن پنجره",
    stage_new: "ثبت سفارش",
    stage_prep: "در حال آماده‌سازی",
    stage_ready: "آماده تحویل",
    not_found: "موردی یافت نشد.",
  },
  en: {
    waiter: "Call Waiter",
    waiter_alert: "Waiter requested",
    chef: "Chef Request",
    chef_alert: "Chef request sent",
    search: "Search...",
    currency: "Toman",
    about: "About Us",
    checkout_btn: "View Cart",
    checkout_title: "Your Order",
    total: "Total",
    pay: "Pay",
    order_placed: "Order Placed",
    receipt: "Receipt",
    in_progress: "In Progress",
    close: "Close Window",
    stage_new: "Order Placed",
    stage_prep: "Preparing",
    stage_ready: "Ready to serve",
    not_found: "No items found.",
  },
};

export const TwoDemo = () => {
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
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

  const formatPrice = (price: number) =>
    isFa ? price.toLocaleString("fa-IR") : price.toLocaleString("en-US");
  const toggleLang = () => setLang((prev) => (prev === "fa" ? "en" : "fa"));

  const handleFinalCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus("tracking");
      setCart([]);
      setCurrentStageIndex(0);
    }, 1500);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      orderStatus === "tracking" &&
      currentStageIndex < ORDER_STAGES.length - 1
    ) {
      timer = setTimeout(() => setCurrentStageIndex((prev) => prev + 1), 5000);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, currentStageIndex]);

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = isFa ? item.name_fa : item.name_en;
      return name.toLowerCase().includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-white flex justify-center font-sans text-slate-800"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white min-h-screen relative overflow-x-hidden pb-24 flex flex-col border-x border-slate-100">
        {/* دکمه تغییر زبان */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleLang}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 flex items-center gap-1.5 hover:bg-slate-100 transition-colors font-bold shadow-sm"
          >
            <Globe size={16} />{" "}
            <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
          </button>
        </div>

        {/* هدر مینیمال */}
        <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border border-slate-200 overflow-hidden mb-4 shadow-sm">
            <img src={MOCK_VENUE.logo} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
          </h1>
        </div>

        {/* دکمه‌های خدمات */}
        <div className="px-6 pb-6 flex gap-3 border-b border-slate-100">
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => alert(t.waiter_alert)}
              className="flex-1 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <BellRing size={20} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                {t.waiter}
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => alert(t.chef_alert)}
              className="flex-1 border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <ChefHat size={20} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        {/* جستجو */}
        <div className="px-6 py-4 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <div className="bg-slate-50 rounded-full flex items-center px-4 py-3 border border-slate-100 transition-colors focus-within:border-slate-300 focus-within:bg-white">
            <Search className="text-slate-400 shrink-0" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${isFa ? "pr-3" : "pl-3"} text-sm font-bold text-slate-800`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* تب‌های دسته‌بندی */}
        <div className="sticky top-[76px] z-40 bg-white border-b border-slate-100 py-3 shadow-sm">
          <div
            className="flex overflow-x-auto px-6 gap-6 hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 pb-2 text-sm font-black transition-all border-b-2 ${activeCategory === cat.id ? "text-slate-900 border-slate-900" : "text-slate-400 border-transparent hover:text-slate-600"}`}
              >
                {isFa ? cat.name_fa : cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* محصولات */}
        <div className="flex-1 p-6 space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 opacity-50 text-slate-500 font-bold">
              {t.not_found}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-base font-black text-slate-800 mb-4">
                  {isFa ? category.name_fa : category.name_en}
                </h2>
                <div className="space-y-6">
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                      >
                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-50">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">
                              {isFa ? item.name_fa : item.name_en}
                            </h3>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {isFa ? item.description_fa : item.description_en}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="font-bold text-sm">
                              {formatPrice(item.price)}{" "}
                              <span className="text-[10px] text-slate-400">
                                {t.currency}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {qty > 0 && (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="font-black text-sm w-4 text-center">
                                    {qty}
                                  </span>
                                </>
                              )}
                              <button
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                                style={{ backgroundColor: brandColor }}
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
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

        {/* درباره ما */}
        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
          <h3 className="font-black text-base mb-3">{t.about}</h3>
          <p className="text-xs text-slate-500 mb-6 px-6 leading-loose">
            {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
          </p>
          <div className="space-y-4 text-xs font-bold text-slate-600 flex flex-col items-center">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <MapPin size={16} className="text-slate-400" />{" "}
              {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
            </div>
            <div
              className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
              dir="ltr"
            >
              <Phone size={16} className="text-slate-400" /> {MOCK_VENUE.phone}
            </div>
          </div>
        </div>

        {/* سبد خرید شناور */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[350px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white px-6 py-4 rounded-full shadow-xl flex items-center justify-between active:scale-95 transition-transform"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-black">
                  {cartItemCount}
                </div>
                <span className="font-bold text-sm">{t.checkout_btn}</span>
              </div>
              <div className="font-black text-sm flex items-center gap-2">
                {formatPrice(cartTotal)}{" "}
                {isFa ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>
          </div>
        )}

        {/* مودال پیگیری/تکمیل */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" ? (
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <h3 className="font-black text-xl">{t.checkout_title}</h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={24} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-4 mb-8 flex-1 overflow-y-auto hide-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                      >
                        <span className="font-bold text-slate-800">
                          <span
                            className="text-slate-400"
                            className={
                              isFa
                                ? "ml-2 text-slate-400"
                                : "mr-2 text-slate-400"
                            }
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold text-slate-600">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4">
                      <span className="font-bold text-slate-500">
                        {t.total}
                      </span>
                      <span className="font-black text-lg">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-[10px] font-normal">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="shrink-0 w-full text-white py-4 rounded-full font-bold flex justify-center active:scale-95 transition-transform"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      t.pay
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-white flex flex-col items-center text-center rounded-t-[32px] sm:rounded-[32px]">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-slate-50 border border-slate-100 text-slate-700">
                    <ShoppingBag size={28} />
                  </div>
                  <h2 className="text-xl font-black mb-1 text-slate-800">
                    {t.order_placed}
                  </h2>
                  <p className="text-xs text-slate-500 mb-10 font-mono bg-slate-50 px-3 py-1 rounded-md">
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full relative mb-12 text-right px-4"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-7" : "left-7"} top-4 bottom-4 w-px bg-slate-200 z-0`}
                    ></div>
                    <div className="space-y-8 relative z-10">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isCompleted = idx < currentStageIndex;
                        const stageLabel =
                          idx === 0
                            ? t.stage_new
                            : idx === 1
                              ? t.stage_prep
                              : t.stage_ready;

                        return (
                          <div
                            key={stage.id}
                            className={`flex items-center gap-6 transition-all duration-500 ${idx > currentStageIndex ? "opacity-30" : ""}`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-[3px] bg-white z-10 transition-colors ${isActive || isCompleted ? "border-slate-800" : "border-slate-300"}`}
                            >
                              {isCompleted && (
                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-bold text-sm ${isActive || isCompleted ? "text-slate-900" : "text-slate-500"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>{" "}
                                  {t.in_progress}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="w-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-bold py-4 rounded-full"
                  >
                    {t.close}
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

export default TwoDemo;
