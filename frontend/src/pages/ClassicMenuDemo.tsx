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
  name: "رستوران کلاسیک دمو",
  about_us: "اصالت در هر طعم. تجربه‌ای لوکس و سنتی در محیطی آرام‌بخش.",
  address: "تهران، نیاوران، خیابان کلاسیک، ساختمان دمو",
  phone: "021-99887766",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "amber",
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "پیش غذا",
    items: [
      {
        id: 101,
        name: "سوپ قارچ ویژه",
        price: 65000,
        description: "قارچ تازه، خامه، سبزیجات معطر",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
      },
    ],
  },
  {
    id: 2,
    name: "غذای اصلی",
    items: [
      {
        id: 201,
        name: "چلو کباب سلطانی",
        price: 450000,
        description: "برنج ایرانی، کباب برگ، کباب کوبیده مخصوص",
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

export const ClassicDemo = () => {
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
      className="min-h-screen bg-[#f5f3ef] flex justify-center font-sans text-[#2c2c2c]"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#faf9f6] min-h-screen shadow-2xl relative overflow-x-hidden border-x border-[#e8e4d9] pb-24 flex flex-col">
        <div className="pt-12 pb-8 px-6 flex flex-col items-center text-center relative">
          <div
            className="absolute top-0 left-0 right-0 h-32 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#2c2c2c 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
          <div
            className="relative z-10 w-24 h-24 p-1 rounded-full border-2 border-double mb-4 bg-[#faf9f6]"
            style={{ borderColor: brandColor }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white shadow-md flex justify-center items-center">
              <img
                src={MOCK_VENUE.logo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1
            className="text-3xl font-black text-[#1a1a1a] mb-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {MOCK_VENUE.name}
          </h1>
          <div className="flex items-center justify-center gap-3 w-full max-w-[200px]">
            <div className="flex-1 h-px bg-[#e8e4d9]"></div>
            <div
              className="w-1.5 h-1.5 rotate-45"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex-1 h-px bg-[#e8e4d9]"></div>
          </div>
          <p className="text-[13px] font-bold text-[#737373] mt-3">
            {MOCK_VENUE.about_us}
          </p>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-[#faf9f6] border border-[#d4d0c5] flex items-center px-4 py-3 rounded-lg shadow-inner">
            <Search className="text-[#a3a3a3] shrink-0" size={18} />
            <input
              type="text"
              placeholder="جستجو در منو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pr-3 text-[#1a1a1a] font-medium text-sm"
            />
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-sm border-y border-[#e8e4d9] py-3 shadow-sm mb-6">
          <div
            className="flex overflow-x-auto px-4 gap-3 snap-x hide-scrollbar"
            style={{ scrollbarWidth: "none" }}
          >
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="snap-center shrink-0 px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold border transition-all"
                style={{
                  backgroundColor:
                    activeCategory === cat.id ? brandColor : "#ffffff",
                  color: activeCategory === cat.id ? "#ffffff" : "#737373",
                  borderColor:
                    activeCategory === cat.id ? brandColor : "#e8e4d9",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 space-y-10 pb-12">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-black text-[#1a1a1a]">
                  {category.name}
                </h2>
                <div className="flex-1 border-b border-dashed border-[#d4d0c5]"></div>
              </div>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const qty = getItemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-3 flex gap-4 shadow-sm border border-[#e8e4d9]"
                    >
                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#f5f3ef] border border-[#e8e4d9] p-0.5">
                        <img
                          src={item.image}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-[#1a1a1a] text-[15px] mb-1.5">
                            {item.name}
                          </h3>
                          <p className="text-xs text-[#737373] line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div
                            className="font-bold text-base px-3 py-1 rounded-md border border-[#e8e4d9]"
                            style={{ color: brandColor }}
                          >
                            {item.price.toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] text-[#a3a3a3]">
                              تومان
                            </span>
                          </div>
                          <div className="flex items-center">
                            {qty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-[#faf9f6] border border-[#e8e4d9] rounded-md p-1">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 flex items-center justify-center"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-5 text-center font-bold text-sm">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 flex items-center justify-center text-white rounded"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 rounded-md border border-[#e8e4d9] bg-[#faf9f6] flex items-center justify-center"
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
            </div>
          ))}
        </div>

        <div className="mt-auto px-6 pb-20 pt-10 bg-[#e8e4d9]/30 border-t-4 border-double border-[#d4d0c5]">
          <div className="bg-[#faf9f6] rounded-xl p-8 border border-[#d4d0c5] shadow-sm relative text-center">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#e8e4d9]/30 px-4 py-1 rounded-full">
              <Store size={28} style={{ color: brandColor }} />
            </div>
            <h3
              className="text-xl font-black text-[#1a1a1a] mt-4 mb-4"
              style={{ fontFamily: "Georgia, serif" }}
            >
              درباره مجموعه
            </h3>
            <div className="w-12 h-px bg-[#d4d0c5] mx-auto mb-4"></div>
            <p className="text-sm text-[#525252] leading-loose text-justify mb-8 font-medium">
              {MOCK_VENUE.about_us}
            </p>
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="flex-1 h-px bg-[#d4d0c5]"></div>
              <span className="text-[10px] text-[#a3a3a3] font-bold uppercase">
                Powered by MenuJet
              </span>
              <div className="flex-1 h-px bg-[#d4d0c5]"></div>
            </div>
          </div>
        </div>

        {orderStatus === "shopping" && cartItemCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setOrderStatus("checkout")}
              className="w-full text-white p-4 rounded-2xl shadow-xl flex items-center justify-between"
              style={{ backgroundColor: brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                </div>
                <span className="font-bold text-sm">مشاهده فیش سفارش</span>
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] flex flex-col p-6 border-4 border-double border-[#e8e4d9]">
              {orderStatus === "checkout" ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3
                      className="font-black text-lg"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      تکمیل سفارش دمو
                    </h3>
                    <button onClick={() => setOrderStatus("shopping")}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="bg-[#faf9f6] border border-[#d4d0c5] rounded-xl p-4 mb-6 space-y-3">
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
                    className="w-full text-white py-4 rounded-xl font-bold flex justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "ثبت نهایی سفارش"
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2
                    size={64}
                    className="mx-auto mb-4"
                    style={{ color: brandColor }}
                  />
                  <h2
                    className="text-2xl font-black mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    سفارش با موفقیت ثبت شد
                  </h2>
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="mt-8 text-slate-600 font-bold border border-[#d4d0c5] bg-[#faf9f6] px-6 py-2 rounded-xl"
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
export default ClassicDemo;
