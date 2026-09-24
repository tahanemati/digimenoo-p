import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingBag,
  ChevronLeft,
  CheckCircle2,
  X,
  Loader2,
  Search,
  BellRing,
  ChefHat,
  Receipt,
  Flame,
  Coffee,
  Info,
  MapPin,
  Phone,
} from "lucide-react";

const MOCK_VENUE = {
  name: "کافه رستوران دمو",
  about_us:
    "این یک صفحه تستی برای نمایش ظاهر قالب مینیمال است. زیبایی در سادگی است. ما با تمرکز بر کیفیت مواد اولیه، تجربه‌ای خالص و بی‌نظیر را به شما ارائه می‌دهیم.",
  address: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "emerald", // رنگ مینیمال
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

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
        is_available: true,
        stock: null,
      },
      {
        id: 102,
        name: "کاپوچینو",
        price: 75000,
        description: "اسپرسو دبل، فوم شیر کلاسیک",
        image:
          "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop",
        is_available: true,
        stock: 10,
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
        is_available: true,
        stock: null,
      },
    ],
  },
];

const HEX_COLORS: Record<string, string> = {
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#a855f7",
  orange: "#f97316",
};

const ORDER_STAGES = [
  { id: "new", label: "ثبت سفارش", icon: Receipt },
  { id: "preparing", label: "در حال آماده‌سازی", icon: Flame },
  { id: "ready", label: "آماده تحویل", icon: Coffee },
];

export const MinimalDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const brandColor =
    HEX_COLORS[MOCK_VENUE.brand_color] || HEX_COLORS["emerald"];
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
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
      timer = setTimeout(() => {
        setCurrentStageIndex((prev) => prev + 1);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, currentStageIndex]);

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.name.includes(searchQuery) ||
        item.description.includes(searchQuery),
    ),
  })).filter((cat) => cat.items.length > 0);

  const handleServiceRequest = (service: string) => {
    alert(`درخواست ${service} با موفقیت ثبت شد.`);
  };

  return (
    <div
      className="min-h-screen bg-white flex justify-center font-sans text-slate-800"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-x-hidden pb-24 flex flex-col border-x border-slate-100">
        {/* هدر مینیمال */}
        <div className="pt-10 pb-6 px-6 flex flex-col items-center text-center bg-white relative z-10">
          <div className="w-20 h-20 rounded-full border border-slate-200 overflow-hidden mb-4 shadow-sm">
            <img
              src={MOCK_VENUE.logo}
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {MOCK_VENUE.name}
          </h1>
        </div>

        {/* دکمه‌های خدمات (ساده و خطی) */}
        <div className="px-6 pb-6 flex gap-3 border-b border-slate-100">
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => handleServiceRequest("احضار گارسون")}
              className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <BellRing size={20} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                احضار گارسون
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => handleServiceRequest("سفارش اختصاصی")}
              className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <ChefHat size={20} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                سفارش به آشپز
              </span>
            </button>
          )}
        </div>

        {/* جستجو مینیمال */}
        <div className="px-6 py-4 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <div className="bg-slate-50 rounded-full flex items-center px-4 py-3">
            <Search className="text-slate-400 shrink-0" size={18} />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-slate-700 font-bold text-sm placeholder:text-slate-400 placeholder:font-normal"
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
        </div>

        {/* تب‌های دسته‌بندی */}
        <div className="sticky top-[76px] z-40 bg-white border-b border-slate-100 py-3">
          <div
            className="flex overflow-x-auto px-6 gap-6 hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 pb-2 text-sm font-black transition-all border-b-2 ${
                  activeCategory === cat.id
                    ? "text-slate-900 border-slate-900"
                    : "text-slate-400 border-transparent"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* لیست محصولات (نمای خطی) */}
        <div className="flex-1 p-6 space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <h2 className="text-base font-black text-slate-800 mb-4">
                {category.name}
              </h2>
              <div className="space-y-6">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm mb-1">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="font-bold text-sm tracking-tight text-slate-900">
                            {item.price.toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              تومان
                            </span>
                          </div>

                          {/* کنترل‌گر تعداد مینیمال */}
                          <div className="flex items-center gap-3">
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span className="font-black text-sm w-4 text-center">
                                  {qty}
                                </span>
                              </>
                            )}
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 shadow-sm"
                              style={{ backgroundColor: brandColor }}
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* درباره ما */}
          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <h3 className="font-black text-slate-800 text-base mb-3">
              درباره ما
            </h3>
            <p className="text-xs text-slate-500 leading-loose mb-6 font-medium px-4">
              {MOCK_VENUE.about_us}
            </p>
            <div className="space-y-4 text-xs font-bold text-slate-600 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                {MOCK_VENUE.address}
              </div>
              <div className="flex items-center gap-2" dir="ltr">
                <Phone size={16} className="text-slate-400" />
                {MOCK_VENUE.phone}
              </div>
            </div>
          </div>
        </div>

        {/* سبد خرید شناور (دکمه کپسولی مینیمال) */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[350px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white px-6 py-4 rounded-full shadow-xl flex items-center justify-between transition-transform active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-2">
                <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">
                  {cartItemCount}
                </div>
                <span className="font-bold text-sm">مشاهده سبد خرید</span>
              </div>
              <div className="font-black text-sm">
                {cartTotal.toLocaleString("fa-IR")} تومان
              </div>
            </button>
          </div>
        )}

        {/* مودال‌های تسویه و پیگیری */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              {/* صفحه تسویه */}
              {orderStatus === "checkout" && (
                <div className="p-8 overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-xl text-slate-900">
                      سفارش شما
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="text-slate-400 hover:text-slate-800"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-8">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-slate-100 pb-4"
                      >
                        <span className="font-bold text-slate-800">
                          <span className="text-slate-400 ml-2">
                            x{item.qty}
                          </span>
                          {item.name}
                        </span>
                        <span className="font-bold text-slate-600">
                          {(item.price * item.qty).toLocaleString("fa-IR")}{" "}
                          تومان
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4">
                      <span className="font-bold text-slate-500">جمع کل</span>
                      <span className="font-black text-lg text-slate-900">
                        {cartTotal.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-2xl font-bold flex justify-center items-center transition-transform active:scale-95"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "پرداخت و ثبت سفارش"
                    )}
                  </button>
                </div>
              )}

              {/* صفحه پیگیری زنده سفارش (مینیمال) */}
              {orderStatus === "tracking" && (
                <div className="p-8 bg-white flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-slate-50 text-slate-800 border border-slate-100">
                    <ShoppingBag size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mb-1">
                    سفارش ثبت شد
                  </h2>
                  <p className="text-xs text-slate-500 mb-10 font-mono font-bold">
                    فیش #1042
                  </p>

                  {/* تایم‌لاین مینیمال */}
                  <div className="w-full relative mb-12 text-right px-4">
                    <div className="absolute right-7 top-4 bottom-4 w-px bg-slate-200 z-0"></div>
                    <div className="space-y-8 relative z-10">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isCompleted = idx < currentStageIndex;
                        const isPending = idx > currentStageIndex;

                        return (
                          <div
                            key={stage.id}
                            className={`flex items-center gap-6 transition-all duration-500 ${isPending ? "opacity-30" : ""}`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-[3px] bg-white transition-colors z-10 ${
                                isActive || isCompleted
                                  ? "border-slate-800"
                                  : "border-slate-300"
                              }`}
                            >
                              {isCompleted && (
                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                              )}
                            </div>
                            <div>
                              <h4
                                className={`font-bold text-sm ${isActive || isCompleted ? "text-slate-900" : "text-slate-500"}`}
                              >
                                {stage.label}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-slate-400 mt-1">
                                  در حال انجام...
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {currentStageIndex === ORDER_STAGES.length - 1 ? (
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="w-full text-white py-4 rounded-xl font-bold shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    >
                      سفارش مجدد
                    </button>
                  ) : (
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="text-slate-500 font-bold bg-slate-50 px-6 py-3 rounded-full text-sm hover:bg-slate-100"
                    >
                      بستن پنجره
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalDemo;
