import { useState, useRef, useEffect } from "react";
import {
  Settings,
  LayoutList,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Palette,
  ChevronRight,
  LayoutGrid,
  List,
  LayoutTemplate,
  CheckCircle2,
  ExternalLink,
  X,
  Camera,
  ShoppingBag,
  CreditCard,
  QrCode,
  Minus,
  Printer,
  Check,
  Loader2,
  Package,
  BellRing,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
// 🔴 api بخش مالی رو هم ایمپورت کردیم تا بتونیم پلن کاربر رو چک کنیم
import { venuesApi, menuApi, financeApi } from "../service/api";

type Product = {
  id: number;
  name: string;
  price: string;
  desc: string;
  image: string;
  stock?: number | null;
  is_available?: boolean;
};
type Category = { id: number; name: string; items: Product[] };

export const VenueSettings = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);

  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantDesc, setRestaurantDesc] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [tableCount, setTableCount] = useState(20);
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
  const [allowCashierPayment, setAllowCashierPayment] = useState(true);

  // 🔴 استیت‌های مربوط به زنگ گارسون و پلن کاربر
  const [isWaiterEnabled, setIsWaiterEnabled] = useState(true);
  const [userPlanCode, setUserPlanCode] = useState("");

  const [stepOneErrors, setStepOneErrors] = useState({
    name: false,
    desc: false,
  });

  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [themeColor, setThemeColor] = useState("emerald");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const prodImageRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catModal, setCatModal] = useState<{
    isOpen: boolean;
    data: Category | null;
  }>({ isOpen: false, data: null });
  const [catFormName, setCatFormName] = useState("");

  const [prodModal, setProdModal] = useState<{
    isOpen: boolean;
    categoryId: number | null;
    data: Product | null;
  }>({ isOpen: false, categoryId: null, data: null });

  const [prodForm, setProdForm] = useState({
    name: "",
    price: "",
    desc: "",
    stock: "",
    imagePreview: "",
    is_available: true,
  });
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [showQRPopup, setShowQRPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔴 ابتدا پلن فعلی کاربر را می‌گیریم تا بدانیم به زنگ گارسون دسترسی دارد یا خیر
        try {
          const subRes = await financeApi.getSubscription();
          // نام انگلیسی پلن را ذخیره می‌کنیم
          setUserPlanCode(
            (
              subRes.code ||
              subRes.plan_code ||
              subRes.name ||
              ""
            ).toLowerCase(),
          );
        } catch (e) {
          console.error("خطا در دریافت اطلاعات اشتراک", e);
        }

        const venueRes = await venuesApi.getMyVenue();
        if (venueRes.has_venue) {
          const v = venueRes.venue;
          setRestaurantName(v.name || "");
          setRestaurantDesc(v.about_us || "");
          setAddress(v.address || "");
          setPhone(v.phone || "");
          setTableCount(v.table_count || 20);
          setIsOrderingEnabled(v.is_ordering_enabled);
          setAllowCashierPayment(v.allow_cashier_payment !== false);

          // 🔴 وضعیت روشن/خاموش بودن زنگ گارسون رو از دیتابیس می‌خونیم
          setIsWaiterEnabled(v.is_waiter_enabled !== false);

          setSelectedTemplate(v.template || "modern");
          setThemeColor(v.brand_color || "emerald");
          if (v.logo) setLogoPreview(v.logo);

          if (v.name && v.name.trim() !== "") {
            setIsAlreadySetup(true);
            setCurrentStep(3);
          }
        }

        const menuRes = await menuApi.getCategories();
        setCategories(
          menuRes.map((c: any) => ({
            id: c.id,
            name: c.name,
            items: c.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.price.toLocaleString(),
              desc: i.description || "",
              image: i.image || "",
              stock: i.stock,
              is_available: i.is_available !== false,
            })),
          })),
        );
      } catch (error) {
        console.error("خطا در دریافت اطلاعات", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveVenueSettings = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", restaurantName);
      formData.append("about_us", restaurantDesc);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("table_count", tableCount.toString());
      formData.append("is_ordering_enabled", isOrderingEnabled.toString());
      formData.append("allow_cashier_payment", allowCashierPayment.toString());

      // 🔴 ارسال وضعیت زنگ گارسون به بک‌اند
      formData.append("is_waiter_enabled", isWaiterEnabled.toString());

      formData.append("template", selectedTemplate);
      formData.append("brand_color", themeColor);
      if (logoFile) formData.append("logo", logoFile);

      await venuesApi.updateSettings(formData);
    } catch (error) {
      console.error("خطا در ذخیره تنظیمات", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabChange = async (targetStep: 1 | 2 | 3) => {
    if (currentStep === 1 || currentStep === 2) {
      if (!restaurantName.trim() || !restaurantDesc.trim()) {
        setStepOneErrors({
          name: !restaurantName.trim(),
          desc: !restaurantDesc.trim(),
        });
        if (currentStep === 1) return;
      }
      await saveVenueSettings();
    }
    setCurrentStep(targetStep);
  };

  const handleFinalSubmit = async () => {
    if (!isAlreadySetup) await saveVenueSettings();
    setShowQRPopup(true);
  };

  // بررسی دسترسی کاربر به زنگ گارسون
  const canUseWaiter =
    userPlanCode.includes("standard") ||
    userPlanCode.includes("estandard") ||
    userPlanCode.includes("plus");

  const openCatModal = (cat: Category | null = null) => {
    setCatFormName(cat ? cat.name : "");
    setCatModal({ isOpen: true, data: cat });
  };

  const saveCategory = async () => {
    if (!catFormName.trim()) return;
    setIsSaving(true);
    try {
      if (catModal.data) {
        await menuApi.updateCategory(catModal.data.id, catFormName);
        setCategories((cats) =>
          cats.map((c) =>
            c.id === catModal.data!.id ? { ...c, name: catFormName } : c,
          ),
        );
      } else {
        const newCat = await menuApi.createCategory(catFormName);
        setCategories((cats) => [
          ...cats,
          { id: newCat.id, name: newCat.name, items: [] },
        ]);
      }
      setCatModal({ isOpen: false, data: null });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (window.confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟")) {
      try {
        await menuApi.deleteCategory(id);
        setCategories((cats) => cats.filter((c) => c.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openProdModal = (categoryId: number, prod: Product | null = null) => {
    if (prod) {
      setProdForm({
        name: prod.name,
        price: prod.price,
        desc: prod.desc,
        stock:
          prod.stock !== null && prod.stock !== undefined
            ? prod.stock.toString()
            : "",
        imagePreview: prod.image || "",
        is_available: prod.is_available !== false,
      });
    } else {
      setProdForm({
        name: "",
        price: "",
        desc: "",
        stock: "",
        imagePreview: "",
        is_available: true,
      });
    }
    setProdImageFile(null);
    setProdModal({ isOpen: true, categoryId, data: prod });
  };

  const saveProduct = async () => {
    if (!prodForm.name.trim() || !prodForm.price.trim()) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("category_id", prodModal.categoryId!.toString());
      formData.append("name", prodForm.name);
      formData.append(
        "price",
        parseInt(prodForm.price.replace(/,/g, "")).toString(),
      );
      formData.append("description", prodForm.desc);
      formData.append("is_available", prodForm.is_available ? "true" : "false");

      const stockVal = String(prodForm.stock).trim();
      if (stockVal !== "") {
        formData.append("stock", stockVal);
      }

      if (prodImageFile) formData.append("image", prodImageFile);

      if (prodModal.data) {
        const updatedItem = await menuApi.updateProduct(
          prodModal.data.id,
          formData,
        );
        const mappedItem = {
          ...updatedItem,
          desc: updatedItem.description || "",
          price: updatedItem.price.toLocaleString(),
          stock: updatedItem.stock,
          is_available: updatedItem.is_available !== false,
        };
        setCategories((cats) =>
          cats.map((c) =>
            c.id === prodModal.categoryId
              ? {
                  ...c,
                  items: c.items.map((p) =>
                    p.id === prodModal.data!.id ? mappedItem : p,
                  ),
                }
              : c,
          ),
        );
      } else {
        const newItem = await menuApi.createProduct(formData);
        const mappedItem = {
          ...newItem,
          desc: newItem.description || "",
          price: newItem.price.toLocaleString(),
          stock: newItem.stock,
          is_available: newItem.is_available !== false,
        };
        setCategories((cats) =>
          cats.map((c) =>
            c.id === prodModal.categoryId
              ? { ...c, items: [...c.items, mappedItem] }
              : c,
          ),
        );
      }
      setProdModal({ isOpen: false, categoryId: null, data: null });
      setProdImageFile(null);
    } catch (err) {
      console.error("خطا در ذخیره محصول:", err);
      alert("ذخیره محصول با خطا مواجه شد. لطفاً اطلاعات را بررسی کنید.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (categoryId: number, productId: number) => {
    if (window.confirm("آیا از حذف این محصول مطمئن هستید؟")) {
      try {
        await menuApi.deleteProduct(productId);
        setCategories((cats) =>
          cats.map((c) =>
            c.id === categoryId
              ? { ...c, items: c.items.filter((p) => p.id !== productId) }
              : c,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleProdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProdImageFile(file);
      setProdForm((prev) => ({
        ...prev,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const colors = [
    { id: "emerald", class: "bg-emerald-500", hex: "#10b981" },
    { id: "rose", class: "bg-rose-500", hex: "#f43f5e" },
    { id: "amber", class: "bg-amber-500", hex: "#f59e0b" },
    { id: "blue", class: "bg-blue-500", hex: "#3b82f6" },
    { id: "purple", class: "bg-purple-500", hex: "#a855f7" },
  ];

  const templates = [
    {
      id: "modern",
      name: "مدرن (تصویر محور)",
      icon: LayoutGrid,
      demoUrl: "/modern-demo",
    },
    {
      id: "minimal",
      name: "مینیمال (لیست)",
      icon: List,
      demoUrl: "/minimal-demo",
    },
    {
      id: "classic",
      name: "کلاسیک (کارت)",
      icon: LayoutTemplate,
      demoUrl: "/classic-demo",
    },
  ];

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-5xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-2 md:mb-0">
          <Link
            to="/dashboard"
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={20} />
          </Link>
          <div className="text-center md:text-right">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {isAlreadySetup
                ? "ویرایش منو و تنظیمات"
                : "مدیریت منو و ثبت اطلاعات"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              با کلیک روی هر بخش، اطلاعات آن را تغییر دهید.
            </p>
          </div>
        </div>
      </header>

      <div className="mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2 z-0 hidden md:block rounded-full"></div>
        <div
          className="absolute top-1/2 right-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 hidden md:block rounded-full transition-all duration-500"
          style={{
            width:
              currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
          }}
        ></div>

        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          {[
            {
              step: 1,
              icon: Settings,
              title: "اطلاعات پایه",
              desc: "مشخصات و میزها",
            },
            {
              step: 2,
              icon: Palette,
              title: "برندینگ",
              desc: "قالب و رنگ‌بندی",
            },
            {
              step: 3,
              icon: LayoutList,
              title: "منو دیجیتال",
              desc: "محصولات و قیمت‌ها",
            },
          ].map((item) => {
            const isActive = currentStep === item.step;
            return (
              <div
                key={item.step}
                onClick={() => handleTabChange(item.step as 1 | 2 | 3)}
                className={`cursor-pointer flex items-center gap-4 bg-[#030712] p-2 pr-4 rounded-2xl border transition-all duration-300 hover:border-emerald-500/50 ${isActive ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-white/5"}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-emerald-500 text-gray-950" : "bg-white/5 text-slate-500"}`}
                >
                  <item.icon size={20} />
                </div>
                <div className="pl-4">
                  <h3
                    className={`font-bold text-sm ${isActive ? "text-white" : "text-slate-400"}`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#030712] border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>

        {currentStep === 1 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                ۱
              </span>{" "}
              اطلاعات اصلی رستوران
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    نام رستوران <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => {
                      setRestaurantName(e.target.value);
                      setStepOneErrors({ ...stepOneErrors, name: false });
                    }}
                    className={`w-full bg-black/40 border text-white rounded-xl py-3.5 px-4 focus:outline-none transition-all ${stepOneErrors.name ? "border-rose-500 ring-1 ring-rose-500/50" : "border-white/10 focus:border-emerald-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    درباره ما (نمایش در منو){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={restaurantDesc}
                    onChange={(e) => {
                      setRestaurantDesc(e.target.value);
                      setStepOneErrors({ ...stepOneErrors, desc: false });
                    }}
                    className={`w-full bg-black/40 border text-white rounded-xl py-3.5 px-4 focus:outline-none transition-all ${stepOneErrors.desc ? "border-rose-500 ring-1 ring-rose-500/50" : "border-white/10 focus:border-emerald-500"}`}
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      شماره تماس مجموعه
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                      placeholder="021-12345678"
                      className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                      آدرس رستوران
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="خیابان، کوچه، پلاک..."
                      className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <QrCode className="text-emerald-400" size={18} /> تعداد
                    میزها
                  </h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setTableCount((prev) => Math.max(1, prev - 1))
                      }
                      className="w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="w-16 text-center text-3xl font-black text-white">
                      {tableCount}
                    </div>
                    <button
                      onClick={() => setTableCount((prev) => prev + 1)}
                      className="w-12 h-12 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl flex items-center justify-center"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <ShoppingBag className="text-emerald-400" size={20} /> سیستم
                    فروش
                  </h2>

                  {/* سیستم سفارش‌گیری */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex gap-4">
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${isOrderingEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"}`}
                      >
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-1">
                          ثبت سفارش توسط مشتری
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-[250px]">
                          مشتریان می‌توانند محصولات را به سبد خرید اضافه و سفارش
                          را نهایی کنند.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOrderingEnabled(!isOrderingEnabled)}
                      className={`relative w-14 h-8 shrink-0 rounded-full flex items-center p-1 ${isOrderingEnabled ? "bg-emerald-500 justify-start" : "bg-white/10 justify-end"}`}
                      dir="ltr"
                    >
                      <div className="bg-white w-6 h-6 rounded-full"></div>
                    </button>
                  </div>

                  {/* 🔴 گزینه زنگ گارسون - هوشمند */}
                  <div
                    className={`bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 ${!canUseWaiter ? "opacity-70 grayscale" : ""}`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${isWaiterEnabled && canUseWaiter ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500"}`}
                      >
                        {canUseWaiter ? (
                          <BellRing size={24} />
                        ) : (
                          <Lock size={24} className="text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                          سیستم احضار گارسون
                          {!canUseWaiter && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                              نیاز به ارتقاء پلن
                            </span>
                          )}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-[250px]">
                          مشتریان می‌توانند از طریق منو درخواست حضور گارسون سر
                          میز بدهند.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (canUseWaiter) {
                          setIsWaiterEnabled(!isWaiterEnabled);
                        } else {
                          alert(
                            "برای استفاده از این قابلیت جذاب، لطفاً پلن خود را به استاندارد یا پلاس ارتقاء دهید.",
                          );
                        }
                      }}
                      className={`relative w-14 h-8 shrink-0 rounded-full flex items-center p-1 ${!canUseWaiter ? "bg-white/5 cursor-not-allowed" : isWaiterEnabled ? "bg-emerald-500 justify-start" : "bg-white/10 justify-end"}`}
                      dir="ltr"
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${!canUseWaiter ? "bg-slate-500" : "bg-white"}`}
                      ></div>
                    </button>
                  </div>

                  {isOrderingEnabled && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-300 mb-4">
                        روش‌های پرداخت مجاز:
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-gray-950">
                            <CheckCircle2 size={14} />
                          </div>
                          <span className="text-sm text-white">
                            پرداخت آنلاین{" "}
                            <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 rounded">
                              اجباری
                            </span>
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={allowCashierPayment}
                            onChange={(e) =>
                              setAllowCashierPayment(e.target.checked)
                            }
                          />
                          <div className="w-5 h-5 rounded bg-white/5 border border-white/10 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center">
                            <CheckCircle2
                              size={14}
                              className="text-gray-950 opacity-0 peer-checked:opacity-100"
                            />
                          </div>
                          <span className="text-sm text-slate-300">
                            اجازه پرداخت در محل (صندوق)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-white/5">
              <button
                onClick={() => handleTabChange(2)}
                className="bg-emerald-500 text-gray-950 px-8 py-3 rounded-xl font-bold"
              >
                ذخیره و رفتن به ظاهر
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                ۲
              </span>{" "}
              هویت بصری
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-4">
                    قالب منوی دیجیتال
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`cursor-pointer relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${selectedTemplate === tpl.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-black/20"}`}
                      >
                        {selectedTemplate === tpl.id && (
                          <div className="absolute top-3 right-3 text-emerald-400">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                        <tpl.icon
                          size={36}
                          className={`mb-3 ${selectedTemplate === tpl.id ? "text-emerald-400" : "text-slate-500"}`}
                        />
                        <span className="font-bold text-white text-sm mb-1">
                          {tpl.name}
                        </span>
                        <a
                          href={tpl.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                          مشاهده دمو <ExternalLink size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-4">
                    رنگ سازمانی برند
                  </label>
                  <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl w-fit">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setThemeColor(color.id)}
                        className={`w-10 h-10 rounded-full ${color.class} ${themeColor === color.id ? "ring-4 ring-white/20 scale-110" : "opacity-40 hover:opacity-100"}`}
                      >
                        {themeColor === color.id && (
                          <CheckCircle2
                            size={16}
                            className="text-white mx-auto"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-4">
                  لوگوی رستوران
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
                {logoPreview ? (
                  <div className="relative border-2 border-white/10 rounded-3xl flex flex-col items-center justify-center p-4 bg-black/40 min-h-[250px] group overflow-hidden">
                    <img
                      src={logoPreview}
                      className="max-h-[150px] object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                        }}
                        className="bg-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2"
                      >
                        <Trash2 size={18} /> حذف لوگو
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-black/20 hover:border-emerald-500/50 cursor-pointer min-h-[250px]"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <Plus size={24} />
                    </div>
                    <div className="font-bold text-emerald-400 text-sm">
                      آپلود لوگو (اختیاری)
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-white/5">
              <button
                onClick={() => handleTabChange(3)}
                className="bg-emerald-500 text-gray-950 px-8 py-3 rounded-xl font-bold"
              >
                ذخیره و مدیریت منو
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                  ۳
                </span>{" "}
                محصولات
              </h2>
              <button
                onClick={() => openCatModal(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border border-white/5"
              >
                <Plus size={16} /> دسته‌بندی جدید
              </button>
            </div>

            <div className="space-y-8 min-h-[300px]">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white/[0.02] border border-white/5 rounded-[28px] overflow-hidden"
                >
                  <div className="bg-black/40 p-5 flex items-center justify-between border-b border-white/5">
                    <h3 className="text-lg font-black text-white">
                      {category.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCatModal(category)}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="w-9 h-9 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {category.items.map((item) => {
                        const isHidden =
                          item.stock === 0 ||
                          String(item.stock) === "0" ||
                          item.is_available === false;
                        return (
                          <div
                            key={item.id}
                            className={`bg-black/30 border border-white/5 rounded-2xl p-4 flex gap-4 group ${isHidden ? "opacity-50" : ""}`}
                          >
                            <div className="w-16 h-16 bg-white/5 rounded-xl shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={20}
                                  className="text-slate-600"
                                />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-white text-sm">
                                  {item.name}
                                </h4>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      openProdModal(category.id, item)
                                    }
                                    className="text-slate-400 hover:text-emerald-400"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteProduct(category.id, item.id)
                                    }
                                    className="text-slate-400 hover:text-rose-400 ml-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-2">
                                <div className="font-bold text-emerald-400 text-sm">
                                  {item.price}{" "}
                                  <span className="text-[10px] text-slate-500">
                                    تومان
                                  </span>
                                </div>
                                <div
                                  className={`text-xs flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md ${isHidden ? "text-rose-400 border border-rose-500/20 bg-rose-500/10" : "text-slate-400"}`}
                                >
                                  <Package
                                    size={12}
                                    className={
                                      isHidden
                                        ? "text-rose-400"
                                        : "text-slate-500"
                                    }
                                  />
                                  {!item.is_available
                                    ? "ناموجود (مخفی)"
                                    : item.stock !== null &&
                                        item.stock !== undefined &&
                                        item.stock !== ""
                                      ? isHidden
                                        ? "تمام شده (مخفی)"
                                        : `موجودی: ${item.stock}`
                                      : "نامحدود"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => openProdModal(category.id)}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> افزودن محصول به {category.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-white/5">
              <button
                onClick={handleFinalSubmit}
                className="bg-emerald-500 text-gray-950 px-8 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <Check size={18} />{" "}
                {isAlreadySetup ? "ذخیره تغییرات" : "پایان و انتشار منو"}
              </button>
            </div>
          </div>
        )}
      </div>

      {catModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#030712] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setCatModal({ isOpen: false, data: null })}
              className="absolute top-4 left-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {catModal.data ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </h3>
            <input
              type="text"
              placeholder="نام دسته‌بندی..."
              value={catFormName}
              onChange={(e) => setCatFormName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none mb-6"
            />
            <button
              onClick={saveCategory}
              disabled={isSaving}
              className="w-full bg-emerald-500 text-gray-950 py-3 rounded-xl font-bold"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "ذخیره"
              )}
            </button>
          </div>
        </div>
      )}

      {prodModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#030712] border border-white/10 rounded-3xl p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setProdModal({ isOpen: false, categoryId: null, data: null });
                setProdImageFile(null);
              }}
              className="absolute top-4 left-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {prodModal.data ? "ویرایش محصول" : "محصول جدید"}
            </h3>
            <div className="mb-6 flex justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={prodImageRef}
                onChange={handleProdImageUpload}
              />
              {prodForm.imagePreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                  <img
                    src={prodForm.imagePreview}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setProdForm({ ...prodForm, imagePreview: "" });
                      setProdImageFile(null);
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => prodImageRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer text-slate-400"
                >
                  <Camera size={24} className="mb-1" />
                  <span className="text-[10px]">تصویر محصول</span>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-3 px-4">
                <div>
                  <h4 className="text-white text-sm font-bold">موجود در منو</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    اگر خاموش باشد، کلاً از منو مخفی می‌شود
                  </p>
                </div>
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  dir="ltr"
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prodForm.is_available}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        is_available: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <input
                type="text"
                placeholder="نام محصول"
                value={prodForm.name}
                onChange={(e) =>
                  setProdForm({ ...prodForm, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="قیمت (مثال: 45,000)"
                  value={prodForm.price}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, price: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="موجودی (خالی=نامحدود)"
                  value={prodForm.stock}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, stock: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none"
                />
              </div>
              <textarea
                rows={3}
                placeholder="ترکیبات یا توضیحات..."
                value={prodForm.desc}
                onChange={(e) =>
                  setProdForm({ ...prodForm, desc: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none resize-none"
              ></textarea>
            </div>

            <button
              onClick={saveProduct}
              disabled={isSaving}
              className="w-full bg-emerald-500 text-gray-950 py-3 rounded-xl font-bold"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "ذخیره محصول"
              )}
            </button>
          </div>
        </div>
      )}

      {showQRPopup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030712] border border-emerald-500/30 rounded-[32px] p-8 md:p-10 w-full max-w-lg text-center relative">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/20 blur-[50px] rounded-full"></div>
            <button
              onClick={() => setShowQRPopup(false)}
              className="absolute top-4 left-4 text-slate-500 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-emerald-400" size={48} />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              تنظیمات با موفقیت ذخیره شد
            </h3>
            <p className="text-slate-400 text-sm mb-8">
              منوی زنده شما آپدیت شد. از بخش کیوآر کد می‌توانید بارکد میزها را
              چاپ کنید.
            </p>
            <div className="space-y-3">
              <Link
                to="/qr-builder"
                className="w-full bg-emerald-500 text-gray-950 py-4 rounded-xl font-bold flex justify-center items-center gap-2"
              >
                <Printer size={20} /> چاپ بارکد میزها
              </Link>
              <Link
                to="/dashboard"
                className="block w-full py-3 text-sm font-bold text-slate-400 hover:text-white"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
