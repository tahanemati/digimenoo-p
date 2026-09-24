import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  Flame,
  Volume2,
  VolumeX,
  Wallet,
  Receipt,
  Loader2,
  Settings,
  Plus,
  Trash2,
  X,
  GripVertical,
  LayoutList,
  Check,
  BellRing,
  ChefHat,
} from "lucide-react";

import { ordersApi } from "../service/api";

// =======================
// انواع داده‌ها
// =======================
type PaymentMethod = "online" | "cashier";
type PaymentStatus = "paid" | "pending";

type OrderItem = { id: number; product_name: string; quantity: number };
type Order = {
  id: number;
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
  color: string;
};

// 🔴 تایپ درخواست میز
type TableCall = {
  id: number;
  table_number: string;
  call_type: "waiter" | "chef";
  is_resolved: boolean;
  time_created: string;
};

// پالت رنگی مراحل
const colorMap: Record<string, any> = {
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    badge: "bg-amber-500",
    light: "bg-amber-500/10",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    badge: "bg-blue-500",
    light: "bg-blue-500/10",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    badge: "bg-emerald-500",
    light: "bg-emerald-500/10",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
    badge: "bg-purple-500",
    light: "bg-purple-500/10",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    badge: "bg-rose-500",
    light: "bg-rose-500/10",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
    badge: "bg-indigo-500",
    light: "bg-indigo-500/10",
  },
};

export const KitchenPanel = () => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [calls, setCalls] = useState<TableCall[]>([]); // 🔴 استیت درخواست‌های میز

  const [isLoading, setIsLoading] = useState(true);
  const [venueSlug, setVenueSlug] = useState("");
  const [activeTab, setActiveTab] = useState<string>("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingStages, setEditingStages] = useState<Stage[]>([]);
  const [isSavingStages, setIsSavingStages] = useState(false);

  const audioRef = useRef(
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg",
    ),
  );

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

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getKitchenOrders();
      setVenueSlug(data.venue_slug);
      setStages(data.stages);
      setEditingStages(data.stages);
      setOrders(data.orders);
      setCalls(data.calls || []);

      if (data.stages.length > 0 && !activeTab) {
        setActiveTab(String(data.stages[0].id));
      }
    } catch (error) {
      console.error("خطا در دریافت سفارشات:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔴 اتصال زنده از طریق WebSocket
  useEffect(() => {
    if (!venueSlug) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${venueSlug}/`);

    ws.onmessage = (event) => {
      const res = JSON.parse(event.data);

      // آپدیت وضعیت سفارشات
      if (res.type === "order_update") {
        const updatedOrder = res.order;
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === updatedOrder.id);
          if (
            !exists &&
            updatedOrder.status === (stages[0]?.id || "new") &&
            soundEnabled
          ) {
            audioRef.current.play().catch(() => {});
          }
          if (updatedOrder.is_archived)
            return prev.filter((o) => o.id !== updatedOrder.id);
          if (exists)
            return prev.map((o) =>
              o.id === updatedOrder.id ? updatedOrder : o,
            );
          return [...prev, updatedOrder];
        });
      }

      // 🔴 آپدیت درخواست‌های میز
      if (res.type === "call_update") {
        const updatedCall = res.call;
        setCalls((prev) => {
          const exists = prev.find((c) => c.id === updatedCall.id);
          if (!exists && !updatedCall.is_resolved && soundEnabled) {
            audioRef.current.play().catch(() => {}); // زنگ هشدار
          }
          if (updatedCall.is_resolved)
            return prev.filter((c) => c.id !== updatedCall.id);
          if (exists)
            return prev.map((c) => (c.id === updatedCall.id ? updatedCall : c));
          return [updatedCall, ...prev];
        });
      }
    };

    return () => ws.close();
  }, [venueSlug, stages, soundEnabled]);

  const advanceOrderStatus = async (orderId: number, currentStatus: string) => {
    try {
      const currentIndex = stages.findIndex(
        (s) => String(s.id) === currentStatus,
      );
      if (currentIndex === stages.length - 1) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        const nextStatus = stages[currentIndex + 1].id;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: String(nextStatus) } : o,
          ),
        );
      }
      await ordersApi.advanceOrder(orderId);
    } catch (err) {
      fetchOrders();
    }
  };

  const settlePayment = async (orderId: number) => {
    try {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: "paid" } : o,
        ),
      );
      await ordersApi.payOrder(orderId);
    } catch (err) {
      fetchOrders();
    }
  };

  // 🔴 هندل کردن رفع درخواست میز
  const handleResolveCall = async (callId: number) => {
    try {
      setCalls((prev) => prev.filter((c) => c.id !== callId));
      if (ordersApi.resolveCall) {
        await ordersApi.resolveCall(callId);
      }
    } catch (err) {
      fetchOrders();
    }
  };

  const handleAddStage = () => {
    const colors = ["purple", "rose", "indigo", "amber", "blue", "emerald"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newStage: Stage = {
      id: `new_${Date.now()}`,
      name: "مرحله جدید",
      color: randomColor,
    };
    setEditingStages([...editingStages, newStage]);
  };

  const handleUpdateStage = (index: number, newName: string) => {
    const updated = [...editingStages];
    updated[index].name = newName;
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
      if (ordersApi.updateStages) {
        await ordersApi.updateStages(editingStages);
      }
      await fetchOrders();
      setIsSettingsOpen(false);
    } catch (error) {
      alert("خطا در ذخیره مراحل");
    } finally {
      setIsSavingStages(false);
    }
  };

  const pendingCashierOrders = orders.filter(
    (o) => o.payment_method === "cashier" && o.payment_status === "pending",
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-slate-100 flex flex-col p-4 md:p-6 overflow-hidden font-sans text-slate-800"
      dir="rtl"
    >
      {/* هدر */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white border border-slate-200 shadow-sm rounded-[24px] p-4 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-colors"
          >
            <ChevronRight size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-800">
              ترمینال سفارشات
            </h1>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black rounded-lg flex items-center gap-1.5 uppercase shadow-sm">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>{" "}
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingStages(stages);
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Settings size={18} /> مدیریت مراحل
          </button>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-xl shadow-sm">
            <Clock size={18} className="text-orange-400" />
            <span
              className="text-white font-black font-mono text-[15px]"
              dir="ltr"
            >
              {currentTime}
            </span>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) audioRef.current.play().catch(() => {});
            }}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-sm ${soundEnabled ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-slate-50 border-slate-200 text-slate-400"}`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 🔴 معماری Tabbed Grid با اضافه شدن بخش اعلان‌های اضطراری */}
      {/* ======================================================== */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* ستون راست (اعلان‌ها + صندوق) */}
        <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 overflow-hidden">
          {/* 🔴 پنل اعلان‌ها (فقط وقتی درخواستی باشه ظاهر میشه) */}
          {calls.length > 0 && (
            <div className="shrink-0 max-h-[40%] flex flex-col bg-rose-950 border border-rose-900 shadow-xl shadow-rose-900/10 rounded-[32px] overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-rose-500"></div>

              <div className="shrink-0 p-4 bg-rose-900/30 border-b border-rose-900/50 flex justify-between items-center relative z-10">
                <h2 className="text-[15px] font-black text-white flex items-center gap-2">
                  <BellRing
                    size={18}
                    className="text-orange-400 animate-pulse"
                  />{" "}
                  اعلان‌های میز
                </h2>
                <span className="bg-rose-500 text-white font-black px-2 py-0.5 rounded-lg text-xs shadow-md">
                  {calls.length} درخواست
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-rose-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-rose-900/40 border border-rose-800 rounded-2xl p-3 flex justify-between items-center animate-in slide-in-from-right-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-800/50 rounded-xl flex items-center justify-center text-orange-300">
                        {call.call_type === "chef" ? (
                          <ChefHat size={20} />
                        ) : (
                          <BellRing size={20} />
                        )}
                      </div>
                      <div>
                        <span className="text-white font-black block text-sm">
                          میز {call.table_number}
                        </span>
                        <span className="text-[10px] text-rose-300 font-bold">
                          درخواست{" "}
                          {call.call_type === "chef" ? "آشپز" : "گارسون"} (
                          {call.time_created})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveCall(call.id)}
                      className="bg-rose-500 hover:bg-rose-600 text-white w-9 h-9 rounded-xl flex justify-center items-center transition-colors"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* پنل صندوق */}
          <div className="flex-1 flex flex-col bg-slate-900 border-2 border-slate-800 shadow-2xl shadow-slate-900/20 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <div className="shrink-0 p-5 bg-slate-800/40 border-b border-slate-700 flex justify-between items-center backdrop-blur-sm relative z-10">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Wallet size={20} className="text-emerald-400" /> تسویه صندوق
              </h2>
              <span className="bg-emerald-500 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md">
                {pendingCashierOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              {pendingCashierOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-slate-400">
                  <Wallet
                    size={56}
                    className="mb-4 opacity-30 text-emerald-500"
                  />
                  <p className="text-sm font-bold">تسویه نشده‌ای وجود ندارد</p>
                </div>
              ) : (
                pendingCashierOrders.map((order) => (
                  <div
                    key={`cashier-${order.id}`}
                    className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col gap-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700/50 border border-slate-600 rounded-xl flex items-center justify-center text-slate-300">
                          <Receipt size={22} />
                        </div>
                        <div>
                          <span className="text-white font-black block text-[16px]">
                            {order.table_number}
                          </span>
                          <span className="text-[12px] text-slate-400 font-bold font-mono">
                            فیش #{order.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center shadow-inner">
                      <span className="text-sm text-slate-400 font-bold">
                        مبلغ فاکتور:
                      </span>
                      <span className="text-emerald-400 font-black text-xl">
                        {parseInt(order.total_price).toLocaleString("fa-IR")}{" "}
                        <span className="text-xs text-emerald-600 font-bold">
                          تومان
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => settlePayment(order.id)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black transition-all shadow-md shadow-emerald-500/20 text-sm flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 size={20} /> تایید دریافت وجه
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ستون چپ: تب‌ها و گرید مراحل پخت */}
        <div className="flex-1 min-w-0 flex flex-col gap-5 overflow-hidden">
          {/* نوار تب‌ها (Tab Navigation) */}
          <div
            className="shrink-0 flex items-center gap-2 overflow-x-auto p-2 bg-white rounded-[24px] shadow-sm border border-slate-200 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {stages.map((stage) => {
              const isActive = activeTab === String(stage.id);
              const c = colorMap[stage.color] || colorMap["amber"];
              const stageOrdersCount = orders.filter(
                (o) => String(o.status) === String(stage.id),
              ).length;

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveTab(String(stage.id))}
                  className={`flex items-center gap-2 px-5 py-3 rounded-[16px] font-black text-sm transition-all whitespace-nowrap border-2 ${
                    isActive
                      ? `${c.bg} ${c.text}${c.border}`
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

          {/* شبکه فیش‌های غذا (Grid) */}
          <div className="flex-1 overflow-y-auto pb-4 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                stages[stages.length - 1]?.id === activeStage.id;

              if (stageOrders.length === 0) {
                return (
                  <div className="h-full flex flex-col items-center justify-center opacity-40 text-slate-400">
                    <CheckCircle2 size={64} className="mb-4 opacity-30" />
                    <p className="font-bold text-lg">
                      هیچ فیشی در این مرحله وجود ندارد
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-max">
                  {stageOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 shadow-sm rounded-[24px] flex flex-col overflow-hidden animate-in zoom-in-95 group hover:shadow-md transition-all"
                    >
                      <div
                        className={`p-4 flex justify-between items-center border-b border-slate-100 ${c.light}`}
                      >
                        <span className={`font-black text-lg ${c.text}`}>
                          {order.table_number}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                          #{order.id} | {order.time_created}
                        </span>
                      </div>

                      <div className="px-5 py-4 space-y-3 flex-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`flex justify-between items-center ${idx !== order.items.length - 1 ? "border-b border-slate-100 pb-3" : ""}`}
                          >
                            <span className="text-slate-700 text-sm font-bold leading-tight">
                              {item.product_name}
                            </span>
                            <span className="bg-slate-100 text-slate-600 font-black px-2.5 py-1 rounded-lg text-xs border border-slate-200 shrink-0">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          advanceOrderStatus(order.id, activeStage.id)
                        }
                        className={`w-full py-4 font-black transition-all text-sm flex justify-center items-center gap-2 border-t ${isLastStage ? "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200" : `${c.light} hover:${c.badge} hover:text-white ${c.text}${c.border}`}`}
                      >
                        {isLastStage ? (
                          <>
                            تحویل شد (بایگانی) <CheckCircle2 size={18} />
                          </>
                        ) : (
                          <>
                            انتقال به مرحله بعد{" "}
                            <ChevronRight size={18} className="rotate-180" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* مودال ویرایش مراحل */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-md shadow-2xl relative flex flex-col animate-in zoom-in-95 max-h-[90vh]">
            <button
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
                  مراحل داینامیک پخت
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  ویژه کاربران اشتراک پلاس 🌟 (۷ روز رایگان)
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 mt-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {editingStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 bg-white shadow-sm border border-slate-200 p-3 rounded-2xl focus-within:border-orange-300"
                >
                  <div className="text-slate-300">
                    <GripVertical size={18} />
                  </div>
                  <div
                    className={`w-3 h-10 rounded-full shrink-0 ${colorMap[stage.color]?.bg || "bg-slate-100"} ${colorMap[stage.color]?.border || "border-slate-200"} border`}
                  ></div>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleUpdateStage(index, e.target.value)}
                    className="flex-1 bg-transparent border-none px-2 py-2 text-sm font-bold text-slate-800 outline-none w-full"
                  />
                  <button
                    onClick={() => handleDeleteStage(index)}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddStage}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold flex justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 mb-4"
            >
              <Plus size={18} strokeWidth={3} /> افزودن مرحله جدید
            </button>
            <button
              disabled={isSavingStages}
              onClick={saveStages}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex justify-center gap-2"
            >
              {isSavingStages ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Check size={20} /> ذخیره
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenPanel;
