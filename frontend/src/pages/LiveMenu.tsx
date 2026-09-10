import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom"; // 🔴 اضافه شدن useSearchParams
import { publicApi } from "../service/api";
import {
  Store,
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  CheckCircle2,
  X,
  Loader2,
  Search,
  BellRing,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number | string;
  description: string;
  image: string;
  is_available: boolean;
  stock?: number | string | null;
};
type Category = { id: number; name: string; items: Product[] };
type CartItem = { id: number; name: string; price: number; qty: number };

const HEX_COLORS: Record<string, string> = {
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#a855f7",
};

interface ThemeProps {
  venue: any;
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  brandColor: string;
  cart: CartItem[];
  addToCart: (item: Product) => void;
  removeFromCart: (id: number) => void;
  getItemQty: (id: number) => number;
  cartTotal: number;
  cartItemCount: number;
  orderStatus: "shopping" | "checkout" | "success";
  setOrderStatus: (s: "shopping" | "checkout" | "success") => void;
  paymentMethod: "online" | "cashier";
  setPaymentMethod: (m: "online" | "cashier") => void;
  handleFinalCheckout: () => void;
  isSubmitting: boolean;
}

const SharedCartAndCheckout = ({
  brandColor,
  cart,
  cartTotal,
  cartItemCount,
  orderStatus,
  setOrderStatus,
  paymentMethod,
  setPaymentMethod,
  handleFinalCheckout,
  venue,
  isSubmitting,
}: any) => {
  if (
    !venue?.is_ordering_enabled ||
    (orderStatus === "shopping" && cartItemCount === 0)
  )
    return null;
  return (
    <>
      {orderStatus === "shopping" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button
            onClick={() => setOrderStatus("checkout")}
            className="w-full text-white p-4 rounded-2xl shadow-xl flex items-center justify-between"
            style={{ backgroundColor: brandColor }}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} />
              <span className="font-bold text-sm">مشاهده سفارش</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">
                {cartTotal.toLocaleString("fa-IR")} تومان
              </span>
            </div>
          </button>
        </div>
      )}
      {orderStatus !== "shopping" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-[90vh] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="px-6 py-4 flex justify-between border-b border-slate-100">
              <h3 className="font-black text-lg">
                {orderStatus === "checkout" ? "تکمیل سفارش" : "ثبت شد"}
              </h3>
              {orderStatus === "checkout" && (
                <button
                  onClick={() => setOrderStatus("shopping")}
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {orderStatus === "checkout" ? (
                <>
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                    {cart.map((item: any) => (
                      <div key={item.id} className="flex justify-between mb-2">
                        <span className="font-bold">
                          {item.name} x{item.qty}
                        </span>
                        <span>
                          {(item.price * item.qty).toLocaleString("fa-IR")}
                        </span>
                      </div>
                    ))}
                    <div
                      className="mt-4 pt-4 border-t flex justify-between font-black text-lg"
                      style={{ color: brandColor }}
                    >
                      <span>جمع کل:</span>
                      <span>{cartTotal.toLocaleString("fa-IR")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setPaymentMethod("online")}
                      className={`p-4 rounded-2xl border-2 font-bold ${paymentMethod === "online" ? "border-slate-800" : "border-slate-200"}`}
                    >
                      آنلاین
                    </button>
                    {venue?.allow_cashier_payment && (
                      <button
                        onClick={() => setPaymentMethod("cashier")}
                        className={`p-4 rounded-2xl border-2 font-bold ${paymentMethod === "cashier" ? "border-slate-800" : "border-slate-200"}`}
                      >
                        صندوق
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={48}
                    className="mx-auto text-emerald-500 mb-4"
                  />
                  <h2 className="text-2xl font-black mb-2">سفارش ثبت شد!</h2>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              {orderStatus === "checkout" ? (
                <button
                  disabled={isSubmitting}
                  onClick={handleFinalCheckout}
                  className="w-full text-white py-4 rounded-2xl font-black flex justify-center"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "تایید و ثبت"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setOrderStatus("shopping")}
                  className="w-full bg-slate-100 py-4 rounded-2xl font-black"
                >
                  بازگشت
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ModernTheme = ({
  venue,
  categories,
  searchQuery,
  setSearchQuery,
  brandColor,
  cart,
  addToCart,
  removeFromCart,
  getItemQty,
  cartTotal,
  cartItemCount,
  orderStatus,
  setOrderStatus,
  paymentMethod,
  setPaymentMethod,
  handleFinalCheckout,
  isSubmitting,
}: ThemeProps) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  return (
    <div
      className="min-h-screen bg-slate-50 flex justify-center font-sans text-slate-800"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-x-hidden pb-24 flex flex-col">
        <div
          className="relative h-56 w-full overflow-hidden transition-colors duration-500"
          style={{ backgroundColor: brandColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20"></div>
        </div>
        <div className="bg-slate-50 -mt-10 rounded-t-[40px] relative z-10 pt-14 pb-6 px-4 flex flex-col items-center">
          <div className="absolute -top-14 w-28 h-28 rounded-[32px] border-4 border-slate-50 bg-white overflow-hidden shadow-xl flex items-center justify-center">
            {venue?.logo ? (
              <img
                src={venue.logo}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={48} className="text-slate-300" />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {venue?.name || "رستوران"}
          </h1>
        </div>
        <div className="px-5 mb-4 sticky top-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white flex items-center px-4 py-3.5">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-sm font-bold"
            />
          </div>
        </div>
        {categories.length > 0 && (
          <div className="sticky top-[88px] z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 py-3 mb-2">
            <div
              className="flex overflow-x-auto px-5 gap-3 snap-x hide-scrollbar"
              style={{ scrollbarWidth: "none" }}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      document
                        .getElementById(`category-${cat.id}`)
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className="snap-center shrink-0 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-bold border transition-all"
                    style={{
                      backgroundColor: isActive ? brandColor : "#ffffff",
                      color: isActive ? "#ffffff" : "#64748b",
                      borderColor: isActive ? brandColor : "#e2e8f0",
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex-1 p-5 space-y-10 pb-10">
          {categories.map((category) => (
            <div
              key={category.id}
              id={`category-${category.id}`}
              className="scroll-mt-40"
            >
              <h2 className="text-xl font-black text-slate-800 mb-5 pr-4 relative flex items-center">
                <span
                  className="absolute right-0 w-2 h-8 rounded-full"
                  style={{ backgroundColor: brandColor }}
                ></span>
                {category.name}
              </h2>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-[24px] p-3 flex gap-4 shadow-sm border border-slate-100"
                    >
                      {item.image && (
                        <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden">
                          <img
                            src={item.image}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between py-1.5">
                        <div>
                          <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div
                            className="font-black text-lg tracking-tight"
                            style={{ color: brandColor }}
                          >
                            {Number(item.price || 0).toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              تومان
                            </span>
                          </div>
                          {venue?.is_ordering_enabled && (
                            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {qty > 0 ? (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-8 text-center font-black text-sm">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
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
        <SharedCartAndCheckout
          brandColor={brandColor}
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          orderStatus={orderStatus}
          setOrderStatus={setOrderStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleFinalCheckout={handleFinalCheckout}
          venue={venue}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export const LiveMenu = () => {
  const { englishName } = useParams<{ englishName: string }>();
  // 🔴 هوک گرفتن شماره میز از آدرس بارکد (URL)
  const [searchParams] = useSearchParams();
  const tableFromUrl = searchParams.get("table") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [menuData, setMenuData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cashier">(
    "online",
  );
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "success"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isMenuBlocked, setIsMenuBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await publicApi.getLiveMenu(englishName || "");
        setMenuData(data);
      } catch (err: any) {
        // 🔴 بررسی اینکه آیا ۷ روز مهلت تموم شده و منو مسدوده یا نه
        if (err.error) {
          setIsMenuBlocked(true);
          setBlockMessage(err.error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, [englishName]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          qty: 1,
        },
      ];
    });
  };
  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.qty > 1)
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i));
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleFinalCheckout = async () => {
    setIsSubmitting(true);
    try {
      // 🔴 ارسال میز دقیق به سرور بر اساس بارکد اسکن شده
      await publicApi.submitOrder(englishName || "", {
        table_number: tableFromUrl
          ? `میز ${tableFromUrl.padStart(2, "0")}`
          : "میز نامشخص",
        payment_method: paymentMethod,
        total_price: cartTotal,
        items: cart.map((c) => ({ id: c.id, qty: c.qty })),
      });
      setOrderStatus("success");
      setCart([]);
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallWaiter = async () => {
    if (!tableFromUrl) return alert("شماره میز از روی QR مشخص نیست!");
    setIsCallingWaiter(true);
    try {
      await publicApi.callWaiter(englishName || "", tableFromUrl);
      alert("🔔 درخواست شما ثبت شد. گارسون در راه است.");
    } catch (err: any) {
      alert(err.error || "خطایی رخ داد.");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const getItemQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.qty,
    0,
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#030712] flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );

  // 🔴 اگر مهلت ۷ روزه تمام شده باشد، اینجا مشتری مسدود می‌شود
  if (isMenuBlocked)
    return (
      <div
        className="min-h-screen bg-[#030712] flex flex-col justify-center items-center p-8 text-center"
        dir="rtl"
      >
        <Store size={64} className="text-rose-500 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2">منو غیرفعال است</h1>
        <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
          {blockMessage}
        </p>
      </div>
    );

  if (!menuData)
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center">
        <h1 className="text-2xl font-black text-white">منو در دسترس نیست</h1>
      </div>
    );

  const { venue, categories } = menuData;
  const brandColor = HEX_COLORS[venue?.brand_color] || HEX_COLORS["emerald"];

  const filteredCategories = (Array.isArray(categories) ? categories : [])
    .map((cat: Category) => {
      const items = (Array.isArray(cat.items) ? cat.items : []).filter(
        (item) => {
          if (
            item.is_available === false ||
            item.stock === 0 ||
            String(item.stock) === "0"
          )
            return false;
          const q = (searchQuery || "").toLowerCase().trim();
          return q
            ? (item.name || "").includes(q) ||
                (item.description || "").includes(q)
            : true;
        },
      );
      return { ...cat, items };
    })
    .filter((cat: Category) => cat.items.length > 0);

  const themeProps: ThemeProps = {
    venue,
    categories: filteredCategories,
    searchQuery,
    setSearchQuery,
    brandColor,
    cart,
    addToCart,
    removeFromCart,
    getItemQty,
    cartTotal,
    cartItemCount,
    orderStatus,
    setOrderStatus,
    paymentMethod,
    setPaymentMethod,
    handleFinalCheckout,
    isSubmitting,
  };

  const FloatingWaiterButton = () => {
    if (!venue?.allow_waiter_call || orderStatus !== "shopping") return null;
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-5 z-40 pointer-events-none flex justify-end">
        <button
          onClick={handleCallWaiter}
          disabled={isCallingWaiter}
          className="pointer-events-auto bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all"
        >
          {isCallingWaiter ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <BellRing size={20} className="animate-pulse" />
          )}
          <span className="font-black text-sm">
            {isCallingWaiter ? "ارسال..." : "گارسون"}
          </span>
        </button>
      </div>
    );
  };

  return (
    <>
      <ModernTheme {...themeProps} />
      <FloatingWaiterButton />
    </>
  );
};
