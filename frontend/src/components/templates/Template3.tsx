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
  Flame,
  ScrollText,
  Award,
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
    name: "ثبت در دفتر سفارشات",
    description: "سفارش شما با موفقیت در مطبخ ثبت شد",
  },
  {
    id: "preparing",
    name: "در حال طبخ و آماده‌سازی",
    description: "سرآشپز مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده سرو بر سر میز",
    description: "سفارش آماده است و تا لحظاتی دیگر تقدیم می‌شود",
  },
];

// نقوش هندسی و کاشی‌کاری ظریف SVG برای قاب‌های اصیل ایرانی
const PersianTilePattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="persian-star"
        width="48"
        height="48"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z"
          fill="none"
          stroke="#FDE68A"
          strokeWidth="1.2"
        />
        <circle
          cx="24"
          cy="24"
          r="5"
          fill="none"
          stroke="#FDE68A"
          strokeWidth="1"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#persian-star)" />
  </svg>
);

const Template3: React.FC<TemplateProps> = ({
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
      showToast(
        isFa ? "درخواست شما با احترام ارسال شد." : "Request sent successfully.",
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
            ? `سفارش #${normalizedOrder.orderNumber} در مطبخ ثبت شد!`
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

  const safeVenueName = venueData?.name || venueData?.Name || "مطبخ و رستوران";
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

  const timePresetsFa = [
    "وعده ناهار (۱۳:۰۰)",
    "وعده شام (۲۰:۳۰)",
    "۲۱:۳۰",
    "۲۲:۰۰",
  ];
  const timePresetsEn = ["Lunch (13:00)", "Dinner (20:30)", "21:30", "22:00"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به نان تازه / مخلفات",
    "نیاز به قاشق و چنگال و دستمال",
    "حضور سالن‌دار بر سر میز",
  ];
  const waiterPresetsEn = [
    "Request the bill",
    "Fresh bread & sides",
    "Extra cutlery & napkins",
    "Table assistance",
  ];

  const chefPresetsFa = [
    "کباب کاملاً مغزپخت و آبدار باشد",
    "چلو با ته‌دیگ زعفرانی سرو شود",
    "غذا کم‌نمک و بدون ادویه تند باشد",
    "سماق و نارنج اضافه ارسال شود",
  ];
  const chefPresetsEn = [
    "Well-done & juicy",
    "Extra saffron rice crust",
    "Less salt & mild spices",
    "Extra sumac & sour orange",
  ];

  return (
    <div
      className="min-h-screen bg-[#FBF7F0] text-[#292018] font-sans antialiased selection:bg-[#B45309]/20 overflow-x-hidden pb-36 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان زنده */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#0F4C5C] text-[#FFFBEB] px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 border border-[#FDE68A]/30">
            <div className="w-5 h-5 rounded-full bg-[#D97706] flex items-center justify-center shrink-0">
              <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
            </div>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: سردر اصیل فیروزه‌ای و مسی (Traditional Header)
         ======================================================== */}
      <header className="max-w-2xl mx-auto px-4 pt-4">
        <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0F4C5C] via-[#135D70] to-[#0B3945] text-[#FFFBEB] shadow-[0_18px_45px_rgba(15,76,92,0.22)] border-2 border-[#D97706]/35">
          {/* نقش کاشی‌کاری اصیل ایرانی */}
          <PersianTilePattern />

          {/* حاشیه طلایی/مسی داخلی */}
          <div className="relative z-10 m-2 rounded-[26px] border border-[#FDE68A]/20 p-4 sm:p-6 flex flex-col justify-between gap-6">
            {/* نوار بالای سردر */}
            <div className="flex items-center justify-between gap-2">
              {tableNumber ? (
                <div className="bg-[#FFFBEB]/15 backdrop-blur-md border border-[#FDE68A]/35 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black text-[#FDE68A]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <span>
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </span>
                </div>
              ) : (
                <span className="bg-[#FFFBEB]/10 border border-[#FDE68A]/20 px-3 py-1 rounded-xl text-[11px] font-bold text-[#FDE68A]/90 flex items-center gap-1.5">
                  <Award size={13} className="text-[#F59E0B]" />
                  {isFa ? "پذیرایی اصیل و سنتی" : "Authentic Kitchen"}
                </span>
              )}

              <div className="flex items-center gap-2">
                {activeOrder && (
                  <button
                    type="button"
                    onClick={() => setIsTrackerOpen(true)}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md border border-[#FDE68A]/40 active:scale-95 transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>
                      {isFa
                        ? `پیگیری فیش #${activeOrder.orderNumber}`
                        : `Order #${activeOrder.orderNumber}`}
                    </span>
                  </button>
                )}

                {venueData?.bilingual && (
                  <button
                    type="button"
                    onClick={() => setLanguage(isFa ? "en" : "fa")}
                    className="bg-[#FFFBEB]/15 hover:bg-[#FFFBEB]/25 border border-[#FDE68A]/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[#FFFBEB] font-bold text-xs transition-all active:scale-95"
                  >
                    <Globe size={13} className="text-[#FDE68A]" />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* قاب لوگو و نام مطبخ / رستوران */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-gradient-to-br from-[#FDE68A]/40 to-[#D97706]/40 p-1 shadow-xl shrink-0">
                <div className="w-full h-full rounded-[20px] bg-[#FFFBEB] overflow-hidden flex items-center justify-center border border-[#D97706]/30">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={34} className="text-[#0F4C5C]" />
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#FDE68A]/85 block mb-0.5">
                  {isFa ? "خوش آمدید به" : "Welcome to"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  {safeVenueName}
                </h1>
                {(isFa ? safeAboutFa : safeAboutEn) && (
                  <p className="text-xs font-medium text-[#E0F2FE]/85 line-clamp-2 leading-relaxed mt-1">
                    {isFa ? safeAboutFa : safeAboutEn}
                  </p>
                )}
                {safeAddress && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#FDE68A] mt-1.5 truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{safeAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* نوار دکمه‌های مهمان‌نوازی (رزرو میز + سالن‌دار + آشپزخانه) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[#FDE68A]/20">
              <button
                type="button"
                onClick={openReservationModal}
                className={`${
                  tableNumber &&
                  (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
                    ? ""
                    : "sm:col-span-3"
                } bg-[#D97706] hover:bg-[#B45309] text-white py-2.5 px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md border border-[#FDE68A]/35 transition-all active:scale-95`}
              >
                <CalendarCheck size={15} />
                <span>{isFa ? "رزرو میز" : "Reserve Table"}</span>
                {tablesList.length > 0 && (
                  <span className="bg-black/25 text-[#FDE68A] px-2 py-0.5 rounded-lg text-[10px]">
                    {availableTablesCount > 0
                      ? isFa
                        ? `${availableTablesCount.toLocaleString("fa-IR")} آزاد`
                        : `${availableTablesCount} free`
                      : isFa
                        ? "تکمیل"
                        : "Full"}
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
                  className="bg-[#FFFBEB]/15 hover:bg-[#FFFBEB]/25 text-[#FFFBEB] border border-[#FDE68A]/25 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <BellRing size={15} className="text-[#FDE68A]" />
                  <span>{isFa ? "احضار سالن‌دار" : "Call Waiter"}</span>
                </button>
              )}

              {tableNumber && venueData?.callChefEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setChefModal(true);
                  }}
                  className="bg-[#FFFBEB]/15 hover:bg-[#FFFBEB]/25 text-[#FFFBEB] border border-[#FDE68A]/25 py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ChefHat size={15} className="text-[#FDE68A]" />
                  <span>{isFa ? "پیام به مطبخ" : "Note to Chef"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: نوار جستجو و تب‌های دسته‌بندی اصیل
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#FBF7F0]/95 backdrop-blur-xl border-b border-[#D97706]/20 mt-4 py-3 px-4">
        <div className="max-w-2xl mx-auto space-y-2.5">
          {/* باکس جستجوی سریع */}
          <div className="relative">
            <Search
              size={16}
              className={`absolute top-1/2 -translate-y-1/2 text-[#92400E]/60 ${
                isFa ? "right-4" : "left-4"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFa
                  ? "جستجو در فهرست غذاها (چلوکباب، خورشت، نوشیدنی...)"
                  : "Search traditional dishes..."
              }
              className={`w-full bg-white border border-[#D97706]/25 focus:border-[#0F4C5C] rounded-2xl py-2.5 text-xs font-bold text-[#292018] placeholder:text-[#78716C] outline-none shadow-2xs transition-all ${
                isFa ? "pr-10 pl-9" : "pl-10 pr-9"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={`absolute top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#292018] ${
                  isFa ? "left-3.5" : "right-3.5"
                }`}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* تب‌های دسته‌بندی با قاب کتیبه‌ای */}
          {Array.isArray(menuData) && menuData.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border ${
                  selectedCategoryId === "all"
                    ? "bg-[#0F4C5C] text-[#FDE68A] border-[#0F4C5C] shadow-sm"
                    : "bg-white text-[#57534E] hover:text-[#0F4C5C] border-[#D97706]/20"
                }`}
              >
                <Flame size={13} />
                <span>{isFa ? "تمام فهرست" : "Full Menu"}</span>
              </button>

              {menuData.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                      isSelected
                        ? "bg-[#0F4C5C] text-[#FDE68A] border-[#0F4C5C] shadow-sm"
                        : "bg-white text-[#57534E] hover:text-[#0F4C5C] border-[#D97706]/20"
                    }`}
                  >
                    {isFa
                      ? cat.nameFa || cat.name
                      : cat.nameEn || cat.nameFa || cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          بخش ۳: فهرست دفترچه‌ای و مطبخ‌محور (Traditional Ledger List)
         ======================================================== */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        {!tableNumber && (
          <div className="mb-5 bg-[#FFFBEB] border border-[#D97706]/30 text-[#92400E] px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3">
            <span>
              {isFa
                ? "برای ثبت مستقیم سفارش از سر میز، بارکد روی میز خود را اسکن کنید یا میزتان را رزرو نمایید."
                : "Scan the QR code on your table to order directly."}
            </span>
            <button
              type="button"
              onClick={openReservationModal}
              className="bg-[#0F4C5C] text-[#FDE68A] px-3 py-1.5 rounded-xl font-black text-[11px] shrink-0"
            >
              {isFa ? "رزرو میز" : "Reserve"}
            </button>
          </div>
        )}

        {filteredMenu.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[28px] border border-[#D97706]/20">
            <UtensilsCrossed
              size={38}
              className="text-[#D97706]/40 mx-auto mb-3"
            />
            <p className="text-[#78716C] font-bold text-sm">
              {isFa
                ? "غذایی با این مشخصات در فهرست یافت نشد."
                : "No dishes found."}
            </p>
          </div>
        ) : (
          filteredMenu.map((cat: any) => {
            const hasProducts =
              Array.isArray(cat.products) && cat.products.length > 0;

            return (
              <section key={cat.id} className="mb-8">
                {/* سرستون کتیبه‌ای دسته‌بندی */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-[#D97706]/40 to-transparent" />
                  <div className="bg-white border border-[#D97706]/30 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-2xs">
                    <ScrollText size={15} className="text-[#B45309]" />
                    <h2 className="text-base font-black text-[#0F4C5C] tracking-tight">
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </h2>
                    <span className="text-[10px] font-black bg-[#FBF7F0] text-[#92400E] px-2 py-0.5 rounded-lg border border-[#D97706]/20">
                      {(cat.products?.length || 0).toLocaleString("fa-IR")}
                    </span>
                  </div>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D97706]/40 to-transparent" />
                </div>

                {!hasProducts ? (
                  <div className="bg-white border border-[#D97706]/20 p-6 rounded-[24px] text-center text-[#78716C] text-xs font-bold">
                    {isFa
                      ? "هنوز غذایی در این بخش ثبت نشده است."
                      : "No items in this section yet."}
                  </div>
                ) : (
                  <div className="bg-white rounded-[28px] border border-[#D97706]/25 shadow-[0_8px_30px_rgba(41,32,24,0.04)] divide-y divide-dashed divide-[#D97706]/25 overflow-hidden">
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
                          className={`cursor-pointer p-4 hover:bg-[#FFFBEB]/60 transition-colors flex items-center gap-3.5 ${
                            !isAvailable ? "opacity-55" : ""
                          }`}
                        >
                          {/* قاب تصویر هشت‌ضلعی/گرد سنتی */}
                          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[20px] bg-[#FBF7F0] border-2 border-[#D97706]/25 shrink-0 overflow-hidden relative">
                            {prod?.imageUrl ? (
                              <img
                                src={getFullImageUrl(prod.imageUrl)}
                                alt={isFa ? prod.nameFa : prod.nameEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#D97706]/40">
                                <UtensilsCrossed size={24} />
                              </div>
                            )}

                            {isAvailable &&
                              hasFiniteStock &&
                              Number(prod.stock) <= 5 && (
                                <span className="absolute bottom-1 inset-x-1 bg-[#92400E]/90 text-[#FDE68A] text-[9px] font-black text-center py-0.5 rounded-md">
                                  {isFa
                                    ? `${prod.stock} پرس مانده`
                                    : `${prod.stock} left`}
                                </span>
                              )}
                          </div>

                          {/* جزئیات غذا و خط نقطه‌چین قیمت */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <h3 className="font-black text-[15px] text-[#292018] truncate">
                                {isFa
                                  ? prod?.nameFa
                                  : prod?.nameEn || prod?.nameFa}
                              </h3>

                              {/* خط نقطه‌چین سنتی متصل‌کننده نام به قیمت */}
                              <div className="flex-1 border-b-2 border-dotted border-[#D97706]/30 mb-1 min-w-[16px]" />

                              <div className="font-black text-[#0F4C5C] text-[15px] whitespace-nowrap shrink-0">
                                {Number(prod?.price || 0).toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                <span className="text-[10px] text-[#92400E] font-bold">
                                  {isFa ? "تومان" : "IRT"}
                                </span>
                              </div>
                            </div>

                            {(isFa
                              ? prod?.descriptionFa
                              : prod?.descriptionEn || prod?.descriptionFa) && (
                              <p className="text-xs font-medium text-[#78716C] line-clamp-2 leading-relaxed mt-1">
                                {isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn || prod?.descriptionFa}
                              </p>
                            )}

                            {/* بخش انتخاب تعداد پرس (مناسب رستوران‌های سنتی و صنعتی) */}
                            {venueData?.orderingEnabled && tableNumber && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-end mt-2.5"
                              >
                                {!isAvailable ? (
                                  <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                                    {isFa ? "اتمام موجودی" : "Sold out"}
                                  </span>
                                ) : cartItem ? (
                                  <div className="flex items-center gap-2 bg-[#FBF7F0] border border-[#D97706]/35 rounded-xl p-1">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(prod.id)}
                                      className="w-7 h-7 rounded-lg bg-white text-[#292018] border border-[#D97706]/20 flex items-center justify-center active:scale-90"
                                    >
                                      <Minus size={13} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-xs font-black text-[#0F4C5C] px-1.5">
                                      {cartItem.quantity.toLocaleString(
                                        "fa-IR",
                                      )}{" "}
                                      <span className="text-[10px] font-bold text-[#92400E]">
                                        {isFa ? "پرس" : "x"}
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      disabled={Boolean(reachedMaxStock)}
                                      onClick={() => addToCart(prod)}
                                      className="w-7 h-7 rounded-lg bg-[#0F4C5C] text-[#FDE68A] disabled:opacity-30 flex items-center justify-center active:scale-90"
                                    >
                                      <Plus size={13} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(prod)}
                                    className="bg-[#FFFBEB] hover:bg-[#0F4C5C] text-[#0F4C5C] hover:text-[#FDE68A] border border-[#0F4C5C]/25 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                  >
                                    <Plus size={14} strokeWidth={2.5} />
                                    <span>
                                      {isFa ? "افزودن پرس" : "Add Portion"}
                                    </span>
                                  </button>
                                )}
                              </div>
                            )}
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
          بخش ۴: نوار فیش سفارش پایین صفحه
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 inset-x-4 z-40 flex justify-center animate-in slide-in-from-bottom-8 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-xl bg-[#0F4C5C] hover:bg-[#0B3945] text-[#FFFBEB] p-3.5 sm:px-5 rounded-2xl font-black flex items-center justify-between shadow-[0_16px_40px_rgba(15,76,92,0.35)] border-2 border-[#FDE68A]/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="px-2.5 h-8 bg-[#D97706] rounded-xl flex items-center justify-center text-xs font-black text-white border border-[#FDE68A]/40">
                {totalItems.toLocaleString("fa-IR")} {isFa ? "پرس" : "items"}
              </div>
              <span className="text-sm font-black">
                {isFa ? "مشاهده صورت‌سفارش" : "View Order Slip"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#FDE68A]">
              <span className="text-sm font-black">
                {totalPrice.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-bold text-[#FFFBEB]/80">
                  {isFa ? "تومان" : "IRT"}
                </span>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* مودال جزئیات غذا */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] rounded-t-[32px] sm:rounded-[32px] overflow-hidden w-full max-w-md shadow-2xl border-2 border-[#D97706]/30 animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-56 w-full bg-[#EFE6D5]">
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
                <div className="w-full h-full flex items-center justify-center text-[#D97706]/40">
                  <UtensilsCrossed size={48} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/95 text-[#292018] flex items-center justify-center shadow-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#0F4C5C]">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-lg font-black text-[#B45309] shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-xs text-[#78716C]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#57534E] leading-relaxed">
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
                          ? "توضیحات طبخ برای مطبخ (مثلاً: با پیاز و سماق اضافه)..."
                          : "Special note for kitchen..."
                      }
                      className="w-full bg-white border border-[#D97706]/30 focus:border-[#0F4C5C] rounded-xl px-4 py-3 text-xs font-bold text-[#292018] outline-none"
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
                        <div className="w-full py-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-white border border-[#D97706]/30 p-2 rounded-2xl">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-xl bg-[#FBF7F0] text-[#292018] border border-[#D97706]/25 flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base text-[#0F4C5C]">
                              {cItem.quantity.toLocaleString("fa-IR")}{" "}
                              {isFa ? "پرس" : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-xl bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-[#D97706] text-white px-6 py-2.5 rounded-xl font-black text-xs"
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
                            isFa
                              ? "به صورت‌سفارش اضافه شد"
                              : "Added to order slip",
                          );
                        }}
                        className="w-full bg-[#0F4C5C] hover:bg-[#0B3945] text-[#FDE68A] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>
                          {isFa ? "افزودن به صورت‌سفارش" : "Add to Order Slip"}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#0F4C5C] text-white py-3.5 rounded-2xl font-black text-xs"
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 w-full max-w-md shadow-2xl border-2 border-[#D97706]/30 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-[#D97706]/30 rounded-full mx-auto mb-5 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center">
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#0F4C5C]">
                      {isFa ? "رزرو میز پذیرایی" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#78716C] mt-0.5">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-9 h-9 rounded-xl bg-white border border-[#D97706]/25 text-[#57534E] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-5 animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-[26px] bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={40} strokeWidth={2.2} />
                </div>

                <div>
                  <h4 className="text-xl font-black text-[#0F4C5C] mb-1">
                    {isFa
                      ? "میز شما با افتخار رزرو شد!"
                      : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-[#78716C]">
                    {isFa
                      ? "مشخصات رزرو در دفتر پذیرش مجموعه ثبت گردید"
                      : "Your table has been reserved"}
                  </p>
                </div>

                <div className="bg-white border border-[#D97706]/25 rounded-2xl p-4 space-y-2.5 text-xs font-bold text-right">
                  <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#D97706]/25">
                    <span className="text-[#78716C]">
                      {isFa ? "شماره میز:" : "Table:"}
                    </span>
                    <span className="font-black text-[#0F4C5C] text-sm">
                      {isFa
                        ? `میز شماره ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `Table #${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#D97706]/25">
                    <span className="text-[#78716C]">
                      {isFa ? "نام مهمان:" : "Guest Name:"}
                    </span>
                    <span className="font-black text-[#292018]">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-dashed border-[#D97706]/25">
                    <span className="text-[#78716C]">
                      {isFa ? "شماره تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#78716C]">
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
                  className="w-full bg-[#0F4C5C] text-[#FDE68A] py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  {isFa ? "تایید و بازگشت" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-white border border-[#D97706]/20 px-3.5 py-2.5 rounded-xl text-[11px] font-bold">
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
                      <label className="text-xs font-black text-[#0F4C5C]">
                        {isFa
                          ? "۱. شماره میز مورد نظر را انتخاب کنید:"
                          : "1. Select an available table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#B45309]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-white rounded-2xl p-4 text-center text-xs font-bold text-[#78716C] border border-[#D97706]/20">
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
                              className={`relative py-3 px-1.5 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#0F4C5C] bg-[#0F4C5C] text-[#FDE68A] shadow-md scale-[1.03]"
                                  : isFree
                                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:border-emerald-400 active:scale-95"
                                    : t.state === "reserved"
                                      ? "border-amber-200 bg-amber-50/70 text-amber-700 opacity-65 cursor-not-allowed"
                                      : "border-rose-200 bg-rose-50/70 text-rose-700 opacity-65 cursor-not-allowed"
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FDE68A] text-[#0F4C5C] flex items-center justify-center">
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

                  <div className="bg-white border border-[#D97706]/25 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#292018] flex items-center gap-1.5">
                        <Users size={15} className="text-[#B45309]" />
                        {isFa ? "تعداد نفرات:" : "Guests:"}
                      </span>
                      <div className="flex items-center gap-2.5 bg-[#FBF7F0] border border-[#D97706]/25 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-lg bg-white text-[#292018] flex items-center justify-center"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="text-xs font-black min-w-[44px] text-center text-[#0F4C5C]">
                          {reserveGuests.toLocaleString("fa-IR")}{" "}
                          {isFa ? "نفر" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 rounded-lg bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-[#78716C] mb-2">
                        {isFa
                          ? "وعده یا ساعت حضور (اختیاری):"
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
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              reserveTime === slot
                                ? "bg-[#0F4C5C] text-[#FDE68A] border-[#0F4C5C]"
                                : "bg-[#FBF7F0] text-[#57534E] border-[#D97706]/20"
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
                        className={`absolute top-1/2 -translate-y-1/2 text-[#92400E]/60 ${
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
                            ? "نام و نام خانوادگی مهمان (الزامی)"
                            : "Full Name (required)"
                        }
                        className={`w-full bg-white border border-[#D97706]/30 focus:border-[#0F4C5C] rounded-xl py-3.5 text-xs font-bold text-[#292018] outline-none ${
                          isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={15}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#92400E]/60 ${
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
                        className="w-full bg-white border border-[#D97706]/30 focus:border-[#0F4C5C] rounded-xl py-3.5 px-10 text-left font-mono text-sm font-bold text-[#292018] outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "توضیحات (اختیاری - مثلاً: مهمانی خانوادگی / جمع شرکتی)"
                          : "Special note (optional)..."
                      }
                      className="w-full bg-white border border-[#D97706]/30 focus:border-[#0F4C5C] rounded-xl py-3 px-4 text-xs font-bold text-[#292018] outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-3 text-xs font-black">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#0F4C5C] hover:bg-[#0B3945] disabled:opacity-40 text-[#FDE68A] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all shrink-0"
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

      {/* دراور صورت‌سفارش (سبد خرید) */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] w-full max-w-xl mx-auto rounded-t-[32px] p-6 pb-8 shadow-2xl border-t-2 border-[#D97706]/35 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-[#D97706]/30 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-black text-[#0F4C5C]">
                  {isFa ? "صورت‌سفارش شما" : "Your Order Slip"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-[#B45309] mt-0.5">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-white border border-[#D97706]/25 text-[#57534E] flex items-center justify-center"
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
                    className="bg-white border border-[#D97706]/25 p-4 rounded-2xl space-y-3"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[#292018] mb-1 truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-[#B45309] font-bold">
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
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors border ${
                              isNoteOpen
                                ? "bg-[#D97706] text-white border-[#D97706]"
                                : "bg-[#FBF7F0] text-[#78716C] border-[#D97706]/25"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-[#FBF7F0] border border-[#D97706]/25 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-lg bg-white text-[#292018] flex items-center justify-center"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[18px] text-center text-[#0F4C5C]">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-lg bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center"
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
                            ? "سفارش ویژه برای مطبخ (مثلاً: با گوجه کبابی اضافه)..."
                            : "Special note for kitchen..."
                        }
                        className="w-full bg-[#FBF7F0] border border-[#D97706]/25 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#292018] outline-none"
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
                  isFa
                    ? "نام مهمان یا نام واحد / شرکت (اختیاری)"
                    : "Guest or Company Name (optional)"
                }
                className="w-full bg-white border border-[#D97706]/30 focus:border-[#0F4C5C] rounded-xl px-4 py-3.5 text-xs font-bold text-[#292018] outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#0F4C5C] hover:bg-[#0B3945] disabled:opacity-50 text-[#FDE68A] py-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>
                    {isFa ? "ارسال سفارش به مطبخ" : "Send to Kitchen"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال احضار سالن‌دار */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 w-full max-w-md shadow-2xl border-2 border-[#D97706]/30"
          >
            <div className="w-10 h-1 bg-[#D97706]/30 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center">
                  <BellRing size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#0F4C5C]">
                    {isFa ? "احضار سالن‌دار" : "Call Waiter"}
                  </h3>
                  <p className="text-xs font-bold text-[#78716C]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-9 h-9 rounded-xl bg-white border border-[#D97706]/25 text-[#57534E] flex items-center justify-center"
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    message === preset
                      ? "bg-[#0F4C5C] text-[#FDE68A] border-[#0F4C5C]"
                      : "bg-white border-[#D97706]/25 text-[#292018]"
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
              className="w-full bg-white border border-[#D97706]/30 rounded-xl p-3.5 text-xs font-bold outline-none resize-none mb-5"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-[#0F4C5C] hover:bg-[#0B3945] text-[#FDE68A] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
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

      {/* مودال پیام به مطبخ و سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 w-full max-w-md shadow-2xl border-2 border-[#D97706]/30"
          >
            <div className="w-10 h-1 bg-[#D97706]/30 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D97706] text-white flex items-center justify-center">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#0F4C5C]">
                    {isFa ? "پیام به مطبخ و سرآشپز" : "Note to Kitchen"}
                  </h3>
                  <p className="text-xs font-bold text-[#78716C]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-9 h-9 rounded-xl bg-white border border-[#D97706]/25 text-[#57534E] flex items-center justify-center"
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    message === preset
                      ? "bg-[#D97706] text-white border-[#D97706]"
                      : "bg-white border-[#D97706]/25 text-[#292018]"
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
                  ? "سفارش پخت یا حساسیت غذایی را بنویسید..."
                  : "Cooking preferences or allergies..."
              }
              className="w-full bg-white border border-[#D97706]/30 rounded-xl p-3.5 text-xs font-bold outline-none resize-none mb-5"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال به مطبخ" : "Send to Kitchen"}</span>
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
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FBF7F0] text-[#292018] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 shadow-2xl border-2 border-[#D97706]/30 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col"
          >
            <div className="w-10 h-1 bg-[#D97706]/30 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white border border-[#D97706]/25 text-[#0F4C5C] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
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
                className="w-9 h-9 rounded-xl bg-white border border-[#D97706]/25 text-[#57534E] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-5 shrink-0">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F4C5C] text-[#FDE68A] flex items-center justify-center mb-3">
                <Sparkles size={28} />
              </div>
              <span className="inline-block text-xs font-black text-[#92400E] bg-[#FFFBEB] border border-[#D97706]/30 px-3.5 py-1 rounded-xl mb-2">
                {isFa
                  ? `شماره فیش مطبخ: #${activeOrder.orderNumber}`
                  : `Order Slip #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-xl font-black text-[#0F4C5C]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "Order Served!"
                  : isFa
                    ? "مراحل آماده‌سازی در مطبخ"
                    : "Kitchen Preparation Status"}
              </h2>
            </div>

            <div className="bg-white border border-[#D97706]/25 rounded-2xl p-5 space-y-4 mb-6 overflow-y-auto no-scrollbar">
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
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isActive
                            ? "bg-[#0F4C5C] text-[#FDE68A]"
                            : "bg-[#FBF7F0] text-[#78716C] border border-[#D97706]/20"
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
                      <span className="block font-black text-sm text-[#292018]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#78716C] mt-0.5">
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
              className="w-full bg-[#0F4C5C] text-[#FDE68A] py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] shrink-0"
            >
              {isFa ? "بازگشت به فهرست غذا" : "Back to Menu"}
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

export default Template3;
