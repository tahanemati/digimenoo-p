import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
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
  Home,
  ShoppingBag,
  Info,
  Globe, // 🔴 آیکون زبان اضافه شد
} from "lucide-react";

// =====================================
// دیتای تستی مشترک (دو زبانه)
// =====================================
const MOCK_VENUE = {
  name_fa: "رستوران سایدبار دمو",
  name_en: "Sidebar Demo Restaurant",
  about_us_fa:
    "طراحی متفاوت با سایدبار کناری برای تجربه‌ای شبیه به اپلیکیشن‌های موبایل. ترکیبی از سادگی و کارایی در سفارش غذا.",
  about_us_en:
    "A unique sidebar design offering a mobile app-like experience. The perfect blend of simplicity and efficiency in food ordering.",
  address_fa: "تهران، بلوار مینیمال، پلاک ۴",
  address_en: "No 4, Minimal Blvd, Tehran",
  phone: "021-87654321",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "indigo",
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
        description_en: "Single espresso, steamed milk",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
        is_available: true,
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
        is_available: true,
      },
    ],
  },
  {
    id: 2,
    name_fa: "غذای اصلی",
    name_en: "Main Course",
    items: [
      {
        id: 201,
        name_fa: "پاستا آلفردو",
        name_en: "Alfredo Pasta",
        price: 220000,
        description_fa: "پنه، سس آلفردو، مرغ گریل شده",
        description_en: "Penne, Alfredo sauce, grilled chicken",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
        is_available: true,
      },
      {
        id: 202,
        name_fa: "برگر کلاسیک",
        name_en: "Classic Burger",
        price: 180000,
        description_fa: "گوشت ۱۰۰٪ گوساله، پنیر گودا، کاهو",
        description_en: "100% Beef, Gouda cheese, lettuce",
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
        is_available: true,
      },
    ],
  },
];

const HEX_COLORS: Record<string, string> = {
  emerald: "#10b981",
  rose: "#e11d48",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#a855f7",
  orange: "#f97316",
  indigo: "#4f46e5",
};

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: Coffee },
];

// دیکشنری ترجمه‌های رابط کاربری
const TRANSLATIONS = {
  fa: {
    home: "خانه",
    search: "جستجو",
    waiter: "گارسون",
    chef: "آشپز",
    search_placeholder: "نام غذا را بنویسید...",
    not_found: "موردی یافت نشد.",
    select_order: "سفارش خود را انتخاب کنید.",
    about_us: "درباره ما",
    checkout: "تکمیل سفارش",
    total: "جمع کل قابل پرداخت:",
    pay: "پرداخت و ثبت نهایی",
    order_placed: "سفارش با موفقیت ثبت شد",
    receipt: "فیش شماره",
    in_progress: "در حال انجام...",
    close: "بستن و بازگشت به منو",
    currency: "تومان",
    stage_new: "ثبت سفارش",
    stage_prep: "در حال پخت",
    stage_ready: "آماده تحویل",
    waiter_alert: "درخواست گارسون ثبت شد",
    chef_alert: "سفارش به آشپز ثبت شد",
  },
  en: {
    home: "Home",
    search: "Search",
    waiter: "Waiter",
    chef: "Chef",
    search_placeholder: "Search for food...",
    not_found: "No items found.",
    select_order: "Please select your order.",
    about_us: "About Us",
    checkout: "Checkout",
    total: "Total Amount:",
    pay: "Pay & Submit",
    order_placed: "Order Placed Successfully",
    receipt: "Receipt No",
    in_progress: "In progress...",
    close: "Close & Return to Menu",
    currency: "Toman",
    stage_new: "Order Placed",
    stage_prep: "Cooking",
    stage_ready: "Ready to Serve",
    waiter_alert: "Waiter requested successfully",
    chef_alert: "Chef request submitted",
  },
};

export const SidebarDemo = () => {
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
  const brandColor = HEX_COLORS[MOCK_VENUE.brand_color] || HEX_COLORS.indigo;

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

  const toggleLang = () => setLang((prev) => (prev === "fa" ? "en" : "fa"));
  const formatPrice = (price: number) =>
    isFa ? price.toLocaleString("fa-IR") : price.toLocaleString("en-US");

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
    items: (cat.items || []).filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const name = isFa ? item.name_fa : item.name_en;
      const desc = isFa ? item.description_fa : item.description_en;
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="h-screen w-full bg-[#f8fafc] flex justify-center font-sans text-slate-800 overflow-hidden"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-[#f8fafc] h-full shadow-2xl relative flex overflow-hidden border-x border-slate-200">
        {/* دکمه تغییر زبان */}
        <div className={`absolute top-4 ${isFa ? "left-6" : "right-6"} z-50`}>
          <button
            onClick={toggleLang}
            className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition-colors font-bold shadow-sm"
          >
            <Globe size={16} />{" "}
            <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
          </button>
        </div>

        {/* ======================================= */}
        {/* سایدبار (Navigation) */}
        {/* ======================================= */}
        <aside className="w-16 sm:w-20 h-full bg-white border-x border-slate-200 flex flex-col items-center py-6 z-50 shrink-0 shadow-[rgba(0,0,0,0.02)_0px_0px_15px]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] overflow-hidden shadow-sm border border-slate-100 mb-6 shrink-0">
            <img src={MOCK_VENUE.logo} className="w-full h-full object-cover" />
          </div>

          <div className="flex flex-col gap-4 w-full px-2 flex-1 overflow-y-auto hide-scrollbar">
            <button
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery("");
                // window.scrollTo(0, 0); // Not optimal for container scroll
                const mainArea = document.getElementById("main-scroll-area");
                if (mainArea) mainArea.scrollTo(0, 0);
              }}
              className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-800 transition-all hover:bg-slate-50 group relative shrink-0"
            >
              <Home
                size={22}
                style={{
                  color:
                    !isSearchActive && orderStatus === "shopping"
                      ? brandColor
                      : undefined,
                }}
              />
              <span className="text-[9px] font-bold">{t.home}</span>
              {!isSearchActive && orderStatus === "shopping" && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 ${isFa ? "left-0 rounded-r-full" : "right-0 rounded-l-full"}`}
                  style={{ backgroundColor: brandColor }}
                ></div>
              )}
            </button>

            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-800 transition-all hover:bg-slate-50 relative shrink-0"
            >
              <Search
                size={22}
                style={{ color: isSearchActive ? brandColor : undefined }}
              />
              <span className="text-[9px] font-bold">{t.search}</span>
              {isSearchActive && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-6 ${isFa ? "left-0 rounded-r-full" : "right-0 rounded-l-full"}`}
                  style={{ backgroundColor: brandColor }}
                ></div>
              )}
            </button>

            {MOCK_VENUE.is_waiter_enabled && (
              <button
                onClick={() => alert(t.waiter_alert)}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-800 transition-all hover:bg-slate-50 shrink-0"
              >
                <BellRing size={22} />
                <span className="text-[9px] font-bold text-center">
                  {t.waiter}
                </span>
              </button>
            )}

            {MOCK_VENUE.is_chef_request_enabled && (
              <button
                onClick={() => alert(t.chef_alert)}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-800 transition-all hover:bg-slate-50 shrink-0"
              >
                <ChefHat size={22} />
                <span className="text-[9px] font-bold text-center">
                  {t.chef}
                </span>
              </button>
            )}

            {/* سبد خرید در پایین‌ترین قسمت سایدبار */}
            <div className="mt-auto w-full pt-4">
              <button
                onClick={() => cartItemCount > 0 && setOrderStatus("checkout")}
                className={`w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl transition-all relative shrink-0 ${cartItemCount > 0 ? "text-white shadow-lg" : "text-slate-400 bg-slate-50"}`}
                style={{
                  backgroundColor: cartItemCount > 0 ? brandColor : undefined,
                }}
              >
                <ShoppingBag size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-slate-900 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm border border-slate-100">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================= */}
        {/* محتوای اصلی صفحه (Main Content) */}
        {/* ======================================= */}
        <main
          id="main-scroll-area"
          className="flex-1 h-full overflow-y-auto relative hide-scrollbar pb-10"
        >
          <div className="px-6 pt-8 pb-4">
            <h1 className="text-2xl font-black text-slate-800 mb-1 leading-tight">
              {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
            </h1>
            <p className="text-xs font-bold text-slate-400">{t.select_order}</p>
          </div>

          <div
            className={`px-6 overflow-hidden transition-all duration-300 ${isSearchActive ? "max-h-20 mb-4 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm flex items-center">
              <div className="px-3 text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                autoFocus={isSearchActive}
                placeholder={t.search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm font-bold text-slate-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-2 text-slate-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="sticky top-0 z-30 bg-[#f8fafc]/90 backdrop-blur-md pb-4 pt-2">
            <div
              className="flex overflow-x-auto px-6 gap-2 hide-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-black transition-all border"
                  style={{
                    backgroundColor:
                      activeCategory === cat.id ? brandColor : "#fff",
                    color: activeCategory === cat.id ? "#fff" : "#64748b",
                    borderColor:
                      activeCategory === cat.id ? brandColor : "#e2e8f0",
                  }}
                >
                  {isFa ? cat.name_fa : cat.name_en}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 space-y-8 mt-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-10 opacity-50 font-bold text-sm text-slate-500">
                {t.not_found}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id}>
                  <h2 className="text-base font-black text-slate-800 mb-4">
                    {isFa ? category.name_fa : category.name_en}
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {category.items.map((item) => {
                      const qty = getItemQty(item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-3xl p-3 flex gap-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                        >
                          <div className="w-24 h-24 shrink-0 rounded-[20px] overflow-hidden bg-slate-50">
                            <img
                              src={item.image}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-center py-1 pr-1">
                            <div>
                              <h3 className="font-black text-slate-800 text-sm mb-1 leading-tight">
                                {isFa ? item.name_fa : item.name_en}
                              </h3>
                              <p className="text-[11px] font-bold text-slate-400 line-clamp-1 leading-relaxed">
                                {isFa
                                  ? item.description_fa
                                  : item.description_en}
                              </p>
                            </div>
                            <div className="flex justify-between items-end mt-4">
                              <div
                                className="font-black text-[15px]"
                                style={{ color: brandColor }}
                              >
                                {formatPrice(item.price)}{" "}
                                <span className="text-[9px] text-slate-400 font-bold">
                                  {t.currency}
                                </span>
                              </div>

                              <div className="flex items-center">
                                {qty > 0 ? (
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-1">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 flex items-center justify-center text-slate-600 bg-white rounded-lg shadow-sm border border-slate-100"
                                    >
                                      <Minus size={14} strokeWidth={2.5} />
                                    </button>
                                    <span className="w-4 text-center font-black text-sm">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 flex items-center justify-center text-white rounded-lg shadow-sm"
                                      style={{ backgroundColor: brandColor }}
                                    >
                                      <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={18} strokeWidth={2.5} />
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

          {/* درباره ما */}
          <div className="mt-10 mx-6 mb-10 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div
              className={`absolute top-0 ${isFa ? "right-0 rounded-bl-full" : "left-0 rounded-br-full"} w-20 h-20 bg-slate-50 -z-0`}
            ></div>
            <div className="relative z-10">
              <h3 className="font-black text-slate-800 text-sm mb-2">
                {t.about_us}
              </h3>
              <p className="text-[11px] font-bold text-slate-500 leading-loose mb-5">
                {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 py-2 rounded-xl">
                  <MapPin size={14} style={{ color: brandColor }} />{" "}
                  {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
                </div>
                <div
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 py-2 rounded-xl"
                  dir="ltr"
                >
                  <Phone size={14} style={{ color: brandColor }} />{" "}
                  {MOCK_VENUE.phone}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ======================================= */}
        {/* مودال‌های تسویه و پیگیری */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-white w-full h-[85%] rounded-t-[32px] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-lg text-slate-800">
                      {t.checkout}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-slate-100 text-slate-500 p-2 rounded-full hover:bg-slate-200"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50 rounded-[24px] p-5 border border-slate-100 mb-6 hide-scrollbar">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-slate-200 border-dashed pb-3 mb-3 last:border-0 last:mb-0 last:pb-0"
                      >
                        <span className="font-black text-slate-800">
                          <span
                            style={{ color: brandColor }}
                            className={isFa ? "ml-2" : "mr-2"}
                          >
                            x{item.qty}
                          </span>{" "}
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold text-slate-600">
                          {formatPrice(item.price * item.qty)} {t.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <span className="font-black text-slate-500">
                        {t.total}
                      </span>
                      <span className="font-black text-xl text-slate-900">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-xs font-bold text-slate-500">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-white py-4 rounded-2xl font-black flex justify-center items-center shadow-lg active:scale-95 transition-transform"
                      style={{ backgroundColor: brandColor }}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        t.pay
                      )}
                    </button>
                  </div>
                </div>
              )}

              {orderStatus === "tracking" && (
                <div className="flex flex-col h-full items-center text-center pt-8">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                    }}
                  >
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-2">
                    {t.order_placed}
                  </h2>
                  <p
                    className="text-xs font-bold text-slate-500 mb-8 bg-slate-100 px-4 py-1.5 rounded-full"
                    dir="ltr"
                  >
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full bg-slate-50 rounded-[28px] p-6 border border-slate-100 relative mb-auto text-right"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-9" : "left-9"} top-10 bottom-10 w-1 bg-slate-200 rounded-full z-0`}
                    ></div>
                    <div className="space-y-8 relative z-10">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isCompleted = idx < currentStageIndex;
                        const isPending = idx > currentStageIndex;
                        const stageLabel =
                          idx === 0
                            ? t.stage_new
                            : idx === 1
                              ? t.stage_prep
                              : t.stage_ready;

                        return (
                          <div
                            key={stage.id}
                            className={`flex items-center gap-4 transition-all duration-500 ${isPending ? "opacity-40 grayscale" : ""}`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors bg-white`}
                              style={{
                                borderColor:
                                  isActive || isCompleted
                                    ? brandColor
                                    : "#e2e8f0",
                                color:
                                  isActive || isCompleted
                                    ? brandColor
                                    : "#94a3b8",
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={24} strokeWidth={3} />
                              ) : (
                                <stage.icon size={22} />
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-black text-sm mb-1 ${isActive ? "text-slate-800" : isCompleted ? "text-slate-600" : "text-slate-400"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: brandColor }}
                                  ></span>{" "}
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
                    className="w-full text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 py-4 rounded-2xl transition-colors mt-6"
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

export default SidebarDemo;
