import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Wallet,
  Receipt,
  Loader2,
  Settings,
  Plus,
  Trash2,
  X,
  LayoutList,
  Check,
  BellRing,
  ChefHat,
  RefreshCw,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from "lucide-react";

import { ordersApi } from "../service/api";

type PaymentMethod = "online" | "cashier";
type PaymentStatus = "paid" | "pending";
type UserRole = "owner" | "cashier" | "kitchen" | "waiter";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  notes?: string;
};

type Order = {
  id: string;
  order_number: number;
  table_number: string;
  time_created: string;
  total_price: string;
  status: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  items: OrderItem[];
};

type Stage = {
  id: string;
  name: string;
  description: string;
  color: string;
};

type TableCall = {
  id: string;
  table_number: string;
  call_type: "waiter" | "chef";
  message: string;
  is_resolved: boolean;
  time_created: string;
};

type AccountingSummary = {
  totalOrders: number;
  totalSales: number;
  paidSales: number;
  unpaidSales: number;
  paidCount: number;
  unpaidCount: number;
};

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (res?.data && Array.isArray(res.data.items)) return res.data.items;
  return [];
};

const getStoredUserRole = (): UserRole => {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const r = String(parsed?.role || parsed?.Role || "").toLowerCase();
      if (
        r === "cashier" ||
        r === "kitchen" ||
        r === "waiter" ||
        r === "owner"
      ) {
        return r;
      }
    }
    const storedRole = String(localStorage.getItem("role") || "").toLowerCase();
    if (
      storedRole === "cashier" ||
      storedRole === "kitchen" ||
      storedRole === "waiter" ||
      storedRole === "owner"
    ) {
      return storedRole;
    }
  } catch {
    // ignore
  }
  return "owner";
};

const colorOptions = ["blue", "amber", "emerald", "purple", "rose", "indigo"];

const colorMap: Record<string, any> = {
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    badge: "bg-amber-500",
    hoverBg: "hover:bg-amber-500",
    light: "bg-amber-500/10",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    badge: "bg-blue-500",
    hoverBg: "hover:bg-blue-500",
    light: "bg-blue-500/10",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    badge: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-500",
    light: "bg-emerald-500/10",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    badge: "bg-purple-500",
    hoverBg: "hover:bg-purple-500",
    light: "bg-purple-500/10",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    badge: "bg-rose-500",
    hoverBg: "hover:bg-rose-500",
    light: "bg-rose-500/10",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
    badge: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-500",
    light: "bg-indigo-500/10",
  },
};

const normalizeOrder = (o: any, fallbackStageId = ""): Order => ({
  id: String(o.id || o.Id),
  order_number: Number(o.orderNumber || o.order_number || 1001),
  table_number: String(o.tableNumber || o.TableNumber || o.table_number || "-"),
  time_created:
    o.timeCreated ||
    o.time_created ||
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  total_price: String(o.totalPrice ?? o.total_price ?? "0"),
  status: String(o.stageId || o.StageId || fallbackStageId),
  payment_method: (String(
    o.paymentMethod || o.payment_method || "cashier",
  ).toLowerCase() === "online"
    ? "online"
    : "cashier") as PaymentMethod,
  payment_status: (String(
    o.paymentStatus || o.payment_status || "pending",
  ).toLowerCase() === "paid"
    ? "paid"
    : "pending") as PaymentStatus,
  items: extractArray(o.items || o.Items).map((i: any) => ({
    id: String(i.id || i.Id || Math.random()),
    product_name: i.productName || i.productNameFa || i.product_name || "محصول",
    quantity: Number(i.quantity || i.Quantity || 1),
    notes: i.notes || i.Notes || "",
  })),
});

const normalizeCall = (c: any): TableCall => ({
  id: String(c.id || c.Id),
  table_number: String(c.tableNumber || c.table_number || "-"),
  call_type: (String(c.callType || c.call_type).toLowerCase() === "chef"
    ? "chef"
    : "waiter") as "waiter" | "chef",
  message: String(c.message || ""),
  is_resolved: String(c.status || "").toLowerCase() === "handled",
  time_created:
    c.timeCreated ||
    c.time_created ||
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
});

export const KitchenPanel = () => {
  const [userRole, setUserRole] = useState<UserRole>(getStoredUserRole);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [wsConnected, setWsConnected] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const stagesRef = useRef<Stage[]>([]);
  stagesRef.current = stages;

  const [calls, setCalls] = useState<TableCall[]>([]);
  const [accounting, setAccounting] = useState<AccountingSummary>({
    totalOrders: 0,
    totalSales: 0,
    paidSales: 0,
    unpaidSales: 0,
    paidCount: 0,
    unpaidCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingStages, setEditingStages] = useState<Stage[]>([]);
  const [isSavingStages, setIsSavingStages] = useState(false);

  const canSeeOrders =
    userRole === "owner" || userRole === "cashier" || userRole === "kitchen";
  const canManageStages = userRole === "owner" || userRole === "kitchen";
  const canSeeCashier = userRole === "owner" || userRole === "cashier";
  const hasChefCalls =
    (userRole === "owner" || userRole === "kitchen") && calls.length > 0;
  const hasRightSidebar = canSeeCashier || hasChefCalls;

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
      );
      audio.play().catch(() => {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchOrdersAndStages = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      try {
        const res = await ordersApi.getKitchenOrders();
        const payload = res?.data?.data || res?.data || res || {};

        const serverRole = String(payload.role || "").toLowerCase();
        if (
          serverRole === "owner" ||
          serverRole === "cashier" ||
          serverRole === "kitchen" ||
          serverRole === "waiter"
        ) {
          setUserRole(serverRole);
        }

        if (payload.accounting) {
          setAccounting(payload.accounting);
        }

        let rawStages = extractArray(payload.stages);
        const rawOrders = extractArray(payload.orders);
        const rawCalls = extractArray(payload.calls);

        if (rawStages.length === 0 && serverRole !== "waiter") {
          rawStages = [
            {
              id: "1",
              name: "در حال بررسی سفارش",
              description: "سفارش شما با موفقیت ثبت شد",
              color: "blue",
            },
            {
              id: "2",
              name: "در حال آماده‌سازی",
              description: "سرآشپز مشغول آماده کردن سفارش شماست",
              color: "amber",
            },
            {
              id: "3",
              name: "آماده تحویل به میز",
              description: "سفارش آماده است و تا لحظاتی دیگر سرو می‌شود",
              color: "emerald",
            },
          ];
        }

        const formattedStages: Stage[] = rawStages.map((s: any) => ({
          id: String(s.id || s.Id),
          name: s.name || s.Name || "مرحله",
          description: s.description || "",
          color: s.color || s.Color || "amber",
        }));

        const firstStageId = formattedStages[0]?.id || "";
        const formattedOrders = rawOrders.map((o: any) =>
          normalizeOrder(o, firstStageId),
        );
        const formattedCalls = rawCalls
          .map(normalizeCall)
          .filter((c) => !c.is_resolved);

        setStages(formattedStages);
        setEditingStages(formattedStages);
        setOrders(formattedOrders);
        setCalls(formattedCalls);

        setActiveTab((prevTab) => {
          if (
            formattedStages.length > 0 &&
            (!prevTab || !formattedStages.find((s) => s.id === prevTab))
          ) {
            return String(formattedStages[0].id);
          }
          return prevTab;
        });
      } catch (error) {
        console.error("خطا در دریافت اطلاعات پنل:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchOrdersAndStages();
  }, [fetchOrdersAndStages]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;
      const wsUrl = ordersApi.getKitchenWsUrl();
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isUnmounted) {
          setWsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventType, data } = message;

          if (eventType === "order_created" && data) {
            if (userRole === "waiter") return;
            const firstStageId = stagesRef.current[0]?.id || "";
            const incomingOrder = normalizeOrder(data, firstStageId);

            setOrders((prev) => {
              if (prev.some((o) => o.id === incomingOrder.id)) return prev;
              playNotificationSound();
              return [...prev, incomingOrder];
            });

            const orderAmt = Number(incomingOrder.total_price || 0);
            setAccounting((prev) => ({
              ...prev,
              totalOrders: prev.totalOrders + 1,
              totalSales: prev.totalSales + orderAmt,
              unpaidSales: prev.unpaidSales + orderAmt,
              unpaidCount: prev.unpaidCount + 1,
            }));
          } else if (eventType === "order_updated" && data) {
            if (userRole === "waiter") return;
            const firstStageId = stagesRef.current[0]?.id || "";
            const updatedOrder = normalizeOrder(data, firstStageId);

            setOrders((prev) => {
              const oldOrder = prev.find((o) => o.id === updatedOrder.id);
              if (
                oldOrder &&
                oldOrder.payment_status !== "paid" &&
                updatedOrder.payment_status === "paid"
              ) {
                const amt = Number(updatedOrder.total_price || 0);
                setAccounting((acc) => ({
                  ...acc,
                  paidSales: acc.paidSales + amt,
                  unpaidSales: Math.max(0, acc.unpaidSales - amt),
                  paidCount: acc.paidCount + 1,
                  unpaidCount: Math.max(0, acc.unpaidCount - 1),
                }));
              }
              return prev.map((o) =>
                o.id === updatedOrder.id ? updatedOrder : o,
              );
            });
          } else if (eventType === "order_completed" && data?.id) {
            setOrders((prev) => prev.filter((o) => o.id !== String(data.id)));
          } else if (eventType === "service_call_created" && data) {
            const incomingCall = normalizeCall(data);
            if (userRole === "kitchen" && incomingCall.call_type !== "chef") {
              return;
            }
            if (userRole === "waiter" && incomingCall.call_type !== "waiter") {
              return;
            }
            setCalls((prev) => {
              if (prev.some((c) => c.id === incomingCall.id)) return prev;
              playNotificationSound();
              return [incomingCall, ...prev];
            });
          } else if (eventType === "service_call_resolved" && data?.id) {
            setCalls((prev) => prev.filter((c) => c.id !== String(data.id)));
          } else if (eventType === "stages_updated" && data?.stages) {
            if (userRole === "waiter") return;
            const updatedStages: Stage[] = data.stages.map((s: any) => ({
              id: String(s.id),
              name: s.name,
              description: s.description || "",
              color: s.color || "amber",
            }));
            setStages(updatedStages);
            setEditingStages(updatedStages);
            setActiveTab((prevTab) =>
              updatedStages.some((s) => s.id === prevTab)
                ? prevTab
                : updatedStages[0]?.id || "",
            );
          }
        } catch (err) {
          console.error("خطا در پردازش پیام WebSocket:", err);
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [playNotificationSound, userRole]);

  const advanceOrderStatus = async (
    orderId: string,
    currentStageId: string,
  ) => {
    try {
      const currentIndex = stages.findIndex((s) => s.id === currentStageId);
      const isLastStage = currentIndex === stages.length - 1;

      if (isLastStage) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        await ordersApi.completeOrder(orderId);
      } else {
        const nextStageId = String(stages[currentIndex + 1].id);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: nextStageId } : o,
          ),
        );
        await ordersApi.updateOrderStage(orderId, nextStageId);
      }
    } catch {
      alert("خطا در تغییر وضعیت سفارش");
      fetchOrdersAndStages();
    }
  };

  const settlePayment = async (orderId: string) => {
    try {
      const target = orders.find((o) => o.id === orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: "paid" } : o,
        ),
      );
      if (target && target.payment_status !== "paid") {
        const amt = Number(target.total_price || 0);
        setAccounting((prev) => ({
          ...prev,
          paidSales: prev.paidSales + amt,
          unpaidSales: Math.max(0, prev.unpaidSales - amt),
          paidCount: prev.paidCount + 1,
          unpaidCount: Math.max(0, prev.unpaidCount - 1),
        }));
      }
      await ordersApi.payOrder(orderId);
    } catch {
      alert("خطا در ثبت پرداخت");
      fetchOrdersAndStages();
    }
  };

  const handleResolveCall = async (callId: string) => {
    try {
      setCalls((prev) => prev.filter((c) => c.id !== callId));
      await ordersApi.resolveCall(callId);
    } catch {
      fetchOrdersAndStages();
    }
  };

  const handleAddStage = () => {
    const randomColor =
      colorOptions[editingStages.length % colorOptions.length];
    const newStage: Stage = {
      id: `new-${Math.random()}`,
      name: "مرحله جدید",
      description: "",
      color: randomColor,
    };
    setEditingStages([...editingStages, newStage]);
  };

  const handleUpdateStageField = (
    index: number,
    field: "name" | "description" | "color",
    value: string,
  ) => {
    const updated = [...editingStages];
    updated[index] = { ...updated[index], [field]: value };
    setEditingStages(updated);
  };

  const handleMoveStage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= editingStages.length) return;
    const updated = [...editingStages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setEditingStages(updated);
  };

  const handleDeleteStage = (index: number) => {
    if (editingStages.length <= 1) {
      alert("حداقل یک مرحله باید وجود داشته باشد!");
      return;
    }
    const updated = [...editingStages];
    updated.splice(index, 1);
    setEditingStages(updated);
  };

  const saveStages = async () => {
    setIsSavingStages(true);
    try {
      const payload = editingStages.map((s, index) => ({
        id: s.id.startsWith("new-") ? null : s.id,
        name: s.name.trim() || "مرحله",
        description: s.description.trim(),
        color: s.color,
        orderIndex: index,
      }));

      await ordersApi.updateStages(payload);
      await fetchOrdersAndStages();
      setIsSettingsOpen(false);
    } catch {
      alert("خطا در ذخیره مراحل. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSavingStages(false);
    }
  };

  const pendingCashierOrders = orders.filter(
    (o) =>
      String(o.payment_method) === "cashier" &&
      String(o.payment_status) === "pending",
  );

  const roleTitleMap: Record<UserRole, string> = {
    owner: "ترمینال مدیریت و آشپزخانه",
    cashier: "پنل صندوق‌دار و حسابداری",
    kitchen: "ترمینال آشپزخانه و سرآشپز",
    waiter: "پنل گارسون و درخواست میزها",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-[#F5F5F7] flex flex-col p-4 md:p-6 overflow-hidden font-sans text-slate-800"
      dir="rtl"
    >
      {/* هدر صفحه */}
      <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white border border-slate-200 shadow-sm rounded-[24px] p-4 shrink-0 relative z-10 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-colors"
          >
            <ChevronRight size={24} />
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {roleTitleMap[userRole]}
            </h1>
            <div className="flex gap-2">
              {wsConnected ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-sm">
                  <Wifi size={12} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                  متصل (زنده)
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-sm">
                  <WifiOff size={12} /> در حال اتصال مجدد...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchOrdersAndStages(true)}
            className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl shadow-sm transition-all"
            title="بروزرسانی دستی"
          >
            <RefreshCw
              size={20}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>

          {canManageStages && (
            <button
              type="button"
              onClick={() => {
                setEditingStages(stages);
                setIsSettingsOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Settings size={18} />{" "}
              <span className="hidden md:inline">مراحل پخت</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl shadow-sm text-white">
            <Clock size={18} className="text-orange-400" />
            <span className="font-black font-mono text-[15px]" dir="ltr">
              {currentTime}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "قطع صدای اعلان" : "فعال‌سازی صدای اعلان"}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-sm ${soundEnabled ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-slate-50 border-slate-200 text-slate-400"}`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      {/* نمای اختصاصی گارسون */}
      {userRole === "waiter" ? (
        <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-[28px] p-6 flex flex-col overflow-hidden shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
              <BellRing className="text-purple-500" size={22} />
              <span>درخواست‌های فعال میزها</span>
            </h2>
            <span className="bg-purple-50 text-purple-600 border border-purple-200 font-black px-3.5 py-1 rounded-xl text-xs">
              {calls.length.toLocaleString("fa-IR")} درخواست
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {calls.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <BellRing size={52} className="mb-3 text-purple-300" />
                <p className="font-bold text-sm">
                  در حال حاضر هیچ درخواست جدیدی از میزها ثبت نشده است.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-black text-slate-900">
                          میز {call.table_number}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60">
                          {call.time_created}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                        {call.message || "درخواست حضور گارسون بر سر میز"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResolveCall(call.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Check size={16} /> مراجعه شد و رسیدگی گردید
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* نمای مدیر، صندوق‌دار و آشپزخانه */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* ستون کناری فقط وقتی محتوا دارد نمایش داده می‌شود تا جای خالی نماند */}
          {hasRightSidebar && (
            <div className="w-full lg:w-[330px] xl:w-[370px] shrink-0 flex flex-col gap-5 overflow-hidden">
              {hasChefCalls && (
                <div className="shrink-0 max-h-[45%] flex flex-col bg-rose-950 border border-rose-900 shadow-xl shadow-rose-900/10 rounded-[28px] overflow-hidden relative">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-rose-500"></div>
                  <div className="shrink-0 p-4 bg-rose-900/30 border-b border-rose-900/50 flex justify-between items-center relative z-10">
                    <h2 className="text-sm font-black text-white flex items-center gap-2">
                      <ChefHat
                        size={16}
                        className="text-orange-400 animate-pulse"
                      />{" "}
                      درخواست‌های سرآشپز
                    </h2>
                    <span className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-lg text-xs">
                      {calls.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-rose-800">
                    {calls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-rose-900/40 border border-rose-800 rounded-2xl p-3 flex justify-between items-start gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black text-xs">
                              میز {call.table_number}
                            </span>
                            <span className="text-[10px] font-mono text-rose-300">
                              {call.time_created}
                            </span>
                          </div>
                          {call.message && (
                            <p className="text-[11px] text-rose-100/90 font-medium mt-1 leading-relaxed break-words">
                              {call.message}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResolveCall(call.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white w-8 h-8 rounded-lg flex justify-center items-center shrink-0"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canSeeCashier && (
                <>
                  <div className="shrink-0 bg-white border border-slate-200 rounded-[28px] p-4 shadow-sm space-y-3">
                    <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <TrendingUp size={17} className="text-emerald-500" />
                      <span>گزارش حسابداری و فروش</span>
                    </h2>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400">
                          کل فروش ثبت‌شده
                        </span>
                        <span className="block text-sm font-black text-slate-900 mt-1">
                          {accounting.totalSales.toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px] text-slate-400">
                            تومان
                          </span>
                        </span>
                      </div>
                      <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600">
                          تسویه شده (
                          {accounting.paidCount.toLocaleString("fa-IR")})
                        </span>
                        <span className="block text-sm font-black text-emerald-700 mt-1">
                          {accounting.paidSales.toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px]">تومان</span>
                        </span>
                      </div>
                      <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-100">
                        <span className="block text-[10px] font-bold text-amber-600">
                          در انتظار تسویه (
                          {accounting.unpaidCount.toLocaleString("fa-IR")})
                        </span>
                        <span className="block text-sm font-black text-amber-700 mt-1">
                          {accounting.unpaidSales.toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px]">تومان</span>
                        </span>
                      </div>
                      <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-100">
                        <span className="block text-[10px] font-bold text-blue-600">
                          تعداد کل سفارشات
                        </span>
                        <span className="block text-sm font-black text-blue-700 mt-1">
                          {accounting.totalOrders.toLocaleString("fa-IR")} سفارش
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-slate-900/10 rounded-[28px] relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                    <div className="shrink-0 p-4 xl:p-5 bg-slate-800/40 border-b border-slate-700 flex justify-between items-center relative z-10">
                      <h2 className="text-[15px] font-black text-white flex items-center gap-2">
                        <Wallet size={18} className="text-emerald-400" /> تسویه
                        صندوق
                      </h2>
                      <span className="bg-emerald-500 text-white font-black w-7 h-7 rounded-lg flex items-center justify-center text-xs">
                        {pendingCashierOrders.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                      {pendingCashierOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 text-slate-400">
                          <Wallet
                            size={48}
                            className="mb-3 opacity-30 text-emerald-500"
                          />
                          <p className="text-xs font-bold">
                            تسویه نشده‌ای وجود ندارد
                          </p>
                        </div>
                      ) : (
                        pendingCashierOrders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-slate-800 border border-slate-700 rounded-[20px] p-4 flex flex-col gap-4"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700/50 border border-slate-600 rounded-xl flex items-center justify-center text-slate-300">
                                  <Receipt size={20} />
                                </div>
                                <div>
                                  <span className="text-white font-black block text-sm">
                                    میز {order.table_number}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-bold font-mono">
                                    فیش #{order.order_number}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-bold">
                                مبلغ:
                              </span>
                              <span className="text-emerald-400 font-black text-lg">
                                {parseInt(order.total_price).toLocaleString(
                                  "fa-IR",
                                )}{" "}
                                <span className="text-[10px] text-emerald-600">
                                  تومان
                                </span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => settlePayment(order.id)}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-xs flex justify-center items-center gap-2 transition-colors"
                            >
                              <CheckCircle2 size={18} /> تایید دریافت وجه
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* پنل مراحل پخت و لیست سفارشات دریافتی (تمام عرض) */}
          {canSeeOrders && (
            <div className="flex-1 w-full min-w-0 flex flex-col gap-5 overflow-hidden animate-in fade-in">
              <div className="w-full shrink-0 flex items-center gap-2 overflow-x-auto p-2 bg-white rounded-[24px] shadow-sm border border-slate-200 hide-scrollbar">
                {stages.map((stage) => {
                  const isActive = activeTab === String(stage.id);
                  const c = colorMap[stage.color] || colorMap["amber"];
                  const stageOrdersCount = orders.filter(
                    (o) => String(o.status) === String(stage.id),
                  ).length;

                  return (
                    <button
                      type="button"
                      key={stage.id}
                      onClick={() => setActiveTab(String(stage.id))}
                      className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-[16px] font-black text-sm transition-all whitespace-nowrap border-2 ${
                        isActive
                          ? `${c.bg} ${c.text} ${c.border}`
                          : "bg-transparent text-slate-500 hover:bg-slate-50 border-transparent"
                      }`}
                    >
                      <LayoutList size={18} /> {stage.name}
                      <span
                        className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs ${isActive ? `${c.badge} text-white` : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                      >
                        {stageOrdersCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 w-full overflow-y-auto pb-4 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {(() => {
                  const activeStage = stages.find(
                    (s) => String(s.id) === activeTab,
                  );
                  if (!activeStage) return null;

                  const c = colorMap[activeStage.color] || colorMap["amber"];
                  const stageOrders = orders.filter(
                    (o) => String(o.status) === activeTab,
                  );
                  const isLastStage =
                    String(stages[stages.length - 1]?.id) === activeStage.id;

                  if (stageOrders.length === 0) {
                    return (
                      <div className="h-full w-full flex flex-col items-center justify-center opacity-40 text-slate-400">
                        <CheckCircle2 size={56} className="mb-4 opacity-30" />
                        <p className="font-bold">
                          هیچ سفارشی در این مرحله وجود ندارد
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-max">
                      {stageOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border border-slate-200 shadow-sm rounded-[24px] flex flex-col overflow-hidden animate-in zoom-in-95"
                        >
                          <div
                            className={`p-4 flex justify-between items-center border-b border-slate-100 ${c.light}`}
                          >
                            <span className={`font-black text-lg ${c.text}`}>
                              میز {order.table_number}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 font-mono bg-white px-2 py-1 rounded-md border border-slate-100">
                              #{order.order_number} | {order.time_created}
                            </span>
                          </div>
                          <div className="p-4 space-y-3 flex-1 min-h-[120px]">
                            {order.items.map((item, idx) => (
                              <div
                                key={item.id}
                                className={`flex flex-col gap-1 ${idx !== order.items.length - 1 ? "border-b border-slate-100 pb-3" : ""}`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-slate-800 text-[13px] font-black leading-tight pr-1">
                                    {item.product_name}
                                  </span>
                                  <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-md text-xs border border-slate-200 shrink-0">
                                    x{item.quantity}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[10px] text-rose-500 font-bold bg-rose-50 p-1.5 rounded-lg mr-2 border border-rose-100 inline-block">
                                    یادداشت: {item.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          {canManageStages && (
                            <button
                              type="button"
                              onClick={() =>
                                advanceOrderStatus(order.id, activeStage.id)
                              }
                              className={`w-full py-3.5 font-black transition-all text-[13px] flex justify-center items-center gap-2 border-t ${
                                isLastStage
                                  ? "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
                                  : `${c.light} ${c.hoverBg} hover:text-white ${c.text} ${c.border}`
                              }`}
                            >
                              {isLastStage ? (
                                <>
                                  تحویل شد (بایگانی) <CheckCircle2 size={16} />
                                </>
                              ) : (
                                <>
                                  انتقال به مرحله بعد{" "}
                                  <ChevronRight
                                    size={16}
                                    className="rotate-180"
                                  />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* مودال تنظیمات و ویرایش مراحل پخت */}
      {isSettingsOpen && canManageStages && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                <Settings className="text-orange-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  مدیریت مراحل پخت و پیگیری مشتری
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  این مراحل به صورت زنده در منوی مشتری نمایش داده می‌شوند
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-5 mt-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200">
              {editingStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="bg-slate-50/70 border border-slate-200 p-4 rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-500 flex items-center justify-center shrink-0">
                      {(index + 1).toLocaleString("fa-IR")}
                    </span>

                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) =>
                        handleUpdateStageField(index, "name", e.target.value)
                      }
                      placeholder="عنوان مرحله (مثلاً: در حال آماده‌سازی)"
                      className="flex-1 bg-white border border-slate-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStage(index, -1)}
                        title="انتقال به بالا"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === editingStages.length - 1}
                        onClick={() => handleMoveStage(index, 1)}
                        title="انتقال به پایین"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(index)}
                        title="حذف مرحله"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={stage.description}
                    onChange={(e) =>
                      handleUpdateStageField(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    placeholder="توضیح نمایشی به مشتری (مثلاً: سرآشپز مشغول آماده کردن سفارش شماست)"
                    className="w-full bg-white border border-slate-200 focus:border-orange-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 placeholder:text-slate-400 outline-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      رنگ مرحله:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {colorOptions.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() =>
                            handleUpdateStageField(index, "color", col)
                          }
                          className={`w-6 h-6 rounded-full ${colorMap[col].badge} transition-transform ${
                            stage.color === col
                              ? "scale-110 ring-2 ring-offset-2 ring-slate-800"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddStage}
              className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold flex justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors mb-3 text-sm"
            >
              <Plus size={18} strokeWidth={3} /> افزودن مرحله جدید
            </button>

            <button
              type="button"
              disabled={isSavingStages}
              onClick={saveStages}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isSavingStages ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Check size={20} /> ذخیره و اعمال در منو و آشپزخانه
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default KitchenPanel;
