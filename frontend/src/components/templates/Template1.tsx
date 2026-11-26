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
  Utensils,
  CalendarCheck,
  Search,
  ShoppingBag,
  RefreshCw,
  MessageSquarePlus,
  Send,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  User,
  Phone,
  Check,
  AlertCircle,
} from "lucide-react";
import { reservationsApi } from "../../service/api";

export type CartItem = {
  product: any;
  quantity: number;
  notes?: string;
};

export type OrderStageInfo = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  orderIndex?: number;
};

export type ActiveOrderInfo = {
  id: string;
  orderNumber: number;
  status: string;
  stageId?: string;
  stages?: OrderStageInfo[];
  totalPrice: number;
};

export type PublicTableSlot = {
  tableNumber: number;
  state: "available" | "reserved" | "occupied";
};

export interface TemplateProps {
  venueData: any;
  menuData: any[];
  tableNumber: number | null;
  language: "fa" | "en";
  setLanguage: (lang: "fa" | "en") => void;
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateItemNotes?: (productId: string, notes: string) => void;
  submitOrder: (name: string, mobile: string) => Promise<any>;
  checkOrderStatus?: (orderId: string) => Promise<ActiveOrderInfo | null>;
  getOrderWsUrl?: (orderId: string) => string;
  callWaiter: (msg: string) => Promise<boolean>;
  callChef: (msg: string) => Promise<boolean>;
}

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

const Template1: React.FC<TemplateProps> = ({
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
  const [view, setView] = useState<"welcome" | "menu">("welcome");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});

  const [waiterModal, setWaiterModal] = useState(false);
  const [chefModal, setChefModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // وضعیت‌های سیستم رزرو آنلاین میزها
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

  // دریافت اولیه وضعیت میزها از سرور
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

            // اگر میزی که کاربر انتخاب کرده همین لحظه توسط شخص دیگری رزرو یا اشغال شد، انتخاب را لغو کن
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
        isFa
          ? "درخواست رزرو میز با موفقیت ثبت شد!"
          : "Table reservation submitted!",
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
        isFa ? "درخواست شما با موفقیت ارسال شد." : "Request sent successfully.",
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
            ? `سفارش #${normalizedOrder.orderNumber} با موفقیت ثبت شد!`
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

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const timePresetsFa = ["تا ۳۰ دقیقه دیگر", "۲۰:۰۰", "۲۱:۰۰", "۲۲:۰۰"];
  const timePresetsEn = ["In 30 mins", "20:00", "21:00", "22:00"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به قاشق و چنگال",
    "نیاز به راهنمایی برای سفارش",
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
    "درجه پخت کاملاً مغزپخت باشد",
    "سس جداگانه سرو شود",
  ];
  const chefPresetsEn = [
    "Less salt please",
    "No onion or garlic",
    "Well-done cooking",
    "Sauce on the side",
  ];

  // ========================================================
  // مودال مدرن رزرو آنلاین میزها (مشترک در صفحه خوش‌آمدگویی و منو)
  // ========================================================
  const renderReservationModal = () => {
    if (!reserveModal) return null;

    return (
      <div
        onClick={() => !isReserving && setReserveModal(false)}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5 sm:hidden shrink-0" />

          {/* هدر مودال */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100/80">
                <CalendarCheck size={22} strokeWidth={2.3} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {isFa ? "رزرو آنلاین میز" : "Live Table Reservation"}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isFa ? "زنده" : "Live"}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#86868B] mt-0.5">
                  {safeVenueName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReserveModal(false)}
              className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 text-[#6E6E73] flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* نمایش کارت تاییدیه بعد از ثبت موفق رزرو */}
          {confirmedReservation ? (
            <div className="py-4 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-[28px] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                <CheckCircle2 size={40} strokeWidth={2.2} />
              </div>

              <div>
                <h4 className="text-xl font-black text-[#1D1D1F] mb-1">
                  {isFa
                    ? "رزرو شما با موفقیت ثبت شد!"
                    : "Reservation Confirmed!"}
                </h4>
                <p className="text-xs font-bold text-[#86868B]">
                  {isFa
                    ? "میز انتخاب‌شده در سیستم مجموعه برای شما ثبت گردید"
                    : "Your table has been reserved in real-time"}
                </p>
              </div>

              <div className="bg-[#F5F5F7] rounded-[26px] p-4 space-y-2.5 text-xs font-bold text-right">
                <div className="flex items-center justify-between py-1 border-b border-black/[0.05]">
                  <span className="text-[#86868B]">
                    {isFa ? "شماره میز:" : "Table:"}
                  </span>
                  <span className="font-black text-orange-600 text-sm">
                    {isFa
                      ? `میز شماره ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                      : `Table #${confirmedReservation.tableNumber}`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-black/[0.05]">
                  <span className="text-[#86868B]">
                    {isFa ? "نام مهمان:" : "Guest Name:"}
                  </span>
                  <span className="font-black text-[#1D1D1F]">
                    {confirmedReservation.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-black/[0.05]">
                  <span className="text-[#86868B]">
                    {isFa ? "شماره تماس:" : "Phone:"}
                  </span>
                  <span
                    className="font-mono font-black text-[#1D1D1F]"
                    dir="ltr"
                  >
                    {confirmedReservation.customerMobile}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#86868B]">
                    {isFa ? "تعداد نفرات:" : "Guests:"}
                  </span>
                  <span className="font-black text-[#1D1D1F]">
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
                className="w-full bg-[#1D1D1F] hover:bg-black text-white py-4 rounded-full font-black text-sm transition-all active:scale-95"
              >
                {isFa ? "تایید و بازگشت" : "Done"}
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 no-scrollbar">
                {/* راهنمای رنگ وضعیت میزها */}
                <div className="flex items-center justify-between bg-[#F5F5F7] px-3.5 py-2.5 rounded-2xl text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    {isFa ? "آزاد" : "Free"}
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    {isFa ? "رزرو شده" : "Reserved"}
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    {isFa ? "سفارش باز" : "Occupied"}
                  </span>
                </div>

                {/* گرید انتخاب میزهای سالن */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-[#1D1D1F]">
                      {isFa
                        ? "۱. میز مورد نظر خود را انتخاب کنید:"
                        : "1. Select an available table:"}
                    </label>
                    {isLoadingTables && (
                      <Loader2
                        size={14}
                        className="animate-spin text-orange-500"
                      />
                    )}
                  </div>

                  {tablesList.length === 0 ? (
                    <div className="bg-[#F5F5F7] rounded-2xl p-4 text-center text-xs font-bold text-[#6E6E73]">
                      {isFa
                        ? "در حال حاضر میزی برای رزرو آنلاین تعریف نشده است."
                        : "No tables available for online booking."}
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
                            className={`relative py-3 px-1.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-[1.03]"
                                : isFree
                                  ? "border-emerald-200/90 bg-emerald-50/70 text-emerald-900 hover:border-emerald-400 active:scale-95"
                                  : t.state === "reserved"
                                    ? "border-amber-200/80 bg-amber-50/60 text-amber-700 opacity-65 cursor-not-allowed"
                                    : "border-rose-200/80 bg-rose-50/60 text-rose-700 opacity-65 cursor-not-allowed"
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-orange-500 flex items-center justify-center">
                                <Check size={10} strokeWidth={3.5} />
                              </span>
                            )}
                            <span className="text-sm font-black">
                              {isFa
                                ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                : `#${t.tableNumber}`}
                            </span>
                            <span
                              className={`text-[9px] font-bold mt-0.5 ${
                                isSelected ? "text-white/90" : ""
                              }`}
                            >
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
                                      ? "رزرو شده"
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

                {/* تعداد نفرات و ساعت حضور */}
                <div className="bg-[#F5F5F7] rounded-3xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#1D1D1F] flex items-center gap-1.5">
                      <Users size={15} className="text-orange-500" />
                      {isFa ? "تعداد نفرات:" : "Guests:"}
                    </span>
                    <div className="flex items-center gap-2.5 bg-white rounded-full p-1 border border-black/[0.05]">
                      <button
                        type="button"
                        onClick={() =>
                          setReserveGuests((g) => Math.max(1, g - 1))
                        }
                        className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center active:scale-90"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="text-xs font-black text-[#1D1D1F] min-w-[44px] text-center">
                        {reserveGuests.toLocaleString("fa-IR")}{" "}
                        {isFa ? "نفر" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReserveGuests((g) => Math.min(25, g + 1))
                        }
                        className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center active:scale-90"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-[#6E6E73] mb-2">
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
                              ? "bg-[#1D1D1F] text-white"
                              : "bg-white text-[#1D1D1F] border border-black/[0.05]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* مشخصات مهمان */}
                <div className="space-y-3">
                  <div className="relative">
                    <User
                      size={15}
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
                        isFa
                          ? "نام و نام خانوادگی (الزامی)"
                          : "Full Name (required)"
                      }
                      className={`w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-orange-500 rounded-2xl py-3.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none transition-all ${
                        isFa ? "pr-10 pl-4" : "pl-10 pr-4"
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <Phone
                      size={15}
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
                      className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-orange-500 rounded-2xl py-3.5 px-10 text-left font-mono text-sm font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none transition-all"
                    />
                  </div>

                  <input
                    type="text"
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    placeholder={
                      isFa
                        ? "توضیحات (اختیاری - مثلاً: جشن تولد / کنار پنجره)"
                        : "Special note (optional)..."
                    }
                    className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-orange-500 rounded-2xl py-3 px-4 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none transition-all"
                  />
                </div>

                {reserveError && (
                  <div className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl p-3 text-xs font-black">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{reserveError}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isReserving || availableTablesCount === 0}
                onClick={handleCustomerReserve}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all shrink-0"
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
                          : "Confirm Table Reservation"}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ========================================================
  // صفحه خوش‌آمدگویی (Welcome Screen)
  // ========================================================
  if (view === "welcome") {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased flex flex-col justify-between p-6 relative overflow-hidden"
        dir={isFa ? "rtl" : "ltr"}
      >
        {toastMsg && (
          <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#1D1D1F]/95 backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2.5 border border-white/10">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2
                  size={12}
                  className="text-white"
                  strokeWidth={3}
                />
              </div>
              <span>{toastMsg}</span>
            </div>
          </div>
        )}

        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[500px] h-[360px] bg-orange-400/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[320px] h-[320px] bg-amber-300/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2">
          {tableNumber ? (
            <div className="bg-white/90 backdrop-blur-xl border border-black/[0.06] px-4 py-2 rounded-full shadow-2xs flex items-center gap-2 text-xs font-black text-[#1D1D1F]">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>
                {isFa ? `میز شماره ${tableNumber}` : `Table #${tableNumber}`}
              </span>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-black/[0.05] px-3.5 py-2 rounded-full text-[11px] font-bold text-[#86868B] flex items-center gap-1.5">
              <Sparkles size={12} className="text-orange-500" />
              <span>{isFa ? "ترنج" : "Toranj"}</span>
            </div>
          )}

          {venueData?.bilingual && (
            <button
              type="button"
              onClick={() => setLanguage(isFa ? "en" : "fa")}
              className="bg-white/90 backdrop-blur-xl hover:bg-white border border-black/[0.07] px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[#1D1D1F] font-bold text-xs shadow-2xs transition-all active:scale-95"
            >
              <Globe size={14} className="text-orange-500" />
              <span>{isFa ? "English" : "فارسی"}</span>
            </button>
          )}
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center my-auto py-8">
          <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white rounded-[36px] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-black/[0.05] mb-8 animate-in zoom-in-95 duration-500">
            <div className="w-full h-full rounded-[30px] bg-[#F5F5F7] overflow-hidden flex items-center justify-center">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store
                  size={52}
                  className="text-orange-500"
                  strokeWidth={1.8}
                />
              )}
            </div>
          </div>

          <p className="text-sm sm:text-base font-bold text-[#86868B] mb-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {isFa ? "خوش آمدید به" : "Welcome to"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1D1D1F] mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {safeVenueName}
          </h1>

          {(isFa ? safeAboutFa : safeAboutEn) && (
            <p className="text-xs sm:text-sm font-medium text-[#6E6E73] max-w-xs leading-relaxed mb-10 animate-in fade-in duration-700">
              {isFa ? safeAboutFa : safeAboutEn}
            </p>
          )}

          <div className="w-full space-y-3.5 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <button
              type="button"
              onClick={() => setView("menu")}
              className="w-full bg-[#1D1D1F] hover:bg-black text-white py-4.5 px-6 rounded-full font-black text-base sm:text-lg transition-all shadow-[0_14px_34px_rgba(29,29,31,0.22)] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Utensils size={20} className="text-orange-400" />
              <span>{isFa ? "سفارش از منو" : "Order from Menu"}</span>
            </button>

            <button
              type="button"
              onClick={openReservationModal}
              className="w-full bg-white hover:bg-slate-50 text-[#1D1D1F] border border-black/[0.07] py-4 px-6 rounded-full font-black text-base transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] flex items-center justify-center gap-2.5"
            >
              <CalendarCheck size={20} className="text-orange-500" />
              <span>{isFa ? "رزرو میز" : "Reserve a Table"}</span>
              {tablesList.length > 0 && (
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    availableTablesCount > 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {availableTablesCount > 0
                    ? isFa
                      ? `${availableTablesCount.toLocaleString("fa-IR")} میز آزاد`
                      : `${availableTablesCount} free`
                    : isFa
                      ? "تکمیل"
                      : "Full"}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative z-10 text-center pb-2">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#86868B] hover:text-orange-500 transition-colors"
          >
            <Sparkles size={12} className="text-orange-500" />
            <span>
              {isFa ? "قدرت‌گرفته از منوی دیجیتال ترنج" : "Powered by Toranj"}
            </span>
          </a>
        </div>

        {renderReservationModal()}

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    );
  }

  // ========================================================
  // نمای منوی محصولات (Menu View)
  // ========================================================
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

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-orange-500/20 overflow-x-hidden pb-36 relative animate-in fade-in duration-300"
      dir={isFa ? "rtl" : "ltr"}
    >
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1D1D1F]/95 backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.18)] font-bold text-xs flex items-center gap-2.5 border border-white/10">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
            </div>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-30 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-black/[0.05]">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setView("welcome")}
              title={isFa ? "صفحه خوش‌آمدگویی" : "Welcome Screen"}
              className="w-9 h-9 rounded-full bg-white border border-black/[0.06] shadow-2xs flex items-center justify-center text-[#1D1D1F] hover:bg-slate-50 active:scale-90 transition-all shrink-0"
            >
              {isFa ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <div className="w-9 h-9 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={18} className="text-orange-500" />
              )}
            </div>

            <div className="truncate">
              <span className="font-black text-sm text-[#1D1D1F] block truncate">
                {safeVenueName}
              </span>
              {tableNumber && (
                <span className="text-[11px] font-bold text-orange-600 block">
                  {isFa ? `میز شماره ${tableNumber}` : `Table #${tableNumber}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!tableNumber && tablesList.length > 0 && (
              <button
                type="button"
                onClick={openReservationModal}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-full font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <CalendarCheck size={14} />
                <span>{isFa ? "رزرو میز" : "Reserve"}</span>
              </button>
            )}

            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="bg-[#1D1D1F] hover:bg-black text-white px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isFa
                    ? `سفارش #${activeOrder.orderNumber}`
                    : `Order #${activeOrder.orderNumber}`}
                </span>
              </button>
            )}

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="bg-white hover:bg-slate-50 border border-black/[0.07] px-3 py-2 rounded-full flex items-center gap-1.5 text-[#1D1D1F] font-bold text-xs shadow-2xs transition-all active:scale-95"
              >
                <Globe size={14} className="text-slate-500" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <header className="max-w-xl mx-auto px-4 pt-5 pb-2">
        <div className="bg-white rounded-[30px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-black/[0.04]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-[#F5F5F7] border border-black/[0.05] flex items-center justify-center overflow-hidden shrink-0">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={28} className="text-orange-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1D1D1F] truncate">
                {safeVenueName}
              </h1>
              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-[#86868B] line-clamp-2 leading-relaxed mt-1">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}
            </div>
          </div>

          {tableNumber &&
            (venueData?.callWaiterEnabled || venueData?.callChefEnabled) && (
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100">
                {venueData?.callWaiterEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setWaiterModal(true);
                    }}
                    className={`bg-[#F5F5F7] hover:bg-blue-50 text-[#1D1D1F] hover:text-blue-600 py-2.5 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      !venueData?.callChefEnabled ? "col-span-2" : ""
                    }`}
                  >
                    <BellRing size={15} className="text-blue-500" />
                    <span>{isFa ? "احضار گارسون" : "Call Waiter"}</span>
                  </button>
                )}

                {venueData?.callChefEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setChefModal(true);
                    }}
                    className={`bg-[#F5F5F7] hover:bg-orange-50 text-[#1D1D1F] hover:text-orange-600 py-2.5 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      !venueData?.callWaiterEnabled ? "col-span-2" : ""
                    }`}
                  >
                    <ChefHat size={15} className="text-orange-500" />
                    <span>{isFa ? "پیام به سرآشپز" : "Note to Chef"}</span>
                  </button>
                )}
              </div>
            )}

          {!tableNumber && (
            <div className="mt-4 bg-[#F5F5F7] text-[#6E6E73] px-4 py-2.5 rounded-2xl text-[11px] font-bold text-center">
              {isFa
                ? "برای ثبت سفارش آنلاین، بارکد QR روی میز خود را اسکن کنید."
                : "Scan the QR code on your table to place an order."}
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-16 z-20 bg-[#F5F5F7]/90 backdrop-blur-2xl py-3.5 px-4">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="relative">
            <Search
              size={16}
              className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
                isFa ? "right-4" : "left-4"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFa ? "جستجو در منو..." : "Search dishes or drinks..."
              }
              className={`w-full bg-white border border-black/[0.06] focus:border-orange-500/50 rounded-2xl py-2.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] shadow-2xs outline-none transition-all ${
                isFa ? "pr-10 pl-4" : "pl-10 pr-4"
              }`}
            />
          </div>

          {Array.isArray(menuData) && menuData.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategoryId === "all"
                    ? "bg-[#1D1D1F] text-white shadow-sm"
                    : "bg-white text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.05]"
                }`}
              >
                {isFa ? "همه موارد" : "All"}
              </button>

              {menuData.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
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
          )}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-2">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-black/[0.04] shadow-2xs">
            <UtensilsCrossed
              size={38}
              className="text-slate-300 mx-auto mb-3"
            />
            <p className="text-[#86868B] font-bold text-sm">
              {isFa ? "آیتمی برای نمایش یافت نشد." : "No menu items found."}
            </p>
          </div>
        ) : (
          filteredMenu.map((cat: any) => {
            const hasProducts =
              Array.isArray(cat.products) && cat.products.length > 0;
            return (
              <section key={cat.id} className="mb-8">
                <div className="flex items-baseline justify-between mb-3.5 px-1">
                  <h2 className="text-lg font-black text-[#1D1D1F] tracking-tight">
                    {isFa
                      ? cat.nameFa || cat.name
                      : cat.nameEn || cat.nameFa || cat.name}
                  </h2>
                  <span className="text-[11px] font-bold text-[#86868B]">
                    {cat.products?.length || 0} {isFa ? "مورد" : "items"}
                  </span>
                </div>

                {!hasProducts ? (
                  <div className="bg-white border border-black/[0.04] p-6 rounded-[28px] text-center text-[#86868B] text-xs font-bold">
                    {isFa
                      ? "هنوز محصولی در این دسته ثبت نشده است."
                      : "No products in this category yet."}
                  </div>
                ) : (
                  <div className="space-y-3">
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
                          className={`bg-white rounded-[28px] p-3.5 flex gap-4 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all ${
                            !isAvailable ? "opacity-55" : ""
                          }`}
                        >
                          <div className="w-24 h-24 bg-[#F5F5F7] rounded-[22px] shrink-0 overflow-hidden relative border border-black/[0.04]">
                            {prod?.imageUrl ? (
                              <img
                                src={getFullImageUrl(prod.imageUrl)}
                                alt={isFa ? prod.nameFa : prod.nameEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <UtensilsCrossed size={24} />
                              </div>
                            )}

                            {isAvailable &&
                              hasFiniteStock &&
                              Number(prod.stock) <= 5 && (
                                <span className="absolute bottom-1.5 inset-x-1.5 bg-black/75 backdrop-blur-md text-white text-[9px] font-bold text-center py-0.5 rounded-full">
                                  {isFa
                                    ? `${prod.stock} عدد باقی‌مانده`
                                    : `${prod.stock} left`}
                                </span>
                              )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <h3 className="font-black text-[15px] text-[#1D1D1F] mb-1 truncate">
                                {isFa
                                  ? prod?.nameFa
                                  : prod?.nameEn || prod?.nameFa}
                              </h3>
                              <p className="text-xs font-medium text-[#86868B] line-clamp-2 leading-relaxed">
                                {isFa
                                  ? prod?.descriptionFa
                                  : prod?.descriptionEn || prod?.descriptionFa}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3">
                              <div className="font-black text-[#1D1D1F] text-[15px] whitespace-nowrap">
                                {Number(prod?.price || 0).toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                <span className="text-[11px] text-[#86868B] font-bold">
                                  {isFa ? "تومان" : "IRT"}
                                </span>
                              </div>

                              {venueData?.orderingEnabled &&
                                tableNumber &&
                                (!isAvailable ? (
                                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
                                    {isFa ? "ناموجود" : "Sold out"}
                                  </span>
                                ) : cartItem ? (
                                  <div className="flex items-center gap-2.5 bg-[#F5F5F7] rounded-full p-1 border border-black/[0.06] shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(prod.id)}
                                      className="w-7 h-7 rounded-full bg-white text-[#1D1D1F] shadow-2xs flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                      <Minus size={13} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-xs font-black text-[#1D1D1F] min-w-[16px] text-center">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={Boolean(reachedMaxStock)}
                                      onClick={() => addToCart(prod)}
                                      className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white disabled:opacity-30 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                      <Plus size={13} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(prod)}
                                    className="bg-[#F5F5F7] hover:bg-orange-500 text-[#1D1D1F] hover:text-white px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-all active:scale-90 shrink-0"
                                  >
                                    <Plus size={14} strokeWidth={2.5} />
                                    <span>{isFa ? "افزودن" : "Add"}</span>
                                  </button>
                                ))}
                            </div>
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

      {totalItems > 0 && (
        <div className="fixed bottom-5 inset-x-4 z-40 flex justify-center animate-in slide-in-from-bottom-8 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-xl bg-[#1D1D1F]/95 backdrop-blur-2xl hover:bg-black text-white p-3.5 sm:px-5 rounded-full font-bold flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-white/10 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                {totalItems.toLocaleString("fa-IR")}
              </div>
              <span className="text-sm font-black">
                {isFa ? "مشاهده سبد خرید" : "View Bag"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black">
                {totalPrice.toLocaleString("fa-IR")}{" "}
                <span className="text-xs font-medium text-white/70">
                  {isFa ? "تومان" : "IRT"}
                </span>
              </span>
              {isFa ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl mx-auto rounded-t-[36px] p-6 pb-8 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-black text-[#1D1D1F]">
                  {isFa ? "سبد خرید" : "Your Bag"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-orange-500 mt-0.5">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-1">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div
                    key={pid}
                    className="bg-[#F5F5F7] p-4 rounded-3xl space-y-3"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[#1D1D1F] mb-1 truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-[#6E6E73] font-bold">
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
                            title={isFa ? "یادداشت" : "Add note"}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isNoteOpen
                                ? "bg-orange-500 text-white"
                                : "bg-white text-[#6E6E73] border border-black/[0.06]"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-black/[0.06]">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black text-[#1D1D1F] min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center"
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
                            ? "یادداشت برای آشپزخانه (مثلاً: بدون سس، کم‌نمک)..."
                            : "Special note for kitchen..."
                        }
                        className="w-full bg-white border border-black/[0.07] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none focus:border-orange-500"
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
                className="w-full bg-[#F5F5F7] border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-4 py-3.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none transition-all"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-4 rounded-full font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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

      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BellRing size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {isFa ? "احضار گارسون" : "Call Waiter"}
                  </h3>
                  <p className="text-xs font-bold text-[#86868B]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-9 h-9 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
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
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-slate-200/70"
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
              className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-blue-500 rounded-2xl p-3.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none resize-none mb-5 transition-all"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
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

      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {isFa ? "درخواست از سرآشپز" : "Note to Chef"}
                  </h3>
                  <p className="text-xs font-bold text-[#86868B]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-9 h-9 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
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
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-slate-200/70"
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
              className="w-full bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-orange-500 rounded-2xl p-3.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none resize-none mb-5 transition-all"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
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

      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-[36px] sm:rounded-[36px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-5 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-[#F5F5F7] hover:bg-slate-200/70 text-[#1D1D1F] px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
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
                className="w-9 h-9 rounded-full bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-center mb-5 shrink-0">
              <div className="w-16 h-16 mx-auto rounded-[22px] bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                <Sparkles size={28} />
              </div>
              <span className="inline-block text-xs font-black text-orange-600 bg-orange-50 px-3.5 py-1 rounded-full mb-2">
                {isFa
                  ? `کد پیگیری: #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-xl font-black text-[#1D1D1F]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "سفارش شما تحویل داده شد!"
                    : "Order Delivered!"
                  : isFa
                    ? "وضعیت آماده‌سازی سفارش"
                    : "Order Preparation Status"}
              </h2>
            </div>

            <div className="bg-[#F5F5F7] rounded-[28px] p-5 space-y-4 mb-6 overflow-y-auto">
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
                            ? "bg-orange-500 text-white"
                            : "bg-white text-slate-400"
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
                      <span className="block font-black text-sm text-[#1D1D1F]">
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
              className="w-full bg-[#1D1D1F] hover:bg-black text-white py-4 rounded-full font-black text-sm transition-all active:scale-[0.98] shrink-0"
            >
              {isFa ? "بازگشت به منو" : "Back to Menu"}
            </button>
          </div>
        </div>
      )}

      {renderReservationModal()}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Template1;
