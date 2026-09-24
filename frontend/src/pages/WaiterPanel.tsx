import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellRing,
  CheckCircle2,
  Clock,
  LogOut,
  User,
  Loader2,
  Coffee,
  AlertTriangle,
} from "lucide-react";
import { ordersApi } from "../service/api";

type TableCall = {
  id: number;
  table_number: string;
  call_type: "waiter" | "chef";
  is_resolved: boolean;
  time_created: string;
};

export const WaiterPanel = () => {
  const [calls, setCalls] = useState<TableCall[]>([]);
  const [venueSlug, setVenueSlug] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<any>("");
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const navigate = useNavigate();
  const audioRef = useRef(
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/dinner_bell_triangle.ogg",
    ),
  );

  // آپدیت ساعت زنده
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // دریافت اطلاعات رستوران و درخواست‌های فعلی
  const fetchWaiterData = async () => {
    try {
      const data = await ordersApi.getWaiterDashboard();
      setVenueSlug(data.venue_slug);
      setCalls(data.calls || []);
    } catch (error: any) {
      console.error("خطا در دریافت اطلاعات داشبورد گارسون:", error);
      // 🔴 استخراج ارور دقیق سرور
      if (error.detail) {
        setErrorMsg(`[خطای احراز هویت/دسترسی]: ${error.detail}`);
      } else if (error.error) {
        setErrorMsg(`[خطای بک‌اند]: ${error.error}`);
      } else {
        setErrorMsg(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiterData();
  }, []);

  // 🔴 اتصال زنده (WebSocket) برای دریافت آنی درخواست‌ها
  useEffect(() => {
    if (!venueSlug) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${venueSlug}/`);

    ws.onmessage = (event) => {
      const res = JSON.parse(event.data);

      if (res.type === "call_update") {
        const updatedCall = res.call;

        // گارسون فقط باید درخواست‌های گارسون رو ببینه نه آشپز رو!
        if (updatedCall.call_type !== "waiter") return;

        setCalls((prev) => {
          const exists = prev.find((c) => c.id === updatedCall.id);

          // پخش زنگ برای درخواست جدید
          if (!exists && !updatedCall.is_resolved) {
            audioRef.current
              .play()
              .catch(() => console.log("Audio play blocked by browser"));
          }

          // اگر انجام شده بود پاک کن
          if (updatedCall.is_resolved)
            return prev.filter((c) => c.id !== updatedCall.id);

          // اگر جدید بود اضافه کن بالا
          if (exists)
            return prev.map((c) => (c.id === updatedCall.id ? updatedCall : c));
          return [updatedCall, ...prev];
        });
      }
    };

    return () => ws.close();
  }, [venueSlug]);

  // انجام دادن درخواست
  const handleResolveCall = async (callId: number) => {
    try {
      // آپدیت سریع (Optimistic) برای تجربه کاربری بهتر
      setCalls((prev) => prev.filter((c) => c.id !== callId));
      if (ordersApi.resolveCall) {
        await ordersApi.resolveCall(callId);
      }
    } catch (error) {
      console.error("خطا در تایید درخواست:", error);
      fetchWaiterData(); // در صورت خطا، دیتا رو از سرور دوباره بگیر
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    navigate("/login"); // یا هر مسیری که لاگین پرسنل هست
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // 🔴 هندل کردن ارور واقعی سرور به جای متن ثابت
  if (errorMsg) {
    return (
      <div
        className="min-h-screen bg-slate-100 flex justify-center items-center p-6"
        dir="rtl"
      >
        <div className="bg-white max-w-sm w-full rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-3">
            پیغام خطای واقعی:
          </h2>

          {/* باکس نمایش ارور واقعی */}
          <div
            className="bg-rose-100 text-rose-700 p-4 rounded-xl font-mono text-sm font-bold w-full mb-8 text-left break-words"
            dir="ltr"
          >
            {typeof errorMsg === "object"
              ? JSON.stringify(errorMsg, null, 2)
              : String(errorMsg)}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} /> بازگشت به لاگین
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-800"
      dir="rtl"
    >
      {/* عرض محدود برای شبیه‌سازی اپلیکیشن موبایل */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl flex flex-col relative overflow-hidden">
        {/* هدر */}
        <div className="bg-blue-600 rounded-b-[32px] pt-6 pb-8 px-6 shadow-lg shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>

          <div className="flex justify-between items-center relative z-10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white border border-white/20">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-white font-black text-lg">پنل گارسون</h1>
                <div className="flex items-center gap-1.5 text-blue-100 text-xs font-bold mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  آنلاین و آماده
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-black/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2">
              <BellRing className="text-blue-200" size={20} />
              <span className="text-white font-bold text-sm">
                درخواست‌های باز:
              </span>
            </div>
            <span className="bg-white text-blue-600 font-black px-3 py-1 rounded-lg shadow-sm text-sm">
              {calls.length}
            </span>
          </div>
        </div>

        {/* لیست درخواست‌ها */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {calls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 text-slate-400 mt-20">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Coffee size={40} className="text-slate-400" />
              </div>
              <h2 className="text-lg font-black text-slate-600 mb-1">
                همه چیز آرومه!
              </h2>
              <p className="text-sm font-bold">
                فعلاً درخواستی از میزها ندارید.
              </p>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="bg-white border border-blue-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-in slide-in-from-bottom-4"
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>

                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">
                      میز {call.table_number}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Clock size={14} /> ارسال شده در {call.time_created}
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                    <BellRing size={24} className="animate-pulse" />
                  </div>
                </div>

                <button
                  onClick={() => handleResolveCall(call.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md shadow-blue-500/20 flex justify-center items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 size={20} /> مراجعه کردم (انجام شد)
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterPanel;
