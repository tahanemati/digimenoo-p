import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
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
  Info,
  MapPin,
  Phone,
  Globe,
  Package,
} from "lucide-react";

import { ordersApi } from "../../service/api";

export interface MenuData {
  name: string;
  english_name: string;
  logo: string | null;
  description: string;
  description_en: string | null;
  address: string;
  address_en: string | null;
  phone: string;
  categories: {
    id: number;
    name: string;
    name_en: string | null;
    items: {
      id: number;
      name: string;
      name_en: string | null;
      price: string | number;
      desc: string;
      desc_en: string | null;
      image: string | null;
      stock: number;
      is_available: boolean;
    }[];
  }[];
  features: {
    is_ordering_enabled: boolean;
    is_waiter_enabled: boolean;
    is_chef_request_enabled: boolean;
    is_bilingual: boolean;
    order_stages?: { id: string; name: string; name_en?: string }[];
  };
}

const HEX_COLORS: Record<string, string> = {
  orange: "#f97316",
  emerald: "#10b981",
  amber: "#f59e0b",
};

const TRANSLATIONS = {
  fa: {
    waiter: "درخواست گارسون",
    waiter_alert: "درخواست گارسون با موفقیت ثبت شد و به زودی مراجعه می‌کنند.",
    chef: "سفارش به آشپز",
    chef_alert: "درخواست شما برای آشپزخانه ارسال شد.",
    search: "جستجو...",
    currency: "تومان",
    about: "درباره ما",
    checkout: "تکمیل سفارش",
    checkout_title: "تکمیل سفارش",
    final: "نهایی:",
    pay: "ثبت سفارش",
    order_placed: "سفارش ثبت شد",
    receipt: "فیش",
    in_progress: "در حال انجام",
    close: "بستن",
  },
  en: {
    waiter: "Call Waiter",
    waiter_alert: "Waiter requested successfully.",
    chef: "Chef Request",
    chef_alert: "Chef request submitted.",
    search: "Search...",
    currency: "Toman",
    about: "About Us",
    checkout: "Checkout",
    checkout_title: "Complete Order",
    final: "Total:",
    pay: "Place Order",
    order_placed: "Order Placed",
    receipt: "Receipt",
    in_progress: "In Progress",
    close: "Close",
  },
};

const getNumericPrice = (p: string | number): number => {
  if (typeof p === "number") return p;
  if (!p) return 0;
  const enStr = p
    .toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/,/g, "");
  return parseInt(enStr, 10) || 0;
};

// خواندن شماره میز از آدرس مرورگر (QR Code)
const urlParams = new URLSearchParams(window.location.search);
const tableFromUrl = urlParams.get("table");

export const OneDemo = ({ data }: { data: MenuData }) => {
  if (!data || !data.categories || !data.features) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-sans"
        dir="rtl"
      >
        <Loader2 className="animate-spin mb-4 text-orange-500" size={40} />
        <p className="font-bold">در حال دریافت منو...</p>
      </div>
    );
  }

  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [tableNumber, setTableNumber] = useState(
    tableFromUrl ? `میز ${tableFromUrl}` : "",
  );
  const [paymentMethod] = useState<"cashier">("cashier");
  const [registeredOrderId, setRegisteredOrderId] = useState<number | null>(
    null,
  );

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
  const brandColor = HEX_COLORS.orange;

  const dynamicStages =
    data.features.order_stages && data.features.order_stages.length > 0
      ? data.features.order_stages
      : [
          { id: "new", name: "ثبت سفارش", name_en: "Order Received" },
          { id: "preparing", name: "در حال پخت", name_en: "Preparing" },
          { id: "ready", name: "آماده تحویل", name_en: "Ready To Serve" },
        ];

  const getStageIcon = (index: number, total: number) => {
    if (index === 0) return Receipt;
    if (index === total - 1) return Coffee;
    if (index === 1) return Flame;
    return Package;
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + getNumericPrice(item.price) * (item.qty || 1),
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
  const formatPrice = (price: number | string) =>
    isFa
      ? getNumericPrice(price).toLocaleString("fa-IR")
      : getNumericPrice(price).toLocaleString("en-US");
  const toggleLang = () => setLang((prev) => (prev === "fa" ? "en" : "fa"));

  const scrollToCategory = (id: number) => {
    setActiveCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // ==========================================
  // 🔴 تابع اصلی ارسال درخواست گارسون / آشپز
  // ==========================================
  const handleCallStaff = async (type: "waiter" | "chef") => {
    const table =
      tableFromUrl ||
      window.prompt(
        isFa ? "لطفاً شماره میز خود را وارد کنید:" : "Enter your table number:",
      );

    if (!table || table.trim() === "") return; // اگر کنسل کرد یا خالی گذاشت کاری نکن

    try {
      if (ordersApi.callStaff) {
        await ordersApi.callStaff(data.english_name, {
          table_number: table,
          call_type: type,
        });
        alert(type === "chef" ? t.chef_alert : t.waiter_alert);
      } else {
        alert("سیستم درخواست متصل نیست. لطفاً api.ts را بررسی کنید.");
      }
    } catch (error) {
      console.error(error);
      alert(isFa ? "خطا در ارسال درخواست به سرور!" : "Error sending request!");
    }
  };

  const handleFinalCheckout = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        table_number: tableNumber || (isFa ? "سفارش بیرون‌بر" : "Takeaway"),
        total_price: cartTotal.toString(),
        payment_method: paymentMethod,
        items: cart.map((item) => ({ id: item.id, qty: item.qty })),
      };

      const response = await ordersApi.createOrder(data.english_name, payload);
      setRegisteredOrderId(response.order_id);
      setOrderStatus("tracking");
      setCart([]);
      setCurrentStageIndex(0);
    } catch (error) {
      console.error("خطا در ثبت سفارش", error);
      alert(isFa ? "مشکلی در ثبت سفارش پیش آمد!" : "Error placing order!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // رهگیری زنده وضعیت فیش از طریق WebSocket
  useEffect(() => {
    let ws: WebSocket;
    if (orderStatus === "tracking" && registeredOrderId) {
      ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${data.english_name}/`);
      ws.onmessage = (event) => {
        const res = JSON.parse(event.data);
        if (res.type === "order_update" && res.order.id === registeredOrderId) {
          const orderData = res.order;
          if (orderData.is_archived) {
            setCurrentStageIndex(dynamicStages.length);
            ws.close();
          } else {
            const stageIndex = dynamicStages.findIndex(
              (s) => String(s.id) === String(orderData.status),
            );
            if (stageIndex !== -1) setCurrentStageIndex(stageIndex);
          }
        }
      };
    }
    return () => {
      if (ws) ws.close();
    };
  }, [orderStatus, registeredOrderId, data.english_name, dynamicStages]);

  const filteredCategories = data.categories
    .map((cat) => ({
      ...cat,
      items: (cat.items || []).filter((item) => {
        const q = (searchQuery || "").toLowerCase().trim();
        if (!q) return true;
        return (
          (isFa ? item.name : item.name_en || item.name)
            .toLowerCase()
            .includes(q) ||
          (isFa ? item.desc || "" : item.desc_en || item.desc || "")
            .toLowerCase()
            .includes(q)
        );
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div
      className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-800"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-x-hidden pb-24 flex flex-col">
        {/* هدر */}
        <div
          className="relative h-48 w-full overflow-hidden transition-colors duration-500 rounded-b-[40px] shadow-sm"
          style={{ backgroundColor: brandColor }}
        >
          {data.features.is_bilingual && (
            <button
              onClick={toggleLang}
              className={`absolute top-5 ${isFa ? "left-5" : "right-5"} z-50 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white flex items-center gap-1.5 hover:bg-white/30 transition-colors border border-white/30 font-bold shadow-sm`}
            >
              <Globe size={16} />{" "}
              <span className="text-xs pt-0.5">{isFa ? "EN" : "فا"}</span>
            </button>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
            <div className="w-20 h-20 rounded-[24px] border-[3px] border-white bg-white overflow-hidden shadow-lg mb-3 flex items-center justify-center text-3xl font-black text-slate-300">
              {data.logo ? (
                <img
                  src={data.logo}
                  className="w-full h-full object-cover"
                  alt={data.name}
                />
              ) : (
                data.name.charAt(0)
              )}
            </div>
            <h1 className="text-xl font-black text-white tracking-tight drop-shadow-md">
              {isFa ? data.name : data.english_name || data.name}
            </h1>
          </div>
        </div>

        {/* ========================================== */}
        {/* 🔴 دکمه‌های گارسون و آشپز */}
        {/* ========================================== */}
        <div className="px-4 -mt-6 relative z-20 flex gap-3">
          {data.features.is_waiter_enabled && (
            <button
              onClick={() => handleCallStaff("waiter")}
              className="flex-1 bg-white/90 backdrop-blur-md border border-white rounded-[20px] p-3 shadow-lg flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${brandColor}15`,
                  color: brandColor,
                }}
              >
                <BellRing size={20} />
              </div>
              <span className="text-xs font-black text-slate-700">
                {t.waiter}
              </span>
            </button>
          )}
          {data.features.is_chef_request_enabled && (
            <button
              onClick={() => handleCallStaff("chef")}
              className="flex-1 bg-white/90 backdrop-blur-md border border-white rounded-[20px] p-3 shadow-lg flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform active:scale-95"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${brandColor}15`,
                  color: brandColor,
                }}
              >
                <ChefHat size={20} />
              </div>
              <span className="text-xs font-black text-slate-700">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        {/* جستجو */}
        <div className="px-5 mt-6 mb-2 sticky top-2 z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 flex items-center px-4 py-3.5 transition-all focus-within:border-slate-300">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${isFa ? "pr-3" : "pl-3"} text-slate-800 font-bold text-sm`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 bg-slate-100 p-1 rounded-full hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* دسته‌بندی‌ها */}
        <div className="sticky top-[72px] z-40 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/50 py-3 mb-2">
          <div
            className="flex overflow-x-auto px-5 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-2xl font-black border transition-all text-sm shadow-sm whitespace-nowrap"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#fff",
                  color: activeCategory === cat.id ? "#fff" : "#64748b",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#f1f5f9",
                }}
              >
                {isFa ? cat.name : cat.name_en || cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* لیست محصولات */}
        <div className="flex-1 p-5 space-y-10">
          {filteredCategories.map((category) => (
            <div key={category.id} id={`category-${category.id}`}>
              <h2
                className={`text-lg font-black text-slate-800 mb-5 relative flex items-center ${isFa ? "pr-4" : "pl-4"}`}
              >
                <span
                  className={`absolute ${isFa ? "right-0" : "left-0"} w-1.5 h-6 rounded-full`}
                  style={{ backgroundColor: brandColor }}
                ></span>
                {isFa ? category.name : category.name_en || category.name}
              </h2>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-[24px] p-3 flex gap-4 shadow-sm border border-slate-100 transition-all hover:shadow-md"
                    >
                      <div className="w-28 h-28 shrink-0 rounded-[18px] overflow-hidden bg-slate-100 border border-slate-50 flex items-center justify-center text-slate-300">
                        {item.image ? (
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                            alt={item.name}
                          />
                        ) : (
                          <Coffee size={32} />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1.5">
                        <div>
                          <h3 className="font-black text-slate-800 mb-1.5 text-sm leading-tight">
                            {isFa ? item.name : item.name_en || item.name}
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
                            {isFa ? item.desc : item.desc_en || item.desc}
                          </p>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div
                            className="font-black text-base"
                            style={{ color: brandColor }}
                          >
                            {formatPrice(item.price)}{" "}
                            <span className="text-[10px] text-slate-400 font-bold">
                              {t.currency}
                            </span>
                          </div>
                          {data.features.is_ordering_enabled && (
                            <div className="flex items-center bg-slate-50 rounded-[14px] p-1 border border-slate-100">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center text-slate-600 shadow-sm border border-slate-100"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center font-black text-sm">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={20} />
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
          ))}
        </div>

        {/* درباره ما */}
        <div className="mt-8 mb-4 mx-5 bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
            <Info size={28} style={{ color: brandColor }} />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-3">{t.about}</h3>
          <p className="text-[12px] font-bold text-slate-500 leading-loose mb-6">
            {isFa
              ? data.description || "توضیحاتی برای این مجموعه ثبت نشده است."
              : data.description_en ||
                data.description ||
                "No description provided."}
          </p>
          <div className="space-y-3 text-[11px] font-bold text-slate-600">
            <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-xl border border-slate-100">
              <MapPin size={16} style={{ color: brandColor }} />{" "}
              {isFa ? data.address : data.address_en || data.address}
            </div>
            <div
              className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-xl border border-slate-100"
              dir="ltr"
            >
              <Phone size={16} style={{ color: brandColor }} /> {data.phone}
            </div>
          </div>
        </div>

        {/* سبد خرید شناور */}
        {data.features.is_ordering_enabled &&
          orderStatus === "shopping" &&
          cartItemCount > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10">
              <button
                onClick={() => setOrderStatus("checkout")}
                className="w-full text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart size={24} />
                    <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                      {cartItemCount}
                    </span>
                  </div>
                  <span className="font-black text-sm">{t.checkout}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg">
                    {formatPrice(cartTotal)}
                  </span>
                  {isFa ? (
                    <ChevronLeft size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </button>
            </div>
          )}

        {/* مودال پیگیری/تکمیل سفارش */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
              {orderStatus === "checkout" ? (
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-lg text-slate-800">
                      {t.checkout_title}
                    </h3>
                    <button
                      onClick={() => setOrderStatus("shopping")}
                      className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <X size={20} className="text-slate-600" />
                    </button>
                  </div>

                  <div className="mb-4 space-y-3 shrink-0">
                    {tableFromUrl ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3.5 text-sm font-black text-orange-600 flex items-center justify-center gap-2 shadow-inner">
                        <CheckCircle2 size={18} />
                        {isFa
                          ? `ثبت سفارش برای میز ${tableFromUrl}`
                          : `Ordering for Table ${tableFromUrl}`}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={
                          isFa
                            ? "شماره میز یا نام خود را وارد کنید"
                            : "Enter table number or name"
                        }
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      />
                    )}

                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-500 flex items-center justify-center gap-2 text-center mt-2 shadow-inner">
                      <Receipt size={18} className={isFa ? "ml-1" : "mr-1"} />
                      {isFa
                        ? "نحوه پرداخت: تسویه در صندوق"
                        : "Payment Method: Pay at Cashier"}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-100 mb-6 flex-1 overflow-y-auto hide-scrollbar space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm border-b border-slate-200 border-dashed pb-3 last:border-0 last:pb-0"
                      >
                        <span className="font-black text-slate-700">
                          <span
                            style={{ color: brandColor }}
                            className={isFa ? "ml-2" : "mr-2"}
                          >
                            x{item.qty}
                          </span>
                          {isFa ? item.name : item.name_en || item.name}
                        </span>
                        <span className="font-bold text-slate-600">
                          {formatPrice(getNumericPrice(item.price) * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-4 border-t border-slate-200">
                      <span className="font-black text-slate-500">
                        {t.final}
                      </span>
                      <span className="font-black text-lg text-slate-800">
                        {formatPrice(cartTotal)}{" "}
                        <span className="text-[10px] text-slate-400">
                          {t.currency}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={
                      isSubmitting || (!tableFromUrl && !tableNumber.trim())
                    }
                    onClick={handleFinalCheckout}
                    className="shrink-0 w-full text-white py-4 rounded-2xl font-black flex justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
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
                <div className="p-8 bg-slate-50 flex flex-col items-center text-center rounded-t-[32px] sm:rounded-[32px]">
                  <div
                    className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-4 shadow-inner border border-slate-100"
                    style={{
                      backgroundColor: `${brandColor}20`,
                      color: brandColor,
                    }}
                  >
                    <Receipt size={36} />
                  </div>
                  <h2 className="text-2xl font-black mb-2 text-slate-800">
                    {t.order_placed}
                  </h2>
                  <p className="text-xs font-bold text-slate-500 mb-8 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">
                    {t.receipt} #{registeredOrderId || "1000"}
                  </p>

                  <div
                    className="w-full bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm relative mb-8"
                    dir={isFa ? "rtl" : "ltr"}
                  >
                    <div
                      className={`absolute ${isFa ? "right-9" : "left-9"} top-10 bottom-10 w-1 bg-slate-100 rounded-full z-0`}
                    ></div>
                    <div className="space-y-8 relative z-10">
                      {dynamicStages.map((stage, idx) => {
                        const isActive = idx === currentStageIndex;
                        const isCompleted = idx < currentStageIndex;
                        const StageIcon = getStageIcon(
                          idx,
                          dynamicStages.length,
                        );
                        const stageLabel = isFa
                          ? stage.name
                          : stage.name_en || stage.name;

                        return (
                          <div
                            key={stage.id}
                            className={`flex items-center gap-4 transition-all duration-500 ${idx > currentStageIndex ? "opacity-40 grayscale" : ""}`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${isActive || isCompleted ? "bg-white" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                              style={{
                                borderColor:
                                  isActive || isCompleted ? brandColor : "",
                                color:
                                  isActive || isCompleted ? brandColor : "",
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={24} />
                              ) : (
                                <StageIcon size={24} />
                              )}
                            </div>
                            <div className={isFa ? "text-right" : "text-left"}>
                              <h4
                                className={`font-black text-sm ${isActive || isCompleted ? "text-slate-800" : "text-slate-500"}`}
                              >
                                {stageLabel}
                              </h4>
                              {isActive && (
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-1">
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
                    className="w-full text-white py-4 rounded-xl font-black shadow-lg hover:shadow-xl transition-shadow active:scale-95"
                    style={{ backgroundColor: brandColor }}
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

export default OneDemo;
