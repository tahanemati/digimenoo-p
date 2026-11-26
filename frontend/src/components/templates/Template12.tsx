import React, { useState, useEffect, useMemo } from "react";
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
    name: "ثبت سفارش",
    description: "سفارش شما با موفقیت دریافت و تایید شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "آشپزخانه مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سفارش آماده است و تا لحظاتی دیگر سر میز سرو می‌شود",
  },
];

const Template12: React.FC<TemplateProps> = ({
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

  // جستجوی iOS Spotlight
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    setTimeout(() => setToastMsg(null), 3000);
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

  // اتصال WebSocket پیگیری زنده سفارش فعال
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
        isFa ? "رزرو میز با موفقیت ثبت شد" : "Table reservation confirmed",
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
    if (!tableNumber) {
      showToast(
        isFa
          ? "برای ارسال درخواست، ابتدا بارکد روی میز را اسکن کنید"
          : "Scan your table QR code first",
      );
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    const success =
      type === "waiter" ? await callWaiter(message) : await callChef(message);
    setIsProcessing(false);
    if (success) {
      setWaiterModal(false);
      setChefModal(false);
      setMessage("");
      showToast(isFa ? "درخواست شما با موفقیت ارسال شد" : "Request sent");
    } else {
      showToast(isFa ? "خطا در ارسال درخواست" : "Request failed");
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
            ? `سفارش #${normalizedOrder.orderNumber} ثبت شد`
            : `Order #${normalizedOrder.orderNumber} placed`,
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

  const safeVenueName = venueData?.name || venueData?.Name || "کافه و رستوران";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";
  const safePhone = venueData?.phone || venueData?.Phone || "";

  const showWaiterAction =
    venueData?.callWaiterEnabled ?? venueData?.CallWaiterEnabled ?? true;
  const showChefAction =
    venueData?.callChefEnabled ?? venueData?.CallChefEnabled ?? true;

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const safeCategories = Array.isArray(menuData) ? menuData : [];

  // نتایج زنده جستجوی Spotlight
  const spotlightResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list: { prod: any; catTitleFa: string; catTitleEn: string }[] = [];
    for (const cat of safeCategories) {
      for (const prod of cat.products || []) {
        const match =
          !q ||
          String(prod.nameFa || "")
            .toLowerCase()
            .includes(q) ||
          String(prod.nameEn || "")
            .toLowerCase()
            .includes(q) ||
          String(prod.descriptionFa || "")
            .toLowerCase()
            .includes(q);
        if (match) {
          list.push({
            prod,
            catTitleFa: cat.nameFa || cat.name || "",
            catTitleEn: cat.nameEn || cat.nameFa || cat.name || "",
          });
        }
      }
    }
    return q ? list : list.slice(0, 8);
  }, [safeCategories, searchQuery]);

  const visibleMenu = safeCategories.filter(
    (cat) => selectedCategoryId === "all" || cat.id === selectedCategoryId,
  );

  const currentStageIndex = getActiveStageIndex();

  const timePresetsFa = ["۱۳:۰۰", "۱۶:۳۰", "۲۰:۰۰", "۲۱:۳۰"];
  const timePresetsEn = ["13:00", "16:30", "20:00", "21:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به آب و لیوان",
    "قاشق، چنگال و دستمال",
    "حضور سالن‌دار سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Water & glasses",
    "Cutlery & napkins",
    "Table assistance",
  ];

  const chefPresetsFa = [
    "بدون پیاز و سیر",
    "کم‌نمک و بدون ادویه تند",
    "سس جداگانه سرو شود",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "No onions or garlic",
    "Less salt & mild spices",
    "Sauce on the side",
    "Food allergy note",
  ];

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-[#0071E3]/15 overflow-x-hidden pb-32 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان ظریف بالای صفحه */}
      {toastMsg && (
        <div className="fixed top-[72px] inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#1D1D1F]/92 backdrop-blur-2xl text-white px-4 py-2.5 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.18)] font-bold text-xs flex items-center gap-2 border border-white/10">
            <span className="w-4 h-4 rounded-full bg-[#34C759] flex items-center justify-center shrink-0">
              <Check size={11} className="text-white" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: نوبار شیشه‌ای ثابت و بدون پرش (Apple Glass Navbar)
         ======================================================== */}
      <nav className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* هویت برند در نوبار */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[12px] bg-[#F5F5F7] border border-black/[0.06] overflow-hidden flex items-center justify-center shrink-0">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={17} className="text-[#0071E3]" />
              )}
            </div>

            <div className="min-w-0">
              <span className="block text-sm font-black text-[#1D1D1F] tracking-tight truncate">
                {safeVenueName}
              </span>
              {tableNumber ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#0071E3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  {isFa
                    ? `میز شماره ${tableNumber.toLocaleString("fa-IR")}`
                    : `Table #${tableNumber}`}
                </span>
              ) : (
                <span className="block text-[10px] font-semibold text-[#86868B]">
                  {isFa ? "منوی دیجیتال" : "Digital Menu"}
                </span>
              )}
            </div>
          </div>

          {/* دکمه‌های ابزار نوبار */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="h-9 px-3 rounded-full bg-[#34C759]/15 text-[#248A3D] text-xs font-black flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                <span>#{activeOrder.orderNumber}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSpotlightOpen(true)}
              aria-label={isFa ? "جستجو" : "Search"}
              className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] flex items-center justify-center transition-colors active:scale-95"
            >
              <Search size={16} />
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-9 px-3 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] font-black text-xs flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Globe size={14} className="text-[#0071E3]" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label={isFa ? "اطلاعات مجموعه" : "Venue Info"}
              className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEF] text-[#1D1D1F] flex items-center justify-center transition-colors active:scale-95"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================
          بخش ۲: معرفی مینیمال + نوار مستقیم درخواست گارسون، سرآشپز و رزرو
         ======================================================== */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-black/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.025)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
                {safeVenueName}
              </h1>
              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs sm:text-sm font-medium text-[#6E6E73] max-w-2xl leading-relaxed line-clamp-2">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}
            </div>

            {tableNumber && (
              <div className="self-start sm:self-center shrink-0 bg-[#0071E3]/10 text-[#0071E3] px-3.5 py-2 rounded-full text-xs font-black">
                {isFa
                  ? `سرویس سر میز ${tableNumber.toLocaleString("fa-IR")}`
                  : `Table #${tableNumber} Service`}
              </div>
            )}
          </div>

          {/* نوار سرویس‌های مستقیم میز: درخواست گارسون، درخواست سرآشپز و رزرو میز */}
          <div className="mt-5 pt-4 border-t border-black/[0.05] grid grid-cols-3 gap-2 sm:gap-3">
            {showWaiterAction && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setWaiterModal(true);
                }}
                className="bg-[#F5F5F7] hover:bg-[#0071E3] text-[#1D1D1F] hover:text-white rounded-[18px] py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] group"
              >
                <BellRing
                  size={17}
                  className="text-[#FF9500] group-hover:text-white transition-colors shrink-0"
                />
                <span className="text-[11px] sm:text-xs font-black truncate">
                  {isFa ? "درخواست گارسون" : "Call Waiter"}
                </span>
              </button>
            )}

            {showChefAction && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="bg-[#F5F5F7] hover:bg-[#1D1D1F] text-[#1D1D1F] hover:text-white rounded-[18px] py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] group"
              >
                <ChefHat
                  size={17}
                  className="text-[#34C759] group-hover:text-white transition-colors shrink-0"
                />
                <span className="text-[11px] sm:text-xs font-black truncate">
                  {isFa ? "درخواست سرآشپز" : "Call Chef"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={openReservationModal}
              className={`${
                !showWaiterAction && !showChefAction
                  ? "col-span-3"
                  : !showWaiterAction || !showChefAction
                    ? "col-span-2"
                    : ""
              } bg-[#F5F5F7] hover:bg-[#0071E3] text-[#1D1D1F] hover:text-white rounded-[18px] py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] group`}
            >
              <CalendarCheck
                size={17}
                className="text-[#0071E3] group-hover:text-white transition-colors shrink-0"
              />
              <span className="text-[11px] sm:text-xs font-black truncate">
                {isFa ? "رزرو میز" : "Reserve"}
                {tablesList.length > 0 && (
                  <span className="mx-1 text-[10px] opacity-70">
                    ({availableTablesCount.toLocaleString("fa-IR")})
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۳: نوار دسته‌بندی‌های چسبان دقیقاً زیر نوبار (بدون هم‌پوشانی)
         ======================================================== */}
      {safeCategories.length > 0 && (
        <div className="sticky top-16 z-20 bg-[#F5F5F7]/90 backdrop-blur-2xl border-b border-black/[0.05] py-3">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("all")}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition-all ${
                selectedCategoryId === "all"
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.05]"
              }`}
            >
              {isFa ? "همه دسته‌ها" : "All"}
            </button>

            {safeCategories.map((cat: any) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? "bg-[#1D1D1F] text-white shadow-sm"
                      : "bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.05]"
                  }`}
                >
                  {isFa
                    ? cat.nameFa || cat.name
                    : cat.nameEn || cat.nameFa || cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۴: گرید هم‌ابعاد و تراز Apple Store برای کارت‌های محصول
         ======================================================== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-9">
        {visibleMenu.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-black/[0.05] py-16 text-center">
            <UtensilsCrossed size={32} className="text-black/15 mx-auto mb-3" />
            <p className="text-xs font-bold text-[#86868B]">
              {isFa ? "محصولی در منو ثبت نشده است." : "Menu is empty."}
            </p>
          </div>
        ) : (
          visibleMenu.map((cat: any) => {
            const hasProducts =
              Array.isArray(cat.products) && cat.products.length > 0;
            const catTitle = isFa
              ? cat.nameFa || cat.name
              : cat.nameEn || cat.nameFa || cat.name;

            return (
              <section key={cat.id}>
                <div className="flex items-baseline justify-between mb-4 px-1">
                  <h2 className="text-lg sm:text-xl font-black text-[#1D1D1F] tracking-tight">
                    {catTitle}
                  </h2>
                  <span className="text-xs font-bold text-[#86868B]">
                    {(cat.products?.length || 0).toLocaleString("fa-IR")}{" "}
                    {isFa ? "آیتم" : "items"}
                  </span>
                </div>

                {!hasProducts ? (
                  <div className="bg-white rounded-[22px] border border-black/[0.05] p-6 text-center text-xs font-bold text-[#86868B]">
                    {isFa ? "آیتمی در این دسته وجود ندارد." : "No items yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
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
                      const canOrder =
                        Boolean(venueData?.orderingEnabled) &&
                        Boolean(tableNumber) &&
                        isAvailable;

                      return (
                        <article
                          key={prod?.id}
                          onClick={() => openProductShowcase(prod)}
                          className={`group cursor-pointer h-full flex flex-col bg-white rounded-[22px] sm:rounded-[26px] overflow-hidden border transition-all duration-300 ${
                            cartItem
                              ? "border-[#0071E3] ring-1 ring-[#0071E3]/25 shadow-[0_10px_28px_rgba(0,113,227,0.1)]"
                              : "border-black/[0.06] shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]"
                          } ${!isAvailable ? "opacity-60" : ""}`}
                        >
                          {/* قاب تصویر قفل‌شده با نسبت دقیق 4:3 */}
                          <div className="relative w-full aspect-[4/3] bg-[#F5F5F7] overflow-hidden shrink-0">
                            {prod?.imageUrl ? (
                              <img
                                src={getFullImageUrl(prod.imageUrl)}
                                alt={isFa ? prod.nameFa : prod.nameEn}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-black/15">
                                <UtensilsCrossed size={28} strokeWidth={1.4} />
                              </div>
                            )}

                            {/* بج کم‌موجود یا ناموجود روی گوشه بالای تصویر */}
                            {!isAvailable ? (
                              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-white/95 text-[#D70015] text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                                  {isFa ? "ناموجود" : "Sold Out"}
                                </span>
                              </div>
                            ) : (
                              hasFiniteStock &&
                              Number(prod.stock) <= 5 && (
                                <span
                                  className={`absolute top-2.5 ${
                                    isFa ? "right-2.5" : "left-2.5"
                                  } bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-full`}
                                >
                                  {isFa
                                    ? `${prod.stock} مانده`
                                    : `${prod.stock} left`}
                                </span>
                              )
                            )}

                            {/* دکمه شیشه‌ای + یا شمارنده روی گوشه پایین تصویر (بدون تداخل با متن و قیمت) */}
                            {canOrder && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute bottom-2.5 ${
                                  isFa ? "left-2.5" : "right-2.5"
                                } z-10`}
                              >
                                {cartItem ? (
                                  <div className="flex items-center gap-1 bg-[#0071E3] text-white rounded-full p-0.5 shadow-[0_6px_18px_rgba(0,113,227,0.4)]">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(prod.id)}
                                      className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                      <Minus size={12} strokeWidth={3} />
                                    </button>
                                    <span className="text-[11px] font-black min-w-[16px] text-center tabular-nums">
                                      {cartItem.quantity.toLocaleString(
                                        "fa-IR",
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={Boolean(reachedMaxStock)}
                                      onClick={() => addToCart(prod)}
                                      className="w-6 h-6 rounded-full bg-white text-[#0071E3] disabled:opacity-40 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                      <Plus size={12} strokeWidth={3} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={isFa ? "افزودن" : "Add"}
                                    onClick={() => addToCart(prod)}
                                    className="w-8 h-8 rounded-full bg-white/95 hover:bg-[#0071E3] text-[#1D1D1F] hover:text-white backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.16)] flex items-center justify-center transition-all active:scale-90"
                                  >
                                    <Plus size={16} strokeWidth={2.6} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* بدنه متنی یکدست و تراز */}
                          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
                            <div className="space-y-1">
                              <h3 className="font-black text-[13px] sm:text-[14px] text-[#1D1D1F] leading-snug line-clamp-2">
                                {isFa
                                  ? prod?.nameFa
                                  : prod?.nameEn || prod?.nameFa}
                              </h3>

                              {(isFa
                                ? prod?.descriptionFa
                                : prod?.descriptionEn ||
                                  prod?.descriptionFa) && (
                                <p className="text-[11px] font-medium text-[#86868B] line-clamp-2 leading-relaxed">
                                  {isFa
                                    ? prod?.descriptionFa
                                    : prod?.descriptionEn ||
                                      prod?.descriptionFa}
                                </p>
                              )}
                            </div>

                            <div className="pt-2.5 border-t border-black/[0.05] flex items-baseline justify-between gap-1">
                              <div className="flex items-baseline gap-1 min-w-0">
                                <span className="font-black text-[13.5px] sm:text-[15px] text-[#1D1D1F] tabular-nums truncate">
                                  {Number(prod?.price || 0).toLocaleString(
                                    "fa-IR",
                                  )}
                                </span>
                                <span className="text-[10px] font-bold text-[#86868B] shrink-0">
                                  {isFa ? "تومان" : "IRT"}
                                </span>
                              </div>

                              {cartItem && (
                                <span className="text-[10px] font-black text-[#0071E3] shrink-0">
                                  ×{cartItem.quantity.toLocaleString("fa-IR")}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}

        {/* فوتر مینیمال ترنج */}
        <footer className="pt-8 pb-4 border-t border-black/[0.06] text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#86868B] hover:text-[#0071E3] transition-colors"
          >
            <Sparkles size={12} className="text-[#0071E3]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۵: نوار سبد خرید شناور پایین صفحه (Apple Bag Pill)
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-30 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#1D1D1F]/95 hover:bg-black backdrop-blur-2xl text-white p-2.5 px-4 rounded-full font-black flex items-center justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.28)] border border-white/15 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-xs font-black tabular-nums">
                {totalItems.toLocaleString("fa-IR")}
              </span>
              <div className="text-right">
                <span className="block text-xs sm:text-sm font-black leading-tight">
                  {isFa ? "مشاهده و ثبت سفارش" : "Review Bag"}
                </span>
                {tableNumber && (
                  <span className="block text-[10px] font-bold text-white/60">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </span>
                )}
              </div>
            </div>

            <span className="bg-white/12 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black tabular-nums">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] font-bold text-white/70">
                {isFa ? "تومان" : "IRT"}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال ۱: جستجوی شناور iOS Spotlight
         ======================================================== */}
      {isSpotlightOpen && (
        <div
          onClick={() => setIsSpotlightOpen(false)}
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[26px] border border-white shadow-[0_30px_80px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-3.5 border-b border-black/[0.06] flex items-center gap-2.5">
              <Search size={18} className="text-[#86868B] shrink-0 mr-1" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa ? "جستجو در کل منو..." : "Spotlight search menu..."
                }
                className="flex-1 bg-transparent text-sm font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-6 h-6 rounded-full bg-black/[0.07] text-[#6E6E73] flex items-center justify-center"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSpotlightOpen(false)}
                className="text-xs font-black text-[#0071E3] px-2"
              >
                {isFa ? "بستن" : "Cancel"}
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-black/[0.05] no-scrollbar">
              {spotlightResults.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-[#86868B]">
                  {isFa ? "نتیجه‌ای یافت نشد." : "No results found."}
                </div>
              ) : (
                spotlightResults.map(({ prod, catTitleFa, catTitleEn }) => {
                  const hasFiniteStock =
                    prod?.stock !== null && prod?.stock !== undefined;
                  const isAvail =
                    prod?.isAvailableInMenu !== false &&
                    (!hasFiniteStock || Number(prod.stock) > 0);
                  const canOrder =
                    Boolean(venueData?.orderingEnabled) &&
                    Boolean(tableNumber) &&
                    isAvail;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setIsSpotlightOpen(false);
                        openProductShowcase(prod);
                      }}
                      className="cursor-pointer p-3.5 px-4 hover:bg-black/[0.03] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[14px] bg-[#F5F5F7] overflow-hidden shrink-0 flex items-center justify-center">
                          {prod?.imageUrl ? (
                            <img
                              src={getFullImageUrl(prod.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UtensilsCrossed
                              size={16}
                              className="text-black/15"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-[#1D1D1F] truncate">
                            {isFa ? prod?.nameFa : prod?.nameEn || prod?.nameFa}
                          </h4>
                          <p className="text-[11px] font-bold text-[#86868B] truncate">
                            {isFa ? catTitleFa : catTitleEn} •{" "}
                            {Number(prod?.price || 0).toLocaleString("fa-IR")}{" "}
                            {isFa ? "تومان" : "IRT"}
                          </p>
                        </div>
                      </div>

                      {canOrder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod);
                            showToast(
                              isFa ? "به سفارش اضافه شد" : "Added to bag",
                            );
                          }}
                          className="w-8 h-8 rounded-full bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white flex items-center justify-center shrink-0 transition-colors"
                        >
                          <Plus size={15} strokeWidth={2.6} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۲: مشخصات مجموعه (iOS Info Sheet)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] rounded-t-[30px] sm:rounded-[30px] p-5 pb-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-white overflow-hidden flex items-center justify-center shadow-2xs">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={22} className="text-[#0071E3]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {safeVenueName}
                  </h3>
                  <span className="text-[11px] font-bold text-[#86868B]">
                    {isFa ? "درباره مجموعه" : "About Venue"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <div className="bg-white rounded-[20px] p-4 mb-3 text-xs font-medium text-[#424245] leading-relaxed">
                {isFa ? safeAboutFa : safeAboutEn}
              </div>
            )}

            {(safeAddress || safePhone) && (
              <div className="bg-white rounded-[20px] divide-y divide-black/[0.05] text-xs font-bold text-[#1D1D1F] overflow-hidden">
                {safeAddress && (
                  <div className="p-4 flex items-start gap-2.5">
                    <MapPin
                      size={16}
                      className="text-[#0071E3] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="p-4 flex items-center gap-2.5">
                    <Phone size={16} className="text-[#0071E3] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳: جزئیات محصول (Apple Product Sheet)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[30px] sm:rounded-[30px] overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-200"
          >
            <div className="relative w-full aspect-[16/10] bg-[#F5F5F7]">
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
                <div className="w-full h-full flex items-center justify-center text-black/15">
                  <UtensilsCrossed size={48} strokeWidth={1.3} />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xl text-[#1D1D1F] flex items-center justify-center shadow-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 pb-8 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#1D1D1F] leading-snug">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-lg font-black text-[#1D1D1F] tabular-nums shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-[11px] font-bold text-[#86868B]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs sm:text-sm font-medium text-[#6E6E73] leading-relaxed">
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
                          ? "توضیحات برای آشپزخانه (اختیاری)..."
                          : "Special note for kitchen..."
                      }
                      className="w-full bg-[#F5F5F7] border border-transparent focus:border-[#0071E3] focus:bg-white rounded-[16px] px-4 py-3 text-xs font-bold text-[#1D1D1F] outline-none transition-colors"
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
                        <div className="w-full py-3.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-[#F5F5F7] p-1.5 rounded-full">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-full bg-white text-[#1D1D1F] shadow-2xs flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base text-[#1D1D1F] min-w-[20px] text-center tabular-nums">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-full bg-[#0071E3] text-white flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-[#1D1D1F] text-white px-6 py-2.5 rounded-full font-black text-xs"
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
                            isFa ? "به سبد سفارش اضافه شد" : "Added to bag",
                          );
                        }}
                        className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,113,227,0.3)] active:scale-95 transition-all"
                      >
                        <Plus size={17} strokeWidth={2.6} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Bag"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#F5F5F7] text-[#1D1D1F] py-3.5 rounded-full font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۴: رزرو آنلاین میزها (iOS Live Reservation Sheet)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#0071E3] text-white flex items-center justify-center">
                  <CalendarCheck size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#1D1D1F]">
                      {isFa ? "رزرو آنلاین میز" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#86868B]">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#1D1D1F]">
                    {isFa ? "رزرو شما تایید شد" : "Reservation Confirmed"}
                  </h4>
                  <p className="text-xs font-bold text-[#86868B] mt-0.5">
                    {isFa
                      ? "میز انتخابی با موفقیت به نام شما ثبت گردید"
                      : "Your table is booked and ready"}
                  </p>
                </div>

                <div className="bg-white rounded-[20px] divide-y divide-black/[0.05] text-xs font-bold text-right overflow-hidden">
                  <div className="flex justify-between p-3.5">
                    <span className="text-[#86868B]">
                      {isFa ? "شماره میز" : "Table"}
                    </span>
                    <span className="font-black text-[#0071E3]">
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-[#86868B]">
                      {isFa ? "نام مهمان" : "Guest"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-[#86868B]">
                      {isFa ? "شماره تماس" : "Phone"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className="text-[#86868B]">
                      {isFa ? "نفرات و زمان" : "Party"}
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
                  className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full font-black text-sm"
                >
                  {isFa ? "بازگشت به منو" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-[16px] text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#248A3D]">
                      <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#C93400]">
                      <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#D70015]">
                      <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black text-[#1D1D1F]">
                        {isFa ? "انتخاب شماره میز" : "Select a table"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#0071E3]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-white rounded-[18px] p-4 text-center text-xs font-bold text-[#86868B]">
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
                              className={`py-2.5 rounded-[16px] border-2 transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#0071E3] bg-[#0071E3] text-white shadow-[0_6px_16px_rgba(0,113,227,0.3)]"
                                  : isFree
                                    ? "border-transparent bg-white text-[#1D1D1F] hover:border-[#0071E3]/40"
                                    : "border-transparent bg-black/[0.04] text-[#86868B] opacity-55 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-xs font-black tabular-nums">
                                {isFa
                                  ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                  : `#${t.tableNumber}`}
                              </span>
                              <span
                                className={`text-[9px] font-bold mt-0.5 ${
                                  isSelected
                                    ? "text-white/85"
                                    : isFree
                                      ? "text-[#248A3D]"
                                      : t.state === "reserved"
                                        ? "text-[#C93400]"
                                        : "text-[#D70015]"
                                }`}
                              >
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

                  <div className="bg-white rounded-[20px] p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className="text-[#0071E3]" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-2xs"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black min-w-[34px] text-center tabular-nums">
                          {reserveGuests.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#0071E3] text-white flex items-center justify-center"
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
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            reserveTime === slot
                              ? "bg-[#1D1D1F] text-white"
                              : "bg-[#F5F5F7] text-[#6E6E73]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[20px] divide-y divide-black/[0.06] overflow-hidden">
                    <div className="relative">
                      <User
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
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
                        className={`w-full bg-transparent py-3.5 text-xs font-bold outline-none ${
                          isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
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
                        className="w-full bg-transparent py-3.5 px-10 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa ? "توضیحات (اختیاری)..." : "Note (optional)..."
                      }
                      className="w-full bg-transparent py-3.5 px-4 text-xs font-bold outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-[#FF3B30]/10 text-[#D70015] rounded-[16px] p-3 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,113,227,0.3)] shrink-0"
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
          مودال ۵: دراور سبد سفارش (iOS Bag Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] w-full max-w-lg mx-auto rounded-t-[30px] p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-8 duration-200"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-[#1D1D1F]">
                  {isFa ? "سبد سفارش" : "Your Bag"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-[#0071E3]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white rounded-[22px] divide-y divide-black/[0.05] mb-4 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div key={pid} className="p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[#1D1D1F] truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-[#6E6E73] font-bold mt-0.5 tabular-nums">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          {isFa ? "تومان" : "IRT"}
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isNoteOpen
                                ? "bg-[#0071E3] text-white"
                                : "bg-[#F5F5F7] text-[#6E6E73]"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-white text-[#1D1D1F] flex items-center justify-center shadow-2xs"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center tabular-nums">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#0071E3] text-white flex items-center justify-center"
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
                            : "Note for kitchen..."
                        }
                        className="w-full bg-[#F5F5F7] rounded-[12px] px-3 py-2 text-xs font-bold outline-none"
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
                className="w-full bg-white rounded-[16px] px-4 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white py-3.5 rounded-full font-black text-sm shadow-[0_12px_28px_rgba(0,113,227,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={16} />
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

      {/* ========================================================
          مودال ۶ و ۷: درخواست گارسون و درخواست سرآشپز
         ======================================================== */}
      {(waiterModal || chefModal) && (
        <div
          onClick={() => {
            if (isProcessing) return;
            setWaiterModal(false);
            setChefModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${
                    waiterModal
                      ? "bg-[#FF9500]/12 text-[#C93400]"
                      : "bg-[#34C759]/12 text-[#248A3D]"
                  }`}
                >
                  {waiterModal ? <BellRing size={19} /> : <ChefHat size={19} />}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {waiterModal
                      ? isFa
                        ? "درخواست گارسون"
                        : "Call Waiter"
                      : isFa
                        ? "درخواست و پیام به سرآشپز"
                        : "Note to Chef"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#86868B]">
                    {tableNumber
                      ? isFa
                        ? `میز شماره ${tableNumber.toLocaleString("fa-IR")}`
                        : `Table #${tableNumber}`
                      : isFa
                        ? "نیازمند اسکن بارکد میز"
                        : "Table QR required"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWaiterModal(false);
                  setChefModal(false);
                }}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {!tableNumber && (
              <div className="mb-3.5 bg-[#FF9500]/10 text-[#A65300] rounded-[16px] p-3 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  {isFa
                    ? "برای ارسال درخواست مستقیم، لطفاً بارکد QR روی میز خود را اسکن کنید."
                    : "Please scan your table QR code to send requests directly."}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3.5">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    message === preset
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F]"
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
              className="w-full bg-[#F5F5F7] rounded-[18px] p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing || !tableNumber}
              onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
              className="w-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-45 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors"
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

      {/* ========================================================
          مودال ۸: پیگیری زنده سفارش (iOS Live Activity Sheet)
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] w-full max-w-md rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white text-[#1D1D1F] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs"
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
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black text-[#1D1D1F]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش تحویل داده شد"
                    : "Order Completed!"
                  : isFa
                    ? "وضعیت زنده سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-white rounded-[22px] p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                          ? "bg-[#34C759] text-white"
                          : isActive
                            ? "bg-[#0071E3] text-white"
                            : "bg-[#F5F5F7] text-[#86868B]"
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
                      <span className="block font-black text-xs sm:text-sm text-[#1D1D1F]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#86868B] mt-0.5">
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
              className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full font-black text-sm shrink-0"
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

export default Template12;
