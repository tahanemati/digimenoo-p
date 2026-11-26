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
  RefreshCw,
  MessageSquarePlus,
  Send,
  UtensilsCrossed,
  Users,
  User,
  Phone,
  Check,
  AlertCircle,
  MapPin,
  Info,
  ChevronDown,
  Receipt,
  PenLine,
  Sparkles,
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
    name: "ثبت فیش در صندوق",
    description: "فیش سفارش شما با موفقیت ثبت و تایید شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "آشپزخانه مشغول آماده کردن سفارش فیش شماست",
  },
  {
    id: "ready",
    name: "آماده تحویل سر میز",
    description: "سفارش آماده است و تا لحظاتی دیگر سرو می‌شود",
  },
];

// لبه‌های دندانه‌دار (زیگزاگ) بالا و پایین برگه فیش حرارتی
const SerratedEdge: React.FC<{
  position: "top" | "bottom";
  idPrefix: string;
}> = ({ position, idPrefix }) => {
  const patternId = `${idPrefix}-zigzag-${position}`;
  return (
    <svg
      className="w-full h-3 block shrink-0 text-[#F8F7F2]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          width="16"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          {position === "top" ? (
            <polygon points="0,12 8,0 16,12" fill="currentColor" />
          ) : (
            <polygon points="0,0 8,12 16,0" fill="currentColor" />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${patternId})`} />
    </svg>
  );
};

// خط جداکننده نقطه‌چین با پانچ دایره‌ای در دو لبه برگه
const PerforatedDivider: React.FC = () => (
  <div className="relative flex items-center my-4" aria-hidden="true">
    <span className="w-5 h-5 rounded-full bg-[#DFDDD5] -mr-6.5 sm:-mr-8.5 shrink-0 shadow-[inset_0_1px_3px_rgba(20,24,36,0.12)]" />
    <div className="flex-1 border-b-2 border-dashed border-[#141824]/15 mx-2" />
    <span className="w-5 h-5 rounded-full bg-[#DFDDD5] -ml-6.5 sm:-ml-8.5 shrink-0 shadow-[inset_0_1px_3px_rgba(20,24,36,0.12)]" />
  </div>
);

// بارکد تزئینی پایین فیش چاپی
const ReceiptBarcode: React.FC<{ code: string }> = ({ code }) => {
  const bars = [
    2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1,
    4, 1, 2, 1, 3, 1, 1, 2,
  ];
  return (
    <div className="flex flex-col items-center gap-1.5 select-none opacity-80">
      <div className="flex items-stretch justify-center gap-[2px] h-9">
        {bars.map((w, i) => (
          <span
            key={i}
            style={{ width: `${w}px` }}
            className="bg-[#141824] block"
          />
        ))}
      </div>
      <span
        className="font-mono text-[10px] tracking-[0.28em] text-[#141824]/65 font-bold uppercase"
        dir="ltr"
      >
        {code}
      </span>
    </div>
  );
};

const Template8: React.FC<TemplateProps> = ({
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
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

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
        isFa ? "قبض رزرو میز صادر شد!" : "Table reservation confirmed!",
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

  const handleAddWithDraftNote = (prod: any) => {
    addToCart(prod);
    const note = (draftNotes[prod.id] || "").trim();
    if (note && updateItemNotes) {
      setTimeout(() => updateItemNotes(prod.id, note), 0);
    }
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
        isFa ? "یادداشت شما با موفقیت ارسال شد." : "Slip sent successfully.",
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
        setDraftNotes({});
        setActiveOrder(normalizedOrder);
        setIsTrackerOpen(true);
        showToast(
          isFa
            ? `فیش #${normalizedOrder.orderNumber} صادر و ارسال شد!`
            : `Check #${normalizedOrder.orderNumber} sent!`,
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

  const safeVenueName = venueData?.name || venueData?.Name || "داینر و بوفه";
  const safeSlug = venueData?.slug || venueData?.Slug || "TORANJ";
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

  const todayFormatted = new Intl.DateTimeFormat(isFa ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const timePresetsFa = ["۰۹:۳۰ (صبحانه)", "۱۳:۳۰ (ناهار)", "۱۹:۳۰", "۲۱:۰۰"];
  const timePresetsEn = ["09:30", "13:30", "19:30", "21:00"];

  const waiterPresetsFa = [
    "صدور صورت‌حساب",
    "سس کچاپ / خردل اضافه",
    "دستمال و نی اضافه",
    "حضور سالن‌دار سر میز",
  ];
  const waiterPresetsEn = [
    "Bring the check",
    "Extra sauces",
    "Napkins & cutlery",
    "Server needed",
  ];

  const chefPresetsFa = [
    "ساندویچ دو نیم شود",
    "بدون خیارشور و پیاز",
    "نان کاملاً برشته باشد",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "Cut sandwich in half",
    "No pickles or onions",
    "Extra toasted bread",
    "Food allergy note",
  ];

  return (
    <div
      className="min-h-screen bg-[#DFDDD5] text-[#141824] font-sans antialiased selection:bg-[#D92D20]/15 overflow-x-hidden py-4 sm:py-8 px-2.5 sm:px-4 pb-36 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان مُهردار بالای صفحه */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#141824] text-[#F8F7F2] px-4 py-2.5 rounded-md shadow-2xl font-black text-xs flex items-center gap-2.5 border-2 border-[#D92D20]">
            <span className="w-4 h-4 rounded-xs bg-[#D92D20] flex items-center justify-center shrink-0">
              <Check size={11} className="text-white" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          برگه اصلی دفترچه فیش و سفارش داینر (Paper Receipt Sheet)
         ======================================================== */}
      <div className="max-w-[540px] mx-auto drop-shadow-[0_20px_40px_rgba(20,24,36,0.16)]">
        {/* لبه دندانه‌دار بالای فیش */}
        <SerratedEdge position="top" idPrefix="main-pad" />

        <div className="bg-[#F8F7F2] px-4 sm:px-6 pt-3 pb-7 relative overflow-hidden">
          {/* نوار متادیتای چاپ‌شده در لبه بالای فیش */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-[#141824] text-[10px] sm:text-[11px] font-mono font-bold text-[#141824]/70">
            <div className="flex items-center gap-1.5 min-w-0">
              <Receipt size={13} className="text-[#D92D20] shrink-0" />
              <span className="truncate">{todayFormatted}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeOrder && (
                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(true)}
                  className="bg-[#D92D20] text-white px-2 py-0.5 rounded-xs font-black text-[10px] flex items-center gap-1 animate-pulse"
                >
                  <span>#{activeOrder.orderNumber}</span>
                </button>
              )}

              {venueData?.bilingual && (
                <button
                  type="button"
                  onClick={() => setLanguage(isFa ? "en" : "fa")}
                  className="border border-[#141824]/30 hover:border-[#141824] px-2 py-0.5 rounded-xs font-black text-[#141824] flex items-center gap-1 transition-colors"
                >
                  <Globe size={11} />
                  <span>{isFa ? "EN" : "فا"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                aria-label="اطلاعات مجموعه"
                className="w-6 h-6 border border-[#141824]/30 hover:border-[#141824] rounded-xs flex items-center justify-center text-[#141824]"
              >
                <Info size={12} />
              </button>
            </div>
          </div>

          {/* ========================================================
              سربرگ فیش سفارش (Order Pad Masthead + Rubber Stamp)
             ======================================================== */}
          <header className="pt-4 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-md border-2 border-[#141824] bg-white overflow-hidden flex items-center justify-center shrink-0 p-0.5">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover rounded-xs"
                    />
                  ) : (
                    <Store size={22} className="text-[#141824]" />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="block font-mono text-[10px] font-bold tracking-widest text-[#141824]/55 uppercase">
                    {isFa ? "برگه سفارش مهمان" : "GUEST CHECK / ORDER PAD"}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-[#141824] tracking-tight truncate leading-tight">
                    {safeVenueName}
                  </h1>
                </div>
              </div>

              {/* مُهر چرخیده‌ی شماره میز به سبک فیش داینر */}
              <div
                className={`shrink-0 border-2 px-2.5 py-1 rounded-xs -rotate-3 font-black text-center leading-tight ${
                  tableNumber
                    ? "border-[#D92D20] text-[#D92D20] bg-[#D92D20]/[0.05]"
                    : "border-[#141824]/40 text-[#141824]/60"
                }`}
              >
                <span className="block text-[9px] font-mono tracking-wider">
                  {isFa ? "میز / TBL" : "TABLE"}
                </span>
                <span className="block text-sm font-mono">
                  {tableNumber
                    ? String(tableNumber).padStart(2, "0")
                    : isFa
                      ? "آزاد"
                      : "--"}
                </span>
              </div>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-[11px] font-medium text-[#141824]/65 leading-relaxed mt-3 border-r-2 border-[#141824]/25 pr-2.5">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {/* نوار دکمه‌های کاربری (رزرو میز / سالن‌دار / یادداشت آشپزخانه) */}
            <div className="grid grid-cols-3 gap-1.5 mt-4">
              <button
                type="button"
                onClick={openReservationModal}
                className={`${
                  tableNumber &&
                  (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
                    ? ""
                    : "col-span-3"
                } bg-[#141824] hover:bg-[#1D4ED8] text-[#F8F7F2] py-2 px-2.5 rounded-sm font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors active:scale-95`}
              >
                <CalendarCheck size={13} />
                <span>{isFa ? "رزرو میز" : "Reserve"}</span>
                {tablesList.length > 0 && (
                  <span className="font-mono text-[10px] bg-white/20 px-1.5 rounded-xs">
                    {availableTablesCount}
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
                  className="bg-white border border-[#141824]/30 hover:border-[#141824] text-[#141824] py-2 px-2 rounded-sm font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <BellRing size={13} className="text-[#D92D20]" />
                  <span>{isFa ? "سالن‌دار" : "Server"}</span>
                </button>
              )}

              {tableNumber && venueData?.callChefEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setChefModal(true);
                  }}
                  className="bg-white border border-[#141824]/30 hover:border-[#141824] text-[#141824] py-2 px-2 rounded-sm font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <ChefHat size={13} className="text-[#1D4ED8]" />
                  <span>{isFa ? "آشپزخانه" : "Kitchen"}</span>
                </button>
              )}
            </div>
          </header>

          <PerforatedDivider />

          {/* ========================================================
              جستجوی تایپی + فهرست شماره‌گذاری‌شده بخش‌ها
             ======================================================== */}
          <div className="space-y-3 mb-5">
            <div className="relative">
              <Search
                size={14}
                className={`absolute top-1/2 -translate-y-1/2 text-[#141824]/45 ${
                  isFa ? "right-3" : "left-3"
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? "فیلتر سریع آیتم‌های فیش..."
                    : "Filter order pad items..."
                }
                className={`w-full bg-white/80 border border-[#141824]/20 focus:border-[#141824] rounded-sm py-2 text-xs font-bold text-[#141824] placeholder:text-[#141824]/40 outline-none ${
                  isFa ? "pr-8 pl-8" : "pl-8 pr-8"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#141824]/50 ${
                    isFa ? "left-2.5" : "right-2.5"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {safeCategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("all");
                    setSearchQuery("");
                  }}
                  className={`px-2.5 py-1.5 rounded-xs text-[11px] font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1 ${
                    selectedCategoryId === "all" && !searchQuery
                      ? "bg-[#141824] text-[#F8F7F2] border-[#141824]"
                      : "bg-transparent text-[#141824]/70 border-[#141824]/20 hover:border-[#141824]"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">00</span>
                  <span>{isFa ? "همه فیش" : "ALL"}</span>
                </button>

                {safeCategories.map((cat: any, idx: number) => {
                  const isSelected =
                    selectedCategoryId === cat.id && !searchQuery.trim();
                  const code = String(idx + 1).padStart(2, "0");
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSearchQuery("");
                      }}
                      className={`px-2.5 py-1.5 rounded-xs text-[11px] font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#141824] text-[#F8F7F2] border-[#141824]"
                          : "bg-transparent text-[#141824]/70 border-[#141824]/20 hover:border-[#141824]"
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-65">
                        {code}
                      </span>
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

          {/* سرستون جدول دفترچه سفارش */}
          <div className="flex items-center justify-between text-[10px] font-mono font-black text-[#141824]/50 border-y border-[#141824]/20 py-1.5 px-1 mb-4">
            <span>
              {isFa
                ? "[✓] شرح آیتم (برای عکس لمس کنید)"
                : "[✓] ITEM / TAP FOR PHOTO"}
            </span>
            <span>{isFa ? "مبلغ (تومان)" : "PRICE"}</span>
          </div>

          {/* ========================================================
              لیست چک‌لیستی سطرهای سفارش با آکاردئون درون‌خطی
             ======================================================== */}
          <main className="space-y-6">
            {filteredMenu.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#141824]/20 rounded-sm">
                <p className="text-xs font-bold text-[#141824]/55">
                  {isFa
                    ? "موردی در فیش یافت نشد."
                    : "No items found on the pad."}
                </p>
              </div>
            ) : (
              filteredMenu.map((cat: any, catIdx: number) => {
                const hasProducts =
                  Array.isArray(cat.products) && cat.products.length > 0;
                const sectionCode = String(catIdx + 1).padStart(2, "0");
                const catTitle = isFa
                  ? cat.nameFa || cat.name
                  : cat.nameEn || cat.nameFa || cat.name;

                return (
                  <section key={cat.id}>
                    {/* هدر دوخطه بخش داخل دفترچه */}
                    <div className="flex items-center justify-between border-b-2 border-[#141824] pb-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-[#141824] text-[#F8F7F2] px-1.5 py-0.5 rounded-xs">
                          {sectionCode}
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-[#141824] tracking-tight">
                          {catTitle}
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#141824]/50">
                        ({(cat.products?.length || 0).toLocaleString("fa-IR")})
                      </span>
                    </div>

                    {!hasProducts ? (
                      <p className="text-xs font-bold text-[#141824]/45 py-4 text-center">
                        {isFa ? "آیتمی ثبت نشده است." : "No items."}
                      </p>
                    ) : (
                      <div className="divide-y divide-dashed divide-[#141824]/15">
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
                          const isExpanded = expandedProductId === prod?.id;
                          const canOrder =
                            Boolean(venueData?.orderingEnabled) &&
                            Boolean(tableNumber) &&
                            isAvailable;

                          return (
                            <div
                              key={prod?.id}
                              className={`transition-colors ${
                                cartItem
                                  ? "bg-[#FEF3C7]/55"
                                  : isExpanded
                                    ? "bg-white/80"
                                    : ""
                              } ${!isAvailable ? "opacity-45" : ""}`}
                            >
                              {/* سطر اصلی چک‌لیست فیش */}
                              <div className="flex items-center gap-2.5 py-3 px-1.5">
                                {/* چک‌باکس تیک‌خور خودکاری یا نشانگر */}
                                <button
                                  type="button"
                                  disabled={!canOrder}
                                  aria-label={
                                    isFa ? "انتخاب آیتم" : "Select item"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canOrder) return;
                                    if (!cartItem) {
                                      handleAddWithDraftNote(prod);
                                    } else {
                                      setExpandedProductId(
                                        isExpanded ? null : prod.id,
                                      );
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-xs border-2 flex items-center justify-center shrink-0 transition-all ${
                                    cartItem
                                      ? "border-[#D92D20] bg-[#D92D20] text-white shadow-2xs"
                                      : canOrder
                                        ? "border-[#141824]/50 bg-white hover:border-[#D92D20] active:scale-90"
                                        : "border-[#141824]/20 bg-transparent cursor-default"
                                  }`}
                                >
                                  {cartItem ? (
                                    <span className="font-mono text-[11px] font-black leading-none">
                                      {cartItem.quantity.toLocaleString(
                                        "fa-IR",
                                      )}
                                    </span>
                                  ) : canOrder ? (
                                    <Plus
                                      size={12}
                                      className="text-[#141824]/45"
                                      strokeWidth={3}
                                    />
                                  ) : (
                                    <span className="w-1.5 h-1.5 bg-[#141824]/30 rounded-full" />
                                  )}
                                </button>

                                {/* عنوان + خط نقطه‌چین + قیمت هم‌تراز (با کلیک آکاردئون باز می‌شود) */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedProductId(
                                      isExpanded ? null : prod.id,
                                    )
                                  }
                                  className="flex-1 min-w-0 flex items-baseline gap-2 text-right"
                                >
                                  <div className="min-w-0 max-w-[66%] sm:max-w-[70%]">
                                    <span
                                      className={`font-black text-[13px] sm:text-sm leading-snug block truncate ${
                                        !isAvailable
                                          ? "line-through text-[#141824]/50"
                                          : "text-[#141824]"
                                      }`}
                                    >
                                      {isFa
                                        ? prod?.nameFa
                                        : prod?.nameEn || prod?.nameFa}
                                    </span>
                                  </div>

                                  {/* خط نقطه‌چین رابط بین نام غذا و قیمت */}
                                  <span className="flex-1 border-b border-dotted border-[#141824]/30 mb-1 min-w-[14px]" />

                                  {/* قیمت هم‌تراز */}
                                  <span className="font-mono font-black text-[13px] sm:text-sm text-[#141824] tabular-nums whitespace-nowrap shrink-0">
                                    {Number(prod?.price || 0).toLocaleString(
                                      "fa-IR",
                                    )}
                                  </span>

                                  <ChevronDown
                                    size={14}
                                    className={`text-[#141824]/45 shrink-0 self-center transition-transform duration-200 ${
                                      isExpanded
                                        ? "rotate-180 text-[#D92D20]"
                                        : ""
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* نوار جمع‌وجور وضعیت کم‌موجود یا کنترل سریع در حالت انتخاب‌شده بدون نیاز به باز کردن آکاردئون */}
                              {(cartItem ||
                                (!isAvailable && !isExpanded) ||
                                (isAvailable &&
                                  hasFiniteStock &&
                                  Number(prod.stock) <= 5 &&
                                  !isExpanded)) && (
                                <div className="flex items-center justify-between gap-2 pb-2.5 px-1.5 pr-9 sm:pr-9">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {!isAvailable && (
                                      <span className="text-[10px] font-black text-[#D92D20] border border-[#D92D20]/40 px-1.5 py-0.2 rounded-xs">
                                        {isFa ? "اتمام موجودی" : "SOLD OUT"}
                                      </span>
                                    )}
                                    {isAvailable &&
                                      hasFiniteStock &&
                                      Number(prod.stock) <= 5 && (
                                        <span className="text-[10px] font-black text-[#D92D20] bg-[#D92D20]/10 px-1.5 py-0.2 rounded-xs">
                                          {isFa
                                            ? `باقی‌مانده: ${prod.stock}`
                                            : `${prod.stock} left`}
                                        </span>
                                      )}
                                    {cartItem?.notes && (
                                      <span className="text-[10px] font-bold text-[#1D4ED8] truncate max-w-[140px]">
                                        ✎ {cartItem.notes}
                                      </span>
                                    )}
                                  </div>

                                  {cartItem && canOrder && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => removeFromCart(prod.id)}
                                        className="w-6 h-6 rounded-xs bg-white border border-[#141824]/30 text-[#141824] flex items-center justify-center active:scale-90"
                                      >
                                        <Minus size={12} strokeWidth={2.8} />
                                      </button>
                                      <span className="font-mono text-xs font-black text-[#D92D20] min-w-[20px] text-center">
                                        ×
                                        {cartItem.quantity.toLocaleString(
                                          "fa-IR",
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={Boolean(reachedMaxStock)}
                                        onClick={() =>
                                          handleAddWithDraftNote(prod)
                                        }
                                        className="w-6 h-6 rounded-xs bg-[#141824] disabled:opacity-30 text-white flex items-center justify-center active:scale-90"
                                      >
                                        <Plus size={12} strokeWidth={2.8} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* کشوی آکاردئون درون‌خطی (نمایش عکس، توضیحات و یادداشت روی خود فیش) */}
                              {isExpanded && (
                                <div className="px-2 pb-3.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="bg-white border border-[#141824]/20 rounded-sm p-3 space-y-3 shadow-2xs">
                                    <div className="flex gap-3 items-start">
                                      <div className="w-20 h-20 rounded-xs bg-[#EFEDE6] border border-[#141824]/15 overflow-hidden shrink-0 flex items-center justify-center">
                                        {prod?.imageUrl ? (
                                          <img
                                            src={getFullImageUrl(prod.imageUrl)}
                                            alt={
                                              isFa ? prod.nameFa : prod.nameEn
                                            }
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <UtensilsCrossed
                                            size={22}
                                            className="text-[#141824]/25"
                                          />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[#141824]/75 leading-relaxed">
                                          {(isFa
                                            ? prod?.descriptionFa
                                            : prod?.descriptionEn ||
                                              prod?.descriptionFa) ||
                                            (isFa
                                              ? "تهیه‌شده با مواد اولیه تازه روز."
                                              : "Prepared fresh to order.")}
                                        </p>

                                        <div className="mt-2 flex items-center gap-2 font-mono text-[11px] font-black text-[#141824]">
                                          <span>
                                            {Number(
                                              prod?.price || 0,
                                            ).toLocaleString("fa-IR")}{" "}
                                            {isFa ? "تومان" : "IRT"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {canOrder && (
                                      <div className="space-y-2.5 pt-2 border-t border-dashed border-[#141824]/15">
                                        {updateItemNotes && (
                                          <div className="relative">
                                            <PenLine
                                              size={13}
                                              className={`absolute top-1/2 -translate-y-1/2 text-[#1D4ED8] ${
                                                isFa ? "right-2.5" : "left-2.5"
                                              }`}
                                            />
                                            <input
                                              type="text"
                                              value={
                                                cartItem
                                                  ? cartItem.notes || ""
                                                  : draftNotes[prod.id] || ""
                                              }
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setDraftNotes((prev) => ({
                                                  ...prev,
                                                  [prod.id]: val,
                                                }));
                                                if (cartItem) {
                                                  updateItemNotes(prod.id, val);
                                                }
                                              }}
                                              placeholder={
                                                isFa
                                                  ? "یادداشت خودکاری روی فیش (مثلاً: بدون پیاز)..."
                                                  : "Write a kitchen note..."
                                              }
                                              className={`w-full bg-[#F8F7F2] border border-[#141824]/20 focus:border-[#1D4ED8] rounded-xs py-2 text-[11px] font-bold text-[#1D4ED8] placeholder:text-[#141824]/40 outline-none ${
                                                isFa
                                                  ? "pr-8 pl-2.5"
                                                  : "pl-8 pr-2.5"
                                              }`}
                                            />
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between gap-2">
                                          {cartItem ? (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeFromCart(prod.id)
                                                }
                                                className="w-8 h-8 rounded-xs bg-[#F8F7F2] border border-[#141824]/30 text-[#141824] flex items-center justify-center"
                                              >
                                                <Minus size={14} />
                                              </button>
                                              <span className="font-mono font-black text-sm min-w-[24px] text-center text-[#D92D20]">
                                                {cartItem.quantity.toLocaleString(
                                                  "fa-IR",
                                                )}
                                              </span>
                                              <button
                                                type="button"
                                                disabled={Boolean(
                                                  reachedMaxStock,
                                                )}
                                                onClick={() =>
                                                  handleAddWithDraftNote(prod)
                                                }
                                                className="w-8 h-8 rounded-xs bg-[#141824] disabled:opacity-30 text-white flex items-center justify-center"
                                              >
                                                <Plus size={14} />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAddWithDraftNote(prod)
                                              }
                                              className="flex-1 bg-[#D92D20] hover:bg-[#B42318] text-white py-2 px-4 rounded-xs font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                                            >
                                              <Check
                                                size={14}
                                                strokeWidth={3}
                                              />
                                              <span>
                                                {isFa
                                                  ? "تیک زدن روی فیش"
                                                  : "Check on Slip"}
                                              </span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedProductId(null)
                                            }
                                            className="px-3 py-2 text-[11px] font-black text-[#141824]/60 hover:text-[#141824]"
                                          >
                                            {isFa ? "بستن" : "Hide"}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
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

          <PerforatedDivider />

          {/* جمع‌بندی چاپی و بارکد پایین برگه فیش */}
          <footer className="pt-2 text-center space-y-4">
            <div className="flex items-center justify-between font-mono text-xs font-black text-[#141824] border-y-2 border-[#141824] py-2 px-1">
              <span>{isFa ? "جمع کل فعلی فیش" : "CURRENT SUBTOTAL"}</span>
              <span className="tabular-nums text-[#D92D20]">
                {totalPrice.toLocaleString("fa-IR")} {isFa ? "تومان" : "IRT"}
              </span>
            </div>

            <ReceiptBarcode
              code={`${safeSlug.toUpperCase()}-${tableNumber || "00"}`}
            />

            <p className="text-[11px] font-bold text-[#141824]/55">
              {isFa
                ? "از حضور شما سپاسگزاریم • نوش جان"
                : "THANK YOU FOR DINING WITH US"}
            </p>

            <a
              href="https://toranjmenu.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#141824]/50 hover:text-[#D92D20] transition-colors"
            >
              <Sparkles size={11} className="text-[#D92D20]" />
              <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
            </a>
          </footer>
        </div>

        {/* لبه دندانه‌دار پایین فیش */}
        <SerratedEdge position="bottom" idPrefix="main-pad" />
      </div>

      {/* ========================================================
          ته­‌برگ شناور امضا و ارسال فیش (Floating Tear-Off Stub)
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 inset-x-3 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <div className="w-full max-w-[520px] drop-shadow-[0_14px_30px_rgba(20,24,36,0.35)]">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#141824] hover:bg-[#1E2436] text-[#F8F7F2] p-3 px-4 rounded-sm border-2 border-[#F8F7F2]/20 flex items-center justify-between gap-3 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2 py-1 bg-[#D92D20] text-white font-mono text-xs font-black rounded-xs shrink-0">
                  {totalItems.toLocaleString("fa-IR")} {isFa ? "قلم" : "QTY"}
                </span>
                <div className="text-right min-w-0">
                  <span className="block text-xs sm:text-sm font-black truncate">
                    {isFa ? "بررسی و ارسال فیش" : "Sign & Send Check"}
                  </span>
                  <span className="block font-mono text-[10px] text-[#F8F7F2]/65 tabular-nums">
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </div>
              </div>

              <span className="border-2 border-[#FEF08A] text-[#FEF08A] px-3 py-1 rounded-xs text-[11px] font-black -rotate-2 shrink-0">
                {isFa ? "ارسال نهایی" : "STAMP & SEND"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۱: برگه تایید و امضای فیش سفارش (Final Check Slip)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-[#141824]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
          >
            <SerratedEdge position="top" idPrefix="cart-slip" />
            <div className="bg-[#F8F7F2] px-5 pt-3 pb-6 flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#141824] mb-4 shrink-0">
                <div>
                  <h3 className="text-base font-black text-[#141824]">
                    {isFa ? "تایید نهایی فیش سفارش" : "FINAL GUEST CHECK"}
                  </h3>
                  {tableNumber && (
                    <span className="font-mono text-[11px] font-bold text-[#D92D20]">
                      {isFa
                        ? `میز شماره ${tableNumber}`
                        : `TABLE #${tableNumber}`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-xs border border-[#141824]/25 bg-white text-[#141824] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-dashed divide-[#141824]/20 mb-4 no-scrollbar">
                {cart.map((item) => {
                  const pid = item.product.id;
                  const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                  return (
                    <div key={pid} className="py-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-[#141824] truncate">
                            {isFa
                              ? item.product?.nameFa
                              : item.product?.nameEn || item.product?.nameFa}
                          </h4>
                          <span className="font-mono text-xs font-bold text-[#D92D20] tabular-nums">
                            {(
                              (item.product?.price || 0) * item.quantity
                            ).toLocaleString("fa-IR")}{" "}
                            {isFa ? "تومان" : "IRT"}
                          </span>
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
                                  ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                                  : "bg-white text-[#141824]/60 border-[#141824]/25"
                              }`}
                            >
                              <MessageSquarePlus size={13} />
                            </button>
                          )}

                          <div className="flex items-center gap-1.5 bg-white border border-[#141824]/25 rounded-xs p-0.5">
                            <button
                              type="button"
                              onClick={() => removeFromCart(pid)}
                              className="w-6 h-6 bg-[#F8F7F2] text-[#141824] flex items-center justify-center"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="font-mono text-xs font-black min-w-[16px] text-center">
                              {item.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item.product)}
                              className="w-6 h-6 bg-[#141824] text-white flex items-center justify-center"
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
                            isFa ? "یادداشت آشپزخانه..." : "Kitchen note..."
                          }
                          className="w-full bg-white border border-[#141824]/25 focus:border-[#1D4ED8] rounded-xs px-3 py-2 text-xs font-bold text-[#1D4ED8] outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* خط امضا / نام مهمان */}
              <div className="border-t-2 border-[#141824] pt-3 mb-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between font-mono text-sm font-black">
                  <span>{isFa ? "مبلغ قابل پرداخت:" : "TOTAL DUE:"}</span>
                  <span className="text-[#D92D20] tabular-nums">
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-b-2 border-dotted border-[#141824]/40 pb-1">
                  <PenLine size={14} className="text-[#1D4ED8] shrink-0" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={
                      isFa
                        ? "نام یا امضای مهمان (اختیاری)..."
                        : "Guest name / signature (optional)..."
                    }
                    className="w-full bg-transparent text-xs font-bold text-[#1D4ED8] placeholder:text-[#141824]/40 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleOrder}
                className="w-full bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-45 text-white py-3.5 rounded-sm font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Receipt size={17} />
                    <span>
                      {isFa
                        ? "تایید و ارسال فیش به آشپزخانه"
                        : "CONFIRM & SEND TICKET"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۲: قبض رزرو آنلاین میز
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-[#141824]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 duration-300"
          >
            <SerratedEdge position="top" idPrefix="res-slip" />
            <div className="bg-[#F8F7F2] px-5 pt-3 pb-6 flex flex-col max-h-[86vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#141824] mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#141824]">
                      {isFa ? "قبض رزرو میز" : "TABLE RESERVATION SLIP"}
                    </h3>
                    <span className="font-mono text-[10px] font-black bg-[#15803D] text-white px-1.5 py-0.5 rounded-xs">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#141824]/55">
                    {safeVenueName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReserveModal(false)}
                  className="w-8 h-8 rounded-xs border border-[#141824]/25 bg-white text-[#141824] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {confirmedReservation ? (
                <div className="py-3 text-center space-y-4">
                  <div className="inline-block border-2 border-[#15803D] text-[#15803D] px-4 py-1.5 rounded-xs -rotate-2 font-black text-sm">
                    {isFa ? "✓ رزرو تایید و ثبت شد" : "✓ RESERVED"}
                  </div>

                  <div className="bg-white border border-[#141824]/20 p-4 space-y-2 text-xs font-bold text-right font-mono">
                    <div className="flex justify-between py-1 border-b border-dashed border-[#141824]/20">
                      <span className="text-[#141824]/55">
                        {isFa ? "میز:" : "TABLE:"}
                      </span>
                      <span className="font-black text-[#D92D20]">
                        #{confirmedReservation.tableNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-[#141824]/20">
                      <span className="text-[#141824]/55">
                        {isFa ? "نام:" : "GUEST:"}
                      </span>
                      <span className="font-sans font-black">
                        {confirmedReservation.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-[#141824]/20">
                      <span className="text-[#141824]/55">
                        {isFa ? "تماس:" : "TEL:"}
                      </span>
                      <span dir="ltr">
                        {confirmedReservation.customerMobile}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#141824]/55">
                        {isFa ? "نفرات:" : "PARTY:"}
                      </span>
                      <span className="font-sans font-black">
                        {confirmedReservation.guestsCount.toLocaleString(
                          "fa-IR",
                        )}{" "}
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
                    className="w-full bg-[#141824] text-[#F8F7F2] py-3.5 rounded-sm font-black text-sm"
                  >
                    {isFa ? "بازگشت به فیش منو" : "BACK TO MENU"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                    <div className="flex items-center justify-between bg-white border border-[#141824]/15 px-3 py-2 rounded-xs text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#15803D]">
                        <span className="w-2 h-2 bg-[#15803D]" />
                        {isFa ? "آزاد" : "Free"}
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <span className="w-2 h-2 bg-amber-500" />
                        {isFa ? "رزرو" : "Reserved"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[#D92D20]">
                        <span className="w-2 h-2 bg-[#D92D20]" />
                        {isFa ? "اشغال" : "Busy"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-[#141824]">
                          {isFa ? "۱. تیک زدن میز آزاد:" : "1. Pick table:"}
                        </label>
                        {isLoadingTables && (
                          <Loader2
                            size={14}
                            className="animate-spin text-[#D92D20]"
                          />
                        )}
                      </div>

                      {tablesList.length === 0 ? (
                        <div className="bg-white border border-[#141824]/15 p-4 text-center text-xs font-bold text-[#141824]/55">
                          {isFa
                            ? "میزی برای رزرو تعریف نشده است."
                            : "No tables available."}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
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
                                className={`py-2.5 rounded-xs border-2 transition-all flex flex-col items-center justify-center font-mono ${
                                  isSelected
                                    ? "border-[#D92D20] bg-[#D92D20] text-white"
                                    : isFree
                                      ? "border-[#141824]/25 bg-white text-[#141824] hover:border-[#141824]"
                                      : "border-dashed border-[#141824]/15 bg-[#EAE8E0] text-[#141824]/40 cursor-not-allowed"
                                }`}
                              >
                                <span className="text-xs font-black">
                                  #{String(t.tableNumber).padStart(2, "0")}
                                </span>
                                <span className="font-sans text-[9px] font-bold mt-0.5">
                                  {isSelected
                                    ? isFa
                                      ? "✓ انتخاب"
                                      : "✓ PICKED"
                                    : isFree
                                      ? isFa
                                        ? "آزاد"
                                        : "Free"
                                      : t.state === "reserved"
                                        ? isFa
                                          ? "رزرو"
                                          : "Res"
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

                    <div className="bg-white border border-[#141824]/15 p-3 space-y-3 rounded-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5">
                          <Users size={14} className="text-[#D92D20]" />
                          {isFa ? "تعداد نفرات:" : "Guests:"}
                        </span>
                        <div className="flex items-center gap-2 bg-[#F8F7F2] border border-[#141824]/20 p-0.5 rounded-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setReserveGuests((g) => Math.max(1, g - 1))
                            }
                            className="w-7 h-7 bg-white text-[#141824] flex items-center justify-center"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="font-mono text-xs font-black min-w-[34px] text-center">
                            {reserveGuests.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReserveGuests((g) => Math.min(30, g + 1))
                            }
                            className="w-7 h-7 bg-[#141824] text-white flex items-center justify-center"
                          >
                            <Plus size={13} />
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
                            className={`px-2.5 py-1 rounded-xs text-[11px] font-bold border ${
                              reserveTime === slot
                                ? "bg-[#141824] text-white border-[#141824]"
                                : "bg-[#F8F7F2] text-[#141824]/70 border-[#141824]/20"
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
                          className={`absolute top-1/2 -translate-y-1/2 text-[#141824]/45 ${
                            isFa ? "right-3" : "left-3"
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
                          className={`w-full bg-white border border-[#141824]/25 focus:border-[#141824] rounded-xs py-2.5 text-xs font-bold outline-none ${
                            isFa ? "pr-9 pl-3" : "pl-9 pr-3"
                          }`}
                        />
                      </div>

                      <div className="relative">
                        <Phone
                          size={14}
                          className={`absolute top-1/2 -translate-y-1/2 text-[#141824]/45 ${
                            isFa ? "right-3" : "left-3"
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
                          className="w-full bg-white border border-[#141824]/25 focus:border-[#141824] rounded-xs py-2.5 px-9 text-left font-mono text-xs font-bold outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        value={reserveNotes}
                        onChange={(e) => setReserveNotes(e.target.value)}
                        placeholder={
                          isFa ? "توضیحات (اختیاری)..." : "Note (optional)..."
                        }
                        className="w-full bg-white border border-[#141824]/25 focus:border-[#141824] rounded-xs py-2.5 px-3 text-xs font-bold outline-none"
                      />
                    </div>

                    {reserveError && (
                      <div className="flex items-center gap-2 bg-[#D92D20]/10 text-[#D92D20] border border-[#D92D20]/30 rounded-xs p-2.5 text-xs font-black">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{reserveError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isReserving || availableTablesCount === 0}
                    onClick={handleCustomerReserve}
                    className="w-full bg-[#141824] hover:bg-[#D92D20] disabled:opacity-40 text-white py-3.5 rounded-sm font-black text-sm flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    {isReserving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CalendarCheck size={16} />
                        <span>
                          {selectedReserveTable
                            ? isFa
                              ? `صدور قبض رزرو میز #${selectedReserveTable}`
                              : `RESERVE TABLE #${selectedReserveTable}`
                            : isFa
                              ? "ثبت نهایی رزرو"
                              : "CONFIRM RESERVATION"}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳ و ۴: یادداشت کاربنی سالن‌دار و آشپزخانه
         ======================================================== */}
      {(waiterModal || chefModal) && (
        <div
          onClick={() => {
            if (isProcessing) return;
            setWaiterModal(false);
            setChefModal(false);
          }}
          className="fixed inset-0 z-50 bg-[#141824]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-300"
          >
            <SerratedEdge position="top" idPrefix="note-slip" />
            <div className="bg-[#F8F7F2] px-5 pt-3 pb-6">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#141824] mb-4">
                <div>
                  <h3 className="font-black text-base text-[#141824]">
                    {waiterModal
                      ? isFa
                        ? "برگه احضار سالن‌دار"
                        : "SERVER REQUEST SLIP"
                      : isFa
                        ? "یادداشت مستقیم آشپزخانه"
                        : "KITCHEN NOTE SLIP"}
                  </h3>
                  <span className="font-mono text-[11px] font-bold text-[#D92D20]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `TABLE #${tableNumber}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWaiterModal(false);
                    setChefModal(false);
                  }}
                  className="w-8 h-8 rounded-xs border border-[#141824]/25 bg-white text-[#141824] flex items-center justify-center"
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
                        ? "bg-[#141824] text-white border-[#141824]"
                        : "bg-white text-[#141824] border-[#141824]/25"
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
                    ? "متن یادداشت خود را بنویسید..."
                    : "Write your note here..."
                }
                className="w-full bg-white border border-[#141824]/25 focus:border-[#1D4ED8] rounded-xs p-3 text-xs font-bold text-[#1D4ED8] placeholder:text-[#141824]/40 outline-none resize-none mb-4"
              />

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
                className={`w-full py-3.5 rounded-sm font-black text-sm text-white flex items-center justify-center gap-2 ${
                  waiterModal
                    ? "bg-[#141824] hover:bg-[#D92D20]"
                    : "bg-[#1D4ED8] hover:bg-[#1E40AF]"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={15} />
                    <span>{isFa ? "ارسال برگه" : "SEND SLIP"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۵: اطلاعات مجموعه
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-[#141824]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-300"
          >
            <SerratedEdge position="top" idPrefix="info-slip" />
            <div className="bg-[#F8F7F2] px-5 pt-3 pb-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#141824]">
                <h3 className="font-black text-base text-[#141824]">
                  {safeVenueName}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(false)}
                  className="w-8 h-8 rounded-xs border border-[#141824]/25 bg-white text-[#141824] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-[#141824]/75 leading-relaxed">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}

              {(safeAddress || safePhone) && (
                <div className="bg-white border border-[#141824]/20 p-3.5 space-y-2 text-xs font-bold">
                  {safeAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={14}
                        className="text-[#D92D20] shrink-0 mt-0.5"
                      />
                      <span>{safeAddress}</span>
                    </div>
                  )}
                  {safePhone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone size={14} className="text-[#D92D20] shrink-0" />
                      <span dir="ltr">{safePhone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۶: قبض پیگیری زنده سفارش
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-[#141824]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300"
          >
            <SerratedEdge position="top" idPrefix="track-slip" />
            <div className="bg-[#F8F7F2] px-5 pt-3 pb-6 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#141824] mb-4 shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshOrder}
                  disabled={isRefreshingOrder}
                  className="bg-white border border-[#141824]/25 px-3 py-1.5 rounded-xs text-xs font-black flex items-center gap-1.5"
                >
                  <RefreshCw
                    size={13}
                    className={isRefreshingOrder ? "animate-spin" : ""}
                  />
                  <span>{isFa ? "بروزرسانی" : "REFRESH"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(false)}
                  className="w-8 h-8 rounded-xs border border-[#141824]/25 bg-white text-[#141824] flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-center mb-4 shrink-0">
                <span className="inline-block font-mono text-xs font-black border-2 border-[#D92D20] text-[#D92D20] px-3 py-0.5 rounded-xs -rotate-1 mb-2">
                  {isFa
                    ? `شماره فیش: #${activeOrder.orderNumber}`
                    : `TICKET #${activeOrder.orderNumber}`}
                </span>
                <h2 className="text-lg font-black text-[#141824]">
                  {String(activeOrder.status).toLowerCase() === "completed"
                    ? isFa
                      ? "سفارش شما تحویل داده شد"
                      : "ORDER COMPLETED"
                    : isFa
                      ? "وضعیت لحظه‌ای فیش در آشپزخانه"
                      : "LIVE KITCHEN TICKET"}
                </h2>
              </div>

              <div className="bg-white border border-[#141824]/20 p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                        className={`w-7 h-7 rounded-xs border-2 flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? "bg-[#15803D] border-[#15803D] text-white"
                            : isActive
                              ? "bg-[#D92D20] border-[#D92D20] text-white"
                              : "bg-[#F8F7F2] border-[#141824]/25 text-[#141824]/45"
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
                        <span className="block font-black text-xs sm:text-sm text-[#141824]">
                          {stage.name}
                        </span>
                        {stage.description && (
                          <span className="block text-[11px] font-medium text-[#141824]/60 mt-0.5">
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
                className="w-full bg-[#141824] text-[#F8F7F2] py-3.5 rounded-sm font-black text-sm shrink-0"
              >
                {isFa ? "بازگشت به فیش منو" : "BACK TO ORDER PAD"}
              </button>
            </div>
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

export default Template8;
