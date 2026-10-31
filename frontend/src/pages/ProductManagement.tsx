import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Camera,
  Image as ImageIcon,
  Package,
  CheckCircle2,
  Loader2,
  LayoutList,
  Search,
  AlertTriangle,
} from "lucide-react";
import { menuApi, venuesApi } from "../service/api";

type Product = {
  id: number;
  name: string;
  name_en?: string;
  price: string;
  desc: string;
  desc_en?: string;
  image: string;
  stock?: number | null;
  is_available?: boolean;
};

type Category = {
  id: number;
  name: string;
  name_en?: string;
  items: Product[];
};

export const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<"products" | "discounts">(
    "products",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔴 استیت جدید برای نمایش ارور کلی صفحه (مثل وقتی که رستوران ثبت نشده)
  const [pageError, setPageError] = useState("");

  const [isBilingual, setIsBilingual] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [catModal, setCatModal] = useState<{
    isOpen: boolean;
    data: Category | null;
  }>({ isOpen: false, data: null });
  const [catFormName, setCatFormName] = useState("");
  const [catFormNameEn, setCatFormNameEn] = useState("");

  const [prodModal, setProdModal] = useState<{
    isOpen: boolean;
    categoryId: number | null;
    data: Product | null;
  }>({ isOpen: false, categoryId: null, data: null });

  const [prodForm, setProdForm] = useState<{
    name: string;
    name_en: string;
    price: string;
    desc: string;
    desc_en: string;
    stock: string;
    imagePreview: string;
    imageFile: File | null;
    is_available: boolean;
  }>({
    name: "",
    name_en: "",
    price: "",
    desc: "",
    desc_en: "",
    stock: "",
    imagePreview: "",
    imageFile: null,
    is_available: true,
  });

  const prodImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, venueData] = await Promise.all([
          menuApi.getCategories(),
          venuesApi.getMyVenue(),
        ]);
        setCategories(menuData);
        setIsBilingual(venueData.is_bilingual);
      } catch (err: any) {
        console.error("خطا در دریافت اطلاعات:", err);
        // 🔴 گرفتن خطای دقیق از بک‌اند (همون پیامی که تو views.py نوشتیم)
        setPageError(
          err?.detail || err?.error || "خطا در برقراری ارتباط با سرور.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const openCatModal = (cat: Category | null = null) => {
    setCatFormName(cat ? cat.name : "");
    setCatFormNameEn(cat ? cat.name_en || "" : "");
    setCatModal({ isOpen: true, data: cat });
  };

  const saveCategory = async () => {
    if (!catFormName.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: catFormName,
        name_en: catFormNameEn,
      };

      if (catModal.data) {
        await menuApi.updateCategory(catModal.data.id, payload);
      } else {
        await menuApi.createCategory(payload);
      }
      const data = await menuApi.getCategories();
      setCategories(data);
      setCatModal({ isOpen: false, data: null });
    } catch (err: any) {
      console.error(err);
      // 🔴 نمایش الرت با پیام خطای واقعی سرور
      alert(err?.detail || err?.error || "خطا در ذخیره دسته‌بندی.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (
      window.confirm("آیا از حذف این دسته‌بندی و تمام محصولات آن مطمئن هستید؟")
    ) {
      try {
        await menuApi.deleteCategory(id);
        setCategories((cats) => cats.filter((c) => c.id !== id));
      } catch (err: any) {
        console.error(err);
        alert(err?.detail || "خطا در حذف دسته‌بندی.");
      }
    }
  };

  const openProdModal = (categoryId: number, prod: Product | null = null) => {
    setProdForm(
      prod
        ? {
            name: prod.name,
            name_en: prod.name_en || "",
            price: prod.price,
            desc: prod.desc || "",
            desc_en: prod.desc_en || "",
            stock:
              prod.stock !== null && prod.stock !== undefined
                ? prod.stock.toString()
                : "",
            imagePreview: prod.image || "",
            imageFile: null,
            is_available: prod.is_available !== false,
          }
        : {
            name: "",
            name_en: "",
            price: "",
            desc: "",
            desc_en: "",
            stock: "",
            imagePreview: "",
            imageFile: null,
            is_available: true,
          },
    );
    setProdModal({ isOpen: true, categoryId, data: prod });
  };

  const saveProduct = async () => {
    if (
      !prodForm.name.trim() ||
      !prodForm.price.trim() ||
      !prodModal.categoryId
    )
      return;
    setIsSaving(true);
    try {
      const formattedPrice = prodForm.price.replace(/,/g, "") || "0";
      const formData = new FormData();
      formData.append("category", String(prodModal.categoryId));
      formData.append("name", prodForm.name);
      formData.append("price", formattedPrice);
      formData.append("desc", prodForm.desc);
      formData.append("is_available", String(prodForm.is_available));

      if (prodForm.name_en) formData.append("name_en", prodForm.name_en);
      if (prodForm.desc_en) formData.append("desc_en", prodForm.desc_en);
      if (prodForm.stock) formData.append("stock", prodForm.stock);
      if (prodForm.imageFile) formData.append("image", prodForm.imageFile);

      if (prodModal.data) {
        await menuApi.updateProduct(prodModal.data.id, formData);
      } else {
        await menuApi.createProduct(formData);
      }

      const data = await menuApi.getCategories();
      setCategories(data);
      setProdModal({ isOpen: false, categoryId: null, data: null });
    } catch (err: any) {
      console.error("خطا در ذخیره محصول", err);
      // 🔴 نمایش الرت هوشمند
      alert(err?.detail || err?.error || "خطا در ذخیره محصول.");
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
      } catch (err: any) {
        console.error(err);
        alert(err?.detail || "خطا در حذف محصول.");
      }
    }
  };

  const handleProdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProdForm({
        ...prodForm,
        imagePreview: URL.createObjectURL(file),
        imageFile: file,
      });
    }
  };

  if (isLoading)
    return (
      <div className="min-h-[80vh] flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  // =====================================
  // 🔴 نمایش خطای دسترسی (نداشتن مجموعه)
  // =====================================
  if (pageError) {
    return (
      <div
        className="min-h-[80vh] flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in-95 duration-300"
        dir="rtl"
      >
        <div className="bg-white max-w-md w-full rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center border border-rose-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-3">
            دسترسی محدود شده
          </h2>
          <p className="text-[15px] font-bold text-slate-500 leading-loose mb-8">
            {pageError}
          </p>
          <a
            href="/setup-venue"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black flex justify-center items-center transition-colors shadow-lg shadow-orange-500/20"
          >
            ثبت اطلاعات مجموعه
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">
              مدیریت محصولات
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              منوی دیجیتال خود را بسازید و به‌روزرسانی کنید.
            </p>
          </div>
        </header>

        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="relative w-full sm:w-80">
                <Search
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="جستجوی محصول یا دسته..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-11 pl-4 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => openCatModal(null)}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
              >
                <Plus size={18} /> افزودن دسته‌بندی
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                <LayoutList size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-slate-600 font-bold mb-2 text-lg">
                  هنوز دسته‌بندی ایجاد نکرده‌اید!
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  برای افزودن غذاها ابتدا یک دسته‌بندی بسازید.
                </p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6"
                >
                  <div className="bg-slate-50/50 p-5 flex items-center justify-between border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                      {category.name}
                      {isBilingual && category.name_en && (
                        <span
                          className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200"
                          dir="ltr"
                        >
                          {category.name_en}
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCatModal(category)}
                        className="w-9 h-9 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-500 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="w-9 h-9 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                      {category.items.map((item) => {
                        const isHidden =
                          item.stock === 0 ||
                          String(item.stock) === "0" ||
                          item.is_available === false;
                        return (
                          <div
                            key={item.id}
                            className={`bg-white border border-slate-200 rounded-[24px] p-4 flex gap-4 group hover:border-orange-200 transition-colors shadow-sm ${isHidden ? "opacity-60 bg-slate-50" : ""}`}
                          >
                            <div className="w-24 h-24 bg-slate-100 rounded-[18px] shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={28}
                                  className="text-slate-300"
                                />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-black text-slate-800 text-[15px] line-clamp-1">
                                    {item.name}
                                  </h4>
                                  {isBilingual && item.name_en && (
                                    <p
                                      className="text-[10px] font-bold text-blue-500"
                                      dir="ltr"
                                    >
                                      {item.name_en}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() =>
                                      openProdModal(category.id, item)
                                    }
                                    className="text-slate-400 hover:text-blue-500 p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteProduct(category.id, item.id)
                                    }
                                    className="text-slate-400 hover:text-rose-500 p-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 mt-2 mb-3 line-clamp-1">
                                {item.desc || "بدون توضیحات"}
                              </p>
                              <div className="flex justify-between items-center mt-auto">
                                <div className="font-black text-orange-600 text-[15px]">
                                  {item.price}{" "}
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    تومان
                                  </span>
                                </div>
                                <div
                                  className={`text-[10px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isHidden ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-600 bg-emerald-50 border-emerald-100"}`}
                                >
                                  {isHidden ? (
                                    <Package size={12} />
                                  ) : (
                                    <CheckCircle2 size={12} />
                                  )}
                                  {!item.is_available
                                    ? "ناموجود"
                                    : item.stock
                                      ? `موجودی: ${item.stock}`
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
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[20px] text-slate-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 text-sm font-black flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus size={18} strokeWidth={2.5} /> افزودن محصول به{" "}
                      {category.name}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {catModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setCatModal({ isOpen: false, data: null })}
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-50 p-2 rounded-xl"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-6 mt-2 flex items-center gap-2">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
              {catModal.data ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                  نام دسته (فارسی)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: غذای اصلی"
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:border-orange-500 font-bold text-sm"
                  autoFocus
                />
              </div>
              {isBilingual && (
                <div>
                  <label className="block text-xs font-bold text-blue-500 mb-2 ml-1">
                    نام دسته (انگلیسی)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="e.g. Main Course"
                    value={catFormNameEn}
                    onChange={(e) => setCatFormNameEn(e.target.value)}
                    className="w-full bg-blue-50/30 border border-blue-200 rounded-2xl py-3.5 px-4 outline-none focus:border-blue-500 font-bold text-sm text-left"
                  />
                </div>
              )}
            </div>

            <button
              onClick={saveCategory}
              disabled={isSaving || !catFormName.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black transition-all"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "ذخیره دسته‌بندی"
              )}
            </button>
          </div>
        </div>
      )}

      {prodModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button
              onClick={() =>
                setProdModal({ isOpen: false, categoryId: null, data: null })
              }
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-50 p-2 rounded-xl z-10"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-6 mt-2 flex items-center gap-2">
              <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
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
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden group border border-slate-200">
                  <img
                    src={prodForm.imagePreview}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setProdForm({
                        ...prodForm,
                        imagePreview: "",
                        imageFile: null,
                      })
                    }
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                  >
                    <Trash2 size={24} className="text-rose-400" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => prodImageRef.current?.click()}
                  className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer text-slate-400 bg-slate-50 hover:text-orange-500 hover:border-orange-400 transition-colors"
                >
                  <Camera size={28} className="mb-2" />
                  <span className="text-[11px] font-bold">آپلود تصویر</span>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4">
                <div>
                  <h4 className="text-sm font-black">موجود در منو</h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    در صورت خاموش بودن، مخفی می‌شود
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
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className={isBilingual ? "grid grid-cols-2 gap-4" : ""}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    نام محصول (فارسی)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: پاستا پنه"
                    value={prodForm.name}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:border-orange-500 text-sm font-bold"
                  />
                </div>
                {isBilingual && (
                  <div>
                    <label className="block text-xs font-bold text-blue-500 mb-2 ml-1">
                      نام محصول (انگلیسی)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Penne Pasta"
                      value={prodForm.name_en}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, name_en: e.target.value })
                      }
                      className="w-full bg-blue-50/30 border border-blue-200 rounded-2xl py-3 px-4 focus:border-blue-500 text-sm font-bold text-left"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    قیمت (تومان)
                  </label>
                  <input
                    type="text"
                    placeholder="145,000"
                    value={prodForm.price}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, price: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:border-orange-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    موجودی (خالی=نامحدود)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodForm.stock}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, stock: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:border-orange-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className={isBilingual ? "grid grid-cols-2 gap-4" : ""}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    توضیحات (فارسی)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ترکیبات اصلی..."
                    value={prodForm.desc}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, desc: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:border-orange-500 text-sm font-medium resize-none"
                  ></textarea>
                </div>
                {isBilingual && (
                  <div>
                    <label className="block text-xs font-bold text-blue-500 mb-2 ml-1">
                      توضیحات (انگلیسی)
                    </label>
                    <textarea
                      dir="ltr"
                      rows={3}
                      placeholder="Ingredients..."
                      value={prodForm.desc_en}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, desc_en: e.target.value })
                      }
                      className="w-full bg-blue-50/30 border border-blue-200 rounded-2xl py-3 px-4 focus:border-blue-500 text-sm font-medium resize-none text-left"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={saveProduct}
              disabled={
                isSaving || !prodForm.name.trim() || !prodForm.price.trim()
              }
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white py-4 rounded-2xl font-black transition-all"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                "ذخیره محصول"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
