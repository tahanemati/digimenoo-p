import React, { useState, useRef, useEffect, useMemo } from "react";
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
  LayoutGrid,
  Search,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FolderPlus,
  Layers,
  EyeOff,
  Flame,
  Boxes,
} from "lucide-react";
import { Link } from "react-router-dom";
import { inventoryApi, menuApi, venuesApi } from "../service/api";

type ProductIngredient = {
  id?: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  unit?: string;
  unitLabel?: string;
  quantityUsed: number;
  currentStock?: number;
};

type InventoryOption = {
  id: string;
  name: string;
  unit: string;
  unitLabel: string;
  currentStock: number;
};

type IngredientFormRow = {
  inventoryItemId: string;
  quantityUsed: string;
};

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
  ingredients?: ProductIngredient[];
};

type Category = {
  id: string;
  nameFa: string;
  nameEn?: string;
  items: Product[];
};

type StatusFilter = "all" | "active" | "unavailable" | "low_stock";
type ViewMode = "table" | "grid";

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

const toEnglishDecimal = (str: string) => {
  const normalized = toEnglishDigits(str.replace(/[٫/]/g, ".")).replace(
    /[^0-9.]/g,
    "",
  );
  const parts = normalized.split(".");
  if (parts.length <= 1) return normalized;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const formatNum = (val: number) =>
  Number(val || 0).toLocaleString("fa-IR", { maximumFractionDigits: 3 });

export const ProductManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // فیلترها و حالت نمایش
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>(
    {},
  );

  // ویرایش درجا (Inline Price Edit)
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>("");
  const [updatingItemIds, setUpdatingItemIds] = useState<
    Record<string, boolean>
  >({});

  // اعلان غیرمزاحم (Toast)
  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [pageError, setPageError] = useState("");
  const [isBilingual, setIsBilingual] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);

  // مودال دسته‌بندی
  const [catModal, setCatModal] = useState<{
    isOpen: boolean;
    data: Category | null;
  }>({ isOpen: false, data: null });
  const [catFormNameFa, setCatFormNameFa] = useState("");
  const [catFormNameEn, setCatFormNameEn] = useState("");

  // مودال محصول
  const [prodModal, setProdModal] = useState<{
    isOpen: boolean;
    categoryId: string;
    data: Product | null;
    isDuplicate?: boolean;
  }>({ isOpen: false, categoryId: "", data: null, isDuplicate: false });

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
    ingredients: IngredientFormRow[];
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
    ingredients: [],
  });

  const prodImageRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

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

      let catsRes: any = [];
      let prodsRes: any = [];
      let invRes: any = null;

      await Promise.all([
        menuApi
          .getCategories()
          .then((res) => {
            catsRes = res;
          })
          .catch(() => {
            console.warn("دسته‌بندی‌ها دریافت نشد.");
          }),
        menuApi
          .getProducts()
          .then((res) => {
            prodsRes = res;
          })
          .catch(() => {
            console.warn("محصولات دریافت نشد.");
          }),
        inventoryApi
          .getItems()
          .then((res) => {
            invRes = res;
          })
          .catch(() => {
            console.warn("اقلام انبار دریافت نشد.");
          }),
      ]);

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
      const safeInvRaw = extractArray(invRes);

      setInventoryItems(
        safeInvRaw.map((item: any) => ({
          id: String(item.id),
          name: item.name || "",
          unit: item.unit || "gram",
          unitLabel: item.unitLabel || "",
          currentStock: Number(item.currentStock ?? 0),
        })),
      );

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
          ingredients: Array.isArray(p.ingredients)
            ? p.ingredients.map((ing: any) => ({
                id: ing.id ? String(ing.id) : undefined,
                inventoryItemId: String(
                  ing.inventoryItemId || ing.inventory_item_id || "",
                ),
                inventoryItemName: ing.inventoryItemName || "",
                unit: ing.unit || "",
                unitLabel: ing.unitLabel || "",
                quantityUsed: Number(
                  ing.quantityUsed ?? ing.quantity_used ?? 0,
                ),
                currentStock: Number(ing.currentStock ?? 0),
              }))
            : [],
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

  // آمار لحظه‌ای کل منو
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let unavailable = 0;
    let lowStock = 0;

    categories.forEach((cat) => {
      (cat.items || []).forEach((item) => {
        total += 1;
        const isOut = item.isAvailableInMenu === false || item.stock === 0;
        if (isOut) {
          unavailable += 1;
        } else {
          active += 1;
          if (
            item.stock !== null &&
            item.stock !== undefined &&
            item.stock > 0 &&
            item.stock <= 5
          ) {
            lowStock += 1;
          }
        }
      });
    });

    return { total, active, unavailable, lowStock };
  }, [categories]);

  // فیلتر ترکیبی دسته‌بندی، وضعیت و جستجو
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return categories
      .filter(
        (cat) => selectedCategoryId === "all" || cat.id === selectedCategoryId,
      )
      .map((category) => {
        const matchCatTitle =
          q !== "" &&
          ((category.nameFa || "").toLowerCase().includes(q) ||
            (category.nameEn || "").toLowerCase().includes(q));

        const filteredItems = (category.items || []).filter((item) => {
          const isOut = item.isAvailableInMenu === false || item.stock === 0;
          const isLow =
            !isOut &&
            item.stock !== null &&
            item.stock !== undefined &&
            item.stock > 0 &&
            item.stock <= 5;

          if (statusFilter === "active" && isOut) return false;
          if (statusFilter === "unavailable" && !isOut) return false;
          if (statusFilter === "low_stock" && !isLow) return false;

          if (!q || matchCatTitle) return true;

          return (
            (item.nameFa || "").toLowerCase().includes(q) ||
            (item.nameEn || "").toLowerCase().includes(q) ||
            (item.descriptionFa || "").toLowerCase().includes(q)
          );
        });

        const shouldShowCategory =
          filteredItems.length > 0 ||
          (statusFilter === "all" && (!q || matchCatTitle));

        return {
          ...category,
          items: filteredItems,
          shouldShowCategory,
        };
      })
      .filter((cat) => cat.shouldShowCategory);
  }, [categories, selectedCategoryId, statusFilter, searchQuery]);

  // تغییر سریع وضعیت موجود/ناموجود بدون باز کردن مودال
  const handleQuickToggleAvailability = async (item: Product) => {
    if (updatingItemIds[item.id]) return;

    const nextAvailable = !(item.isAvailableInMenu !== false);
    const nextStock =
      nextAvailable && item.stock === 0 ? null : (item.stock ?? null);

    setUpdatingItemIds((prev) => ({ ...prev, [item.id]: true }));

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === item.categoryId
          ? {
              ...cat,
              items: cat.items.map((p) =>
                p.id === item.id
                  ? {
                      ...p,
                      isAvailableInMenu: nextAvailable,
                      stock: nextStock,
                    }
                  : p,
              ),
            }
          : cat,
      ),
    );

    try {
      await menuApi.updateProduct(item.id, {
        id: item.id,
        categoryId: item.categoryId,
        nameFa: item.nameFa,
        nameEn: item.nameEn || "",
        descriptionFa: item.descriptionFa || "",
        descriptionEn: item.descriptionEn || "",
        price: item.price,
        stock: nextStock,
        isAvailableInMenu: nextAvailable,
      });

      showToast(
        nextAvailable
          ? `«${item.nameFa}» در منو فعال شد.`
          : `«${item.nameFa}» به‌عنوان ناموجود ثبت شد.`,
      );
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === item.categoryId
            ? {
                ...cat,
                items: cat.items.map((p) => (p.id === item.id ? item : p)),
              }
            : cat,
        ),
      );
      showToast(err?.message || "خطا در تغییر وضعیت محصول.", "error");
    } finally {
      setUpdatingItemIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // شروع ویرایش درجا قیمت
  const startInlinePriceEdit = (item: Product) => {
    setInlinePriceId(item.id);
    setInlinePriceValue(String(item.price || 0));
  };

  // ذخیره قیمت جدید درجا
  const saveInlinePrice = async (item: Product) => {
    const cleanStr = toEnglishDigits(inlinePriceValue).replace(/[^0-9]/g, "");
    const newPrice = parseInt(cleanStr, 10) || 0;

    setInlinePriceId(null);
    if (newPrice === item.price) return;

    setUpdatingItemIds((prev) => ({ ...prev, [item.id]: true }));
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === item.categoryId
          ? {
              ...cat,
              items: cat.items.map((p) =>
                p.id === item.id ? { ...p, price: newPrice } : p,
              ),
            }
          : cat,
      ),
    );

    try {
      await menuApi.updateProduct(item.id, {
        id: item.id,
        categoryId: item.categoryId,
        nameFa: item.nameFa,
        nameEn: item.nameEn || "",
        descriptionFa: item.descriptionFa || "",
        descriptionEn: item.descriptionEn || "",
        price: newPrice,
        stock: item.stock ?? null,
        isAvailableInMenu: item.isAvailableInMenu !== false,
      });
      showToast(`قیمت «${item.nameFa}» بروزرسانی شد.`);
    } catch (err: any) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === item.categoryId
            ? {
                ...cat,
                items: cat.items.map((p) => (p.id === item.id ? item : p)),
              }
            : cat,
        ),
      );
      showToast(err?.message || "خطا در تغییر قیمت.", "error");
    } finally {
      setUpdatingItemIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const toggleCollapseCategory = (catId: string) => {
    setCollapsedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const setAllCategoriesCollapsed = (collapse: boolean) => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[c.id] = collapse;
    });
    setCollapsedCats(next);
  };

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
        showToast("دسته‌بندی ویرایش شد.");
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
        if (newCatId) setSelectedCategoryId(newCatId);
        showToast("دسته‌بندی جدید ایجاد شد.");
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
        if (selectedCategoryId === id) setSelectedCategoryId("all");
        showToast("دسته‌بندی حذف شد.");
      } catch (err: any) {
        alert(err?.message || err?.detail || "خطا در حذف دسته‌بندی.");
      }
    }
  };

  const openProdModal = (
    categoryId?: string,
    prod: Product | null = null,
    isDuplicate = false,
  ) => {
    if (categories.length === 0) {
      showToast("ابتدا حداقل یک دسته‌بندی ایجاد کنید.", "error");
      openCatModal(null);
      return;
    }

    const defaultCatId =
      categoryId ||
      (selectedCategoryId !== "all" ? selectedCategoryId : categories[0].id);

    setProdForm(
      prod
        ? {
            nameFa: isDuplicate ? `${prod.nameFa} (کپی)` : prod.nameFa || "",
            nameEn: prod.nameEn || "",
            price: prod.price !== undefined ? prod.price.toString() : "",
            descriptionFa: prod.descriptionFa || "",
            descriptionEn: prod.descriptionEn || "",
            stock:
              prod.stock !== null && prod.stock !== undefined
                ? prod.stock.toString()
                : "",
            imagePreview: isDuplicate
              ? ""
              : getFullImageUrl(prod.imageUrl || ""),
            imageFile: null,
            isAvailableInMenu: prod.isAvailableInMenu !== false,
            ingredients: Array.isArray(prod.ingredients)
              ? prod.ingredients.map((ing) => ({
                  inventoryItemId: ing.inventoryItemId,
                  quantityUsed: String(ing.quantityUsed ?? ""),
                }))
              : [],
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
            ingredients: [],
          },
    );

    setProdModal({
      isOpen: true,
      categoryId: defaultCatId,
      data: isDuplicate ? null : prod,
      isDuplicate,
    });
  };

  // مدیریت ردیف‌های مواد مصرفی از انبار در فرم محصول
  const addIngredientRow = () => {
    const usedIds = new Set(
      prodForm.ingredients.map((row) => row.inventoryItemId),
    );
    const firstAvailable = inventoryItems.find((item) => !usedIds.has(item.id));
    if (!firstAvailable) {
      showToast(
        "تمام کالاهای تعریف‌شده در انبار به این محصول اضافه شده‌اند.",
        "error",
      );
      return;
    }

    setProdForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { inventoryItemId: firstAvailable.id, quantityUsed: "" },
      ],
    }));
  };

  const updateIngredientRow = (
    index: number,
    patch: Partial<IngredientFormRow>,
  ) => {
    setProdForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, idx) =>
        idx === index ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeIngredientRow = (index: number) => {
    setProdForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index),
    }));
  };

  const saveProduct = async () => {
    if (
      !prodForm.nameFa.trim() ||
      !prodForm.price.trim() ||
      !prodModal.categoryId
    )
      return;

    // اعتبارسنجی ردیف‌های مواد اولیه انتخاب‌شده
    const preparedIngredients: {
      inventoryItemId: string;
      quantityUsed: number;
    }[] = [];
    const seenInvIds = new Set<string>();

    for (const row of prodForm.ingredients) {
      if (!row.inventoryItemId) continue;
      const qty = parseFloat(toEnglishDecimal(row.quantityUsed));
      if (Number.isNaN(qty) || qty <= 0) {
        const invName =
          inventoryItems.find((i) => i.id === row.inventoryItemId)?.name ||
          "ماده اولیه";
        showToast(
          `لطفاً مقدار مصرف «${invName}» را بزرگ‌تر از صفر وارد کنید یا ردیف آن را حذف نمایید.`,
          "error",
        );
        return;
      }
      if (seenInvIds.has(row.inventoryItemId)) continue;
      seenInvIds.add(row.inventoryItemId);
      preparedIngredients.push({
        inventoryItemId: row.inventoryItemId,
        quantityUsed: qty,
      });
    }

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
        ingredients: preparedIngredients,
      };

      if (!prodForm.imagePreview && !prodForm.imageFile && prodModal.data) {
        payload.imageUrl = "";
      }

      let finalProductId = "";
      let savedIngredients: ProductIngredient[] = preparedIngredients.map(
        (ing) => {
          const inv = inventoryItems.find((i) => i.id === ing.inventoryItemId);
          return {
            inventoryItemId: ing.inventoryItemId,
            inventoryItemName: inv?.name || "",
            unit: inv?.unit || "",
            unitLabel: inv?.unitLabel || "",
            quantityUsed: ing.quantityUsed,
            currentStock: inv?.currentStock ?? 0,
          };
        },
      );
      const previousCategoryId = prodModal.data?.categoryId;

      if (prodModal.data) {
        const updatedRes = await menuApi.updateProduct(prodModal.data.id, {
          ...payload,
          id: prodModal.data.id,
        });
        const updatedObj = updatedRes?.data || updatedRes;
        if (Array.isArray(updatedObj?.ingredients)) {
          savedIngredients = updatedObj.ingredients;
        }
        finalProductId = prodModal.data.id;
      } else {
        const createdRes = await menuApi.createProduct(payload);
        const createdObj = createdRes?.data || createdRes;
        if (Array.isArray(createdObj?.ingredients)) {
          savedIngredients = createdObj.ingredients;
        }
        finalProductId = String(createdObj?.id || "");
      }

      if (!finalProductId) {
        throw new Error("آیدی محصول پس از ذخیره دریافت نشد.");
      }

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
          showToast(
            "اطلاعات محصول ذخیره شد، اما آپلود عکس با خطا مواجه شد.",
            "error",
          );
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
        ingredients: savedIngredients,
      };

      setCategories((prevCategories) =>
        prevCategories.map((cat) => {
          if (
            prodModal.data &&
            previousCategoryId &&
            previousCategoryId !== prodModal.categoryId &&
            cat.id === previousCategoryId
          ) {
            return {
              ...cat,
              items: (cat.items || []).filter((i) => i.id !== finalProductId),
            };
          }

          if (cat.id === prodModal.categoryId) {
            const items = cat.items || [];
            if (prodModal.data && previousCategoryId === prodModal.categoryId) {
              return {
                ...cat,
                items: items.map((item) =>
                  item.id === finalProductId ? localProduct : item,
                ),
              };
            }
            return { ...cat, items: [localProduct, ...items] };
          }
          return cat;
        }),
      );

      setProdModal({
        isOpen: false,
        categoryId: "",
        data: null,
        isDuplicate: false,
      });
      showToast(
        prodModal.data
          ? "تغییرات محصول ذخیره شد."
          : "محصول جدید به منو اضافه شد.",
      );
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
        showToast("محصول حذف شد.");
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

  const numericPreviewPrice = useMemo(() => {
    const clean = toEnglishDigits(prodForm.price).replace(/[^0-9]/g, "");
    return parseInt(clean, 10) || 0;
  }, [prodForm.price]);

  const buildIngredientsTooltip = (ings?: ProductIngredient[]) => {
    if (!ings || ings.length === 0) return "";
    return ings
      .map(
        (ing) =>
          `${ing.inventoryItemName || "کالا"}: ${formatNum(ing.quantityUsed)} ${ing.unitLabel || ""}`,
      )
      .join(" | ");
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
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
      className="min-h-screen bg-[#F5F5F7] relative overflow-x-hidden font-sans pb-28 lg:pb-16 text-slate-800"
      dir="rtl"
    >
      {/* اعلان شناور (Toast) */}
      {toast && (
        <div className="fixed top-5 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-5 py-3 rounded-full shadow-2xl font-black text-xs flex items-center gap-2.5 border ${
              toast.type === "error"
                ? "bg-rose-600 text-white border-rose-400/30"
                : "bg-slate-900/95 backdrop-blur-xl text-white border-white/10"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === "error" ? "bg-white" : "bg-emerald-400"
              }`}
            />
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* هاله‌های نوری ملایم */}
      <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[480px] h-[480px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ================= هدر و دکمه‌های اصلی ================= */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="w-11 h-11 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-xl shadow-2xs border border-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all active:scale-95 shrink-0"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                مدیریت منو و محصولات
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-bold mt-0.5">
                ویرایش سریع قیمت‌ها، اتصال به انبار و دسته‌بندی غذاها
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/inventory"
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
            >
              <Boxes size={17} className="text-orange-500" />
              <span>انبارداری</span>
            </Link>

            <button
              type="button"
              onClick={() => openCatModal(null)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
            >
              <FolderPlus size={17} className="text-orange-500" />
              <span>دسته‌بندی جدید</span>
            </button>

            <button
              type="button"
              onClick={() => openProdModal()}
              className="bg-slate-900 hover:bg-orange-500 text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-slate-900/15 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={2.8} />
              <span>محصول جدید</span>
            </button>
          </div>
        </header>

        {/* ================= ۴ کارت آمار قابل کلیک (Quick Status Filters) ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              key: "all" as StatusFilter,
              label: "کل محصولات منو",
              count: stats.total,
              icon: Layers,
              activeRing: "border-slate-900 bg-white shadow-md",
              iconBox: "bg-slate-100 text-slate-700",
              countColor: "text-slate-900",
            },
            {
              key: "active" as StatusFilter,
              label: "موجود و فعال",
              count: stats.active,
              icon: CheckCircle2,
              activeRing: "border-emerald-500 bg-white shadow-md",
              iconBox: "bg-emerald-50 text-emerald-600",
              countColor: "text-emerald-600",
            },
            {
              key: "unavailable" as StatusFilter,
              label: "ناموجود / مخفی",
              count: stats.unavailable,
              icon: EyeOff,
              activeRing: "border-rose-500 bg-white shadow-md",
              iconBox: "bg-rose-50 text-rose-600",
              countColor: "text-rose-600",
            },
            {
              key: "low_stock" as StatusFilter,
              label: "رو به اتمام (≤ ۵)",
              count: stats.lowStock,
              icon: Flame,
              activeRing: "border-amber-500 bg-white shadow-md",
              iconBox: "bg-amber-50 text-amber-600",
              countColor: "text-amber-600",
            },
          ].map((card) => {
            const isSelected = statusFilter === card.key;
            const CardIcon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    isSelected && card.key !== "all" ? "all" : card.key,
                  )
                }
                className={`text-right p-4 rounded-[24px] border-2 transition-all flex items-center justify-between ${
                  isSelected
                    ? card.activeRing
                    : "bg-white/80 border-white hover:bg-white shadow-2xs"
                }`}
              >
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">
                    {card.label}
                  </span>
                  <span className={`text-2xl font-black ${card.countColor}`}>
                    {card.count.toLocaleString("fa-IR")}
                  </span>
                </div>
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBox}`}
                >
                  <CardIcon size={20} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ================= چیدمان اصلی: سایدبار دسته‌بندی + فضای کاری محصولات ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ستون کناری دسته‌بندی‌ها */}
          <aside className="lg:col-span-3 lg:sticky lg:top-6 space-y-3">
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-black text-slate-500">
                  دسته‌بندی‌ها ({categories.length.toLocaleString("fa-IR")})
                </span>
                <button
                  type="button"
                  onClick={() => openCatModal(null)}
                  title="افزودن دسته"
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-500 text-slate-600 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Plus size={14} strokeWidth={2.8} />
                </button>
              </div>

              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[62vh] hide-scrollbar pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`shrink-0 lg:shrink px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 transition-all ${
                    selectedCategoryId === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50/80 lg:bg-transparent text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>همه دسته‌بندی‌ها</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] ${
                      selectedCategoryId === "all"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {stats.total.toLocaleString("fa-IR")}
                  </span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const count = cat.items?.length || 0;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`group shrink-0 lg:shrink cursor-pointer px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                          : "bg-slate-50/80 lg:bg-transparent text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate font-black">{cat.nameFa}</span>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            isSelected
                              ? "bg-black/20 text-white"
                              : "bg-slate-200/70 text-slate-500"
                          }`}
                        >
                          {count.toLocaleString("fa-IR")}
                        </span>

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="hidden lg:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                        >
                          <button
                            type="button"
                            onClick={() => openCatModal(cat)}
                            title="ویرایش دسته"
                            className={`p-1 rounded-md ${
                              isSelected
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(cat.id)}
                            title="حذف دسته"
                            className={`p-1 rounded-md ${
                              isSelected
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-rose-100 text-rose-500"
                            }`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ستون اصلی محصولات */}
          <div className="lg:col-span-9 space-y-5">
            {/* نوار جستجو و سوییچ نمایش */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[26px] p-3 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  type="text"
                  placeholder="جستجوی سریع نام غذا، ترکیبات یا دسته‌بندی..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/90 border border-slate-200/70 focus:bg-white focus:border-orange-500 rounded-2xl py-2.5 pr-10 pl-9 text-xs sm:text-sm font-bold text-slate-800 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                {selectedCategoryId === "all" && categories.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-black">
                    <button
                      type="button"
                      onClick={() => setAllCategoriesCollapsed(false)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-white transition-colors"
                    >
                      باز کردن همه
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllCategoriesCollapsed(true)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-white transition-colors"
                    >
                      جمع کردن همه
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    title="نمای لیستی فشرده"
                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black ${
                      viewMode === "table"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LayoutList size={16} />
                    <span className="hidden md:inline">لیست فشرده</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="نمای کارتی تصویری"
                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black ${
                      viewMode === "grid"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LayoutGrid size={16} />
                    <span className="hidden md:inline">کارت تصویری</span>
                  </button>
                </div>
              </div>
            </div>

            {/* لیست دسته‌بندی‌ها و محصولات */}
            {filteredCategories.length === 0 ? (
              <div className="text-center py-20 bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-2xs">
                <LayoutList
                  size={48}
                  className="text-slate-300 mx-auto mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="text-slate-800 font-black mb-1.5 text-lg">
                  محصول یا دسته‌بندی یافت نشد!
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-bold mb-6">
                  فیلترهای جستجو را تغییر دهید یا اولین دسته‌بندی و محصول خود را
                  اضافه کنید.
                </p>
                {categories.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openCatModal(null)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> ایجاد اولین دسته‌بندی
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSelectedCategoryId("all");
                    }}
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs"
                  >
                    پاک کردن فیلترها
                  </button>
                )}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isCollapsed =
                  selectedCategoryId === "all" &&
                  Boolean(collapsedCats[category.id]);

                return (
                  <section
                    key={category.id}
                    className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.03)]"
                  >
                    <div
                      onClick={() => {
                        if (selectedCategoryId === "all") {
                          toggleCollapseCategory(category.id);
                        }
                      }}
                      className={`px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 ${
                        selectedCategoryId === "all" ? "cursor-pointer" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedCategoryId === "all" && (
                          <span className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                            {isCollapsed ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronUp size={16} />
                            )}
                          </span>
                        )}

                        <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                          {category.nameFa}
                        </h2>

                        {isBilingual && category.nameEn && (
                          <span
                            className="hidden sm:inline-block text-[11px] font-bold text-slate-400 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80"
                            dir="ltr"
                          >
                            {category.nameEn}
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-black">
                          {(category.items?.length || 0).toLocaleString(
                            "fa-IR",
                          )}{" "}
                          آیتم
                        </span>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => openProdModal(category.id, null)}
                          className="bg-slate-900 hover:bg-orange-500 text-white px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-colors"
                        >
                          <Plus size={14} strokeWidth={2.8} />
                          <span>افزودن</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openCatModal(category)}
                          title="ویرایش دسته"
                          className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200/80 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          title="حذف دسته"
                          className="w-8 h-8 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200/80 rounded-xl flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {category.items.length === 0 ? (
                          <div className="py-8 text-center text-xs font-bold text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            هنوز محصولی در این دسته‌بندی ثبت نشده است.
                          </div>
                        ) : viewMode === "table" ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400">
                                  <th className="py-2.5 px-2">محصول</th>
                                  <th className="py-2.5 px-3">
                                    قیمت (کلیک برای ویرایش)
                                  </th>
                                  <th className="py-2.5 px-3 hidden sm:table-cell">
                                    موجودی / انبار
                                  </th>
                                  <th className="py-2.5 px-3 text-center">
                                    نمایش در منو
                                  </th>
                                  <th className="py-2.5 px-2 text-left">
                                    عملیات
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                                {category.items.map((item) => {
                                  const isOut =
                                    item.isAvailableInMenu === false ||
                                    item.stock === 0;
                                  const isUpdating = Boolean(
                                    updatingItemIds[item.id],
                                  );
                                  const ingCount =
                                    item.ingredients?.length || 0;

                                  return (
                                    <tr
                                      key={item.id}
                                      className={`group hover:bg-slate-50/80 transition-colors ${
                                        isOut ? "opacity-60" : ""
                                      }`}
                                    >
                                      <td className="py-3 px-2">
                                        <div className="flex items-center gap-3 min-w-[180px]">
                                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.imageUrl ? (
                                              <img
                                                src={getFullImageUrl(
                                                  item.imageUrl,
                                                )}
                                                alt={item.nameFa}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <ImageIcon
                                                size={18}
                                                className="text-slate-300"
                                              />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <span className="font-black text-slate-900 text-xs sm:text-sm block truncate max-w-[220px]">
                                              {item.nameFa}
                                            </span>
                                            {item.descriptionFa && (
                                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[220px]">
                                                {item.descriptionFa}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      <td className="py-3 px-3 whitespace-nowrap">
                                        {inlinePriceId === item.id ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="tel"
                                              dir="ltr"
                                              autoFocus
                                              value={inlinePriceValue}
                                              onChange={(e) =>
                                                setInlinePriceValue(
                                                  toEnglishDigits(
                                                    e.target.value,
                                                  ).replace(/[^0-9]/g, ""),
                                                )
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  saveInlinePrice(item);
                                                } else if (e.key === "Escape") {
                                                  setInlinePriceId(null);
                                                }
                                              }}
                                              className="w-24 bg-white border-2 border-orange-500 rounded-lg px-2 py-1 font-mono text-xs font-black text-slate-900 outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                saveInlinePrice(item)
                                              }
                                              className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
                                            >
                                              <Check
                                                size={13}
                                                strokeWidth={3}
                                              />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setInlinePriceId(null)
                                              }
                                              className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center"
                                            >
                                              <X size={13} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              startInlinePriceEdit(item)
                                            }
                                            title="برای تغییر سریع قیمت کلیک کنید"
                                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/70 hover:border-orange-200 font-black text-slate-900 hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
                                          >
                                            <span>
                                              {Number(
                                                item.price || 0,
                                              ).toLocaleString("fa-IR")}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                              تومان
                                            </span>
                                          </button>
                                        )}
                                      </td>

                                      <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {item.stock !== null &&
                                          item.stock !== undefined ? (
                                            <span
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${
                                                item.stock === 0
                                                  ? "bg-rose-50 text-rose-600"
                                                  : item.stock <= 5
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-slate-100 text-slate-700"
                                              }`}
                                            >
                                              {item.stock.toLocaleString(
                                                "fa-IR",
                                              )}{" "}
                                              عدد
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-slate-400 font-bold">
                                              نامحدود
                                            </span>
                                          )}

                                          {ingCount > 0 && (
                                            <span
                                              title={buildIngredientsTooltip(
                                                item.ingredients,
                                              )}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 border border-orange-200/70 text-orange-600 text-[10px] font-black"
                                            >
                                              <Boxes size={11} />
                                              <span>
                                                انبار (
                                                {ingCount.toLocaleString(
                                                  "fa-IR",
                                                )}
                                                )
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          disabled={isUpdating}
                                          onClick={() =>
                                            handleQuickToggleAvailability(item)
                                          }
                                          dir="ltr"
                                          className={`w-11 h-6 rounded-full p-0.5 transition-colors inline-flex items-center ${
                                            item.isAvailableInMenu !== false
                                              ? "bg-emerald-500 justify-end"
                                              : "bg-slate-200 justify-start"
                                          }`}
                                        >
                                          <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                                        </button>
                                      </td>

                                      <td className="py-3 px-2 text-left whitespace-nowrap">
                                        <div className="inline-flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openProdModal(
                                                category.id,
                                                item,
                                                true,
                                              )
                                            }
                                            title="کپی محصول"
                                            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                          >
                                            <Copy size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openProdModal(category.id, item)
                                            }
                                            title="ویرایش کامل"
                                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteProduct(
                                                category.id,
                                                item.id,
                                              )
                                            }
                                            title="حذف"
                                            className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map((item) => {
                              const isHidden =
                                item.isAvailableInMenu === false ||
                                item.stock === 0;
                              const ingCount = item.ingredients?.length || 0;

                              return (
                                <div
                                  key={item.id}
                                  className={`bg-white border border-slate-100 rounded-[24px] p-3.5 flex gap-4 group hover:border-orange-200 transition-all shadow-2xs ${
                                    isHidden ? "opacity-60 bg-slate-50" : ""
                                  }`}
                                >
                                  <div className="w-22 h-22 bg-slate-50 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                    {item.imageUrl ? (
                                      <img
                                        src={getFullImageUrl(item.imageUrl)}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        alt={item.nameFa}
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={28}
                                        strokeWidth={1.5}
                                        className="text-slate-300"
                                      />
                                    )}
                                  </div>

                                  <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-black text-slate-900 text-sm truncate">
                                          {item.nameFa}
                                        </h4>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openProdModal(
                                                category.id,
                                                item,
                                                true,
                                              )
                                            }
                                            title="کپی"
                                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg"
                                          >
                                            <Copy size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openProdModal(category.id, item)
                                            }
                                            title="ویرایش"
                                            className="p-1.5 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded-lg"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              deleteProduct(
                                                category.id,
                                                item.id,
                                              )
                                            }
                                            title="حذف"
                                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-1">
                                        {item.descriptionFa || "بدون توضیحات"}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-2 border-t border-slate-50">
                                      <span className="font-black text-slate-900 text-sm">
                                        {Number(item.price || 0).toLocaleString(
                                          "fa-IR",
                                        )}{" "}
                                        <span className="text-[10px] text-slate-400 font-bold">
                                          تومان
                                        </span>
                                      </span>

                                      <div className="flex items-center gap-1.5">
                                        {ingCount > 0 && (
                                          <span
                                            title={buildIngredientsTooltip(
                                              item.ingredients,
                                            )}
                                            className="text-[10px] font-black px-2 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 inline-flex items-center gap-1"
                                          >
                                            <Boxes size={11} />
                                            <span>
                                              {ingCount.toLocaleString("fa-IR")}{" "}
                                              ماده
                                            </span>
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuickToggleAvailability(item)
                                          }
                                          className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                                            isHidden
                                              ? "text-rose-600 bg-rose-50 border-rose-100"
                                              : "text-emerald-700 bg-emerald-50 border-emerald-100"
                                          }`}
                                        >
                                          {isHidden ? (
                                            <Package size={12} />
                                          ) : (
                                            <CheckCircle2 size={12} />
                                          )}
                                          <span>
                                            {!item.isAvailableInMenu
                                              ? "ناموجود"
                                              : item.stock !== null &&
                                                  item.stock !== undefined
                                                ? `موجودی: ${item.stock}`
                                                : "فعال"}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ================= مودال دسته‌بندی ================= */}
      {catModal.isOpen && (
        <div
          onClick={() =>
            !isSaving && setCatModal({ isOpen: false, data: null })
          }
          className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[36px] p-6 lg:p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setCatModal({ isOpen: false, data: null })}
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full bg-slate-50"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-6 mt-1">
              {catModal.data ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  نام دسته (فارسی)
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: غذای اصلی"
                  value={catFormNameFa}
                  onChange={(e) => setCatFormNameFa(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 outline-none font-bold text-sm transition-all"
                  autoFocus
                />
              </div>
              {isBilingual && (
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    نام دسته (انگلیسی)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="e.g. Main Course"
                    value={catFormNameEn}
                    onChange={(e) => setCatFormNameEn(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 outline-none font-bold text-sm text-left transition-all"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={saveCategory}
              disabled={isSaving || !catFormNameFa.trim()}
              className="w-full bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-2xl font-black transition-all shadow-lg active:scale-95 text-sm"
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

      {/* ================= مودال محصول (همراه با اتصال اختیاری به انبار) ================= */}
      {prodModal.isOpen && (
        <div
          onClick={() =>
            !isSaving &&
            setProdModal({
              isOpen: false,
              categoryId: "",
              data: null,
              isDuplicate: false,
            })
          }
          className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-9 w-full max-w-4xl shadow-2xl relative max-h-[94vh] overflow-y-auto hide-scrollbar animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() =>
                setProdModal({
                  isOpen: false,
                  categoryId: "",
                  data: null,
                  isDuplicate: false,
                })
              }
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-full bg-slate-50 z-20"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
              {prodModal.data
                ? "ویرایش محصول"
                : prodModal.isDuplicate
                  ? "ایجاد محصول مشابه"
                  : "افزودن محصول جدید"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-7 lg:gap-10">
              {/* ستون تصویر و وضعیت نمایش */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={prodImageRef}
                  onChange={handleProdImageUpload}
                />
                {prodForm.imagePreview ? (
                  <div className="relative w-full aspect-square rounded-[28px] overflow-hidden group border border-slate-100 shadow-sm">
                    <img
                      src={prodForm.imagePreview}
                      className="w-full h-full object-cover"
                      alt="Product Preview"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300">
                      <button
                        type="button"
                        onClick={() => prodImageRef.current?.click()}
                        className="bg-white/25 p-3.5 rounded-2xl hover:bg-white/40 text-white transition-colors"
                      >
                        <Camera size={22} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveProdImage}
                        className="bg-white/25 p-3.5 rounded-2xl hover:bg-rose-500 text-white transition-colors"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => prodImageRef.current?.click()}
                    className="w-full aspect-square rounded-[28px] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer text-slate-400 bg-slate-50/60 hover:bg-slate-50 hover:text-slate-800 hover:border-orange-400 transition-all"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                      <Camera
                        size={26}
                        strokeWidth={1.6}
                        className="text-orange-500"
                      />
                    </div>
                    <span className="text-sm font-black text-slate-700">
                      انتخاب تصویر محصول
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 mt-1">
                      فرمت‌های JPG یا PNG
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      موجود و قابل نمایش در منو
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      در صورت غیرفعال بودن، ناموجود نمایش داده می‌شود
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
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>

              {/* ستون فیلدهای اطلاعات */}
              <div className="md:col-span-3 space-y-4 flex flex-col">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    دسته‌بندی محصول
                  </label>
                  <select
                    value={prodModal.categoryId}
                    onChange={(e) =>
                      setProdModal((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-sm font-black text-slate-900 outline-none transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameFa}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={
                    isBilingual ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""
                  }
                >
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">
                      نام محصول (فارسی)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: پاستا پنه آلفردو"
                      value={prodForm.nameFa}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, nameFa: e.target.value })
                      }
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none transition-all"
                    />
                  </div>
                  {isBilingual && (
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1.5">
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
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-sm font-bold text-left outline-none transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-500">
                        قیمت (تومان)
                      </label>
                      {numericPreviewPrice > 0 && (
                        <span className="text-[11px] font-black text-orange-600">
                          {numericPreviewPrice.toLocaleString("fa-IR")} تومان
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="245000"
                      value={prodForm.price}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          price: toEnglishDigits(e.target.value).replace(
                            /[^0-9]/g,
                            "",
                          ),
                        })
                      }
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-sm font-mono font-bold text-left outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">
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
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-sm font-mono font-bold text-left outline-none transition-all placeholder:font-sans placeholder:text-right"
                    />
                  </div>
                </div>

                <div
                  className={
                    isBilingual ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""
                  }
                >
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1.5">
                      توضیحات و ترکیبات (فارسی)
                    </label>
                    <textarea
                      rows={isBilingual ? 3 : 3}
                      placeholder="پنه، سس آلفردو، قارچ، مرغ گریل شده..."
                      value={prodForm.descriptionFa}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          descriptionFa: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-xs sm:text-sm font-medium resize-none outline-none transition-all leading-relaxed"
                    />
                  </div>
                  {isBilingual && (
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1.5">
                        توضیحات (انگلیسی)
                      </label>
                      <textarea
                        dir="ltr"
                        rows={3}
                        placeholder="Penne pasta, Alfredo sauce, mushroom, grilled chicken..."
                        value={prodForm.descriptionEn}
                        onChange={(e) =>
                          setProdForm({
                            ...prodForm,
                            descriptionEn: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-xs sm:text-sm font-medium resize-none text-left outline-none transition-all leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                {/* ================= بخش اختیاری کسر خودکار از انبار ================= */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-[24px] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Boxes size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          مواد مصرفی از انبار (اختیاری)
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">
                          با ثبت هر ۱ عدد سفارش، این مقادیر خودکار از انبار کسر
                          می‌شوند
                        </p>
                      </div>
                    </div>

                    {inventoryItems.length > 0 && (
                      <button
                        type="button"
                        onClick={addIngredientRow}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-500 text-slate-700 hover:text-white border border-slate-200 hover:border-orange-500 text-[11px] font-black inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus size={13} strokeWidth={2.8} />
                        <span>افزودن ماده</span>
                      </button>
                    )}
                  </div>

                  {inventoryItems.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[11px] font-bold text-slate-500 mb-2">
                        هنوز هیچ ماده اولیه‌ای در انبار تعریف نشده است.
                      </p>
                      <Link
                        to="/inventory"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600 hover:underline"
                      >
                        <span>رفتن به صفحه انبارداری</span>
                      </Link>
                    </div>
                  ) : prodForm.ingredients.length === 0 ? (
                    <p className="text-[11px] font-bold text-slate-400 bg-white/70 border border-dashed border-slate-200 rounded-2xl py-3 px-3.5 text-center">
                      بدون اتصال به انبار — برای فعال‌سازی کسر خودکار، روی
                      «افزودن ماده» بزنید.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {prodForm.ingredients.map((row, idx) => {
                        const selectedInv = inventoryItems.find(
                          (i) => i.id === row.inventoryItemId,
                        );
                        const usedInOtherRows = new Set(
                          prodForm.ingredients
                            .filter((_, otherIdx) => otherIdx !== idx)
                            .map((r) => r.inventoryItemId),
                        );

                        return (
                          <div
                            key={`${idx}-${row.inventoryItemId}`}
                            className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                          >
                            <select
                              value={row.inventoryItemId}
                              onChange={(e) =>
                                updateIngredientRow(idx, {
                                  inventoryItemId: e.target.value,
                                })
                              }
                              className="flex-1 bg-slate-50 border border-slate-200/70 rounded-xl py-2 px-3 text-xs font-black text-slate-800 outline-none focus:border-orange-500"
                            >
                              {inventoryItems.map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  disabled={usedInOtherRows.has(opt.id)}
                                >
                                  {opt.name} (موجودی:{" "}
                                  {formatNum(opt.currentStock)} {opt.unitLabel})
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1 sm:w-32">
                                <input
                                  type="text"
                                  dir="ltr"
                                  placeholder="مقدار"
                                  value={row.quantityUsed}
                                  onChange={(e) =>
                                    updateIngredientRow(idx, {
                                      quantityUsed: toEnglishDecimal(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="w-full bg-slate-50 focus:bg-white border border-slate-200/70 focus:border-orange-500 rounded-xl py-2 pl-3 pr-14 text-xs font-mono font-black text-left outline-none"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                                  {selectedInv?.unitLabel || "واحد"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeIngredientRow(idx)}
                                title="حذف این ماده"
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    onClick={saveProduct}
                    disabled={
                      isSaving ||
                      !prodForm.nameFa.trim() ||
                      !prodForm.price.trim()
                    }
                    className="w-full bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin mx-auto" size={22} />
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
