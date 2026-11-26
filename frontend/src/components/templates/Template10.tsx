import React, { useState, useEffect } from "react";
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
  Info,
  Camera,
  Pin,
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
    name: "ثبت یادداشت سفارش",
    description: "سفارش شما روی بورد آشپزخانه سنجاق شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "باریستا و سرآشپز مشغول آماده کردن سفارش شما هستند",
  },
  {
    id: "ready",
    name: "آماده سرو سر میز",
    description: "سفارش آماده است و تا لحظاتی دیگر تقدیم می‌شود",
  },
];

// چرخش ملایم و طبیعی برای حس چیدمان دستی پلارویدها روی بورد کافه
const POLAROID_TILTS = [
  "-rotate-[1.35deg]",
  "rotate-[1.45deg]",
  "rotate-[0.85deg]",
  "-rotate-[1.1deg]",
];

// نوار چسب کاغذی (Washi Tape) نیمه‌شفاف روی لبه بالایی عکس‌ها
const WashiTape: React.FC<{ variant?: number; className?: string }> = ({
  variant = 0,
  className = "",
}) => {
  const styles = [
    "bg-[#DFC8A2]/80 border-[#C8AE82]/40 -rotate-2",
    "bg-[#BFD3C4]/80 border-[#9DB8A4]/40 rotate-2",
    "bg-[#E7BFB0]/80 border-[#CFA08E]/40 -rotate-1",
  ];
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none block w-14 h-4 border-x border-dashed backdrop-blur-[1px] shadow-[0_1px_2px_rgba(35,32,30,0.08)] ${
        styles[variant % styles.length]
      } ${className}`}
    />
  );
};

// سنجاق فلزی سه‌بعدی کوچک برای کارت‌های سنجاق‌شده
const PushPinBadge: React.FC<{ color?: "green" | "rust" | "charcoal" }> = ({
  color = "green",
}) => {
  const palette = {
    green: "from-[#4A8560] to-[#234731] ring-[#2F5E41]/25",
    rust: "from-[#D97757] to-[#9A3F22] ring-[#B85D3B]/25",
    charcoal: "from-[#4B4642] to-[#1C1917] ring-black/20",
  }[color];

  return (
    <span
      aria-hidden="true"
      className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${palette} ring-4 shadow-[0_3px_6px_rgba(0,0,0,0.28)] inline-flex items-center justify-center shrink-0`}
    >
      <span className="w-1 h-1 rounded-full bg-white/75 -translate-x-0.5 -translate-y-0.5" />
    </span>
  );
};

const Template10: React.FC<TemplateProps> = ({
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

  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(
    null,
  );
  const [modalNoteText, setModalNoteText] = useState("");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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
    setTimeout(() => setToastMsg(null), 3200);
  };

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
        isFa
          ? "کارت رزرو میز با موفقیت ثبت شد!"
          : "Table reservation confirmed!",
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
      showToast(
        isFa ? "یادداشت شما با موفقیت ارسال شد." : "Note sent successfully.",
      );
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

  const safeVenueName = venueData?.name || venueData?.Name || "کافه گالری";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";
  const safePhone = venueData?.phone || venueData?.Phone || "";

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const safeCategories = Array.isArray(menuData) ? menuData : [];

  const filteredMenu = safeCategories
    .filter((cat) => {
      if (searchQuery.trim()) return true;
      return selectedCategoryId === "all" || cat.id === selectedCategoryId;
    })
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

  const timePresetsFa = ["۱۰:۳۰ (صبحانه)", "۱۶:۰۰ (عصرانه)", "۱۹:۰۰", "۲۱:۰۰"];
  const timePresetsEn = [
    "10:30 (Morning)",
    "16:00 (Afternoon)",
    "19:00",
    "21:00",
  ];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به آب و لیوان",
    "بشقاب و کارد و چنگال اضافه",
    "حضور میزبان سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Water & glasses",
    "Extra plates & cutlery",
    "Host assistance",
  ];

  const chefPresetsFa = [
    "قهوه با شیر جو دوسر / بادام باشد",
    "بدون شکر و سیروپ",
    "دمای نوشیدنی ملایم باشد",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "Oat / almond milk",
    "No sugar or syrup",
    "Warm / not too hot",
    "Food allergy note",
  ];

  return (
    <div
      className="min-h-screen bg-[#EBE4D5] text-[#23201E] font-sans antialiased selection:bg-[#2F5E41]/20 overflow-x-hidden pb-36 relative"
      style={{
        backgroundImage:
          "radial-gradient(rgba(35,32,30,0.065) 1px, transparent 0), radial-gradient(rgba(184,93,59,0.04) 1px, transparent 0)",
        backgroundSize: "20px 20px, 32px 32px",
        backgroundPosition: "0 0, 10px 10px",
      }}
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان سنجاق‌شده بالای صفحه */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#FCFBF8] text-[#23201E] px-4 py-2.5 rounded-sm shadow-[0_14px_30px_rgba(35,32,30,0.22)] font-black text-xs flex items-center gap-2.5 border-2 border-[#2F5E41] -rotate-1">
            <PushPinBadge color="green" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: کارت‌پستال سنجاق‌شده هدر مجموعه (Pinned Cafe Board)
         ======================================================== */}
      <header className="max-w-4xl mx-auto px-3.5 pt-4 pb-3">
        {/* ردیف ابزارک‌های کوچک بالای بورد */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {tableNumber ? (
              <div className="bg-[#FCFBF8] border border-[#23201E]/20 px-3 py-1 rounded-sm shadow-2xs flex items-center gap-2 text-[11px] font-black text-[#2F5E41] -rotate-1">
                <span className="w-2 h-2 rounded-full bg-[#D6CCB9] border border-[#23201E]/30" />
                <span>
                  {isFa ? `میز شماره ${tableNumber}` : `TABLE #${tableNumber}`}
                </span>
              </div>
            ) : (
              <div className="bg-[#FCFBF8]/90 border border-[#23201E]/15 px-3 py-1 rounded-sm text-[10px] font-black text-[#6B635B] flex items-center gap-1.5">
                <Camera size={12} className="text-[#2F5E41]" />
                <span>{isFa ? "آلبوم منوی کافه" : "CAFE SCRAPBOOK"}</span>
              </div>
            )}

            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="bg-[#B85D3B] text-white px-3 py-1 rounded-sm font-black text-[11px] flex items-center gap-1.5 shadow-sm rotate-1 active:scale-95 transition-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>#{activeOrder.orderNumber}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              aria-label="جستجو"
              className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-colors shadow-2xs ${
                isSearchOpen || searchQuery
                  ? "bg-[#23201E] text-[#FCFBF8] border-[#23201E]"
                  : "bg-[#FCFBF8] text-[#23201E] border-[#23201E]/20"
              }`}
            >
              {isSearchOpen ? <X size={14} /> : <Search size={14} />}
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-8 px-2.5 rounded-sm bg-[#FCFBF8] border border-[#23201E]/20 text-[#23201E] font-black text-[11px] flex items-center gap-1 shadow-2xs"
              >
                <Globe size={12} className="text-[#2F5E41]" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label="اطلاعات"
              className="w-8 h-8 rounded-sm bg-[#FCFBF8] border border-[#23201E]/20 text-[#23201E] flex items-center justify-center shadow-2xs"
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* کارت‌پستال اصلی معرفی کافه با سنجاق مرکزی */}
        <div className="relative bg-[#FCFBF8] border border-[#23201E]/15 rounded-sm p-4 sm:p-6 pt-6 shadow-[0_12px_28px_rgba(35,32,30,0.1)]">
          {/* سنجاق فلزی در مرکز لبه بالا */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <PushPinBadge color="rust" />
          </div>

          <div className="flex items-center gap-4">
            {/* قاب پلاروید کوچک برای لوگو */}
            <div className="bg-white p-1.5 pb-3 border border-[#23201E]/15 shadow-sm -rotate-2 shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#F3EFE6] overflow-hidden flex items-center justify-center">
                {safeLogo ? (
                  <img
                    src={getFullImageUrl(safeLogo)}
                    alt={safeVenueName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store size={24} className="text-[#2F5E41]" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#23201E] tracking-tight truncate">
                {safeVenueName}
              </h1>
              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-[#6B635B] line-clamp-2 leading-relaxed mt-1">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}
            </div>
          </div>

          {/* برچسب‌های یادداشت عملیات میز */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-dashed border-[#23201E]/15">
            <button
              type="button"
              onClick={openReservationModal}
              className="bg-[#2F5E41] hover:bg-[#234731] text-[#FCFBF8] px-3.5 py-2 rounded-sm text-[11px] font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <CalendarCheck size={13} />
              <span>{isFa ? "رزرو میز" : "Reserve Table"}</span>
              {tablesList.length > 0 && (
                <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-xs font-mono text-[10px]">
                  {availableTablesCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            {tableNumber && venueData?.callWaiterEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setWaiterModal(true);
                }}
                className="bg-[#F6E3BA] hover:bg-[#EED59F] text-[#23201E] border border-[#23201E]/15 px-3 py-2 rounded-sm text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <BellRing size={13} className="text-[#B85D3B]" />
                <span>{isFa ? "احضار میزبان" : "Call Host"}</span>
              </button>
            )}

            {tableNumber && venueData?.callChefEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="bg-[#D8E4DC] hover:bg-[#C6D8CC] text-[#23201E] border border-[#23201E]/15 px-3 py-2 rounded-sm text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ChefHat size={13} className="text-[#2F5E41]" />
                <span>{isFa ? "یادداشت به باریستا" : "Barista Note"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: تب‌های برچسبی سنجاق‌شده روی بورد + جستجو
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#EBE4D5]/92 backdrop-blur-md border-b border-[#23201E]/10 py-2.5">
        <div className="max-w-4xl mx-auto px-3.5 space-y-2.5">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
              <Search
                size={14}
                className={`absolute top-1/2 -translate-y-1/2 text-[#6B635B] ${
                  isFa ? "right-3.5" : "left-3.5"
                }`}
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa ? "جستجو در آلبوم منو..." : "Search scrapbook items..."
                }
                className={`w-full bg-[#FCFBF8] border border-[#23201E]/25 focus:border-[#2F5E41] rounded-sm py-2.5 text-xs font-bold text-[#23201E] placeholder:text-[#8E857B] outline-none shadow-2xs ${
                  isFa ? "pr-9 pl-9" : "pl-9 pr-9"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#6B635B] ${
                    isFa ? "left-3" : "right-3"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {safeCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSearchQuery("");
                }}
                className={`px-3.5 py-2 rounded-sm text-xs font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "bg-[#23201E] text-[#FCFBF8] border-[#23201E] shadow-sm"
                    : "bg-[#FCFBF8] text-[#5C544D] border-[#23201E]/15 hover:border-[#23201E]/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedCategoryId === "all" && !searchQuery
                      ? "bg-[#B85D3B]"
                      : "bg-[#23201E]/25"
                  }`}
                />
                <span>{isFa ? "کل آلبوم" : "All Photos"}</span>
              </button>

              {safeCategories.map((cat: any) => {
                const isSelected =
                  selectedCategoryId === cat.id && !searchQuery.trim();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSearchQuery("");
                    }}
                    className={`px-3.5 py-2 rounded-sm text-xs font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#2F5E41] text-[#FCFBF8] border-[#2F5E41] shadow-sm"
                        : "bg-[#FCFBF8] text-[#5C544D] border-[#23201E]/15 hover:border-[#23201E]/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-[#F6E3BA]" : "bg-[#23201E]/25"
                      }`}
                    />
                    <span>
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
          بخش ۳: گالری عکس‌های پلاروید چسب‌خورده (Polaroid Grid)
         ======================================================== */}
      <main className="max-w-4xl mx-auto px-3.5 pt-6">
        {filteredMenu.length === 0 ? (
          <div className="bg-[#FCFBF8] border border-[#23201E]/15 p-14 text-center shadow-sm">
            <Camera size={34} className="text-[#8E857B] mx-auto mb-3" />
            <p className="text-xs font-bold text-[#6B635B]">
              {isFa
                ? "عکسی با این جستجو در آلبوم پیدا نشد."
                : "No photos matched your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredMenu.map((cat: any) => {
              const hasProducts =
                Array.isArray(cat.products) && cat.products.length > 0;
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;

              return (
                <section key={cat.id}>
                  {/* برچسب عنوان بخش روی بورد */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="inline-flex items-center gap-2 bg-[#FCFBF8] border border-[#23201E]/20 px-3.5 py-1.5 rounded-sm shadow-2xs -rotate-[0.6deg]">
                      <PushPinBadge color="charcoal" />
                      <h2 className="text-sm sm:text-base font-black text-[#23201E] tracking-tight">
                        {catTitle}
                      </h2>
                      <span className="font-mono text-[10px] font-bold text-[#6B635B] bg-[#EBE4D5] px-1.5 py-0.5 rounded-xs">
                        {(cat.products?.length || 0).toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="flex-1 border-b border-dashed border-[#23201E]/20" />
                  </div>

                  {!hasProducts ? (
                    <div className="bg-[#FCFBF8] border border-[#23201E]/15 p-6 text-center text-xs font-bold text-[#6B635B]">
                      {isFa
                        ? "در این بخش هنوز عکسی قرار نگرفته است."
                        : "No items in this section yet."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3.5 gap-y-6 sm:gap-6">
                      {cat.products.map((prod: any, idx: number) => {
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
                        const tiltClass = cartItem
                          ? "rotate-0 ring-2 ring-[#2F5E41]"
                          : `${POLAROID_TILTS[idx % POLAROID_TILTS.length]} hover:rotate-0`;

                        return (
                          <article
                            key={prod?.id}
                            onClick={() => openProductShowcase(prod)}
                            className={`group cursor-pointer bg-white p-2 sm:p-2.5 pb-3.5 rounded-[3px] border border-[#23201E]/12 shadow-[0_10px_22px_rgba(35,32,30,0.11)] transition-all duration-300 relative flex flex-col justify-between ${tiltClass} ${
                              !isAvailable ? "opacity-60" : ""
                            }`}
                          >
                            {/* تکه چسب کاغذی نیمه‌شفاف روی لبه بالایی پلاروید */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                              <WashiTape variant={idx} />
                            </div>

                            {/* سنجاق سبز در صورت انتخاب شدن آیتم */}
                            {cartItem && (
                              <div className="absolute top-1.5 right-1.5 z-20">
                                <PushPinBadge color="green" />
                              </div>
                            )}

                            <div>
                              {/* کادر مربعی عکس چاپ‌شده پلاروید */}
                              <div className="aspect-square w-full bg-[#F2ECE1] overflow-hidden relative flex items-center justify-center border border-[#23201E]/10">
                                {prod?.imageUrl ? (
                                  <img
                                    src={getFullImageUrl(prod.imageUrl)}
                                    alt={isFa ? prod.nameFa : prod.nameEn}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9E9488] gap-1">
                                    <UtensilsCrossed
                                      size={26}
                                      strokeWidth={1.5}
                                    />
                                    <span className="text-[9px] font-mono">
                                      NO PHOTO
                                    </span>
                                  </div>
                                )}

                                {isAvailable &&
                                  hasFiniteStock &&
                                  Number(prod.stock) <= 5 && (
                                    <span className="absolute bottom-1.5 right-1.5 bg-[#B85D3B] text-white text-[9px] font-black px-2 py-0.5 rounded-xs shadow-xs">
                                      {isFa
                                        ? `${prod.stock} مانده`
                                        : `${prod.stock} left`}
                                    </span>
                                  )}

                                {!isAvailable && (
                                  <div className="absolute inset-0 bg-[#23201E]/55 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="bg-white text-[#B85D3B] border border-[#B85D3B] text-[10px] font-black px-2.5 py-0.5 -rotate-3">
                                      {isFa ? "تمام شد" : "SOLD OUT"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* حاشیه سفید پایین پلاروید: عنوان و توضیح */}
                              <div className="pt-2.5 px-0.5">
                                <h3 className="font-black text-[12.5px] sm:text-sm text-[#23201E] leading-snug line-clamp-1">
                                  {isFa
                                    ? prod?.nameFa
                                    : prod?.nameEn || prod?.nameFa}
                                </h3>

                                {(isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn ||
                                    prod?.descriptionFa) && (
                                  <p className="text-[10px] font-medium text-[#6B635B] line-clamp-1 mt-0.5">
                                    {isFa
                                      ? prod?.descriptionFa
                                      : prod?.descriptionEn ||
                                        prod?.descriptionFa}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* پایین حاشیه پلاروید: قیمت + کنترل تعداد */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2.5 pt-2 border-t border-dashed border-[#23201E]/15 px-0.5 flex items-center justify-between gap-1.5"
                            >
                              <div className="min-w-0">
                                <span className="font-mono font-black text-xs sm:text-[13px] text-[#23201E] block leading-none">
                                  {Number(prod?.price || 0).toLocaleString(
                                    "fa-IR",
                                  )}
                                </span>
                                <span className="text-[9px] font-bold text-[#6B635B]">
                                  {isFa ? "تومان" : "IRT"}
                                </span>
                              </div>

                              {venueData?.orderingEnabled &&
                                tableNumber &&
                                isAvailable && (
                                  <>
                                    {cartItem ? (
                                      <div className="flex items-center gap-1 bg-[#2F5E41] text-white rounded-sm p-0.5 shadow-2xs shrink-0">
                                        <button
                                          type="button"
                                          disabled={Boolean(reachedMaxStock)}
                                          onClick={() => addToCart(prod)}
                                          className="w-6 h-6 bg-white/20 hover:bg-white/30 disabled:opacity-35 rounded-xs flex items-center justify-center active:scale-90"
                                        >
                                          <Plus size={11} strokeWidth={3} />
                                        </button>
                                        <span className="font-mono text-[11px] font-black min-w-[14px] text-center">
                                          {cartItem.quantity.toLocaleString(
                                            "fa-IR",
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFromCart(prod.id)
                                          }
                                          className="w-6 h-6 bg-white/15 hover:bg-white/25 rounded-xs flex items-center justify-center active:scale-90"
                                        >
                                          <Minus size={11} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        aria-label={isFa ? "افزودن" : "Add"}
                                        onClick={() => addToCart(prod)}
                                        className="w-7 h-7 rounded-sm bg-[#EBE4D5] hover:bg-[#2F5E41] text-[#23201E] hover:text-white border border-[#23201E]/15 flex items-center justify-center transition-colors active:scale-90 shrink-0"
                                      >
                                        <Plus size={14} strokeWidth={2.6} />
                                      </button>
                                    )}
                                  </>
                                )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* فوتر سنجاق‌شده ترنج */}
        <footer className="mt-12 pt-5 border-t border-dashed border-[#23201E]/20 text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#FCFBF8] border border-[#23201E]/15 px-3.5 py-1.5 rounded-sm text-[11px] font-bold text-[#6B635B] hover:text-[#2F5E41] shadow-2xs transition-colors"
          >
            <Sparkles size={12} className="text-[#2F5E41]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۴: نوار سینی سفارش با پلارویدهای کوچک هم‌پوشان
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-3.5 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#23201E] hover:bg-[#181614] text-[#FCFBF8] p-2.5 px-4 rounded-sm font-black flex items-center justify-between gap-3 shadow-[0_18px_40px_rgba(35,32,30,0.34)] border-2 border-[#FCFBF8]/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* پلارویدهای کوچک چرخیده از آیتم‌های انتخابی */}
              <div className="flex items-center -space-x-2 space-x-reverse shrink-0">
                {cart.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.product?.id ?? idx}
                    className={`w-8 h-9 bg-white p-0.5 pb-1.5 shadow-md border border-black/20 overflow-hidden flex items-center justify-center ${
                      idx % 2 === 0 ? "-rotate-6" : "rotate-6"
                    }`}
                  >
                    {item.product?.imageUrl ? (
                      <img
                        src={getFullImageUrl(item.product.imageUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={12} className="text-[#23201E]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-right min-w-0">
                <span className="block text-xs font-black truncate">
                  {isFa ? "مشاهده و ثبت سفارش" : "Review Scrapbook Order"} (
                  {totalItems.toLocaleString("fa-IR")})
                </span>
                <span className="block text-[10px] font-bold text-[#C4D7C8]">
                  {tableNumber
                    ? isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`
                    : isFa
                      ? "تکمیل سفارش"
                      : "Place order"}
                </span>
              </div>
            </div>

            <div className="bg-[#2F5E41] text-white px-3 py-1.5 rounded-xs font-mono text-xs font-black shrink-0">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="font-sans text-[9px] font-bold opacity-80">
                {isFa ? "تومان" : "IRT"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال ۱: اطلاعات مجموعه (Pinned Postcard Info)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-[#23201E]/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FCFBF8] border-2 border-[#23201E]/20 rounded-t-md sm:rounded-md p-6 pb-8 w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <PushPinBadge color="rust" />
                <h3 className="font-black text-base text-[#23201E]">
                  {safeVenueName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 rounded-sm bg-[#EBE4D5] text-[#23201E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-[#5C544D] leading-relaxed mb-4">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {(safeAddress || safePhone) && (
              <div className="bg-[#EBE4D5]/70 border border-[#23201E]/15 rounded-sm p-4 space-y-2.5 text-xs font-bold text-[#23201E]">
                {safeAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={15}
                      className="text-[#2F5E41] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone size={15} className="text-[#2F5E41] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۲: بزرگ‌نمایی پلاروید محصول (Large Polaroid Modal)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-[#23201E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 pb-6 rounded-[4px] border border-[#23201E]/20 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            {/* نوار چسب کاغذی روی لبه بالایی مودال پلاروید */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
              <WashiTape variant={1} className="w-20 h-5" />
            </div>

            <button
              type="button"
              onClick={() => setSelectedProductModal(null)}
              className="absolute top-6 left-6 z-20 w-8 h-8 rounded-full bg-white/95 text-[#23201E] shadow-md flex items-center justify-center"
            >
              <X size={16} />
            </button>

            {/* تصویر مربعی بزرگ داخل قاب پلاروید */}
            <div className="aspect-square w-full bg-[#F2ECE1] border border-[#23201E]/10 overflow-hidden mb-4">
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
                <div className="w-full h-full flex items-center justify-center text-[#9E9488]">
                  <UtensilsCrossed size={44} />
                </div>
              )}
            </div>

            {/* بخش متن زیر عکس پلاروید */}
            <div className="space-y-3 px-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#23201E] leading-snug">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="font-mono text-base font-black text-[#2F5E41] shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="font-sans text-[10px] text-[#6B635B]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#6B635B] leading-relaxed">
                  {isFa
                    ? selectedProductModal.descriptionFa
                    : selectedProductModal.descriptionEn ||
                      selectedProductModal.descriptionFa}
                </p>
              )}

              {venueData?.orderingEnabled && tableNumber ? (
                <div className="space-y-3 pt-2 border-t border-dashed border-[#23201E]/15">
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
                          ? "یادداشت پشت عکس (مثلاً: با شیر جو دوسر)..."
                          : "Write a note for kitchen..."
                      }
                      className="w-full bg-[#F6F2EA] border border-[#23201E]/20 focus:border-[#2F5E41] rounded-sm px-3.5 py-2.5 text-xs font-bold text-[#23201E] outline-none"
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
                        <div className="w-full py-3 bg-[#B85D3B]/10 text-[#B85D3B] font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "SOLD OUT"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-[#EBE4D5] p-1.5 rounded-sm">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-8 h-8 rounded-xs bg-white text-[#23201E] flex items-center justify-center"
                            >
                              <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <span className="font-mono font-black text-base text-[#2F5E41] min-w-[20px] text-center">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-8 h-8 rounded-xs bg-[#2F5E41] text-white flex items-center justify-center"
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-[#23201E] text-white px-5 py-2 rounded-xs font-black text-xs"
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
                            isFa ? "به سینی سفارش اضافه شد" : "Added to order",
                          );
                        }}
                        className="w-full bg-[#2F5E41] hover:bg-[#234731] text-white py-3.5 rounded-sm font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                      >
                        <Pin size={15} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Order"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#23201E] text-white py-3 rounded-sm font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳: کارت رزرو میز کافه (Reservation Postcard)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-[#23201E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FCFBF8] border-2 border-[#23201E]/20 rounded-t-md sm:rounded-md p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#23201E]/20 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <PushPinBadge color="green" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#23201E]">
                      {isFa ? "کارت رزرو میز" : "Table Reservation"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-xs bg-[#2F5E41] text-white font-mono text-[9px] font-black">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#6B635B]">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-sm bg-[#EBE4D5] text-[#23201E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#D8E4DC] text-[#2F5E41] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#23201E]">
                    {isFa ? "میز شما رزرو شد!" : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-[#6B635B] mt-0.5">
                    {isFa
                      ? "کارت رزرو شما روی بورد کافه ثبت گردید"
                      : "Your table card is pinned on our board"}
                  </p>
                </div>

                <div className="bg-[#EBE4D5]/60 border border-[#23201E]/15 rounded-sm p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1 border-b border-dashed border-[#23201E]/15">
                    <span className="text-[#6B635B]">
                      {isFa ? "میز:" : "Table:"}
                    </span>
                    <span className="font-mono font-black text-[#2F5E41]">
                      #{confirmedReservation.tableNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#23201E]/15">
                    <span className="text-[#6B635B]">
                      {isFa ? "نام مهمان:" : "Name:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#23201E]/15">
                    <span className="text-[#6B635B]">
                      {isFa ? "تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B635B]">
                      {isFa ? "نفرات:" : "Guests:"}
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
                  className="w-full bg-[#23201E] text-[#FCFBF8] py-3.5 rounded-sm font-black text-sm"
                >
                  {isFa ? "بازگشت به آلبوم" : "Back to Menu"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-[#EBE4D5]/70 px-3.5 py-2 rounded-sm text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#2F5E41]">
                      <span className="w-2 h-2 rounded-full bg-[#2F5E41]" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#B85D3B]">
                      <span className="w-2 h-2 rounded-full bg-[#B85D3B]" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-[#23201E]">
                        {isFa ? "انتخاب شماره میز:" : "Select table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#2F5E41]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-[#EBE4D5]/60 p-4 text-center text-xs font-bold text-[#6B635B]">
                        {isFa
                          ? "میزی برای رزرو تعریف نشده است."
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
                              className={`py-2.5 rounded-sm border transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#2F5E41] bg-[#2F5E41] text-white shadow-sm"
                                  : isFree
                                    ? "border-[#23201E]/20 bg-white text-[#23201E] hover:border-[#2F5E41]"
                                    : "border-transparent bg-[#E2D9C8] text-[#8E857B] opacity-60 cursor-not-allowed"
                              }`}
                            >
                              <span className="font-mono text-xs font-black">
                                {isFa
                                  ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                  : `#${t.tableNumber}`}
                              </span>
                              <span className="text-[9px] font-bold mt-0.5 opacity-85">
                                {isSelected
                                  ? isFa
                                    ? "انتخاب شد"
                                    : "Picked"
                                  : isFree
                                    ? isFa
                                      ? "آزاد"
                                      : "Free"
                                    : t.state === "reserved"
                                      ? isFa
                                        ? "رزرو"
                                        : "Reserved"
                                      : isFa
                                        ? "اشغال"
                                        : "Busy"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#EBE4D5]/60 border border-[#23201E]/15 p-3.5 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className="text-[#2F5E41]" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-white border border-[#23201E]/20 p-0.5 rounded-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 bg-[#EBE4D5] flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-black min-w-[34px] text-center">
                          {reserveGuests.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 bg-[#2F5E41] text-white flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(isFa ? timePresetsFa : timePresetsEn).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            setReserveTime(reserveTime === slot ? "" : slot)
                          }
                          className={`px-3 py-1 rounded-xs text-[11px] font-bold border transition-colors ${
                            reserveTime === slot
                              ? "bg-[#23201E] text-white border-[#23201E]"
                              : "bg-white text-[#5C544D] border-[#23201E]/15"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <User
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#6B635B] ${
                          isFa ? "right-3.5" : "left-3.5"
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
                          isFa ? "نام و نام خانوادگی *" : "Full Name *"
                        }
                        className={`w-full bg-white border border-[#23201E]/20 focus:border-[#2F5E41] rounded-sm py-2.5 text-xs font-bold outline-none ${
                          isFa ? "pr-9 pl-3.5" : "pl-9 pr-3.5"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#6B635B] ${
                          isFa ? "right-3.5" : "left-3.5"
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
                        className="w-full bg-white border border-[#23201E]/20 focus:border-[#2F5E41] rounded-sm py-2.5 px-9 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "توضیحات (مثلاً: میز دنج کنار پنجره)..."
                          : "Note (optional)..."
                      }
                      className="w-full bg-white border border-[#23201E]/20 focus:border-[#2F5E41] rounded-sm py-2.5 px-3.5 text-xs font-bold outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-[#B85D3B]/10 text-[#B85D3B] border border-[#B85D3B]/30 rounded-sm p-2.5 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#2F5E41] hover:bg-[#234731] disabled:opacity-40 text-white py-3.5 rounded-sm font-black text-sm flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  {isReserving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck size={16} />
                      <span>
                        {selectedReserveTable
                          ? isFa
                            ? `ثبت رزرو میز ${selectedReserveTable.toLocaleString("fa-IR")}`
                            : `Reserve Table #${selectedReserveTable}`
                          : isFa
                            ? "ثبت نهایی رزرو"
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

      {/* ========================================================
          مودال ۴: دراور سبد سفارش (Scrapbook Order Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-[#23201E]/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FCFBF8] border-t-2 border-[#23201E] w-full max-w-lg mx-auto p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-between items-center pb-3 border-b border-dashed border-[#23201E]/20 mb-4">
              <div className="flex items-center gap-2.5">
                <PushPinBadge color="green" />
                <div>
                  <h3 className="text-base font-black text-[#23201E]">
                    {isFa ? "لیست سفارش شما" : "Your Scrapbook Order"}
                  </h3>
                  {tableNumber && (
                    <p className="text-xs font-bold text-[#2F5E41]">
                      {isFa
                        ? `میز شماره ${tableNumber}`
                        : `Table #${tableNumber}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-sm bg-[#EBE4D5] text-[#23201E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div
                    key={pid}
                    className="bg-white border border-[#23201E]/15 p-3 rounded-sm space-y-2.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 bg-[#F2ECE1] p-0.5 border border-[#23201E]/15 shrink-0">
                          {item.product?.imageUrl ? (
                            <img
                              src={getFullImageUrl(item.product.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8E857B]">
                              <Camera size={15} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-[#23201E] truncate">
                            {isFa
                              ? item.product?.nameFa
                              : item.product?.nameEn || item.product?.nameFa}
                          </h4>
                          <p className="font-mono text-xs text-[#2F5E41] font-bold mt-0.5">
                            {(
                              (item.product?.price || 0) * item.quantity
                            ).toLocaleString("fa-IR")}{" "}
                            <span className="font-sans text-[10px] text-[#6B635B]">
                              {isFa ? "تومان" : "IRT"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {updateItemNotes && (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenNoteIds((prev) => ({
                                ...prev,
                                [pid]: !prev[pid],
                              }))
                            }
                            className={`w-7 h-7 rounded-xs border flex items-center justify-center ${
                              isNoteOpen
                                ? "bg-[#B85D3B] text-white border-[#B85D3B]"
                                : "bg-[#EBE4D5] text-[#5C544D] border-[#23201E]/15"
                            }`}
                          >
                            <MessageSquarePlus size={13} />
                          </button>
                        )}

                        <div className="flex items-center gap-1.5 bg-[#EBE4D5] rounded-xs p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-6 h-6 bg-white text-[#23201E] flex items-center justify-center"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="font-mono text-xs font-black min-w-[16px] text-center">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-6 h-6 bg-[#2F5E41] text-white flex items-center justify-center"
                          >
                            <Plus size={12} strokeWidth={2.5} />
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
                            : "Note for kitchen..."
                        }
                        className="w-full bg-[#F6F2EA] border border-[#23201E]/20 rounded-xs px-3 py-2 text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mb-3.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  isFa ? "نام شما (اختیاری)" : "Your Name (optional)"
                }
                className="w-full bg-white border border-[#23201E]/20 focus:border-[#2F5E41] rounded-sm px-3.5 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#2F5E41] hover:bg-[#234731] disabled:opacity-50 text-white py-3.5 rounded-sm font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>
                    {isFa ? "ثبت و ارسال سفارش" : "Place Order"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۵ و ۶: یادداشت چسبان سالن‌دار و باریستا
         ======================================================== */}
      {(waiterModal || chefModal) && (
        <div
          onClick={() => {
            if (isProcessing) return;
            setWaiterModal(false);
            setChefModal(false);
          }}
          className="fixed inset-0 z-50 bg-[#23201E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border-2 border-[#23201E]/20 rounded-t-md sm:rounded-md p-5 pb-7 w-full max-w-md shadow-2xl ${
              waiterModal ? "bg-[#FBF3E0]" : "bg-[#EDF3EF]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <PushPinBadge color={waiterModal ? "rust" : "green"} />
                <div>
                  <h3 className="font-black text-base text-[#23201E]">
                    {waiterModal
                      ? isFa
                        ? "یادداشت به میزبان"
                        : "Note to Host"
                      : isFa
                        ? "یادداشت به باریستا / سرآشپز"
                        : "Note to Barista"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#6B635B]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWaiterModal(false);
                  setChefModal(false);
                }}
                className="w-8 h-8 rounded-sm bg-white/80 text-[#23201E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {(waiterModal
                ? isFa
                  ? waiterPresetsFa
                  : waiterPresetsEn
                : isFa
                  ? chefPresetsFa
                  : chefPresetsEn
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-bold border transition-colors ${
                    message === preset
                      ? "bg-[#23201E] text-white border-[#23201E]"
                      : "bg-white/90 text-[#23201E] border-[#23201E]/15"
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
                isFa ? "پیام خود را بنویسید..." : "Write your note..."
              }
              className="w-full bg-white/95 border border-[#23201E]/20 rounded-sm p-3 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
              className={`w-full py-3.5 rounded-sm font-black text-sm text-white flex items-center justify-center gap-2 ${
                waiterModal
                  ? "bg-[#B85D3B] hover:bg-[#9C4B2D]"
                  : "bg-[#2F5E41] hover:bg-[#234731]"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={14} />
                  <span>{isFa ? "سنجاق کردن پیام" : "Pin Note"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۷: پیگیری زنده سفارش (Pinned Tracker Card)
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-[#23201E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FCFBF8] border-2 border-[#23201E]/20 w-full max-w-md rounded-t-md sm:rounded-md p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-[#EBE4D5] text-[#23201E] px-3 py-1.5 rounded-sm text-xs font-black flex items-center gap-1.5"
              >
                <RefreshCw
                  size={12}
                  className={isRefreshingOrder ? "animate-spin" : ""}
                />
                <span>{isFa ? "بروزرسانی" : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrackerOpen(false)}
                className="w-8 h-8 rounded-sm bg-[#EBE4D5] text-[#23201E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black bg-[#D8E4DC] text-[#2F5E41] px-3 py-1 rounded-xs mb-2">
                <PushPinBadge color="green" />
                <span>#{activeOrder.orderNumber}</span>
              </span>
              <h2 className="text-lg font-black text-[#23201E]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "Order Served!"
                  : isFa
                    ? "وضعیت لحظه‌ای سفارش شما"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-[#EBE4D5]/60 border border-[#23201E]/15 rounded-sm p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
              {dynamicStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3 transition-opacity ${
                      isPending ? "opacity-35" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-[#2F5E41] text-white"
                          : isActive
                            ? "bg-[#B85D3B] text-white"
                            : "bg-white border border-[#23201E]/20 text-[#8E857B]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={15} />
                      ) : isActive ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <span className="block font-black text-xs sm:text-sm text-[#23201E]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#6B635B] mt-0.5">
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
              className="w-full bg-[#23201E] text-[#FCFBF8] py-3.5 rounded-sm font-black text-sm shrink-0"
            >
              {isFa ? "بازگشت به آلبوم" : "Back to Menu"}
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

export default Template10;
