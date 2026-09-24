import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  X,
  Loader2,
  BellRing,
  ChefHat,
  Search,
  MapPin,
  Phone,
  Globe,
  Receipt,
  CheckCircle2,
  Newspaper,
  Flame, // 🔴 مشکل اصلی اینجا بود! این آیکون ایمپورت نشده بود و کل صفحه را سفید می‌کرد.
} from "lucide-react";

// =====================================
// دیتای اختصاصی روزنامه (دو زبانه و بدون عکس)
// =====================================
const MOCK_VENUE = {
  name_fa: "تایمز کـافـه",
  name_en: "THE CAFE TIMES",
  subtitle_fa: "چاپ صبـح — تاسیس ۱۹۹۰",
  subtitle_en: "MORNING EDITION — EST. 1990",
  about_us_fa:
    "خبر فوری: بهترین طعم‌های شهر در اینجا کشف شد! ما با استفاده از دستورپخت‌های اصیل دهه ۹۰، تجربه‌ای نوستالژیک و بی‌نظیر را برای شما سرو می‌کنیم.",
  about_us_en:
    "BREAKING NEWS: The best flavors in town discovered here! Using authentic 90s recipes, we serve a nostalgic and unparalleled experience.",
  address_fa: "تهران، خیابان روزنامه، پلاک ۱۹",
  address_en: "No. 19, Newspaper St, Tehran",
  phone: "021-19901990",
  brand_color: "#1a1a1a",
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "سرمقالـه (پیش‌غذا)",
    name_en: "FRONT PAGE (Starters)",
    items: [
      {
        id: 101,
        name_fa: "سوپ پیاز کلاسیک",
        name_en: "Classic Onion Soup",
        price: 180000,
        description_fa: "پیاز کاراملی، عصاره گوساله، نان باگت برشته، پنیر",
        description_en:
          "Caramelized onions, beef broth, toasted baguette, cheese",
        is_available: true,
      },
      {
        id: 102,
        name_fa: "سالاد سزار ۱۹۹۰",
        name_en: "1990s Caesar Salad",
        price: 240000,
        description_fa: "کاهو پیچ، مرغ گریل، سس سزار دست‌ساز، کروتون",
        description_en:
          "Romaine lettuce, grilled chicken, handmade dressing, croutons",
        is_available: true,
      },
    ],
  },
  {
    id: 2,
    name_fa: "تیتر یـک (غذای اصلی)",
    name_en: "HEADLINES (Main Course)",
    items: [
      {
        id: 201,
        name_fa: "فیله مینیون اعلا",
        name_en: "Prime Filet Mignon",
        price: 1200000,
        description_fa: "۲۵۰ گرم فیله خالص، پوره سیب‌زمینی، سس فلفل سیاه",
        description_en: "250g pure filet, mashed potatoes, black pepper sauce",
        is_available: true,
      },
      {
        id: 202,
        name_fa: "پاستا آلفردو اصل",
        name_en: "Authentic Alfredo",
        price: 320000,
        description_fa: "پاستا پنه، سس خامه و قارچ، مرغ طعم‌دار شده",
        description_en: "Penne pasta, cream & mushroom sauce, seasoned chicken",
        is_available: true,
      },
    ],
  },
  {
    id: 3,
    name_fa: "پاورقـی (دسـر)",
    name_en: "FOOTNOTES (Desserts)",
    items: [
      {
        id: 301,
        name_fa: "تیرامیسو ایتالیایی",
        name_en: "Italian Tiramisu",
        price: 180000,
        description_fa: "بیسکویت ساوویاردی، ماسکارپونه، اسپرسو",
        description_en: "Savoiardi biscuits, mascarpone, espresso",
        is_available: true,
      },
    ],
  },
];

const TRANSLATIONS = {
  fa: {
    waiter: "احضار گارسون",
    chef: "درخواست سرآشپز",
    add: "+ افزودن",
    checkout: "چاپ صورتحساب",
    total: "جمع کل",
    pay: "پرداخت و تایید",
    success: "درخواست ثبت شد",
    receipt: "رسید",
    stage_new: "سفارش دریافت شد",
    stage_prep: "در حال پخت در مطبخ",
    stage_ready: "آماده سرو",
    back: "بازگشت به روزنامه",
    items: "آیتم",
    currency: "تومان",
    search: "جستجو در اخبار...",
    not_found: "مقاله‌ای یافت نشد.",
    about: "درباره ما",
    edition: "نسخه فارسی",
    wait: "کمی صبر کنید...",
  },
  en: {
    waiter: "Call Waiter",
    chef: "Call Chef",
    add: "+ Add",
    checkout: "Print Bill",
    total: "Total",
    pay: "Confirm & Pay",
    success: "Order Placed",
    receipt: "Receipt",
    stage_new: "Order Received",
    stage_prep: "Cooking in Kitchen",
    stage_ready: "Ready to Serve",
    back: "Back to Paper",
    items: "items",
    currency: "Toman",
    search: "Search news...",
    not_found: "No articles found.",
    about: "About Us",
    edition: "EN Edition",
    wait: "Please wait...",
  },
};

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: CheckCircle2 },
];

export const VintageDemo = () => {
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
    }, 2000);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (orderStatus === "tracking" && currentStageIndex < 2) {
      timer = setTimeout(() => setCurrentStageIndex((prev) => prev + 1), 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [orderStatus, currentStageIndex]);

  const handleCategoryClick = (id: number) => {
    setActiveCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <div
      className={`min-h-screen bg-[#e8e4db] flex justify-center font-serif text-[#1a1a1a] ${hideScrollbarClasses}`}
      dir={isFa ? "rtl" : "ltr"}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div
        className={`w-full max-w-md bg-[#f4f1ea] min-h-screen shadow-2xl relative flex flex-col overflow-x-hidden border-x border-[#c2b9a7] pb-32 ${hideScrollbarClasses}`}
      >
        <div
          className="fixed inset-0 w-full max-w-md mx-auto opacity-[0.04] pointer-events-none mix-blend-multiply z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* ======================================= */}
        {/* هدر روزنامه (Masthead) */}
        {/* ======================================= */}
        <div className="pt-8 px-6 text-center relative z-10">
          <div className="border-t-2 border-b-[4px] border-[#1a1a1a] py-1 mb-4 flex justify-between items-center text-[9px] font-bold tracking-widest uppercase">
            <span>VOL. 1</span>
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Globe size={12} /> {t.edition}
            </button>
            <span>PRICE: FREE</span>
          </div>

          <Newspaper size={32} className="mx-auto mb-2 opacity-80" />
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 text-[#1a1a1a]"
            style={{ letterSpacing: isFa ? "normal" : "-2px" }}
          >
            {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
          </h1>
          <p className="text-[10px] tracking-[0.3em] font-bold text-[#4a4a4a] uppercase border-b border-[#1a1a1a] pb-4 mx-4">
            {isFa ? MOCK_VENUE.subtitle_fa : MOCK_VENUE.subtitle_en}
          </p>

          <div className="flex justify-center gap-4 py-3 border-b-2 border-dotted border-[#1a1a1a] text-[#1a1a1a] mx-4 mb-2">
            {MOCK_VENUE.is_waiter_enabled && (
              <button
                onClick={() => alert("Waiter Called")}
                className="hover:bg-[#1a1a1a] hover:text-[#f4f1ea] px-2 py-1 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border border-transparent"
              >
                <BellRing size={14} /> {t.waiter}
              </button>
            )}
            {MOCK_VENUE.is_chef_request_enabled && (
              <button
                onClick={() => alert("Chef Called")}
                className="hover:bg-[#1a1a1a] hover:text-[#f4f1ea] px-2 py-1 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border border-transparent"
              >
                <ChefHat size={14} /> {t.chef}
              </button>
            )}
          </div>
        </div>

        {/* جستجوی کلاسیک */}
        <div className="px-6 mb-6 relative z-10 mt-2">
          <div className="border border-[#1a1a1a] bg-white/50 flex items-center py-2.5 px-3 shadow-[2px_2px_0px_#1a1a1a] transition-all">
            <Search className="text-[#1a1a1a]" size={16} />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none px-3 text-sm font-bold placeholder:text-[#888] placeholder:font-normal placeholder:italic"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} className="text-[#1a1a1a]" />
              </button>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* ایندکس دسته‌بندی‌ها (Sticky Index) */}
        {/* ======================================= */}
        <div className="sticky top-0 z-40 bg-[#f4f1ea] border-y-[3px] border-double border-[#1a1a1a] py-2 mb-8 shadow-sm">
          <div
            className={`flex overflow-x-auto px-6 gap-6 ${hideScrollbarClasses}`}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`shrink-0 text-xs font-black tracking-widest uppercase transition-all py-1 border-b-2 ${
                  activeCategory === cat.id
                    ? "text-[#1a1a1a] border-[#1a1a1a]"
                    : "text-[#7a7a7a] border-transparent hover:text-[#1a1a1a]"
                }`}
              >
                {isFa ? cat.name_fa : cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* ======================================= */}
        {/* لیست محصولات */}
        {/* ======================================= */}
        <div className="flex-1 px-6 space-y-12 relative z-10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 opacity-70">
              <p className="font-bold text-lg italic font-serif">
                *** {t.not_found} ***
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-28"
              >
                <div className="mb-6 flex flex-col items-center">
                  <h2 className="text-xl font-black tracking-widest text-[#1a1a1a] uppercase bg-[#1a1a1a] text-[#f4f1ea] px-4 py-1 inline-block">
                    {isFa ? category.name_fa : category.name_en}
                  </h2>
                </div>

                <div className="space-y-6">
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div key={item.id} className="group relative">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <h3 className="text-base font-black text-[#1a1a1a]">
                            {isFa ? item.name_fa : item.name_en}
                          </h3>

                          <div className="flex-1 border-b-[2px] border-dotted border-[#1a1a1a] mx-2 opacity-30"></div>

                          <div className="font-bold text-base whitespace-nowrap">
                            {formatPrice(item.price)}{" "}
                            <span className="text-[9px] text-[#4a4a4a] tracking-widest">
                              {t.currency}
                            </span>
                          </div>
                        </div>

                        <p className="text-[12px] text-[#4a4a4a] italic leading-relaxed pr-1 mb-3 max-w-[85%] font-serif">
                          {isFa ? item.description_fa : item.description_en}
                        </p>

                        <div className="flex justify-end">
                          {qty > 0 ? (
                            <div className="flex items-center gap-4 border border-[#1a1a1a] px-3 py-1 bg-white/50">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-[#1a1a1a] hover:opacity-50"
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>
                              <span className="w-4 text-center font-black text-[#1a1a1a] text-sm font-mono">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="text-[#1a1a1a] hover:opacity-50"
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="text-[10px] font-bold tracking-widest uppercase border border-[#1a1a1a] px-3 py-1 hover:bg-[#1a1a1a] hover:text-[#f4f1ea] transition-colors"
                            >
                              {t.add}
                            </button>
                          )}
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
        {/* درباره ما */}
        {/* ======================================= */}
        <div className="mt-16 mx-6 mb-10 pt-8 border-t-[4px] border-double border-[#1a1a1a] text-center relative z-10">
          <h3 className="font-black text-[#1a1a1a] text-xl mb-4 tracking-widest uppercase">
            {t.about}
          </h3>
          <p className="text-[12px] font-medium text-[#4a4a4a] leading-loose mb-6 px-2 text-center">
            {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
          </p>
          <div className="space-y-2 text-[10px] font-bold tracking-widest text-[#1a1a1a] uppercase font-mono">
            <div className="flex items-center justify-center gap-2">
              <MapPin size={12} />{" "}
              {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
            </div>
            <div className="flex items-center justify-center gap-2" dir="ltr">
              <Phone size={12} /> {MOCK_VENUE.phone}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* دکمه شناور چاپ صورتحساب */}
        {/* ======================================= */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[380px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-[#f4f1ea] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-between active:translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)] transition-all bg-[#1a1a1a] border-2 border-[#1a1a1a]"
            >
              <div className="flex flex-col items-start">
                <span className="font-black text-sm tracking-widest uppercase">
                  {t.checkout}
                </span>
                <span className="font-bold text-[10px] opacity-80 mt-0.5 font-mono">
                  {cartItemCount} {t.items}
                </span>
              </div>
              <div className="font-black text-xl font-mono">
                {formatPrice(cartTotal)}
              </div>
            </button>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال‌های تسویه و پیگیری */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-[#1a1a1a]/80 backdrop-blur-sm flex items-end justify-center">
            <div
              className={`bg-[#fdfcf8] w-full max-w-md h-[85%] shadow-2xl flex flex-col p-8 animate-in slide-in-from-bottom-full duration-400 border-x-8 border-t-8 border-[#1a1a1a] ${hideScrollbarClasses}`}
            >
              {orderStatus === "checkout" && (
                <div className="flex flex-col h-full relative">
                  <div className="flex justify-between items-center mb-6 shrink-0 border-b-2 border-dashed border-[#1a1a1a] pb-4">
                    <h3 className="font-black text-2xl tracking-widest text-[#1a1a1a] uppercase">
                      {t.checkout}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white rounded-full p-1 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className={`flex-1 overflow-y-auto mb-6 hide-scrollbar`}>
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm mb-4 font-mono text-[#1a1a1a]"
                      >
                        <span className="font-bold">
                          <span
                            className={`text-[#888] text-xs ${isFa ? "ml-3" : "mr-3"}`}
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold border-b border-dotted border-[#1a1a1a]">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="shrink-0 pt-6 border-t-[4px] border-double border-[#1a1a1a]">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-black text-[#1a1a1a] tracking-widest uppercase">
                        {t.total}:
                      </span>
                      <span className="font-black text-3xl font-mono text-[#1a1a1a]">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-xs font-sans tracking-widest">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                    <button
                      disabled={isSubmitting}
                      onClick={handleFinalCheckout}
                      className="w-full text-[#f4f1ea] py-4 h-16 font-black flex justify-center items-center active:translate-y-1 transition-transform text-lg uppercase tracking-widest bg-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
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
                <div className="flex flex-col h-full items-center pt-8 relative text-[#1a1a1a]">
                  <div className="w-20 h-20 border-[3px] border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 bg-[#f4f1ea]">
                    <Receipt size={36} strokeWidth={2} />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-widest uppercase">
                    {t.success}
                  </h2>
                  <p className="text-xs font-bold mb-12 font-mono border-b-2 border-dotted border-[#1a1a1a] pb-2 uppercase tracking-widest">
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full relative mb-auto text-right"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute top-4 bottom-4 w-0.5 bg-[#1a1a1a] z-0 opacity-20 ${isFa ? "right-4" : "left-4"}`}
                    ></div>
                    <div className="space-y-12 relative z-10 px-8">
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
                            className={`flex items-start gap-6 transition-all duration-700 ${isPending ? "opacity-30" : ""}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] bg-[#fdfcf8] -mt-1 transition-colors ${isActive || isCompleted ? "border-[#1a1a1a]" : "border-[#1a1a1a] opacity-30"}`}
                            >
                              {isCompleted && (
                                <div className="w-3 h-3 rounded-full bg-[#1a1a1a]"></div>
                              )}
                            </div>
                            <div className={!isFa ? "text-left" : "text-right"}>
                              <h4
                                className={`font-black text-lg mb-1 tracking-wider uppercase ${isActive || isCompleted ? "text-[#1a1a1a]" : "text-[#888]"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-[#1a1a1a] italic mt-2 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] animate-ping"></span>{" "}
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
                    className="w-full text-[#1a1a1a] font-black border-[3px] border-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] hover:text-[#fdfcf8] py-4 h-16 transition-colors mt-6 text-sm tracking-widest uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
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

export default VintageDemo;
