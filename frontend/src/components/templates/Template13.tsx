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
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  Home,
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
    description: "سرآشپز مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سفارش آماده است و تا لحظاتی دیگر سر میز سرو می‌شود",
  },
];

const Template13: React.FC<TemplateProps> = ({
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
  // کنترل صفحه خوشامدگویی و ورود به منو
  const [viewScreen, setViewScreen] = useState<"welcome" | "menu">("welcome");

  // حالت روشن / تاریک با ذخیره انتخاب مشتری
  const [colorMode, setColorMode] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("toranj_t13_mode");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore
    }
    return "dark";
  });

  const isDark = colorMode === "dark";
  const isFa = language === "fa";

  const toggleColorMode = () => {
    setColorMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("toranj_t13_mode", next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  const totalProductsCount = useMemo(
    () =>
      safeCategories.reduce(
        (sum, c) => sum + (Array.isArray(c.products) ? c.products.length : 0),
        0,
      ),
    [safeCategories],
  );

  // نتایج زنده جستجوی شیشه‌ای
  const searchResults = useMemo(() => {
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

  const timePresetsFa = ["۱۳:۳۰", "۱۷:۰۰", "۲۰:۰۰", "۲۱:۳۰"];
  const timePresetsEn = ["13:30", "17:00", "20:00", "21:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به آب و لیوان",
    "قاشق، چنگال و دستمال",
    "حضور میزبان سر میز",
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

  // توکن‌های یکپارچه برای تضمین ظرافت کامل در هر دو حالت لایت و دارک
  const ui = isDark
    ? {
        pageBg: "bg-[#09090D] text-[#F5F5F7]",
        glassNav:
          "bg-[#111218]/65 backdrop-blur-2xl border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
        glassBar: "bg-[#12131A]/60 backdrop-blur-2xl border-white/[0.08]",
        glassCard:
          "bg-white/[0.05] backdrop-blur-xl border-white/[0.1] hover:border-[#E5B869]/40 shadow-[0_14px_40px_rgba(0,0,0,0.35)]",
        glassCardSelected:
          "bg-white/[0.07] backdrop-blur-xl border-[#E5B869]/70 ring-1 ring-[#E5B869]/30 shadow-[0_16px_42px_rgba(229,184,105,0.16)]",
        glassBtn:
          "bg-white/[0.07] hover:bg-white/[0.13] border-white/[0.1] text-[#F5F5F7]",
        sheetBg:
          "bg-[#13141C]/92 backdrop-blur-2xl border-white/[0.12] text-[#F5F5F7]",
        subSurface: "bg-white/[0.05] border-white/[0.08]",
        inputBg:
          "bg-white/[0.06] border-white/[0.1] focus:border-[#E5B869] text-white placeholder:text-zinc-500",
        mutedText: "text-zinc-400",
        subtleText: "text-zinc-500",
        divider: "border-white/[0.08]",
        accentText: "text-[#E5B869]",
        accentSoft: "bg-[#E5B869]/15 text-[#F4D28E] border-[#E5B869]/30",
        primaryCta:
          "bg-gradient-to-l from-[#D4A048] via-[#E5B869] to-[#F3D495] text-[#0B0B0F] hover:brightness-105 shadow-[0_12px_32px_rgba(229,184,105,0.28)]",
        pillActive:
          "bg-gradient-to-l from-[#D4A048] to-[#EBC37A] text-[#0B0B0F] border-transparent shadow-[0_6px_20px_rgba(229,184,105,0.3)]",
        pillIdle:
          "bg-white/[0.06] text-zinc-300 hover:text-white border-white/[0.08]",
        imagePlaceholder: "bg-white/[0.04] text-zinc-600",
        dockBg:
          "bg-[#151620]/78 backdrop-blur-2xl border-white/[0.16] text-white shadow-[0_22px_55px_rgba(0,0,0,0.65)]",
      }
    : {
        pageBg: "bg-[#F3F2EE] text-[#141418]",
        glassNav:
          "bg-white/65 backdrop-blur-2xl border-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        glassBar: "bg-white/55 backdrop-blur-2xl border-black/[0.06]",
        glassCard:
          "bg-white/75 backdrop-blur-xl border-white/90 hover:border-[#B67E26]/40 shadow-[0_8px_28px_rgba(15,23,42,0.045)]",
        glassCardSelected:
          "bg-white/95 backdrop-blur-xl border-[#B67E26] ring-1 ring-[#B67E26]/25 shadow-[0_14px_34px_rgba(182,126,38,0.14)]",
        glassBtn:
          "bg-white/70 hover:bg-white border-black/[0.07] text-[#141418]",
        sheetBg: "bg-white/90 backdrop-blur-2xl border-white text-[#141418]",
        subSurface: "bg-black/[0.035] border-black/[0.06]",
        inputBg:
          "bg-black/[0.04] border-black/[0.08] focus:border-[#B67E26] focus:bg-white text-[#141418] placeholder:text-zinc-500",
        mutedText: "text-zinc-600",
        subtleText: "text-zinc-500",
        divider: "border-black/[0.07]",
        accentText: "text-[#A8701B]",
        accentSoft: "bg-[#B67E26]/10 text-[#996515] border-[#B67E26]/25",
        primaryCta:
          "bg-[#141418] hover:bg-[#27272E] text-[#FAF8F4] shadow-[0_14px_32px_rgba(20,20,24,0.2)]",
        pillActive:
          "bg-[#141418] text-white border-[#141418] shadow-[0_6px_18px_rgba(20,20,24,0.18)]",
        pillIdle:
          "bg-white/70 text-zinc-600 hover:text-[#141418] border-black/[0.06]",
        imagePlaceholder: "bg-black/[0.04] text-zinc-300",
        dockBg:
          "bg-[#141418]/88 backdrop-blur-2xl border-white/20 text-white shadow-[0_22px_50px_rgba(15,23,42,0.26)]",
      };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden relative ${ui.pageBg}`}
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* هاله‌های نوری ملایم محیطی برای عمق‌بخشی واقعی به شیشه‌های مات */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-32 right-[-10%] w-[460px] h-[460px] rounded-full blur-[130px] transition-opacity duration-500 ${
            isDark ? "bg-[#E5B869]/[0.12]" : "bg-[#E8C07D]/[0.28]"
          }`}
        />
        <div
          className={`absolute top-[38%] left-[-12%] w-[420px] h-[420px] rounded-full blur-[130px] transition-opacity duration-500 ${
            isDark ? "bg-[#4F7CAC]/[0.12]" : "bg-[#93C5FD]/[0.22]"
          }`}
        />
        <div
          className={`absolute -bottom-32 right-[15%] w-[380px] h-[380px] rounded-full blur-[120px] transition-opacity duration-500 ${
            isDark ? "bg-[#9D6BFF]/[0.08]" : "bg-[#FBCFE8]/[0.22]"
          }`}
        />
      </div>

      {/* اعلان شیشه‌ای شناور */}
      {toastMsg && (
        <div className="fixed top-[74px] inset-x-4 z-[70] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-full border font-bold text-xs flex items-center gap-2 shadow-2xl ${ui.glassNav}`}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={11} className="text-white" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          نمای اول: صفحه خوشامدگویی اختصاصی (Welcome Concierge View)
         ======================================================== */}
      {viewScreen === "welcome" ? (
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          {/* نوبار شیشه‌ای بالای صفحه خوشامدگویی */}
          <nav
            className={`sticky top-0 z-30 h-16 border-b transition-colors duration-300 ${ui.glassNav}`}
          >
            <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {tableNumber ? (
                  <span
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-black flex items-center gap-1.5 ${ui.accentSoft}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isFa
                      ? `میز شماره ${tableNumber.toLocaleString("fa-IR")}`
                      : `Table #${tableNumber}`}
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${ui.glassBtn}`}
                  >
                    <Sparkles size={12} className={ui.accentText} />
                    <span>{isFa ? "خوش آمدید" : "Welcome"}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* سوییچر تم لایت / دارک */}
                <button
                  type="button"
                  onClick={toggleColorMode}
                  aria-label={isFa ? "تغییر حالت روشنایی" : "Toggle theme"}
                  className={`h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  {isDark ? (
                    <>
                      <Sun size={14} className="text-[#E5B869]" />
                      <span className="hidden sm:inline">
                        {isFa ? "روشن" : "Light"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon size={14} className="text-[#141418]" />
                      <span className="hidden sm:inline">
                        {isFa ? "تاریک" : "Dark"}
                      </span>
                    </>
                  )}
                </button>

                {venueData?.bilingual && (
                  <button
                    type="button"
                    onClick={() => setLanguage(isFa ? "en" : "fa")}
                    className={`h-9 px-3 rounded-full border font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${ui.glassBtn}`}
                  >
                    <Globe size={13} className={ui.accentText} />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  aria-label={isFa ? "درباره مجموعه" : "About venue"}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>
          </nav>

          {/* بدنه مرکزی خوشامدگویی */}
          <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
            <div className="w-full max-w-2xl space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* نشان و هویت مرکزی مجموعه */}
              <div className="flex flex-col items-center">
                <div
                  className={`p-1.5 rounded-[30px] border mb-5 shadow-2xl ${
                    isDark
                      ? "bg-white/[0.06] border-white/[0.15]"
                      : "bg-white/80 border-white"
                  }`}
                >
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] overflow-hidden flex items-center justify-center ${ui.imagePlaceholder}`}
                  >
                    {safeLogo ? (
                      <img
                        src={getFullImageUrl(safeLogo)}
                        alt={safeVenueName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={38} className={ui.accentText} />
                    )}
                  </div>
                </div>

                <span
                  className={`text-[11px] font-black tracking-[0.2em] uppercase mb-2 ${ui.accentText}`}
                >
                  {isFa ? "تجربه مدرن پذیرایی" : "SIGNATURE HOSPITALITY"}
                </span>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  {safeVenueName}
                </h1>

                {(isFa ? safeAboutFa : safeAboutEn) && (
                  <p
                    className={`text-xs sm:text-sm font-medium max-w-lg leading-relaxed mt-3 ${ui.mutedText}`}
                  >
                    {isFa ? safeAboutFa : safeAboutEn}
                  </p>
                )}
              </div>

              {/* ۲ گزینه اصلی شیشه‌ای: ۱. سفارش‌دهی ۲. رزرو میز */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                {/* گزینه ۱: سفارش‌دهی و ورود به منو */}
                <button
                  type="button"
                  onClick={() => setViewScreen("menu")}
                  className={`group relative rounded-[30px] p-6 border text-right transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[188px] overflow-hidden ${ui.glassCard}`}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div
                      className={`w-13 h-13 rounded-[18px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${ui.primaryCta}`}
                    >
                      <UtensilsCrossed size={24} />
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${ui.accentSoft}`}
                    >
                      {totalProductsCount > 0
                        ? `${totalProductsCount.toLocaleString("fa-IR")} ${
                            isFa ? "آیتم" : "items"
                          }`
                        : isFa
                          ? "منوی کامل"
                          : "Full Menu"}
                    </span>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-3 w-full">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black leading-snug">
                        {isFa ? "سفارش‌دهی و منو" : "Order & Menu"}
                      </h2>
                      <p
                        className={`text-xs font-medium mt-1 leading-relaxed ${ui.mutedText}`}
                      >
                        {isFa
                          ? "مشاهده منوی کامل و ثبت سفارش آنلاین"
                          : "Browse full menu & place your order"}
                      </p>
                    </div>

                    <span
                      className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isFa
                          ? "group-hover:-translate-x-1"
                          : "group-hover:translate-x-1"
                      } ${ui.glassBtn}`}
                    >
                      {isFa ? (
                        <ArrowLeft size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </span>
                  </div>
                </button>

                {/* گزینه ۲: رزرو آنلاین میز */}
                <button
                  type="button"
                  onClick={openReservationModal}
                  className={`group relative rounded-[30px] p-6 border text-right transition-all duration-300 active:scale-[0.98] flex flex-col justify-between min-h-[188px] overflow-hidden ${ui.glassCard}`}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div
                      className={`w-13 h-13 rounded-[18px] border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${ui.glassBtn}`}
                    >
                      <CalendarCheck size={24} className={ui.accentText} />
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {tablesList.length > 0
                        ? `${availableTablesCount.toLocaleString("fa-IR")} ${
                            isFa ? "میز آزاد" : "open"
                          }`
                        : isFa
                          ? "رزرو آنلاین"
                          : "Live"}
                    </span>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-3 w-full">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black leading-snug">
                        {isFa ? "رزرو آنلاین میز" : "Reserve a Table"}
                      </h2>
                      <p
                        className={`text-xs font-medium mt-1 leading-relaxed ${ui.mutedText}`}
                      >
                        {isFa
                          ? "انتخاب زنده شماره میز و ثبت فوری رزرو"
                          : "Pick an available table in real time"}
                      </p>
                    </div>

                    <span
                      className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isFa
                          ? "group-hover:-translate-x-1"
                          : "group-hover:translate-x-1"
                      } ${ui.glassBtn}`}
                    >
                      {isFa ? (
                        <ArrowLeft size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </span>
                  </div>
                </button>
              </div>

              {/* میانبر سرویس میز روی صفحه خوشامد (در صورت فعال بودن شماره میز) */}
              {tableNumber && (showWaiterAction || showChefAction) && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {showWaiterAction && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setWaiterModal(true);
                      }}
                      className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${ui.glassBtn}`}
                    >
                      <BellRing size={14} className={ui.accentText} />
                      <span>{isFa ? "درخواست گارسون" : "Call Waiter"}</span>
                    </button>
                  )}
                  {showChefAction && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setChefModal(true);
                      }}
                      className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${ui.glassBtn}`}
                    >
                      <ChefHat size={14} className="text-emerald-500" />
                      <span>{isFa ? "پیام به سرآشپز" : "Note to Chef"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* فوتر ظریف پایین صفحه خوشامدگویی */}
          <footer className="py-5 px-4 text-center">
            <a
              href="https://toranjmenu.ir"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors hover:opacity-100 opacity-70 ${ui.mutedText}`}
            >
              <Sparkles size={12} className={ui.accentText} />
              <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
            </a>
          </footer>
        </div>
      ) : (
        /* ========================================================
           نمای دوم: صفحه منو و سفارش‌دهی با نوبارهای تمام‌شیشه‌ای
           ======================================================== */
        <div className="relative z-10 pb-32">
          {/* ۱. نوبار بالایی تمام‌شیشه‌ای (Fixed-height, zero shift) */}
          <nav
            className={`sticky top-0 z-30 h-16 border-b transition-colors duration-300 ${ui.glassNav}`}
          >
            <div className="max-w-6xl mx-auto h-full px-3.5 sm:px-6 flex items-center justify-between gap-2.5">
              {/* دکمه بازگشت به خوشامد + لوگو و نام */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setViewScreen("welcome")}
                  aria-label={isFa ? "صفحه خوشامدگویی" : "Welcome screen"}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  <Home size={15} />
                </button>

                <div
                  className={`w-9 h-9 rounded-[12px] border overflow-hidden flex items-center justify-center shrink-0 ${ui.imagePlaceholder} ${ui.divider}`}
                >
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={16} className={ui.accentText} />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="block text-sm font-black tracking-tight truncate">
                    {safeVenueName}
                  </span>
                  {tableNumber ? (
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold ${ui.accentText}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isFa
                        ? `میز ${tableNumber.toLocaleString("fa-IR")}`
                        : `Table #${tableNumber}`}
                    </span>
                  ) : (
                    <span
                      className={`block text-[10px] font-semibold ${ui.subtleText}`}
                    >
                      {isFa ? "منوی آنلاین" : "Digital Menu"}
                    </span>
                  )}
                </div>
              </div>

              {/* ابزارک‌های نوبار شیشه‌ای */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeOrder && (
                  <button
                    type="button"
                    onClick={() => setIsTrackerOpen(true)}
                    className="h-9 px-3 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-500 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>#{activeOrder.orderNumber}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={isFa ? "جستجو" : "Search"}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  <Search size={15} />
                </button>

                <button
                  type="button"
                  onClick={toggleColorMode}
                  aria-label={isFa ? "تغییر تم" : "Toggle Theme"}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  {isDark ? (
                    <Sun size={15} className="text-[#E5B869]" />
                  ) : (
                    <Moon size={15} />
                  )}
                </button>

                {venueData?.bilingual && (
                  <button
                    type="button"
                    onClick={() => setLanguage(isFa ? "en" : "fa")}
                    className={`h-9 px-2.5 rounded-full border font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 ${ui.glassBtn}`}
                  >
                    <Globe size={13} className={ui.accentText} />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  aria-label={isFa ? "اطلاعات" : "Info"}
                  className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-95 ${ui.glassBtn}`}
                >
                  <Info size={15} />
                </button>
              </div>
            </div>
          </nav>

          {/* ۲. نوار شیشه‌ای دسته‌بندی‌ها (دقیقاً چسبیده زیر نوبار بدون تداخل) */}
          {safeCategories.length > 0 && (
            <div
              className={`sticky top-16 z-20 border-b py-3 transition-colors duration-300 ${ui.glassBar}`}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shrink-0 border transition-all ${
                    selectedCategoryId === "all" ? ui.pillActive : ui.pillIdle
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
                      className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shrink-0 border transition-all ${
                        isSelected ? ui.pillActive : ui.pillIdle
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

          {/* ۳. نوار شیشه‌ای سرویس میز: گارسون، سرآشپز و رزرو آنلاین */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {showWaiterAction && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setWaiterModal(true);
                  }}
                  className={`rounded-[20px] border py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] ${ui.glassCard}`}
                >
                  <BellRing size={16} className={ui.accentText} />
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
                  className={`rounded-[20px] border py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] ${ui.glassCard}`}
                >
                  <ChefHat size={16} className="text-emerald-500" />
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
                } rounded-[20px] border py-3 px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.98] ${ui.glassCard}`}
              >
                <CalendarCheck size={16} className="text-sky-500" />
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
          </section>

          {/* ۴. گرید هم‌ابعاد و تراز محصولات */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-9">
            {visibleMenu.length === 0 ? (
              <div
                className={`rounded-[28px] border py-16 text-center ${ui.glassCard}`}
              >
                <UtensilsCrossed
                  size={34}
                  className={`mx-auto mb-3 opacity-35 ${ui.mutedText}`}
                />
                <p className={`text-xs font-bold ${ui.mutedText}`}>
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
                    <div className="flex items-center justify-between gap-3 mb-4 px-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isDark ? "bg-[#E5B869]" : "bg-[#B67E26]"
                          }`}
                        />
                        <h2 className="text-lg sm:text-xl font-black tracking-tight truncate">
                          {catTitle}
                        </h2>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${ui.subSurface} ${ui.mutedText}`}
                      >
                        {(cat.products?.length || 0).toLocaleString("fa-IR")}{" "}
                        {isFa ? "آیتم" : "items"}
                      </span>
                    </div>

                    {!hasProducts ? (
                      <div
                        className={`rounded-[22px] border p-6 text-center text-xs font-bold ${ui.glassCard} ${ui.mutedText}`}
                      >
                        {isFa
                          ? "آیتمی در این دسته ثبت نشده است."
                          : "No items yet."}
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
                              className={`group cursor-pointer h-full flex flex-col rounded-[22px] sm:rounded-[26px] overflow-hidden border transition-all duration-300 ${
                                cartItem ? ui.glassCardSelected : ui.glassCard
                              } ${!isAvailable ? "opacity-55" : ""}`}
                            >
                              {/* قاب تصویر قفل‌شده با نسبت دقیق 4:3 */}
                              <div
                                className={`relative w-full aspect-[4/3] overflow-hidden shrink-0 ${ui.imagePlaceholder}`}
                              >
                                {prod?.imageUrl ? (
                                  <img
                                    src={getFullImageUrl(prod.imageUrl)}
                                    alt={isFa ? prod.nameFa : prod.nameEn}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <UtensilsCrossed
                                      size={28}
                                      strokeWidth={1.4}
                                    />
                                  </div>
                                )}

                                {/* گرادیانت بسیار نرم برای تفکیک دکمه روی تصویر */}
                                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

                                {!isAvailable ? (
                                  <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-black/75 border border-white/20 text-rose-300 text-[10px] font-black px-3 py-1 rounded-full">
                                      {isFa ? "اتمام موجودی" : "Sold Out"}
                                    </span>
                                  </div>
                                ) : (
                                  hasFiniteStock &&
                                  Number(prod.stock) <= 5 && (
                                    <span
                                      className={`absolute top-2.5 ${
                                        isFa ? "right-2.5" : "left-2.5"
                                      } bg-black/65 backdrop-blur-md border border-white/15 text-[#F4D28E] text-[9px] font-black px-2 py-0.5 rounded-full`}
                                    >
                                      {isFa
                                        ? `${prod.stock} مانده`
                                        : `${prod.stock} left`}
                                    </span>
                                  )
                                )}

                                {/* کنترل شیشه‌ای افزودن / تعداد روی گوشه تصویر */}
                                {canOrder && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute bottom-2.5 ${
                                      isFa ? "left-2.5" : "right-2.5"
                                    } z-10`}
                                  >
                                    {cartItem ? (
                                      <div className="flex items-center gap-1 bg-[#141418]/90 backdrop-blur-xl border border-white/20 text-white rounded-full p-0.5 shadow-lg">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFromCart(prod.id)
                                          }
                                          className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Minus size={12} strokeWidth={3} />
                                        </button>
                                        <span className="text-[11px] font-black min-w-[16px] text-center tabular-nums text-[#F4D28E]">
                                          {cartItem.quantity.toLocaleString(
                                            "fa-IR",
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={Boolean(reachedMaxStock)}
                                          onClick={() => addToCart(prod)}
                                          className="w-6 h-6 rounded-full bg-[#E5B869] text-[#0B0B0F] disabled:opacity-35 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Plus size={12} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        aria-label={isFa ? "افزودن" : "Add"}
                                        onClick={() => addToCart(prod)}
                                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-[#E5B869] text-[#141418] backdrop-blur-md shadow-[0_6px_16px_rgba(0,0,0,0.28)] flex items-center justify-center transition-all active:scale-90"
                                      >
                                        <Plus size={16} strokeWidth={2.6} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* بدنه متنی یکدست */}
                              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
                                <div className="space-y-1">
                                  <h3 className="font-black text-[13px] sm:text-[14px] leading-snug line-clamp-2">
                                    {isFa
                                      ? prod?.nameFa
                                      : prod?.nameEn || prod?.nameFa}
                                  </h3>

                                  {(isFa
                                    ? prod?.descriptionFa
                                    : prod?.descriptionEn ||
                                      prod?.descriptionFa) && (
                                    <p
                                      className={`text-[11px] font-medium line-clamp-2 leading-relaxed ${ui.mutedText}`}
                                    >
                                      {isFa
                                        ? prod?.descriptionFa
                                        : prod?.descriptionEn ||
                                          prod?.descriptionFa}
                                    </p>
                                  )}
                                </div>

                                <div
                                  className={`pt-2.5 border-t flex items-baseline justify-between gap-1 ${ui.divider}`}
                                >
                                  <div className="flex items-baseline gap-1 min-w-0">
                                    <span
                                      className={`font-black text-[13.5px] sm:text-[15px] tabular-nums truncate ${ui.accentText}`}
                                    >
                                      {Number(prod?.price || 0).toLocaleString(
                                        "fa-IR",
                                      )}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold shrink-0 ${ui.subtleText}`}
                                    >
                                      {isFa ? "تومان" : "IRT"}
                                    </span>
                                  </div>

                                  {cartItem && (
                                    <span
                                      className={`text-[10px] font-black shrink-0 ${ui.accentText}`}
                                    >
                                      ×
                                      {cartItem.quantity.toLocaleString(
                                        "fa-IR",
                                      )}
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

            {/* فوتر ترنج */}
            <footer className={`pt-8 pb-4 border-t text-center ${ui.divider}`}>
              <a
                href="https://toranjmenu.ir"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold transition-colors ${ui.mutedText}`}
              >
                <Sparkles size={12} className={ui.accentText} />
                <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
              </a>
            </footer>
          </main>

          {/* ۵. نوبار شیشه‌ای شناور سبد خرید در پایین صفحه */}
          {totalItems > 0 && (
            <div className="fixed bottom-4 inset-x-4 z-30 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={`w-full max-w-md p-2.5 px-4 rounded-full border font-black flex items-center justify-between gap-3 active:scale-[0.98] transition-all ${ui.dockBg}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F3D495] to-[#C68E35] text-[#0B0B0F] flex items-center justify-center text-xs font-black tabular-nums shrink-0">
                    {totalItems.toLocaleString("fa-IR")}
                  </span>
                  <div className="text-right">
                    <span className="block text-xs sm:text-sm font-black leading-tight text-white">
                      {isFa ? "مشاهده و ثبت سفارش" : "Review Order"}
                    </span>
                    {tableNumber && (
                      <span className="block text-[10px] font-bold text-white/60">
                        {isFa
                          ? `میز شماره ${tableNumber.toLocaleString("fa-IR")}`
                          : `Table #${tableNumber}`}
                      </span>
                    )}
                  </div>
                </div>

                <span className="bg-white/12 border border-white/15 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black tabular-nums text-[#F4D28E]">
                  {totalPrice.toLocaleString("fa-IR")}{" "}
                  <span className="text-[10px] font-bold text-white/75">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          مودال ۱: جستجوی شیشه‌ای زنده (Glass Spotlight)
         ======================================================== */}
      {isSearchOpen && (
        <div
          onClick={() => setIsSearchOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-[26px] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${ui.sheetBg}`}
          >
            <div
              className={`p-3.5 border-b flex items-center gap-2.5 ${ui.divider}`}
            >
              <Search size={17} className={`shrink-0 mr-1 ${ui.mutedText}`} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa ? "جستجو در تمام آیتم‌های منو..." : "Search full menu..."
                }
                className="flex-1 bg-transparent text-sm font-bold outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${ui.glassBtn}`}
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className={`text-xs font-black px-2 ${ui.accentText}`}
              >
                {isFa ? "بستن" : "Close"}
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {searchResults.length === 0 ? (
                <div
                  className={`py-12 text-center text-xs font-bold ${ui.mutedText}`}
                >
                  {isFa ? "آیتمی با این نام یافت نشد." : "No items found."}
                </div>
              ) : (
                <div className={`divide-y ${ui.divider}`}>
                  {searchResults.map(({ prod, catTitleFa, catTitleEn }) => {
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
                          setIsSearchOpen(false);
                          openProductShowcase(prod);
                        }}
                        className="cursor-pointer p-3.5 px-4 hover:bg-white/[0.04] flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-[14px] overflow-hidden shrink-0 flex items-center justify-center ${ui.imagePlaceholder}`}
                          >
                            {prod?.imageUrl ? (
                              <img
                                src={getFullImageUrl(prod.imageUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UtensilsCrossed size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black truncate">
                              {isFa
                                ? prod?.nameFa
                                : prod?.nameEn || prod?.nameFa}
                            </h4>
                            <p
                              className={`text-[11px] font-bold truncate ${ui.mutedText}`}
                            >
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
                                isFa ? "به سبد سفارش اضافه شد" : "Added to bag",
                              );
                            }}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform active:scale-90 ${ui.accentSoft}`}
                          >
                            <Plus size={15} strokeWidth={2.6} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۲: درباره مجموعه (Venue Info Sheet)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-t-[30px] sm:rounded-[30px] border p-5 pb-8 w-full max-w-md shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200 ${ui.sheetBg}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-[16px] overflow-hidden flex items-center justify-center border ${ui.imagePlaceholder} ${ui.divider}`}
                >
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={20} className={ui.accentText} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base">{safeVenueName}</h3>
                  <span className={`text-[11px] font-bold ${ui.mutedText}`}>
                    {isFa ? "درباره مجموعه" : "About Venue"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <div
                className={`rounded-[20px] border p-4 text-xs font-medium leading-relaxed ${ui.subSurface} ${ui.mutedText}`}
              >
                {isFa ? safeAboutFa : safeAboutEn}
              </div>
            )}

            {(safeAddress || safePhone) && (
              <div
                className={`rounded-[20px] border divide-y text-xs font-bold overflow-hidden ${ui.subSurface} ${ui.divider}`}
              >
                {safeAddress && (
                  <div className="p-4 flex items-start gap-2.5">
                    <MapPin
                      size={16}
                      className={`shrink-0 mt-0.5 ${ui.accentText}`}
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="p-4 flex items-center gap-2.5">
                    <Phone size={16} className={`shrink-0 ${ui.accentText}`} />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳: جزئیات محصول (Glass Product Sheet)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-t-[30px] sm:rounded-[30px] border overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-200 ${ui.sheetBg}`}
          >
            <div
              className={`relative w-full aspect-[16/10] ${ui.imagePlaceholder}`}
            >
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
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed size={48} strokeWidth={1.3} />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xl text-white border border-white/15 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 pb-8 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black leading-snug">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span
                  className={`text-lg font-black tabular-nums shrink-0 ${ui.accentText}`}
                >
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className={`text-[11px] font-bold ${ui.subtleText}`}>
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p
                  className={`text-xs sm:text-sm font-medium leading-relaxed ${ui.mutedText}`}
                >
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
                          ? "توضیحات برای آشپزخانه (اختیاری)..."
                          : "Special note for kitchen..."
                      }
                      className={`w-full border rounded-[16px] px-4 py-3 text-xs font-bold outline-none transition-colors ${ui.inputBg}`}
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
                        <div className="w-full py-3.5 rounded-full bg-rose-500/15 text-rose-500 font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div
                          className={`flex items-center justify-between border p-1.5 rounded-full ${ui.subSurface}`}
                        >
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className={`w-9 h-9 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base min-w-[20px] text-center tabular-nums">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center ${ui.primaryCta}`}
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className={`px-6 py-2.5 rounded-full font-black text-xs ${ui.primaryCta}`}
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
                            isFa ? "به سبد سفارش اضافه شد" : "Added to order",
                          );
                        }}
                        className={`w-full py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${ui.primaryCta}`}
                      >
                        <Plus size={17} strokeWidth={2.6} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Order"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className={`w-full border py-3.5 rounded-full font-black text-xs ${ui.glassBtn}`}
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۴: رزرو آنلاین میزها (Live Glass Reservation Sheet)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-t-[30px] sm:rounded-[30px] border p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200 ${ui.sheetBg}`}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${ui.primaryCta}`}
                >
                  <CalendarCheck size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base">
                      {isFa ? "رزرو آنلاین میز" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className={`text-[11px] font-bold ${ui.mutedText}`}>
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-black">
                    {isFa
                      ? "رزرو شما با موفقیت ثبت شد"
                      : "Reservation Confirmed"}
                  </h4>
                  <p className={`text-xs font-bold mt-0.5 ${ui.mutedText}`}>
                    {isFa
                      ? "میز انتخابی با موفقیت به نام شما ثبت گردید"
                      : "Your table is booked and ready"}
                  </p>
                </div>

                <div
                  className={`rounded-[20px] border divide-y text-xs font-bold text-right overflow-hidden ${ui.subSurface} ${ui.divider}`}
                >
                  <div className="flex justify-between p-3.5">
                    <span className={ui.mutedText}>
                      {isFa ? "شماره میز" : "Table"}
                    </span>
                    <span className={`font-black ${ui.accentText}`}>
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className={ui.mutedText}>
                      {isFa ? "نام مهمان" : "Guest"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className={ui.mutedText}>
                      {isFa ? "شماره تماس" : "Phone"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between p-3.5">
                    <span className={ui.mutedText}>
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

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReserveModal(false);
                      setViewScreen("menu");
                    }}
                    className={`py-3.5 rounded-full font-black text-xs sm:text-sm ${ui.primaryCta}`}
                  >
                    {isFa ? "مشاهده منو" : "Browse Menu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReserveModal(false)}
                    className={`py-3.5 rounded-full border font-black text-xs sm:text-sm ${ui.glassBtn}`}
                  >
                    {isFa ? "بستن" : "Close"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div
                    className={`flex items-center justify-between border px-4 py-2.5 rounded-[16px] text-[11px] font-bold ${ui.subSurface}`}
                  >
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-500">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black">
                        {isFa ? "انتخاب شماره میز" : "Select a table"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className={`animate-spin ${ui.accentText}`}
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div
                        className={`rounded-[18px] border p-4 text-center text-xs font-bold ${ui.subSurface} ${ui.mutedText}`}
                      >
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
                              className={`py-2.5 rounded-[16px] border transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? ui.pillActive
                                  : isFree
                                    ? `${ui.subSurface} hover:border-emerald-500/60`
                                    : `${ui.subSurface} opacity-40 cursor-not-allowed`
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
                                    ? "opacity-85"
                                    : isFree
                                      ? "text-emerald-500"
                                      : t.state === "reserved"
                                        ? "text-amber-500"
                                        : "text-rose-500"
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

                  <div
                    className={`rounded-[20px] border p-3.5 space-y-3 ${ui.subSurface}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className={ui.accentText} />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div
                        className={`flex items-center gap-2 rounded-full border p-0.5 ${ui.subSurface}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className={`w-7 h-7 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
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
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${ui.primaryCta}`}
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
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            reserveTime === slot ? ui.pillActive : ui.pillIdle
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
                        className={`absolute top-1/2 -translate-y-1/2 ${ui.subtleText} ${
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
                        className={`w-full border rounded-[16px] py-3 text-xs font-bold outline-none ${ui.inputBg} ${
                          isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 ${ui.subtleText} ${
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
                        className={`w-full border rounded-[16px] py-3 px-10 text-left font-mono text-xs font-bold outline-none ${ui.inputBg}`}
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa ? "توضیحات (اختیاری)..." : "Note (optional)..."
                      }
                      className={`w-full border rounded-[16px] py-3 px-4 text-xs font-bold outline-none ${ui.inputBg}`}
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 text-rose-500 rounded-[16px] p-3 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className={`w-full disabled:opacity-40 py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shrink-0 ${ui.primaryCta}`}
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
          مودال ۵: دراور سبد سفارش (Glass Order Bag)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg mx-auto rounded-t-[30px] border-t border-x p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-8 duration-200 ${ui.sheetBg}`}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black">
                  {isFa ? "سبد سفارش" : "Your Order"}
                </h3>
                {tableNumber && (
                  <p className={`text-xs font-bold ${ui.accentText}`}>
                    {isFa
                      ? `میز شماره ${tableNumber.toLocaleString("fa-IR")}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto rounded-[22px] border divide-y mb-4 no-scrollbar ${ui.subSurface} ${ui.divider}`}
            >
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div key={pid} className="p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p
                          className={`text-xs font-bold mt-0.5 tabular-nums ${ui.accentText}`}
                        >
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          <span className={ui.subtleText}>
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
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                              isNoteOpen ? ui.pillActive : ui.glassBtn
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div
                          className={`flex items-center gap-2 rounded-full border p-0.5 ${ui.subSurface}`}
                        >
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className={`w-7 h-7 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center tabular-nums">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${ui.primaryCta}`}
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
                        className={`w-full border rounded-[12px] px-3 py-2 text-xs font-bold outline-none ${ui.inputBg}`}
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
                className={`w-full border rounded-[16px] px-4 py-3 text-xs font-bold outline-none ${ui.inputBg}`}
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className={`w-full disabled:opacity-50 py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${ui.primaryCta}`}
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-t-[30px] sm:rounded-[30px] border p-5 pb-7 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ${ui.sheetBg}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-[14px] border flex items-center justify-center ${
                    waiterModal
                      ? ui.accentSoft
                      : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  }`}
                >
                  {waiterModal ? <BellRing size={19} /> : <ChefHat size={19} />}
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {waiterModal
                      ? isFa
                        ? "درخواست گارسون"
                        : "Call Waiter"
                      : isFa
                        ? "درخواست و پیام به سرآشپز"
                        : "Note to Chef"}
                  </h3>
                  <p className={`text-[11px] font-bold ${ui.mutedText}`}>
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
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            {!tableNumber && (
              <div className="mb-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-[16px] p-3 text-xs font-bold flex items-center gap-2">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    message === preset ? ui.pillActive : ui.pillIdle
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
              className={`w-full border rounded-[18px] p-3.5 text-xs font-bold outline-none resize-none mb-4 ${ui.inputBg}`}
            />

            <button
              type="button"
              disabled={isProcessing || !tableNumber}
              onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
              className={`w-full disabled:opacity-45 py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all ${ui.primaryCta}`}
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
          مودال ۸: پیگیری زنده سفارش (Live Glass Tracker)
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] sm:rounded-[30px] border p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200 ${ui.sheetBg}`}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 ${ui.glassBtn}`}
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
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${ui.glassBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-black border px-3 py-1 rounded-full mb-2 ${ui.accentSoft}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش تحویل داده شد"
                    : "Order Completed!"
                  : isFa
                    ? "وضعیت زنده سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div
              className={`rounded-[22px] border p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar ${ui.subSurface}`}
            >
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
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? ui.primaryCta
                            : `${ui.subSurface} ${ui.mutedText}`
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
                      <span className="block font-black text-xs sm:text-sm">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span
                          className={`block text-[11px] font-medium mt-0.5 ${ui.mutedText}`}
                        >
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
              className={`w-full py-3.5 rounded-full font-black text-sm shrink-0 ${ui.primaryCta}`}
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

export default Template13;
