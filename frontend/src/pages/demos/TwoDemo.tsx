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
import { useParams, useSearchParams } from "react-router-dom";
import { ordersApi } from "../../service/api";

const ORDER_STAGES = [
  { id: "new", icon: Receipt },
  { id: "preparing", icon: Flame },
  { id: "ready", icon: Coffee },
];

const TRANSLATIONS = {
  fa: {
    waiter: "احضار گارسون",
    waiter_alert: "درخواست گارسون با موفقیت ثبت شد و به زودی مراجعه می‌کنند.",
    chef: "سفارش به آشپز",
    chef_alert: "درخواست شما به آشپزخانه ارسال شد.",
    search: "جستجو در منو...",
    currency: "تومان",
    about: "درباره ما",
    checkout_btn: "مشاهده سبد خرید",
    checkout_title: "سفارش شما",
    total: "جمع کل",
    pay: "ثبت سفارش نهایی",
    order_placed: "سفارش با موفقیت ثبت شد",
    receipt: "شماره پیگیری",
    in_progress: "در حال انجام",
    close: "بستن پنجره",
    stage_new: "ثبت سفارش",
    stage_prep: "در حال آماده‌سازی",
    stage_ready: "آماده تحویل",
    not_found: "موردی یافت نشد.",
    empty_menu: "منوی این مجموعه هنوز تکمیل نشده است.",
  },
  en: {
    waiter: "Call Waiter",
    waiter_alert: "Waiter has been requested and will be with you shortly.",
    chef: "Chef Request",
    chef_alert: "Your request has been sent to the kitchen.",
    search: "Search menu...",
    currency: "Toman",
    about: "About Us",
    checkout_btn: "View Cart",
    checkout_title: "Your Order",
    total: "Total",
    pay: "Place Order",
    order_placed: "Order Placed Successfully",
    receipt: "Order ID",
    in_progress: "In Progress",
    close: "Close Window",
    stage_new: "Order Placed",
    stage_prep: "Preparing",
    stage_ready: "Ready to Serve",
    not_found: "No items found.",
    empty_menu: "Menu is not available yet.",
  },
};

// 🔴 تعریف ورودی دیتا از سمت پدر (LiveMenu)
interface TwoDemoProps {
  data: any;
}

export const TwoDemo = ({ data }: TwoDemoProps) => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table") || "سفارش سالن";

  // 🔴 خواندن مستقیم دیتا از پراپ، بدون نیاز به ریکوئست اضافی
  const venue = data?.venue;
  const categories = data?.categories || [];

  // State های رابط کاربری
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null,
  );
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
  const brandColor = "#10b981"; // رنگ سازمانی قالب

  // قفل کردن زبان اگر رستوران دوزبانه نبود
  useEffect(() => {
    if (venue && !venue.is_bilingual) {
      setLang("fa");
    }
  }, [venue]);

  // =====================================
  // اتصال زنده وضعیت سفارش (WebSocket)
  // =====================================
  useEffect(() => {
    if (orderStatus !== "tracking" || !activeOrderId || !slug) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/venue/${slug}/`);

    ws.onmessage = (event) => {
      const socketData = JSON.parse(event.data);
      if (
        socketData.type === "order_update" &&
        socketData.order.id === activeOrderId
      ) {
        const stageIndex = socketData.order.stage?.order_index || 0;
        setCurrentStageIndex(Math.min(stageIndex, 2));
      }
    };

    return () => ws.close();
  }, [orderStatus, activeOrderId, slug]);

  // =====================================
  // توابع سبد خرید و ثبت سفارش
  // =====================================
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

  const handleFinalCheckout = async () => {
    if (!slug || cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        table_number: tableNumber,
        total_price: cartTotal,
        payment_method: "cashier",
        items: cart.map((i) => ({ id: i.id, qty: i.qty })),
      };

      const res = await ordersApi.createOrder(slug, payload);

      setOrderStatus("tracking");
      setActiveOrderId(res.order_id);
      setCurrentStageIndex(0);
      setCart([]);
    } catch (error) {
      alert(
        isFa
          ? "خطا در ثبت سفارش. لطفاً به صندوق مراجعه کنید."
          : "Order error. Please contact staff.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTableCall = async (type: "waiter" | "chef") => {
    if (!slug) return;
    try {
      await ordersApi.callStaff(slug, {
        table_number: tableNumber,
        call_type: type,
      });
      alert(type === "waiter" ? t.waiter_alert : t.chef_alert);
    } catch (error) {
      alert("خطا در ارسال درخواست.");
    }
  };

  const formatPrice = (price: number) =>
    isFa ? price.toLocaleString("fa-IR") : price.toLocaleString("en-US");

  const toggleLang = () => setLang((prev) => (prev === "fa" ? "en" : "fa"));

  const filteredCategories = categories
    .map((cat: any) => ({
      ...cat,
      items: cat.items.filter((item: any) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const itemNameFa = item.name || "";
        const itemNameEn = item.name_en || item.name || "";
        const nameToCheck = isFa ? itemNameFa : itemNameEn;
        return nameToCheck.toLowerCase().includes(q);
      }),
    }))
    .filter((cat: any) => cat.items && cat.items.length > 0);

  if (!venue) return null;

  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center font-sans text-slate-800"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white min-h-screen relative overflow-x-hidden pb-24 flex flex-col shadow-2xl">
        {venue.is_bilingual && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={toggleLang}
              className="bg-white/80 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition-colors font-bold shadow-sm"
            >
              <Globe size={16} />
              <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
            </button>
          </div>
        )}

        <div className="pt-12 pb-6 px-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-50 overflow-hidden mb-4 shadow-sm bg-white p-1">
            <img
              src={
                venue.logo ||
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop"
              }
              className="w-full h-full object-cover rounded-full"
              alt={venue.name}
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isFa ? venue.name : venue.english_name || venue.name}
          </h1>
          <div className="mt-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-1">
            <MapPin size={12} /> {tableNumber}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 border-b border-slate-100">
          {venue.is_waiter_enabled && (
            <button
              onClick={() => handleTableCall("waiter")}
              className="flex-1 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
            >
              <BellRing size={22} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                {t.waiter}
              </span>
            </button>
          )}
          {venue.is_chef_request_enabled && (
            <button
              onClick={() => handleTableCall("chef")}
              className="flex-1 border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
            >
              <ChefHat size={22} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-500">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        <div className="px-6 py-4 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
          <div className="bg-slate-50 rounded-2xl flex items-center px-4 py-3 border border-slate-100 transition-all focus-within:border-emerald-300 focus-within:bg-white focus-within:shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
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

        {categories.length > 0 && (
          <div className="sticky top-[76px] z-40 bg-white border-b border-slate-100 py-3 shadow-sm">
            <div
              className="flex overflow-x-auto px-6 gap-6 hide-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {filteredCategories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 pb-2 text-sm font-black transition-all border-b-[3px] ${
                    activeCategory === cat.id
                      ? "text-emerald-500 border-emerald-500"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                >
                  {isFa ? cat.name : cat.name_en || cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 p-6 space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 opacity-50 text-slate-500 font-bold">
              {searchQuery ? t.not_found : t.empty_menu}
            </div>
          ) : (
            filteredCategories.map((category: any) => (
              <div key={category.id}>
                <h2 className="text-lg font-black text-slate-800 mb-5">
                  {isFa ? category.name : category.name_en || category.name}
                </h2>
                <div className="space-y-6">
                  {category.items.map((item: any) => {
                    const qty = getItemQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                      >
                        <div className="w-[100px] h-[100px] shrink-0 rounded-[20px] overflow-hidden bg-slate-100 border border-slate-100 relative shadow-sm">
                          <img
                            src={
                              item.image ||
                              "https://placehold.co/200x200?text=No+Image"
                            }
                            className="w-full h-full object-cover"
                          />
                          {qty > 0 && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                              {qty}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-black text-slate-900 text-[15px] mb-1 leading-tight">
                              {isFa ? item.name : item.name_en || item.name}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed opacity-80">
                              {isFa
                                ? item.description
                                : item.description_en || item.description}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="font-black text-[15px] text-emerald-600">
                              {formatPrice(item.price)}{" "}
                              <span className="text-[9px] font-bold text-slate-400 ml-0.5">
                                {t.currency}
                              </span>
                            </div>

                            {venue.is_ordering_enabled && (
                              <div className="flex items-center gap-3">
                                {qty > 0 ? (
                                  <>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="font-black text-[15px] w-4 text-center">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-md shadow-emerald-500/30 active:scale-90 transition-transform"
                                    >
                                      <Plus size={16} strokeWidth={3} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-4 py-2 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                                  >
                                    <Plus size={14} strokeWidth={3} /> افزودن
                                  </button>
                                )}
                              </div>
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

        <div className="mt-8 pt-10 border-t border-slate-100 text-center pb-8">
          <h3 className="font-black text-lg mb-3">{t.about}</h3>
          <p className="text-xs text-slate-500 mb-6 px-8 leading-loose font-medium">
            {isFa
              ? venue.description
              : venue.description_en || venue.description}
          </p>
          <div className="space-y-3 text-xs font-bold text-slate-600 flex flex-col items-center px-6">
            <div className="flex items-center gap-2.5 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 w-full justify-center">
              <MapPin size={18} className="text-emerald-500" />
              {isFa ? venue.address : venue.address_en || venue.address}
            </div>
            <div
              className="flex items-center gap-2.5 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 w-full justify-center"
              dir="ltr"
            >
              <Phone size={18} className="text-emerald-500" /> {venue.phone}
            </div>
          </div>
        </div>

        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[380px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white px-6 py-4 rounded-[24px] shadow-2xl shadow-emerald-500/40 flex items-center justify-between active:scale-95 transition-transform"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/25 px-3 py-1 rounded-xl text-[13px] font-black">
                  {cartItemCount} مورد
                </div>
                <span className="font-black text-[15px]">{t.checkout_btn}</span>
              </div>
              <div className="font-black text-base flex items-center gap-2">
                {formatPrice(cartTotal)}
                {isFa ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" ? (
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <h3 className="font-black text-2xl text-slate-800">
                      {t.checkout_title}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors"
                    >
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-4 mb-8 flex-1 overflow-y-auto hide-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-[15px] border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                      >
                        <span className="font-black text-slate-800 flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-xs">
                            x{item.qty}
                          </span>
                          {isFa ? item.name : item.name_en || item.name}
                        </span>
                        <span className="font-black text-slate-700">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-6 border-t border-slate-200 mt-6">
                      <span className="font-bold text-slate-500 text-lg">
                        {t.total}
                      </span>
                      <span className="font-black text-2xl text-emerald-600">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-xs font-bold text-slate-400">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="shrink-0 w-full text-white py-5 rounded-[24px] font-black text-lg flex justify-center active:scale-95 transition-transform shadow-xl shadow-emerald-500/30"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={28} />
                    ) : (
                      t.pay
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-10 bg-white flex flex-col items-center text-center rounded-t-[40px] sm:rounded-[40px]">
                  <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 bg-emerald-50 border-2 border-emerald-100 text-emerald-500 shadow-inner">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-slate-800">
                    {t.order_placed}
                  </h2>
                  <p className="text-[13px] text-slate-500 mb-10 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    {t.receipt} #{activeOrderId || "..."}
                  </p>

                  <div
                    className="w-full relative mb-12 text-right px-6"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-9" : "left-9"} top-4 bottom-4 w-1 bg-slate-100 rounded-full z-0`}
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
                              className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 bg-white z-10 transition-colors shadow-sm ${isActive || isCompleted ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-300"}`}
                            >
                              <stage.icon
                                size={16}
                                strokeWidth={isActive || isCompleted ? 3 : 2}
                              />
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-black text-[15px] ${isActive || isCompleted ? "text-slate-800" : "text-slate-500"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>{" "}
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
                    onClick={() => {
                      setOrderStatus("shopping");
                      setActiveOrderId(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-black text-sm py-4 rounded-[20px]"
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
