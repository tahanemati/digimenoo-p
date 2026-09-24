import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle2,
  X,
  Loader2,
  Search,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Globe,
  BellRing,
  ChefHat,
} from "lucide-react";

// =====================================
// دیتای تستی (طراحی شده برای مقیاس بالا)
// =====================================
const MOCK_VENUE = {
  name_fa: "مگا منو دمو",
  name_en: "Mega Menu Demo",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "#2563eb", // Blue
  is_waiter_enabled: true, // 🔴 فعال شدن گارسون
  is_chef_request_enabled: true, // 🔴 فعال شدن آشپز
};

const MOCK_CATEGORIES = [
  { id: 1, name_fa: "پیتزاهای ایتالیایی", name_en: "Italian Pizzas" },
  { id: 2, name_fa: "برگرهای دست‌ساز", name_en: "Handmade Burgers" },
  { id: 3, name_fa: "نوشیدنی‌های گرم", name_en: "Hot Beverages" },
  { id: 4, name_fa: "نوشیدنی‌های سرد", name_en: "Cold Drinks" },
  { id: 5, name_fa: "پیش‌غذا و سالاد", name_en: "Starters & Salads" },
  { id: 6, name_fa: "دسرهای ویژه", name_en: "Special Desserts" },
];

const MOCK_ITEMS = [
  {
    id: 101,
    category_id: 1,
    name_fa: "پیتزا مارگاریتا",
    name_en: "Margherita Pizza",
    price: 180000,
    desc_fa: "خمیر ناپولی، سس گوجه، ریحان، پنیر موزارلا تازه",
    desc_en: "Napoli dough, tomato sauce, basil, fresh mozzarella",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=150&h=150&fit=crop",
  },
  {
    id: 102,
    category_id: 1,
    name_fa: "پیتزا پپرونی",
    name_en: "Pepperoni Pizza",
    price: 240000,
    desc_fa: "خمیر ناپولی، پپرونی ۹۰٪، هالوپینو",
    desc_en: "Napoli dough, 90% pepperoni, jalapeno",
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=150&h=150&fit=crop",
  },
  {
    id: 201,
    category_id: 2,
    name_fa: "ماشروم برگر",
    name_en: "Mushroom Burger",
    price: 220000,
    desc_fa: "گوشت گوساله، سس قارچ، پنیر گودا",
    desc_en: "Beef, mushroom sauce, gouda cheese",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop",
  },
  {
    id: 202,
    category_id: 2,
    name_fa: "چیز برگر کلاسیک",
    name_en: "Classic Cheeseburger",
    price: 190000,
    desc_fa: "گوشت خالص، پنیر چدار، کاهو، گوجه",
    desc_en: "Pure beef, cheddar, lettuce, tomato",
    image:
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=150&h=150&fit=crop",
  },
  {
    id: 301,
    category_id: 3,
    name_fa: "کاپوچینو",
    name_en: "Cappuccino",
    price: 85000,
    desc_fa: "اسپرسو دبل، فوم شیر مخملی",
    desc_en: "Double espresso, velvet milk foam",
    image:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?w=150&h=150&fit=crop",
  },
  {
    id: 401,
    category_id: 4,
    name_fa: "موهیتو توت‌فرنگی",
    name_en: "Strawberry Mojito",
    price: 95000,
    desc_fa: "توت‌فرنگی تازه، نعناع، لیمو، سودا",
    desc_en: "Fresh strawberry, mint, lime, soda",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&h=150&fit=crop",
  },
  {
    id: 501,
    category_id: 5,
    name_fa: "سیب‌زمینی آلفردو",
    name_en: "Alfredo Fries",
    price: 120000,
    desc_fa: "سیب سرخ‌شده با سس خامه و قارچ",
    desc_en: "Fries with cream & mushroom sauce",
    image:
      "https://images.unsplash.com/photo-1576107249870-13ee24fbc11f?w=150&h=150&fit=crop",
  },
  {
    id: 601,
    category_id: 6,
    name_fa: "تیرامیسو",
    name_en: "Tiramisu",
    price: 110000,
    desc_fa: "لیدی فینگر، ماسکارپونه، قهوه",
    desc_en: "Ladyfingers, mascarpone, coffee",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1ea510?w=150&h=150&fit=crop",
  },
];

const TRANSLATIONS = {
  fa: {
    categories: "دسته‌بندی‌ها",
    search: "جستجو در منو...",
    add: "افزودن",
    checkout: "مشاهده سبد خرید",
    total: "جمع کل",
    pay: "پرداخت نهایی",
    success: "سفارش ثبت شد",
    receipt: "کد پیگیری",
    back: "بازگشت",
    items: "آیتم",
    currency: "تومان",
    not_found: "محصولی یافت نشد.",
    waiter: "احضار گارسون",
    chef: "درخواست آشپز", // 🔴 اضافه‌شده
  },
  en: {
    categories: "Categories",
    search: "Search menu...",
    add: "Add",
    checkout: "View Cart",
    total: "Total",
    pay: "Final Pay",
    success: "Order Placed",
    receipt: "Order ID",
    back: "Back",
    items: "items",
    currency: "Toman",
    not_found: "No products found.",
    waiter: "Call Waiter",
    chef: "Call Chef", // 🔴 اضافه‌شده
  },
};

export const OrbitalDemo = () => {
  const [lang, setLang] = useState<"fa" | "en">("fa");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<
    "shopping" | "checkout" | "tracking"
  >("shopping");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[lang];
  const isFa = lang === "fa";
  const brandColor = MOCK_VENUE.brand_color;

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

  // پرش به دسته‌بندی و بستن مودال
  const scrollToCategory = (categoryId: number) => {
    setIsCategoryModalOpen(false);
    const element = document.getElementById(`cat-${categoryId}`);
    if (element) {
      const yOffset = -80;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleFinalCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderStatus("tracking");
      setCart([]);
    }, 1500);
  };

  // فیلتر کردن آیتم‌ها بر اساس سرچ
  const filteredItems = MOCK_ITEMS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (isFa ? item.name_fa : item.name_en) || "";
    return name.toLowerCase().includes(q);
  });

  return (
    <div
      className="min-h-screen bg-[#f2f2f7] flex justify-center font-sans text-[#1c1c1e]"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-[#f2f2f7] min-h-screen relative flex flex-col overflow-x-hidden border-x border-[#e5e5ea] pb-32">
        {/* ======================================= */}
        {/* هدر شیشه‌ای و سرچ‌بار */}
        {/* ======================================= */}
        <div className="sticky top-0 z-40 bg-[#f2f2f7]/80 backdrop-blur-xl border-b border-[#e5e5ea] px-4 pt-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={MOCK_VENUE.logo}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl font-black tracking-tight">
                {isFa ? MOCK_VENUE.name_fa : MOCK_VENUE.name_en}
              </h1>
            </div>
            <button
              onClick={toggleLang}
              className="bg-white border border-[#e5e5ea] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Globe size={14} /> {isFa ? "EN" : "فا"}
            </button>
          </div>

          <div className="bg-white border border-[#e5e5ea] rounded-[14px] p-1 flex items-center shadow-sm">
            <div className="pl-3 pr-3 text-[#8e8e93]">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-2 text-sm font-semibold placeholder:text-[#8e8e93]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-2 text-[#8e8e93]"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ======================================= */}
        {/* دسترسی‌های سریع (گارسون و آشپز) */}
        {/* ======================================= */}
        <div className="px-4 mt-5 flex gap-3 relative z-10">
          {MOCK_VENUE.is_waiter_enabled && (
            <button
              onClick={() => alert("گارسون احضار شد")}
              className="flex-1 bg-white border border-[#e5e5ea] rounded-[18px] p-3 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 transition-transform"
            >
              <BellRing size={20} style={{ color: brandColor }} />
              <span className="text-[11px] font-bold text-[#1c1c1e]">
                {t.waiter}
              </span>
            </button>
          )}
          {MOCK_VENUE.is_chef_request_enabled && (
            <button
              onClick={() => alert("درخواست سرآشپز ثبت شد")}
              className="flex-1 bg-white border border-[#e5e5ea] rounded-[18px] p-3 flex flex-col items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95 transition-transform"
            >
              <ChefHat size={20} style={{ color: brandColor }} />
              <span className="text-[11px] font-bold text-[#1c1c1e]">
                {t.chef}
              </span>
            </button>
          )}
        </div>

        {/* ======================================= */}
        {/* لیست محصولات */}
        {/* ======================================= */}
        <div className="flex-1 px-4 mt-6 space-y-8 relative z-10">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Search size={48} className="mx-auto mb-4 text-[#8e8e93]" />
              <p className="font-bold text-[#8e8e93]">{t.not_found}</p>
            </div>
          ) : (
            MOCK_CATEGORIES.map((category) => {
              const categoryItems = filteredItems.filter(
                (i) => i.category_id === category.id,
              );
              if (categoryItems.length === 0) return null;

              return (
                <div
                  key={category.id}
                  id={`cat-${category.id}`}
                  className="scroll-mt-32"
                >
                  <h2 className="text-lg font-black mb-3 px-1 text-[#1c1c1e] sticky top-[135px] bg-[#f2f2f7]/90 backdrop-blur-md py-2 z-20">
                    {isFa ? category.name_fa : category.name_en}
                  </h2>

                  <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#e5e5ea]">
                    {categoryItems.map((item, index) => {
                      const qty = getItemQty(item.id);
                      const isLast = index === categoryItems.length - 1;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 flex gap-4 ${!isLast ? "border-b border-[#f2f2f7]" : ""}`}
                        >
                          <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-[#f2f2f7]">
                            <img
                              src={item.image}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <h3 className="font-bold text-[#1c1c1e] text-[15px] mb-1 leading-tight">
                                {isFa ? item.name_fa : item.name_en}
                              </h3>
                              <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed font-medium">
                                {isFa ? item.desc_fa : item.desc_en}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div
                                className="font-black text-sm"
                                style={{ color: brandColor }}
                              >
                                {formatPrice(item.price)}{" "}
                                <span className="text-[10px] text-[#8e8e93] font-bold">
                                  {t.currency}
                                </span>
                              </div>

                              <div className="flex items-center">
                                {qty > 0 ? (
                                  <div className="flex items-center gap-3 bg-[#f2f2f7] rounded-full p-1 border border-[#e5e5ea]">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#1c1c1e] shadow-sm"
                                    >
                                      <Minus size={14} strokeWidth={2.5} />
                                    </button>
                                    <span className="w-3 text-center font-black text-sm">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm"
                                      style={{ backgroundColor: brandColor }}
                                    >
                                      <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="bg-[#f2f2f7] text-[#2563eb] font-bold text-xs px-4 py-2 rounded-full hover:bg-[#e5e5ea] transition-colors flex items-center gap-1"
                                  >
                                    <Plus size={14} strokeWidth={3} /> {t.add}
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
              );
            })
          )}
        </div>

        {/* ======================================= */}
        {/* نوار شناور پایین (فهرست دسته‌ها + سبد خرید) */}
        {/* ======================================= */}
        {orderStatus === "shopping" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 flex gap-2 animate-in slide-in-from-bottom-10">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex-1 bg-[#1c1c1e]/90 backdrop-blur-xl text-white rounded-[20px] p-4 flex items-center justify-center gap-2 font-black shadow-xl active:scale-95 transition-transform border border-white/10"
            >
              <LayoutGrid size={20} />
              {t.categories}
            </button>

            {cartItemCount > 0 && (
              <button
                onClick={() => setOrderStatus("checkout")}
                className="flex-[1.5] text-white rounded-[20px] p-4 flex items-center justify-between font-black shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
                style={{ backgroundColor: brandColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    <span className="absolute -top-2 -right-2 bg-white text-[#2563eb] w-4 h-4 text-[9px] flex items-center justify-center rounded-full">
                      {cartItemCount}
                    </span>
                  </div>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {isFa ? (
                  <ChevronLeft size={20} strokeWidth={3} />
                ) : (
                  <ChevronRight size={20} strokeWidth={3} />
                )}
              </button>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* مودال ۱۰۰ دسته‌بندی */}
        {/* ======================================= */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-[#f2f2f7] w-full max-w-md max-h-[80%] rounded-t-[32px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300">
              <div className="p-5 flex justify-between items-center bg-white rounded-t-[32px] border-b border-[#e5e5ea] sticky top-0">
                <h3 className="font-black text-lg">{t.categories}</h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-[#f2f2f7] p-2 rounded-full text-[#8e8e93] hover:text-[#1c1c1e]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-4 hide-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className="bg-white border border-[#e5e5ea] p-4 rounded-[20px] text-center font-bold text-[#1c1c1e] text-sm shadow-sm hover:border-[#2563eb] transition-colors active:scale-95"
                    >
                      {isFa ? cat.name_fa : cat.name_en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* مودال تسویه حساب و پیگیری */}
        {/* ======================================= */}
        {orderStatus !== "shopping" && (
          <div className="fixed inset-0 z-[80] bg-white flex flex-col w-full max-w-md mx-auto animate-in slide-in-from-right-full duration-300">
            {orderStatus === "checkout" && (
              <div className="flex flex-col h-full bg-[#f2f2f7]">
                <div className="bg-white px-4 py-5 flex items-center justify-between border-b border-[#e5e5ea] sticky top-0 z-10">
                  <button
                    onClick={() => setOrderStatus("shopping")}
                    className="text-[#2563eb] p-1"
                  >
                    <X size={24} />
                  </button>
                  <h3 className="font-black text-lg">{t.checkout}</h3>
                  <div className="w-6"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                  <div className="bg-white rounded-[24px] border border-[#e5e5ea] p-4 shadow-sm">
                    {cart.map((item: any, idx) => (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center py-4 ${idx !== cart.length - 1 ? "border-b border-[#f2f2f7]" : ""}`}
                      >
                        <span className="font-bold text-[15px] text-[#1c1c1e]">
                          <span className="bg-[#f2f2f7] text-[#2563eb] px-2 py-0.5 rounded-md text-xs mr-2 ml-2">
                            x{item.qty}
                          </span>
                          {isFa ? item.name_fa : item.name_en}
                        </span>
                        <span className="font-bold text-[15px]">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 border-t border-[#e5e5ea] shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-[#8e8e93]">{t.total}:</span>
                    <span className="font-black text-2xl text-[#1c1c1e]">
                      {formatPrice(cartTotal)}{" "}
                      <span className="text-xs font-bold text-[#8e8e93]">
                        {t.currency}
                      </span>
                    </span>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={handleFinalCheckout}
                    className="w-full text-white py-4 h-14 rounded-[18px] font-black flex justify-center items-center active:scale-95 transition-transform text-lg shadow-lg"
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
              <div className="flex flex-col h-full bg-white items-center justify-center text-center p-6">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-[#eff6ff] text-[#2563eb]">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black text-[#1c1c1e] mb-2 tracking-tight">
                  {t.success}
                </h2>
                <p className="text-sm font-bold text-[#8e8e93] mb-10 bg-[#f2f2f7] px-4 py-1.5 rounded-full">
                  {t.receipt} #1042
                </p>
                <button
                  onClick={() => setOrderStatus("shopping")}
                  className="w-full text-white font-black py-4 rounded-[18px] transition-colors mt-auto mb-4"
                  style={{ backgroundColor: brandColor }}
                >
                  {t.back}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrbitalDemo;
