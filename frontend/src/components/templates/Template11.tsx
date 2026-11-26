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
  Gamepad2,
  Crosshair,
  Zap,
  Radio,
  Trophy,
  Terminal,
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
    name: "دریافت مأموریت سفارش",
    description: "سفارش شما روی سرور آشپزخانه ثبت شد",
  },
  {
    id: "preparing",
    name: "در حال ساخت و آماده‌سازی",
    description: "تیم آشپزخانه مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده تحویل (Loot Ready)",
    description: "سفارش تکمیل شده و تا لحظاتی دیگر سر میز می‌رسد",
  },
];

type RarityKey = "common" | "rare" | "epic" | "legendary";

interface RarityConfig {
  key: RarityKey;
  labelFa: string;
  labelEn: string;
  accent: string;
  borderClass: string;
  badgeClass: string;
  glowStyle: string;
}

const RARITY_MAP: Record<RarityKey, RarityConfig> = {
  common: {
    key: "common",
    labelFa: "کلاسیک",
    labelEn: "COMMON",
    accent: "#39FF14",
    borderClass: "from-[#39FF14]/50 via-[#39FF14]/15 to-white/10",
    badgeClass: "text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/35",
    glowStyle: "0 0 18px rgba(57,255,20,0.12)",
  },
  rare: {
    key: "rare",
    labelFa: "کمیاب",
    labelEn: "RARE",
    accent: "#00F0FF",
    borderClass: "from-[#00F0FF]/65 via-[#00F0FF]/20 to-white/10",
    badgeClass: "text-[#00F0FF] bg-[#00F0FF]/10 border-[#00F0FF]/35",
    glowStyle: "0 0 20px rgba(0,240,255,0.15)",
  },
  epic: {
    key: "epic",
    labelFa: "حماسی",
    labelEn: "EPIC",
    accent: "#FF2A85",
    borderClass: "from-[#FF2A85]/70 via-[#FF2A85]/20 to-white/10",
    badgeClass: "text-[#FF2A85] bg-[#FF2A85]/10 border-[#FF2A85]/40",
    glowStyle: "0 0 22px rgba(255,42,133,0.16)",
  },
  legendary: {
    key: "legendary",
    labelFa: "افسانه‌ای",
    labelEn: "LEGENDARY",
    accent: "#FFB800",
    borderClass: "from-[#FFB800]/80 via-[#FFB800]/25 to-[#FF2A85]/20",
    badgeClass: "text-[#FFB800] bg-[#FFB800]/12 border-[#FFB800]/45",
    glowStyle: "0 0 24px rgba(255,184,0,0.18)",
  },
};

const Template11: React.FC<TemplateProps> = ({
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

  // سیستم رزرو آنلاین میزها (Lobby Slots)
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

  // اتصال WebSocket منو (مراحل پخت + وضعیت لحظه‌ای اسلات میزها)
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
                    ? `اسلات میز ${prevSelected} لحظاتی پیش پر شد. لطفاً میز دیگری انتخاب کنید.`
                    : `Slot #${prevSelected} was just locked. Pick another slot.`,
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

  // اتصال WebSocket پیگیری زنده مأموریت سفارش
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
          ? "ابتدا یک اسلات میز آزاد انتخاب کنید."
          : "Select an open table slot first.",
      );
      return;
    }
    if (reserveName.trim().length < 2) {
      setReserveError(
        isFa
          ? "نام بازیکن / مهمان را وارد کنید."
          : "Enter player / guest name.",
      );
      return;
    }
    if (reserveMobile.trim().length < 10) {
      setReserveError(
        isFa ? "شماره تماس معتبر وارد کنید." : "Enter a valid mobile number.",
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
        isFa ? "اسلات میز با موفقیت قفل و رزرو شد!" : "Lobby slot locked!",
      );
    } catch (err: any) {
      setReserveError(
        err?.message ||
          (isFa
            ? "خطا در ثبت رزرو میز. مجدداً تلاش کنید."
            : "Failed to reserve slot."),
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
      showToast(isFa ? "پینگ شما با موفقیت ارسال شد!" : "Signal transmitted!");
    } else {
      showToast(isFa ? "خطا در ارسال سیگنال." : "Signal failed.");
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
            ? `مأموریت سفارش #${normalizedOrder.orderNumber} آغاز شد!`
            : `Quest Order #${normalizedOrder.orderNumber} launched!`,
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

  const safeVenueName = venueData?.name || venueData?.Name || "آرکید کافه";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";
  const safePhone = venueData?.phone || venueData?.Phone || "";

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const safeCategories = Array.isArray(menuData) ? menuData : [];

  // محاسبه بازه قیمت‌ها برای درجه‌بندی خودکار Rarity آیتم‌ها
  const priceBounds = useMemo(() => {
    const prices: number[] = [];
    for (const cat of safeCategories) {
      for (const p of cat.products || []) {
        const val = Number(p?.price || 0);
        if (val > 0) prices.push(val);
      }
    }
    if (prices.length === 0) return { min: 0, max: 1 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [safeCategories]);

  const getProductRarity = (prod: any, fallbackIdx: number): RarityConfig => {
    const price = Number(prod?.price || 0);
    const range = priceBounds.max - priceBounds.min;
    if (range <= 0) {
      const cycle: RarityKey[] = ["rare", "epic", "common", "legendary"];
      return RARITY_MAP[cycle[fallbackIdx % cycle.length]];
    }
    const ratio = (price - priceBounds.min) / range;
    if (ratio >= 0.8) return RARITY_MAP.legendary;
    if (ratio >= 0.52) return RARITY_MAP.epic;
    if (ratio >= 0.25) return RARITY_MAP.rare;
    return RARITY_MAP.common;
  };

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
  const questProgressPercent =
    dynamicStages.length > 0
      ? Math.min(
          100,
          Math.round((currentStageIndex / dynamicStages.length) * 100),
        )
      : 0;

  const timePresetsFa = ["۱۸:۰۰", "۲۰:۰۰", "۲۲:۰۰", "۲۳:۳۰"];
  const timePresetsEn = ["18:00", "20:00", "22:00", "23:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "دسته بازی / باتری / شارژر",
    "تمدید نوشیدنی انرژی‌زا و آب",
    "حضور ادمین سالن سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Controller / charger help",
    "Refill drinks & water",
    "Need staff at station",
  ];

  const chefPresetsFa = [
    "بدون پیاز و خیارشور",
    "سس تند و پنیر اضافه",
    "نوشیدنی با یخ زیاد",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "No onions or pickles",
    "Extra spicy sauce & cheese",
    "Extra ice in drink",
    "Food allergy note",
  ];

  return (
    <div
      className="min-h-screen bg-[#07070C] text-[#F1F5F9] font-sans antialiased selection:bg-[#00F0FF]/25 overflow-x-hidden pb-40 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* شبکه پس‌زمینه سایبری و هاله‌های نئونی */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="fixed top-[-140px] right-[-100px] w-[380px] h-[380px] bg-[#00F0FF]/12 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-120px] left-[-100px] w-[380px] h-[380px] bg-[#FF2A85]/12 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* اعلان دستاورد (Achievement Unlocked Toast) */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="p-[1px] bg-gradient-to-r from-[#00F0FF] via-[#FF2A85] to-[#00F0FF] hud-chamfer-sm shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <div className="bg-[#0D0E16]/95 backdrop-blur-xl px-4 py-2.5 hud-chamfer-sm flex items-center gap-2.5 text-xs font-black text-white">
              <Trophy size={15} className="text-[#FFB800] shrink-0" />
              <span>{toastMsg}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: نوار وضعیت HUD بالای صفحه + بنر کلاب / گیم‌کافه
         ======================================================== */}
      <header className="relative z-10 max-w-4xl mx-auto px-3.5 pt-3.5 pb-4 space-y-3">
        {/* نوار وضعیت سیستم (System Telemetry Bar) */}
        <div className="flex items-center justify-between gap-2 bg-[#10111A]/90 border border-[#00F0FF]/20 px-3 py-2 text-[10px] font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse shrink-0" />
            <span className="text-[#39FF14] font-black tracking-wider">
              ONLINE
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-[#00F0FF] font-black truncate">
              {tableNumber
                ? `STATION-${String(tableNumber).padStart(2, "0")}`
                : "SPECTATOR MODE"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="bg-[#FF2A85] hover:bg-[#E11D74] text-white px-2.5 py-1 hud-chamfer-xs font-black flex items-center gap-1 shadow-[0_0_12px_rgba(255,42,133,0.45)] active:scale-95 transition-transform"
              >
                <Zap size={11} />
                <span>#{activeOrder.orderNumber}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              aria-label="رادار جستجو"
              className={`w-7 h-7 border flex items-center justify-center transition-colors ${
                isSearchOpen || searchQuery
                  ? "bg-[#00F0FF] text-[#07070C] border-[#00F0FF]"
                  : "bg-[#161826] text-[#00F0FF] border-[#00F0FF]/30 hover:border-[#00F0FF]"
              }`}
            >
              {isSearchOpen ? <X size={13} /> : <Search size={13} />}
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-7 px-2 bg-[#161826] border border-[#00F0FF]/30 hover:border-[#00F0FF] text-[#F1F5F9] font-black flex items-center gap-1"
              >
                <Globe size={11} className="text-[#00F0FF]" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label="اطلاعات کلاب"
              className="w-7 h-7 bg-[#161826] border border-white/15 hover:border-[#FF2A85] text-slate-300 hover:text-[#FF2A85] flex items-center justify-center transition-colors"
            >
              <Info size={13} />
            </button>
          </div>
        </div>

        {/* پنل اصلی HUD مجموعه با گوشه‌های پخ‌خورده و حاشیه نئونی */}
        <div className="p-[1px] bg-gradient-to-br from-[#00F0FF]/60 via-white/10 to-[#FF2A85]/60 hud-chamfer shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
          <div className="bg-[#0E1019] hud-chamfer p-4 sm:p-5 relative overflow-hidden">
            {/* خطوط تزئینی گوشه HUD */}
            <span className="absolute top-0 left-6 w-20 h-[2px] bg-[#00F0FF]" />
            <span className="absolute bottom-0 right-6 w-20 h-[2px] bg-[#FF2A85]" />

            <div className="flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* آواتار کلاب با قاب هدف‌گیر */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 p-[2px] bg-gradient-to-br from-[#00F0FF] to-[#FF2A85] hud-chamfer-sm">
                  <div className="w-full h-full bg-[#090A10] hud-chamfer-sm overflow-hidden flex items-center justify-center">
                    {safeLogo ? (
                      <img
                        src={getFullImageUrl(safeLogo)}
                        alt={safeVenueName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Gamepad2 size={28} className="text-[#00F0FF]" />
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-[#00F0FF] mb-0.5">
                    <Terminal size={11} />
                    <span>
                      {isFa ? "منوی تجهیزات و تغذیه" : "SUPPLY & LOOT TERMINAL"}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {safeVenueName}
                  </h1>
                  {(isFa ? safeAboutFa : safeAboutEn) && (
                    <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed mt-1">
                      {isFa ? safeAboutFa : safeAboutEn}
                    </p>
                  )}
                </div>
              </div>

              {/* نشان وضعیت میز */}
              {tableNumber && (
                <div className="hidden sm:flex flex-col items-center justify-center px-3.5 py-2 bg-[#161927] border border-[#00F0FF]/35 shrink-0 font-mono">
                  <span className="text-[9px] text-slate-400 font-bold">
                    {isFa ? "ایستگاه" : "STATION"}
                  </span>
                  <span className="text-lg font-black text-[#00F0FF] leading-tight">
                    #{String(tableNumber).padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>

            {/* نوار اکشن‌های تاکتیکی (رزرو لابی / پینگ ادمین / پینگ آشپزخانه) */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={openReservationModal}
                className={`${
                  tableNumber &&
                  (venueData?.callWaiterEnabled || venueData?.callChefEnabled)
                    ? ""
                    : "col-span-3"
                } bg-[#00F0FF]/12 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#07070C] border border-[#00F0FF]/45 py-2.5 px-2.5 hud-chamfer-xs font-black text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95`}
              >
                <CalendarCheck size={14} className="shrink-0" />
                <span className="truncate">
                  {isFa ? "رزرو اسلات" : "Book Slot"}
                </span>
                {tablesList.length > 0 && (
                  <span className="font-mono text-[10px] bg-black/35 text-[#39FF14] px-1.5 py-0.2">
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
                  className="bg-[#FF2A85]/12 hover:bg-[#FF2A85] text-[#FF2A85] hover:text-white border border-[#FF2A85]/45 py-2.5 px-2 hud-chamfer-xs font-black text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Radio size={14} className="shrink-0" />
                  <span className="truncate">
                    {isFa ? "پینگ سالن" : "Ping Staff"}
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
                  className="bg-[#FFB800]/12 hover:bg-[#FFB800] text-[#FFB800] hover:text-[#07070C] border border-[#FFB800]/45 py-2.5 px-2 hud-chamfer-xs font-black text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <ChefHat size={14} className="shrink-0" />
                  <span className="truncate">
                    {isFa ? "پیام مطبخ" : "Kitchen"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: تب‌های Loadout دسته‌بندی‌ها + رادار جستجو
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#07070C]/92 backdrop-blur-xl border-y border-[#00F0FF]/15 py-2.5">
        <div className="max-w-4xl mx-auto px-3.5 space-y-2.5">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
              <Crosshair
                size={15}
                className={`absolute top-1/2 -translate-y-1/2 text-[#00F0FF] ${
                  isFa ? "right-3.5" : "left-3.5"
                }`}
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? "اسکن و جستجوی آیتم در اینونتوری..."
                    : "Scan inventory items..."
                }
                className={`w-full bg-[#10121E] border border-[#00F0FF]/45 focus:border-[#00F0FF] py-2.5 text-xs font-bold text-white placeholder:text-slate-500 outline-none ${
                  isFa ? "pr-10 pl-9" : "pl-10 pr-9"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white ${
                    isFa ? "left-3" : "right-3"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
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
                className={`px-3.5 py-2 hud-chamfer-xs text-xs font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "bg-[#00F0FF] text-[#07070C] border-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.4)]"
                    : "bg-[#121422] text-slate-400 border-white/10 hover:text-white hover:border-[#00F0FF]/40"
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">00</span>
                <span>{isFa ? "همه تجهیزات" : "ALL LOOT"}</span>
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
                    className={`px-3.5 py-2 hud-chamfer-xs text-xs font-black whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#FF2A85] text-white border-[#FF2A85] shadow-[0_0_16px_rgba(255,42,133,0.45)]"
                        : "bg-[#121422] text-slate-400 border-white/10 hover:text-white hover:border-[#FF2A85]/40"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-75">
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
      </div>

      {/* ========================================================
          بخش ۳: شبکه کارت‌های تجهیزات (RPG Inventory Loot Cards)
         ======================================================== */}
      <main className="relative z-10 max-w-4xl mx-auto px-3.5 pt-5">
        {!tableNumber && (
          <div className="mb-5 bg-[#10121E] border border-[#FFB800]/40 p-3.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
              {isFa
                ? "در حالت تماشاگر هستید. برای سفارش مستقیم، بارکد ایستگاه/میز خود را اسکن کنید یا اسلات رزرو نمایید."
                : "Spectator mode active. Scan your station QR to equip items."}
            </p>
            <button
              type="button"
              onClick={openReservationModal}
              className="shrink-0 bg-[#FFB800] text-[#07070C] px-3 py-1.5 hud-chamfer-xs text-[11px] font-black"
            >
              {isFa ? "رزرو اسلات" : "Book"}
            </button>
          </div>
        )}

        {filteredMenu.length === 0 ? (
          <div className="bg-[#10121E] border border-white/10 hud-chamfer py-16 text-center">
            <Crosshair size={34} className="text-[#00F0FF]/35 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">
              {isFa
                ? "آیتمی در اسکن رادار پیدا نشد."
                : "No loot matched your scan."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMenu.map((cat: any, catIdx: number) => {
              const hasProducts =
                Array.isArray(cat.products) && cat.products.length > 0;
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;
              const sectorCode = `SEC-${String(catIdx + 1).padStart(2, "0")}`;

              return (
                <section key={cat.id}>
                  {/* هدر سکتور اینونتوری */}
                  <div className="flex items-center justify-between gap-3 mb-3.5 px-0.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] font-black bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 px-2 py-0.5 shrink-0">
                        {sectorCode}
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                        {catTitle}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:block w-20 h-[1px] bg-gradient-to-r from-[#00F0FF]/40 to-transparent" />
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        [
                        {(cat.products?.length || 0)
                          .toString()
                          .padStart(2, "0")}
                        ]
                      </span>
                    </div>
                  </div>

                  {!hasProducts ? (
                    <div className="bg-[#10121E] border border-white/10 p-6 text-center text-xs font-bold text-slate-500">
                      {isFa ? "این سکتور خالی است." : "Empty inventory sector."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                        const canOrder =
                          Boolean(venueData?.orderingEnabled) &&
                          Boolean(tableNumber) &&
                          isAvailable;
                        const rarity = getProductRarity(prod, idx);
                        const itemCode = `#${String(catIdx + 1)}${String(idx + 1).padStart(2, "0")}`;

                        return (
                          <div
                            key={prod?.id}
                            onClick={() => openProductShowcase(prod)}
                            style={{
                              boxShadow: cartItem
                                ? "0 0 26px rgba(0,240,255,0.22)"
                                : rarity.glowStyle,
                            }}
                            className={`p-[1px] hud-chamfer transition-all duration-300 cursor-pointer group ${
                              cartItem
                                ? "bg-gradient-to-br from-[#00F0FF] via-[#00F0FF]/50 to-[#FF2A85]"
                                : `bg-gradient-to-br ${rarity.borderClass} hover:from-[#00F0FF]/80`
                            } ${!isAvailable ? "opacity-50 grayscale-[45%]" : ""}`}
                          >
                            <article className="bg-[#10121E] group-hover:bg-[#141726] hud-chamfer p-3.5 h-full flex flex-col justify-between transition-colors relative">
                              {/* نوار بالای کارت: کد آیتم + تگ Rarity + نشان EQUIPPED */}
                              <div className="flex items-center justify-between gap-2 mb-2.5 text-[10px] font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold">
                                    {itemCode}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 border font-black text-[9px] ${rarity.badgeClass}`}
                                  >
                                    {isFa ? rarity.labelFa : rarity.labelEn}
                                  </span>
                                </div>

                                {cartItem ? (
                                  <span className="bg-[#00F0FF] text-[#07070C] px-2 py-0.5 font-black text-[9px] flex items-center gap-1">
                                    <Check size={10} strokeWidth={3.5} />
                                    {isFa ? "در کوله‌پشتی" : "EQUIPPED"}
                                  </span>
                                ) : isAvailable &&
                                  hasFiniteStock &&
                                  Number(prod.stock) <= 5 ? (
                                  <span className="text-[#FF2A85] font-black animate-pulse">
                                    HP {prod.stock}/5
                                  </span>
                                ) : null}
                              </div>

                              {/* بدنه میانی: قاب تصویر نشانه‌گیر + نام و توضیحات */}
                              <div className="flex items-start gap-3.5">
                                <div className="relative w-20 h-20 sm:w-22 sm:h-22 bg-[#090A10] shrink-0 overflow-hidden flex items-center justify-center p-1 border border-white/10">
                                  {/* گوشه‌های نشانه‌گیر Reticle */}
                                  <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00F0FF]/80 pointer-events-none z-10" />
                                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#FF2A85]/80 pointer-events-none z-10" />

                                  {prod?.imageUrl ? (
                                    <img
                                      src={getFullImageUrl(prod.imageUrl)}
                                      alt={isFa ? prod.nameFa : prod.nameEn}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  ) : (
                                    <UtensilsCrossed
                                      size={24}
                                      className="text-slate-600"
                                    />
                                  )}

                                  {!isAvailable && (
                                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                                      <span className="text-[#FF2A85] border border-[#FF2A85] text-[9px] font-black px-1.5 py-0.5">
                                        {isFa ? "خالی" : "LOCKED"}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-black text-sm sm:text-[15px] text-white leading-snug line-clamp-2">
                                    {isFa
                                      ? prod?.nameFa
                                      : prod?.nameEn || prod?.nameFa}
                                  </h3>

                                  {(isFa
                                    ? prod?.descriptionFa
                                    : prod?.descriptionEn ||
                                      prod?.descriptionFa) && (
                                    <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed mt-1">
                                      {isFa
                                        ? prod?.descriptionFa
                                        : prod?.descriptionEn ||
                                          prod?.descriptionFa}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* نوار پایینی کارت: قیمت + کلید پخ‌خورده Equip */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2"
                              >
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-mono font-black text-base text-[#00F0FF] tabular-nums">
                                    {Number(prod?.price || 0).toLocaleString(
                                      "fa-IR",
                                    )}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {isFa ? "تومان" : "CR"}
                                  </span>
                                </div>

                                {canOrder && (
                                  <>
                                    {cartItem ? (
                                      <div className="flex items-center gap-1.5 bg-[#090A10] border border-[#00F0FF]/55 p-0.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFromCart(prod.id)
                                          }
                                          className="w-7 h-7 bg-[#1A1D2E] hover:bg-[#FF2A85] text-white flex items-center justify-center transition-colors active:scale-90"
                                        >
                                          <Minus size={13} strokeWidth={2.8} />
                                        </button>
                                        <span className="font-mono text-xs font-black text-[#00F0FF] min-w-[22px] text-center">
                                          {String(cartItem.quantity).padStart(
                                            2,
                                            "0",
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={Boolean(reachedMaxStock)}
                                          onClick={() => addToCart(prod)}
                                          className="w-7 h-7 bg-[#00F0FF] hover:bg-[#39FF14] disabled:opacity-30 text-[#07070C] flex items-center justify-center transition-colors active:scale-90"
                                        >
                                          <Plus size={13} strokeWidth={2.8} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => addToCart(prod)}
                                        className="bg-[#181B2C] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#07070C] border border-[#00F0FF]/50 px-3.5 py-1.5 hud-chamfer-xs font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
                                      >
                                        <Plus size={13} strokeWidth={2.8} />
                                        <span>{isFa ? "تجهیز" : "EQUIP"}</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </article>
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

        {/* فوتر سیستم ترنج */}
        <footer className="mt-12 pt-5 border-t border-white/[0.08] text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#00F0FF] transition-colors"
          >
            <Sparkles size={12} className="text-[#FF2A85]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۴: هات‌بار اسلات‌های کوله‌پشتی (RPG Quick-Slot Hotbar)
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 inset-x-3 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <div className="w-full max-w-md p-[1px] bg-gradient-to-r from-[#00F0FF] via-[#FF2A85] to-[#00F0FF] hud-chamfer shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#0C0E18]/95 hover:bg-[#111424] backdrop-blur-2xl p-2.5 px-3.5 hud-chamfer flex items-center justify-between gap-3 active:scale-[0.99] transition-all"
            >
              {/* ۴ اسلات کوله‌پشتی سریع */}
              <div className="flex items-center gap-1.5 shrink-0">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const slotItem = cart[slotIdx];
                  return (
                    <div
                      key={slotIdx}
                      className={`relative w-9 h-9 border flex items-center justify-center overflow-hidden ${
                        slotItem
                          ? "border-[#00F0FF]/70 bg-[#151828]"
                          : "border-dashed border-white/15 bg-black/35"
                      }`}
                    >
                      {slotItem ? (
                        <>
                          {slotItem.product?.imageUrl ? (
                            <img
                              src={getFullImageUrl(slotItem.product.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gamepad2 size={14} className="text-[#00F0FF]" />
                          )}
                          <span className="absolute bottom-0 right-0 bg-[#07070C]/90 text-[#39FF14] font-mono text-[9px] font-black px-1 leading-tight">
                            ×{slotItem.quantity}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-[9px] text-white/20">
                          {slotIdx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* جمع کل و دکمه ارسال سفارش */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-left min-w-0">
                  <span className="block font-mono text-xs sm:text-sm font-black text-[#00F0FF] tabular-nums leading-tight">
                    {totalPrice.toLocaleString("fa-IR")}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400">
                    {totalItems.toLocaleString("fa-IR")}{" "}
                    {isFa ? "آیتم • تومان" : "ITEMS"}
                  </span>
                </div>

                <span className="bg-gradient-to-l from-[#FF2A85] to-[#FF4B9A] text-white px-3 py-2 hud-chamfer-xs font-black text-[11px] shrink-0 shadow-[0_0_15px_rgba(255,42,133,0.45)]">
                  {isFa ? "ارسال" : "SEND"}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۱: اطلاعات کلاب / مجموعه (Club Lore)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-[1px] bg-gradient-to-br from-[#00F0FF]/70 to-[#FF2A85]/70 hud-chamfer animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="bg-[#0E1019] hud-chamfer p-6 pb-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#161927] border border-[#00F0FF]/40 flex items-center justify-center overflow-hidden">
                    {safeLogo ? (
                      <img
                        src={getFullImageUrl(safeLogo)}
                        alt={safeVenueName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={20} className="text-[#00F0FF]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">
                      {safeVenueName}
                    </h3>
                    <span className="font-mono text-[10px] text-[#00F0FF]">
                      {isFa ? "مشخصات سرور و کلاب" : "ARENA INTEL"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(false)}
                  className="w-8 h-8 border border-white/15 bg-[#161927] text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}

              {(safeAddress || safePhone) && (
                <div className="bg-[#141726] border border-white/10 p-4 space-y-2.5 text-xs font-bold text-slate-200">
                  {safeAddress && (
                    <div className="flex items-start gap-2.5">
                      <MapPin
                        size={15}
                        className="text-[#00F0FF] shrink-0 mt-0.5"
                      />
                      <span>{safeAddress}</span>
                    </div>
                  )}
                  {safePhone && (
                    <div className="flex items-center gap-2.5 font-mono">
                      <Phone size={15} className="text-[#FF2A85] shrink-0" />
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
          مودال ۲: بررسی کامل آیتم (Inspect Loot Modal)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-[1px] bg-gradient-to-br from-[#00F0FF] via-white/15 to-[#FF2A85] hud-chamfer shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="bg-[#0E1019] hud-chamfer overflow-hidden">
              <div className="relative h-56 w-full bg-[#090A10] border-b border-[#00F0FF]/25">
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
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Gamepad2 size={46} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1019] via-transparent to-black/40" />

                <span className="absolute top-3.5 right-3.5 bg-[#07070C]/85 border border-[#00F0FF]/50 text-[#00F0FF] font-mono text-[10px] font-black px-2.5 py-1">
                  {isFa ? "بررسی آیتم" : "INSPECT LOOT"}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="absolute top-3.5 left-3.5 w-8 h-8 bg-[#07070C]/85 border border-white/20 text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 pb-7 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-white leading-snug">
                    {isFa
                      ? selectedProductModal.nameFa
                      : selectedProductModal.nameEn ||
                        selectedProductModal.nameFa}
                  </h3>
                  <span className="font-mono text-lg font-black text-[#00F0FF] shrink-0">
                    {Number(selectedProductModal.price || 0).toLocaleString(
                      "fa-IR",
                    )}{" "}
                    <span className="font-sans text-[10px] text-slate-400">
                      {isFa ? "تومان" : "CR"}
                    </span>
                  </span>
                </div>

                {(isFa
                  ? selectedProductModal.descriptionFa
                  : selectedProductModal.descriptionEn ||
                    selectedProductModal.descriptionFa) && (
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">
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
                            ? "افزودن ماد / یادداشت اختصاصی (مثلاً: سس تند بیشتر)..."
                            : "Custom mod / kitchen note..."
                        }
                        className="w-full bg-[#161927] border border-[#00F0FF]/30 focus:border-[#00F0FF] px-3.5 py-3 text-xs font-bold text-white placeholder:text-slate-500 outline-none"
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
                          <div className="w-full py-3.5 border border-[#FF2A85]/40 bg-[#FF2A85]/10 text-[#FF2A85] font-black text-xs text-center">
                            {isFa ? "آیتم ناموجود است" : "OUT OF STOCK"}
                          </div>
                        );
                      }

                      if (cItem) {
                        return (
                          <div className="flex items-center justify-between bg-[#161927] border border-[#00F0FF]/40 p-1.5">
                            <div className="flex items-center gap-3 px-2">
                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(selectedProductModal.id)
                                }
                                className="w-9 h-9 bg-[#090A10] border border-white/15 text-white flex items-center justify-center"
                              >
                                <Minus size={15} strokeWidth={2.5} />
                              </button>
                              <span className="font-mono font-black text-base text-[#00F0FF] min-w-[24px] text-center">
                                {String(cItem.quantity).padStart(2, "0")}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(selectedProductModal)}
                                className="w-9 h-9 bg-[#00F0FF] text-[#07070C] flex items-center justify-center"
                              >
                                <Plus size={15} strokeWidth={2.5} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedProductModal(null)}
                              className="bg-[#FF2A85] text-white px-6 py-2.5 hud-chamfer-xs font-black text-xs"
                            >
                              {isFa ? "تایید" : "CONFIRM"}
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
                                ? "به کوله‌پشتی اضافه شد!"
                                : "Item equipped to inventory!",
                            );
                          }}
                          className="w-full bg-[#00F0FF] hover:bg-[#39FF14] text-[#07070C] py-3.5 hud-chamfer-xs font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] active:scale-95 transition-all"
                        >
                          <Zap size={16} />
                          <span>
                            {isFa ? "افزودن به کوله‌پشتی" : "EQUIP TO BAG"}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedProductModal(null)}
                    className="w-full bg-[#161927] border border-white/15 text-white py-3.5 hud-chamfer-xs font-black text-xs"
                  >
                    {isFa ? "بستن" : "CLOSE"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۳: انتخاب اسلات لابی / رزرو آنلاین میز (Lobby Select)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-[1px] bg-gradient-to-br from-[#00F0FF]/80 via-white/10 to-[#FF2A85]/80 hud-chamfer max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="bg-[#0E1019] hud-chamfer p-5 pb-7 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-white">
                      {isFa ? "رزرو اسلات و میز لابی" : "LOBBY SEAT SELECT"}
                    </h3>
                    <span className="font-mono text-[9px] font-black bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] px-1.5 py-0.5">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">
                    {safeVenueName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReserveModal(false)}
                  className="w-8 h-8 border border-white/15 bg-[#161927] text-slate-300 flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              {confirmedReservation ? (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-[#39FF14]/15 border border-[#39FF14] text-[#39FF14] flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.25)]">
                    <CheckCircle2 size={34} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">
                      {isFa ? "اسلات شما قفل شد!" : "SLOT LOCKED IN!"}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      {isFa
                        ? "میز انتخابی روی سرور مجموعه به نام شما ثبت گردید"
                        : "Your station is reserved on the server"}
                    </p>
                  </div>

                  <div className="bg-[#141726] border border-white/10 p-4 space-y-2 text-xs font-bold text-right">
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-slate-400">
                        {isFa ? "ایستگاه:" : "SLOT:"}
                      </span>
                      <span className="font-mono font-black text-[#00F0FF]">
                        #
                        {String(confirmedReservation.tableNumber).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-slate-400">
                        {isFa ? "نام بازیکن:" : "PLAYER:"}
                      </span>
                      <span className="font-black text-white">
                        {confirmedReservation.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-slate-400">
                        {isFa ? "تماس:" : "PHONE:"}
                      </span>
                      <span
                        className="font-mono font-black text-white"
                        dir="ltr"
                      >
                        {confirmedReservation.customerMobile}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">
                        {isFa ? "تعداد اسکواد:" : "SQUAD:"}
                      </span>
                      <span className="font-black text-[#39FF14]">
                        {confirmedReservation.guestsCount.toLocaleString(
                          "fa-IR",
                        )}{" "}
                        {isFa ? "نفر" : "players"}
                        {confirmedReservation.reservationTime
                          ? ` • ${confirmedReservation.reservationTime}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReserveModal(false)}
                    className="w-full bg-[#00F0FF] text-[#07070C] py-3.5 hud-chamfer-xs font-black text-sm"
                  >
                    {isFa ? "بازگشت به اینونتوری" : "RETURN TO MENU"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                    <div className="flex items-center justify-between bg-[#141726] border border-white/10 px-3.5 py-2 text-[10px] font-mono font-bold">
                      <span className="flex items-center gap-1.5 text-[#39FF14]">
                        <span className="w-2 h-2 bg-[#39FF14]" />
                        {isFa ? "آزاد" : "OPEN"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[#FFB800]">
                        <span className="w-2 h-2 bg-[#FFB800]" />
                        {isFa ? "رزرو" : "BOOKED"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[#FF2A85]">
                        <span className="w-2 h-2 bg-[#FF2A85]" />
                        {isFa ? "در بازی" : "IN-GAME"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-[#00F0FF]">
                          {isFa ? "۱. انتخاب شماره میز:" : "1. Pick open slot:"}
                        </label>
                        {isLoadingTables && (
                          <Loader2
                            size={14}
                            className="animate-spin text-[#00F0FF]"
                          />
                        )}
                      </div>

                      {tablesList.length === 0 ? (
                        <div className="bg-[#141726] border border-white/10 p-4 text-center text-xs font-bold text-slate-400">
                          {isFa
                            ? "اسلات میزی تعریف نشده است."
                            : "No slots configured."}
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
                                className={`py-2.5 border transition-all flex flex-col items-center justify-center font-mono ${
                                  isSelected
                                    ? "border-[#00F0FF] bg-[#00F0FF] text-[#07070C] shadow-[0_0_15px_rgba(0,240,255,0.45)]"
                                    : isFree
                                      ? "border-[#39FF14]/40 bg-[#39FF14]/10 text-white hover:border-[#00F0FF]"
                                      : "border-white/10 bg-[#141726] text-slate-500 opacity-50 cursor-not-allowed"
                                }`}
                              >
                                <span className="text-xs font-black">
                                  #{String(t.tableNumber).padStart(2, "0")}
                                </span>
                                <span
                                  className={`font-sans text-[9px] font-bold mt-0.5 ${
                                    isSelected
                                      ? "text-[#07070C]"
                                      : isFree
                                        ? "text-[#39FF14]"
                                        : t.state === "reserved"
                                          ? "text-[#FFB800]"
                                          : "text-[#FF2A85]"
                                  }`}
                                >
                                  {isSelected
                                    ? isFa
                                      ? "قفل شد"
                                      : "LOCKED"
                                    : isFree
                                      ? isFa
                                        ? "آزاد"
                                        : "OPEN"
                                      : t.state === "reserved"
                                        ? isFa
                                          ? "رزرو"
                                          : "BOOKED"
                                        : isFa
                                          ? "اشغال"
                                          : "BUSY"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#141726] border border-white/10 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-white">
                          <Users size={14} className="text-[#00F0FF]" />
                          {isFa ? "اندازه اسکواد (نفرات)" : "Squad Size"}
                        </span>
                        <div className="flex items-center gap-2 bg-[#090A10] border border-white/15 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setReserveGuests((g) => Math.max(1, g - 1))
                            }
                            className="w-7 h-7 bg-[#1A1D2E] text-white flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-mono text-xs font-black text-[#00F0FF] min-w-[34px] text-center">
                            {reserveGuests.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReserveGuests((g) => Math.min(30, g + 1))
                            }
                            className="w-7 h-7 bg-[#00F0FF] text-[#07070C] flex items-center justify-center"
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
                            className={`px-3 py-1 font-mono text-[11px] font-bold border transition-colors ${
                              reserveTime === slot
                                ? "bg-[#FF2A85] text-white border-[#FF2A85]"
                                : "bg-[#090A10] text-slate-400 border-white/15"
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
                          className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${
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
                            isFa ? "نام بازیکن / مهمان *" : "Player Name *"
                          }
                          className={`w-full bg-[#141726] border border-white/15 focus:border-[#00F0FF] py-2.5 text-xs font-bold text-white placeholder:text-slate-500 outline-none ${
                            isFa ? "pr-9 pl-3.5" : "pl-9 pr-3.5"
                          }`}
                        />
                      </div>

                      <div className="relative">
                        <Phone
                          size={14}
                          className={`absolute top-1/2 -translate-y-1/2 text-slate-500 ${
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
                          className="w-full bg-[#141726] border border-white/15 focus:border-[#00F0FF] py-2.5 px-9 text-left font-mono text-xs font-bold text-white placeholder:text-slate-500 outline-none"
                        />
                      </div>

                      <input
                        type="text"
                        value={reserveNotes}
                        onChange={(e) => setReserveNotes(e.target.value)}
                        placeholder={
                          isFa
                            ? "توضیحات (مثلاً: میز PS5 یا بردگیم)..."
                            : "Note (e.g. PS5 / Boardgame)..."
                        }
                        className="w-full bg-[#141726] border border-white/15 focus:border-[#00F0FF] py-2.5 px-3.5 text-xs font-bold text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>

                    {reserveError && (
                      <div className="flex items-center gap-2 bg-[#FF2A85]/15 border border-[#FF2A85]/45 text-[#FF2A85] p-2.5 text-xs font-black">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{reserveError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isReserving || availableTablesCount === 0}
                    onClick={handleCustomerReserve}
                    className="w-full bg-[#00F0FF] hover:bg-[#39FF14] disabled:opacity-40 text-[#07070C] py-3.5 hud-chamfer-xs font-black text-sm flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    {isReserving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CalendarCheck size={16} />
                        <span>
                          {selectedReserveTable
                            ? isFa
                              ? `قفل کردن اسلات میز #${selectedReserveTable}`
                              : `LOCK SLOT #${selectedReserveTable}`
                            : isFa
                              ? "ثبت نهایی رزرو"
                              : "LOCK RESERVATION"}
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
          مودال ۴: کوله‌پشتی سفارش (Inventory Cart Drawer)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0E1019] border-t-2 border-[#00F0FF] w-full max-w-lg mx-auto p-5 pb-7 shadow-[0_-15px_50px_rgba(0,240,255,0.18)] flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-between items-center pb-3.5 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Gamepad2 size={18} className="text-[#00F0FF]" />
                  <span>{isFa ? "کوله‌پشتی سفارش" : "PLAYER INVENTORY"}</span>
                </h3>
                {tableNumber && (
                  <p className="font-mono text-[11px] font-bold text-[#39FF14] mt-0.5">
                    STATION-{String(tableNumber).padStart(2, "0")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 border border-white/15 bg-[#161927] text-slate-300 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div
                    key={pid}
                    className="bg-[#141726] border border-white/10 p-3 space-y-2.5"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-white truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="font-mono text-xs text-[#00F0FF] font-bold mt-0.5 tabular-nums">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          <span className="font-sans text-[10px] text-slate-400">
                            {isFa ? "تومان" : "CR"}
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
                            className={`w-7 h-7 border flex items-center justify-center ${
                              isNoteOpen
                                ? "bg-[#FF2A85] text-white border-[#FF2A85]"
                                : "bg-[#090A10] text-slate-400 border-white/15"
                            }`}
                          >
                            <MessageSquarePlus size={13} />
                          </button>
                        )}

                        <div className="flex items-center bg-[#090A10] border border-[#00F0FF]/40 p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 bg-[#1A1D2E] text-white flex items-center justify-center"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="font-mono text-xs font-black text-[#00F0FF] min-w-[22px] text-center">
                            {String(item.quantity).padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 bg-[#00F0FF] text-[#07070C] flex items-center justify-center"
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
                            ? "ماد / یادداشت آشپزخانه..."
                            : "Mod / kitchen note..."
                        }
                        className="w-full bg-[#090A10] border border-white/15 focus:border-[#00F0FF] px-3 py-2 text-xs font-bold text-white outline-none"
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
                  isFa
                    ? "گیمرتگ یا نام شما (اختیاری)"
                    : "Gamertag / Name (optional)"
                }
                className="w-full bg-[#141726] border border-white/15 focus:border-[#00F0FF] px-3.5 py-3 text-xs font-bold text-white placeholder:text-slate-500 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-gradient-to-l from-[#FF2A85] to-[#FF4B9A] hover:from-[#00F0FF] hover:to-[#39FF14] hover:text-[#07070C] disabled:opacity-45 text-white py-3.5 hud-chamfer-xs font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,42,133,0.4)] transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>
                    {isFa ? "ارسال نهایی سفارش" : "DEPLOY ORDER"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")} {isFa ? "تومان" : "CR"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۵ و ۶: پینگ تاکتیکی به سالن و آشپزخانه (Tactical Comms)
         ======================================================== */}
      {(waiterModal || chefModal) && (
        <div
          onClick={() => {
            if (isProcessing) return;
            setWaiterModal(false);
            setChefModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md p-[1px] hud-chamfer animate-in slide-in-from-bottom-8 duration-300 ${
              waiterModal
                ? "bg-gradient-to-br from-[#FF2A85] to-[#00F0FF]/40"
                : "bg-gradient-to-br from-[#FFB800] to-[#00F0FF]/40"
            }`}
          >
            <div className="bg-[#0E1019] hud-chamfer p-5 pb-7">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 border flex items-center justify-center ${
                      waiterModal
                        ? "bg-[#FF2A85]/15 border-[#FF2A85]/50 text-[#FF2A85]"
                        : "bg-[#FFB800]/15 border-[#FFB800]/50 text-[#FFB800]"
                    }`}
                  >
                    {waiterModal ? (
                      <BellRing size={18} />
                    ) : (
                      <ChefHat size={18} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">
                      {waiterModal
                        ? isFa
                          ? "پینگ سریع سالن‌دار"
                          : "PING SUPPORT"
                        : isFa
                          ? "ارسال پیام به آشپزخانه"
                          : "KITCHEN COMMS"}
                    </h3>
                    <span className="font-mono text-[10px] text-[#00F0FF]">
                      STATION-{String(tableNumber || 0).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWaiterModal(false);
                    setChefModal(false);
                  }}
                  className="w-8 h-8 border border-white/15 bg-[#161927] text-slate-300 flex items-center justify-center"
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
                        ? waiterModal
                          ? "bg-[#FF2A85] text-white border-[#FF2A85]"
                          : "bg-[#FFB800] text-[#07070C] border-[#FFB800]"
                        : "bg-[#141726] text-slate-300 border-white/15"
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
                  isFa ? "متن پیام رادیویی..." : "Type comms message..."
                }
                className="w-full bg-[#141726] border border-white/15 focus:border-[#00F0FF] p-3 text-xs font-bold text-white placeholder:text-slate-500 outline-none resize-none mb-4"
              />

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleCall(waiterModal ? "waiter" : "chef")}
                className={`w-full py-3.5 hud-chamfer-xs font-black text-sm flex items-center justify-center gap-2 transition-colors ${
                  waiterModal
                    ? "bg-[#FF2A85] hover:bg-[#E11D74] text-white"
                    : "bg-[#FFB800] hover:bg-[#E5A600] text-[#07070C]"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={14} />
                    <span>{isFa ? "ارسال سیگنال" : "TRANSMIT"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال ۷: ردیاب مأموریت سفارش (Quest Progress Tracker)
         ======================================================== */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-[1px] bg-gradient-to-br from-[#00F0FF] via-[#FF2A85] to-[#39FF14] hud-chamfer max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="bg-[#0E1019] hud-chamfer p-5 pb-7 flex flex-col max-h-[88vh]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshOrder}
                  disabled={isRefreshingOrder}
                  className="bg-[#161927] border border-[#00F0FF]/40 text-[#00F0FF] px-3 py-1.5 text-xs font-mono font-black flex items-center gap-1.5"
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshingOrder ? "animate-spin" : ""}
                  />
                  <span>{isFa ? "همگام‌سازی" : "SYNC"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(false)}
                  className="w-8 h-8 border border-white/15 bg-[#161927] text-slate-300 flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="text-center mb-4 shrink-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black bg-[#FF2A85]/15 border border-[#FF2A85]/45 text-[#FF2A85] px-3 py-1 mb-2">
                  <Trophy size={13} />
                  <span>QUEST #{activeOrder.orderNumber}</span>
                </span>
                <h2 className="text-lg font-black text-white">
                  {String(activeOrder.status).toLowerCase() === "completed"
                    ? isFa
                      ? "مأموریت تکمیل شد! نوش جان"
                      : "QUEST COMPLETED!"
                    : isFa
                      ? "وضعیت زنده مأموریت سفارش"
                      : "LIVE QUEST OBJECTIVES"}
                </h2>

                {/* نوار پیشرفت XP */}
                <div className="mt-3 px-2">
                  <div className="flex justify-between font-mono text-[10px] font-bold text-[#00F0FF] mb-1">
                    <span>PROGRESS</span>
                    <span>{questProgressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#181B2C] border border-white/10 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.max(12, questProgressPercent)}%`,
                      }}
                      className="h-full bg-gradient-to-r from-[#00F0FF] via-[#FF2A85] to-[#39FF14] transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#141726] border border-white/10 p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                            ? "bg-[#39FF14] border-[#39FF14] text-[#07070C]"
                            : isActive
                              ? "bg-[#00F0FF] border-[#00F0FF] text-[#07070C] shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                              : "bg-[#090A10] border-white/20 text-slate-500"
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
                        <span className="block font-black text-xs sm:text-sm text-white">
                          {stage.name}
                        </span>
                        {stage.description && (
                          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
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
                className="w-full bg-[#00F0FF] text-[#07070C] py-3.5 hud-chamfer-xs font-black text-sm shrink-0"
              >
                {isFa ? "بازگشت به منو" : "RETURN TO MENU"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hud-chamfer {
          clip-path: polygon(
            12px 0,
            100% 0,
            100% calc(100% - 12px),
            calc(100% - 12px) 100%,
            0 100%,
            0 12px
          );
        }
        .hud-chamfer-sm {
          clip-path: polygon(
            9px 0,
            100% 0,
            100% calc(100% - 9px),
            calc(100% - 9px) 100%,
            0 100%,
            0 9px
          );
        }
        .hud-chamfer-xs {
          clip-path: polygon(
            7px 0,
            100% 0,
            100% calc(100% - 7px),
            calc(100% - 7px) 100%,
            0 100%,
            0 7px
          );
        }
      `}</style>
    </div>
  );
};

export default Template11;
