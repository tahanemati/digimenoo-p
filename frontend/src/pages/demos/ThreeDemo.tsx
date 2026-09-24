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
  Info,
  Globe, // 🔴 اضافه شدن آیکون زبان
} from "lucide-react";

// =====================================
// دیتای تستی با پشتیبانی دو زبانه
// =====================================
const MOCK_VENUE = {
  name_fa: "سفره‌خانه سنتی دمو",
  name_en: "Demo Traditional Dining",
  about_us_fa:
    "اصالت در طعم، آرامش در فضا. ما با افتخار اصیل‌ترین غذاهای ایرانی را در محیطی سنتی و دلنشین به شما تقدیم می‌کنیم.",
  about_us_en:
    "Authenticity in taste, peace in atmosphere. We proudly serve the most authentic Persian cuisine in a cozy traditional setting.",
  address_fa: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  address_en: "No 1, Test Alley, Valiasr St, Tehran",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "amber",
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name_fa: "کباب‌ها",
    name_en: "Kebabs",
    items: [
      {
        id: 101,
        name_fa: "چلوکباب کوبیده مخصوص",
        name_en: "Special Koobideh Kebab",
        price: 280000,
        description_fa: "دو سیخ کباب گوسفندی، برنج صدری ایرانی، گوجه و ریحان",
        description_en:
          "Two skewers of lamb kebab, premium Persian rice, tomato & basil",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
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
    waiter: "احضار مهماندار",
    waiter_alert: "درخواست مهماندار ثبت شد",
    chef: "سفارش به آشپز",
    chef_alert: "درخواست سرآشپز ثبت شد",
    search: "جستجو در منو...",
    currency: "تومان",
    about: "درباره",
    checkout_title: "تکمیل سفارش",
    total: "جمع کل",
    pay: "پرداخت و ثبت نهایی",
    order_placed: "سفارش در حال پردازش",
    receipt: "فیش",
    in_progress: "در حال انجام",
    close: "بازگشت به منو",
    stage_new: "ثبت سفارش",
    stage_prep: "در حال طبخ",
    stage_ready: "آماده سرو",
    not_found: "موردی یافت نشد.",
    selected: "انتخاب شده",
  },
  en: {
    waiter: "Call Host",
    waiter_alert: "Host requested successfully",
    chef: "Chef Request",
    chef_alert: "Chef request submitted",
    search: "Search menu...",
    currency: "Toman",
    about: "About",
    checkout_title: "Complete Order",
    total: "Total",
    pay: "Pay & Submit",
    order_placed: "Order Processing",
    receipt: "Receipt",
    in_progress: "In Progress",
    close: "Back to Menu",
    stage_new: "Order Placed",
    stage_prep: "Cooking",
    stage_ready: "Ready to Serve",
    not_found: "No items found.",
    selected: "selected",
  },
};

export const ThreeDemo = () => {
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
      const desc = isFa ? item.description_fa : item.description_en;
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-[#f5f3ef] flex justify-center font-sans text-[#2c2c2c]"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-[#faf9f6] min-h-screen shadow-2xl relative overflow-x-hidden border-x border-[#e8e4d9] pb-24 flex flex-col">
        {/* دکمه تغییر زبان */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleLang}
            className="bg-white border border-[#e8e4d9] px-3 py-1.5 rounded-lg text-[#5a5a5a] flex items-center gap-1.5 hover:bg-[#f5f3ef] transition-colors font-bold shadow-sm"
          >
            <Globe size={16} />{" "}
            <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
          </button>
        </div>

        {/* هدر کلاسیک */}
        <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center relative">
          <div
            className="absolute top-0 left-0 right-0 h-32 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#2c2c2c 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
          <div
            className="relative z-10 w-24 h-24 p-1 rounded-full border-2 border-double mb-4 bg-white"
            style={{ borderColor: brandColor }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img
                src={MOCK_VENUE.logo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1
            className="text-2xl font-black mb-2 px-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
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

        {/* دکمه‌های خدمات سنتی */}
        <div className="px-6 pb-6 flex gap-3">
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => alert(t.waiter_alert)}
              className="flex-1 border border-[#e8e4d9] rounded-lg p-2.5 flex flex-col items-center gap-1.5 bg-[#fdfdfc] hover:bg-[#f5f3ef] transition-colors shadow-sm"
            >
              <BellRing size={18} style={{ color: brandColor }} />
              <span className="text-[10px] font-bold text-[#5a5a5a]">
                {t.waiter}
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => alert(t.chef_alert)}
              className="flex-1 border border-[#e8e4d9] rounded-lg p-2.5 flex flex-col items-center gap-1.5 bg-[#fdfdfc] hover:bg-[#f5f3ef] transition-colors shadow-sm"
            >
              <ChefHat size={18} style={{ color: brandColor }} />
              <span className="text-[10px] font-bold text-[#5a5a5a]">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        {/* جستجو */}
        <div className="px-6 mb-6">
          <div className="bg-[#faf9f6] border border-[#d4d0c5] flex items-center px-4 py-3 rounded-lg shadow-inner">
            <Search className="text-[#a3a3a3] shrink-0" size={18} />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${isFa ? "pr-3" : "pl-3"} text-sm font-medium`}
            />
          </div>
        </div>

        {/* تب‌های دسته‌بندی */}
        <div className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-sm border-y border-[#e8e4d9] py-3 shadow-sm mb-6">
          <div
            className="flex overflow-x-auto px-4 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold border transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#ffffff",
                  color: activeCategory === cat.id ? "#ffffff" : "#737373",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#e8e4d9",
                }}
              >
                {isFa ? cat.name_fa : cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* محصولات */}
        <div className="flex-1 px-4 space-y-10 pb-12">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 opacity-60 text-sm font-bold">
              {t.not_found}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-4 mb-6">
                  <h2
                    className="text-xl font-black text-[#1a1a1a]"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {isFa ? category.name_fa : category.name_en}
                  </h2>
                  <div className="flex-1 border-b border-dashed border-[#d4d0c5]"></div>
                </div>
                <div className="space-y-4">
                  {category.items.map((item) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3 flex gap-4 shadow-sm border border-[#e8e4d9] transition-all hover:shadow-md"
                      >
                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#f5f3ef] border border-[#e8e4d9] p-0.5">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h3 className="font-bold text-[#1a1a1a] text-[15px] mb-1.5 leading-tight">
                              {isFa ? item.name_fa : item.name_en}
                            </h3>
                            <p className="text-xs text-[#737373] line-clamp-2 leading-relaxed">
                              {isFa ? item.description_fa : item.description_en}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div
                              className="font-bold text-base px-3 py-1 rounded-md border border-[#e8e4d9]"
                              style={{ color: brandColor }}
                            >
                              {formatPrice(item.price)}{" "}
                              <span className="text-[10px] text-[#a3a3a3]">
                                {t.currency}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-[#faf9f6] border border-[#e8e4d9] rounded-md p-1">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-sm">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-6 h-6 flex items-center justify-center text-white rounded active:scale-90 transition-transform"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 rounded-md border border-[#e8e4d9] bg-[#faf9f6] hover:bg-slate-100 flex items-center justify-center transition-colors"
                                >
                                  <Plus size={16} className="text-slate-600" />
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
        <div className="mt-12 pt-8 border-t-2 border-double border-[#e8e4d9] text-center">
          <div className="w-10 h-10 mx-auto mb-3 rotate-45 border border-[#e8e4d9] flex items-center justify-center bg-[#faf9f6]">
            <div
              className="w-6 h-6 -rotate-45 flex items-center justify-center"
              style={{ color: brandColor }}
            >
              <Info size={24} />
            </div>
          </div>
          <h3
            className="text-lg font-black mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {t.about} {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
          </h3>
          <p className="text-xs font-medium text-[#737373] leading-loose px-6 mb-6">
            {isFa ? MOCK_VENUE.about_us_fa : MOCK_VENUE.about_us_en}
          </p>
          <div className="space-y-2 text-xs font-bold text-[#5a5a5a]">
            <div className="flex items-center justify-center gap-2">
              <MapPin size={14} style={{ color: brandColor }} />{" "}
              {isFa ? MOCK_VENUE.address_fa : MOCK_VENUE.address_en}
            </div>
            <div className="flex items-center justify-center gap-2" dir="ltr">
              <Phone size={14} style={{ color: brandColor }} />{" "}
              {MOCK_VENUE.phone}
            </div>
          </div>
        </div>

        {/* سبد خرید */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-lg shadow-xl flex items-center justify-between active:scale-95 transition-transform"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <span className="font-bold text-sm">
                  {cartItemCount} {t.selected}
                </span>
              </div>
              <span className="font-black text-lg">
                {formatPrice(cartTotal)} {t.currency}
              </span>
            </button>
          </div>
        )}

        {/* مودال پیگیری/تکمیل */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-[#2c2c2c]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-[#faf9f6] w-full max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col p-6 border-4 border-double border-[#e8e4d9] animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3
                      className="font-black text-lg"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {t.checkout_title}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="hover:bg-slate-200 p-1 rounded transition-colors"
                    >
                      <X size={20} className="text-slate-500" />
                    </button>
                  </div>
                  <div className="border border-[#e8e4d9] rounded-lg p-4 mb-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm border-b border-dashed border-[#d4d0c5] pb-3 mb-3 last:border-0 last:mb-0 last:pb-0"
                      >
                        <span className="font-bold text-[#2c2c2c]">
                          <span
                            className={`text-[#a3a3a3] ${isFa ? "ml-2" : "mr-2"}`}
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 mt-2 border-t-2 border-[#e8e4d9]">
                      <span className="font-bold text-[#737373]">
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
                    className="w-full text-white py-4 rounded-lg font-bold flex justify-center active:scale-95 transition-transform"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      t.pay
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div
                    className="w-20 h-20 mx-auto rounded-full border-2 border-dashed flex items-center justify-center mb-6 bg-white"
                    style={{ borderColor: brandColor, color: brandColor }}
                  >
                    <Receipt size={32} />
                  </div>
                  <h2
                    className="text-2xl font-black mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {t.order_placed}
                  </h2>
                  <p className="text-sm font-bold text-[#737373] mb-8 font-mono border border-[#e8e4d9] inline-block px-3 py-1 rounded bg-white">
                    {t.receipt} #1042
                  </p>

                  <div
                    className="w-full relative mb-10 text-right px-4"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-7" : "left-7"} top-4 bottom-4 w-px bg-[#d4d0c5] z-0`}
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
                            className={`flex items-center gap-6 transition-all duration-500 ${idx > currentStageIndex ? "opacity-40 grayscale" : ""}`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 bg-[#faf9f6] z-10 ${isActive || isCompleted ? "border-[#2c2c2c]" : "border-[#d4d0c5]"}`}
                              style={{
                                borderColor:
                                  isActive || isCompleted ? brandColor : "",
                              }}
                            >
                              {isCompleted && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: brandColor }}
                                ></div>
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-bold text-sm ${isActive || isCompleted ? "text-[#2c2c2c]" : "text-[#737373]"}`}
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[10px] font-bold text-[#737373] mt-1 flex items-center gap-1.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: brandColor }}
                                  ></span>
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
                    className="w-full text-[#5a5a5a] font-bold border border-[#d4d0c5] bg-white py-3 rounded-lg hover:bg-slate-50 transition-colors"
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

export default ThreeDemo;
