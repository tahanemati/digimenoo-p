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
  Flame,
  Coffee,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ChefHat,
  Globe, // 🔴 اضافه شدن آیکون زبان
} from "lucide-react";

// =====================================
// دیتای تستی با پشتیبانی دو زبانه (تاریک و نئونی)
// =====================================
const MOCK_VENUE = {
  name_fa: "برگر جوینت دمو",
  name_en: "Burger Joint Demo",
  about_us_fa:
    "بهترین برگرهای دست‌ساز شهر با گوشت ۱۰۰٪ تازه. طعم واقعی یک فست‌فود مدرن را در شب‌های تاریک تجربه کنید.",
  about_us_en:
    "The best handmade burgers in town with 100% fresh meat. Experience the real taste of modern fast food in dark nights.",
  address_fa: "تهران، شهرک غرب، خیابان فودکورت، پلاک ۹",
  address_en: "No 9, Foodcourt St, Shahrak-e Gharb, Tehran",
  phone: "021-44556677",
  logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop",
  brand_color: "yellow",
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "برگرها",
    name_en: "Burgers",
    items: [
      {
        id: 101,
        name_fa: "ماشروم برگر ویژه",
        name_en: "Special Mushroom Burger",
        price: 285000,
        description_fa: "گوشت ۱۵۰ گرمی، پنیر گودا، سس قارچ مخصوص، کاهو فرانسوی",
        description_en: "150g beef, gouda cheese, special mushroom sauce",
        image:
          "https://images.unsplash.com/photo-1594212693892-7f30f2c73336?w=600&fit=crop",
        is_available: true,
      },
      {
        id: 102,
        name_fa: "دبل چیزبرگر",
        name_en: "Double Cheeseburger",
        price: 340000,
        description_fa: "دو عدد گوشت ۱۵۰ گرمی، دیپ چدار، بیکن، پیاز کاراملی",
        description_en: "Two 150g beef patties, cheddar dip, bacon",
        image:
          "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&fit=crop",
        is_available: true,
      },
    ],
  },
  {
    id: 2,
    name_fa: "پیش‌غذا",
    name_en: "Starters",
    items: [
      {
        id: 201,
        name_fa: "سیب‌زمینی آلفردو",
        name_en: "Alfredo Fries",
        price: 120000,
        description_fa: "سیب‌زمینی سرخ‌کرده، سس آلفردو، قارچ، پنیر پارمزان",
        description_en: "French fries, alfredo sauce, mushroom, parmesan",
        image:
          "https://images.unsplash.com/photo-1576107249870-13ee24fbc11f?w=600&fit=crop",
        is_available: true,
      },
    ],
  },
];

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: CheckCircle2 },
];

// دیکشنری ترجمه‌های رابط کاربری (مخصوص تم تاریک)
const TRANSLATIONS = {
  fa: {
    open_status: "سفارش‌گیری باز است",
    search: "جستجو در منو...",
    waiter: "احضار گارسون",
    chef: "احضار آشپز",
    add_to_cart: "افزودن به سفارش",
    checkout_btn: "مشاهده فاکتور نهایی",
    checkout_title: "سبد خرید شما",
    selected_items: "آیتم انتخاب شده",
    total: "جمع کل قابل پرداخت:",
    pay: "تایید و پرداخت",
    order_placed: "سفارش ثبت شد",
    receipt: "فیش شماره",
    in_progress: "در حال انجام...",
    close: "بازگشت به منو",
    currency: "تومان",
    not_found: "موردی یافت نشد.",
    about: "درباره ما",
    waiter_alert: "درخواست گارسون به صندوق ارسال شد",
    chef_alert: "درخواست شما برای سرآشپز ثبت شد",
    stage_new: "دریافت سفارش",
    stage_prep: "روی گریل",
    stage_ready: "آماده تحویل",
  },
  en: {
    open_status: "Ordering is Open",
    search: "Search menu...",
    waiter: "Call Waiter",
    chef: "Call Chef",
    add_to_cart: "Add to Order",
    checkout_btn: "View Final Invoice",
    checkout_title: "Your Cart",
    selected_items: "items selected",
    total: "Total Amount:",
    pay: "Confirm & Pay",
    order_placed: "Order Placed",
    receipt: "Receipt No.",
    in_progress: "In progress...",
    close: "Back to Menu",
    currency: "Toman",
    not_found: "No items found.",
    about: "About Us",
    waiter_alert: "Waiter request sent to the counter",
    chef_alert: "Chef request has been submitted",
    stage_new: "Order Received",
    stage_prep: "On the Grill",
    stage_ready: "Ready to Serve",
  },
};

export const DarkStoryDemo = () => {
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
  const brandColor = "#eab308"; // Neon Yellow

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
      className="min-h-screen bg-[#09090b] flex justify-center font-sans text-slate-100"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-[#09090b] min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden border-x border-slate-900 pb-24">
        {/* ======================================= */}
        {/* هدر تیره */}
        {/* ======================================= */}
        <div className="pt-8 px-6 flex justify-between items-center bg-[#09090b] relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <img
                src={MOCK_VENUE.logo}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">
                {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: brandColor }}
                ></span>
                <span className="text-[10px] font-bold text-slate-400">
                  {t.open_status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleLang}
            className="bg-[#18181b] border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400 flex items-center gap-1.5 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
          >
            <Globe size={16} />{" "}
            <span className="text-xs pt-0.5 font-black">
              {isFa ? "EN" : "فا"}
            </span>
          </button>
        </div>

        {/* ======================================= */}
        {/* سرچ بار تیره */}
        {/* ======================================= */}
        <div className="px-6 mt-6">
          <div className="bg-[#18181b] border border-slate-800 rounded-2xl p-1 flex items-center shadow-inner transition-colors focus-within:border-slate-600">
            <div className={`px-3 text-slate-500`}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-3 text-sm font-bold text-white placeholder:text-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* دکمه‌های واضح خدمات */}
        {/* ======================================= */}
        <div className="px-6 mt-4 mb-2 flex gap-3">
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => alert(t.waiter_alert)}
              className="flex-1 bg-[#18181b] border border-slate-800 rounded-xl p-3 flex items-center justify-center gap-2 hover:border-slate-700 hover:bg-[#27272a] transition-colors shadow-sm"
            >
              <BellRing size={16} style={{ color: brandColor }} />
              <span className="text-[11px] font-bold text-slate-300">
                {t.waiter}
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => alert(t.chef_alert)}
              className="flex-1 bg-[#18181b] border border-slate-800 rounded-xl p-3 flex items-center justify-center gap-2 hover:border-slate-700 hover:bg-[#27272a] transition-colors shadow-sm"
            >
              <ChefHat size={16} style={{ color: brandColor }} />
              <span className="text-[11px] font-bold text-slate-300">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        {/* ======================================= */}
        {/* دسته‌بندی‌ها به سبک استوری */}
        {/* ======================================= */}
        <div className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-slate-900 py-4 mb-2">
          <div
            className="flex overflow-x-auto px-6 gap-3 hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-black transition-all duration-300 border ${
                  activeCategory === cat.id
                    ? "shadow-[0_0_15px_rgba(234,179,8,0.2)] text-[#09090b]"
                    : "bg-[#18181b] border-slate-800 text-slate-400 hover:text-white"
                }`}
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : undefined,
                  borderColor:
                    activeCategory === cat.id ? brandColor : undefined,
                }}
              >
                {isFa ? cat.name_fa : cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================= */}
        {/* کارت‌های محصول */}
        {/* ======================================= */}
        <div className="flex-1 px-5 space-y-10 mt-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 opacity-50 font-bold text-sm text-slate-500">
              {t.not_found}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id}>
                <h2
                  className={`text-xl font-black text-white mb-5 flex items-center gap-2 ${isFa ? "pr-1" : "pl-1"}`}
                >
                  <span
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: brandColor }}
                  ></span>
                  {isFa ? category.name_fa : category.name_en}
                </h2>
                <div className="space-y-6">
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-[#121214] rounded-[28px] overflow-hidden shadow-lg border border-slate-800/60 transition-transform hover:scale-[1.01]"
                      >
                        <div className="w-full h-56 relative bg-slate-900">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent"></div>
                        </div>

                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-white text-lg leading-tight">
                              {isFa ? item.name_fa : item.name_en}
                            </h3>
                            <div
                              className="font-black text-[17px] shrink-0"
                              style={{ color: brandColor }}
                            >
                              {formatPrice(item.price)}{" "}
                              <span className="text-[10px] text-slate-400 font-bold">
                                {t.currency}
                              </span>
                            </div>
                          </div>
                          <p className="text-[12px] font-medium text-slate-400 leading-relaxed mb-5 pr-1">
                            {isFa ? item.description_fa : item.description_en}
                          </p>

                          <div className="flex justify-end">
                            {qty > 0 ? (
                              <div className="flex items-center gap-4 bg-[#18181b] border border-slate-800 rounded-2xl p-1.5">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-9 h-9 bg-[#27272a] hover:bg-slate-700 rounded-xl flex items-center justify-center text-white transition-colors"
                                >
                                  <Minus size={18} strokeWidth={2.5} />
                                </button>
                                <span className="w-4 text-center font-black text-white text-sm">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#09090b] shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all active:scale-95"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={18} strokeWidth={3} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[#09090b] font-black shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-[0.98] transition-all"
                                style={{ backgroundColor: brandColor }}
                              >
                                <Plus size={18} strokeWidth={3} />{" "}
                                {t.add_to_cart}
                              </button>
                            )}
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
        <div className="mt-8 mb-10 mx-5 bg-[#121214] rounded-3xl p-6 border border-slate-800 text-center relative overflow-hidden">
          <div
            className={`absolute top-0 ${isFa ? "right-0 rounded-bl-full" : "left-0 rounded-br-full"} w-24 h-24 opacity-10`}
            style={{ backgroundColor: brandColor }}
          ></div>
          <div className="relative z-10">
            <h3 className="font-black text-white text-base mb-3">{t.about}</h3>
            <p className="text-[11px] font-bold text-slate-400 leading-loose mb-6 px-2">
              {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-300 bg-[#18181b] border border-slate-800 py-2.5 rounded-xl">
                <MapPin size={14} style={{ color: brandColor }} />{" "}
                {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
              </div>
              <div
                className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-300 bg-[#18181b] border border-slate-800 py-2.5 rounded-xl"
                dir="ltr"
              >
                <Phone size={14} style={{ color: brandColor }} />{" "}
                {MOCK_VENUE.phone}
              </div>
            </div>
          </div>
        </div>

        {/* سبد خرید شناور */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-[#09090b] p-4.5 rounded-2xl shadow-[0_10px_40px_rgba(234,179,8,0.3)] flex items-center justify-between active:scale-95 transition-transform"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#09090b]/10 p-2 rounded-xl">
                  <ShoppingCart size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-black text-sm">{t.checkout_btn}</span>
                  <span className="font-bold text-[10px] opacity-70">
                    {cartItemCount} {t.selected_items}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {formatPrice(cartTotal)}{" "}
                  <span className="text-[10px]">{t.currency}</span>
                </span>
                {isFa ? (
                  <ChevronLeft size={20} strokeWidth={3} />
                ) : (
                  <ChevronRight size={20} strokeWidth={3} />
                )}
              </div>
            </button>
          </div>
        )}

        {/* مودال‌های تسویه و پیگیری */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-[#09090b]/80 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-[#121214] border border-slate-800 w-full h-[85%] max-w-md rounded-t-[32px] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8 shrink-0 px-2">
                    <h3 className="font-black text-xl text-white">
                      {t.checkout_title}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-slate-800 text-slate-400 p-2.5 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-[#18181b] rounded-[24px] p-5 border border-slate-800 mb-6 hide-scrollbar">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-slate-800 border-dashed pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
                      >
                        <span className="font-black text-slate-200">
                          <span
                            style={{ color: brandColor }}
                            className={isFa ? "ml-2" : "mr-2"}
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold text-slate-400">
                          {formatPrice(item.price * item.qty)} {t.currency}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0">
                    <div className="flex justify-between items-center mb-5 px-3">
                      <span className="font-black text-slate-500">
                        {t.total}
                      </span>
                      <span
                        className="font-black text-2xl"
                        style={{ color: brandColor }}
                      >
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-sm text-slate-400">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-[#09090b] py-4 h-16 rounded-2xl font-black flex justify-center items-center shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95 transition-transform text-lg"
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
                <div className="flex flex-col h-full items-center text-center pt-10">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(234,179,8,0.15)]"
                    style={{
                      backgroundColor: `${brandColor}20`,
                      color: brandColor,
                    }}
                  >
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">
                    {t.order_placed}
                  </h2>
                  <p
                    className="text-sm font-bold text-slate-500 mb-10 bg-slate-900 px-5 py-2 rounded-full border border-slate-800"
                    dir="ltr"
                  >
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full bg-[#18181b] rounded-[32px] p-8 border border-slate-800 relative mb-auto text-right"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-11" : "left-11"} top-12 bottom-12 w-1 bg-slate-800 rounded-full z-0`}
                    ></div>
                    <div className="space-y-10 relative z-10 px-2">
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
                            className={`flex items-center gap-5 transition-all duration-500 ${isPending ? "opacity-30 grayscale" : ""}`}
                          >
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors bg-[#121214]`}
                              style={{
                                borderColor:
                                  isActive || isCompleted
                                    ? brandColor
                                    : "#3f3f46",
                                color:
                                  isActive || isCompleted
                                    ? brandColor
                                    : "#71717a",
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={28} strokeWidth={3} />
                              ) : (
                                <stage.icon size={26} />
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-black text-base mb-1 ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2 mt-1">
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
                    className="w-full text-white font-black bg-slate-800 hover:bg-slate-700 py-4 h-16 rounded-2xl transition-colors mt-6 text-base border border-slate-700"
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

export default DarkStoryDemo;
