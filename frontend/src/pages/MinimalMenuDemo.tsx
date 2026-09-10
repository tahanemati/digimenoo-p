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

// همان دیتای تستی بالا
const MOCK_VENUE = {
  name: "کافه مینیمال",
  about_us: "زیبایی در سادگی است. قهوه‌های تخصصی در محیطی آرام.",
  address: "تهران، شهرک غرب، خیابان مینیمال، پلاک ۲",
  phone: "021-87654321",
  logo: "",
  brand_color: "rose",
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "اسپرسو بار",
    items: [
      {
        id: 101,
        name: "سینگل اوریجین",
        price: 95000,
        description: "دانه قهوه اتیوپی، اسیدیته ملایم",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    id: 2,
    name: "بیکری",
    items: [
      {
        id: 201,
        name: "کرواسان بادام",
        price: 110000,
        description: "پخت روز، کرم بادام دست‌ساز",
        image:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
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

export const MinimalDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
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
      className="min-h-screen bg-[#fafafa] flex justify-center font-sans text-zinc-900"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#fafafa] min-h-screen relative overflow-x-hidden selection:bg-zinc-200 flex flex-col">
        <div className="pt-20 pb-10 px-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full mb-8 border border-zinc-200 flex items-center justify-center bg-zinc-100">
            <Store size={28} className="text-zinc-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-4">
            {MOCK_VENUE.name}
          </h1>
          <p
            className="text-[11px] uppercase tracking-[0.3em] font-bold"
            style={{ color: brandColor }}
          >
            Aesthetics of Taste
          </p>
        </div>

        <div className="px-8 mb-8 sticky top-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-zinc-200 flex items-center px-5 py-3">
            <Search className="text-zinc-400 shrink-0" size={18} />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-zinc-800 font-bold text-sm"
            />
          </div>
        </div>

        <div className="sticky top-[84px] z-40 px-6 mb-12 flex justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-2xl border border-zinc-200/80 shadow-sm rounded-full p-1.5 flex gap-1 pointer-events-auto overflow-x-auto hide-scrollbar">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-5 py-2.5 rounded-full text-[13px] font-bold transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "transparent",
                  color: activeCategory === cat.id ? "#fff" : "#a1a1aa",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-8 space-y-24 pb-12">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <h2
                className="text-3xl font-black mb-10 tracking-tight"
                style={{ color: brandColor }}
              >
                {category.name}.
              </h2>
              <div className="flex flex-col gap-12">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div key={item.id} className="flex gap-6 items-start group">
                      <div className="flex-1 pt-1">
                        <div className="flex justify-between items-baseline mb-2 gap-4">
                          <h3 className="font-bold text-lg text-zinc-900">
                            {item.name}
                          </h3>
                          <div className="flex-1 border-b border-dotted border-zinc-300 mx-2 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex items-center gap-3">
                            <div
                              className="font-bold text-lg font-mono tracking-tighter"
                              style={{ color: brandColor }}
                            >
                              {(item.price / 1000).toLocaleString("fa-IR")}
                              <span className="text-[10px] font-sans text-zinc-400 mr-1 font-normal">
                                هزار
                              </span>
                            </div>
                            {qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-1">
                                <button onClick={() => removeFromCart(item.id)}>
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-mono font-black">
                                  {qty}
                                </span>
                                <button onClick={() => addToCart(item)}>
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-full border border-zinc-200 hover:border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-950 transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] text-zinc-500 leading-relaxed max-w-[85%]">
                          {item.description}
                        </p>
                      </div>
                      <div className="w-20 h-28 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/50">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto px-8 pb-20 pt-16 bg-white border-t border-zinc-200/50 rounded-t-[40px]">
          <div className="flex flex-col items-center">
            <h3 className="text-2xl font-black mb-6 tracking-tight text-zinc-900">
              درباره ما.
            </h3>
            <p className="text-sm text-zinc-500 leading-loose text-center mb-10 font-medium max-w-sm">
              {MOCK_VENUE.about_us}
            </p>
            <div className="w-full h-px bg-zinc-100 mb-8"></div>
            <span className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase">
              Designed by MenuJet
            </span>
          </div>
        </div>

        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-full shadow-xl flex items-center justify-between"
              style={{ backgroundColor: "#18181B" }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <span className="font-bold text-sm">
                  {cartItemCount} مورد انتخاب شده
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">
                  {cartTotal.toLocaleString("fa-IR")} تومان
                </span>
                <ChevronLeft size={20} />
              </div>
            </button>
          </div>
        )}

        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col p-8">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl tracking-tighter">
                      سفارش شما.
                    </h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={24} />
                    </button>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 rounded-full font-black text-lg"
                    style={{ backgroundColor: "#18181B" }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin mx-auto" />
                    ) : (
                      "پرداخت دمو"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={80}
                    className="mx-auto mb-6"
                    style={{ color: brandColor }}
                  />
                  <h2 className="text-3xl font-black tracking-tighter mb-2">
                    ثبت شد.
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-zinc-500 font-bold bg-zinc-100 px-8 py-3 rounded-full"
                  >
                    بستن
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
export default MinimalTheme;
