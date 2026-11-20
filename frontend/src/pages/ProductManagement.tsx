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
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { menuApi, venuesApi } from "../service/api";

type Product = {
  id: string;
  categoryId: string;
  nameFa: string;
  nameEn?: string;
  price: number;
  descriptionFa: string;
  descriptionEn?: string;
  imageUrl: string;
  stock?: number | null;
  isAvailableInMenu?: boolean;
};

type Category = {
  id: string;
  nameFa: string;
  nameEn?: string;
  items: Product[];
};

const toEnglishDigits = (str: string) => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str
    .split("")
    .map((c) => {
      let idx = persianNumbers.indexOf(c);
      if (idx >= 0) return idx;
      idx = arabicNumbers.indexOf(c);
      if (idx >= 0) return idx;
      return c;
    })
    .join("");
};

export const ProductManagement = () => {
  const [activeTab] = useState<"products" | "discounts">("products");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [pageError, setPageError] = useState("");
  const [isBilingual, setIsBilingual] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [catModal, setCatModal] = useState<{
    isOpen: boolean;
    data: Category | null;
  }>({ isOpen: false, data: null });
  const [catFormNameFa, setCatFormNameFa] = useState("");
  const [catFormNameEn, setCatFormNameEn] = useState("");

  const [prodModal, setProdModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    data: Product | null;
  }>({ isOpen: false, categoryId: null, data: null });

  const [prodForm, setProdForm] = useState<{
    nameFa: string;
    nameEn: string;
    price: string;
    descriptionFa: string;
    descriptionEn: string;
    stock: string;
    imagePreview: string;
    imageFile: File | null;
    isAvailableInMenu: boolean;
  }>({
    nameFa: "",
    nameEn: "",
    price: "",
    descriptionFa: "",
    descriptionEn: "",
    stock: "",
    imagePreview: "",
    imageFile: null,
    isAvailableInMenu: true,
  });

  const prodImageRef = useRef<HTMLInputElement>(null);

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    const SERVER_URL = "http://localhost:5000";
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const refreshMenuData = async () => {
    try {
      // ۱. دریافت اطلاعات رستوران
      let venueRes: any = null;
      try {
        venueRes = await venuesApi.getMyVenue();
      } catch {
        throw new Error(
          "شما هنوز رستوران خود را ثبت نکرده‌اید. لطفاً ابتدا اطلاعات مجموعه را تکمیل کنید.",
        );
      }

      const vData = venueRes?.data?.data || venueRes?.data || venueRes || {};
      setIsBilingual(vData.bilingual === true || vData.Bilingual === true);

      // ۲. دریافت دسته‌ها و محصولات از جنگو
      let catsRes: any = [];
      let prodsRes: any = [];

      try {
        catsRes = await menuApi.getCategories();
      } catch {
        console.warn("دسته‌بندی‌ها دریافت نشد.");
      }

      try {
        prodsRes = await menuApi.getProducts();
      } catch {
        console.warn("محصولات دریافت نشد.");
      }

      const extractArray = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.items)) return res.items;
        if (res?.data && Array.isArray(res.data.items)) return res.data.items;
        return [];
      };

      const safeCats = extractArray(catsRes);
      const safeProds = extractArray(prodsRes);

      const mergedCategories: Category[] = safeCats.map((cat: any) => {
        const catId = String(cat.id || cat.Id || "").toLowerCase();

        const catProducts = safeProds.filter((p: any) => {
          const pCatId = String(
            p.categoryId || p.CategoryId || p.category_id || "",
          ).toLowerCase();
          return pCatId === catId;
        });

        const formattedProducts: Product[] = catProducts.map((p: any) => ({
          id: String(p.id || p.Id),
          categoryId: catId,
          nameFa: p.nameFa || p.NameFa || "",
          nameEn: p.nameEn || p.NameEn || "",
          price: Number(p.price ?? p.Price ?? 0),
          descriptionFa: p.descriptionFa || p.DescriptionFa || "",
          descriptionEn: p.descriptionEn || p.DescriptionEn || "",
          imageUrl: p.imageUrl || p.ImageUrl || "",
          stock: p.stock ?? p.Stock ?? null,
          isAvailableInMenu:
            p.isAvailableInMenu !== false && p.IsAvailableInMenu !== false,
        }));

        return {
          id: catId,
          nameFa: cat.nameFa || cat.NameFa || "نامشخص",
          nameEn: cat.nameEn || cat.NameEn || "",
          items: formattedProducts,
        };
      });

      setCategories(mergedCategories);
    } catch (err: any) {
      setPageError(
        err.message ||
          err?.detail ||
          err?.error ||
          "خطا در برقراری ارتباط با سرور.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMenuData();
  }, []);

  const filteredCategories = categories
    .map((category) => {
      const q = searchQuery.toLowerCase().trim();
      const matchCat =
        (category.nameFa || "").toLowerCase().includes(q) ||
        (category.nameEn || "").toLowerCase().includes(q);
      const filteredItems = (category.items || []).filter(
        (item) =>
          (item.nameFa || "").toLowerCase().includes(q) ||
          (item.nameEn || "").toLowerCase().includes(q) ||
          (item.descriptionFa || "").toLowerCase().includes(q),
      );

      return {
        ...category,
        items: filteredItems,
        isMatch: matchCat || filteredItems.length > 0,
      };
    })
    .filter((cat) => cat.isMatch);

  const openCatModal = (cat: Category | null = null) => {
    setCatFormNameFa(cat ? cat.nameFa : "");
    setCatFormNameEn(cat ? cat.nameEn || "" : "");
    setCatModal({ isOpen: true, data: cat });
  };

  const saveCategory = async () => {
    if (!catFormNameFa.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        nameFa: catFormNameFa.trim(),
        nameEn: catFormNameEn.trim(),
      };

      if (catModal.data) {
        await menuApi.updateCategory(catModal.data.id, {
          ...payload,
          id: catModal.data.id,
        });
        setCategories((cats) =>
          cats.map((c) =>
            c.id === catModal.data?.id ? { ...c, ...payload } : c,
          ),
        );
      } else {
        const resData = await menuApi.createCategory(payload);
        const newCatId = String(
          resData?.data?.id || resData?.id || "",
        ).toLowerCase();
        setCategories((cats) => [
          ...cats,
          {
            id: newCatId,
            nameFa: payload.nameFa,
            nameEn: payload.nameEn,
            items: [],
          },
        ]);
      }

      setCatModal({ isOpen: false, data: null });
    } catch (err: any) {
      alert(err?.message || err?.detail || "خطا در ذخیره دسته‌بندی.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (
      window.confirm("آیا از حذف این دسته‌بندی و تمام محصولات آن مطمئن هستید؟")
    ) {
      try {
        await menuApi.deleteCategory(id);
        setCategories((cats) => cats.filter((c) => c.id !== id));
      } catch (err: any) {
        alert(err?.message || err?.detail || "خطا در حذف دسته‌بندی.");
      }
    }
  };

  const openProdModal = (categoryId: string, prod: Product | null = null) => {
    setProdForm(
      prod
        ? {
            nameFa: prod.nameFa || "",
            nameEn: prod.nameEn || "",
            price: prod.price !== undefined ? prod.price.toString() : "",
            descriptionFa: prod.descriptionFa || "",
            descriptionEn: prod.descriptionEn || "",
            stock:
              prod.stock !== null && prod.stock !== undefined
                ? prod.stock.toString()
                : "",
            imagePreview: getFullImageUrl(prod.imageUrl || ""),
            imageFile: null,
            isAvailableInMenu: prod.isAvailableInMenu !== false,
          }
        : {
            nameFa: "",
            nameEn: "",
            price: "",
            descriptionFa: "",
            descriptionEn: "",
            stock: "",
            imagePreview: "",
            imageFile: null,
            isAvailableInMenu: true,
          },
    );
    setProdModal({ isOpen: true, categoryId, data: prod });
  };

  const saveProduct = async () => {
    if (
      !prodForm.nameFa.trim() ||
      !prodForm.price.trim() ||
      !prodModal.categoryId
    )
      return;
    setIsSaving(true);

    try {
      const cleanPriceStr = toEnglishDigits(prodForm.price).replace(
        /[^0-9]/g,
        "",
      );
      const numericPrice = parseInt(cleanPriceStr, 10) || 0;

      const cleanStockStr = toEnglishDigits(prodForm.stock).trim();
      const numericStock =
        cleanStockStr !== "" ? parseInt(cleanStockStr, 10) : null;

      const payload: any = {
        categoryId: prodModal.categoryId,
        nameFa: prodForm.nameFa.trim(),
        nameEn: prodForm.nameEn.trim(),
        descriptionFa: prodForm.descriptionFa.trim(),
        descriptionEn: prodForm.descriptionEn.trim(),
        price: numericPrice,
        stock: numericStock,
        isAvailableInMenu: prodForm.isAvailableInMenu,
      };

      // اگر کاربر در حالت ویرایش عکس را دستی پاک کرده است
      if (!prodForm.imagePreview && !prodForm.imageFile && prodModal.data) {
        payload.imageUrl = "";
      }

      let finalProductId = "";

      if (prodModal.data) {
        await menuApi.updateProduct(prodModal.data.id, {
          ...payload,
          id: prodModal.data.id,
        });
        finalProductId = prodModal.data.id;
      } else {
        const createdRes = await menuApi.createProduct(payload);
        finalProductId = String(createdRes?.data?.id || createdRes?.id || "");
      }

      if (!finalProductId) {
        throw new Error("آیدی محصول پس از ذخیره دریافت نشد.");
      }

      // آپلود تصویر جدید (در صورت انتخاب فایل)
      let newlyUploadedUrl = "";
      if (prodForm.imageFile) {
        try {
          const uploadRes = await menuApi.uploadProductImage(
            finalProductId,
            prodForm.imageFile,
          );
          newlyUploadedUrl =
            typeof uploadRes === "string"
              ? uploadRes
              : uploadRes?.data?.imageUrl ||
                uploadRes?.data?.url ||
                uploadRes?.imageUrl ||
                uploadRes?.url ||
                "";
        } catch (imgError) {
          console.error("خطا در آپلود عکس:", imgError);
          alert("اطلاعات محصول ذخیره شد، اما آپلود عکس با خطا مواجه شد.");
        }
      }

      let finalDisplayImageUrl = "";
      if (newlyUploadedUrl) {
        finalDisplayImageUrl = newlyUploadedUrl;
      } else if (prodForm.imagePreview && !prodForm.imageFile) {
        finalDisplayImageUrl = prodModal.data?.imageUrl || "";
      }

      const localProduct: Product = {
        id: finalProductId,
        categoryId: prodModal.categoryId,
        nameFa: payload.nameFa,
        nameEn: payload.nameEn,
        descriptionFa: payload.descriptionFa,
        descriptionEn: payload.descriptionEn,
        price: numericPrice,
        stock: numericStock,
        isAvailableInMenu: prodForm.isAvailableInMenu,
        imageUrl: finalDisplayImageUrl,
      };

      setCategories((prevCategories) =>
        prevCategories.map((cat) => {
          if (cat.id === prodModal.categoryId) {
            const items = cat.items || [];
            if (prodModal.data) {
              return {
                ...cat,
                items: items.map((item) =>
                  item.id === finalProductId ? localProduct : item,
                ),
              };
            }
            return { ...cat, items: [...items, localProduct] };
          }
          return cat;
        }),
      );

      setProdModal({ isOpen: false, categoryId: null, data: null });
    } catch (err: any) {
      console.error("خطا در ذخیره محصول:", err);
      alert(err?.message || err?.detail || "خطا در ذخیره محصول.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (categoryId: string, productId: string) => {
    if (window.confirm("آیا از حذف این محصول مطمئن هستید؟")) {
      try {
        await menuApi.deleteProduct(productId);
        setCategories((cats) =>
          cats.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  items: c.items?.filter((p) => p.id !== productId) || [],
                }
              : c,
          ),
        );
      } catch (err: any) {
        console.error(err);
        alert(err?.message || err?.detail || "خطا در حذف محصول.");
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

  const handleRemoveProdImage = () => {
    setProdForm({
      ...prodForm,
      imagePreview: "",
      imageFile: null,
    });
    if (prodImageRef.current) {
      prodImageRef.current.value = "";
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex justify-center items-center">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    );

  if (pageError) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in-95 duration-300"
        dir="rtl"
      >
        <div className="bg-white/80 backdrop-blur-2xl max-w-md w-full rounded-[40px] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)] flex flex-col items-center text-center border border-white">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            دسترسی محدود شده
          </h2>
          <p className="text-[15px] font-medium text-slate-500 leading-loose mb-8">
            {pageError}
          </p>
          <Link
            to="/setup-venue"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-[20px] font-black flex justify-center items-center transition-all active:scale-95"
          >
            ثبت اطلاعات مجموعه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative overflow-x-hidden font-sans pb-20"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 lg:mb-12">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/dashboard"
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white/80 backdrop-blur-xl shadow-sm border border-white rounded-[20px] flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all active:scale-95 shrink-0"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 lg:mb-2">
                مدیریت محصولات
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-bold">
                منوی دیجیتال خود را بسازید و به‌روزرسانی کنید.
              </p>
            </div>
          </div>
        </header>

        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white/60 backdrop-blur-2xl p-3 lg:p-4 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="relative w-full sm:w-96">
                <Search
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="جستجوی محصول یا دسته..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[20px] py-3.5 pr-12 pl-4 text-sm font-medium focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm outline-none"
                />
              </div>
              <button
                onClick={() => openCatModal(null)}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-lg shadow-slate-900/15"
              >
                <Plus size={18} /> افزودن دسته‌بندی
              </button>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-24 bg-white/50 backdrop-blur-xl border border-white rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <LayoutList
                  size={56}
                  className="text-slate-300 mx-auto mb-5"
                  strokeWidth={1.5}
                />
                <h3 className="text-slate-700 font-black mb-2 text-xl tracking-tight">
                  چیزی پیدا نشد!
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  دسته‌بندی یا محصولی با این مشخصات وجود ندارد.
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] lg:rounded-[40px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.04)] mb-8 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
                >
                  <div className="bg-slate-50/50 p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                      <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                      {category.nameFa}
                      {isBilingual && category.nameEn && (
                        <span
                          className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                          dir="ltr"
                        >
                          {category.nameEn}
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCatModal(category)}
                        className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-[14px] flex items-center justify-center shadow-sm transition-colors active:scale-95"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="w-10 h-10 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200 rounded-[14px] flex items-center justify-center shadow-sm transition-colors active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                      {category.items?.map((item) => {
                        const isHidden =
                          item.isAvailableInMenu === false || item.stock === 0;

                        return (
                          <div
                            key={item.id}
                            className={`bg-white border border-slate-100 rounded-[28px] p-4 flex gap-4 lg:gap-5 group hover:border-slate-300 transition-all shadow-sm hover:shadow-md ${isHidden ? "opacity-60 bg-slate-50" : ""}`}
                          >
                            <div className="w-24 h-24 lg:w-28 lg:h-28 bg-slate-50 rounded-[20px] shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner relative">
                              {item.imageUrl ? (
                                <img
                                  src={getFullImageUrl(item.imageUrl)}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  alt={item.nameFa}
                                />
                              ) : (
                                <ImageIcon
                                  size={32}
                                  strokeWidth={1.5}
                                  className="text-slate-300"
                                />
                              )}
                            </div>

                            <div className="flex-1 flex flex-col justify-center py-1">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <h4 className="font-black text-slate-900 text-[15px] lg:text-[17px] tracking-tight line-clamp-1">
                                    {item.nameFa}
                                  </h4>
                                  {isBilingual && item.nameEn && (
                                    <p
                                      className="text-[11px] lg:text-[12px] font-bold text-slate-400 mt-0.5"
                                      dir="ltr"
                                    >
                                      {item.nameEn}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      openProdModal(category.id, item)
                                    }
                                    className="text-slate-400 hover:text-slate-700 p-2 bg-slate-50 hover:bg-slate-200 rounded-xl transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteProduct(category.id, item.id)
                                    }
                                    className="text-slate-400 hover:text-rose-500 p-2 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[12px] font-medium text-slate-500 mt-2 mb-3 line-clamp-1 lg:line-clamp-2 leading-relaxed">
                                {item.descriptionFa || "بدون توضیحات"}
                              </p>

                              <div className="flex justify-between items-center mt-auto">
                                <div className="font-black text-slate-900 text-[15px] lg:text-[17px]">
                                  {Number(item.price || 0).toLocaleString(
                                    "fa-IR",
                                  )}{" "}
                                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold ml-1">
                                    تومان
                                  </span>
                                </div>
                                <div
                                  className={`text-[10px] lg:text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isHidden ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-700 bg-emerald-50 border-emerald-100/50"}`}
                                >
                                  {isHidden ? (
                                    <Package size={14} />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )}
                                  {!item.isAvailableInMenu
                                    ? "ناموجود"
                                    : item.stock !== null &&
                                        item.stock !== undefined
                                      ? `موجودی: ${item.stock}`
                                      : "فعال (نامحدود)"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => openProdModal(category.id)}
                      className="w-full py-4 lg:py-5 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50 text-[14px] lg:text-[15px] font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Plus size={20} strokeWidth={2.5} /> افزودن محصول جدید به{" "}
                      {category.nameFa}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* مودال دسته‌بندی */}
      {catModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[40px] p-6 lg:p-8 w-full max-w-sm shadow-[0_20px_80px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setCatModal({ isOpen: false, data: null })}
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-100 p-2.5 rounded-full transition-colors bg-slate-50 border border-slate-100"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-8 mt-2 tracking-tight">
              {catModal.data ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </h3>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                  نام دسته (فارسی)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: غذای اصلی"
                  value={catFormNameFa}
                  onChange={(e) => setCatFormNameFa(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-100 font-bold text-[15px] shadow-sm transition-all"
                  autoFocus
                />
              </div>
              {isBilingual && (
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                    نام دسته (انگلیسی)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="e.g. Main Course"
                    value={catFormNameEn}
                    onChange={(e) => setCatFormNameEn(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[20px] py-4 px-5 outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-100 font-bold text-[15px] text-left shadow-sm transition-all"
                  />
                </div>
              )}
            </div>

            <button
              onClick={saveCategory}
              disabled={isSaving || !catFormNameFa.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-[20px] font-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 text-[15px]"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                "ذخیره دسته‌بندی"
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال محصول */}
      {prodModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-3xl border border-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 w-full max-w-4xl shadow-[0_30px_100px_rgba(0,0,0,0.2)] relative max-h-[95vh] overflow-y-auto hide-scrollbar animate-in zoom-in-95 duration-300">
            <button
              onClick={() =>
                setProdModal({ isOpen: false, categoryId: null, data: null })
              }
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-2.5 rounded-full transition-colors bg-slate-50 border border-slate-100 z-20"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">
              {prodModal.data ? "ویرایش محصول" : "افزودن محصول جدید"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
              <div className="md:col-span-2 flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={prodImageRef}
                  onChange={handleProdImageUpload}
                />
                {prodForm.imagePreview ? (
                  <div className="relative w-full aspect-square rounded-[32px] overflow-hidden group border border-slate-100 shadow-sm">
                    <img
                      src={prodForm.imagePreview}
                      className="w-full h-full object-cover"
                      alt="Product Preview"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <button
                        type="button"
                        onClick={handleRemoveProdImage}
                        className="bg-white/20 p-4 rounded-2xl hover:bg-rose-500 text-white transition-colors"
                      >
                        <Trash2 size={28} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => prodImageRef.current?.click()}
                    className="w-full aspect-square rounded-[32px] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer text-slate-400 bg-slate-50/50 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 transition-all"
                  >
                    <div className="w-16 h-16 bg-white rounded-[20px] shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                      <Camera
                        size={28}
                        strokeWidth={1.5}
                        className="text-slate-400"
                      />
                    </div>
                    <span className="text-[14px] font-black">
                      انتخاب تصویر محصول
                    </span>
                    <span className="text-[12px] font-medium text-slate-400 mt-2">
                      فرمت‌های JPG یا PNG
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-[24px] py-4 px-5 mt-4">
                  <div>
                    <h4 className="text-[14px] font-black text-slate-800">
                      وضعیت در منو
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">
                      مخفی کردن موقت از دید مشتری
                    </p>
                  </div>
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    dir="ltr"
                  >
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prodForm.isAvailableInMenu}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          isAvailableInMenu: e.target.checked,
                        })
                      }
                    />
                    <div className="w-12 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                  </label>
                </div>
              </div>

              <div className="md:col-span-3 space-y-5 flex flex-col">
                <div
                  className={
                    isBilingual ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : ""
                  }
                >
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                      نام محصول (فارسی)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: پاستا پنه آلفردو"
                      value={prodForm.nameFa}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, nameFa: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-[20px] py-3.5 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[15px] font-bold shadow-sm outline-none transition-all"
                    />
                  </div>
                  {isBilingual && (
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                        نام محصول (انگلیسی)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="Penne Alfredo"
                        value={prodForm.nameEn}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, nameEn: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-[20px] py-3.5 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[15px] font-bold text-left shadow-sm outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                      قیمت (تومان)
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="245000"
                      value={prodForm.price}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          price: toEnglishDigits(e.target.value).replace(
                            /[^0-9,]/g,
                            "",
                          ),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-[20px] py-3.5 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[15px] font-mono text-left shadow-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                      موجودی روزانه (اختیاری)
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="خالی = نامحدود"
                      value={prodForm.stock}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          stock: toEnglishDigits(e.target.value).replace(
                            /[^0-9]/g,
                            "",
                          ),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-[20px] py-3.5 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[15px] font-mono text-left shadow-sm outline-none transition-all placeholder:font-sans placeholder:text-right"
                    />
                  </div>
                </div>

                <div
                  className={
                    isBilingual ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : ""
                  }
                >
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                      توضیحات و ترکیبات (فارسی)
                    </label>
                    <textarea
                      rows={isBilingual ? 4 : 5}
                      placeholder="پنه، سس آلفردو، قارچ، مرغ گریل شده..."
                      value={prodForm.descriptionFa}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          descriptionFa: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-[24px] py-4 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[14px] font-medium resize-none shadow-sm outline-none transition-all leading-relaxed"
                    ></textarea>
                  </div>
                  {isBilingual && (
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 mb-2 ml-1">
                        توضیحات (انگلیسی)
                      </label>
                      <textarea
                        dir="ltr"
                        rows={4}
                        placeholder="Penne pasta, Alfredo sauce, mushroom, grilled chicken..."
                        value={prodForm.descriptionEn}
                        onChange={(e) =>
                          setProdForm({
                            ...prodForm,
                            descriptionEn: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-[24px] py-4 px-5 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 text-[14px] font-medium resize-none text-left shadow-sm outline-none transition-all leading-relaxed"
                      ></textarea>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={saveProduct}
                    disabled={
                      isSaving ||
                      !prodForm.nameFa.trim() ||
                      !prodForm.price.trim()
                    }
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 lg:py-5 rounded-[20px] font-black transition-all shadow-xl shadow-slate-900/15 active:scale-95 text-[15px] lg:text-[16px]"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin mx-auto" size={24} />
                    ) : (
                      "ذخیره محصول در منو"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ProductManagement;
