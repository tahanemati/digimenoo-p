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
  CakeSlice,
  Sparkles,
  Users,
  User,
  Phone,
  Check,
  AlertCircle,
  MapPin,
  Info,
  LayoutGrid,
  List,
  Gift,
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
    name: "ثبت در قنادی",
    description: "سفارش شما با موفقیت دریافت شد",
  },
  {
    id: "preparing",
    name: "آماده‌سازی و تزئین",
    description: "در حال آماده‌سازی تازه و چیدمان سفارش شما",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سفارش شما آماده است و هم‌اکنون تقدیم می‌شود",
  },
];

// حاشیه کنگره‌دار سایبان بوتیک قنادی در لبه بالای صفحه
const BoutiqueAwning = () => (
  <div className="w-full overflow-hidden pointer-events-none select-none">
    <div
      className="h-3 w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #7A1632 0px, #7A1632 22px, #FBEAE7 22px, #FBEAE7 44px)",
      }}
    />
    <svg
      viewBox="0 0 1200 22"
      preserveAspectRatio="none"
      className="w-full h-3.5 text-[#7A1632]/15 block"
    >
      <path
        d="M0,0 Q25,22 50,0 T100,0 T150,0 T200,0 T250,0 T300,0 T350,0 T400,0 T450,0 T500,0 T550,0 T600,0 T650,0 T700,0 T750,0 T800,0 T850,0 T900,0 T950,0 T1000,0 T1050,0 T1100,0 T1150,0 T1200,0 L1200,0 L0,0 Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

const Template7: React.FC<TemplateProps> = ({
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
  const [viewMode, setViewMode] = useState<"vitrine" | "list">("vitrine");
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
        isFa ? "میز شما با موفقیت رزرو شد!" : "Table reservation confirmed!",
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
        isFa ? "درخواست شما با مهر ارسال شد." : "Request sent successfully.",
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

  const safeVenueName = venueData?.name || venueData?.Name || "کافه‌قنادی";
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

  const timePresetsFa = ["۱۱:۰۰ (بِرانچ)", "۱۷:۰۰ (عصرانه)", "۱۹:۰۰", "۲۱:۰۰"];
  const timePresetsEn = [
    "11:00 (Brunch)",
    "17:00 (Tea Time)",
    "19:00",
    "21:00",
  ];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "بسته‌بندی برای بیرون‌بر",
    "چنگال و بشقاب اضافه",
    "شمع تولد / تزئین میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Box for takeaway",
    "Extra plates & forks",
    "Birthday candle / table help",
  ];

  const chefPresetsFa = [
    "بدون آجیل / حساسیت به مغزها",
    "بستنی کنار کیک جدا سرو شود",
    "کم‌شیرین و بدون سس اضافه",
    "نوشتن پیام کوتاه روی بشقاب",
  ];
  const chefPresetsEn = [
    "Nut allergy / no nuts",
    "Ice cream on the side",
    "Less sweet / no extra sauce",
    "Short plate message",
  ];

  return (
    <div
      className="min-h-screen bg-[#FFF9F7] text-[#3B1D26] font-sans antialiased selection:bg-[#7A1632]/15 overflow-x-hidden pb-36 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* هاله نرم پاستلی در پس‌زمینه */}
      <div className="fixed top-20 right-[-100px] w-80 h-80 bg-[#FBEAE7] rounded-full blur-[95px] pointer-events-none z-0 opacity-80" />
      <div className="fixed bottom-10 left-[-100px] w-72 h-72 bg-[#E3F0D3]/60 rounded-full blur-[95px] pointer-events-none z-0" />

      {/* سایبان کنگره‌دار قنادی در بالاترین نقطه */}
      <BoutiqueAwning />

      {/* اعلان شناور مخملی */}
      {toastMsg && (
        <div className="fixed top-5 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#7A1632] text-[#FFF9F7] px-5 py-2.5 rounded-full shadow-[0_14px_35px_rgba(122,22,50,0.3)] font-bold text-xs flex items-center gap-2 border border-[#FBEAE7]/30">
            <span className="w-5 h-5 rounded-full bg-[#DCECC9] flex items-center justify-center shrink-0">
              <Check size={12} className="text-[#3F6212]" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: نشان مرکزی بوتیک قنادی (بدون کارت باکسی تکراری)
         ======================================================== */}
      <header className="relative z-10 max-w-4xl mx-auto px-4 pt-3 pb-5">
        {/* نوار مینی ابزارک بالا */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {tableNumber ? (
              <span className="bg-[#E3F0D3] text-[#3F6212] border border-[#C6DFAA] px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C0F] animate-pulse" />
                {isFa ? `میز ${tableNumber}` : `Table #${tableNumber}`}
              </span>
            ) : (
              <span className="bg-[#FBEAE7] text-[#7A1632] px-3 py-1 rounded-full text-[10px] font-black tracking-wide">
                {isFa ? "ویترین تازه روز" : "FRESH PATISSERIE"}
              </span>
            )}

            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="bg-[#7A1632] text-[#FFF9F7] px-3 py-1 rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#DCECC9] animate-ping" />
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
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                isSearchOpen || searchQuery
                  ? "bg-[#7A1632] text-white border-[#7A1632]"
                  : "bg-white/90 text-[#7A1632] border-[#EED9D5]"
              }`}
            >
              {isSearchOpen ? <X size={14} /> : <Search size={14} />}
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-8 px-2.5 rounded-full bg-white/90 border border-[#EED9D5] text-[#7A1632] font-black text-[11px] flex items-center gap-1"
              >
                <Globe size={12} />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label="اطلاعات"
              className="w-8 h-8 rounded-full bg-white/90 border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
            >
              <Info size={14} />
            </button>
          </div>
        </div>

        {/* نشان مرکزی (Crest) با قاب دایره‌ای دوخطه */}
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <div className="p-1.5 rounded-full border border-dashed border-[#C98A97] bg-white shadow-[0_10px_30px_rgba(122,22,50,0.08)] mb-3">
            <div className="w-20 h-20 rounded-full bg-[#FBEAE7] overflow-hidden flex items-center justify-center border-2 border-[#FFF9F7]">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CakeSlice size={30} className="text-[#7A1632]" />
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#7A1632] tracking-tight">
            {safeVenueName}
          </h1>

          {(isFa ? safeAboutFa : safeAboutEn) && (
            <p className="text-xs font-medium text-[#8C6570] max-w-sm line-clamp-2 leading-relaxed mt-1.5">
              {isFa ? safeAboutFa : safeAboutEn}
            </p>
          )}

          {/* ریبون دکمه‌های سرویس میز */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={openReservationModal}
              className="bg-[#7A1632] hover:bg-[#5E1026] text-[#FFF9F7] px-4 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-[0_6px_18px_rgba(122,22,50,0.2)] active:scale-95 transition-all"
            >
              <CalendarCheck size={13} />
              <span>{isFa ? "رزرو میز" : "Reserve Table"}</span>
              {tablesList.length > 0 && (
                <span className="bg-[#DCECC9] text-[#3F6212] px-1.5 py-0.2 rounded-full text-[10px]">
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
                className="bg-white hover:bg-[#FBEAE7] border border-[#EED9D5] text-[#7A1632] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <BellRing size={13} />
                <span>{isFa ? "میزبان" : "Waiter"}</span>
              </button>
            )}

            {tableNumber && venueData?.callChefEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="bg-white hover:bg-[#FBEAE7] border border-[#EED9D5] text-[#7A1632] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ChefHat size={13} />
                <span>{isFa ? "قناد / باریستا" : "Pastry Chef"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: نوار چسبان با سوییچر ویترین/فهرست و تب‌های طاقدار
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#FFF9F7]/92 backdrop-blur-xl border-y border-[#F1E1DE] py-2.5">
        <div className="max-w-4xl mx-auto px-3.5 space-y-2.5">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <Search
                size={15}
                className={`absolute top-1/2 -translate-y-1/2 text-[#A87E89] ${
                  isFa ? "right-4" : "left-4"
                }`}
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? "جستجو در دسرها، کیک‌ها و نوشیدنی‌ها..."
                    : "Search cakes, tarts, pastries..."
                }
                className={`w-full bg-white border border-[#EBD4CF] focus:border-[#7A1632] rounded-full py-2.5 text-xs font-bold text-[#3B1D26] placeholder:text-[#B5929C] outline-none ${
                  isFa ? "pr-10 pl-9" : "pl-10 pr-9"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#A87E89] ${
                    isFa ? "left-3.5" : "right-3.5"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {/* تب‌های دسته‌بندی به شکل قوس‌های کوچک (Arch Tabs) */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSearchQuery("");
                }}
                className={`px-3.5 py-2 rounded-t-2xl rounded-b-lg text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "bg-[#7A1632] text-[#FFF9F7] border-[#7A1632] shadow-2xs"
                    : "bg-white text-[#7D5661] border-[#F0DFDC] hover:border-[#D9B6BE]"
                }`}
              >
                {isFa ? "همه ویترین" : "All"}
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
                    className={`px-3.5 py-2 rounded-t-2xl rounded-b-lg text-xs font-black whitespace-nowrap transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#7A1632] text-[#FFF9F7] border-[#7A1632] shadow-2xs"
                        : "bg-white text-[#7D5661] border-[#F0DFDC] hover:border-[#D9B6BE]"
                    }`}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DCECC9]" />
                    )}
                    <span>
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* سوییچر بین نمای ویترین طاقدار و نمای فهرست قنادی */}
            <div className="shrink-0 bg-[#FBEAE7] p-1 rounded-full border border-[#EED9D5] flex items-center gap-0.5">
              <button
                type="button"
                aria-label="نمای ویترین"
                onClick={() => setViewMode("vitrine")}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "vitrine"
                    ? "bg-[#7A1632] text-white shadow-2xs"
                    : "text-[#7A1632]/65"
                }`}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                aria-label="نمای فهرست"
                onClick={() => setViewMode("list")}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  viewMode === "list"
                    ? "bg-[#7A1632] text-white shadow-2xs"
                    : "text-[#7A1632]/65"
                }`}
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          بخش ۳: ویترین طاقدار ۲ ستونه یا فهرست دایره‌ای قنادی
         ======================================================== */}
      <main className="relative z-10 max-w-4xl mx-auto px-3.5 pt-6">
        {filteredMenu.length === 0 ? (
          <div className="bg-white border border-[#F0DFDC] rounded-[32px] py-16 text-center">
            <CakeSlice size={36} className="text-[#D9B6BE] mx-auto mb-3" />
            <p className="text-xs font-bold text-[#8C6570]">
              {isFa
                ? "موردی با این جستجو در ویترین یافت نشد."
                : "No pastries matched your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-9">
            {filteredMenu.map((cat: any) => {
              const hasProducts =
                Array.isArray(cat.products) && cat.products.length > 0;
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;

              return (
                <section key={cat.id}>
                  {/* سرستون ریبونی مرکزی دسته‌بندی */}
                  <div className="flex items-center justify-center gap-3 mb-5">
                    <span className="h-[1px] flex-1 max-w-[90px] bg-gradient-to-l from-[#DFC0C6] to-transparent" />
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#FBEAE7]/80 border border-[#EED9D5]">
                      <h2 className="text-sm sm:text-base font-black text-[#7A1632]">
                        {catTitle}
                      </h2>
                      <span className="w-5 h-5 rounded-full bg-white text-[#7A1632] text-[10px] font-black flex items-center justify-center">
                        {(cat.products?.length || 0).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <span className="h-[1px] flex-1 max-w-[90px] bg-gradient-to-r from-[#DFC0C6] to-transparent" />
                  </div>

                  {!hasProducts ? (
                    <div className="bg-white border border-[#F0DFDC] rounded-[28px] p-6 text-center text-xs font-bold text-[#8C6570]">
                      {isFa
                        ? "در این بخش هنوز محصولی چیده نشده است."
                        : "Nothing displayed here yet."}
                    </div>
                  ) : viewMode === "vitrine" ? (
                    /* ===== نمای ۱: ویترین طاقدار دو‌ستونه (Arch Cloche Cards) ===== */
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-5 sm:gap-5">
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
                          <article
                            key={prod?.id}
                            onClick={() => openProductShowcase(prod)}
                            className={`group cursor-pointer bg-white rounded-t-[110px] rounded-b-[26px] p-2.5 pb-3.5 border transition-all duration-300 flex flex-col items-center text-center ${
                              cartItem
                                ? "border-[#7A1632] shadow-[0_14px_30px_rgba(122,22,50,0.12)]"
                                : "border-[#F1DFDC] hover:border-[#D9A7B2] shadow-[0_6px_22px_rgba(122,22,50,0.04)]"
                            } ${!isAvailable ? "opacity-60" : ""}`}
                          >
                            {/* پنجره طاقدار شیشه‌ای محصول */}
                            <div className="relative w-full aspect-[1/1.05] rounded-t-[100px] rounded-b-[18px] bg-[#FBEAE7] overflow-hidden">
                              {prod?.imageUrl ? (
                                <img
                                  src={getFullImageUrl(prod.imageUrl)}
                                  alt={isFa ? prod.nameFa : prod.nameEn}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#FBEAE7] to-[#F4D9D4] text-[#C68E9B]">
                                  <CakeSlice size={32} strokeWidth={1.6} />
                                </div>
                              )}

                              {isAvailable &&
                                hasFiniteStock &&
                                Number(prod.stock) <= 5 && (
                                  <span className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#7A1632]/90 backdrop-blur-md text-[#FFF9F7] text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                    {isFa
                                      ? `${prod.stock} عدد مانده`
                                      : `${prod.stock} left`}
                                  </span>
                                )}

                              {!isAvailable && (
                                <div className="absolute inset-0 bg-[#3B1D26]/45 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="bg-white text-[#7A1632] text-[10px] font-black px-3 py-1 rounded-full">
                                    {isFa ? "تمام شد" : "Sold Out"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* دکمه دایره‌ای / کنترلر تعداد نشسته روی لبه پایینی طاق */}
                            {venueData?.orderingEnabled &&
                              tableNumber &&
                              isAvailable && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="-mt-4 relative z-10 mb-1.5"
                                >
                                  {cartItem ? (
                                    <div className="inline-flex items-center gap-1.5 bg-[#7A1632] text-white rounded-full p-0.5 shadow-[0_6px_16px_rgba(122,22,50,0.3)] border-2 border-white">
                                      <button
                                        type="button"
                                        disabled={Boolean(reachedMaxStock)}
                                        onClick={() => addToCart(prod)}
                                        className="w-6 h-6 rounded-full bg-[#DCECC9] text-[#3F6212] disabled:opacity-35 flex items-center justify-center active:scale-90 transition-transform"
                                      >
                                        <Plus size={12} strokeWidth={3} />
                                      </button>
                                      <span className="text-[11px] font-black min-w-[14px] text-center">
                                        {cartItem.quantity.toLocaleString(
                                          "fa-IR",
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeFromCart(prod.id)}
                                        className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center active:scale-90 transition-transform"
                                      >
                                        <Minus size={12} strokeWidth={3} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      aria-label={
                                        isFa ? "افزودن به جعبه" : "Add to box"
                                      }
                                      onClick={() => addToCart(prod)}
                                      className="w-8 h-8 rounded-full bg-[#7A1632] hover:bg-[#5E1026] text-white border-2 border-white shadow-[0_6px_16px_rgba(122,22,50,0.28)] flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                      <Plus size={15} strokeWidth={2.8} />
                                    </button>
                                  )}
                                </div>
                              )}

                            {/* عنوان و قیمت وسط‌چین زیر طاق */}
                            <div
                              className={`w-full px-1 flex-1 flex flex-col justify-between ${
                                !(
                                  venueData?.orderingEnabled &&
                                  tableNumber &&
                                  isAvailable
                                )
                                  ? "mt-2.5"
                                  : ""
                              }`}
                            >
                              <div>
                                <h3 className="font-black text-[12.5px] sm:text-[13.5px] text-[#3B1D26] leading-snug line-clamp-2">
                                  {isFa
                                    ? prod?.nameFa
                                    : prod?.nameEn || prod?.nameFa}
                                </h3>

                                {(isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn ||
                                    prod?.descriptionFa) && (
                                  <p className="text-[10px] font-medium text-[#9A747E] line-clamp-1 mt-0.5">
                                    {isFa
                                      ? prod?.descriptionFa
                                      : prod?.descriptionEn ||
                                        prod?.descriptionFa}
                                  </p>
                                )}
                              </div>

                              {/* کپسول قیمت پسته‌ای / رزگلد */}
                              <div className="mt-2.5 flex justify-center">
                                <span className="inline-flex items-baseline gap-1 px-3 py-1 rounded-full bg-[#FBF1EE] border border-[#F0DFDC] text-[#7A1632]">
                                  <span className="font-black text-xs sm:text-[13px]">
                                    {Number(prod?.price || 0).toLocaleString(
                                      "fa-IR",
                                    )}
                                  </span>
                                  <span className="text-[9px] font-bold text-[#9A747E]">
                                    {isFa ? "تومان" : "IRT"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    /* ===== نمای ۲: دفترچه تست قنادی (Tasting List با عکس دایره‌ای) ===== */
                    <div className="bg-white rounded-[30px] border border-[#F1DFDC] shadow-[0_6px_25px_rgba(122,22,50,0.03)] divide-y divide-dashed divide-[#F0DFDC] overflow-hidden">
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
                            className={`cursor-pointer p-3.5 sm:p-4 hover:bg-[#FFF9F7] transition-colors flex items-center gap-3.5 ${
                              !isAvailable ? "opacity-55" : ""
                            }`}
                          >
                            {/* مدالیون دایره‌ای عکس */}
                            <div className="w-16 h-16 rounded-full bg-[#FBEAE7] border-2 border-[#F0DFDC] shrink-0 overflow-hidden flex items-center justify-center">
                              {prod?.imageUrl ? (
                                <img
                                  src={getFullImageUrl(prod.imageUrl)}
                                  alt={isFa ? prod.nameFa : prod.nameEn}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CakeSlice
                                  size={22}
                                  className="text-[#C68E9B]"
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-sm text-[#3B1D26] truncate">
                                {isFa
                                  ? prod?.nameFa
                                  : prod?.nameEn || prod?.nameFa}
                              </h3>
                              {(isFa
                                ? prod?.descriptionFa
                                : prod?.descriptionEn ||
                                  prod?.descriptionFa) && (
                                <p className="text-[11px] font-medium text-[#9A747E] line-clamp-1 mt-0.5">
                                  {isFa
                                    ? prod?.descriptionFa
                                    : prod?.descriptionEn ||
                                      prod?.descriptionFa}
                                </p>
                              )}
                              <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="font-black text-xs text-[#7A1632]">
                                  {Number(prod?.price || 0).toLocaleString(
                                    "fa-IR",
                                  )}{" "}
                                  <span className="text-[10px] font-bold text-[#9A747E]">
                                    {isFa ? "تومان" : "IRT"}
                                  </span>
                                </span>

                                {venueData?.orderingEnabled &&
                                  tableNumber &&
                                  isAvailable && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      {cartItem ? (
                                        <div className="inline-flex items-center gap-1.5 bg-[#7A1632] text-white rounded-full p-0.5">
                                          <button
                                            type="button"
                                            disabled={Boolean(reachedMaxStock)}
                                            onClick={() => addToCart(prod)}
                                            className="w-6 h-6 rounded-full bg-[#DCECC9] text-[#3F6212] flex items-center justify-center"
                                          >
                                            <Plus size={12} strokeWidth={3} />
                                          </button>
                                          <span className="text-[11px] font-black min-w-[14px] text-center">
                                            {cartItem.quantity.toLocaleString(
                                              "fa-IR",
                                            )}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeFromCart(prod.id)
                                            }
                                            className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center"
                                          >
                                            <Minus size={12} strokeWidth={3} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => addToCart(prod)}
                                          className="bg-[#FBEAE7] hover:bg-[#7A1632] text-[#7A1632] hover:text-white px-3 py-1 rounded-full text-[11px] font-black transition-colors"
                                        >
                                          + {isFa ? "انتخاب" : "Add"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* فوتر ظریف ترنج */}
        <footer className="mt-12 pt-5 border-t border-dashed border-[#EBD4CF] text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9A747E] hover:text-[#7A1632] transition-colors"
          >
            <Sparkles size={12} className="text-[#7A1632]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۴: نوار «جعبه سفارش» با پیش‌نمایش دایره‌ای آیتم‌های انتخابی
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-3.5 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#7A1632] hover:bg-[#621127] text-[#FFF9F7] p-2.5 px-4 rounded-full font-black flex items-center justify-between gap-3 shadow-[0_18px_40px_rgba(122,22,50,0.34)] border-2 border-[#FBEAE7]/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* پیش‌نمایش دایره‌ای هم‌پوشان از آیتم‌های داخل جعبه */}
              <div className="flex items-center -space-x-2 space-x-reverse shrink-0">
                {cart.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.product?.id ?? idx}
                    className="w-8 h-8 rounded-full bg-[#FBEAE7] border-2 border-[#7A1632] overflow-hidden flex items-center justify-center"
                  >
                    {item.product?.imageUrl ? (
                      <img
                        src={getFullImageUrl(item.product.imageUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CakeSlice size={13} className="text-[#7A1632]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-right min-w-0">
                <span className="block text-xs font-black truncate">
                  {isFa ? "جعبه سفارش شما" : "Your Pastry Box"} (
                  {totalItems.toLocaleString("fa-IR")})
                </span>
                <span className="block text-[10px] font-bold text-[#DCECC9]">
                  {isFa ? "مشاهده و ثبت نهایی" : "Review & place order"}
                </span>
              </div>
            </div>

            <div className="bg-[#FFF9F7] text-[#7A1632] px-3.5 py-1.5 rounded-full text-xs font-black shrink-0">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-[9px] font-bold opacity-75">
                {isFa ? "تومان" : "IRT"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال اطلاعات مجموعه
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] rounded-t-[34px] sm:rounded-[34px] p-6 pb-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FBEAE7] border border-[#EED9D5] overflow-hidden flex items-center justify-center">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={20} className="text-[#7A1632]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#7A1632]">
                    {safeVenueName}
                  </h3>
                  <span className="text-[11px] font-bold text-[#9A747E]">
                    {isFa ? "درباره کافه‌قنادی" : "About Patisserie"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-[#7D5661] leading-relaxed mb-4">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {(safeAddress || safePhone) && (
              <div className="bg-white border border-[#F0DFDC] rounded-2xl p-4 space-y-2.5 text-xs font-bold text-[#3B1D26]">
                {safeAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={15}
                      className="text-[#7A1632] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-[#7A1632] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال جزئیات محصول (Arch Cloche Showcase)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] rounded-t-[36px] sm:rounded-[36px] p-5 pb-7 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* قاب طاقدار مرکزی داخل مودال */}
            <div className="w-48 h-52 mx-auto rounded-t-full rounded-b-[24px] bg-[#FBEAE7] border-4 border-white shadow-[0_14px_32px_rgba(122,22,50,0.12)] overflow-hidden flex items-center justify-center mb-4">
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
                <CakeSlice size={44} className="text-[#C68E9B]" />
              )}
            </div>

            <div className="text-center space-y-2 mb-5">
              <h3 className="text-xl font-black text-[#7A1632]">
                {isFa
                  ? selectedProductModal.nameFa
                  : selectedProductModal.nameEn || selectedProductModal.nameFa}
              </h3>

              <span className="inline-block bg-[#E3F0D3] text-[#3F6212] px-4 py-1 rounded-full text-sm font-black">
                {Number(selectedProductModal.price || 0).toLocaleString(
                  "fa-IR",
                )}{" "}
                <span className="text-[11px] font-bold">
                  {isFa ? "تومان" : "IRT"}
                </span>
              </span>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#7D5661] leading-relaxed pt-1 px-2">
                  {isFa
                    ? selectedProductModal.descriptionFa
                    : selectedProductModal.descriptionEn ||
                      selectedProductModal.descriptionFa}
                </p>
              )}
            </div>

            {venueData?.orderingEnabled && tableNumber ? (
              <div className="space-y-3">
                {updateItemNotes && (
                  <input
                    type="text"
                    value={modalNoteText}
                    onChange={(e) => {
                      setModalNoteText(e.target.value);
                      updateItemNotes(selectedProductModal.id, e.target.value);
                    }}
                    placeholder={
                      isFa
                        ? "توضیحات اختصاصی (مثلاً: با سس شکلات اضافه / شمع تولد)..."
                        : "Special note (e.g. extra sauce / candle)..."
                    }
                    className="w-full bg-white border border-[#EED9D5] focus:border-[#7A1632] rounded-full px-4 py-3 text-xs font-bold text-[#3B1D26] placeholder:text-[#B5929C] outline-none text-center"
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
                    (!hasFiniteStock || Number(selectedProductModal.stock) > 0);

                  if (!isAvail) {
                    return (
                      <div className="w-full py-3.5 rounded-full bg-rose-50 text-rose-700 font-black text-xs text-center">
                        {isFa ? "اتمام موجودی" : "Sold Out"}
                      </div>
                    );
                  }

                  if (cItem) {
                    return (
                      <div className="flex items-center justify-between bg-white border border-[#EED9D5] p-1.5 rounded-full">
                        <div className="flex items-center gap-3 px-2">
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(selectedProductModal.id)
                            }
                            className="w-9 h-9 rounded-full bg-[#FBEAE7] text-[#7A1632] flex items-center justify-center"
                          >
                            <Minus size={15} strokeWidth={2.5} />
                          </button>
                          <span className="font-black text-base text-[#7A1632] min-w-[20px] text-center">
                            {cItem.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(selectedProductModal)}
                            className="w-9 h-9 rounded-full bg-[#7A1632] text-white flex items-center justify-center"
                          >
                            <Plus size={15} strokeWidth={2.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProductModal(null)}
                          className="bg-[#E3F0D3] text-[#3F6212] px-6 py-2.5 rounded-full font-black text-xs"
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
                          isFa ? "به جعبه سفارش اضافه شد" : "Added to your box",
                        );
                      }}
                      className="w-full bg-[#7A1632] hover:bg-[#5E1026] text-[#FFF9F7] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7A1632]/25 active:scale-95 transition-all"
                    >
                      <Gift size={16} />
                      <span>
                        {isFa ? "افزودن به جعبه سفارش" : "Add to Pastry Box"}
                      </span>
                    </button>
                  );
                })()}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="w-full bg-[#7A1632] text-white py-3.5 rounded-full font-black text-xs"
              >
                {isFa ? "بستن" : "Close"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال رزرو آنلاین میزها
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] rounded-t-[34px] sm:rounded-[34px] p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#7A1632] text-[#FFF9F7] flex items-center justify-center">
                  <CalendarCheck size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#7A1632]">
                      {isFa ? "رزرو میز کافه‌قنادی" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E3F0D3] text-[#3F6212] text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C0F] animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#9A747E]">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E3F0D3] text-[#3F6212] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#7A1632]">
                    {isFa ? "میز شما رزرو شد!" : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-[#9A747E] mt-0.5">
                    {isFa
                      ? "با شیرینی و قهوه تازه منتظر شما هستیم"
                      : "We look forward to welcoming you"}
                  </p>
                </div>

                <div className="bg-white border border-[#F0DFDC] rounded-3xl p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1 border-b border-dashed border-[#F0DFDC]">
                    <span className="text-[#9A747E]">
                      {isFa ? "میز:" : "Table:"}
                    </span>
                    <span className="font-black text-[#7A1632]">
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#F0DFDC]">
                    <span className="text-[#9A747E]">
                      {isFa ? "نام مهمان:" : "Name:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#F0DFDC]">
                    <span className="text-[#9A747E]">
                      {isFa ? "تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#9A747E]">
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
                  className="w-full bg-[#7A1632] text-[#FFF9F7] py-3.5 rounded-full font-black text-sm"
                >
                  {isFa ? "بازگشت به ویترین" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-white border border-[#F0DFDC] px-4 py-2.5 rounded-full text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#3F6212]">
                      <span className="w-2 h-2 rounded-full bg-[#65A30D]" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#7A1632]">
                      <span className="w-2 h-2 rounded-full bg-[#7A1632]" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black text-[#7A1632]">
                        {isFa ? "انتخاب شماره میز:" : "Select table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#7A1632]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-white rounded-2xl p-4 text-center text-xs font-bold text-[#9A747E]">
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
                              className={`relative py-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#7A1632] bg-[#7A1632] text-white shadow-md"
                                  : isFree
                                    ? "border-[#D8E8C5] bg-[#F4F9EE] text-[#3F6212] hover:border-[#7A1632]"
                                    : "border-transparent bg-[#F5E7E4] text-[#A8848E] opacity-60 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-xs font-black">
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

                  <div className="bg-white border border-[#F0DFDC] rounded-3xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5 text-[#3B1D26]">
                        <Users size={14} className="text-[#7A1632]" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-[#FFF9F7] border border-[#F0DFDC] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-white text-[#7A1632] flex items-center justify-center"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black min-w-[38px] text-center">
                          {reserveGuests.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#7A1632] text-white flex items-center justify-center"
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
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors border ${
                            reserveTime === slot
                              ? "bg-[#7A1632] text-white border-[#7A1632]"
                              : "bg-[#FFF9F7] text-[#7D5661] border-[#F0DFDC]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <User
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#A87E89] ${
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
                          isFa ? "نام و نام خانوادگی *" : "Full Name *"
                        }
                        className={`w-full bg-white border border-[#EED9D5] focus:border-[#7A1632] rounded-full py-3 text-xs font-bold outline-none ${
                          isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#A87E89] ${
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
                        className="w-full bg-white border border-[#EED9D5] focus:border-[#7A1632] rounded-full py-3 px-10 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "مناسبت یا توضیحات (مثلاً: جشن تولد ۲ نفره)..."
                          : "Occasion or note (optional)..."
                      }
                      className="w-full bg-white border border-[#EED9D5] focus:border-[#7A1632] rounded-full py-3 px-4 text-xs font-bold outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl p-3 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#7A1632] hover:bg-[#5E1026] disabled:opacity-40 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
                >
                  {isReserving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck size={17} />
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
          دراور «جعبه سفارش» (Pastry Box Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border-t-2 border-[#7A1632]/25 w-full max-w-lg mx-auto rounded-t-[34px] p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#FBEAE7] text-[#7A1632] flex items-center justify-center">
                  <Gift size={19} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#7A1632]">
                    {isFa ? "جعبه سفارش شما" : "Your Pastry Box"}
                  </h3>
                  {tableNumber && (
                    <p className="text-xs font-bold text-[#3F6212]">
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
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
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
                    className="bg-white border border-[#F0DFDC] p-3 rounded-[22px] space-y-2.5"
                  >
                    <div className="flex justify-between items-center gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#FBEAE7] overflow-hidden shrink-0 flex items-center justify-center">
                          {item.product?.imageUrl ? (
                            <img
                              src={getFullImageUrl(item.product.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CakeSlice size={16} className="text-[#C68E9B]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-xs sm:text-sm text-[#3B1D26] truncate">
                            {isFa
                              ? item.product?.nameFa
                              : item.product?.nameEn || item.product?.nameFa}
                          </h4>
                          <p className="text-xs text-[#7A1632] font-bold mt-0.5">
                            {(
                              (item.product?.price || 0) * item.quantity
                            ).toLocaleString("fa-IR")}{" "}
                            {isFa ? "تومان" : "IRT"}
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
                              isNoteOpen
                                ? "bg-[#7A1632] text-white border-[#7A1632]"
                                : "bg-[#FFF9F7] text-[#9A747E] border-[#F0DFDC]"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-1.5 bg-[#FBEAE7] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-white text-[#7A1632] flex items-center justify-center"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center text-[#7A1632]">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#7A1632] text-white flex items-center justify-center"
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
                            ? "توضیحات برای قناد یا باریستا..."
                            : "Note for pastry chef..."
                        }
                        className="w-full bg-[#FFF9F7] border border-[#F0DFDC] rounded-full px-3.5 py-2 text-xs font-bold outline-none"
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
                  isFa ? "نام مهمان (اختیاری)" : "Your Name (optional)"
                }
                className="w-full bg-white border border-[#EED9D5] focus:border-[#7A1632] rounded-full px-4 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#7A1632] hover:bg-[#5E1026] disabled:opacity-50 text-white py-3.5 rounded-full font-black text-sm shadow-lg shadow-[#7A1632]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={17} />
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

      {/* مودال احضار میزبان */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] rounded-t-[34px] sm:rounded-[34px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#FBEAE7] text-[#7A1632] flex items-center justify-center">
                  <BellRing size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#7A1632]">
                    {isFa ? "درخواست میزبان" : "Call Waiter"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#9A747E]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3.5">
              {(isFa ? waiterPresetsFa : waiterPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    message === preset
                      ? "bg-[#7A1632] text-white border-[#7A1632]"
                      : "bg-white text-[#3B1D26] border-[#F0DFDC]"
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
                isFa ? "پیام دلخواه (اختیاری)..." : "Message (optional)..."
              }
              className="w-full bg-white border border-[#EED9D5] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-[#7A1632] hover:bg-[#5E1026] text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال درخواست" : "Send Request"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال یادداشت به قناد / سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] rounded-t-[34px] sm:rounded-[34px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#E3F0D3] text-[#3F6212] flex items-center justify-center">
                  <ChefHat size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#7A1632]">
                    {isFa ? "یادداشت به قناد و باریستا" : "Note to Pastry Chef"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#9A747E]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3.5">
              {(isFa ? chefPresetsFa : chefPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    message === preset
                      ? "bg-[#7A1632] text-white border-[#7A1632]"
                      : "bg-white text-[#3B1D26] border-[#F0DFDC]"
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
                  ? "حساسیت غذایی، تزئین یا پیام کوتاه..."
                  : "Allergies or pastry preference..."
              }
              className="w-full bg-white border border-[#EED9D5] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-[#7A1632] hover:bg-[#5E1026] text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال یادداشت" : "Send Note"}</span>
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
          className="fixed inset-0 z-50 bg-[#3B1D26]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFF9F7] border border-[#EED9D5] w-full max-w-md rounded-t-[34px] sm:rounded-[34px] p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-[#E5C9C4] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white border border-[#EED9D5] text-[#7A1632] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
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
                className="w-8 h-8 rounded-full bg-white border border-[#EED9D5] text-[#7A1632] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FBEAE7] text-[#7A1632] flex items-center justify-center mb-2.5 border-2 border-white shadow-sm">
                <CakeSlice size={24} />
              </div>
              <span className="inline-block text-[11px] font-black text-[#3F6212] bg-[#E3F0D3] px-3 py-0.5 rounded-full mb-1.5">
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black text-[#7A1632]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "Order Served!"
                  : isFa
                    ? "وضعیت آماده‌سازی سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-white border border-[#F0DFDC] rounded-3xl p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-[#E3F0D3] text-[#3F6212]"
                          : isActive
                            ? "bg-[#7A1632] text-white"
                            : "bg-[#FBEAE7] text-[#B5929C]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : isActive ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Clock size={14} />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <span className="block font-black text-xs sm:text-sm text-[#3B1D26]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#8C6570] mt-0.5">
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
              className="w-full bg-[#7A1632] text-[#FFF9F7] py-3.5 rounded-full font-black text-sm shrink-0"
            >
              {isFa ? "بازگشت به ویترین" : "Back to Menu"}
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

export default Template7;
