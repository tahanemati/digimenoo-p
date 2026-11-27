import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Plus,
  Search,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  Edit2,
  Trash2,
  X,
  Loader2,
  History,
  Coins,
  Layers,
  RefreshCw,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import { inventoryApi } from "../service/api";

export type InventoryUnit =
  | "gram"
  | "kg"
  | "piece"
  | "ml"
  | "liter"
  | "pack"
  | "portion";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: InventoryUnit;
  unitLabel: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  notes: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  usedInProductsCount: number;
}

type TxType = "in" | "out" | "order" | "order_cancel" | "adjust";

interface InventoryTx {
  id: string;
  itemId: string;
  itemName: string;
  unit: InventoryUnit;
  unitLabel: string;
  txType: TxType;
  txTypeLabel: string;
  quantityChange: number;
  stockAfter: number;
  orderNumber: number | null;
  note: string;
  createdByName: string;
  createdAt: string;
}

type TabKey = "items" | "transactions";
type StockFilter = "all" | "healthy" | "low" | "out";

const UNIT_OPTIONS: { value: InventoryUnit; label: string }[] = [
  { value: "gram", label: "گرم" },
  { value: "kg", label: "کیلوگرم" },
  { value: "piece", label: "عدد" },
  { value: "ml", label: "میلی‌لیتر" },
  { value: "liter", label: "لیتر" },
  { value: "pack", label: "بسته" },
  { value: "portion", label: "پرس" },
];

const toEnglishDecimal = (str: string) => {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const normalized = str
    .replace(/[٫/]/g, ".")
    .split("")
    .map((c) => {
      const pIdx = persian.indexOf(c);
      if (pIdx >= 0) return String(pIdx);
      const aIdx = arabic.indexOf(c);
      if (aIdx >= 0) return String(aIdx);
      return c;
    })
    .join("")
    .replace(/[^0-9.]/g, "");

  const parts = normalized.split(".");
  if (parts.length <= 1) return normalized;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const formatNum = (val: number) =>
  Number(val || 0).toLocaleString("fa-IR", { maximumFractionDigits: 3 });

const formatDateTime = (iso: string) => {
  if (!iso) return "---";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTx[]>([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    healthyCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [txItemFilter, setTxItemFilter] = useState<string>("all");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [itemModal, setItemModal] = useState<{
    isOpen: boolean;
    editing: InventoryItem | null;
  }>({ isOpen: false, editing: null });

  const [itemForm, setItemForm] = useState<{
    name: string;
    category: string;
    unit: InventoryUnit;
    currentStock: string;
    minStock: string;
    unitCost: string;
    notes: string;
  }>({
    name: "",
    category: "",
    unit: "gram",
    currentStock: "",
    minStock: "",
    unitCost: "",
    notes: "",
  });

  const [adjustModal, setAdjustModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    type: "in" | "out" | "adjust";
  }>({ isOpen: false, item: null, type: "in" });
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const role = (localStorage.getItem("role") || "owner").toLowerCase();
  const isOwner = role === "owner";

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchInventoryData = async () => {
    try {
      setPageError("");
      const [itemsRes, txRes] = await Promise.all([
        inventoryApi.getItems(),
        inventoryApi.getTransactions().catch(() => ({ data: [] })),
      ]);

      const payload = itemsRes?.data?.data || itemsRes?.data || itemsRes || {};
      const list: InventoryItem[] = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];

      setItems(list);
      if (payload.summary) {
        setSummary(payload.summary);
      } else {
        const low = list.filter((i) => i.isLowStock).length;
        const out = list.filter((i) => i.isOutOfStock).length;
        setSummary({
          totalItems: list.length,
          lowStockCount: low,
          outOfStockCount: out,
          healthyCount: Math.max(0, list.length - low - out),
          totalValue: list.reduce(
            (acc, i) =>
              acc + Math.round((i.currentStock || 0) * (i.unitCost || 0)),
            0,
          ),
        });
      }

      const rawTx = txRes?.data?.data || txRes?.data || txRes || [];
      setTransactions(Array.isArray(rawTx) ? rawTx : []);
    } catch (err: any) {
      setPageError(err?.message || "خطا در دریافت اطلاعات انبار.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category?.trim()) set.add(item.category.trim());
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (stockFilter === "out" && !item.isOutOfStock) return false;
      if (stockFilter === "low" && !item.isLowStock) return false;
      if (stockFilter === "healthy" && (item.isOutOfStock || item.isLowStock)) {
        return false;
      }
      if (
        selectedCategory !== "all" &&
        (item.category || "").trim() !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, stockFilter, selectedCategory]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txItemFilter !== "all" && tx.itemId !== txItemFilter) return false;
      if (txTypeFilter !== "all" && tx.txType !== txTypeFilter) return false;
      return true;
    });
  }, [transactions, txItemFilter, txTypeFilter]);

  const openCreateModal = () => {
    setItemForm({
      name: "",
      category: "",
      unit: "gram",
      currentStock: "",
      minStock: "",
      unitCost: "",
      notes: "",
    });
    setItemModal({ isOpen: true, editing: null });
  };

  const openEditModal = (item: InventoryItem) => {
    setItemForm({
      name: item.name,
      category: item.category || "",
      unit: item.unit,
      currentStock: String(item.currentStock ?? 0),
      minStock: String(item.minStock ?? 0),
      unitCost: item.unitCost ? String(item.unitCost) : "",
      notes: item.notes || "",
    });
    setItemModal({ isOpen: true, editing: item });
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        category: itemForm.category.trim(),
        unit: itemForm.unit,
        currentStock: parseFloat(toEnglishDecimal(itemForm.currentStock)) || 0,
        minStock: parseFloat(toEnglishDecimal(itemForm.minStock)) || 0,
        unitCost: parseInt(toEnglishDecimal(itemForm.unitCost), 10) || 0,
        notes: itemForm.notes.trim(),
      };

      if (itemModal.editing) {
        await inventoryApi.updateItem(itemModal.editing.id, payload);
        showToast("اطلاعات کالای انبار بروزرسانی شد.");
      } else {
        await inventoryApi.createItem(payload);
        showToast("کالای جدید به انبار اضافه شد.");
      }

      setItemModal({ isOpen: false, editing: null });
      await fetchInventoryData();
    } catch (err: any) {
      showToast(err?.message || "خطا در ذخیره کالای انبار.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirmMsg =
      item.usedInProductsCount > 0
        ? `کالای «${item.name}» به ${item.usedInProductsCount} محصول منو متصل است. با حذف آن، اتصال این ماده از محصولات نیز پاک می‌شود. ادامه می‌دهید؟`
        : `آیا از حذف «${item.name}» از انبار مطمئن هستید؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await inventoryApi.deleteItem(item.id);
      showToast(`«${item.name}» از انبار حذف شد.`);
      await fetchInventoryData();
    } catch (err: any) {
      showToast(err?.message || "خطا در حذف کالا.", "error");
    }
  };

  const openAdjustModal = (
    item: InventoryItem,
    type: "in" | "out" | "adjust",
  ) => {
    setAdjustQty(type === "adjust" ? String(item.currentStock) : "");
    setAdjustNote("");
    setAdjustModal({ isOpen: true, item, type });
  };

  const previewStockAfterAdjust = useMemo(() => {
    if (!adjustModal.item) return null;
    const raw = toEnglishDecimal(adjustQty);
    if (raw === "") return adjustModal.item.currentStock;
    const qty = parseFloat(raw);
    if (Number.isNaN(qty) || qty < 0) return adjustModal.item.currentStock;
    if (adjustModal.type === "in") return adjustModal.item.currentStock + qty;
    if (adjustModal.type === "out")
      return Math.max(0, adjustModal.item.currentStock - qty);
    return qty;
  }, [adjustModal, adjustQty]);

  const handleConfirmAdjust = async () => {
    if (!adjustModal.item) return;
    const qty = parseFloat(toEnglishDecimal(adjustQty));
    if (
      Number.isNaN(qty) ||
      qty < 0 ||
      (adjustModal.type !== "adjust" && qty === 0)
    ) {
      showToast("مقدار معتبر وارد کنید.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await inventoryApi.adjustStock(adjustModal.item.id, {
        type: adjustModal.type,
        quantity: qty,
        note: adjustNote.trim(),
      });
      showToast("موجودی انبار بروزرسانی شد.");
      setAdjustModal({ isOpen: false, item: null, type: "in" });
      await fetchInventoryData();
    } catch (err: any) {
      showToast(err?.message || "خطا در ثبت تغییرات موجودی.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getTxBadge = (txType: TxType) => {
    switch (txType) {
      case "in":
        return {
          cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: ArrowDownCircle,
        };
      case "out":
        return {
          cls: "bg-amber-50 text-amber-700 border-amber-100",
          icon: ArrowUpCircle,
        };
      case "order":
        return {
          cls: "bg-orange-50 text-orange-600 border-orange-100",
          icon: ShoppingBag,
        };
      case "order_cancel":
        return {
          cls: "bg-blue-50 text-blue-600 border-blue-100",
          icon: RotateCcw,
        };
      default:
        return {
          cls: "bg-slate-100 text-slate-700 border-slate-200",
          icon: SlidersHorizontal,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (pageError) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6"
        dir="rtl"
      >
        <div className="bg-white/90 backdrop-blur-2xl max-w-md w-full rounded-[36px] p-8 shadow-xl text-center border border-white">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={34} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            خطا در بارگذاری انبار
          </h2>
          <p className="text-sm font-bold text-slate-500 mb-6">{pageError}</p>
          <button
            type="button"
            onClick={fetchInventoryData}
            className="w-full bg-slate-900 hover:bg-orange-500 text-white py-3.5 rounded-2xl font-black text-sm transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative overflow-x-hidden font-sans pb-28 lg:pb-16 text-slate-800"
      dir="rtl"
    >
      {/* اعلان شناور */}
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

      <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ================= هدر ================= */}
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
                انبارداری و مواد اولیه
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-bold mt-0.5">
                مدیریت موجودی انبار و کسر خودکار مواد مصرفی با هر سفارش منو
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchInventoryData}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-3.5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-2xs transition-all"
            >
              <RefreshCw size={15} />
              <span>بروزرسانی</span>
            </button>

            <Link
              to="/products"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all"
            >
              <Layers size={16} className="text-orange-500" />
              <span>اتصال به محصولات منو</span>
            </Link>

            <button
              type="button"
              onClick={openCreateModal}
              className="bg-slate-900 hover:bg-orange-500 text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-slate-900/15 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={2.8} />
              <span>افزودن کالای انبار</span>
            </button>
          </div>
        </header>

        {/* ================= کارت‌های آمار ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[
            {
              key: "all" as StockFilter,
              label: "کل کالاهای انبار",
              value: formatNum(summary.totalItems),
              icon: Boxes,
              activeRing: "border-slate-900 bg-white shadow-md",
              iconBox: "bg-slate-100 text-slate-700",
              textColor: "text-slate-900",
            },
            {
              key: "healthy" as StockFilter,
              label: "موجودی کافی",
              value: formatNum(summary.healthyCount),
              icon: CheckCircle2,
              activeRing: "border-emerald-500 bg-white shadow-md",
              iconBox: "bg-emerald-50 text-emerald-600",
              textColor: "text-emerald-600",
            },
            {
              key: "low" as StockFilter,
              label: "هشدار کمبود",
              value: formatNum(summary.lowStockCount),
              icon: AlertTriangle,
              activeRing: "border-amber-500 bg-white shadow-md",
              iconBox: "bg-amber-50 text-amber-600",
              textColor: "text-amber-600",
            },
            {
              key: "out" as StockFilter,
              label: "اتمام موجودی",
              value: formatNum(summary.outOfStockCount),
              icon: PackageX,
              activeRing: "border-rose-500 bg-white shadow-md",
              iconBox: "bg-rose-50 text-rose-600",
              textColor: "text-rose-600",
            },
          ].map((card) => {
            const isSelected =
              activeTab === "items" && stockFilter === card.key;
            const CardIcon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setActiveTab("items");
                  setStockFilter(
                    isSelected && card.key !== "all" ? "all" : card.key,
                  );
                }}
                className={`text-right p-4 rounded-[24px] border-2 transition-all flex items-center justify-between ${
                  isSelected
                    ? card.activeRing
                    : "bg-white/85 border-white hover:bg-white shadow-2xs"
                }`}
              >
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">
                    {card.label}
                  </span>
                  <span className={`text-2xl font-black ${card.textColor}`}>
                    {card.value}
                  </span>
                </div>
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBox}`}
                >
                  <CardIcon size={19} />
                </div>
              </button>
            );
          })}

          {/* کارت ارزش کل انبار */}
          <div className="col-span-2 lg:col-span-1 bg-slate-900 text-white p-4 rounded-[24px] flex items-center justify-between shadow-lg">
            <div className="min-w-0">
              <span className="block text-[11px] font-bold text-slate-400 mb-1">
                ارزش تخمینی انبار
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black truncate">
                  {Number(summary.totalValue || 0).toLocaleString("fa-IR")}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  تومان
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Coins size={19} />
            </div>
          </div>
        </div>

        {/* ================= تب‌های صفحه ================= */}
        <div className="bg-slate-200/70 p-1.5 rounded-[20px] inline-grid grid-cols-2 gap-1.5 mb-6 border border-white/80">
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
              activeTab === "items"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Boxes
              size={16}
              className={activeTab === "items" ? "text-orange-500" : ""}
            />
            <span>کالاها و موجودی انبار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all ${
              activeTab === "transactions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History
              size={16}
              className={activeTab === "transactions" ? "text-orange-500" : ""}
            />
            <span>
              گزارش ورود و خروج ({transactions.length.toLocaleString("fa-IR")})
            </span>
          </button>
        </div>

        {/* ================= تب ۱: لیست کالاهای انبار ================= */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[26px] p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  type="text"
                  placeholder="جستجوی نام ماده اولیه، دسته‌بندی یا یادداشت..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-orange-500 rounded-2xl py-2.5 pr-10 pl-9 text-xs sm:text-sm font-bold outline-none transition-all"
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

              {uniqueCategories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="all">همه دسته‌بندی‌های انبار</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="bg-white/85 border border-white rounded-[32px] py-20 px-6 text-center shadow-2xs">
                <Boxes
                  size={48}
                  className="text-slate-300 mx-auto mb-4"
                  strokeWidth={1.5}
                />
                <h3 className="text-lg font-black text-slate-800 mb-1.5">
                  {items.length === 0
                    ? "انبار شما هنوز خالی است"
                    : "کالایی با این فیلتر پیدا نشد"}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-400 mb-6 max-w-md mx-auto">
                  مواد اولیه (مثل گوشت، پنیر، دانه قهوه، نان یا نوشابه) را تعریف
                  کنید تا بتوانید در صفحه محصولات مقدار مصرف هر غذا را به آن‌ها
                  وصل کنید.
                </p>
                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="bg-slate-900 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> ثبت اولین کالای انبار
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStockFilter("all");
                      setSelectedCategory("all");
                    }}
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs"
                  >
                    حذف فیلترها
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[28px] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400">
                        <th className="py-3.5 px-4">نام ماده / کالا</th>
                        <th className="py-3.5 px-3">موجودی فعلی</th>
                        <th className="py-3.5 px-3 hidden md:table-cell">
                          نقطه هشدار
                        </th>
                        <th className="py-3.5 px-3 hidden sm:table-cell">
                          وضعیت
                        </th>
                        <th className="py-3.5 px-3 hidden lg:table-cell">
                          متصل به منو
                        </th>
                        <th className="py-3.5 px-4 text-left">عملیات انبار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="min-w-[160px]">
                              <span className="font-black text-slate-900 text-sm block">
                                {item.name}
                              </span>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                {item.category && (
                                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {item.category}
                                  </span>
                                )}
                                {item.unitCost > 0 && (
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    فی: {item.unitCost.toLocaleString("fa-IR")}{" "}
                                    تومان
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-sm font-black ${
                                item.isOutOfStock
                                  ? "text-rose-600"
                                  : item.isLowStock
                                    ? "text-amber-600"
                                    : "text-slate-900"
                              }`}
                            >
                              {formatNum(item.currentStock)}
                            </span>{" "}
                            <span className="text-[11px] text-slate-400 font-bold">
                              {item.unitLabel}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap hidden md:table-cell text-slate-500">
                            {item.minStock > 0
                              ? `${formatNum(item.minStock)} ${item.unitLabel}`
                              : "تنظیم نشده"}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap hidden sm:table-cell">
                            {item.isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-black">
                                <PackageX size={12} /> اتمام موجودی
                              </span>
                            ) : item.isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-black">
                                <AlertTriangle size={12} /> رو به اتمام
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black">
                                <CheckCircle2 size={12} /> موجود
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap hidden lg:table-cell">
                            {item.usedInProductsCount > 0 ? (
                              <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-black">
                                {item.usedInProductsCount.toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                محصول
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                بدون اتصال
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openAdjustModal(item, "in")}
                                title="ورود / شارژ انبار"
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white text-[11px] font-black inline-flex items-center gap-1 transition-colors"
                              >
                                <ArrowDownCircle size={13} />
                                <span className="hidden sm:inline">ورود</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openAdjustModal(item, "out")}
                                title="خروج دستی / ضایعات"
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-[11px] font-black inline-flex items-center gap-1 transition-colors"
                              >
                                <ArrowUpCircle size={13} />
                                <span className="hidden sm:inline">خروج</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openAdjustModal(item, "adjust")}
                                title="انبارگردانی و تنظیم دقیق موجودی"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white transition-colors"
                              >
                                <SlidersHorizontal size={13} />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title="ویرایش مشخصات کالا"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-500 text-slate-500 hover:text-white transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>

                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item)}
                                  title="حذف کالا"
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500 text-slate-400 hover:text-white transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= تب ۲: تاریخچه تراکنش‌های انبار ================= */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="bg-white/90 border border-white rounded-[24px] p-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-600">
                آخرین ۱۰۰ گردش انبار (شامل کسرهای خودکار سفارش‌ها)
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 outline-none"
                >
                  <option value="all">همه نوع عملیات</option>
                  <option value="order">کسر خودکار سفارش</option>
                  <option value="order_cancel">برگشت لغو سفارش</option>
                  <option value="in">ورود / خرید</option>
                  <option value="out">خروج / ضایعات</option>
                  <option value="adjust">انبارگردانی</option>
                </select>

                <select
                  value={txItemFilter}
                  onChange={(e) => setTxItemFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 outline-none"
                >
                  <option value="all">همه کالاها</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="bg-white/85 border border-white rounded-[32px] py-16 text-center shadow-2xs">
                <History
                  size={44}
                  className="text-slate-300 mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-black text-slate-600">
                  هنوز تراکنشی برای این فیلتر ثبت نشده است.
                </p>
              </div>
            ) : (
              <div className="bg-white/95 border border-white rounded-[28px] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400">
                        <th className="py-3.5 px-4">کالا</th>
                        <th className="py-3.5 px-3">نوع عملیات</th>
                        <th className="py-3.5 px-3">میزان تغییر</th>
                        <th className="py-3.5 px-3 hidden sm:table-cell">
                          مانده پس از تغییر
                        </th>
                        <th className="py-3.5 px-3 hidden md:table-cell">
                          توضیحات / سفارش
                        </th>
                        <th className="py-3.5 px-4 text-left">
                          زمان و ثبت‌کننده
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {filteredTransactions.map((tx) => {
                        const badge = getTxBadge(tx.txType);
                        const BadgeIcon = badge.icon;
                        const isPositive = tx.quantityChange > 0;
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                              {tx.itemName}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black ${badge.cls}`}
                              >
                                <BadgeIcon size={12} />
                                {tx.txTypeLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                dir="ltr"
                                className={`inline-block font-mono font-black text-sm ${
                                  isPositive
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {formatNum(tx.quantityChange)}
                              </span>{" "}
                              <span className="text-[10px] text-slate-400">
                                {tx.unitLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap hidden sm:table-cell text-slate-700 font-black">
                              {formatNum(tx.stockAfter)}{" "}
                              <span className="text-[10px] text-slate-400 font-bold">
                                {tx.unitLabel}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 hidden md:table-cell text-slate-500 max-w-[260px] truncate">
                              {tx.note || "---"}
                            </td>
                            <td className="py-3.5 px-4 text-left whitespace-nowrap">
                              <span className="block text-[11px] font-black text-slate-700">
                                {formatDateTime(tx.createdAt)}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {tx.createdByName}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= مودال افزودن / ویرایش کالا ================= */}
      {itemModal.isOpen && (
        <div
          onClick={() =>
            !isSaving && setItemModal({ isOpen: false, editing: null })
          }
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-lg shadow-2xl relative max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setItemModal({ isOpen: false, editing: null })}
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full bg-slate-50"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-6">
              {itemModal.editing
                ? "ویرایش کالای انبار"
                : "افزودن ماده اولیه / کالا به انبار"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    نام کالا / ماده اولیه *
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: گوشت برگر، دانه قهوه، پنیر چدار"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, name: e.target.value })
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-sm font-bold outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    دسته‌بندی انبار (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: پروتئینی، لبنیات، بار گرم"
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    واحد اندازه‌گیری
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        unit: e.target.value as InventoryUnit,
                      })
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-3.5 text-sm font-black outline-none"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    موجودی فعلی
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="مثلاً 5000"
                    value={itemForm.currentStock}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        currentStock: toEnglishDecimal(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-sm font-mono font-bold text-left outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1.5">
                    حداقل (هشدار کمبود)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="مثلاً 500"
                    value={itemForm.minStock}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        minStock: toEnglishDecimal(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-sm font-mono font-bold text-left outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  قیمت خرید هر واحد به تومان (اختیاری - برای محاسبه ارزش انبار)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="0"
                  value={itemForm.unitCost}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      unitCost: toEnglishDecimal(e.target.value).replace(
                        /\./g,
                        "",
                      ),
                    })
                  }
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-sm font-mono font-bold text-left outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  rows={2}
                  placeholder="توضیحات تامین‌کننده یا محل نگهداری..."
                  value={itemForm.notes}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-2.5 px-4 text-xs font-bold resize-none outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isSaving || !itemForm.name.trim()}
                onClick={handleSaveItem}
                className="w-full bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 mt-2"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : itemModal.editing ? (
                  "ذخیره تغییرات"
                ) : (
                  "ثبت در انبار"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= مودال ورود / خروج / انبارگردانی سریع ================= */}
      {adjustModal.isOpen && adjustModal.item && (
        <div
          onClick={() =>
            !isSaving &&
            setAdjustModal({ isOpen: false, item: null, type: "in" })
          }
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] p-6 sm:p-7 w-full max-w-md shadow-2xl relative"
          >
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                setAdjustModal({ isOpen: false, item: null, type: "in" })
              }
              className="absolute top-6 left-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full bg-slate-50"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {adjustModal.type === "in"
                ? "ورود / شارژ موجودی"
                : adjustModal.type === "out"
                  ? "خروج دستی / ثبت ضایعات"
                  : "انبارگردانی (تنظیم مستقیم موجودی)"}
            </h3>
            <p className="text-xs font-bold text-slate-400 mb-5">
              کالا:{" "}
              <strong className="text-slate-800">
                {adjustModal.item.name}
              </strong>{" "}
              — موجودی فعلی:{" "}
              <strong className="text-orange-600">
                {formatNum(adjustModal.item.currentStock)}{" "}
                {adjustModal.item.unitLabel}
              </strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  {adjustModal.type === "adjust"
                    ? `موجودی جدید (${adjustModal.item.unitLabel})`
                    : `مقدار (${adjustModal.item.unitLabel})`}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  autoFocus
                  placeholder="مثلاً 250"
                  value={adjustQty}
                  onChange={(e) =>
                    setAdjustQty(toEnglishDecimal(e.target.value))
                  }
                  className="w-full bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-orange-500 rounded-2xl py-3.5 px-4 text-base font-mono font-black text-left outline-none"
                />
              </div>

              {previewStockAfterAdjust !== null && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">موجودی پس از ثبت:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatNum(previewStockAfterAdjust)}{" "}
                    <span className="text-[11px] text-slate-400">
                      {adjustModal.item.unitLabel}
                    </span>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">
                  توضیحات / علت تغییر (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder={
                    adjustModal.type === "in"
                      ? "مثلاً: خرید فاکتور شماره ۱۲"
                      : adjustModal.type === "out"
                        ? "مثلاً: ضایعات یا مصرف پرسنل"
                        : "مثلاً: شمارش پایان هفته"
                  }
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl py-3 px-4 text-xs font-bold outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isSaving || adjustQty === ""}
                onClick={handleConfirmAdjust}
                className={`w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-lg active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 ${
                  adjustModal.type === "in"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : adjustModal.type === "out"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-slate-900 hover:bg-orange-500"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  "تایید و ثبت در انبار"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
