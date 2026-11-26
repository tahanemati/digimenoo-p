import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Store,
  BellRing,
  ChefHat,
  Globe,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Search,
  ShoppingBag,
  RefreshCw,
  MessageSquarePlus,
  Send,
  UtensilsCrossed,
  Sparkles,
  Users,
  User,
  Phone,
  Check,
  AlertCircle,
  MapPin,
  ArrowUpLeft,
  Flame,
  Pizza,
  Sandwich,
  Coffee,
  CupSoda,
  CakeSlice,
  Salad,
  Soup,
  Drumstick,
  Beef,
  IceCream,
  Utensils,
} from "lucide-react";
import { reservationsApi } from "../../service/api";
import type {
  TemplateProps,
  OrderStageInfo,
  ActiveOrderInfo,
  PublicTableSlot,
} from "./Template1";

const FALLBACK_STAGES: OrderStageInfo[] = [
  {
    id: "pending",
    name: "در حال بررسی سفارش",
    description: "سفارش شما با موفقیت ثبت شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "سرآشپز مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده تحویل به میز",
    description: "سفارش آماده است و تا لحظاتی دیگر سرو می‌شود",
  },
];

// کامپوننت آیکون سه‌بعدی هوشمند بر اساس عنوان دسته‌بندی
const Category3DBadge: React.FC<{
  nameFa?: string;
  nameEn?: string;
  isSelected: boolean;
}> = ({ nameFa = "", nameEn = "", isSelected }) => {
  const title = `${nameFa} ${nameEn}`.toLowerCase();

  let IconComponent = Utensils;
  let gradient = "from-amber-400 via-orange-500 to-amber-600";
  let shadow = "shadow-orange-500/30";

  if (title.includes("پیتزا") || title.includes("pizza")) {
    IconComponent = Pizza;
    gradient = "from-orange-400 via-red-500 to-rose-600";
    shadow = "shadow-rose-500/30";
  } else if (
    title.includes("برگر") ||
    title.includes("ساندویچ") ||
    title.includes("burger") ||
    title.includes("sandwich")
  ) {
    IconComponent = Sandwich;
    gradient = "from-amber-400 via-orange-500 to-amber-600";
    shadow = "shadow-amber-500/30";
  } else if (
    title.includes("قهوه") ||
    title.includes("اسپرسو") ||
    title.includes("گرم") ||
    title.includes("چای") ||
    title.includes("دمنوش") ||
    title.includes("coffee") ||
    title.includes("hot")
  ) {
    IconComponent = Coffee;
    gradient = "from-amber-600 via-stone-700 to-stone-900";
    shadow = "shadow-stone-800/30";
  } else if (
    title.includes("نوشیدنی") ||
    title.includes("سرد") ||
    title.includes("شیک") ||
    title.includes("آبمیوه") ||
    title.includes("موکتل") ||
    title.includes("drink") ||
    title.includes("cold") ||
    title.includes("juice")
  ) {
    IconComponent = CupSoda;
    gradient = "from-sky-400 via-blue-500 to-indigo-600";
    shadow = "shadow-blue-500/30";
  } else if (
    title.includes("بستنی") ||
    title.includes("جلاتو") ||
    title.includes("ice")
  ) {
    IconComponent = IceCream;
    gradient = "from-pink-400 via-rose-500 to-fuchsia-600";
    shadow = "shadow-pink-500/30";
  } else if (
    title.includes("دسر") ||
    title.includes("کیک") ||
    title.includes("شیرینی") ||
    title.includes("وافل") ||
    title.includes("پنکیک") ||
    title.includes("dessert") ||
    title.includes("cake")
  ) {
    IconComponent = CakeSlice;
    gradient = "from-fuchsia-400 via-purple-500 to-indigo-600";
    shadow = "shadow-purple-500/30";
  } else if (
    title.includes("سالاد") ||
    title.includes("سبزی") ||
    title.includes("رژیمی") ||
    title.includes("salad")
  ) {
    IconComponent = Salad;
    gradient = "from-emerald-400 via-green-500 to-teal-600";
    shadow = "shadow-emerald-500/30";
  } else if (
    title.includes("سوپ") ||
    title.includes("آش") ||
    title.includes("پیش") ||
    title.includes("پاستا") ||
    title.includes("soup") ||
    title.includes("pasta") ||
    title.includes("starter")
  ) {
    IconComponent = Soup;
    gradient = "from-yellow-400 via-amber-500 to-orange-600";
    shadow = "shadow-amber-500/30";
  } else if (
    title.includes("سوخاری") ||
    title.includes("مرغ") ||
    title.includes("chicken") ||
    title.includes("fried")
  ) {
    IconComponent = Drumstick;
    gradient = "from-orange-400 via-amber-500 to-red-500";
    shadow = "shadow-orange-500/30";
  } else if (
    title.includes("کباب") ||
    title.includes("استیک") ||
    title.includes("گوشت") ||
    title.includes("ایرانی") ||
    title.includes("اصلی") ||
    title.includes("kebab") ||
    title.includes("steak") ||
    title.includes("main")
  ) {
    IconComponent = Beef;
    gradient = "from-red-500 via-rose-600 to-red-800";
    shadow = "shadow-red-600/30";
  }

  return (
    <div
      className={`relative w-14 h-14 rounded-[20px] bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg ${shadow} transition-all duration-300 ${
        isSelected
          ? "scale-105 ring-2 ring-offset-2 ring-offset-[#F7F4EF] ring-[#1C1917]"
          : "opacity-90 group-hover:opacity-100 group-hover:scale-105"
      }`}
    >
      {/* هایلایت شیشه‌ای سه‌بعدی */}
      <div className="absolute inset-x-1.5 top-1 h-5 rounded-t-[14px] bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />
      <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/30 pointer-events-none" />
      <IconComponent
        size={24}
        strokeWidth={2.3}
        className="relative z-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.3)]"
      />
    </div>
  );
};

const Template2: React.FC<TemplateProps> = ({
  venueData,
  menuData,
  tableNumber,
  language,
  setLanguage,
  cart,
  addToCart,
  removeFromCart,
  updateItemNotes,
  submitOrder,
  checkOrderStatus,
  getOrderWsUrl,
  callWaiter,
  callChef,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(
    null,
  );
  const [modalNoteText, setModalNoteText] = useState("");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});

  const [waiterModal, setWaiterModal] = useState(false);
  const [chefModal, setChefModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // سیستم رزرو آنلاین میزها
  const [reserveModal, setReserveModal] = useState(false);
  const [tablesList, setTablesList] = useState<PublicTableSlot[]>(() => {
    if (Array.isArray(venueData?.tablesStatus?.tables)) {
      return venueData.tablesStatus.tables;
    }
    const count = Number(
      venueData?.tableCount ??
        venueData?.TableCount ??
        venueData?.table_count ??
        0,
    );
    if (count > 0) {
      return Array.from({ length: count }, (_, idx) => ({
        tableNumber: idx + 1,
        state: "available",
      }));
    }
    return [];
  });
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [selectedReserveTable, setSelectedReserveTable] = useState<
    number | null
  >(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveMobile, setReserveMobile] = useState("");
  const [reserveGuests, setReserveGuests] = useState<number>(2);
  const [reserveTime, setReserveTime] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");
  const [reserveError, setReserveError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<{
    tableNumber: number;
    customerName: string;
    customerMobile: string;
    guestsCount: number;
    reservationTime: string;
  } | null>(null);

  const [venueStages, setVenueStages] = useState<OrderStageInfo[]>(() =>
    Array.isArray(venueData?.kitchenStages) &&
    venueData.kitchenStages.length > 0
      ? venueData.kitchenStages
      : FALLBACK_STAGES,
  );

  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isRefreshingOrder, setIsRefreshingOrder] = useState(false);

  const isFa = language === "fa";

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (
      Array.isArray(venueData?.kitchenStages) &&
      venueData.kitchenStages.length > 0
    ) {
      setVenueStages(venueData.kitchenStages);
    }
  }, [venueData?.kitchenStages]);

  const fetchPublicTables = async () => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;
    setIsLoadingTables(true);
    try {
      const res = await reservationsApi.getPublicTables(slug);
      const data = res?.data?.data || res?.data || res;
      if (Array.isArray(data?.tables)) {
        setTablesList(data.tables);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchPublicTables();
  }, [venueData?.slug, venueData?.Slug]);

  // اتصال WebSocket منو (مراحل پخت + وضعیت لحظه‌ای میزها)
  useEffect(() => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;

    const wsUrl = `ws://localhost:5000/ws/menu/${encodeURIComponent(slug)}/`;
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (
            payload?.event === "stages_updated" &&
            Array.isArray(payload?.data?.stages) &&
            payload.data.stages.length > 0
          ) {
            setVenueStages(payload.data.stages);
            setActiveOrder((prev) =>
              prev ? { ...prev, stages: payload.data.stages } : prev,
            );
          } else if (
            payload?.event === "tables_updated" &&
            Array.isArray(payload?.data?.tables)
          ) {
            const updatedTables: PublicTableSlot[] = payload.data.tables;
            setTablesList(updatedTables);

            setSelectedReserveTable((prevSelected) => {
              if (!prevSelected) return null;
              const found = updatedTables.find(
                (t) => t.tableNumber === prevSelected,
              );
              if (found && found.state !== "available") {
                setReserveError(
                  isFa
                    ? `میز شماره ${prevSelected} لحظاتی پیش رزرو شد. لطفاً میز دیگری انتخاب کنید.`
                    : `Table #${prevSelected} was just taken. Please pick another table.`,
                );
                return null;
              }
              return prevSelected;
            });
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, [venueData?.slug, venueData?.Slug, isFa]);

  // اتصال WebSocket پیگیری سفارش فعال
  useEffect(() => {
    if (!activeOrder?.id || !getOrderWsUrl) return;
    if (String(activeOrder.status).toLowerCase() === "completed") return;

    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      ws = new WebSocket(getOrderWsUrl(activeOrder.id));
      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.event === "order_updated" && payload?.data) {
            const d = payload.data;
            if (Array.isArray(d.stages) && d.stages.length > 0) {
              setVenueStages(d.stages);
            }
            setActiveOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: String(d.status || prev.status),
                    stageId: String(d.stageId || prev.stageId || ""),
                    stages:
                      Array.isArray(d.stages) && d.stages.length > 0
                        ? d.stages
                        : prev.stages,
                  }
                : prev,
            );
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, [activeOrder?.id, activeOrder?.status, getOrderWsUrl]);

  const openProductShowcase = (prod: any) => {
    const existing = cart.find((c) => c.product?.id === prod?.id);
    setModalNoteText(existing?.notes || "");
    setSelectedProductModal(prod);
  };

  const openReservationModal = () => {
    setConfirmedReservation(null);
    setReserveError("");
    setReserveModal(true);
    fetchPublicTables();
  };

  const handleCustomerReserve = async () => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;

    if (!selectedReserveTable) {
      setReserveError(
        isFa
          ? "لطفاً ابتدا یک میز آزاد را انتخاب کنید."
          : "Please select an available table first.",
      );
      return;
    }
    if (reserveName.trim().length < 2) {
      setReserveError(
        isFa
          ? "لطفاً نام و نام خانوادگی خود را وارد کنید."
          : "Please enter your full name.",
      );
      return;
    }
    if (reserveMobile.trim().length < 10) {
      setReserveError(
        isFa
          ? "لطفاً شماره تماس معتبر وارد کنید."
          : "Please enter a valid mobile number.",
      );
      return;
    }

    setIsReserving(true);
    setReserveError("");
    try {
      await reservationsApi.createPublicReservation({
        restaurantSlug: slug,
        tableNumber: selectedReserveTable,
        customerName: reserveName.trim(),
        customerMobile: reserveMobile.trim(),
        guestsCount: reserveGuests,
        reservationTime: reserveTime.trim(),
        notes: reserveNotes.trim(),
      });

      setConfirmedReservation({
        tableNumber: selectedReserveTable,
        customerName: reserveName.trim(),
        customerMobile: reserveMobile.trim(),
        guestsCount: reserveGuests,
        reservationTime: reserveTime.trim(),
      });

      setSelectedReserveTable(null);
      setReserveName("");
      setReserveMobile("");
      setReserveTime("");
      setReserveNotes("");
      fetchPublicTables();

      showToast(
        isFa ? "رزرو میز با موفقیت ثبت شد!" : "Table reservation confirmed!",
      );
    } catch (err: any) {
      setReserveError(
        err?.message ||
          (isFa
            ? "خطا در ثبت رزرو میز. لطفاً دوباره تلاش کنید."
            : "Failed to reserve table."),
      );
    } finally {
      setIsReserving(false);
    }
  };

  const dynamicStages: OrderStageInfo[] =
    Array.isArray(activeOrder?.stages) && activeOrder.stages.length > 0
      ? activeOrder.stages
      : venueStages;

  const getActiveStageIndex = () => {
    if (!activeOrder) return 0;
    const statusStr = String(activeOrder.status || "").toLowerCase();
    if (statusStr === "completed") return dynamicStages.length;

    if (activeOrder.stageId) {
      const idx = dynamicStages.findIndex(
        (s) => String(s.id) === String(activeOrder.stageId),
      );
      if (idx >= 0) return idx;
    }

    if (statusStr === "ready") return Math.max(0, dynamicStages.length - 1);
    if (statusStr === "preparing") return dynamicStages.length > 1 ? 1 : 0;
    return 0;
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0,
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleCall = async (type: "waiter" | "chef") => {
    if (isProcessing) return;
    setIsProcessing(true);
    const success =
      type === "waiter" ? await callWaiter(message) : await callChef(message);
    setIsProcessing(false);
    if (success) {
      setWaiterModal(false);
      setChefModal(false);
      setMessage("");
      showToast(isFa ? "درخواست شما ارسال شد." : "Request sent successfully.");
    } else {
      showToast(isFa ? "خطا در ارسال درخواست." : "Failed to send request.");
    }
  };

  const handleOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await submitOrder(customerName, "");
      if (result) {
        const orderStages =
          Array.isArray(result.stages) && result.stages.length > 0
            ? result.stages
            : venueStages;

        if (Array.isArray(result.stages) && result.stages.length > 0) {
          setVenueStages(result.stages);
        }

        const normalizedOrder: ActiveOrderInfo =
          typeof result === "object"
            ? {
                id: String(result.id || ""),
                orderNumber: Number(result.orderNumber || 1001),
                status: String(result.status || "pending"),
                stageId: String(result.stageId || orderStages[0]?.id || ""),
                stages: orderStages,
                totalPrice: Number(result.totalPrice || totalPrice),
              }
            : {
                id: String(result),
                orderNumber: Number(result) || 1001,
                status: "pending",
                stages: orderStages,
                totalPrice,
              };

        setIsCartOpen(false);
        setActiveOrder(normalizedOrder);
        setIsTrackerOpen(true);
        showToast(
          isFa
            ? `سفارش #${normalizedOrder.orderNumber} ثبت شد!`
            : `Order #${normalizedOrder.orderNumber} placed!`,
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshOrder = async () => {
    if (!activeOrder?.id || !checkOrderStatus || isRefreshingOrder) return;
    setIsRefreshingOrder(true);
    const latest = await checkOrderStatus(activeOrder.id);
    if (latest) {
      if (Array.isArray(latest.stages) && latest.stages.length > 0) {
        setVenueStages(latest.stages);
      }
      setActiveOrder(latest);
    }
    setIsRefreshingOrder(false);
  };

  const safeVenueName = venueData?.name || venueData?.Name || "منوی رستوران";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const filteredMenu = (Array.isArray(menuData) ? menuData : [])
    .filter(
      (cat) => selectedCategoryId === "all" || cat.id === selectedCategoryId,
    )
    .map((cat) => {
      const q = searchQuery.trim().toLowerCase();
      const prods = (cat.products || []).filter((p: any) => {
        if (!q) return true;
        return (
          String(p.nameFa || "")
            .toLowerCase()
            .includes(q) ||
          String(p.nameEn || "")
            .toLowerCase()
            .includes(q) ||
          String(p.descriptionFa || "")
            .toLowerCase()
            .includes(q)
        );
      });
      return { ...cat, products: prods };
    })
    .filter((cat) => cat.products.length > 0 || !searchQuery.trim());

  const currentStageIndex = getActiveStageIndex();

  const timePresetsFa = ["تا ۳۰ دقیقه دیگر", "۲۰:۰۰", "۲۱:۰۰", "۲۲:۰۰"];
  const timePresetsEn = ["In 30 mins", "20:00", "21:00", "22:00"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به قاشق و چنگال",
    "راهنمایی برای سفارش",
    "تمیز کردن میز",
  ];
  const waiterPresetsEn = [
    "Request the bill",
    "Extra cutlery & napkins",
    "Need assistance",
    "Clean the table",
  ];

  const chefPresetsFa = [
    "غذا کم‌نمک آماده شود",
    "بدون پیاز و سیر باشد",
    "کاملاً مغزپخت باشد",
    "سس جداگانه سرو شود",
  ];
  const chefPresetsEn = [
    "Less salt please",
    "No onion or garlic",
    "Well-done cooking",
    "Sauce on the side",
  ];

  return (
    <div
      className="min-h-screen bg-[#F7F4EF] text-[#1C1917] font-sans antialiased selection:bg-amber-600/20 overflow-x-hidden pb-36 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان زنده */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1C1917]/95 backdrop-blur-xl text-[#FAF8F5] px-5 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2.5 border border-white/10">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
            </div>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: هدر تمیز مجله‌ای (بدون عکس محصول در پس‌زمینه)
         ======================================================== */}
      <header className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-br from-[#231F1D] via-[#1C1917] to-[#12100E] text-white shadow-[0_20px_50px_rgba(28,25,23,0.16)] border border-white/10">
          {/* بافت نقطه‌ای مینیمال و هاله نور کهربایی */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#fbbf24 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute -top-20 -right-16 w-64 h-64 bg-amber-500/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between gap-7">
            {/* ردیف بالای هدر */}
            <div className="flex items-center justify-between gap-2">
              {tableNumber ? (
                <div className="bg-white/10 backdrop-blur-xl border border-white/15 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-black text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </span>
                </div>
              ) : (
                <span className="bg-white/[0.07] border border-white/10 px-3 py-1 rounded-full text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>{isFa ? "ترنج" : "Toranj"}</span>
                </span>
              )}

              <div className="flex items-center gap-2">
                {activeOrder && (
                  <button
                    type="button"
                    onClick={() => setIsTrackerOpen(true)}
                    className="bg-emerald-500 text-stone-950 px-3.5 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-stone-950 animate-ping" />
                    <span>
                      {isFa
                        ? `پیگیری #${activeOrder.orderNumber}`
                        : `Track #${activeOrder.orderNumber}`}
                    </span>
                  </button>
                )}

                {venueData?.bilingual && (
                  <button
                    type="button"
                    onClick={() => setLanguage(isFa ? "en" : "fa")}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-bold text-xs transition-all active:scale-95"
                  >
                    <Globe size={13} className="text-amber-300" />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* لوگو و مشخصات مجموعه */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] bg-white/10 p-1 border border-white/20 shadow-xl shrink-0">
                <div className="w-full h-full rounded-[22px] bg-[#292524] overflow-hidden flex items-center justify-center">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={34} className="text-amber-400" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {safeVenueName}
                </h1>
                {(isFa ? safeAboutFa : safeAboutEn) && (
                  <p className="text-xs font-medium text-stone-300 line-clamp-2 leading-relaxed mt-1">
                    {isFa ? safeAboutFa : safeAboutEn}
                  </p>
                )}
                {safeAddress && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300/90 mt-1.5 truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{safeAddress}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            بخش ۲: شبکه بنتو سرویس‌ها (Bento Action Grid)
           ======================================================== */}
        <div className="grid grid-cols-12 gap-3 mt-3.5">
          {/* کارت رزرو آنلاین میز */}
          <button
            type="button"
            onClick={openReservationModal}
            className={`${
              tableNumber &&
              (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
                ? "col-span-12 sm:col-span-6"
                : "col-span-8"
            } bg-[#EFECE6] hover:bg-[#E7E2D8] border border-stone-300/60 rounded-[26px] p-4 text-right flex items-center justify-between gap-3 transition-all active:scale-[0.98] group`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#1C1917] text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <CalendarCheck size={20} />
              </div>
              <div className="min-w-0">
                <span className="block font-black text-sm text-[#1C1917] truncate">
                  {isFa ? "رزرو آنلاین میز" : "Reserve Table"}
                </span>
                <span className="block text-[11px] font-bold text-stone-500 mt-0.5 truncate">
                  {tablesList.length > 0
                    ? availableTablesCount > 0
                      ? isFa
                        ? `${availableTablesCount.toLocaleString("fa-IR")} میز آزاد آماده رزرو`
                        : `${availableTablesCount} free tables`
                      : isFa
                        ? "ظرفیت میزها تکمیل است"
                        : "All tables busy"
                    : isFa
                      ? "مشاهده وضعیت میزهای سالن"
                      : "Check live tables"}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/80 text-[#1C1917] flex items-center justify-center shrink-0 group-hover:bg-[#1C1917] group-hover:text-white transition-colors">
              <ArrowUpLeft size={16} />
            </div>
          </button>

          {/* کارت جستجو */}
          {!(
            tableNumber &&
            (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
          ) && (
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="col-span-4 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-[26px] p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Search size={20} className="text-amber-600" />
              <span className="text-xs font-black text-[#1C1917]">
                {isFa ? "جستجو" : "Search"}
              </span>
            </button>
          )}

          {/* دکمه‌های سرویس میز */}
          {tableNumber && venueData?.callWaiterEnabled && (
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setWaiterModal(true);
              }}
              className={`${
                venueData?.callChefEnabled
                  ? "col-span-6 sm:col-span-3"
                  : "col-span-12 sm:col-span-6"
              } bg-white hover:bg-stone-50 border border-stone-200/80 rounded-[26px] p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98]`}
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <BellRing size={18} />
              </div>
              <span className="text-xs font-black text-[#1C1917]">
                {isFa ? "احضار گارسون" : "Call Waiter"}
              </span>
            </button>
          )}

          {tableNumber && venueData?.callChefEnabled && (
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setChefModal(true);
              }}
              className={`${
                venueData?.callWaiterEnabled
                  ? "col-span-6 sm:col-span-3"
                  : "col-span-12 sm:col-span-6"
              } bg-white hover:bg-stone-50 border border-stone-200/80 rounded-[26px] p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98]`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ChefHat size={18} />
              </div>
              <span className="text-xs font-black text-[#1C1917]">
                {isFa ? "پیام به سرآشپز" : "Note to Chef"}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
          بخش ۳: دسته‌بندی‌ها با آیکون‌های سه‌بعدی اختصاصی (3D Icons)
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#F7F4EF]/90 backdrop-blur-2xl border-b border-stone-200/60 mt-4 py-3.5 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <Search
                size={16}
                className={`absolute top-1/2 -translate-y-1/2 text-stone-400 ${
                  isFa ? "right-4" : "left-4"
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? "نام غذا یا نوشیدنی را بنویسید..."
                    : "Search menu items..."
                }
                className={`w-full bg-white border border-stone-300/80 focus:border-amber-600 rounded-2xl py-2.5 text-xs font-bold text-[#1C1917] placeholder:text-stone-400 outline-none shadow-2xs ${
                  isFa ? "pr-10 pl-10" : "pl-10 pr-10"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 ${
                    isFa ? "left-3.5" : "right-3.5"
                  }`}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {Array.isArray(menuData) && menuData.length > 0 && (
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 pt-0.5 px-0.5 no-scrollbar">
              {/* آیکون سه‌بعدی همه منو */}
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div
                  className={`relative w-14 h-14 rounded-[20px] bg-gradient-to-br from-zinc-800 via-stone-900 to-black flex items-center justify-center text-amber-400 shadow-lg shadow-stone-900/25 transition-all duration-300 ${
                    selectedCategoryId === "all"
                      ? "scale-105 ring-2 ring-offset-2 ring-offset-[#F7F4EF] ring-amber-500"
                      : "opacity-85 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                >
                  <div className="absolute inset-x-1.5 top-1 h-5 rounded-t-[14px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/20 pointer-events-none" />
                  <Flame
                    size={24}
                    strokeWidth={2.3}
                    className="relative z-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)]"
                  />
                </div>
                <span
                  className={`text-[11px] font-black whitespace-nowrap ${
                    selectedCategoryId === "all"
                      ? "text-[#1C1917]"
                      : "text-stone-500"
                  }`}
                >
                  {isFa ? "همه منو" : "All"}
                </span>
              </button>

              {menuData.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                  >
                    <Category3DBadge
                      nameFa={cat.nameFa || cat.name}
                      nameEn={cat.nameEn}
                      isSelected={isSelected}
                    />
                    <span
                      className={`text-[11px] font-black max-w-[76px] truncate ${
                        isSelected ? "text-amber-700" : "text-stone-500"
                      }`}
                    >
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          بخش ۴: گرید گالری دو ستونه محصولات (2-Column Bento Cards)
         ======================================================== */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-stone-200/70">
            <UtensilsCrossed
              size={38}
              className="text-stone-300 mx-auto mb-3"
            />
            <p className="text-stone-500 font-bold text-sm">
              {isFa ? "آیتمی با این مشخصات یافت نشد." : "No items found."}
            </p>
          </div>
        ) : (
          filteredMenu.map((cat: any) => {
            const hasProducts =
              Array.isArray(cat.products) && cat.products.length > 0;

            return (
              <section key={cat.id} className="mb-9">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <h2 className="text-lg font-black text-[#1C1917] tracking-tight">
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-stone-400 bg-white px-2.5 py-0.5 rounded-full border border-stone-200/70">
                    {cat.products?.length || 0} {isFa ? "آیتم" : "items"}
                  </span>
                </div>

                {!hasProducts ? (
                  <div className="bg-white border border-stone-200/70 p-6 rounded-[28px] text-center text-stone-400 text-xs font-bold">
                    {isFa
                      ? "هنوز محصولی در این دسته ثبت نشده است."
                      : "No products in this category yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                    {cat.products.map((prod: any) => {
                      const cartItem = cart.find(
                        (c: any) => c.product?.id === prod?.id,
                      );
                      const hasFiniteStock =
                        prod?.stock !== null && prod?.stock !== undefined;
                      const isAvailable =
                        prod?.isAvailableInMenu !== false &&
                        (!hasFiniteStock || Number(prod.stock) > 0);
                      const reachedMaxStock =
                        hasFiniteStock &&
                        cartItem &&
                        cartItem.quantity >= Number(prod.stock);

                      return (
                        <div
                          key={prod?.id}
                          onClick={() => openProductShowcase(prod)}
                          className={`cursor-pointer bg-white rounded-[28px] p-2.5 border border-stone-200/80 shadow-[0_6px_24px_rgba(28,25,23,0.04)] hover:shadow-lg transition-all flex flex-col justify-between group ${
                            !isAvailable ? "opacity-55" : ""
                          }`}
                        >
                          <div>
                            <div className="relative aspect-[4/3] w-full rounded-[22px] bg-[#EFECE6] overflow-hidden mb-3">
                              {prod?.imageUrl ? (
                                <img
                                  src={getFullImageUrl(prod.imageUrl)}
                                  alt={isFa ? prod.nameFa : prod.nameEn}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                  <UtensilsCrossed size={28} />
                                </div>
                              )}

                              {isAvailable &&
                                hasFiniteStock &&
                                Number(prod.stock) <= 5 && (
                                  <span className="absolute top-2 right-2 bg-[#1C1917]/85 backdrop-blur-md text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full">
                                    {isFa
                                      ? `${prod.stock} باقی‌مانده`
                                      : `${prod.stock} left`}
                                  </span>
                                )}

                              {venueData?.orderingEnabled && tableNumber && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute bottom-2 left-2"
                                >
                                  {!isAvailable ? (
                                    <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                      {isFa ? "ناموجود" : "Sold out"}
                                    </span>
                                  ) : cartItem ? (
                                    <div className="flex items-center gap-1.5 bg-[#1C1917]/95 backdrop-blur-md text-white rounded-full p-1 shadow-lg border border-white/15">
                                      <button
                                        type="button"
                                        onClick={() => removeFromCart(prod.id)}
                                        className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center active:scale-90"
                                      >
                                        <Minus size={11} strokeWidth={3} />
                                      </button>
                                      <span className="text-xs font-black min-w-[14px] text-center text-amber-400">
                                        {cartItem.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={Boolean(reachedMaxStock)}
                                        onClick={() => addToCart(prod)}
                                        className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 disabled:opacity-30 flex items-center justify-center active:scale-90"
                                      >
                                        <Plus size={11} strokeWidth={3} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => addToCart(prod)}
                                      className="w-9 h-9 rounded-full bg-[#1C1917]/90 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-colors active:scale-90"
                                    >
                                      <Plus size={17} strokeWidth={2.8} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="px-1">
                              <h3 className="font-black text-sm text-[#1C1917] line-clamp-1 mb-1">
                                {isFa
                                  ? prod?.nameFa
                                  : prod?.nameEn || prod?.nameFa}
                              </h3>
                              <p className="text-[11px] font-medium text-stone-400 line-clamp-2 leading-relaxed min-h-[32px]">
                                {isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn || prod?.descriptionFa}
                              </p>
                            </div>
                          </div>

                          <div className="px-1 pt-2.5 mt-2 border-t border-stone-100 flex items-baseline justify-between">
                            <span className="font-black text-sm text-[#1C1917]">
                              {Number(prod?.price || 0).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] font-bold text-stone-400">
                                {isFa ? "تومان" : "IRT"}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      {/* ========================================================
          بخش ۵: داک شناور یکپارچه پایین صفحه (Floating Glass Dock)
         ======================================================== */}
      <div className="fixed bottom-5 inset-x-4 z-40 flex justify-center">
        <div className="w-full max-w-md bg-[#1C1917]/95 backdrop-blur-2xl text-white p-2 rounded-full shadow-[0_18px_45px_rgba(28,25,23,0.35)] border border-white/10 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title={isFa ? "جستجو" : "Search"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              isSearchOpen
                ? "bg-amber-500 text-stone-950"
                : "bg-white/10 text-stone-300 hover:text-white"
            }`}
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={openReservationModal}
            className="h-11 px-3.5 rounded-full bg-white/10 hover:bg-white/15 text-stone-200 font-black text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <CalendarCheck size={16} className="text-amber-400" />
            <span>{isFa ? "رزرو میز" : "Reserve"}</span>
          </button>

          {totalItems > 0 ? (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 rounded-full font-black text-xs flex items-center justify-between gap-2 transition-all active:scale-95"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag size={15} strokeWidth={2.5} />
                <span>
                  {totalItems.toLocaleString("fa-IR")} {isFa ? "آیتم" : "items"}
                </span>
              </span>
              <span>
                {totalPrice.toLocaleString("fa-IR")}{" "}
                <span className="text-[10px] opacity-80">
                  {isFa ? "تومان" : "IRT"}
                </span>
              </span>
            </button>
          ) : activeOrder ? (
            <button
              type="button"
              onClick={() => setIsTrackerOpen(true)}
              className="flex-1 h-11 bg-emerald-500 text-stone-950 px-4 rounded-full font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-stone-950 animate-ping" />
              <span>
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
            </button>
          ) : (
            <div className="flex-1 text-center text-[11px] font-bold text-stone-400 truncate px-2">
              {tableNumber
                ? isFa
                  ? `میز ${tableNumber} آماده سفارش`
                  : `Table #${tableNumber}`
                : safeVenueName}
            </div>
          )}
        </div>
      </div>

      {/* مودال نمایش بزرگ محصول */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] rounded-t-[36px] sm:rounded-[36px] overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-60 w-full bg-[#EFECE6]">
              {selectedProductModal.imageUrl ? (
                <img
                  src={getFullImageUrl(selectedProductModal.imageUrl)}
                  alt={
                    isFa
                      ? selectedProductModal.nameFa
                      : selectedProductModal.nameEn
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <UtensilsCrossed size={48} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#1C1917] flex items-center justify-center shadow-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#1C1917]">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-lg font-black text-amber-700 shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-xs text-stone-400">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-stone-500 leading-relaxed">
                  {isFa
                    ? selectedProductModal.descriptionFa
                    : selectedProductModal.descriptionEn ||
                      selectedProductModal.descriptionFa}
                </p>
              )}

              {venueData?.orderingEnabled && tableNumber ? (
                <div className="space-y-3 pt-2">
                  {updateItemNotes && (
                    <input
                      type="text"
                      value={modalNoteText}
                      onChange={(e) => {
                        setModalNoteText(e.target.value);
                        updateItemNotes(
                          selectedProductModal.id,
                          e.target.value,
                        );
                      }}
                      placeholder={
                        isFa
                          ? "یادداشت اختصاصی برای سرآشپز (مثلاً: بدون سس)..."
                          : "Special note for chef..."
                      }
                      className="w-full bg-white border border-stone-200 focus:border-amber-600 rounded-2xl px-4 py-3 text-xs font-bold text-[#1C1917] outline-none"
                    />
                  )}

                  {(() => {
                    const cItem = cart.find(
                      (c) => c.product?.id === selectedProductModal.id,
                    );
                    const hasFiniteStock =
                      selectedProductModal.stock !== null &&
                      selectedProductModal.stock !== undefined;
                    const isAvail =
                      selectedProductModal.isAvailableInMenu !== false &&
                      (!hasFiniteStock ||
                        Number(selectedProductModal.stock) > 0);

                    if (!isAvail) {
                      return (
                        <div className="w-full py-3.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs text-center">
                          {isFa ? "ناموجود در منو" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-white border border-stone-200 p-2 rounded-full">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-full bg-stone-100 text-[#1C1917] flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base">
                              {cItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-full bg-[#1C1917] text-white flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-amber-500 text-stone-950 px-6 py-2.5 rounded-full font-black text-xs"
                          >
                            {isFa ? "تایید" : "Done"}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(selectedProductModal);
                          if (modalNoteText.trim() && updateItemNotes) {
                            updateItemNotes(
                              selectedProductModal.id,
                              modalNoteText.trim(),
                            );
                          }
                          setSelectedProductModal(null);
                          showToast(
                            isFa ? "به سبد خرید اضافه شد" : "Added to bag",
                          );
                        }}
                        className="w-full bg-[#1C1917] hover:bg-black text-white py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>
                          {isFa ? "افزودن به سبد خرید" : "Add to Bag"}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#1C1917] text-white py-3.5 rounded-full font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* مودال رزرو آنلاین میزها */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1C1917] text-amber-400 flex items-center justify-center">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#1C1917]">
                      {isFa ? "رزرو آنلاین میز" : "Live Table Reservation"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-stone-400 mt-0.5">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-9 h-9 rounded-full bg-[#EFECE6] text-stone-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-[28px] bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} strokeWidth={2.2} />
                </div>

                <div>
                  <h4 className="text-xl font-black text-[#1C1917] mb-1">
                    {isFa
                      ? "رزرو شما با موفقیت ثبت شد!"
                      : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-stone-500">
                    {isFa
                      ? "میز انتخاب‌شده در سیستم مجموعه برای شما ثبت گردید"
                      : "Your table has been reserved in real-time"}
                  </p>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-[26px] p-4 space-y-2.5 text-xs font-bold text-right">
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-400">
                      {isFa ? "شماره میز:" : "Table:"}
                    </span>
                    <span className="font-black text-amber-700 text-sm">
                      {isFa
                        ? `میز شماره ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `Table #${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-400">
                      {isFa ? "نام مهمان:" : "Guest Name:"}
                    </span>
                    <span className="font-black text-[#1C1917]">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-400">
                      {isFa ? "شماره تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-stone-400">
                      {isFa ? "تعداد نفرات:" : "Guests:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.guestsCount.toLocaleString("fa-IR")}{" "}
                      {isFa ? "نفر" : "guests"}
                      {confirmedReservation.reservationTime
                        ? ` • ${confirmedReservation.reservationTime}`
                        : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReserveModal(false)}
                  className="w-full bg-[#1C1917] text-white py-4 rounded-full font-black text-sm active:scale-95 transition-all"
                >
                  {isFa ? "تایید و بازگشت" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-[#EFECE6] px-3.5 py-2.5 rounded-2xl text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      {isFa ? "رزرو شده" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      {isFa ? "سفارش باز" : "Occupied"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-[#1C1917]">
                        {isFa
                          ? "۱. میز مورد نظر خود را انتخاب کنید:"
                          : "1. Select an available table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-amber-600"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-white rounded-2xl p-4 text-center text-xs font-bold text-stone-500 border border-stone-200/70">
                        {isFa
                          ? "در حال حاضر میزی برای رزرو آنلاین تعریف نشده است."
                          : "No tables available."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {tablesList.map((t) => {
                          const isFree = t.state === "available";
                          const isSelected =
                            selectedReserveTable === t.tableNumber;

                          return (
                            <button
                              key={t.tableNumber}
                              type="button"
                              disabled={!isFree}
                              onClick={() => {
                                setSelectedReserveTable(t.tableNumber);
                                setReserveError("");
                              }}
                              className={`relative py-3 px-1.5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#1C1917] bg-[#1C1917] text-amber-400 shadow-md scale-[1.03]"
                                  : isFree
                                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:border-emerald-400 active:scale-95"
                                    : t.state === "reserved"
                                      ? "border-amber-200 bg-amber-50/70 text-amber-700 opacity-65 cursor-not-allowed"
                                      : "border-rose-200 bg-rose-50/70 text-rose-700 opacity-65 cursor-not-allowed"
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-[#1C1917] flex items-center justify-center">
                                  <Check size={10} strokeWidth={3.5} />
                                </span>
                              )}
                              <span className="text-sm font-black">
                                {isFa
                                  ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                  : `#${t.tableNumber}`}
                              </span>
                              <span className="text-[9px] font-bold mt-0.5">
                                {isSelected
                                  ? isFa
                                    ? "انتخاب شد"
                                    : "Selected"
                                  : isFree
                                    ? isFa
                                      ? "آزاد"
                                      : "Free"
                                    : t.state === "reserved"
                                      ? isFa
                                        ? "رزرو"
                                        : "Reserved"
                                      : isFa
                                        ? "سفارش باز"
                                        : "Busy"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200/80 rounded-3xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#1C1917] flex items-center gap-1.5">
                        <Users size={15} className="text-amber-600" />
                        {isFa ? "تعداد نفرات:" : "Guests:"}
                      </span>
                      <div className="flex items-center gap-2.5 bg-[#F7F4EF] rounded-full p-1">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-white text-[#1C1917] flex items-center justify-center shadow-2xs"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="text-xs font-black min-w-[44px] text-center">
                          {reserveGuests.toLocaleString("fa-IR")}{" "}
                          {isFa ? "نفر" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(25, g + 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#1C1917] text-white flex items-center justify-center"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-stone-500 mb-2">
                        {isFa
                          ? "ساعت حضور (اختیاری):"
                          : "Arrival Time (optional):"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(isFa ? timePresetsFa : timePresetsEn).map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setReserveTime(reserveTime === slot ? "" : slot)
                            }
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                              reserveTime === slot
                                ? "bg-[#1C1917] text-amber-400"
                                : "bg-[#F7F4EF] text-stone-700"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <User
                        size={15}
                        className={`absolute top-1/2 -translate-y-1/2 text-stone-400 ${
                          isFa ? "right-4" : "left-4"
                        }`}
                      />
                      <input
                        type="text"
                        value={reserveName}
                        onChange={(e) => {
                          setReserveName(e.target.value);
                          if (reserveError) setReserveError("");
                        }}
                        placeholder={
                          isFa
                            ? "نام و نام خانوادگی (الزامی)"
                            : "Full Name (required)"
                        }
                        className={`w-full bg-white border border-stone-200 focus:border-amber-600 rounded-2xl py-3.5 text-xs font-bold text-[#1C1917] outline-none ${
                          isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={15}
                        className={`absolute top-1/2 -translate-y-1/2 text-stone-400 ${
                          isFa ? "right-4" : "left-4"
                        }`}
                      />
                      <input
                        type="tel"
                        dir="ltr"
                        maxLength={11}
                        value={reserveMobile}
                        onChange={(e) => {
                          setReserveMobile(e.target.value.replace(/\D/g, ""));
                          if (reserveError) setReserveError("");
                        }}
                        placeholder="09123456789"
                        className="w-full bg-white border border-stone-200 focus:border-amber-600 rounded-2xl py-3.5 px-10 text-left font-mono text-sm font-bold text-[#1C1917] outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "توضیحات (اختیاری - مثلاً: جشن تولد)"
                          : "Special note (optional)..."
                      }
                      className="w-full bg-white border border-stone-200 focus:border-amber-600 rounded-2xl py-3 px-4 text-xs font-bold text-[#1C1917] outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl p-3 text-xs font-black">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#1C1917] hover:bg-black disabled:opacity-40 text-amber-400 py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all shrink-0"
                >
                  {isReserving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck size={18} />
                      <span>
                        {selectedReserveTable
                          ? isFa
                            ? `ثبت رزرو میز شماره ${selectedReserveTable.toLocaleString("fa-IR")}`
                            : `Reserve Table #${selectedReserveTable}`
                          : isFa
                            ? "ثبت نهایی رزرو میز"
                            : "Confirm Reservation"}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* دراور سبد خرید */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] w-full max-w-xl mx-auto rounded-t-[36px] p-6 pb-8 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-black text-[#1C1917]">
                  {isFa ? "سبد خرید" : "Your Bag"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-amber-700 mt-0.5">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-[#EFECE6] text-stone-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-1 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div
                    key={pid}
                    className="bg-white border border-stone-200/80 p-4 rounded-3xl space-y-3"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[#1C1917] mb-1 truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-amber-700 font-bold">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          {isFa ? "تومان" : "IRT"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {updateItemNotes && (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenNoteIds((prev) => ({
                                ...prev,
                                [pid]: !prev[pid],
                              }))
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isNoteOpen
                                ? "bg-amber-500 text-stone-950"
                                : "bg-[#F7F4EF] text-stone-500"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-[#F7F4EF] rounded-full p-1">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-white text-[#1C1917] flex items-center justify-center shadow-2xs"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#1C1917] text-white flex items-center justify-center"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isNoteOpen && updateItemNotes && (
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(pid, e.target.value)}
                        placeholder={
                          isFa
                            ? "یادداشت برای آشپزخانه..."
                            : "Special note for kitchen..."
                        }
                        className="w-full bg-[#F7F4EF] border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1C1917] outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  isFa ? "نام شما (اختیاری)" : "Your name (optional)"
                }
                className="w-full bg-white border border-stone-200 focus:border-amber-600 rounded-2xl px-4 py-3.5 text-xs font-bold text-[#1C1917] outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#1C1917] hover:bg-black disabled:opacity-50 text-amber-400 py-4 rounded-full font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>
                    {isFa ? "ثبت نهایی سفارش" : "Place Order"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال احضار گارسون */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <BellRing size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {isFa ? "احضار گارسون" : "Call Waiter"}
                  </h3>
                  <p className="text-xs font-bold text-stone-400">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-9 h-9 rounded-full bg-[#EFECE6] text-stone-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(isFa ? waiterPresetsFa : waiterPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                    message === preset
                      ? "bg-[#1C1917] text-white"
                      : "bg-white border border-stone-200 text-stone-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isFa
                  ? "توضیحات دلخواه خود را بنویسید (اختیاری)..."
                  : "Write a message (optional)..."
              }
              className="w-full bg-white border border-stone-200 rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-5"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال درخواست به سالن" : "Send Request"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال پیام به سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {isFa ? "درخواست از سرآشپز" : "Note to Chef"}
                  </h3>
                  <p className="text-xs font-bold text-stone-400">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-9 h-9 rounded-full bg-[#EFECE6] text-stone-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(isFa ? chefPresetsFa : chefPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                    message === preset
                      ? "bg-[#1C1917] text-amber-400"
                      : "bg-white border border-stone-200 text-stone-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isFa
                  ? "توضیحات پخت یا حساسیت غذایی را بنویسید..."
                  : "Cooking preferences or allergies..."
              }
              className="w-full bg-white border border-stone-200 rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-5"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-[#1C1917] hover:bg-black text-amber-400 py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال به آشپزخانه" : "Send to Kitchen"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال پیگیری زنده سفارش */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] text-[#1C1917] w-full max-w-md rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col"
          >
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white border border-stone-200 text-[#1C1917] px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshingOrder ? "animate-spin" : ""}
                />
                <span>{isFa ? "بروزرسانی" : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrackerOpen(false)}
                className="w-9 h-9 rounded-full bg-[#EFECE6] text-stone-600 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-5 shrink-0">
              <div className="w-16 h-16 mx-auto rounded-[22px] bg-[#1C1917] text-amber-400 flex items-center justify-center mb-3">
                <Sparkles size={28} />
              </div>
              <span className="inline-block text-xs font-black text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full mb-2">
                {isFa
                  ? `کد پیگیری: #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-xl font-black text-[#1C1917]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "سفارش شما تحویل داده شد!"
                    : "Order Delivered!"
                  : isFa
                    ? "وضعیت آماده‌سازی سفارش"
                    : "Order Preparation Status"}
              </h2>
            </div>

            <div className="bg-white border border-stone-200/80 rounded-[28px] p-5 space-y-4 mb-6 overflow-y-auto no-scrollbar">
              {dynamicStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3.5 transition-opacity ${
                      isPending ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-[#1C1917] text-amber-400"
                            : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} />
                      ) : isActive ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <span className="block font-black text-sm text-[#1C1917]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-stone-400 mt-0.5">
                          {stage.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsTrackerOpen(false)}
              className="w-full bg-[#1C1917] text-white py-4 rounded-full font-black text-sm transition-all active:scale-[0.98] shrink-0"
            >
              {isFa ? "بازگشت به منو" : "Back to Menu"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Template2;
