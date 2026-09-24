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
  Globe,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// =====================================
// دیتای اختصاصی قالب بنتو (Bento)
// =====================================
const MOCK_VENUE = {
  name_fa: "بنتو کافه",
  name_en: "Bento Cafe",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "#1d1d1f", // Apple Dark Gray
  accent_color: "#ff2d55", // Apple Pink for actions
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "محبوب‌ترین‌ها",
    name_en: "Popular",
    items: [
      {
        id: 101,
        name_fa: "برگر دبل چدار",
        name_en: "Double Cheddar Burger",
        price: 280000,
        description_fa: "دو لایه گوشت، پنیر چدار، سس مخصوص",
        description_en: "Double beef, cheddar, special sauce",
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 102,
        name_fa: "پیتزا پپرونی",
        name_en: "Pepperoni Pizza",
        price: 240000,
        description_fa: "پپرونی ۹۰٪، هالوپینو، موزارلا",
        description_en: "90% pepperoni, jalapeno, mozzarella",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&fit=crop",
        is_available: true,
      },
    ],
  },
  {
    id: 2,
    name_fa: "نوشیدنی سرد",
    name_en: "Cold Drinks",
    items: [
      {
        id: 201,
        name_fa: "شیک لوتوس",
        name_en: "Lotus Shake",
        price: 150000,
        description_fa: "بستنی وانیل، کرم لوتوس، بیسکویت",
        description_en: "Vanilla ice cream, Lotus cream",
        image:
          "https://images.unsplash.com/photo-1572490122747-3968b75bb699?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 202,
        name_fa: "موهیتو کلاسیک",
        name_en: "Classic Mojito",
        price: 90000,
        description_fa: "لیمو تازه، نعناع، سودا، یخ",
        description_en: "Fresh lime, mint, soda, ice",
        image:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&fit=crop",
        is_available: true,
      },
    ],
  },
  {
    id: 3,
    name_fa: "قهوه و گرم",
    name_en: "Coffee & Hot",
    items: [
      {
        id: 301,
        name_fa: "لته آرت",
        name_en: "Latte Art",
        price: 85000,
        description_fa: "اسپرسو، شیر فوم‌دار نرم",
        description_en: "Espresso, steamed milk",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&fit=crop",
        is_available: true,
      },
    ],
  },
];

const TRANSLATIONS = {
  fa: {
    waiter: "گارسون",
    chef: "آشپز",
    add: "افزودن",
    checkout: "سبد خرید",
    total: "قابل پرداخت",
    pay: "تایید و پرداخت",
    success: "سفارش ثبت شد",
    receipt: "کد پیگیری",
    stage_new: "دریافت سفارش",
    stage_prep: "در حال پخت",
    stage_ready: "آماده سرو",
    back: "بازگشت",
    items: "مورد",
    currency: "تومان",
    search: "جستجو در منو...",
    not_found: "موردی یافت نشد.",
    promo_title: "پیشنهاد ویژه!",
    promo_desc: "۲۰٪ تخفیف روی برگرها",
    wait: "صبر کنید...",
  },
  en: {
    waiter: "Waiter",
    chef: "Chef",
    add: "Add",
    checkout: "Cart",
    total: "Total Pay",
    pay: "Confirm & Pay",
    success: "Order Placed",
    receipt: "Order ID",
    stage_new: "Order Received",
    stage_prep: "Cooking",
    stage_ready: "Ready",
    back: "Back",
    items: "items",
    currency: "Toman",
    search: "Search menu...",
    not_found: "No items found.",
    promo_title: "Special Offer!",
    promo_desc: "20% off on Burgers",
    wait: "Wait...",
  },
};

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: CheckCircle2 },
];

export const BentoDemo = () => {
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
  const brandColor = MOCK_VENUE.brand_color;
  const accentColor = MOCK_VENUE.accent_color;

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
    let timer: ReturnType<typeof setTimeout>;
    if (orderStatus === "tracking" && currentStageIndex < 2) {
      timer = setTimeout(() => setCurrentStageIndex((prev) => prev + 1), 5000);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, currentStageIndex]);

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (isFa ? item.name_fa : item.name_en) || "";
      const desc = (isFa ? item.description_fa : item.description_en) || "";
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  const hideScrollbarClasses =
    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    // پس‌زمینه خاکستری روشن (iOS Background)
    <div
      className={`min-h-screen bg-[#f5f5f7] flex justify-center font-sans text-[#1d1d1f] ${hideScrollbarClasses}`}
      dir={isFa ? "rtl" : "ltr"}
    >
      <div
        className={`w-full max-w-md bg-[#f5f5f7] min-h-screen relative flex flex-col overflow-x-hidden border-x border-[#e5e5ea] pb-32 ${hideScrollbarClasses}`}
      >
        {/* ======================================= */}
        {/* ساختار Bento Grid (ویجت‌های مربعی و مستطیلی) */}
        {/* ======================================= */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* ویجت هدر (ردیف اول - دو ستون) */}
          <div className="col-span-2 flex gap-4">
            <div className="flex-1 bg-white rounded-[32px] p-3 pl-5 pr-3 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                  <img
                    src={MOCK_VENUE.logo}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl font-black tracking-tight">
                  {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
                </h1>
              </div>
            </div>
            {/* دکمه زبان (مربعی) */}
            <button
              onClick={toggleLang}
              className="w-[72px] bg-white rounded-[28px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform text-[#86868b] hover:text-[#1d1d1f]"
            >
              <Globe size={20} strokeWidth={2.5} />
              <span className="text-[10px] font-black">
                {isFa ? "EN" : "فا"}
              </span>
            </button>
          </div>

          {/* ویجت جستجو (ردیف دوم - دو ستون) */}
          <div className="col-span-2 bg-white rounded-[32px] p-2 flex items-center shadow-[0_2px_15px_rgba(0,0,0,0.03)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all">
            <div className="pl-4 pr-4 text-[#86868b]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-3 text-[15px] font-bold placeholder:text-[#86868b]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-3 text-[#86868b]"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* ویجت‌های خدمات (ردیف سوم - هر کدام یک ستون) */}
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => alert("گارسون احضار شد")}
              className="col-span-1 aspect-[4/3] bg-gradient-to-br from-[#e0eafc] to-[#cfdef3] rounded-[32px] p-5 flex flex-col items-start justify-between shadow-sm active:scale-95 transition-transform overflow-hidden relative group"
            >
              <div className="bg-white/50 p-3 rounded-[20px] backdrop-blur-sm text-[#2563eb] group-hover:scale-110 transition-transform">
                <BellRing size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black text-sm text-[#1e3a8a]">
                {t.waiter}
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => alert("درخواست سرآشپز")}
              className="col-span-1 aspect-[4/3] bg-gradient-to-br from-[#ffecd2] to-[#fcb69f] rounded-[32px] p-5 flex flex-col items-start justify-between shadow-sm active:scale-95 transition-transform overflow-hidden relative group"
            >
              <div className="bg-white/50 p-3 rounded-[20px] backdrop-blur-sm text-[#ea580c] group-hover:scale-110 transition-transform">
                <ChefHat size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black text-sm text-[#9a3412]">
                {t.chef}
              </span>
            </button>
          )}

          {/* ویجت پیشنهاد ویژه (ردیف چهارم - دو ستون) */}
          {!searchQuery && (
            <div className="col-span-2 relative h-32 rounded-[32px] overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&fit=crop"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
              <div className="relative z-10 p-6 h-full flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {t.promo_title}
                  </span>
                </div>
                <h3 className="text-white font-black text-lg w-2/3 leading-tight">
                  {t.promo_desc}
                </h3>
              </div>
            </div>
          )}

          {/* ویجت دسته‌بندی‌ها (باکس شناور افقی) */}
          <div className="col-span-2 -mx-4 px-4 mt-2">
            <div
              className={`flex overflow-x-auto gap-3 ${hideScrollbarClasses}`}
            >
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 px-6 py-3.5 rounded-[24px] text-[13px] font-black transition-all ${
                    activeCategory === cat.id
                      ? "bg-[#1d1d1f] text-white shadow-lg shadow-black/10 scale-105"
                      : "bg-white text-[#86868b] shadow-sm hover:text-[#1d1d1f]"
                  }`}
                >
                  {isFa ? cat.name_fa : cat.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* ویجت‌های محصولات (گرید دو ستونه) */}
          <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
            {filteredCategories.length === 0 ? (
              <div className="col-span-2 text-center py-10 opacity-50">
                <p className="font-bold">{t.not_found}</p>
              </div>
            ) : (
              filteredCategories
                .find((c) => c.id === activeCategory)
                ?.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    // کارت محصول (Bento Block)
                    <div
                      key={item.id}
                      className="bg-white rounded-[32px] p-2.5 flex flex-col shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-transparent hover:border-[#e5e5ea] transition-all"
                    >
                      {/* عکس مربعی */}
                      <div className="w-full aspect-square rounded-[24px] bg-[#f5f5f7] overflow-hidden mb-3 relative">
                        <img
                          src={item.image}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>

                      {/* اطلاعات */}
                      <div className="px-1.5 pb-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-[14px] leading-tight mb-1 text-[#1d1d1f] line-clamp-2">
                            {isFa ? item.name_fa : item.name_en}
                          </h3>
                          <p className="text-[10px] text-[#86868b] font-medium line-clamp-2 mb-3">
                            {isFa ? item.description_fa : item.description_en}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div
                            className="font-black text-[15px]"
                            style={{ color: brandColor }}
                          >
                            {formatPrice(item.price)}
                          </div>

                          {/* دکمه افزودن کوچک و گرد */}
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-full p-1 border border-[#e5e5ea]">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#1d1d1f] shadow-sm"
                              >
                                <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className="w-3 text-center font-black text-xs">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                                style={{ backgroundColor: brandColor }}
                              >
                                <Plus size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"
                              style={{ backgroundColor: brandColor }}
                            >
                              <Plus size={16} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* سبد خرید شناور (Apple Pill Style) */}
        {/* ======================================= */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-fit min-w-[280px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white px-5 py-4 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.2)] flex items-center gap-6 active:scale-95 transition-transform backdrop-blur-xl border border-white/20"
              style={{ backgroundColor: `${brandColor}E6` }} // رنگ برند با ترانسپرنسی
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={22} strokeWidth={2.5} />
                  <span className="absolute -top-2 -right-2 bg-[#ff2d55] text-white w-5 h-5 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#1d1d1f]">
                    {cartItemCount}
                  </span>
                </div>
                <span className="font-black text-sm tracking-wide">
                  {t.checkout}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-black text-lg font-mono">
                  {formatPrice(cartTotal)}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال‌های تسویه و پیگیری (iOS Sheet Style) */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <div
              className={`bg-[#f5f5f7] w-full max-w-md h-[90%] rounded-t-[40px] shadow-2xl flex flex-col p-2 animate-in slide-in-from-bottom-full duration-300 ${hideScrollbarClasses}`}
            >
              {/* تسویه حساب */}
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full bg-white rounded-[32px] overflow-hidden">
                  <div className="px-6 py-5 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-[#f5f5f7]">
                    <h3 className="font-black text-2xl text-[#1d1d1f] tracking-tight">
                      {t.checkout}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-[#f5f5f7] text-[#86868b] p-2 rounded-full hover:text-[#1d1d1f]"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto p-4 ${hideScrollbarClasses}`}
                  >
                    <div className="bg-[#f5f5f7] rounded-[24px] p-4">
                      {cart.map((item: any, idx) => (
                        <div
                          key={item.id}
                          className={`flex justify-between items-center py-4 ${idx !== cart.length - 1 ? "border-b border-[#e5e5ea]" : ""}`}
                        >
                          <span className="font-bold text-[15px] text-[#1d1d1f]">
                            <span className="bg-white text-[#1d1d1f] px-2 py-1 rounded-lg text-xs font-black shadow-sm mr-2 ml-2">
                              x{item.qty}
                            </span>
                            {isFa ? item.name_fa : item.name_en}
                          </span>
                          <span className="font-black text-[15px]">
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white border-t border-[#f5f5f7]">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-[#86868b]">
                        {t.total}:
                      </span>
                      <span className="font-black text-3xl text-[#1d1d1f]">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-sm font-bold text-[#86868b]">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-white py-4 h-16 rounded-[24px] font-black flex justify-center items-center active:scale-95 transition-transform text-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                      style={{ backgroundColor: accentColor }}
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

              {/* پیگیری سفارش */}
              {orderStatus === "tracking" && (
                <div className="flex flex-col h-full bg-white rounded-[32px] items-center justify-center text-center p-8 relative">
                  <div
                    className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-inner"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                    }}
                  >
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1d1d1f] mb-2 tracking-tight">
                    {t.success}
                  </h2>
                  <p className="text-sm font-bold text-[#86868b] mb-12 bg-[#f5f5f7] px-4 py-2 rounded-full font-mono">
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full relative mb-auto text-right"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute top-4 bottom-4 w-[2px] bg-[#f5f5f7] z-0 ${isFa ? "right-7" : "left-7"}`}
                    ></div>
                    <div className="space-y-10 relative z-10 px-4">
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
                            className={`flex items-center gap-6 transition-all duration-700 ${isPending ? "opacity-30 grayscale" : ""}`}
                          >
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm`}
                              style={{
                                backgroundColor:
                                  isActive || isCompleted
                                    ? brandColor
                                    : "#f5f5f7",
                                color:
                                  isActive || isCompleted ? "#fff" : "#86868b",
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={24} strokeWidth={3} />
                              ) : (
                                <stage.icon size={24} />
                              )}
                            </div>
                            <div className={!isFa ? "text-left" : "text-right"}>
                              <h4
                                className={`font-black text-lg mb-1 tracking-tight ${isActive || isCompleted ? "text-[#1d1d1f]" : "text-[#86868b]"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p
                                  className="text-[11px] font-bold flex items-center gap-2 mt-1"
                                  style={{ color: accentColor }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full animate-ping"
                                    style={{ backgroundColor: accentColor }}
                                  ></span>{" "}
                                  {t.wait}
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
                    className="w-full font-black bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea] py-4 h-16 rounded-[24px] transition-colors mt-8 text-base"
                  >
                    {t.back}
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

export default BentoDemo;
