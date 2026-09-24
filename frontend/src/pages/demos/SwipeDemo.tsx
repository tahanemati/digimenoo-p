import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  X,
  Loader2,
  BellRing,
  ChefHat,
  Receipt,
  Flame,
  Coffee,
  Globe,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Phone,
  Info,
} from "lucide-react";

// =====================================
// دیتای تستی توسعه‌یافته (دو زبانه)
// =====================================
const MOCK_VENUE = {
  name_fa: "کافه گلس دمو",
  name_en: "Glass Cafe",
  about_us_fa:
    "تجربه‌ای فراتر از طعم. ما در اینجا هنر آشپزی را با فضایی دلنشین ترکیب کرده‌ایم تا لحظاتی فراموش‌نشدنی را برای شما بسازیم.",
  about_us_en:
    "An experience beyond taste. We combine culinary art with a cozy atmosphere to create unforgettable moments for you.",
  address_fa: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  address_en: "No. 1, Test Alley, Valiasr St, Tehran",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop",
  brand_color: "#10b981", // Emerald Glow
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "پیش‌غذا",
    name_en: "Starters",
    items: [
      {
        id: 101,
        name_fa: "بروسکتا گوجه",
        name_en: "Tomato Bruschetta",
        price: 150000,
        description_fa: "نان روستایی، گوجه گیلاسی، ریحان",
        description_en: "Rustic toast, cherry tomatoes",
        image:
          "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 102,
        name_fa: "سیب‌زمینی ترافل",
        name_en: "Truffle Fries",
        price: 180000,
        description_fa: "سیب‌زمینی سرخ‌کرده، روغن ترافل، پارمزان",
        description_en: "French fries, truffle oil, parmesan",
        image:
          "https://images.unsplash.com/photo-1576107249870-13ee24fbc11f?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 103,
        name_fa: "سالاد سزار",
        name_en: "Caesar Salad",
        price: 240000,
        description_fa: "کاهو پیچ، مرغ گریل، سس سزار اصل",
        description_en: "Lettuce, grilled chicken, caesar dressing",
        image:
          "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&fit=crop",
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
        name_fa: "استیک ریب‌آی",
        name_en: "Ribeye Steak",
        price: 850000,
        description_fa: "گوشت گوساله، پوره سیب‌زمینی، سس قارچ",
        description_en: "Beef, mashed potatoes, mushroom sauce",
        image:
          "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 202,
        name_fa: "پاستا آلفردو",
        name_en: "Alfredo Pasta",
        price: 320000,
        description_fa: "پاستا پنه، سس خامه و قارچ، مرغ",
        description_en: "Penne, cream & mushroom sauce, chicken",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 203,
        name_fa: "بشقاب سوشی",
        name_en: "Sushi Platter",
        price: 550000,
        description_fa: "۸ رول سالمون، ۴ رول تن، واسابی",
        description_en: "8 Salmon rolls, 4 Tuna rolls, Wasabi",
        image:
          "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&fit=crop",
        is_available: true,
      },
    ],
  },
  {
    id: 3,
    name_fa: "نوشیدنی",
    name_en: "Beverages",
    items: [
      {
        id: 301,
        name_fa: "کوکتل دراگون",
        name_en: "Dragon Cocktail",
        price: 120000,
        description_fa: "دراگون فروت، لیمو، سودا، سیروپ",
        description_en: "Dragon fruit, lime, soda, syrup",
        image:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&fit=crop",
        is_available: true,
      },
      {
        id: 302,
        name_fa: "آیس ماتچا",
        name_en: "Iced Matcha",
        price: 140000,
        description_fa: "ماتچا ژاپنی پریمیوم، شیر بادام",
        description_en: "Premium Japanese Matcha, Almond milk",
        image:
          "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&fit=crop",
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

const TRANSLATIONS = {
  fa: {
    waiter: "گارسون",
    chef: "آشپز",
    add: "افزودن",
    checkout: "تکمیل سفارش",
    total: "جمع کل",
    pay: "تایید و پرداخت",
    success: "سفارش ثبت شد",
    receipt: "فیش",
    stage_new: "دریافت سفارش",
    stage_prep: "در حال آماده‌سازی",
    stage_ready: "آماده سرو",
    back: "بازگشت",
    items: "آیتم",
    currency: "تومان",
    wait: "صبر کنید...",
    search: "جستجوی محصول...",
    not_found: "محصولی یافت نشد.",
    about: "درباره ما",
  },
  en: {
    waiter: "Waiter",
    chef: "Chef",
    add: "Add",
    checkout: "Checkout",
    total: "Total",
    pay: "Confirm & Pay",
    success: "Order Placed",
    receipt: "Receipt",
    stage_new: "Order Received",
    stage_prep: "Preparing",
    stage_ready: "Ready",
    back: "Back",
    items: "items",
    currency: "Toman",
    wait: "Wait...",
    search: "Search products...",
    not_found: "No products found.",
    about: "About Us",
  },
};

export const SwipeDemo = () => {
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const t = TRANSLATIONS[lang];
  const brandColor = MOCK_VENUE.brand_color;
  const isFa = lang === "fa";

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

  const toggleLang = () => setLang((prev) => (prev === "fa" ? "en" : "fa"));
  const formatPrice = (price: number) =>
    isFa ? price.toLocaleString("fa-IR") : price.toLocaleString("en-US");

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: (cat.items || []).filter((item) => {
      const q = (searchQuery || "").toLowerCase().trim();
      if (!q) return true;
      const itemName = isFa ? item.name_fa : item.name_en;
      const itemDesc = isFa ? item.description_fa : item.description_en;
      return (
        itemName.toLowerCase().includes(q) || itemDesc.toLowerCase().includes(q)
      );
    }),
  })).filter((cat) => cat.items.length > 0);

  const hideScrollbarClasses =
    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <div
      className="min-h-screen bg-[#020617] flex justify-center font-sans text-slate-100 overflow-x-hidden"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div
        className={`w-full max-w-md bg-[#0f172a] min-h-screen relative flex flex-col overflow-x-hidden border-x border-slate-800 pb-28 shadow-2xl ${hideScrollbarClasses}`}
      >
        {/* هاله‌های نوری پس‌زمینه */}
        <div className="fixed top-0 left-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="fixed bottom-20 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* ======================================= */}
        {/* هدر شیشه‌ای ثابت */}
        {/* ======================================= */}
        <div className="sticky top-0 z-50 px-6 py-4 bg-[#0f172a]/70 backdrop-blur-xl border-b border-white/5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] overflow-hidden border border-white/10 shadow-lg p-0.5 bg-white/5">
              <img
                src={MOCK_VENUE.logo}
                className="w-full h-full object-cover rounded-[12px]"
              />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white drop-shadow-md">
                {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {MOCK_VENUE.is_waiter_enabled && (
              <button
                onClick={() => alert("Waiter Called")}
                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-sm"
              >
                <BellRing size={16} />
              </button>
            )}
            {MOCK_VENUE.is_chef_request_enabled && (
              <button
                onClick={() => alert("Chef Called")}
                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-sm"
              >
                <ChefHat size={16} />
              </button>
            )}
            <button
              onClick={toggleLang}
              className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-white/10 transition-colors shadow-sm"
            >
              <Globe size={16} /> {isFa ? "EN" : "فا"}
            </button>
          </div>
        </div>

        {/* ======================================= */}
        {/* نوار جستجوی شیشه‌ای */}
        {/* ======================================= */}
        <div className="px-6 mt-6 relative z-20">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex items-center shadow-inner transition-all focus-within:bg-white/10 focus-within:border-white/20">
            <div className="pl-3 pr-4 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-3 text-sm font-bold text-white placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* لیست دسته‌بندی‌ها */}
        {/* ======================================= */}
        <div
          className={`flex-1 flex flex-col gap-10 pt-8 relative z-10 ${hideScrollbarClasses}`}
        >
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Search
                size={48}
                className="mx-auto mb-4 text-slate-500"
                strokeWidth={1.5}
              />
              <p className="font-bold text-slate-400">{t.not_found}</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="w-full">
                <div className="px-6 mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
                    <span
                      className="w-1.5 h-6 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ backgroundColor: brandColor }}
                    ></span>
                    {isFa ? category.name_fa : category.name_en}
                  </h2>
                </div>

                <div
                  className={`flex overflow-x-auto gap-5 px-6 pb-6 pt-2 snap-x snap-mandatory ${hideScrollbarClasses}`}
                >
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="w-[260px] shrink-0 snap-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-3 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-white/10 transition-colors"
                      >
                        <div className="w-full h-44 rounded-[24px] overflow-hidden relative mb-4 bg-slate-800 shadow-inner">
                          <img
                            src={item.image}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent"></div>
                        </div>

                        <div className="px-2 pb-2 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-black text-white mb-1.5 line-clamp-1 drop-shadow-md">
                              {isFa ? item.name_fa : item.name_en}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 mb-4 h-8">
                              {isFa ? item.description_fa : item.description_en}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            <div
                              className="font-black text-xl drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                              style={{ color: brandColor }}
                            >
                              {formatPrice(item.price)}{" "}
                              <span className="text-[10px] font-bold text-white/50">
                                {t.currency}
                              </span>
                            </div>

                            <div className="flex items-center">
                              {qty > 0 ? (
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-sm">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <span className="w-4 text-center font-black text-sm">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-transform"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={22} strokeWidth={2.5} />
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

        {/* ======================================= */}
        {/* درباره ما (Glassmorphic) */}
        {/* ======================================= */}
        <div className="mx-6 mt-8 mb-10 relative z-10">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 text-center relative overflow-hidden shadow-2xl">
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-bl-full"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="relative z-10">
              <div className="w-12 h-12 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 shadow-sm">
                <Info size={24} />
              </div>
              <h3 className="font-black text-white text-lg mb-3 drop-shadow-md">
                {t.about}
              </h3>
              <p className="text-[12px] font-medium text-slate-300 leading-loose mb-6">
                {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-200 bg-black/30 border border-white/5 py-3 rounded-xl backdrop-blur-sm">
                  <MapPin size={16} style={{ color: brandColor }} />{" "}
                  {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
                </div>
                <div
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-200 bg-black/30 border border-white/5 py-3 rounded-xl backdrop-blur-sm"
                  dir="ltr"
                >
                  <Phone size={16} style={{ color: brandColor }} />{" "}
                  {MOCK_VENUE.phone}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* سبد خرید شناور (Glassmorphic) */}
        {/* ======================================= */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[380px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between active:scale-95 transition-transform backdrop-blur-2xl border border-white/20 bg-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner text-emerald-400">
                  <ShoppingCart size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-black text-sm">{t.checkout}</span>
                  <span className="font-bold text-[10px] text-emerald-400 mt-1">
                    {cartItemCount} {t.items}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-xl">
                  {formatPrice(cartTotal)}
                </span>
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  {isFa ? (
                    <ChevronLeft size={20} strokeWidth={3} />
                  ) : (
                    <ChevronRight size={20} strokeWidth={3} />
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال‌های تسویه و پیگیری (تاریک و شیشه‌ای) */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-end justify-center">
            <div className="bg-[#0f172a]/95 backdrop-blur-3xl border-t border-white/10 w-full h-[85%] max-w-md rounded-t-[40px] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8 px-2 shrink-0">
                    <h3 className="font-black text-2xl text-white tracking-tight">
                      {t.checkout}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-white/10 text-white/70 p-3 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto bg-black/40 rounded-[32px] p-6 border border-white/5 mb-6 hide-scrollbar shadow-inner ${hideScrollbarClasses}`}
                  >
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-white/10 border-dashed pb-5 mb-5 last:border-0 last:mb-0 last:pb-0"
                      >
                        <span className="font-black text-slate-200 text-base">
                          <span
                            style={{ color: brandColor }}
                            className={isFa ? "ml-3" : "mr-3"}
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold text-slate-400 font-mono text-base">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0 bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
                    <div className="flex justify-between items-center mb-5">
                      <span className="font-bold text-slate-400">
                        {t.total}:
                      </span>
                      <span
                        className="font-black text-3xl tracking-tighter"
                        style={{ color: brandColor }}
                      >
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-sm text-slate-400 font-bold">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-black py-4 h-16 rounded-2xl font-black flex justify-center items-center shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 transition-transform text-lg"
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
                  <div className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                    {t.success}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 mb-10 bg-white/5 px-6 py-2 rounded-full border border-white/10 font-mono">
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full bg-black/40 rounded-[32px] p-8 border border-white/5 relative mb-auto text-right shadow-inner"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute top-12 bottom-12 w-1 bg-white/10 rounded-full z-0 ${isFa ? "right-11" : "left-11"}`}
                    ></div>
                    <div className="space-y-10 relative z-10">
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
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 transition-colors backdrop-blur-md ${isActive || isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={28} strokeWidth={3} />
                              ) : (
                                <stage.icon size={26} />
                              )}
                            </div>
                            <div className={!isFa ? "text-left" : "text-right"}>
                              <h4
                                className={`font-black text-lg mb-1 tracking-tight ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-2 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>{" "}
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
                    className="w-full text-white font-black bg-white/10 hover:bg-white/20 py-4 h-16 rounded-2xl transition-colors mt-6 text-base border border-white/10 backdrop-blur-md shadow-sm"
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

export default SwipeDemo;
