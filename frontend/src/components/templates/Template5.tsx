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
  LayoutGrid,
  Crown,
  ChevronLeft,
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
    description: "سفارش شما با موفقیت ثبت و تایید شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "سرآشپز مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سفارش آماده است و تا لحظاتی دیگر سر میز سرو می‌شود",
  },
];

const Template5: React.FC<TemplateProps> = ({
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

  // شیت‌های اختصاصی داک پایین
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isConciergeSheetOpen, setIsConciergeSheetOpen] = useState(false);

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

  const safeVenueName = venueData?.name || venueData?.Name || "لانژ و رستوران";
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

  const timePresetsFa = ["۱۹:۳۰", "۲۰:۳۰", "۲۱:۳۰", "۲۲:۳۰"];
  const timePresetsEn = ["19:30", "20:30", "21:30", "22:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "تمدید نوشیدنی / آب",
    "ظروف و دستمال اضافه",
    "حضور میزبان سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Refill drinks / water",
    "Extra tableware",
    "Table host assistance",
  ];

  const chefPresetsFa = [
    "استیک مدیوم‌رِر (Medium Rare) باشد",
    "استیک کاملاً پخته (Well Done) باشد",
    "سس جداگانه سرو شود",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "Medium Rare steak",
    "Well Done cooking",
    "Sauce on the side",
    "Dietary allergy note",
  ];

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSearchQuery("");
    setIsCategorySheetOpen(false);
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  return (
    <div
      className={`min-h-screen bg-[#08080A] text-[#F8F6F0] font-sans antialiased selection:bg-[#D4AF37]/30 overflow-x-hidden relative ${
        totalItems > 0 ? "pb-44" : "pb-28"
      }`}
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* هاله نوری شامپاینی در بالای صفحه */}
      <div className="fixed top-[-120px] left-1/2 -translate-x-1/2 w-[560px] h-[340px] bg-[#D4AF37]/[0.09] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* اعلان زنده لوکس */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#18181D]/95 backdrop-blur-2xl text-[#F8F6F0] px-5 py-3 rounded-full shadow-[0_14px_40px_rgba(0,0,0,0.65)] font-bold text-xs flex items-center gap-2.5 border border-[#D4AF37]/40">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#C59B27] flex items-center justify-center shrink-0">
              <Check size={12} className="text-[#09090B]" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: هدر سینمایی لوکس (Noir Cinematic Header)
         ======================================================== */}
      <header className="relative z-10 max-w-4xl mx-auto px-4 pt-5 pb-4">
        <div className="relative rounded-[30px] overflow-hidden bg-[#121216] border border-[#D4AF37]/20 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {/* لایه کاور محو از لوگوی مجموعه */}
          {safeLogo && (
            <img
              src={getFullImageUrl(safeLogo)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.14] blur-2xl scale-125 pointer-events-none"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0D]/40 via-[#121216]/85 to-[#121216] pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-7">
            {/* نوار ابزار بالای هدر */}
            <div className="flex items-center justify-between gap-2 mb-5">
              {tableNumber ? (
                <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-3 py-1.5 rounded-full flex items-center gap-2 text-[11px] font-black text-[#F3E5AB]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] animate-pulse" />
                  <span>
                    {isFa
                      ? `میز VIP شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </span>
                </div>
              ) : (
                <span className="bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-[#D4AF37] flex items-center gap-1.5 tracking-wide">
                  <Crown size={12} />
                  {isFa ? "تجربه پذیرایی لوکس" : "FINE DINING LOUNGE"}
                </span>
              )}

              <div className="flex items-center gap-2">
                {activeOrder && (
                  <button
                    type="button"
                    onClick={() => setIsTrackerOpen(true)}
                    className="bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] px-3 py-1.5 rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-transform"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#09090B] animate-ping" />
                    <span>
                      {isFa
                        ? `فیش #${activeOrder.orderNumber}`
                        : `#${activeOrder.orderNumber}`}
                    </span>
                  </button>
                )}

                {venueData?.bilingual && (
                  <button
                    type="button"
                    onClick={() => setLanguage(isFa ? "en" : "fa")}
                    className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[#F8F6F0] font-black text-[11px] transition-colors"
                  >
                    <Globe size={12} className="text-[#D4AF37]" />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* هویت مرکزی لوگو و نام مجموعه */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2px] bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#6B4F12] shadow-[0_0_30px_rgba(212,175,55,0.25)] mb-3.5">
                <div className="w-full h-full rounded-full bg-[#0D0D11] overflow-hidden flex items-center justify-center">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={30} className="text-[#D4AF37]" />
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8F6F0]">
                {safeVenueName}
              </h1>

              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-zinc-400 max-w-md line-clamp-2 leading-relaxed mt-2">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}

              {/* خط تزئینی الماسی طلایی */}
              <div className="flex items-center gap-3 w-40 mt-4">
                <span className="h-[1px] flex-1 bg-gradient-to-l from-[#D4AF37]/60 to-transparent" />
                <span className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]" />
                <span className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: نوار چسبان دسته‌بندی‌ها + نوار جستجوی کشویی
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#08080A]/88 backdrop-blur-2xl border-b border-white/[0.06] py-3">
        <div className="max-w-4xl mx-auto px-4 space-y-2.5">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <Search
                size={15}
                className={`absolute top-1/2 -translate-y-1/2 text-[#D4AF37] ${
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
                    ? "جستجو در منو (استیک، پاستا، موکتل...)"
                    : "Search fine dining menu..."
                }
                className={`w-full bg-[#141419] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-2xl py-2.5 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none ${
                  isFa ? "pr-10 pl-9" : "pl-10 pr-9"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className={`absolute top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white ${
                  isFa ? "left-3.5" : "right-3.5"
                }`}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {safeCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] border-transparent shadow-[0_4px_16px_rgba(212,175,55,0.28)]"
                    : "bg-white/[0.04] text-zinc-400 hover:text-[#F8F6F0] border-white/[0.07]"
                }`}
              >
                {isFa ? "همه انتخاب‌ها" : "All Selections"}
              </button>

              {safeCategories.map((cat: any) => {
                const isSelected =
                  selectedCategoryId === cat.id && !searchQuery.trim();
                const catTitle = isFa
                  ? cat.nameFa || cat.name
                  : cat.nameEn || cat.nameFa || cat.name;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSearchQuery("");
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                      isSelected
                        ? "bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] border-transparent shadow-[0_4px_16px_rgba(212,175,55,0.28)]"
                        : "bg-white/[0.04] text-zinc-400 hover:text-[#F8F6F0] border-white/[0.07]"
                    }`}
                  >
                    {catTitle}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          بخش ۳: کارت‌های عریض لوکس محصولات (Noir Editorial Feed)
         ======================================================== */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-5">
        {!tableNumber && (
          <div className="mb-6 bg-[#141418] border border-[#D4AF37]/25 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold text-zinc-300 leading-relaxed">
              {isFa
                ? "برای ثبت سفارش مستقیم، بارکد میز خود را اسکن کنید یا میز VIP رزرو نمایید."
                : "Scan your table QR to order directly or book a table."}
            </p>
            <button
              type="button"
              onClick={openReservationModal}
              className="shrink-0 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F3E5AB] border border-[#D4AF37]/40 px-3.5 py-1.5 rounded-full text-[11px] font-black transition-colors"
            >
              {isFa ? "رزرو میز" : "Reserve"}
            </button>
          </div>
        )}

        {filteredMenu.length === 0 ? (
          <div className="bg-[#121216] border border-white/[0.07] rounded-[28px] py-16 text-center">
            <UtensilsCrossed
              size={34}
              className="text-[#D4AF37]/30 mx-auto mb-3"
            />
            <p className="text-xs font-bold text-zinc-400">
              {isFa ? "آیتمی با این جستجو یافت نشد." : "No items matched."}
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
                  {/* عنوان لوکس بخش */}
                  <div className="flex items-center justify-between gap-3 mb-4 px-1">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rotate-45 bg-[#D4AF37] shrink-0" />
                      <h2 className="text-lg sm:text-xl font-black text-[#F8F6F0] tracking-tight">
                        {catTitle}
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500 border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 rounded-full">
                      {(cat.products?.length || 0).toLocaleString("fa-IR")}{" "}
                      {isFa ? "آیتم" : "items"}
                    </span>
                  </div>

                  {!hasProducts ? (
                    <div className="bg-[#121216] border border-white/[0.06] rounded-[24px] p-6 text-center text-xs font-bold text-zinc-500">
                      {isFa
                        ? "در حال حاضر آیتمی در این بخش ثبت نشده است."
                        : "No items in this category yet."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        const hasImage = Boolean(prod?.imageUrl);

                        return (
                          <article
                            key={prod?.id}
                            onClick={() => openProductShowcase(prod)}
                            className={`group cursor-pointer bg-[#121216] rounded-[26px] overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                              cartItem
                                ? "border-[#D4AF37]/55 shadow-[0_12px_35px_rgba(212,175,55,0.12)]"
                                : "border-white/[0.07] hover:border-[#D4AF37]/30 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                            } ${!isAvailable ? "opacity-55" : ""}`}
                          >
                            {/* تصویر عریض سینمایی در بالای کارت (در صورت وجود عکس) */}
                            {hasImage && (
                              <div className="relative h-44 sm:h-48 w-full bg-[#1A1A20] overflow-hidden">
                                <img
                                  src={getFullImageUrl(prod.imageUrl)}
                                  alt={isFa ? prod.nameFa : prod.nameEn}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                {/* گرادیانت محو به بدنه مشکی کارت */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/20 to-transparent" />

                                {isAvailable &&
                                  hasFiniteStock &&
                                  Number(prod.stock) <= 5 && (
                                    <span className="absolute top-3 right-3 bg-[#09090B]/80 backdrop-blur-md border border-[#D4AF37]/40 text-[#F3E5AB] text-[10px] font-black px-2.5 py-1 rounded-full">
                                      {isFa
                                        ? `فقط ${prod.stock} عدد باقیمانده`
                                        : `Only ${prod.stock} left`}
                                    </span>
                                  )}

                                {!isAvailable && (
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="border border-white/25 bg-black/75 text-zinc-200 text-xs font-black px-4 py-1.5 rounded-full">
                                      {isFa ? "اتمام موجودی" : "Sold Out"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* بدنه محتوای کارت */}
                            <div
                              className={`p-4 sm:p-5 flex-1 flex flex-col justify-between ${
                                hasImage ? "-mt-3 relative z-10" : ""
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-black text-[15px] sm:text-base text-[#F8F6F0] leading-snug">
                                    {isFa
                                      ? prod?.nameFa
                                      : prod?.nameEn || prod?.nameFa}
                                  </h3>

                                  {!hasImage &&
                                    isAvailable &&
                                    hasFiniteStock &&
                                    Number(prod.stock) <= 5 && (
                                      <span className="shrink-0 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {isFa
                                          ? `${prod.stock} مانده`
                                          : `${prod.stock} left`}
                                      </span>
                                    )}
                                </div>

                                {(isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn ||
                                    prod?.descriptionFa) && (
                                  <p className="text-xs font-medium text-zinc-400 line-clamp-2 leading-relaxed mt-1.5">
                                    {isFa
                                      ? prod?.descriptionFa
                                      : prod?.descriptionEn ||
                                        prod?.descriptionFa}
                                  </p>
                                )}
                              </div>

                              {/* نوار قیمت شامپاینی و کنترل تعداد */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2"
                              >
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-black text-base sm:text-lg text-[#E5C158]">
                                    {Number(prod?.price || 0).toLocaleString(
                                      "fa-IR",
                                    )}
                                  </span>
                                  <span className="text-[10px] font-bold text-zinc-400">
                                    {isFa ? "تومان" : "IRT"}
                                  </span>
                                </div>

                                {venueData?.orderingEnabled && tableNumber && (
                                  <>
                                    {!isAvailable ? (
                                      <span className="text-[10px] font-black text-rose-300 bg-rose-500/15 border border-rose-500/25 px-3 py-1 rounded-full">
                                        {isFa ? "ناموجود" : "Sold out"}
                                      </span>
                                    ) : cartItem ? (
                                      <div className="flex items-center gap-2 bg-[#1D1D24] border border-[#D4AF37]/40 rounded-full p-0.5">
                                        <button
                                          type="button"
                                          disabled={Boolean(reachedMaxStock)}
                                          onClick={() => addToCart(prod)}
                                          className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#C59B27] disabled:opacity-35 text-[#09090B] flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Plus size={14} strokeWidth={2.8} />
                                        </button>
                                        <span className="text-xs font-black text-[#F8F6F0] min-w-[18px] text-center">
                                          {cartItem.quantity.toLocaleString(
                                            "fa-IR",
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFromCart(prod.id)
                                          }
                                          className="w-7 h-7 rounded-full bg-white/10 text-[#F8F6F0] flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Minus size={14} strokeWidth={2.8} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => addToCart(prod)}
                                        className="bg-white/[0.06] hover:bg-gradient-to-l hover:from-[#D4AF37] hover:to-[#E5C158] text-[#F3E5AB] hover:text-[#09090B] border border-[#D4AF37]/30 px-3.5 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                      >
                                        <Plus size={14} strokeWidth={2.6} />
                                        <span>{isFa ? "افزودن" : "Add"}</span>
                                      </button>
                                    )}
                                  </>
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
            })}
          </div>
        )}

        {/* فوتر ظریف برند ترنج */}
        <footer className="mt-12 pt-5 border-t border-white/[0.06] text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-[#D4AF37] transition-colors"
          >
            <Sparkles size={12} className="text-[#D4AF37]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۴: داک شیشه‌ای تیره پایین صفحه (Noir Bottom Dock)
         ======================================================== */}
      <div className="fixed bottom-3.5 inset-x-3 z-40 flex flex-col items-center gap-2.5 pointer-events-none">
        {/* نوار طلایی سبد خرید (در صورت وجود آیتم در سبد) */}
        {totalItems > 0 && (
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto w-full max-w-md bg-gradient-to-l from-[#C59B27] via-[#DFB943] to-[#F3E5AB] text-[#09090B] py-3 px-4 rounded-2xl font-black flex items-center justify-between shadow-[0_14px_35px_rgba(212,175,55,0.3)] active:scale-[0.98] transition-all animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#09090B] text-[#F3E5AB] flex items-center justify-center text-xs font-black">
                {totalItems.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs sm:text-sm font-black">
                {isFa ? "مشاهده و ثبت صورت‌سفارش" : "Checkout Order"}
              </span>
            </div>

            <span className="text-xs sm:text-sm font-black">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] opacity-80">
                {isFa ? "تومان" : "IRT"}
              </span>
            </span>
          </button>
        )}

        {/* نوار ناوبری شیشه‌ای ۴ دکمه‌ای برای دسترسی سریع با شست */}
        <nav
          aria-label="ناوبری سریع منو"
          className="pointer-events-auto w-full max-w-md bg-[#121216]/90 backdrop-blur-2xl border border-[#D4AF37]/25 rounded-[22px] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] grid grid-cols-4 gap-1"
        >
          <button
            type="button"
            onClick={() => setIsCategorySheetOpen(true)}
            className="py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-300 hover:text-[#F3E5AB] hover:bg-white/[0.05] transition-colors"
          >
            <LayoutGrid size={18} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black">
              {isFa ? "دسته‌ها" : "Menu"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(true);
              window.scrollTo({ top: 180, behavior: "smooth" });
            }}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors ${
              isSearchOpen || searchQuery
                ? "bg-[#D4AF37]/15 text-[#F3E5AB]"
                : "text-zinc-300 hover:text-[#F3E5AB] hover:bg-white/[0.05]"
            }`}
          >
            <Search size={18} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black">
              {isFa ? "جستجو" : "Search"}
            </span>
          </button>

          <button
            type="button"
            onClick={openReservationModal}
            className="relative py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-300 hover:text-[#F3E5AB] hover:bg-white/[0.05] transition-colors"
          >
            <div className="relative">
              <CalendarCheck size={18} className="text-[#D4AF37]" />
              {availableTablesCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <span className="text-[10px] font-black">
              {isFa ? "رزرو میز" : "Reserve"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsConciergeSheetOpen(true)}
            className="py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-300 hover:text-[#F3E5AB] hover:bg-white/[0.05] transition-colors"
          >
            <BellRing size={18} className="text-[#D4AF37]" />
            <span className="text-[10px] font-black">
              {isFa ? "سرویس میز" : "Concierge"}
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================
          شیت انتخاب سریع دسته‌بندی‌ها
         ======================================================== */}
      {isCategorySheetOpen && (
        <div
          onClick={() => setIsCategorySheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-[#F3E5AB] flex items-center gap-2">
                <LayoutGrid size={18} className="text-[#D4AF37]" />
                <span>{isFa ? "فهرست دسته‌بندی‌ها" : "Menu Categories"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 no-scrollbar">
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                  selectedCategoryId === "all"
                    ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#F3E5AB]"
                    : "bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]"
                }`}
              >
                <span className="font-black text-sm">
                  {isFa ? "نمایش کل منو" : "Show Full Menu"}
                </span>
                <ChevronLeft size={16} className="text-[#D4AF37]" />
              </button>

              {safeCategories.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                      isSelected
                        ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#F3E5AB]"
                        : "bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="font-black text-sm">
                      {isFa
                        ? cat.nameFa || cat.name
                        : cat.nameEn || cat.nameFa || cat.name}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 bg-black/30 px-2.5 py-0.5 rounded-full">
                      {(cat.products?.length || 0).toLocaleString("fa-IR")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          شیت سرویس میز و مشخصات مجموعه (Concierge & Info)
         ======================================================== */}
      {isConciergeSheetOpen && (
        <div
          onClick={() => setIsConciergeSheetOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl space-y-4 animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-2 sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#F8F6F0]">
                    {safeVenueName}
                  </h3>
                  <span className="text-[11px] font-bold text-zinc-400">
                    {isFa ? "خدمات میز و اطلاعات مجموعه" : "Concierge & Info"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConciergeSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* دکمه‌های سرویس میز */}
            {tableNumber &&
              (venueData?.callWaiterEnabled || venueData?.callChefEnabled) && (
                <div className="grid grid-cols-2 gap-2.5">
                  {venueData?.callWaiterEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsConciergeSheetOpen(false);
                        setMessage("");
                        setWaiterModal(true);
                      }}
                      className="bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] py-3.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg"
                    >
                      <BellRing size={16} />
                      <span>{isFa ? "احضار میزبان" : "Call Waiter"}</span>
                    </button>
                  )}

                  {venueData?.callChefEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsConciergeSheetOpen(false);
                        setMessage("");
                        setChefModal(true);
                      }}
                      className="bg-white/[0.06] hover:bg-white/[0.1] border border-[#D4AF37]/30 text-[#F3E5AB] py-3.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2"
                    >
                      <ChefHat size={16} />
                      <span>{isFa ? "پیام به سرآشپز" : "Note to Chef"}</span>
                    </button>
                  )}
                </div>
              )}

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {(safeAddress || safePhone) && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-2.5 text-xs font-bold text-zinc-200">
                {safeAddress && (
                  <div className="flex items-start gap-2.5">
                    <MapPin
                      size={15}
                      className="text-[#D4AF37] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-[#D4AF37] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال جزئیات محصول (Noir Product Showcase)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-60 w-full bg-[#1A1A20]">
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
                <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/25">
                  <UtensilsCrossed size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/30" />

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-6 pt-3 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#F8F6F0]">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-lg font-black text-[#E5C158] shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-[11px] text-zinc-400">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-zinc-400 leading-relaxed">
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
                          ? "توضیحات طبخ برای سرآشپز (مثلاً: مدیوم، سس جدا)..."
                          : "Special request for chef..."
                      }
                      className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl px-4 py-3 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none"
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
                        <div className="w-full py-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-300 font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-[#1A1A20] border border-[#D4AF37]/30 p-1.5 rounded-full">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base text-[#F3E5AB] min-w-[20px] text-center">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#C59B27] text-[#09090B] flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] px-6 py-2.5 rounded-full font-black text-xs"
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
                            isFa ? "به صورت‌سفارش اضافه شد" : "Added to order",
                          );
                        }}
                        className="w-full bg-gradient-to-l from-[#C59B27] via-[#DFB943] to-[#F3E5AB] text-[#09090B] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition-all"
                      >
                        <Plus size={17} strokeWidth={2.8} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Order"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-white/10 text-white py-3.5 rounded-full font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال رزرو آنلاین میزها (Noir Live Reservation)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#F8F6F0]">
                      {isFa ? "رزرو میز VIP" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-zinc-400">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F3E5AB] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#F8F6F0]">
                    {isFa ? "میز شما رزرو شد!" : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-zinc-400 mt-0.5">
                    {isFa
                      ? "مشخصات رزرو در دفتر پذیرش مجموعه ثبت گردید"
                      : "Your table has been reserved"}
                  </p>
                </div>

                <div className="bg-[#1A1A20] border border-white/[0.08] rounded-2xl p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-400">
                      {isFa ? "میز:" : "Table:"}
                    </span>
                    <span className="font-black text-[#E5C158]">
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-400">
                      {isFa ? "نام مهمان:" : "Name:"}
                    </span>
                    <span className="font-black text-[#F8F6F0]">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                    <span className="text-zinc-400">
                      {isFa ? "تماس:" : "Phone:"}
                    </span>
                    <span
                      className="font-mono font-black text-[#F8F6F0]"
                      dir="ltr"
                    >
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-400">
                      {isFa ? "نفرات:" : "Guests:"}
                    </span>
                    <span className="font-black text-[#F8F6F0]">
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
                  className="w-full bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] py-3.5 rounded-full font-black text-sm"
                >
                  {isFa ? "بازگشت به منو" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-[#1A1A20] border border-white/[0.06] px-3.5 py-2.5 rounded-2xl text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#E5C158]">
                      <span className="w-2 h-2 rounded-full bg-[#E5C158]" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black text-[#F3E5AB]">
                        {isFa ? "انتخاب شماره میز:" : "Select a table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#D4AF37]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-[#1A1A20] rounded-2xl p-4 text-center text-xs font-bold text-zinc-400">
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
                              className={`relative py-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#E5C158] bg-gradient-to-b from-[#D4AF37] to-[#B88928] text-[#09090B] shadow-md"
                                  : isFree
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-[#F8F6F0] hover:border-[#D4AF37]/60"
                                    : "border-white/[0.05] bg-white/[0.03] text-zinc-500 opacity-55 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-xs font-black">
                                {isFa
                                  ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                  : `#${t.tableNumber}`}
                              </span>
                              <span
                                className={`text-[9px] font-bold mt-0.5 ${
                                  isSelected
                                    ? "text-[#09090B]/80"
                                    : isFree
                                      ? "text-emerald-400"
                                      : t.state === "reserved"
                                        ? "text-[#E5C158]"
                                        : "text-rose-400"
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

                  <div className="bg-[#1A1A20] border border-white/[0.07] rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5 text-[#F8F6F0]">
                        <Users size={14} className="text-[#D4AF37]" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black min-w-[38px] text-center text-[#F3E5AB]">
                          {reserveGuests.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#09090B] flex items-center justify-center"
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
                              ? "bg-[#D4AF37] text-[#09090B] border-[#D4AF37]"
                              : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
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
                        className={`absolute top-1/2 -translate-y-1/2 text-zinc-500 ${
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
                          isFa ? "نام و نام خانوادگی مهمان *" : "Full Name *"
                        }
                        className={`w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl py-3 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none ${
                          isFa ? "pr-9 pl-3.5" : "pl-9 pr-3.5"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-zinc-500 ${
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
                        className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl py-3 px-9 text-left font-mono text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "توضیحات (مثلاً: میز کنار پنجره / مناسبت خاص)..."
                          : "Special request (optional)..."
                      }
                      className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl py-3 px-3.5 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl p-3 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-gradient-to-l from-[#C59B27] via-[#DFB943] to-[#F3E5AB] disabled:opacity-40 text-[#09090B] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
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
          دراور صورت‌سفارش (Noir Cart Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border-t border-[#D4AF37]/30 w-full max-w-lg mx-auto rounded-t-[30px] p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-[#F3E5AB]">
                  {isFa ? "صورت‌سفارش شما" : "Your Order"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-zinc-400">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
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
                    className="bg-[#1A1A20] border border-white/[0.07] p-3.5 rounded-2xl space-y-2.5"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[#F8F6F0] truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-[#E5C158] font-bold mt-0.5">
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
                                ? "bg-[#D4AF37] text-[#09090B]"
                                : "bg-white/[0.07] text-zinc-400"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center text-[#F3E5AB]">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#09090B] flex items-center justify-center"
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
                            ? "یادداشت برای سرآشپز..."
                            : "Note for kitchen..."
                        }
                        className="w-full bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none"
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
                  isFa ? "نام مهمان گرامی (اختیاری)" : "Guest Name (optional)"
                }
                className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl px-4 py-3 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-gradient-to-l from-[#C59B27] via-[#DFB943] to-[#F3E5AB] disabled:opacity-50 text-[#09090B] py-3.5 rounded-full font-black text-sm shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={17} />
                  <span>
                    {isFa ? "ارسال سفارش به آشپزخانه" : "Send Order"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال احضار میزبان / سالن‌دار */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <BellRing size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#F8F6F0]">
                    {isFa ? "احضار میزبان سالن" : "Call Waiter"}
                  </h3>
                  <p className="text-[11px] font-bold text-zinc-400">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
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
                      ? "bg-[#D4AF37] text-[#09090B] border-[#D4AF37]"
                      : "bg-[#1A1A20] text-zinc-300 border-white/10"
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
              className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl p-3.5 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2"
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

      {/* مودال پیام به سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-[#09090B] flex items-center justify-center">
                  <ChefHat size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#F8F6F0]">
                    {isFa ? "یادداشت به سرآشپز" : "Note to Chef"}
                  </h3>
                  <p className="text-[11px] font-bold text-zinc-400">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
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
                      ? "bg-[#D4AF37] text-[#09090B] border-[#D4AF37]"
                      : "bg-[#1A1A20] text-zinc-300 border-white/10"
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
                  ? "درجه پخت یا حساسیت غذایی..."
                  : "Cooking preference or allergies..."
              }
              className="w-full bg-[#1A1A20] border border-white/10 focus:border-[#D4AF37] rounded-2xl p-3.5 text-xs font-bold text-[#F8F6F0] placeholder:text-zinc-500 outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2"
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
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-[#D4AF37]/25 w-full max-w-md rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white/[0.06] border border-white/10 text-[#F3E5AB] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
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
                className="w-8 h-8 rounded-full bg-white/[0.07] text-zinc-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C158] flex items-center justify-center mb-2.5">
                <Sparkles size={24} />
              </div>
              <span className="inline-block text-[11px] font-black text-[#F3E5AB] bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-0.5 rounded-full mb-1.5">
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black text-[#F8F6F0]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "Order Served!"
                  : isFa
                    ? "وضعیت زنده سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-[#1A1A20] border border-white/[0.07] rounded-2xl p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                          ? "bg-emerald-500 text-[#09090B]"
                          : isActive
                            ? "bg-[#D4AF37] text-[#09090B]"
                            : "bg-white/[0.07] text-zinc-400"
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
                      <span className="block font-black text-xs sm:text-sm text-[#F8F6F0]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-zinc-400 mt-0.5">
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
              className="w-full bg-gradient-to-l from-[#D4AF37] to-[#E5C158] text-[#09090B] py-3.5 rounded-full font-black text-sm shrink-0"
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

export default Template5;
