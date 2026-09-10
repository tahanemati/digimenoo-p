import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { kitchenApi } from "../service/api";
import {
  ChevronRight,
  BellRing,
  Clock,
  ChefHat,
  CheckCircle2,
  Flame,
  Volume2,
  VolumeX,
  Timer,
  Wallet,
  Receipt,
  Loader2,
  CreditCard,
} from "lucide-react";

type OrderStatus = "new" | "preparing" | "ready" | "delivered";
type PaymentMethod = "online" | "cashier";
type PaymentStatus = "paid" | "pending";

type OrderItem = { id: number; product_name: string; quantity: number };
type Order = {
  id: number;
  table_number: string;
  time_created: string;
  total_price: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  items: OrderItem[];
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
  const [isLoading, setIsLoading] = useState(true);

  const prevNewOrdersCount = useRef(0);
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
      const data = await kitchenApi.getOrders();
      const newOrdersCount = data.filter(
        (o: Order) => o.status === "new",
      ).length;

      // پخش زنگ فقط در صورت دریافت فیش جدید
      if (newOrdersCount > prevNewOrdersCount.current && soundEnabled) {
        audioRef.current
          .play()
          .catch((e) => console.log("مشکل در پخش صدا:", e));
      }
      prevNewOrdersCount.current = newOrdersCount;
      setOrders(data);
    } catch (err) {
      console.error("خطا در دریافت لیست سفارشات", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const advanceOrderStatus = async (
    orderId: number,
    currentStatus: OrderStatus,
  ) => {
    let nextStatus = currentStatus;
    if (currentStatus === "new") nextStatus = "preparing";
    else if (currentStatus === "preparing") nextStatus = "ready";

    // آپدیت درجا (Optimistic Update)
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: nextStatus as OrderStatus } : o,
      ),
    );

    try {
      await kitchenApi.updateOrderStatus(orderId, { status: nextStatus });
    } catch (err) {
      console.error(err);
      fetchOrders(); // بازگردانی وضعیت در صورت خطا
    }
  };

  const archiveOrder = async (orderId: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    try {
      await kitchenApi.updateOrderStatus(orderId, { status: "delivered" });
    } catch (err) {
      console.error(err);
    }
  };

  const settlePayment = async (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, payment_status: "paid" } : o,
      ),
    );
    try {
      await kitchenApi.updateOrderStatus(orderId, { payment_status: "paid" });
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCashierOrders = orders.filter(
    (o) => o.payment_method === "cashier" && o.payment_status === "pending",
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    // بدنه قفل شده به ارتفاع صفحه نمایش (بدون اسکرول شدن کل صفحه)
    <div className="h-screen bg-[#050505] flex flex-col p-4 md:p-6 overflow-hidden">
      {/* هدر جمع و جور و مینیمال */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-white">ترمینال سفارشات</h1>
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] font-black rounded-md border border-rose-500/20 flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>{" "}
              Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-4 py-2 rounded-xl">
            <Clock size={16} className="text-emerald-400" />
            <span className="text-white font-black font-mono text-sm" dir="ltr">
              {currentTime}
            </span>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) audioRef.current.play().catch(() => {});
            }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${soundEnabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/40 border-white/5 text-slate-500"}`}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* گرید منعطف با اسکرول داخلی برای هر ستون */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* =======================
            ستون ۱: سفارشات جدید
        ======================= */}
        <div className="flex flex-col bg-[#0A0A0A] border border-amber-500/10 rounded-[24px] overflow-hidden">
          <div className="shrink-0 p-4 bg-amber-500/5 border-b border-amber-500/10 flex justify-between items-center">
            <h2 className="text-base font-black text-amber-500 flex items-center gap-2">
              <BellRing size={18} /> جدید
            </h2>
            <span className="bg-amber-500 text-gray-950 font-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {orders.filter((o) => o.status === "new").length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {orders
              .filter((o) => o.status === "new")
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-[#121212] border border-amber-500/20 rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-2"
                >
                  <div className="p-3 bg-white/[0.02] flex justify-between items-center border-b border-white/5">
                    <span className="text-amber-400 font-black text-lg">
                      {order.table_number}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      #{order.id} | {order.time_created}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2 flex-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center ${idx !== order.items.length - 1 ? "border-b border-white/5 pb-2" : ""}`}
                      >
                        <span className="text-slate-200 text-sm font-medium">
                          {item.product_name}
                        </span>
                        <span className="bg-white/10 text-white font-black px-2 py-0.5 rounded text-xs">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => advanceOrderStatus(order.id, "new")}
                    className="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 py-3 font-black transition-colors text-sm flex justify-center items-center gap-2 border-t border-amber-500/20"
                  >
                    <ChefHat size={16} /> شروع پخت
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* =======================
            ستون ۲: در حال پخت
        ======================= */}
        <div className="flex flex-col bg-[#0A0A0A] border border-blue-500/10 rounded-[24px] overflow-hidden">
          <div className="shrink-0 p-4 bg-blue-500/5 border-b border-blue-500/10 flex justify-between items-center">
            <h2 className="text-base font-black text-blue-500 flex items-center gap-2">
              <Flame size={18} /> در حال پخت
            </h2>
            <span className="bg-blue-500 text-white font-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {orders.filter((o) => o.status === "preparing").length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {orders
              .filter((o) => o.status === "preparing")
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-[#121212] border border-blue-500/20 rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
                >
                  <div className="p-3 bg-white/[0.02] flex justify-between items-center border-b border-white/5">
                    <span className="text-blue-400 font-black text-lg">
                      {order.table_number}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      #{order.id} | {order.time_created}
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2 flex-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`flex justify-between items-center ${idx !== order.items.length - 1 ? "border-b border-white/5 pb-2" : ""}`}
                      >
                        <span className="text-slate-300 text-sm font-medium line-through decoration-slate-600">
                          {item.product_name}
                        </span>
                        <span className="text-slate-400 font-black text-xs">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => advanceOrderStatus(order.id, "preparing")}
                    className="w-full bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-500 py-3 font-black transition-colors text-sm flex justify-center items-center gap-2 border-t border-blue-500/20"
                  >
                    <CheckCircle2 size={16} /> آماده شد
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* =======================
            ستون ۳: آماده تحویل
        ======================= */}
        <div className="flex flex-col bg-[#0A0A0A] border border-emerald-500/10 rounded-[24px] overflow-hidden">
          <div className="shrink-0 p-4 bg-emerald-500/5 border-b border-emerald-500/10 flex justify-between items-center">
            <h2 className="text-base font-black text-emerald-500 flex items-center gap-2">
              <CheckCircle2 size={18} /> آماده تحویل
            </h2>
            <span className="bg-emerald-500 text-gray-950 font-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {orders.filter((o) => o.status === "ready").length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {orders
              .filter((o) => o.status === "ready")
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-[#121212] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-3 animate-in zoom-in-95 text-center"
                >
                  <span className="text-emerald-400 font-black text-2xl">
                    {order.table_number}
                  </span>
                  <span className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded-md">
                    فیش #{order.id}
                  </span>
                  <button
                    onClick={() => archiveOrder(order.id)}
                    className="w-full bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/5 text-slate-300 py-2.5 rounded-xl font-bold transition-colors text-xs mt-2"
                  >
                    تحویل گارسون شد (بایگانی)
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* =======================
            ستون ۴: صندوق
        ======================= */}
        <div className="flex flex-col bg-[#0A0A0A] border border-purple-500/10 rounded-[24px] overflow-hidden">
          <div className="shrink-0 p-4 bg-purple-500/5 border-b border-purple-500/10 flex justify-between items-center">
            <h2 className="text-base font-black text-purple-400 flex items-center gap-2">
              <Wallet size={18} /> لیست صندوق
            </h2>
            <span className="bg-purple-500 text-white font-black w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {pendingCashierOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {pendingCashierOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-purple-400">
                <Wallet size={40} className="mb-2" />
                <p className="text-xs font-bold">تسویه نشده‌ای وجود ندارد</p>
              </div>
            ) : (
              pendingCashierOrders.map((order) => (
                <div
                  key={`cashier-${order.id}`}
                  className="bg-[#121212] border border-purple-500/30 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                        <Receipt size={16} />
                      </div>
                      <div>
                        <span className="text-white font-black block text-sm">
                          {order.table_number}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          #{order.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">
                      مبلغ:
                    </span>
                    <span className="text-white font-black text-base">
                      {parseInt(order.total_price).toLocaleString("fa-IR")}{" "}
                      <span className="text-[10px] text-slate-500 font-normal">
                        تومان
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => settlePayment(order.id)}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-white py-2.5 rounded-xl font-bold transition-all text-xs flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> دریافت شد (تسویه)
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
