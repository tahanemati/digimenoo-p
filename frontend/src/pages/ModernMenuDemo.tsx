import { useState } from "react";
import {
  Store,
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  CreditCard,
  Wallet,
  CheckCircle2,
  X,
  Loader2,
  MapPin,
  Phone,
  Search,
  AtSign,
} from "lucide-react";

const MOCK_VENUE = {
  name: "کافه رستوران دمو",
  about_us:
    "این یک صفحه تستی برای نمایش ظاهر قالب مدرن است. طعم واقعی قهوه را با ما تجربه کنید.",
  address: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "emerald",
  is_ordering_enabled: true,
  allow_cashier_payment: true,
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
};

export const ModernDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cashier">(
    "online",
  );
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "success"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);

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
      setOrderStatus("success");
      setCart([]);
    }, 1500);
  };

  const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.name.includes(searchQuery) ||
        item.description.includes(searchQuery),
    ),
  })).filter((cat) => cat.items.length > 0);

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
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-slate-50 -mt-10 rounded-t-[40px] relative z-10 pt-14 pb-6 px-4 flex flex-col items-center">
          <div className="absolute -top-14 w-28 h-28 rounded-[32px] border-4 border-slate-50 bg-white overflow-hidden shadow-xl flex items-center justify-center">
            <img
              src={MOCK_VENUE.logo}
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {MOCK_VENUE.name}
          </h1>
          <p
            className="text-sm font-bold mt-2 opacity-80"
            style={{ color: brandColor }}
          >
            {MOCK_VENUE.about_us}
          </p>
        </div>

        <div className="px-5 mb-4 sticky top-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white flex items-center px-4 py-3.5">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-slate-800 font-bold text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="sticky top-[88px] z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 py-3 mb-2">
          <div
            className="flex overflow-x-auto px-5 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-2xl font-bold border transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#fff",
                  color: activeCategory === cat.id ? "#fff" : "#64748b",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#e2e8f0",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-10 pb-10">
          {filteredCategories.map((category) => (
            <div key={category.id}>
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
                      <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1.5">
                        <div>
                          <h3 className="font-black text-slate-900 mb-1.5">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <div
                            className="font-black text-lg tracking-tight"
                            style={{ color: brandColor }}
                          >
                            {item.price.toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-slate-400">
                              تومان
                            </span>
                          </div>
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto bg-white rounded-t-[40px] pt-10 pb-24 px-6 border-t border-slate-100 relative overflow-hidden">
          <div
            className="absolute -bottom-20 -right-20 w-64 h-64 opacity-5 rounded-full"
            style={{ backgroundColor: brandColor }}
          ></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-8">
              <img
                src={MOCK_VENUE.logo}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <h3 className="text-2xl font-black text-slate-800">
                {MOCK_VENUE.name}
              </h3>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <MapPin size={20} style={{ color: brandColor }} />
                <p className="text-sm font-bold text-slate-600">
                  {MOCK_VENUE.address}
                </p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <Phone size={20} style={{ color: brandColor }} />
                <p className="text-sm font-bold text-slate-600" dir="ltr">
                  {MOCK_VENUE.phone}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-slate-50 rounded-full text-xs font-bold text-slate-400">
                Powered by MenuJet
              </div>
            </div>
          </div>
        </div>

        {/* سبد خرید */}
        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-2xl shadow-xl flex items-center justify-between transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                </div>
                <span className="font-bold text-sm">تکمیل سفارش</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {cartTotal.toLocaleString("fa-IR")}
                </span>
                <ChevronLeft size={20} />
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col p-6">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">تکمیل سفارش (تستی)</h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
                    {cart.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-bold">
                          x{item.qty} {item.name}
                        </span>
                        <span>
                          {(item.price * item.qty).toLocaleString("fa-IR")}{" "}
                          تومان
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-2xl font-black flex justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "ثبت سفارش دمو"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={64}
                    className="text-emerald-500 mx-auto mb-4"
                  />
                  <h2 className="text-2xl font-black mb-2">
                    سفارش تستی ثبت شد!
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-slate-500 font-bold bg-slate-100 px-6 py-2 rounded-xl"
                  >
                    بازگشت به منو
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
export default ModernDemo;
