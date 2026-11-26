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
  ArrowUpLeft,
  ArrowUpRight,
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
    name: "دریافت سفارش",
    description: "سفارش شما با آرامش و دقت در آشپزخانه ثبت شد",
  },
  {
    id: "preparing",
    name: "آماده‌سازی با دقت",
    description: "سرآشپز مشغول آماده‌سازی تازه سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سینی سفارش شما آماده است و هم‌اکنون تقدیم می‌شود",
  },
];

// دایره قلم‌موی ذن (Enso Brush Circle) به صورت SVG اختصاصی
const EnsoCircle: React.FC<{ className?: string }> = ({
  className = "w-24 h-24",
}) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M66 13C92 16 109 39 106 65C103 91 80 109 54 106C28 103 10 80 14 54C17 31 35 16 55 13"
      stroke="currentColor"
      strokeWidth="6.5"
      strokeLinecap="round"
      strokeOpacity="0.14"
    />
    <path
      d="M72 15C95 20 108 42 104 66C100 90 78 106 54 103C31 100 15 79 18 55"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeOpacity="0.22"
    />
  </svg>
);

// مُهر مربعی قرمز ژاپنی (Hanko Stamp)
const HankoStamp: React.FC<{
  topLabel: string;
  bottomLabel: string;
  size?: "sm" | "md";
}> = ({ topLabel, bottomLabel, size = "md" }) => (
  <div
    className={`inline-flex flex-col items-center justify-center border-2 border-[#C81E1E] text-[#C81E1E] bg-[#C81E1E]/[0.04] select-none shrink-0 ${
      size === "sm"
        ? "px-1.5 py-0.5 leading-none"
        : "w-14 h-14 p-1 leading-tight"
    }`}
  >
    <div
      className={`w-full h-full border border-[#C81E1E]/45 flex flex-col items-center justify-center ${
        size === "sm" ? "px-1 py-0.5" : "p-0.5"
      }`}
    >
      <span
        className={`font-mono font-bold tracking-widest uppercase ${
          size === "sm" ? "text-[8px]" : "text-[9px]"
        }`}
      >
        {topLabel}
      </span>
      <span
        className={`font-black font-mono ${
          size === "sm" ? "text-[11px]" : "text-sm mt-0.5"
        }`}
      >
        {bottomLabel}
      </span>
    </div>
  </div>
);

const Template9: React.FC<TemplateProps> = ({
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
        isFa ? "میز شما با موفقیت رزرو شد." : "Table reservation confirmed.",
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
        isFa ? "درخواست شما با احترام ثبت شد." : "Request sent successfully.",
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
            ? `سفارش #${normalizedOrder.orderNumber} ثبت شد.`
            : `Order #${normalizedOrder.orderNumber} placed.`,
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

  const safeVenueName = venueData?.name || venueData?.Name || "بیسترو ذن";
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

  const timePresetsFa = ["۱۳:۰۰", "۱۸:۳۰", "۲۰:۰۰", "۲۱:۳۰"];
  const timePresetsEn = ["13:00", "18:30", "20:00", "21:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "چاپستیک / قاشق اضافه",
    "سس سویا و زنجبیل اضافه",
    "حضور میزبان سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Extra chopsticks / cutlery",
    "Extra soy sauce & ginger",
    "Host assistance",
  ];

  const chefPresetsFa = [
    "بدون سس تند و واسابی",
    "حساسیت به غذاهای دریایی / کنجد",
    "سس به‌صورت جداگانه سرو شود",
    "کم‌نمک و ملایم",
  ];
  const chefPresetsEn = [
    "No spicy sauce / wasabi",
    "Seafood / sesame allergy",
    "Sauce on the side",
    "Mild & less sodium",
  ];

  // محاسبه هوشمند ابعاد هر خانه در گرید بنتو نامتقارن بدون ایجاد حفره خالی
  const getBentoSpanClass = (idx: number, total: number) => {
    const isHeroSlot = idx % 3 === 0;
    const isLonelyTailMobile = idx === total - 1 && idx % 3 === 1;
    const isLonelyHeroDesktop = idx === total - 1 && total % 3 === 1;

    if (isLonelyHeroDesktop) {
      return {
        span: "col-span-2 md:col-span-4",
        isWide: true,
      };
    }
    if (isHeroSlot || isLonelyTailMobile) {
      return {
        span: "col-span-2 md:col-span-2",
        isWide: true,
      };
    }
    return {
      span: "col-span-1 md:col-span-1",
      isWide: false,
    };
  };

  return (
    <div
      className="min-h-screen bg-[#F3F1EC] text-[#141414] font-sans antialiased selection:bg-[#C81E1E]/15 overflow-x-hidden pb-36 relative"
      style={{
        backgroundImage:
          "radial-gradient(rgba(20,20,20,0.035) 1px, transparent 0)",
        backgroundSize: "18px 18px",
      }}
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان مینیمال مرکبی با خط قرمز شنگرفی */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#141414] text-[#F3F1EC] px-5 py-3 shadow-2xl font-bold text-xs flex items-center gap-3 border-r-4 border-[#C81E1E]">
            <Check
              size={14}
              className="text-[#C81E1E] shrink-0"
              strokeWidth={3}
            />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* قاب مرکزی معماری با خطوط 1px (Shoji Frame) */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6">
        {/* ========================================================
            بخش ۱: سربرگ معماری ذن + مُهر قرمز هانکو (Zen Masthead)
           ======================================================== */}
        <header className="border border-[#141414]/15 bg-[#F8F6F1] relative overflow-hidden">
          {/* نوار ابزار فوق‌مینیمال در بالاترین لبه */}
          <div className="flex items-center justify-between border-b border-[#141414]/15 px-3.5 py-2 text-[10px] font-mono font-bold text-[#75726A]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#C81E1E] inline-block" />
              <span className="tracking-[0.2em] uppercase">
                {isFa ? "فهرست ذن • بنتو" : "ZEN BENTO MENU"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {activeOrder && (
                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(true)}
                  className="bg-[#C81E1E] text-[#F8F6F1] px-2.5 py-1 text-[10px] font-black flex items-center gap-1.5 transition-opacity hover:opacity-90"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>#{activeOrder.orderNumber}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen((prev) => !prev);
                  if (isSearchOpen) setSearchQuery("");
                }}
                aria-label="جستجو"
                className={`w-7 h-7 border flex items-center justify-center transition-colors ${
                  isSearchOpen || searchQuery
                    ? "bg-[#141414] text-[#F8F6F1] border-[#141414]"
                    : "border-[#141414]/20 text-[#141414] hover:border-[#141414]"
                }`}
              >
                {isSearchOpen ? <X size={13} /> : <Search size={13} />}
              </button>

              {venueData?.bilingual && (
                <button
                  type="button"
                  onClick={() => setLanguage(isFa ? "en" : "fa")}
                  className="h-7 px-2 border border-[#141414]/20 hover:border-[#141414] text-[#141414] font-black text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Globe size={11} className="text-[#C81E1E]" />
                  <span>{isFa ? "EN" : "فا"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                aria-label="اطلاعات"
                className="w-7 h-7 border border-[#141414]/20 hover:border-[#141414] text-[#141414] flex items-center justify-center transition-colors"
              >
                <Info size={13} />
              </button>
            </div>
          </div>

          {/* بدنه نامتقارن سربرگ: هویت مجموعه + دایره Enso + مُهر Hanko */}
          <div className="p-5 sm:p-7 relative flex items-center justify-between gap-4">
            {/* دایره قلم‌موی ذن در پس‌زمینه */}
            <EnsoCircle className="w-36 h-36 sm:w-44 sm:h-44 text-[#141414] absolute -left-8 -bottom-10 pointer-events-none" />

            <div className="flex items-center gap-4 min-w-0 relative z-10">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border border-[#141414]/20 bg-[#F3F1EC] overflow-hidden flex items-center justify-center p-1">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store
                      size={26}
                      strokeWidth={1.5}
                      className="text-[#141414]"
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <span className="font-mono text-[10px] tracking-[0.22em] text-[#75726A] uppercase block mb-1">
                  {isFa ? "مجموعه پذیرایی" : "CULINARY HOUSE"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#141414] tracking-tight truncate leading-tight">
                  {safeVenueName}
                </h1>
                {(isFa ? safeAboutFa : safeAboutEn) && (
                  <p className="text-xs font-medium text-[#75726A] line-clamp-2 leading-relaxed mt-1.5 max-w-md">
                    {isFa ? safeAboutFa : safeAboutEn}
                  </p>
                )}
              </div>
            </div>

            {/* مُهر مربعی قرمز (Hanko) برای شماره میز یا نشان منو */}
            <div className="relative z-10">
              <HankoStamp
                topLabel={tableNumber ? (isFa ? "میز" : "TBL") : "味"}
                bottomLabel={
                  tableNumber
                    ? String(tableNumber).padStart(2, "0")
                    : isFa
                      ? "منو"
                      : "ZEN"
                }
              />
            </div>
          </div>

          {/* نوار عملیات بنتویی چسبیده به پایین سربرگ (Hairline Grid) */}
          <div className="grid grid-cols-3 border-t border-[#141414]/15 divide-x divide-x-reverse divide-[#141414]/15 bg-[#F3F1EC]/70">
            <button
              type="button"
              onClick={openReservationModal}
              className={`${
                tableNumber &&
                (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
                  ? ""
                  : "col-span-3"
              } py-3 px-2 hover:bg-[#141414] hover:text-[#F8F6F1] transition-colors flex items-center justify-center gap-1.5 text-[11px] font-black group`}
            >
              <CalendarCheck
                size={14}
                className="text-[#C81E1E] group-hover:text-[#F8F6F1] shrink-0"
              />
              <span className="truncate">{isFa ? "رزرو میز" : "Reserve"}</span>
              {tablesList.length > 0 && (
                <span className="font-mono text-[10px] text-[#2F5E41] group-hover:text-[#A7F3D0]">
                  ({availableTablesCount})
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
                className="py-3 px-2 hover:bg-[#141414] hover:text-[#F8F6F1] transition-colors flex items-center justify-center gap-1.5 text-[11px] font-black group"
              >
                <BellRing
                  size={14}
                  className="text-[#141414]/70 group-hover:text-[#F8F6F1] shrink-0"
                />
                <span className="truncate">{isFa ? "میزبان" : "Host"}</span>
              </button>
            )}

            {tableNumber && venueData?.callChefEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="py-3 px-2 hover:bg-[#141414] hover:text-[#F8F6F1] transition-colors flex items-center justify-center gap-1.5 text-[11px] font-black group"
              >
                <ChefHat
                  size={14}
                  className="text-[#141414]/70 group-hover:text-[#F8F6F1] shrink-0"
                />
                <span className="truncate">{isFa ? "سرآشپز" : "Chef"}</span>
              </button>
            )}
          </div>
        </header>

        {/* ========================================================
            بخش ۲: نوار فصل‌های شماره‌گذاری‌شده (01, 02, 03...) + جستجو
           ======================================================== */}
        <div className="sticky top-0 z-20 bg-[#F3F1EC]/95 backdrop-blur-md border-x border-b border-[#141414]/15 px-3 py-2.5">
          {isSearchOpen && (
            <div className="relative mb-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Search
                size={14}
                className={`absolute top-1/2 -translate-y-1/2 text-[#75726A] ${
                  isFa ? "right-3" : "left-3"
                }`}
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa ? "جستجو در فصل‌های منو..." : "Search dishes & tea..."
                }
                className={`w-full bg-[#F8F6F1] border border-[#141414]/25 focus:border-[#141414] py-2 text-xs font-bold text-[#141414] placeholder:text-[#75726A] outline-none ${
                  isFa ? "pr-9 pl-8" : "pl-9 pr-8"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#75726A] ${
                    isFa ? "left-2.5" : "right-2.5"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {safeCategories.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSearchQuery("");
                }}
                className={`relative pb-1.5 text-xs font-black whitespace-nowrap shrink-0 flex items-baseline gap-1.5 transition-colors ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "text-[#141414]"
                    : "text-[#75726A] hover:text-[#141414]"
                }`}
              >
                <span className="font-mono text-[10px] text-[#C81E1E]">00</span>
                <span>{isFa ? "تمام فصل‌ها" : "ALL"}</span>
                {selectedCategoryId === "all" && !searchQuery && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#C81E1E]" />
                )}
              </button>

              {safeCategories.map((cat: any, idx: number) => {
                const isSelected =
                  selectedCategoryId === cat.id && !searchQuery.trim();
                const chapterNum = String(idx + 1).padStart(2, "0");

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSearchQuery("");
                    }}
                    className={`relative pb-1.5 text-xs font-black whitespace-nowrap shrink-0 flex items-baseline gap-1.5 transition-colors ${
                      isSelected
                        ? "text-[#141414]"
                        : "text-[#75726A] hover:text-[#141414]"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] ${
                        isSelected ? "text-[#C81E1E]" : "text-[#75726A]/70"
                      }`}
                    >
                      {chapterNum}
                    </span>
                    <span>
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </span>
                    {isSelected && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#C81E1E]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================
            بخش ۳: گرید بنتو نامتقارن (Asymmetric Zen Bento Grid)
           ======================================================== */}
        <main className="pt-8 space-y-10">
          {filteredMenu.length === 0 ? (
            <div className="border border-[#141414]/15 bg-[#F8F6F1] py-16 text-center">
              <UtensilsCrossed
                size={28}
                strokeWidth={1.4}
                className="text-[#75726A]/50 mx-auto mb-3"
              />
              <p className="text-xs font-bold text-[#75726A]">
                {isFa ? "آیتمی با این جستجو یافت نشد." : "No dishes found."}
              </p>
            </div>
          ) : (
            filteredMenu.map((cat: any, catIdx: number) => {
              const hasProducts =
                Array.isArray(cat.products) && cat.products.length > 0;
              const chapterNo = String(catIdx + 1).padStart(2, "0");
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;

              return (
                <section key={cat.id}>
                  {/* سرستون مینیمال فصل با شماره عمودی و خط نازک */}
                  <div className="flex items-end justify-between gap-3 mb-3.5 px-0.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-black text-[#C81E1E] border border-[#C81E1E]/40 px-1.5 py-0.5 shrink-0">
                        {chapterNo}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[#141414] tracking-tight truncate">
                        {catTitle}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:block w-16 h-[1px] bg-[#141414]/20" />
                      <span className="font-mono text-[10px] font-bold text-[#75726A]">
                        {(cat.products?.length || 0)
                          .toString()
                          .padStart(2, "0")}{" "}
                        {isFa ? "آیتم" : "ITEMS"}
                      </span>
                    </div>
                  </div>

                  {!hasProducts ? (
                    <div className="border border-[#141414]/15 bg-[#F8F6F1] p-8 text-center text-xs font-bold text-[#75726A]">
                      {isFa
                        ? "آیتمی در این فصل ثبت نشده است."
                        : "No items in this section."}
                    </div>
                  ) : (
                    /* کانتینر بنتو با خطوط 1px جوهری بین تمام خانه‌ها */
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#141414]/15 border border-[#141414]/15">
                      {cat.products.map((prod: any, idx: number) => {
                        const { span, isWide } = getBentoSpanClass(
                          idx,
                          cat.products.length,
                        );
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
                        const canOrder =
                          Boolean(venueData?.orderingEnabled) &&
                          Boolean(tableNumber) &&
                          isAvailable;
                        const itemCode = `${chapterNo}.${String(idx + 1).padStart(2, "0")}`;

                        return (
                          <article
                            key={prod?.id}
                            onClick={() => openProductShowcase(prod)}
                            className={`${span} group cursor-pointer bg-[#F8F6F1] hover:bg-[#FCFBF8] transition-colors relative flex flex-col justify-between ${
                              !isAvailable ? "opacity-55" : ""
                            }`}
                          >
                            {/* خط تاکیدی شنگرفی در لبه بالایی خانه هنگام انتخاب */}
                            {cartItem && (
                              <span className="absolute top-0 inset-x-0 h-[2.5px] bg-[#C81E1E] z-10" />
                            )}

                            {isWide ? (
                              /* ===== خانه عریض شاخص بنتو (Hero Bento Tile) ===== */
                              <div className="grid grid-cols-12 h-full">
                                {/* تصویر عریض در ۵ ستون */}
                                <div className="col-span-5 sm:col-span-5 bg-[#EAE6DC] relative overflow-hidden min-h-[146px] sm:min-h-[168px]">
                                  {prod?.imageUrl ? (
                                    <img
                                      src={getFullImageUrl(prod.imageUrl)}
                                      alt={isFa ? prod.nameFa : prod.nameEn}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#141414]/15">
                                      <UtensilsCrossed
                                        size={28}
                                        strokeWidth={1.3}
                                      />
                                    </div>
                                  )}

                                  {/* شماره شاخص گوشه عکس */}
                                  <span className="absolute top-2 right-2 bg-[#F8F6F1]/90 backdrop-blur-xs px-1.5 py-0.5 font-mono text-[9px] font-black text-[#141414]">
                                    {itemCode}
                                  </span>

                                  {!isAvailable && (
                                    <div className="absolute inset-0 bg-[#141414]/55 flex items-center justify-center">
                                      <HankoStamp
                                        size="sm"
                                        topLabel="OUT"
                                        bottomLabel={isFa ? "تمام" : "SOLD"}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* فضای متن و کنترل در ۷ ستون با تنفس بصری (Ma) */}
                                <div className="col-span-7 sm:col-span-7 p-3.5 sm:p-5 flex flex-col justify-between gap-3">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className="font-black text-[14px] sm:text-base text-[#141414] leading-snug line-clamp-2">
                                        {isFa
                                          ? prod?.nameFa
                                          : prod?.nameEn || prod?.nameFa}
                                      </h3>

                                      {cartItem ? (
                                        <HankoStamp
                                          size="sm"
                                          topLabel={isFa ? "انتخاب" : "QTY"}
                                          bottomLabel={`×${cartItem.quantity}`}
                                        />
                                      ) : isAvailable &&
                                        hasFiniteStock &&
                                        Number(prod.stock) <= 5 ? (
                                        <span className="font-mono text-[9px] font-black text-[#C81E1E] border border-[#C81E1E]/40 px-1.5 py-0.5 shrink-0">
                                          {isFa
                                            ? `${prod.stock} مانده`
                                            : `${prod.stock} LEFT`}
                                        </span>
                                      ) : null}
                                    </div>

                                    {(isFa
                                      ? prod?.descriptionFa
                                      : prod?.descriptionEn ||
                                        prod?.descriptionFa) && (
                                      <p className="text-[11px] sm:text-xs font-medium text-[#75726A] line-clamp-2 leading-relaxed mt-1.5">
                                        {isFa
                                          ? prod?.descriptionFa
                                          : prod?.descriptionEn ||
                                            prod?.descriptionFa}
                                      </p>
                                    )}
                                  </div>

                                  {/* قیمت و دکمه مرکبی */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="pt-2.5 border-t border-[#141414]/10 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-mono font-black text-sm sm:text-base text-[#141414] tabular-nums">
                                        {Number(
                                          prod?.price || 0,
                                        ).toLocaleString("fa-IR")}
                                      </span>
                                      <span className="text-[9px] font-bold text-[#75726A]">
                                        {isFa ? "تومان" : "IRT"}
                                      </span>
                                    </div>

                                    {canOrder && (
                                      <>
                                        {cartItem ? (
                                          <div className="flex items-center border border-[#141414] bg-[#F3F1EC]">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeFromCart(prod.id)
                                              }
                                              className="w-7 h-7 flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors"
                                            >
                                              <Minus
                                                size={12}
                                                strokeWidth={2.6}
                                              />
                                            </button>
                                            <span className="font-mono text-xs font-black min-w-[22px] text-center text-[#C81E1E]">
                                              {cartItem.quantity.toLocaleString(
                                                "fa-IR",
                                              )}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={Boolean(
                                                reachedMaxStock,
                                              )}
                                              onClick={() => addToCart(prod)}
                                              className="w-7 h-7 bg-[#141414] text-[#F8F6F1] disabled:opacity-30 flex items-center justify-center hover:bg-[#C81E1E] transition-colors"
                                            >
                                              <Plus
                                                size={12}
                                                strokeWidth={2.6}
                                              />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => addToCart(prod)}
                                            className="h-7 px-3 border border-[#141414] bg-[#141414] hover:bg-[#C81E1E] hover:border-[#C81E1E] text-[#F8F6F1] text-[11px] font-black flex items-center gap-1 transition-colors active:scale-95"
                                          >
                                            <Plus size={12} strokeWidth={2.8} />
                                            <span>
                                              {isFa ? "افزودن" : "ADD"}
                                            </span>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* ===== خانه مربعی هم‌نشین بنتو (Companion Bento Tile) ===== */
                              <div className="flex flex-col justify-between h-full">
                                <div>
                                  <div className="aspect-[4/3] w-full bg-[#EAE6DC] relative overflow-hidden">
                                    {prod?.imageUrl ? (
                                      <img
                                        src={getFullImageUrl(prod.imageUrl)}
                                        alt={isFa ? prod.nameFa : prod.nameEn}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#141414]/15">
                                        <UtensilsCrossed
                                          size={24}
                                          strokeWidth={1.3}
                                        />
                                      </div>
                                    )}

                                    <span className="absolute top-2 right-2 bg-[#F8F6F1]/90 px-1.5 py-0.5 font-mono text-[9px] font-black text-[#141414]">
                                      {itemCode}
                                    </span>

                                    {cartItem && (
                                      <div className="absolute bottom-2 left-2 bg-[#F8F6F1]/95">
                                        <HankoStamp
                                          size="sm"
                                          topLabel={isFa ? "تعداد" : "QTY"}
                                          bottomLabel={`×${cartItem.quantity}`}
                                        />
                                      </div>
                                    )}

                                    {isAvailable &&
                                      !cartItem &&
                                      hasFiniteStock &&
                                      Number(prod.stock) <= 5 && (
                                        <span className="absolute bottom-2 left-2 bg-[#C81E1E] text-[#F8F6F1] px-1.5 py-0.5 font-mono text-[9px] font-black">
                                          {isFa
                                            ? `${prod.stock} مانده`
                                            : `${prod.stock} LEFT`}
                                        </span>
                                      )}

                                    {!isAvailable && (
                                      <div className="absolute inset-0 bg-[#141414]/55 flex items-center justify-center">
                                        <span className="bg-[#F8F6F1] text-[#C81E1E] border border-[#C81E1E] text-[10px] font-black px-2 py-0.5">
                                          {isFa ? "ناموجود" : "SOLD OUT"}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-3 pb-2">
                                    <h3 className="font-black text-[13px] text-[#141414] leading-snug line-clamp-2">
                                      {isFa
                                        ? prod?.nameFa
                                        : prod?.nameEn || prod?.nameFa}
                                    </h3>

                                    {(isFa
                                      ? prod?.descriptionFa
                                      : prod?.descriptionEn ||
                                        prod?.descriptionFa) && (
                                      <p className="text-[10px] font-medium text-[#75726A] line-clamp-1 mt-1">
                                        {isFa
                                          ? prod?.descriptionFa
                                          : prod?.descriptionEn ||
                                            prod?.descriptionFa}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-3 pb-3 pt-2 border-t border-[#141414]/10 flex items-center justify-between gap-1.5"
                                >
                                  <div className="min-w-0">
                                    <span className="font-mono font-black text-[13px] text-[#141414] tabular-nums block leading-none">
                                      {Number(prod?.price || 0).toLocaleString(
                                        "fa-IR",
                                      )}
                                    </span>
                                    <span className="text-[9px] font-bold text-[#75726A]">
                                      {isFa ? "تومان" : "IRT"}
                                    </span>
                                  </div>

                                  {canOrder && (
                                    <>
                                      {cartItem ? (
                                        <div className="flex items-center border border-[#141414] bg-[#F3F1EC] shrink-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeFromCart(prod.id)
                                            }
                                            className="w-6 h-6 flex items-center justify-center"
                                          >
                                            <Minus
                                              size={11}
                                              strokeWidth={2.6}
                                            />
                                          </button>
                                          <span className="font-mono text-[11px] font-black min-w-[16px] text-center text-[#C81E1E]">
                                            {cartItem.quantity.toLocaleString(
                                              "fa-IR",
                                            )}
                                          </span>
                                          <button
                                            type="button"
                                            disabled={Boolean(reachedMaxStock)}
                                            onClick={() => addToCart(prod)}
                                            className="w-6 h-6 bg-[#141414] text-white disabled:opacity-30 flex items-center justify-center"
                                          >
                                            <Plus size={11} strokeWidth={2.6} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          aria-label={isFa ? "افزودن" : "Add"}
                                          onClick={() => addToCart(prod)}
                                          className="w-7 h-7 border border-[#141414] bg-transparent hover:bg-[#141414] text-[#141414] hover:text-[#F8F6F1] flex items-center justify-center transition-colors active:scale-90 shrink-0"
                                        >
                                          <Plus size={13} strokeWidth={2.6} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </main>

        {/* فوتر مینیمال و امضای ترنج */}
        <footer className="mt-14 pt-6 border-t border-[#141414]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-bold text-[#75726A]">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
            {safeVenueName} • {isFa ? "تجربه طعم و آرامش" : "CRAFTED WITH CARE"}
          </span>

          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[#C81E1E] transition-colors"
          >
            <Sparkles size={12} className="text-[#C81E1E]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </div>

      {/* ========================================================
          بخش ۴: نوار سینی سفارش شناور (Zen Bento Tray Bar)
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-3.5 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#141414] hover:bg-[#1F1F1F] text-[#F8F6F1] p-3 px-4 border border-[#141414] shadow-[0_18px_40px_rgba(20,20,20,0.3)] flex items-center justify-between gap-3 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-[#C81E1E] text-[#F8F6F1] font-mono text-xs font-black flex items-center justify-center shrink-0">
                {totalItems.toLocaleString("fa-IR")}
              </span>
              <div className="text-right">
                <span className="block text-xs sm:text-sm font-black">
                  {isFa ? "مشاهده سینی سفارش" : "VIEW BENTO TRAY"}
                </span>
                <span className="block font-mono text-[10px] text-[#A8A49B]">
                  {tableNumber
                    ? isFa
                      ? `میز ${tableNumber}`
                      : `TABLE #${tableNumber}`
                    : isFa
                      ? "تکمیل سفارش"
                      : "CHECKOUT"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black tabular-nums text-[#F8F6F1]">
                {totalPrice.toLocaleString("fa-IR")}{" "}
                <span className="font-sans text-[10px] font-bold text-[#A8A49B]">
                  {isFa ? "تومان" : "IRT"}
                </span>
              </span>
              {isFa ? (
                <ArrowUpLeft size={16} className="text-[#C81E1E]" />
              ) : (
                <ArrowUpRight size={16} className="text-[#C81E1E]" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال ۱: اطلاعات مجموعه (Zen House Info)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-[#141414]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border border-[#141414]/25 p-6 pb-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#141414]/15">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 border border-[#141414]/20 bg-[#F3F1EC] overflow-hidden flex items-center justify-center">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={20} className="text-[#141414]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#141414]">
                    {safeVenueName}
                  </h3>
                  <span className="font-mono text-[10px] text-[#75726A] tracking-widest uppercase">
                    {isFa ? "معرفی مجموعه" : "HOUSE INFO"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 border border-[#141414]/20 text-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-[#57544D] leading-relaxed mb-4">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {(safeAddress || safePhone) && (
              <div className="border border-[#141414]/15 bg-[#F3F1EC] p-4 space-y-2.5 text-xs font-bold text-[#141414]">
                {safeAddress && (
                  <div className="flex items-start gap-2.5">
                    <MapPin
                      size={14}
                      className="text-[#C81E1E] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="flex items-center gap-2.5 font-mono">
                    <Phone size={14} className="text-[#C81E1E] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۲: جزئیات محصول (Zen Dish Showcase)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-[#141414]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border border-[#141414]/25 w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-60 w-full bg-[#EAE6DC] border-b border-[#141414]/15">
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
                <div className="w-full h-full flex items-center justify-center text-[#141414]/15">
                  <UtensilsCrossed size={44} strokeWidth={1.3} />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3.5 left-3.5 w-9 h-9 bg-[#F8F6F1] border border-[#141414]/25 text-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#141414]/15">
                <h3 className="text-lg sm:text-xl font-black text-[#141414] leading-snug">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <div className="text-left shrink-0">
                  <span className="font-mono text-lg font-black text-[#C81E1E] tabular-nums block leading-none">
                    {Number(selectedProductModal.price || 0).toLocaleString(
                      "fa-IR",
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-[#75726A]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </div>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#57544D] leading-relaxed">
                  {isFa
                    ? selectedProductModal.descriptionFa
                    : selectedProductModal.descriptionEn ||
                      selectedProductModal.descriptionFa}
                </p>
              )}

              {venueData?.orderingEnabled && tableNumber ? (
                <div className="space-y-3 pt-1">
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
                          ? "یادداشت برای سرآشپز (مثلاً: بدون واسابی / کم‌تند)..."
                          : "Special note for chef..."
                      }
                      className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] px-3.5 py-3 text-xs font-bold text-[#141414] placeholder:text-[#75726A] outline-none"
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
                        <div className="w-full py-3.5 border border-[#C81E1E]/40 bg-[#C81E1E]/5 text-[#C81E1E] font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "SOLD OUT"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between border border-[#141414] bg-[#F3F1EC] p-1">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 bg-[#F8F6F1] border border-[#141414]/25 text-[#141414] flex items-center justify-center"
                            >
                              <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <span className="font-mono font-black text-base text-[#C81E1E] min-w-[20px] text-center">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 bg-[#141414] text-white flex items-center justify-center"
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-[#C81E1E] text-white px-6 py-2.5 font-black text-xs"
                          >
                            {isFa ? "تایید" : "DONE"}
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
                            isFa
                              ? "به سینی سفارش اضافه شد."
                              : "Added to bento tray.",
                          );
                        }}
                        className="w-full bg-[#141414] hover:bg-[#C81E1E] text-[#F8F6F1] py-3.5 font-black text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
                      >
                        <Plus size={16} strokeWidth={2.6} />
                        <span>
                          {isFa ? "افزودن به سینی سفارش" : "ADD TO TRAY"}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#141414] text-[#F8F6F1] py-3.5 font-black text-xs"
                >
                  {isFa ? "بستن" : "CLOSE"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳: رزرو آنلاین میزها
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-[#141414]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border border-[#141414]/25 p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#141414]/15 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-[#141414]">
                    {isFa ? "رزرو میز" : "TABLE RESERVATION"}
                  </h3>
                  <span className="font-mono text-[9px] font-black bg-[#2F5E41] text-white px-1.5 py-0.5">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] font-bold text-[#75726A] mt-0.5">
                  {safeVenueName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 border border-[#141414]/20 text-[#141414] flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="flex justify-center">
                  <HankoStamp
                    topLabel={isFa ? "تایید" : "OK"}
                    bottomLabel={`#${confirmedReservation.tableNumber}`}
                  />
                </div>

                <div>
                  <h4 className="text-lg font-black text-[#141414]">
                    {isFa
                      ? "رزرو شما با موفقیت ثبت شد"
                      : "Reservation Confirmed"}
                  </h4>
                  <p className="text-xs font-bold text-[#75726A] mt-0.5">
                    {isFa
                      ? "منتظر میزبانی از شما در آرامش هستیم"
                      : "We look forward to hosting you"}
                  </p>
                </div>

                <div className="border border-[#141414]/15 bg-[#F3F1EC] p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1 border-b border-[#141414]/10">
                    <span className="text-[#75726A]">
                      {isFa ? "میز:" : "TABLE:"}
                    </span>
                    <span className="font-mono font-black text-[#C81E1E]">
                      #{confirmedReservation.tableNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141414]/10">
                    <span className="text-[#75726A]">
                      {isFa ? "نام مهمان:" : "GUEST:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#141414]/10">
                    <span className="text-[#75726A]">
                      {isFa ? "تماس:" : "PHONE:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#75726A]">
                      {isFa ? "نفرات:" : "GUESTS:"}
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
                  className="w-full bg-[#141414] text-[#F8F6F1] py-3.5 font-black text-sm"
                >
                  {isFa ? "بازگشت به منو" : "BACK TO MENU"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between border border-[#141414]/15 bg-[#F3F1EC] px-3.5 py-2 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#2F5E41]">
                      <span className="w-2 h-2 bg-[#2F5E41]" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2 h-2 bg-amber-600" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#C81E1E]">
                      <span className="w-2 h-2 bg-[#C81E1E]" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-[#141414]">
                        {isFa ? "۰۱. انتخاب شماره میز:" : "01. Pick a table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#C81E1E]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="border border-[#141414]/15 bg-[#F3F1EC] p-4 text-center text-xs font-bold text-[#75726A]">
                        {isFa
                          ? "میزی برای رزرو تعریف نشده است."
                          : "No tables available."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-[1px] bg-[#141414]/15 border border-[#141414]/15">
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
                              className={`py-2.5 flex flex-col items-center justify-center transition-colors font-mono ${
                                isSelected
                                  ? "bg-[#C81E1E] text-[#F8F6F1]"
                                  : isFree
                                    ? "bg-[#F8F6F1] text-[#141414] hover:bg-[#141414] hover:text-[#F8F6F1]"
                                    : "bg-[#EAE6DC] text-[#75726A]/60 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-xs font-black">
                                {String(t.tableNumber).padStart(2, "0")}
                              </span>
                              <span className="font-sans text-[9px] font-bold mt-0.5">
                                {isSelected
                                  ? isFa
                                    ? "انتخاب"
                                    : "PICKED"
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

                  <div className="border border-[#141414]/15 bg-[#F3F1EC] p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className="text-[#C81E1E]" />
                        {isFa ? "تعداد مهمان‌ها" : "Guests"}
                      </span>
                      <div className="flex items-center border border-[#141414]/25 bg-[#F8F6F1]">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 flex items-center justify-center"
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
                          className="w-7 h-7 bg-[#141414] text-white flex items-center justify-center"
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
                          className={`px-3 py-1 text-[11px] font-mono font-bold border transition-colors ${
                            reserveTime === slot
                              ? "bg-[#141414] text-[#F8F6F1] border-[#141414]"
                              : "bg-[#F8F6F1] text-[#57544D] border-[#141414]/20"
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
                        className={`absolute top-1/2 -translate-y-1/2 text-[#75726A] ${
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
                        className={`w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] py-2.5 text-xs font-bold outline-none ${
                          isFa ? "pr-9 pl-3" : "pl-9 pr-3"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#75726A] ${
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
                        className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] py-2.5 px-9 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa ? "توضیحات (اختیاری)..." : "Note (optional)..."
                      }
                      className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] py-2.5 px-3 text-xs font-bold outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 border border-[#C81E1E] bg-[#C81E1E]/5 text-[#C81E1E] p-2.5 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#141414] hover:bg-[#C81E1E] disabled:opacity-40 text-[#F8F6F1] py-3.5 font-black text-sm flex items-center justify-center gap-2 transition-colors shrink-0"
                >
                  {isReserving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck size={16} />
                      <span>
                        {selectedReserveTable
                          ? isFa
                            ? `ثبت رزرو میز ${String(selectedReserveTable).padStart(2, "0")}`
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
      )}

      {/* ========================================================
          مودال ۴: دراور سینی سفارش (Bento Tray Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-[#141414]/65 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border-t-2 border-[#141414] w-full max-w-lg mx-auto p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-between items-center pb-3.5 border-b border-[#141414]/15 mb-4">
              <div>
                <h3 className="text-lg font-black text-[#141414]">
                  {isFa ? "سینی سفارش شما" : "YOUR BENTO TRAY"}
                </h3>
                {tableNumber && (
                  <p className="font-mono text-xs font-bold text-[#C81E1E]">
                    {isFa
                      ? `میز شماره ${String(tableNumber).padStart(2, "0")}`
                      : `TABLE #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 border border-[#141414]/20 text-[#141414] flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#141414]/10 mb-4 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div key={pid} className="py-3 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[#141414] truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="font-mono text-xs text-[#C81E1E] font-bold mt-0.5 tabular-nums">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          <span className="font-sans text-[10px] text-[#75726A]">
                            {isFa ? "تومان" : "IRT"}
                          </span>
                        </p>
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
                            className={`w-7 h-7 border flex items-center justify-center transition-colors ${
                              isNoteOpen
                                ? "bg-[#C81E1E] text-white border-[#C81E1E]"
                                : "bg-[#F3F1EC] text-[#75726A] border-[#141414]/20"
                            }`}
                          >
                            <MessageSquarePlus size={13} />
                          </button>
                        )}

                        <div className="flex items-center border border-[#141414] bg-[#F3F1EC]">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 bg-[#F8F6F1] text-[#141414] flex items-center justify-center"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="font-mono text-xs font-black min-w-[20px] text-center text-[#C81E1E]">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 bg-[#141414] text-white flex items-center justify-center"
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
                            ? "توضیحات برای آشپزخانه..."
                            : "Note for kitchen..."
                        }
                        className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] px-3 py-2 text-xs font-bold outline-none"
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
                  isFa ? "نام مهمان (اختیاری)" : "Guest Name (optional)"
                }
                className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] px-3.5 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#141414] hover:bg-[#C81E1E] disabled:opacity-45 text-[#F8F6F1] py-3.5 font-black text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>
                    {isFa ? "ارسال سفارش به آشپزخانه" : "SEND ORDER"} —{" "}
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
          مودال ۵ و ۶: احضار میزبان و یادداشت به سرآشپز
         ======================================================== */}
      {(waiterModal || chefModal) && (
        <div
          onClick={() => {
            if (isProcessing) return;
            setWaiterModal(false);
            setChefModal(false);
          }}
          className="fixed inset-0 z-50 bg-[#141414]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border border-[#141414]/25 p-5 pb-7 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#141414]/15 mb-4">
              <div>
                <h3 className="font-black text-base text-[#141414]">
                  {waiterModal
                    ? isFa
                      ? "درخواست میزبان"
                      : "CALL HOST"
                    : isFa
                      ? "یادداشت به سرآشپز"
                      : "NOTE TO CHEF"}
                </h3>
                <p className="font-mono text-[11px] font-bold text-[#C81E1E]">
                  {isFa ? `میز شماره ${tableNumber}` : `TABLE #${tableNumber}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWaiterModal(false);
                  setChefModal(false);
                }}
                className="w-8 h-8 border border-[#141414]/20 text-[#141414] flex items-center justify-center"
              >
                <X size={15} />
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
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                    message === preset
                      ? "bg-[#141414] text-[#F8F6F1] border-[#141414]"
                      : "bg-[#F3F1EC] text-[#141414] border-[#141414]/20"
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
              placeholder={isFa ? "توضیحات دلخواه..." : "Write your note..."}
              className="w-full bg-[#F3F1EC] border border-[#141414]/20 focus:border-[#141414] p-3 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
              className="w-full bg-[#141414] hover:bg-[#C81E1E] text-[#F8F6F1] py-3.5 font-black text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={14} />
                  <span>{isFa ? "ارسال پیام" : "SEND"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۷: پیگیری زنده سفارش (Zen Live Tracker)
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-[#141414]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F8F6F1] border border-[#141414]/25 w-full max-w-md p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#141414]/15 mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-[#F3F1EC] border border-[#141414]/20 text-[#141414] px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
              >
                <RefreshCw
                  size={12}
                  className={isRefreshingOrder ? "animate-spin" : ""}
                />
                <span>{isFa ? "بروزرسانی" : "REFRESH"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrackerOpen(false)}
                className="w-8 h-8 border border-[#141414]/20 text-[#141414] flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="text-center mb-5 shrink-0 relative">
              <div className="relative inline-flex items-center justify-center mb-2">
                <EnsoCircle className="w-20 h-20 text-[#C81E1E]" />
                <span className="absolute font-mono text-sm font-black text-[#141414]">
                  #{activeOrder.orderNumber}
                </span>
              </div>
              <h2 className="text-lg font-black text-[#141414]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "ORDER SERVED"
                  : isFa
                    ? "مراحل آماده‌سازی در آشپزخانه"
                    : "LIVE PREPARATION STATUS"}
              </h2>
            </div>

            <div className="border border-[#141414]/15 bg-[#F3F1EC] p-4 space-y-4 mb-5 overflow-y-auto no-scrollbar">
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
                      className={`w-7 h-7 border flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-[#2F5E41] border-[#2F5E41] text-white"
                          : isActive
                            ? "bg-[#C81E1E] border-[#C81E1E] text-white"
                            : "bg-[#F8F6F1] border-[#141414]/25 text-[#75726A]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={14} />
                      ) : isActive ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <span className="block font-black text-xs sm:text-sm text-[#141414]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#75726A] mt-0.5">
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
              className="w-full bg-[#141414] text-[#F8F6F1] py-3.5 font-black text-sm shrink-0"
            >
              {isFa ? "بازگشت به منو" : "BACK TO MENU"}
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

export default Template9;
