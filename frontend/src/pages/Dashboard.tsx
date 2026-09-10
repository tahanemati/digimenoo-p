import { useState, useEffect } from "react";
import {
  Plus,
  Bell,
  Search,
  Store,
  Users,
  DollarSign,
  ShoppingBag,
  Clock,
  QrCode,
  AlertTriangle,
  Lock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi, kitchenApi } from "../service/api";

type OrderItem = { id: number; product_name: string; quantity: number };
type Order = {
  id: number;
  table_number: string;
  time_created: string;
  total_price: string;
  status: string;
  items: OrderItem[];
};

export const Dashboard = () => {
  const userName = "مدیر عزیز";
  const todayDate = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);
  const [hasVenue, setHasVenue] = useState<boolean>(false);

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [liveViews, setLiveViews] = useState(12);

  useEffect(() => {
    let ordersInterval: NodeJS.Timeout;

    const fetchDashboardData = async () => {
      try {
        const venueRes = await venuesApi.getMyVenue();
        setHasVenue(venueRes.has_venue);

        if (venueRes.has_venue) {
          setVenueData(venueRes.venue);

          if (venueRes.venue.status === "approved") {
            const fetchLiveOrders = async () => {
              try {
                const ordersRes = await kitchenApi.getOrders();
                setLiveOrders(ordersRes);
                const sales = ordersRes.reduce(
                  (sum: number, order: Order) =>
                    sum + parseInt(order.total_price),
                  0,
                );
                setTotalSales(sales);
              } catch (e) {
                console.error("خطا در آپدیت زنده سفارشات", e);
              }
            };

            await fetchLiveOrders();
            ordersInterval = setInterval(fetchLiveOrders, 5000);
          }
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات داشبورد", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    const viewInterval = setInterval(() => {
      setLiveViews(Math.floor(Math.random() * 10) + 5);
    }, 15000);

    return () => {
      if (ordersInterval) clearInterval(ordersInterval);
      clearInterval(viewInterval);
    };
  }, []);

  const venueStatus = venueData?.status;
  const isApproved = venueStatus === "approved";
  const isRejected = venueStatus === "rejected";

  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "سفارش جدید";
      case "preparing":
        return "در حال پخت";
      case "ready":
        return "آماده تحویل";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-amber-500/10 text-amber-400";
      case "preparing":
        return "bg-blue-500/10 text-blue-400";
      case "ready":
        return "bg-emerald-500/10 text-emerald-400";
      default:
        return "bg-white/10 text-white";
    }
  };

  const kpis = [
    {
      title: "فروش امروز",
      value: isApproved ? totalSales.toLocaleString("fa-IR") : "۰",
      suffix: "تومان",
      trend: isApproved ? "زنده" : "۰٪",
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      isLive: isApproved,
    },
    {
      title: "سفارشات فعال",
      value: isApproved ? liveOrders.length.toLocaleString("fa-IR") : "۰",
      suffix: "سفارش",
      trend: isApproved ? "در حال پردازش" : "۰٪",
      icon: ShoppingBag,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "بازدید زنده منو",
      value: isApproved ? liveViews.toLocaleString("fa-IR") : "۰",
      suffix: "نفر آنلاین",
      trend: isApproved ? "همین الان" : "-",
      icon: Users,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      isLive: isApproved,
    },
    {
      title: "میزهای مجموعه",
      value: isApproved
        ? (venueData?.table_count || 0).toLocaleString("fa-IR")
        : "۰",
      suffix: "میز فعال",
      trend: isApproved ? "آماده سفارش" : "-",
      icon: QrCode,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!hasVenue) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center min-h-[70vh] text-center pb-12">
        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
          <Store size={48} className="text-slate-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          به پنل مدیریت MenuJet خوش آمدید!
        </h1>
        <p className="text-slate-400 text-base md:text-lg mb-10 max-w-lg leading-relaxed">
          شما هنوز هیچ شعبه‌ای ثبت نکرده‌اید. برای شروع درآمدزایی و آنلاین کردن
          منوی رستوران یا کافه خود، اولین شعبه خود را بسازید.
        </p>
        <Link
          to="/setup-venue"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center gap-3 text-lg"
        >
          <Plus size={24} /> راه‌اندازی اولین شعبه
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {venueStatus === "pending" && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="bg-amber-500/20 p-2 rounded-xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-0.5">
              رستوران شما در انتظار تایید است
            </h3>
            <p className="text-xs opacity-80">
              کارشناسان ما در حال بررسی اطلاعات شما هستند. لطفاً شکیبا باشید.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 mb-8 flex items-center gap-4">
          <div className="bg-rose-500/20 p-2 rounded-xl shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-0.5">
              درخواست رستوران شما رد شد
            </h3>
            <p className="text-xs opacity-80">
              اطلاعات شما تایید نشد. می‌توانید یک درخواست جدید ثبت کنید.
            </p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight">
            سلام {userName}، روز بخیر! 👋
          </h1>
          <p className="text-slate-500 text-sm font-medium">{todayDate}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="جستجو..."
              className="bg-black/20 border border-white/5 text-white rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-all w-64 shadow-inner"
            />
          </div>
          <button className="w-11 h-11 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all relative">
            <Bell size={20} />
            {isApproved && liveOrders.length > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
            )}
          </button>
        </div>
      </header>

      <div className="relative">
        {!isApproved && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#030712]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 text-center max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border ${isRejected ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}
              >
                {isRejected ? <AlertCircle size={36} /> : <Lock size={36} />}
              </div>
              <h2 className="text-2xl font-black text-white mb-3">
                {isRejected ? "درخواست شما تایید نشد" : "داشبورد قفل است"}
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                {isRejected
                  ? "متاسفانه اطلاعات مجموعه‌ی شما توسط کارشناسان ما تایید نشد. نگران نباشید! می‌توانید یک درخواست جدید با اطلاعات صحیح ثبت کنید."
                  : "رستوران شما در صف بررسی کارشناسان قرار دارد. پس از تایید نهایی، تمام آمارها و ابزارها اینجا فعال خواهند شد."}
              </p>

              {isRejected && (
                <Link
                  to="/setup-venue"
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-8 py-3.5 rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center gap-3 text-lg w-full justify-center"
                >
                  <Plus size={24} /> ثبت درخواست جدید
                </Link>
              )}
            </div>
          </div>
        )}

        <div
          className={`transition-all duration-700 ${!isApproved ? "opacity-20 blur-[6px] pointer-events-none select-none grayscale" : ""}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-colors"
              >
                {kpi.isLive && (
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50 animate-pulse"></div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}
                  >
                    <kpi.icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">
                    {kpi.isLive && (
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping mr-1"></span>
                    )}
                    {kpi.trend}
                  </div>
                </div>
                <h3 className="text-slate-400 text-sm font-bold mb-1">
                  {kpi.title}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">
                    {kpi.value}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {kpi.suffix}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ستون راست */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white">مجموعه‌های من</h3>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6 hover:bg-white/[0.04] transition-all group">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                    <Store size={24} className="text-emerald-400" />
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    تایید شده
                  </span>
                </div>
                <h4 className="text-xl font-black text-white mb-1">
                  {venueData?.name || "---"}
                </h4>

                <p className="text-sm text-emerald-500/60 mb-6 dir-ltr text-right font-mono font-bold">
                  menujet.ir/{venueData?.english_name}
                </p>

                <div className="flex flex-col gap-3">
                  {/* 🔴 لینک با آدرس‌دهی نسبی اصلاح شد تا روی لوکال‌هاست به درستی کار کند */}
                  <a
                    href={`/${venueData?.english_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex justify-center items-center gap-2"
                  >
                    مشاهده منوی زنده <ExternalLink size={16} />
                  </a>
                  <Link
                    to="/venue-settings"
                    className="w-full py-3.5 rounded-xl text-sm font-bold transition-all text-center bg-white/5 hover:bg-white/10 text-white border border-transparent hover:border-white/10"
                  >
                    مدیریت منو و تنظیمات
                  </Link>
                </div>
              </div>
            </div>

            {/* ستون چپ: سفارشات اخیر واقعی */}
            <div>
              <div className="bg-[#030712] border border-white/10 rounded-[32px] p-6 shadow-2xl relative min-h-[350px] flex flex-col">
                <div className="absolute top-0 right-8 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-b-lg shadow-[0_0_15px_rgba(244,63,94,0.5)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>{" "}
                  Live
                </div>

                <div className="flex justify-between items-center mb-6 mt-2">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock className="text-emerald-400" size={20} /> سفارشات
                    زنده
                  </h3>
                </div>

                <div className="space-y-3 flex-1">
                  {liveOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2 py-1 rounded-lg">
                            {order.table_number}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {order.time_created}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-lg">
                          #{order.id}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-300 mb-3 truncate pr-1">
                        {order.items.map((i) => i.product_name).join("، ")}
                      </p>
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span
                          className={`text-[11px] font-bold px-2 py-1 rounded-md ${getStatusColor(order.status)}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {parseInt(order.total_price).toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px] font-normal text-slate-500 font-sans">
                            تومان
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}

                  {liveOrders.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <ShoppingBag
                        size={32}
                        className="mx-auto mb-3 text-slate-500"
                      />
                      <p className="text-sm font-bold text-slate-400">
                        سفارش فعالی وجود ندارد
                      </p>
                    </div>
                  )}

                  {liveOrders.length > 2 && (
                    <div className="text-center pt-3">
                      <span className="text-xs font-bold text-slate-500">
                        و {liveOrders.length - 2} سفارش دیگر در جریان است...
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  to="/kitchen"
                  className="w-full mt-4 py-3 text-sm font-bold transition-colors bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-center text-slate-400 hover:text-emerald-400"
                >
                  رفتن به پنل آشپزخانه
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
