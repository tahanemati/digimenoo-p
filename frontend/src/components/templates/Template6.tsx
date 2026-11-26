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
  Coffee,
  ChevronLeft,
  ChevronRight,
  Info,
  Leaf,
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
    description: "سفارش شما با موفقیت در بار و آشپزخانه ثبت شد",
  },
  {
    id: "preparing",
    name: "در حال دم‌آوری و آماده‌سازی",
    description: "باریستا و سرآشپز مشغول آماده کردن سفارش شما هستند",
  },
  {
    id: "ready",
    name: "آماده سرو",
    description: "سفارش آماده است و تا لحظاتی دیگر سر میز سرو می‌شود",
  },
];

const Template6: React.FC<TemplateProps> = ({
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

  const safeVenueName = venueData?.name || venueData?.Name || "کافه و بیکری";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";
  const safePhone = venueData?.phone || venueData?.Phone || "";

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const safeCategories = Array.isArray(menuData) ? menuData : [];

  // انتخاب خودکار یک آیتم شاخص برای کارت مجله‌ای «انتخاب ویژه باریستا / سرآشپز»
  const featuredItem = useMemo(() => {
    const allProds: { prod: any; catTitleFa: string; catTitleEn: string }[] =
      [];
    for (const cat of safeCategories) {
      for (const prod of cat.products || []) {
        const hasFiniteStock =
          prod?.stock !== null && prod?.stock !== undefined;
        const isAvail =
          prod?.isAvailableInMenu !== false &&
          (!hasFiniteStock || Number(prod.stock) > 0);
        if (isAvail) {
          allProds.push({
            prod,
            catTitleFa: cat.nameFa || cat.name || "",
            catTitleEn: cat.nameEn || cat.nameFa || cat.name || "",
          });
        }
      }
    }
    return (
      allProds.find((x) => Boolean(x.prod?.imageUrl)) || allProds[0] || null
    );
  }, [safeCategories]);

  const isEditorialCarouselMode =
    selectedCategoryId === "all" && !searchQuery.trim();

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

  const timePresetsFa = ["۱۰:۰۰ (صبحانه)", "۱۶:۳۰ (عصرانه)", "۱۹:۰۰", "۲۱:۰۰"];
  const timePresetsEn = [
    "10:00 (Morning)",
    "16:30 (Afternoon)",
    "19:00",
    "21:00",
  ];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به آب و لیوان",
    "شکر / شیر اضافه",
    "حضور میزبان سر میز",
  ];
  const waiterPresetsEn = [
    "Request the check",
    "Glass of water",
    "Extra milk / sugar",
    "Table assistance",
  ];

  const chefPresetsFa = [
    "قهوه با شیر جو دوسر / بادام باشد",
    "بدون شکر و سیروپ",
    "دمای نوشیدنی ملایم باشد",
    "حساسیت به لاکتوز / گلوتن دارم",
  ];
  const chefPresetsEn = [
    "Oat / Almond milk",
    "No sugar or syrup",
    "Warm / Not too hot",
    "Lactose / Gluten allergy",
  ];

  // رندر یکپارچه کارت محصول برای هر دو حالت کاروسل افقی و گرید عمودی
  const renderEditorialCard = (prod: any, layout: "carousel" | "grid") => {
    const cartItem = cart.find((c: any) => c.product?.id === prod?.id);
    const hasFiniteStock = prod?.stock !== null && prod?.stock !== undefined;
    const isAvailable =
      prod?.isAvailableInMenu !== false &&
      (!hasFiniteStock || Number(prod.stock) > 0);
    const reachedMaxStock =
      hasFiniteStock && cartItem && cartItem.quantity >= Number(prod.stock);

    return (
      <article
        key={prod?.id}
        onClick={() => openProductShowcase(prod)}
        className={`group cursor-pointer bg-[#FFFDF9] rounded-[26px] border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
          layout === "carousel"
            ? "w-[228px] sm:w-[252px] shrink-0 snap-start"
            : "w-full"
        } ${
          cartItem
            ? "border-[#4F6354] shadow-[0_12px_28px_rgba(79,99,84,0.12)]"
            : "border-[#E6DDD0] hover:border-[#C8B9A6] shadow-[0_4px_18px_rgba(43,30,23,0.03)]"
        } ${!isAvailable ? "opacity-60" : ""}`}
      >
        {/* قاب تصویر ارگانیک */}
        <div
          className={`relative w-full bg-[#EFE7DB] overflow-hidden ${
            layout === "carousel" ? "h-36 sm:h-40" : "h-40 sm:h-44"
          }`}
        >
          {prod?.imageUrl ? (
            <img
              src={getFullImageUrl(prod.imageUrl)}
              alt={isFa ? prod.nameFa : prod.nameEn}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EFE7DB] to-[#E6DAC8] text-[#A49382]">
              <Coffee size={32} strokeWidth={1.6} />
            </div>
          )}

          {isAvailable && hasFiniteStock && Number(prod.stock) <= 5 && (
            <span className="absolute top-2.5 right-2.5 bg-[#2B1E17]/85 backdrop-blur-md text-[#F6F1E9] text-[10px] font-black px-2.5 py-0.5 rounded-full">
              {isFa ? `فقط ${prod.stock} عدد` : `${prod.stock} left`}
            </span>
          )}

          {!isAvailable && (
            <div className="absolute inset-0 bg-[#2B1E17]/45 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-[#FFFDF9] text-[#2B1E17] text-[11px] font-black px-3 py-1 rounded-full">
                {isFa ? "اتمام موجودی" : "Sold Out"}
              </span>
            </div>
          )}
        </div>

        {/* بدنه اطلاعات */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-[14px] sm:text-[15px] text-[#2B1E17] leading-snug line-clamp-1">
              {isFa ? prod?.nameFa : prod?.nameEn || prod?.nameFa}
            </h3>

            {(isFa
              ? prod?.descriptionFa
              : prod?.descriptionEn || prod?.descriptionFa) && (
              <p className="text-[11px] font-medium text-[#7A6A5E] line-clamp-2 leading-relaxed mt-1">
                {isFa
                  ? prod?.descriptionFa
                  : prod?.descriptionEn || prod?.descriptionFa}
              </p>
            )}
          </div>

          {/* نوار قیمت و کنترلر زیتونی */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3.5 pt-3 border-t border-dashed border-[#E6DDD0] flex items-center justify-between gap-2"
          >
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-black text-[14px] sm:text-[15px] text-[#2B1E17]">
                {Number(prod?.price || 0).toLocaleString("fa-IR")}
              </span>
              <span className="text-[10px] font-bold text-[#9A897A]">
                {isFa ? "تومان" : "IRT"}
              </span>
            </div>

            {venueData?.orderingEnabled && tableNumber && (
              <>
                {!isAvailable ? (
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                    {isFa ? "ناموجود" : "Out"}
                  </span>
                ) : cartItem ? (
                  <div className="flex items-center gap-1.5 bg-[#4F6354] text-[#FFFDF9] rounded-full p-0.5 shadow-sm">
                    <button
                      type="button"
                      disabled={Boolean(reachedMaxStock)}
                      onClick={() => addToCart(prod)}
                      className="w-7 h-7 rounded-full bg-[#FFFDF9] text-[#2B1E17] disabled:opacity-35 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus size={13} strokeWidth={2.8} />
                    </button>
                    <span className="text-xs font-black min-w-[16px] text-center">
                      {cartItem.quantity.toLocaleString("fa-IR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(prod.id)}
                      className="w-7 h-7 rounded-full bg-white/15 text-white flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Minus size={13} strokeWidth={2.8} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={isFa ? "افزودن به سبد" : "Add to bag"}
                    onClick={() => addToCart(prod)}
                    className="w-8 h-8 rounded-full bg-[#F2EAE0] hover:bg-[#4F6354] text-[#2B1E17] hover:text-[#FFFDF9] border border-[#E0D4C3] flex items-center justify-center transition-all active:scale-90 shrink-0"
                  >
                    <Plus size={15} strokeWidth={2.6} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      className="min-h-screen bg-[#F6F1E9] text-[#2B1E17] font-sans antialiased selection:bg-[#4F6354]/20 overflow-x-hidden pb-32 relative"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان شناور ارگانیک */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#2B1E17] text-[#F6F1E9] px-5 py-3 rounded-full shadow-[0_14px_35px_rgba(43,30,23,0.28)] font-bold text-xs flex items-center gap-2.5 border border-[#4F6354]/40">
            <span className="w-5 h-5 rounded-full bg-[#4F6354] flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          بخش ۱: هدر مجله‌ای کافه موج سوم (Editorial Masthead)
         ======================================================== */}
      <header className="max-w-5xl mx-auto px-4 pt-4 pb-3">
        {/* نوار ابزار بالا */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {tableNumber ? (
              <span className="bg-[#4F6354] text-[#FFFDF9] px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9E6DC] animate-pulse" />
                {isFa ? `میز شماره ${tableNumber}` : `Table #${tableNumber}`}
              </span>
            ) : (
              <span className="bg-[#FFFDF9] border border-[#E6DDD0] text-[#4F6354] px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5">
                <Leaf size={12} />
                {isFa ? "منوی تخصصی و تازه" : "CRAFT & SPECIALTY"}
              </span>
            )}

            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="bg-[#B86B35] text-white px-3 py-1.5 rounded-full font-black text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
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
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                isSearchOpen || searchQuery
                  ? "bg-[#2B1E17] text-[#FFFDF9] border-[#2B1E17]"
                  : "bg-[#FFFDF9] text-[#2B1E17] border-[#E6DDD0]"
              }`}
            >
              {isSearchOpen ? <X size={15} /> : <Search size={15} />}
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-9 px-3 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#2B1E17] font-black text-[11px] flex items-center gap-1.5"
              >
                <Globe size={13} className="text-[#4F6354]" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              aria-label="اطلاعات مجموعه"
              className="w-9 h-9 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#7A6A5E] hover:text-[#2B1E17] flex items-center justify-center transition-colors"
            >
              <Info size={15} />
            </button>
          </div>
        </div>

        {/* معرفی مجموعه با سبک تایپوگرافی مجله‌ای */}
        <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-[28px] p-4 sm:p-6 shadow-[0_6px_25px_rgba(43,30,23,0.03)]">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-[#F6F1E9] border border-[#E6DDD0] overflow-hidden flex items-center justify-center shrink-0">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Coffee size={26} className="text-[#4F6354]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#2B1E17] tracking-tight truncate">
                {safeVenueName}
              </h1>
              {(isFa ? safeAboutFa : safeAboutEn) && (
                <p className="text-xs font-medium text-[#7A6A5E] line-clamp-2 leading-relaxed mt-1">
                  {isFa ? safeAboutFa : safeAboutEn}
                </p>
              )}
            </div>
          </div>

          {/* چیپ‌های دسترسی سریع به خدمات میز */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-4 pt-3.5 border-t border-dashed border-[#E6DDD0]">
            <button
              type="button"
              onClick={openReservationModal}
              className="shrink-0 bg-[#4F6354] hover:bg-[#3F5143] text-[#FFFDF9] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
            >
              <CalendarCheck size={13} />
              <span>{isFa ? "رزرو میز" : "Reserve Table"}</span>
              {tablesList.length > 0 && (
                <span className="bg-white/20 text-[#FFFDF9] px-1.5 py-0.2 rounded-full text-[10px]">
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
                className="shrink-0 bg-[#F6F1E9] hover:bg-[#EDE4D7] border border-[#E2D7C6] text-[#2B1E17] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <BellRing size={13} className="text-[#B86B35]" />
                <span>{isFa ? "احضار میزبان" : "Call Waiter"}</span>
              </button>
            )}

            {tableNumber && venueData?.callChefEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="shrink-0 bg-[#F6F1E9] hover:bg-[#EDE4D7] border border-[#E2D7C6] text-[#2B1E17] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ChefHat size={13} className="text-[#B86B35]" />
                <span>{isFa ? "یادداشت به باریستا" : "Barista Note"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          بخش ۲: نوار چسبان دسته‌بندی‌ها و جستجو
         ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#F6F1E9]/92 backdrop-blur-xl border-b border-[#E6DDD0]/80 py-2.5">
        <div className="max-w-5xl mx-auto px-4 space-y-2.5">
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
              <Search
                size={15}
                className={`absolute top-1/2 -translate-y-1/2 text-[#9A897A] ${
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
                    ? "جستجو در منو (اسپرسو، ماچا، کروسان...)"
                    : "Search coffee, pastries, plates..."
                }
                className={`w-full bg-[#FFFDF9] border border-[#DFD4C3] focus:border-[#4F6354] rounded-2xl py-2.5 text-xs font-bold text-[#2B1E17] placeholder:text-[#9A897A] outline-none ${
                  isFa ? "pr-10 pl-9" : "pl-10 pr-9"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#9A897A] ${
                    isFa ? "left-3.5" : "right-3.5"
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
                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                  selectedCategoryId === "all" && !searchQuery
                    ? "bg-[#2B1E17] text-[#F6F1E9] border-[#2B1E17] shadow-2xs"
                    : "bg-[#FFFDF9] text-[#6E5E52] border-[#E6DDD0] hover:border-[#C8B9A6]"
                }`}
              >
                {isFa ? "نمای مجله‌ای (همه)" : "Editorial (All)"}
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
                    className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                      isSelected
                        ? "bg-[#4F6354] text-[#FFFDF9] border-[#4F6354] shadow-2xs"
                        : "bg-[#FFFDF9] text-[#6E5E52] border-[#E6DDD0] hover:border-[#C8B9A6]"
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
          بخش ۳: کارت ویژه انتخاب باریستا + ردیف‌های کاروسل افقی
         ======================================================== */}
      <main className="max-w-5xl mx-auto pt-5">
        {/* کارت Editorial Spotlight (فقط در نمای اصلی نمایش داده می‌شود) */}
        {isEditorialCarouselMode && featuredItem && (
          <section className="px-4 mb-8">
            <div
              onClick={() => openProductShowcase(featuredItem.prod)}
              className="cursor-pointer relative bg-[#4F6354] text-[#FFFDF9] rounded-[30px] overflow-hidden shadow-[0_18px_40px_rgba(79,99,84,0.2)] grid grid-cols-1 sm:grid-cols-12"
            >
              {/* تصویر آیتم ویژه */}
              <div className="sm:col-span-5 h-48 sm:h-auto min-h-[190px] bg-[#3C4E41] relative overflow-hidden">
                {featuredItem.prod?.imageUrl ? (
                  <img
                    src={getFullImageUrl(featuredItem.prod.imageUrl)}
                    alt={
                      isFa ? featuredItem.prod.nameFa : featuredItem.prod.nameEn
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#FFFDF9]/25">
                    <Coffee size={48} />
                  </div>
                )}
                <span className="absolute top-3.5 right-3.5 bg-[#FFFDF9]/95 text-[#2B1E17] px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} className="text-[#B86B35]" />
                  {isFa ? "انتخاب ویژه امروز" : "BARISTA'S PICK"}
                </span>
              </div>

              {/* متن و دکمه سریع کارت ویژه */}
              <div className="sm:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#D9E6DC] tracking-wide">
                    {isFa ? featuredItem.catTitleFa : featuredItem.catTitleEn}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#FFFDF9] mt-1 leading-snug">
                    {isFa
                      ? featuredItem.prod?.nameFa
                      : featuredItem.prod?.nameEn || featuredItem.prod?.nameFa}
                  </h2>
                  {(isFa
                    ? featuredItem.prod?.descriptionFa
                    : featuredItem.prod?.descriptionEn ||
                      featuredItem.prod?.descriptionFa) && (
                    <p className="text-xs font-medium text-[#E8F0EA]/85 line-clamp-2 leading-relaxed mt-2">
                      {isFa
                        ? featuredItem.prod?.descriptionFa
                        : featuredItem.prod?.descriptionEn ||
                          featuredItem.prod?.descriptionFa}
                    </p>
                  )}
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between gap-3 pt-3 border-t border-white/15"
                >
                  <div>
                    <span className="text-lg font-black text-[#FFFDF9]">
                      {Number(featuredItem.prod?.price || 0).toLocaleString(
                        "fa-IR",
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-[#D9E6DC] mr-1">
                      {isFa ? "تومان" : "IRT"}
                    </span>
                  </div>

                  {venueData?.orderingEnabled && tableNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(featuredItem.prod);
                        showToast(
                          isFa
                            ? "به سبد سفارش اضافه شد"
                            : "Added to your order",
                        );
                      }}
                      className="bg-[#FFFDF9] hover:bg-[#F6F1E9] text-[#2B1E17] px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <Plus size={14} strokeWidth={2.8} />
                      <span>{isFa ? "افزودن سریع" : "Quick Add"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* لیست دسته‌بندی‌ها */}
        {filteredMenu.length === 0 ? (
          <div className="mx-4 bg-[#FFFDF9] border border-[#E6DDD0] rounded-[28px] py-16 text-center">
            <Coffee size={36} className="text-[#C8B9A6] mx-auto mb-3" />
            <p className="text-xs font-bold text-[#7A6A5E]">
              {isFa ? "آیتمی با این جستجو یافت نشد." : "No items found."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMenu.map((cat: any) => {
              const hasProducts =
                Array.isArray(cat.products) && cat.products.length > 0;
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;

              return (
                <section key={cat.id}>
                  {/* هدر بخش همراه با لینک مشاهده همه در نمای کاروسل */}
                  <div className="px-4 flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#4F6354] shrink-0" />
                      <h2 className="text-lg sm:text-xl font-black text-[#2B1E17] tracking-tight truncate">
                        {catTitle}
                      </h2>
                      <span className="text-[11px] font-bold text-[#9A897A] bg-[#EDE5D9] px-2 py-0.5 rounded-full">
                        {(cat.products?.length || 0).toLocaleString("fa-IR")}
                      </span>
                    </div>

                    {isEditorialCarouselMode && hasProducts ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          window.scrollTo({ top: 140, behavior: "smooth" });
                        }}
                        className="text-xs font-black text-[#4F6354] hover:text-[#2B1E17] flex items-center gap-0.5 shrink-0 transition-colors"
                      >
                        <span>{isFa ? "همه" : "See all"}</span>
                        {isFa ? (
                          <ChevronLeft size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </button>
                    ) : (
                      !searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId("all")}
                          className="text-xs font-black text-[#B86B35] hover:text-[#2B1E17] shrink-0"
                        >
                          {isFa ? "بازگشت به همه" : "Back to all"}
                        </button>
                      )
                    )}
                  </div>

                  {!hasProducts ? (
                    <div className="mx-4 bg-[#FFFDF9] border border-[#E6DDD0] rounded-[24px] p-6 text-center text-xs font-bold text-[#7A6A5E]">
                      {isFa
                        ? "در این دسته‌بندی هنوز آیتمی ثبت نشده است."
                        : "No items in this category yet."}
                    </div>
                  ) : isEditorialCarouselMode ? (
                    /* کاروسل افقی اپ‌استوری (Snap Scroll) */
                    <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 pb-2">
                      {cat.products.map((prod: any) =>
                        renderEditorialCard(prod, "carousel"),
                      )}
                    </div>
                  ) : (
                    /* نمای گرید کامل هنگام انتخاب یک دسته یا جستجو */
                    <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cat.products.map((prod: any) =>
                        renderEditorialCard(prod, "grid"),
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* فوتر برند ترنج */}
        <footer className="mt-12 px-4 pt-5 border-t border-dashed border-[#DFD4C3] text-center">
          <a
            href="https://toranjmenu.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8E7D6E] hover:text-[#4F6354] transition-colors"
          >
            <Sparkles size={12} className="text-[#B86B35]" />
            <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
          </a>
        </footer>
      </main>

      {/* ========================================================
          بخش ۴: نوار سبد خرید شناور اسپرسویی
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#2B1E17] hover:bg-[#1E140F] text-[#F6F1E9] p-3.5 px-5 rounded-full font-black flex items-center justify-between shadow-[0_18px_40px_rgba(43,30,23,0.3)] border border-[#4F6354]/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#4F6354] text-white flex items-center justify-center text-xs font-black">
                {totalItems.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs sm:text-sm font-black">
                {isFa ? "مشاهده و ثبت سفارش" : "View Order Bag"}
              </span>
            </div>

            <span className="text-xs sm:text-sm font-black text-[#E8C097]">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] font-bold text-[#F6F1E9]/70">
                {isFa ? "تومان" : "IRT"}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال اطلاعات کافه / رستوران
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-t-[30px] sm:rounded-[30px] p-6 pb-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-[#DFD4C3] rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F6F1E9] border border-[#E6DDD0] overflow-hidden flex items-center justify-center">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={22} className="text-[#4F6354]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2B1E17]">
                    {safeVenueName}
                  </h3>
                  <span className="text-[11px] font-bold text-[#8E7D6E]">
                    {isFa ? "درباره مجموعه" : "About Us"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F1E9] text-[#7A6A5E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-[#6E5E52] leading-relaxed mb-4">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            {(safeAddress || safePhone) && (
              <div className="bg-[#F6F1E9] border border-[#E6DDD0] rounded-2xl p-4 space-y-2.5 text-xs font-bold text-[#2B1E17]">
                {safeAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={15}
                      className="text-[#4F6354] shrink-0 mt-0.5"
                    />
                    <span>{safeAddress}</span>
                  </div>
                )}
                {safePhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-[#4F6354] shrink-0" />
                    <span dir="ltr">{safePhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          مودال جزئیات محصول
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-t-[30px] sm:rounded-[30px] overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-56 w-full bg-[#EFE7DB]">
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
                <div className="w-full h-full flex items-center justify-center text-[#A49382]">
                  <UtensilsCrossed size={42} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#FFFDF9]/95 text-[#2B1E17] flex items-center justify-center shadow-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#2B1E17]">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-base font-black text-[#B86B35] shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-[11px] text-[#8E7D6E]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#7A6A5E] leading-relaxed">
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
                          ? "توضیحات دلخواه (مثلاً: با شیر بادام، کم‌شیرین)..."
                          : "Special request (e.g. oat milk, less sweet)..."
                      }
                      className="w-full bg-[#F6F1E9] border border-[#E6DDD0] focus:border-[#4F6354] rounded-2xl px-4 py-3 text-xs font-bold text-[#2B1E17] placeholder:text-[#9A897A] outline-none"
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
                        <div className="w-full py-3.5 rounded-2xl bg-rose-50 text-rose-700 font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-[#F6F1E9] border border-[#E6DDD0] p-1.5 rounded-full">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-full bg-[#FFFDF9] text-[#2B1E17] border border-[#E6DDD0] flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base text-[#2B1E17] min-w-[20px] text-center">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-full bg-[#4F6354] text-white flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-[#2B1E17] text-[#F6F1E9] px-6 py-2.5 rounded-full font-black text-xs"
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
                        className="w-full bg-[#4F6354] hover:bg-[#3F5143] text-[#FFFDF9] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#4F6354]/20 active:scale-95 transition-all"
                      >
                        <Plus size={17} strokeWidth={2.5} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Order"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#2B1E17] text-[#F6F1E9] py-3.5 rounded-full font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال رزرو آنلاین میزها
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F6F1E9] border border-[#E6DDD0] rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-[#D5C8B7] rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#4F6354] text-[#FFFDF9] flex items-center justify-center">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#2B1E17]">
                      {isFa ? "رزرو میز کافه" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#7A6A5E]">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#7A6A5E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#4F6354]/15 text-[#4F6354] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#2B1E17]">
                    {isFa ? "میز شما رزرو شد!" : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-[#7A6A5E] mt-0.5">
                    {isFa
                      ? "منتظر میزبانی از شما هستیم"
                      : "We look forward to hosting you"}
                  </p>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1 border-b border-dashed border-[#E6DDD0]">
                    <span className="text-[#8E7D6E]">
                      {isFa ? "میز:" : "Table:"}
                    </span>
                    <span className="font-black text-[#4F6354]">
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#E6DDD0]">
                    <span className="text-[#8E7D6E]">
                      {isFa ? "نام مهمان:" : "Name:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dashed border-[#E6DDD0]">
                    <span className="text-[#8E7D6E]">
                      {isFa ? "تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8E7D6E]">
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
                  className="w-full bg-[#2B1E17] text-[#F6F1E9] py-3.5 rounded-full font-black text-sm"
                >
                  {isFa ? "بازگشت به منو" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-[#FFFDF9] border border-[#E6DDD0] px-3.5 py-2.5 rounded-2xl text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#4F6354]">
                      <span className="w-2 h-2 rounded-full bg-[#4F6354]" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#B86B35]">
                      <span className="w-2 h-2 rounded-full bg-[#B86B35]" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black text-[#2B1E17]">
                        {isFa ? "انتخاب شماره میز:" : "Pick a table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#4F6354]"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-[#FFFDF9] rounded-2xl p-4 text-center text-xs font-bold text-[#7A6A5E]">
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
                                  ? "border-[#4F6354] bg-[#4F6354] text-[#FFFDF9] shadow-md"
                                  : isFree
                                    ? "border-[#E6DDD0] bg-[#FFFDF9] text-[#2B1E17] hover:border-[#4F6354]"
                                    : "border-transparent bg-[#EAE2D6] text-[#9A897A] opacity-60 cursor-not-allowed"
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
                                    ? "text-[#D9E6DC]"
                                    : isFree
                                      ? "text-[#4F6354]"
                                      : t.state === "reserved"
                                        ? "text-[#B86B35]"
                                        : "text-rose-700"
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

                  <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className="text-[#4F6354]" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-[#F6F1E9] rounded-full p-0.5 border border-[#E6DDD0]">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#FFFDF9] flex items-center justify-center shadow-2xs"
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
                          className="w-7 h-7 rounded-full bg-[#4F6354] text-white flex items-center justify-center"
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
                              ? "bg-[#2B1E17] text-[#F6F1E9] border-[#2B1E17]"
                              : "bg-[#F6F1E9] text-[#6E5E52] border-[#E6DDD0]"
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
                        className={`absolute top-1/2 -translate-y-1/2 text-[#9A897A] ${
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
                        className={`w-full bg-[#FFFDF9] border border-[#E6DDD0] focus:border-[#4F6354] rounded-2xl py-3 text-xs font-bold outline-none ${
                          isFa ? "pr-9 pl-3.5" : "pl-9 pr-3.5"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#9A897A] ${
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
                        className="w-full bg-[#FFFDF9] border border-[#E6DDD0] focus:border-[#4F6354] rounded-2xl py-3 px-9 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa
                          ? "توضیحات (مثلاً: فضای باز / کنار پریز برق)..."
                          : "Note (optional)..."
                      }
                      className="w-full bg-[#FFFDF9] border border-[#E6DDD0] focus:border-[#4F6354] rounded-2xl py-3 px-3.5 text-xs font-bold outline-none"
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
                  className="w-full bg-[#4F6354] hover:bg-[#3F5143] disabled:opacity-40 text-[#FFFDF9] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
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
          دراور سبد سفارش
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F6F1E9] border-t border-[#E6DDD0] w-full max-w-lg mx-auto rounded-t-[30px] p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-[#D5C8B7] rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-[#2B1E17]">
                  {isFa ? "سبد سفارش شما" : "Your Order"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-[#4F6354]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#7A6A5E] flex items-center justify-center"
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
                    className="bg-[#FFFDF9] border border-[#E6DDD0] p-3.5 rounded-2xl space-y-2.5"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[#2B1E17] truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-[#B86B35] font-bold mt-0.5">
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
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${
                              isNoteOpen
                                ? "bg-[#4F6354] text-white border-[#4F6354]"
                                : "bg-[#F6F1E9] text-[#7A6A5E] border-[#E6DDD0]"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-[#F6F1E9] border border-[#E6DDD0] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-[#FFFDF9] text-[#2B1E17] flex items-center justify-center"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#4F6354] text-white flex items-center justify-center"
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
                            ? "یادداشت برای باریستا یا آشپزخانه..."
                            : "Note for barista / kitchen..."
                        }
                        className="w-full bg-[#F6F1E9] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold outline-none"
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
                className="w-full bg-[#FFFDF9] border border-[#E6DDD0] focus:border-[#4F6354] rounded-2xl px-4 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#2B1E17] hover:bg-[#4F6354] disabled:opacity-50 text-[#F6F1E9] py-3.5 rounded-full font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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

      {/* مودال احضار میزبان / سالن‌دار */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-[#D5C8B7] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F6F1E9] text-[#B86B35] flex items-center justify-center border border-[#E6DDD0]">
                  <BellRing size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2B1E17]">
                    {isFa ? "احضار میزبان" : "Call Waiter"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#7A6A5E]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-8 h-8 rounded-full bg-[#F6F1E9] text-[#7A6A5E] flex items-center justify-center"
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
                      ? "bg-[#4F6354] text-[#FFFDF9] border-[#4F6354]"
                      : "bg-[#F6F1E9] text-[#2B1E17] border-[#E6DDD0]"
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
              className="w-full bg-[#F6F1E9] border border-[#E6DDD0] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-[#2B1E17] hover:bg-[#4F6354] text-[#F6F1E9] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors"
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

      {/* مودال یادداشت به باریستا / سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-[#D5C8B7] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#4F6354] text-[#FFFDF9] flex items-center justify-center">
                  <ChefHat size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2B1E17]">
                    {isFa ? "یادداشت به باریستا / سرآشپز" : "Note to Barista"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#7A6A5E]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-8 h-8 rounded-full bg-[#F6F1E9] text-[#7A6A5E] flex items-center justify-center"
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
                      ? "bg-[#4F6354] text-[#FFFDF9] border-[#4F6354]"
                      : "bg-[#F6F1E9] text-[#2B1E17] border-[#E6DDD0]"
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
                  ? "نوع شیر، میزان شیرینی یا حساسیت غذایی..."
                  : "Milk preference, sweetness or allergies..."
              }
              className="w-full bg-[#F6F1E9] border border-[#E6DDD0] rounded-2xl p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-[#4F6354] hover:bg-[#3F5143] text-[#FFFDF9] py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال به بار و آشپزخانه" : "Send Note"}</span>
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
          className="fixed inset-0 z-50 bg-[#2B1E17]/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F6F1E9] border border-[#E6DDD0] w-full max-w-md rounded-t-[30px] sm:rounded-[30px] p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-[#D5C8B7] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-[#FFFDF9] border border-[#E6DDD0] text-[#2B1E17] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
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
                className="w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#7A6A5E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4F6354] text-[#FFFDF9] flex items-center justify-center mb-2.5">
                <Coffee size={24} />
              </div>
              <span className="inline-block text-[11px] font-black text-[#B86B35] bg-[#FFFDF9] border border-[#E6DDD0] px-3 py-0.5 rounded-full mb-1.5">
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black text-[#2B1E17]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش شما سرو شد"
                    : "Order Served!"
                  : isFa
                    ? "وضعیت آماده‌سازی سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
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
                          ? "bg-[#4F6354] text-white"
                          : isActive
                            ? "bg-[#B86B35] text-white"
                            : "bg-[#F6F1E9] text-[#9A897A]"
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
                      <span className="block font-black text-xs sm:text-sm text-[#2B1E17]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#7A6A5E] mt-0.5">
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
              className="w-full bg-[#2B1E17] text-[#F6F1E9] py-3.5 rounded-full font-black text-sm shrink-0"
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

export default Template6;
