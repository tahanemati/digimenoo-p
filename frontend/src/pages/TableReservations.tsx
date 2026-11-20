import { useState, useEffect, useCallback, useRef } from "react";
import {
  CalendarCheck,
  Plus,
  Search,
  Phone,
  User,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  X,
  AlertTriangle,
  UtensilsCrossed,
  Unlock,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";
import { reservationsApi, ordersApi } from "../service/api";

type TableState = "available" | "reserved" | "occupied";

type ReservationInfo = {
  id: string;
  tableNumber: number;
  customerName: string;
  customerMobile: string;
  guestsCount: number;
  reservationTime: string;
  notes: string;
  source: "customer" | "manual";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  timeCreated: string;
};

type TableSlot = {
  tableNumber: number;
  state: TableState;
  activeOrder: {
    id: string;
    orderNumber: number;
    status: string;
    stageName: string;
    totalPrice: number;
  } | null;
  reservation: ReservationInfo | null;
};

export const TableReservations = () => {
  const [tables, setTables] = useState<TableSlot[]>([]);
  const [reservations, setReservations] = useState<ReservationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [filterState, setFilterState] = useState<"all" | TableState>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // مودال رزرو دستی میز
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTableNum, setSelectedTableNum] = useState<number>(1);
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formGuests, setFormGuests] = useState<number>(2);
  const [formTime, setFormTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const playBell = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      );
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const fetchData = useCallback(async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const res = await reservationsApi.getManageData();
      const payload = res?.data?.data || res?.data || res || {};
      if (Array.isArray(payload.tables)) {
        setTables(payload.tables);
      }
      if (Array.isArray(payload.reservations)) {
        setReservations(payload.reservations);
      }
    } catch (err) {
      console.error("خطا در دریافت وضعیت رزرو میزها:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // اتصال WebSocket برای دریافت لحظه‌ای درخواست‌های رزرو و سفارش‌های باز
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      ws = new WebSocket(ordersApi.getKitchenWsUrl());

      ws.onopen = () => {
        if (!isUnmounted) setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const msg = JSON.parse(event.data);
          const { event: eventType, data } = msg;

          if (eventType === "tables_updated" && Array.isArray(data?.tables)) {
            setTables(data.tables);
          } else if (eventType === "reservation_created" && data) {
            playBell();
            showToast(
              `درخواست رزرو جدید برای میز ${data.tableNumber} از طرف ${data.customerName}`,
            );
            setReservations((prev) => {
              if (prev.some((r) => r.id === data.id)) return prev;
              return [data, ...prev];
            });
          } else if (eventType === "reservation_updated" && data) {
            setReservations((prev) =>
              prev.map((r) => (r.id === data.id ? data : r)),
            );
          } else if (
            eventType === "order_created" ||
            eventType === "order_completed"
          ) {
            fetchData();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      };

      ws.onerror = () => ws?.close();
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [fetchData, playBell]);

  const availableTables = tables.filter((t) => t.state === "available");

  const openManualReserveModal = (tableNum?: number) => {
    const targetTable =
      tableNum ||
      availableTables[0]?.tableNumber ||
      tables[0]?.tableNumber ||
      1;
    setSelectedTableNum(targetTable);
    setFormName("");
    setFormMobile("");
    setFormGuests(2);
    setFormTime("");
    setFormNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleManualSubmit = async () => {
    if (!formName.trim()) {
      setFormError("نام و نام خانوادگی مهمان را وارد کنید.");
      return;
    }
    if (formMobile.trim().length < 10) {
      setFormError("شماره تماس معتبر وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      await reservationsApi.createManual({
        tableNumber: selectedTableNum,
        customerName: formName.trim(),
        customerMobile: formMobile.trim(),
        guestsCount: formGuests,
        reservationTime: formTime.trim(),
        notes: formNotes.trim(),
      });
      setIsModalOpen(false);
      showToast(`میز شماره ${selectedTableNum} برای ${formName} رزرو شد.`);
      fetchData();
    } catch (err: any) {
      setFormError(err?.message || "خطا در ثبت رزرو میز.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    reservationId: string,
    status: "confirmed" | "cancelled" | "completed",
  ) => {
    try {
      await reservationsApi.updateStatus(reservationId, status);
      const labelMap = {
        confirmed: "رزرو تایید شد.",
        cancelled: "رزرو لغو و میز آزاد شد.",
        completed: "میز آزاد و آماده پذیرش جدید شد.",
      };
      showToast(labelMap[status]);
      fetchData();
    } catch (err: any) {
      alert(err?.message || "خطا در تغییر وضعیت رزرو.");
    }
  };

  const availableCount = tables.filter((t) => t.state === "available").length;
  const reservedCount = tables.filter((t) => t.state === "reserved").length;
  const occupiedCount = tables.filter((t) => t.state === "occupied").length;

  const filteredTables = tables.filter((t) => {
    if (filterState !== "all" && t.state !== filterState) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(t.tableNumber).includes(q) ||
      String(t.reservation?.customerName || "")
        .toLowerCase()
        .includes(q) ||
      String(t.reservation?.customerMobile || "").includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-slate-800 font-sans pb-28 lg:pb-12 relative overflow-x-hidden"
      dir="rtl"
    >
      {/* اعلان زنده */}
      {toastMsg && (
        <div className="fixed top-5 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-5 py-3.5 rounded-full shadow-2xl font-black text-xs flex items-center gap-2.5 border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 py-6 md:p-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* هدر صفحه */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                <CalendarCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-[22px] md:text-3xl font-black text-slate-900 tracking-tight">
                    وضعیت و رزرو میزها
                  </h1>
                  {wsConnected ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black rounded-lg flex items-center gap-1.5">
                      <Wifi size={12} /> زنده
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black rounded-lg flex items-center gap-1.5">
                      <WifiOff size={12} /> در حال اتصال...
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs md:text-sm font-bold mt-0.5">
                  مشاهده لحظه‌ای وضعیت میزها، سفارش‌های باز و ثبت رزرو دستی برای
                  مهمانان
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="صدای اعلان رزرو جدید"
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors ${
                soundEnabled
                  ? "bg-orange-50 border-orange-200 text-orange-500"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              type="button"
              onClick={() => fetchData(true)}
              className="w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center text-slate-600 shadow-2xs transition-all active:scale-95"
              title="بروزرسانی"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin text-orange-500" : ""}
              />
            </button>

            <button
              type="button"
              disabled={availableTables.length === 0}
              onClick={() => openManualReserveModal()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-3 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 shadow-xl shadow-slate-900/15 transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span>رزرو دستی میز</span>
            </button>
          </div>
        </header>

        {/* ۴ کارت آمار وضعیت سالن */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[26px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">
                کل میزهای سالن
              </span>
              <span className="text-2xl md:text-3xl font-black text-slate-900">
                {tables.length.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles size={22} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[26px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 block mb-1">
                میزهای آزاد
              </span>
              <span className="text-2xl md:text-3xl font-black text-emerald-600">
                {availableCount.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[26px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 block mb-1">
                رزرو شده
              </span>
              <span className="text-2xl md:text-3xl font-black text-amber-600">
                {reservedCount.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck size={22} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[26px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-600 block mb-1">
                دارای سفارش باز
              </span>
              <span className="text-2xl md:text-3xl font-black text-rose-600">
                {occupiedCount.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UtensilsCrossed size={22} />
            </div>
          </div>
        </div>

        {/* نوار فیلتر و جستجوی میزها */}
        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[26px] border border-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                { id: "all", label: `همه میزها (${tables.length})` },
                { id: "available", label: `آزاد (${availableCount})` },
                { id: "reserved", label: `رزرو شده (${reservedCount})` },
                { id: "occupied", label: `سفارش باز (${occupiedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterState(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  filterState === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره میز، نام یا موبایل..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pr-9 pl-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* نقشه گرافیکی و مدرن میزهای سالن */}
        {tables.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
            <CalendarCheck size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-black text-slate-800 mb-1">
              هنوز تعداد میزهای مجموعه مشخص نشده است
            </h3>
            <p className="text-xs font-bold text-slate-400">
              از بخش تنظیمات مجموعه تعداد میزهای رستوران را وارد کنید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTables.map((table) => {
              // ۱. میز دارای سفارش باز
              if (table.state === "occupied" && table.activeOrder) {
                return (
                  <div
                    key={table.tableNumber}
                    className="bg-white rounded-[30px] p-5 border-2 border-rose-200/80 shadow-[0_8px_30px_rgba(244,63,94,0.06)] flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-orange-500" />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 font-black text-lg flex items-center justify-center border border-rose-100">
                            {table.tableNumber.toLocaleString("fa-IR")}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">
                              میز شماره{" "}
                              {table.tableNumber.toLocaleString("fa-IR")}
                            </h3>
                            <span className="text-[11px] font-bold text-rose-500">
                              اشغال (سفارش باز)
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black">
                          فیش #{table.activeOrder.orderNumber}
                        </span>
                      </div>

                      <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5 space-y-2 mb-4 text-xs font-bold">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">مرحله سفارش:</span>
                          <span className="text-rose-700 font-black">
                            {table.activeOrder.stageName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">مبلغ سفارش:</span>
                          <span className="text-slate-900 font-black">
                            {table.activeOrder.totalPrice.toLocaleString(
                              "fa-IR",
                            )}{" "}
                            تومان
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 bg-slate-50 rounded-xl py-2.5 px-3 text-center">
                      تا زمان تحویل سفارش، این میز رزرو محسوب می‌شود
                    </div>
                  </div>
                );
              }

              // ۲. میز رزرو شده
              if (table.state === "reserved" && table.reservation) {
                const resv = table.reservation;
                const isPending = resv.status === "pending";

                return (
                  <div
                    key={table.tableNumber}
                    className={`bg-white rounded-[30px] p-5 border-2 ${
                      isPending
                        ? "border-orange-300 shadow-[0_10px_30px_rgba(249,115,22,0.10)]"
                        : "border-amber-200/80 shadow-[0_8px_30px_rgba(245,158,11,0.06)]"
                    } flex flex-col justify-between relative overflow-hidden`}
                  >
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 font-black text-lg flex items-center justify-center border border-amber-100">
                            {table.tableNumber.toLocaleString("fa-IR")}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">
                              میز شماره{" "}
                              {table.tableNumber.toLocaleString("fa-IR")}
                            </h3>
                            <span className="text-[11px] font-bold text-amber-600">
                              {isPending
                                ? "درخواست رزرو جدید"
                                : "رزرو تایید شده"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">
                          {resv.source === "manual" ? "دستی" : "آنلاین"}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 mb-4 text-xs font-bold">
                        <div className="flex items-center gap-2 text-slate-800">
                          <User
                            size={14}
                            className="text-orange-500 shrink-0"
                          />
                          <span className="font-black truncate">
                            {resv.customerName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Phone size={13} className="text-slate-400" />
                            {resv.customerMobile}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Users size={13} />
                            {resv.guestsCount.toLocaleString("fa-IR")} نفر
                          </span>
                        </div>
                        {resv.reservationTime && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                            <Clock size={13} />
                            <span>ساعت حضور: {resv.reservationTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(resv.id, "confirmed")
                          }
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                        >
                          <Check size={15} /> تایید رزرو
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStatusChange(resv.id, "completed")}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <Unlock size={14} /> آزاد کردن میز
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(resv.id, "cancelled")}
                        title="لغو رزرو"
                        className="w-10 h-9 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center transition-colors shrink-0"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              }

              // ۳. میز آزاد (قابل رزرو دستی با یک کلیک)
              return (
                <div
                  key={table.tableNumber}
                  onClick={() => openManualReserveModal(table.tableNumber)}
                  className="group cursor-pointer bg-white rounded-[30px] p-5 border border-slate-200/70 hover:border-emerald-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-400/70 group-hover:bg-emerald-500 transition-colors" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-lg flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                          {table.tableNumber.toLocaleString("fa-IR")}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-base">
                            میز شماره{" "}
                            {table.tableNumber.toLocaleString("fa-IR")}
                          </h3>
                          <span className="text-[11px] font-bold text-emerald-600">
                            آزاد و آماده پذیرش
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full bg-emerald-50 group-hover:bg-emerald-500 text-emerald-700 group-hover:text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>رزرو این میز</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* تاریخچه آخرین رزروها */}
        {reservations.length > 0 && (
          <section className="bg-white rounded-[32px] p-6 md:p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <h2 className="text-lg font-black text-slate-900 mb-5">
              تاریخچه رزروهای ثبت‌شده
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-[11px] font-black text-slate-400">
                    <th className="py-3 px-3">میز</th>
                    <th className="py-3 px-3">نام و نام خانوادگی</th>
                    <th className="py-3 px-3">شماره تماس</th>
                    <th className="py-3 px-3">نفرات</th>
                    <th className="py-3 px-3">ساعت</th>
                    <th className="py-3 px-3">نحوه ثبت</th>
                    <th className="py-3 px-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-black text-slate-900">
                        میز {r.tableNumber.toLocaleString("fa-IR")}
                      </td>
                      <td className="py-3 px-3 text-slate-800">
                        {r.customerName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {r.customerMobile}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {r.guestsCount.toLocaleString("fa-IR")} نفر
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {r.reservationTime || r.timeCreated}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {r.source === "manual" ? "دستی (مدیر)" : "منوی مشتری"}
                      </td>
                      <td className="py-3 px-3">
                        {r.status === "confirmed" && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-black">
                            تایید شده
                          </span>
                        )}
                        {r.status === "pending" && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-black">
                            در انتظار تایید
                          </span>
                        )}
                        {r.status === "completed" && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-black">
                            آزاد شده
                          </span>
                        )}
                        {r.status === "cancelled" && (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-black">
                            لغو شده
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* مودال ثبت رزرو دستی میز (Apple Style) */}
      {isModalOpen && (
        <div
          onClick={() => !isSubmitting && setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[36px] p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 left-6 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-rose-500 flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <CalendarCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  رزرو دستی میز
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  مشخصات مهمان و میز مورد نظر را وارد کنید
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  انتخاب شماره میز آزاد
                </label>
                <select
                  value={selectedTableNum}
                  onChange={(e) => setSelectedTableNum(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-orange-500"
                >
                  {availableTables.map((t) => (
                    <option key={t.tableNumber} value={t.tableNumber}>
                      میز شماره {t.tableNumber.toLocaleString("fa-IR")} (آزاد)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  نام و نام خانوادگی مهمان
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً: رضا کریمی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  شماره تماس
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  value={formMobile}
                  onChange={(e) =>
                    setFormMobile(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="09123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left font-mono text-sm font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    تعداد نفرات
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formGuests}
                    onChange={(e) =>
                      setFormGuests(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    ساعت حضور (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="مثلاً: 20:30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مثلاً: جشن تولد / کنار پنجره"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl text-xs font-black">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleManualSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>ثبت نهایی رزرو میز</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableReservations;
