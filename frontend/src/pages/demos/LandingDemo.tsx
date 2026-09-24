import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Minus,
  CheckCircle2,
  X,
  Loader2,
  Search,
  BellRing,
  ChefHat,
  Receipt,
  Flame,
  Coffee,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Home,
  ShoppingBag,
  Globe, // 🔴 آیکون زبان اضافه شد
} from "lucide-react";

// =====================================
// دیتای تستی اختصاصی با پشتیبانی دو زبانه
// =====================================
const MOCK_VENUE = {
  name_fa: "رستوران لندینگ دمو",
  name_en: "Landing Demo Restaurant",
  about_us_fa:
    "تجربه‌ای فراتر از طعم. ما در اینجا هنر آشپزی را با فضایی دلنشین ترکیب کرده‌ایم تا لحظاتی فراموش‌نشدنی را برای شما بسازیم.",
  about_us_en:
    "An experience beyond taste. We combine the art of cooking with a delightful atmosphere to create unforgettable moments for you.",
  address_fa: "تهران، بام نیاوران، پلاک ۱۰",
  address_en: "No 10, Niavaran Roof, Tehran",
  phone: "021-99887766",
  logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop",
  bg_image:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop",
  brand_color: "rose",
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "نوشیدنی‌های گرم",
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
        is_available: true,
      },
      {
        id: 102,
        name_fa: "کاپوچینو دبل",
        name_en: "Double Cappuccino",
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
    name_fa: "غذاهای اصلی",
    name_en: "Main Courses",
    items: [
      {
        id: 201,
        name_fa: "استیک ریب‌آی",
        name_en: "Ribeye Steak",
        price: 650000,
        description_fa: "۳۰۰ گرم گوشت گوساله، پوره سیب‌زمینی، سس قارچ",
        description_en: "300g beef, mashed potatoes, mushroom sauce",
        image:
          "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=200&h=200&fit=crop",
        is_available: true,
      },
      {
        id: 202,
        name_fa: "پاستا پنه آلفردو",
        name_en: "Penne Alfredo",
        price: 220000,
        description_fa: "مرغ گریل شده، سس خامه و پارمزان",
        description_en: "Grilled chicken, cream sauce & parmesan",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
        is_available: true,
      },
    ],
  },
  {
    id: 3,
    name_fa: "دسرهای ویژه",
    name_en: "Special Desserts",
    items: [
      {
        id: 301,
        name_fa: "چیزکیک نیویورکی",
        name_en: "NY Cheesecake",
        price: 120000,
        description_fa: "پایه بیسکویتی، پنیر خامه‌ای مخصوص، سس توت‌فرنگی",
        description_en: "Biscuit base, special cream cheese, strawberry sauce",
        image:
          "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&h=200&fit=crop",
        is_available: true,
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
    home: "خانه",
    search: "جستجو",
    waiter: "گارسون",
    chef: "آشپز",
    view_menu: "مشاهده منو",
    menu_title: "منوی رستوران",
    items: "آیتم",
    search_placeholder: "نام غذا را بنویسید...",
    not_found: "موردی یافت نشد.",
    waiter_alert: "درخواست گارسون ثبت شد",
    chef_alert: "درخواست آشپز ثبت شد",
    checkout_title: "تکمیل سفارش",
    total: "قابل پرداخت:",
    pay: "تایید و پرداخت",
    order_placed: "سفارش ثبت شد",
    receipt: "فیش شماره",
    in_progress: "در حال انجام...",
    close: "بازگشت به خانه",
    invoice: "مشاهده فاکتور",
    currency: "تومان",
    stage_new: "ثبت سفارش",
    stage_prep: "در حال پخت",
    stage_ready: "آماده تحویل",
  },
  en: {
    home: "Home",
    search: "Search",
    waiter: "Waiter",
    chef: "Chef",
    view_menu: "View Menu",
    menu_title: "Our Menu",
    items: "items",
    search_placeholder: "Search for food...",
    not_found: "No items found.",
    waiter_alert: "Waiter requested successfully",
    chef_alert: "Chef request submitted",
    checkout_title: "Complete Order",
    total: "Total to Pay:",
    pay: "Confirm & Pay",
    order_placed: "Order Placed Successfully",
    receipt: "Receipt No",
    in_progress: "In progress...",
    close: "Back to Home",
    invoice: "View Invoice",
    currency: "Toman",
    stage_new: "Order Placed",
    stage_prep: "Cooking",
    stage_ready: "Ready to Serve",
  },
};

export const LandingDemo = () => {
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const categoriesRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
  const brandColor = "#e11d48"; // Rose 600

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

  const scrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const searchResults = MOCK_CATEGORIES.flatMap((cat) => cat.items).filter(
    (item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return false;
      const name = isFa ? item.name_fa : item.name_en;
      const desc = isFa ? item.description_fa : item.description_en;
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    },
  );

  const selectedCategoryData = MOCK_CATEGORIES.find(
    (c) => c.id === selectedCategoryId,
  );

  return (
    <div
      className="min-h-screen bg-[#fafafa] flex justify-center font-sans text-slate-800"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden border-x border-slate-200 pb-20">
        {!selectedCategoryId ? (
          <>
            {/* ======================================= */}
            {/* سکشن اول: هیرو (Landing) تمام صفحه */}
            {/* ======================================= */}
            <div className="relative h-screen max-h-[85vh] w-full shrink-0 flex flex-col justify-end pb-12 overflow-hidden">
              {/* دکمه تغییر زبان */}
              <div
                className={`absolute top-6 ${isFa ? "left-6" : "right-6"} z-50`}
              >
                <button
                  onClick={toggleLang}
                  className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white flex items-center gap-1.5 hover:bg-black/50 transition-colors font-bold shadow-lg"
                >
                  <Globe size={16} />{" "}
                  <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
                </button>
              </div>

              <div className="absolute inset-0 z-0">
                <img
                  src={MOCK_VENUE.bg_image}
                  className="w-full h-full object-cover"
                  alt="Restaurant Background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20"></div>
              </div>

              <div className="relative z-10 px-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-[24px] overflow-hidden border border-white/20 mb-6 shadow-2xl bg-white/10 backdrop-blur-md p-1">
                    <img
                      src={MOCK_VENUE.logo}
                      className="w-full h-full object-cover rounded-[18px]"
                      alt="Logo"
                    />
                  </div>
                  <h1 className="text-3xl font-black text-white mb-4 tracking-tight drop-shadow-lg leading-tight">
                    {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
                  </h1>
                  <p className="text-[13px] font-medium text-white/70 leading-loose mb-10 drop-shadow px-4">
                    {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
                  </p>
                  <button
                    onClick={scrollToCategories}
                    className="mx-auto flex flex-col items-center gap-3 text-white/80 hover:text-white transition-colors group"
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                      {t.view_menu}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center animate-bounce border border-white/20 group-hover:bg-white/20 backdrop-blur-md">
                      <ChevronDown size={20} strokeWidth={2.5} />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ======================================= */}
            {/* سکشن دوم: لیست دسته‌بندی‌ها */}
            {/* ======================================= */}
            <div
              ref={categoriesRef}
              className="pt-8 px-6 pb-12 bg-white rounded-t-[40px] -mt-8 relative z-20 min-h-screen"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-10"></div>

              <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 px-2">
                <span
                  className="w-1.5 h-8 rounded-full"
                  style={{ backgroundColor: brandColor }}
                ></span>
                {t.menu_title}
              </h2>

              <div className="flex flex-col gap-4">
                {MOCK_CATEGORIES.map((cat, index) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full bg-slate-50 border border-slate-100 p-6 rounded-[28px] ${isFa ? "text-right" : "text-left"} transition-all duration-300 group shadow-sm hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex justify-between items-center relative overflow-hidden`}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                      style={{ backgroundColor: brandColor }}
                    ></div>

                    <div className="relative z-10 flex flex-col gap-1">
                      <span
                        className="text-[10px] font-black tracking-widest uppercase opacity-60"
                        style={{ color: brandColor }}
                      >
                        {String(index + 1).padStart(2, "0")} &mdash;
                      </span>
                      <h3 className="text-xl font-black text-slate-800 transition-colors tracking-tight">
                        {isFa ? cat.name_fa : cat.name_en}
                      </h3>
                    </div>

                    <div className="relative z-10">
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl group-hover:border-transparent transition-all shadow-sm">
                        {cat.items.length} {t.items}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ======================================= */
          /* صفحه محصولاتِ یک دسته خاص */
          /* ======================================= */
          <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-left-full duration-300 min-h-screen">
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200/50 px-6 py-5 flex items-center justify-between shadow-sm">
              <h2 className="text-xl font-black text-slate-800">
                {isFa
                  ? selectedCategoryData?.name_fa
                  : selectedCategoryData?.name_en}
              </h2>
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {isFa ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedCategoryData?.items.map((item) => {
                const qty = getItemQty(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-[28px] p-3 flex gap-4 shadow-sm border border-slate-100"
                  >
                    <div className="w-28 h-28 shrink-0 rounded-[20px] overflow-hidden bg-slate-100">
                      <img
                        src={item.image}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1.5">
                      <div>
                        <h3 className="font-black text-slate-800 text-[15px] mb-1.5 leading-tight">
                          {isFa ? item.name_fa : item.name_en}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed pr-1">
                          {isFa ? item.description_fa : item.description_en}
                        </p>
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <div
                          className="font-black text-base"
                          style={{ color: brandColor }}
                        >
                          {formatPrice(item.price)}{" "}
                          <span className="text-[9px] text-slate-400 font-bold">
                            {t.currency}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-slate-50 rounded-[14px] p-1 border border-slate-100">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-7 h-7 bg-white rounded-[10px] flex items-center justify-center text-slate-600 shadow-sm border border-slate-100"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-4 text-center font-black text-sm">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-[10px] flex items-center justify-center text-white shadow-sm"
                                style={{ backgroundColor: brandColor }}
                              >
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                              style={{ backgroundColor: brandColor }}
                            >
                              <Plus size={20} strokeWidth={2.5} />
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
        )}

        {/* ======================================= */}
        {/* نوار ناوبری پایین */}
        {/* ======================================= */}
        {orderStatus === "shopping" && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-5 pb-5 bg-gradient-to-t from-black/20 pt-10 pointer-events-none">
            {cartItemCount > 0 && (
              <button
                onClick={() => setOrderStatus("checkout")}
                className="w-full text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform pointer-events-auto mb-4 animate-in slide-in-from-bottom-5 border border-white/20 backdrop-blur-md"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingBag size={20} />
                    <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                      {cartItemCount}
                    </span>
                  </div>
                  <span className="font-black text-sm">{t.invoice}</span>
                </div>
                <div className="font-black text-lg">
                  {formatPrice(cartTotal)}{" "}
                  <span className="text-xs font-normal">{t.currency}</span>
                </div>
              </button>
            )}

            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-[28px] p-2.5 flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.1)] pointer-events-auto">
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors"
                style={{
                  color:
                    !selectedCategoryId && !isSearchOpen
                      ? brandColor
                      : undefined,
                }}
              >
                <Home
                  size={22}
                  strokeWidth={!selectedCategoryId && !isSearchOpen ? 2.5 : 2}
                />
                <span className="text-[9px] font-black">{t.home}</span>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors"
              >
                <Search size={22} />
                <span className="text-[9px] font-black">{t.search}</span>
              </button>

              {MOCK_VENUE.is_waiter_enabled && (
                <button
                  onClick={() => alert(t.waiter_alert)}
                  className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <BellRing size={22} />
                  <span className="text-[9px] font-black">{t.waiter}</span>
                </button>
              )}

              {MOCK_VENUE.is_chef_request_enabled && (
                <button
                  onClick={() => alert(t.chef_alert)}
                  className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ChefHat size={22} />
                  <span className="text-[9px] font-black">{t.chef}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال جستجوی تمام صفحه */}
        {/* ======================================= */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[70] bg-white flex flex-col w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 shadow-sm bg-white">
              <div className="flex-1 bg-slate-50 rounded-[20px] flex items-center px-4 py-3.5 border border-slate-100">
                <Search className="text-slate-400 shrink-0" size={20} />
                <input
                  type="text"
                  autoFocus
                  placeholder={t.search_placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-transparent border-none outline-none ${isFa ? "pr-3" : "pl-3"} text-sm font-bold text-slate-800`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-sm font-black"
                style={{ color: brandColor }}
              >
                لغو
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {searchQuery === "" ? (
                <div className="text-center pt-32 opacity-40">
                  <Search
                    size={56}
                    className="mx-auto mb-4 text-slate-300"
                    strokeWidth={1.5}
                  />
                  <p className="font-bold text-sm text-slate-500">
                    عبارتی را جستجو کنید
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center pt-32 opacity-50">
                  <p className="font-bold text-sm text-slate-500">
                    {t.not_found}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-[24px] p-3 flex gap-4 shadow-sm border border-slate-100"
                      >
                        <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <h3 className="font-black text-slate-800 text-sm">
                            {isFa ? item.name_fa : item.name_en}
                          </h3>
                          <div className="flex justify-between items-end mt-2">
                            <div
                              className="font-black text-sm"
                              style={{ color: brandColor }}
                            >
                              {formatPrice(item.price)}{" "}
                              <span className="text-[10px] text-slate-400">
                                {t.currency}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-6 h-6 bg-white rounded flex items-center justify-center text-slate-600 shadow-sm"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-4 text-center font-black text-xs">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md active:scale-95"
                                  style={{ backgroundColor: brandColor }}
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
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال‌های تسویه و پیگیری */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-white w-full h-[85%] max-w-md rounded-t-[40px] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8 shrink-0 px-2">
                    <h3 className="font-black text-xl text-slate-800">
                      {t.checkout_title}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-slate-50 text-slate-500 p-2.5 rounded-full hover:bg-slate-100 border border-slate-100"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50 rounded-[32px] p-6 border border-slate-100 mb-6 hide-scrollbar">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-slate-200 border-dashed pb-4 mb-4 last:border-0 last:mb-0 last:pb-0"
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
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0">
                    <div className="flex justify-between items-center mb-5 px-3">
                      <span className="font-black text-slate-500">
                        {t.total}
                      </span>
                      <span className="font-black text-2xl text-slate-900">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-xs text-slate-500">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-white py-4.5 h-16 rounded-[24px] font-black flex justify-center items-center shadow-[0_15px_30px_rgba(225,29,72,0.2)] active:scale-95 transition-transform text-lg"
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
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                    }}
                  >
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">
                    {t.order_placed}
                  </h2>
                  <p
                    className="text-sm font-bold text-slate-500 mb-10 bg-slate-50 px-5 py-2 rounded-full border border-slate-100 font-mono"
                    dir="ltr"
                  >
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full bg-slate-50 rounded-[32px] p-8 border border-slate-100 relative mb-auto text-right"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-11" : "left-11"} top-12 bottom-12 w-1 bg-slate-200 rounded-full z-0`}
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
                            className={`flex items-center gap-5 transition-all duration-500 ${isPending ? "opacity-40 grayscale" : ""}`}
                          >
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors bg-white`}
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
                                <CheckCircle2 size={28} strokeWidth={3} />
                              ) : (
                                <stage.icon size={26} />
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-black text-base mb-1 ${isActive ? "text-slate-800" : isCompleted ? "text-slate-600" : "text-slate-400"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
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
                    className="w-full text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 py-4.5 h-16 rounded-[24px] transition-colors mt-6 text-base"
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

export default LandingDemo;
