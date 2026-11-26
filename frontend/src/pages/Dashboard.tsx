import { useState, useEffect } from "react";
import {
  Store,
  DollarSign,
  ShoppingBag,
  QrCode,
  Lock,
  Loader2,
  User,
  CheckCircle2,
  ArrowLeft,
  Settings,
  Package,
  Activity,
  ExternalLink,
  Clock,
  ChefHat,
  BellRing,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { authApi, venuesApi, ordersApi } from "../service/api";

export const Dashboard = () => {
  const [userName, setUserName] = useState(
    localStorage.getItem("user_name") &&
      localStorage.getItem("user_name") !== "null"
      ? localStorage.getItem("user_name")!
      : "کاربر عزیز",
  );
  const [role, setRole] = useState(localStorage.getItem("role") || "owner");

  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [hasVenue, setHasVenue] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);

  // آمارهای مالی و عملیاتی
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [totalReceivedSales, setTotalReceivedSales] = useState(0);
  const [totalReceivedCount, setTotalReceivedCount] = useState(0);
  const [paidSales, setPaidSales] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const todayDate = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const rawRes = await authApi.getDashboardStatus();
        const statusData = rawRes?.data?.data || rawRes?.data || rawRes;

        if (statusData) {
          if (statusData.name) {
            setUserName(statusData.name);
            localStorage.setItem("user_name", statusData.name);
          }

          const serverRole = String(statusData.role || role).toLowerCase();
          setRole(serverRole);
          localStorage.setItem("role", serverRole);

          const serverProfileDone = statusData.hasContact === true;
          const serverVenueExists = statusData.hasRestaurant === true;

          setIsProfileComplete(serverProfileDone);
          setHasVenue(serverVenueExists);

          if (
            serverRole === "owner" &&
            (!serverProfileDone || !serverVenueExists)
          ) {
            setIsLoading(false);
            return;
          }

          if (serverVenueExists) {
            try {
              const venueInfoRes = await venuesApi.getMyVenue();
              const vData =
                venueInfoRes?.data?.data || venueInfoRes?.data || venueInfoRes;

              if (vData && (vData.name || vData.Name)) {
                setVenueData({
                  name: vData.name || vData.Name || "رستوران من",
                  english_name: vData.slug || vData.Slug || "menu",
                  status: vData.status || vData.Status || "approved",
                  table_count:
                    vData.tableCount ??
                    vData.TableCount ??
                    vData.table_count ??
                    0,
                });
                setTodaySales(Number(vData.todaySales || 0));
                setTodayOrdersCount(Number(vData.todayOrdersCount || 0));
                setTotalReceivedSales(Number(vData.totalSales || 0));
                setTotalReceivedCount(Number(vData.totalOrdersCount || 0));
                setPaidSales(Number(vData.paidSales || 0));
                setActiveOrdersCount(Number(vData.activeOrdersCount || 0));
              } else {
                setHasVenue(false);
              }
            } catch (venueError) {
              console.warn("⚠️ خطا در دریافت مشخصات رستوران:", venueError);
            }
          }
        }
      } catch (error: any) {
        console.warn("⚠️ خطا در API داشبورد:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // بروزرسانی زنده آمار مالی و سفارشات با WebSocket
  useEffect(() => {
    if (role.toLowerCase() !== "owner" || !hasVenue) return;
    if (!ordersApi?.getKitchenWsUrl) return;

    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      ws = new WebSocket(ordersApi.getKitchenWsUrl());
      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg?.event === "order_created" && msg?.data) {
            const amount = Number(
              msg.data.totalPrice ?? msg.data.total_price ?? 0,
            );
            setTodaySales((prev) => prev + amount);
            setTodayOrdersCount((prev) => prev + 1);
            setTotalReceivedSales((prev) => prev + amount);
            setTotalReceivedCount((prev) => prev + 1);
            setActiveOrdersCount((prev) => prev + 1);
          } else if (msg?.event === "order_completed") {
            setActiveOrdersCount((prev) => Math.max(0, prev - 1));
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
  }, [role, hasVenue]);

  const venueStatus = venueData?.status;
  const isApproved =
    String(venueStatus).toLowerCase() === "approved" ||
    String(venueStatus) === "1";

  const kpis = [
    {
      title: "فروش امروز",
      value: todaySales.toLocaleString("fa-IR"),
      suffix: "تومان",
      subtext: `${todayOrdersCount.toLocaleString("fa-IR")} سفارش ثبت‌شده امروز`,
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-50 md:bg-orange-100",
    },
    {
      title: "مجموع مالی سفارشات",
      value: totalReceivedSales.toLocaleString("fa-IR"),
      suffix: "تومان",
      subtext: `${totalReceivedCount.toLocaleString("fa-IR")} سفارش | تسویه‌شده: ${paidSales.toLocaleString("fa-IR")}`,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50 md:bg-emerald-100",
    },
    {
      title: "سفارش فعال",
      value: activeOrdersCount.toLocaleString("fa-IR"),
      suffix: "سفارش",
      subtext: "در صف آماده‌سازی و تحویل",
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-50 md:bg-blue-100",
    },
    {
      title: "تعداد میزها",
      value: (venueData?.table_count || 0).toLocaleString("fa-IR"),
      suffix: "میز",
      subtext: "ظرفیت ثبت‌شده سالن",
      icon: QrCode,
      color: "text-amber-500",
      bg: "bg-amber-50 md:bg-amber-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  // =======================
  // داشبورد صندوق‌دار
  // =======================
  if (role.toLowerCase() === "cashier") {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] relative font-sans px-4 py-8 md:p-10 max-w-[1200px] mx-auto pb-28 lg:pb-12"
        dir="rtl"
      >
        <header className="mb-8">
          <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
            سلام {userName}، خسته نباشید! 👋
          </h1>
          <p className="text-slate-500 text-[13px] md:text-sm font-bold">
            {todayDate} — داشبورد اختصاصی صندوق‌دار
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Link
            to="/kitchen"
            className="bg-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:border-orange-200 hover:shadow-lg transition-all flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 text-orange-500 rounded-[20px] md:rounded-3xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner mb-4">
              <ShoppingBag
                size={32}
                strokeWidth={2.5}
                className="md:w-10 md:h-10"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
              صندوق، سفارشات و فروش
            </h2>
            <p className="text-[12px] md:text-sm text-slate-500 font-bold max-w-[260px] leading-relaxed">
              مشاهده سفارشات دریافتی، تسویه صندوق و گزارش حسابداری
            </p>
          </Link>
          <Link
            to="/inventory"
            className="bg-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 text-emerald-500 rounded-[20px] md:rounded-3xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner mb-4">
              <Package
                size={32}
                strokeWidth={2.5}
                className="md:w-10 md:h-10"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
              انبارداری و موجودی
            </h2>
            <p className="text-[12px] md:text-sm text-slate-500 font-bold max-w-[260px] leading-relaxed">
              مدیریت اتمام موجودی غذاها و کنترل منو
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // =======================
  // داشبورد گارسون (بدون دسترسی به بارکد میزها)
  // =======================
  if (role.toLowerCase() === "waiter") {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] relative font-sans px-4 py-8 md:p-10 max-w-[1200px] mx-auto pb-28 lg:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
        dir="rtl"
      >
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
              سلام {userName}، خسته نباشید! 👋
            </h1>
            <p className="text-slate-500 text-[13px] md:text-sm font-bold">
              {todayDate} — داشبورد اختصاصی گارسون
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/70 shadow-2xs self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-700">
              متصل به سالن و میزها
            </span>
          </div>
        </header>

        <Link
          to="/kitchen"
          className="bg-white p-8 md:p-12 rounded-[28px] md:rounded-[36px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:border-orange-200 hover:shadow-lg transition-all flex flex-col items-center text-center group"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-50 text-orange-500 rounded-[24px] md:rounded-[28px] flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner mb-5">
            <BellRing size={38} strokeWidth={2.5} className="md:w-11 md:h-11" />
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-800 mb-2">
            درخواست‌های سالن و میزها
          </h2>
          <p className="text-[13px] md:text-sm text-slate-500 font-bold max-w-[320px] leading-relaxed mb-6">
            مشاهده زنده اعلان‌های احضار گارسون از میزها و ثبت مراجعه
          </p>
          <span className="bg-orange-500 group-hover:bg-orange-600 text-white px-7 py-3 rounded-2xl font-black text-xs md:text-sm shadow-md shadow-orange-500/20 flex items-center gap-2 transition-colors">
            مشاهده درخواست‌های میزها <ArrowLeft size={16} />
          </span>
        </Link>
      </div>
    );
  }

  // =======================
  // داشبورد آشپزخانه
  // =======================
  if (role.toLowerCase() === "kitchen") {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] relative font-sans px-4 py-8 md:p-10 max-w-[1200px] mx-auto pb-28 lg:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
        dir="rtl"
      >
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
              سلام سرآشپز {userName}، خسته نباشید! 👋
            </h1>
            <p className="text-slate-500 text-[13px] md:text-sm font-bold">
              {todayDate} — داشبورد اختصاصی مدیریت پخت و آشپزخانه
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/70 shadow-2xs self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-700">
              ترمینال سفارشات آماده است
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Link
            to="/kitchen"
            className="bg-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:border-orange-200 hover:shadow-lg transition-all flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 text-orange-500 rounded-[20px] md:rounded-3xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner mb-4">
              <ChefHat
                size={32}
                strokeWidth={2.5}
                className="md:w-10 md:h-10"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
              سفارشات دریافتی و مراحل پخت
            </h2>
            <p className="text-[12px] md:text-sm text-slate-500 font-bold max-w-[270px] leading-relaxed mb-5">
              مشاهده لحظه‌ای سفارشات، مدیریت مراحل پخت و اعلام آمادگی غذاها
            </p>
            <span className="bg-orange-500 group-hover:bg-orange-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs md:text-sm shadow-md shadow-orange-500/20 flex items-center gap-2 transition-colors">
              ورود به ترمینال آشپزخانه <ArrowLeft size={16} />
            </span>
          </Link>

          <Link
            to="/kitchen"
            className="bg-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:border-amber-200 hover:shadow-lg transition-all flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 text-amber-500 rounded-[20px] md:rounded-3xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner mb-4">
              <BellRing
                size={32}
                strokeWidth={2.5}
                className="md:w-10 md:h-10"
              />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">
              درخواست‌های سرآشپز از میزها
            </h2>
            <p className="text-[12px] md:text-sm text-slate-500 font-bold max-w-[270px] leading-relaxed mb-5">
              مشاهده پیام‌ها و توضیحات اختصاصی مشتریان برای سرآشپز و مراجعه به
              میز
            </p>
            <span className="bg-slate-900 group-hover:bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-black text-xs md:text-sm shadow-md shadow-slate-900/15 flex items-center gap-2 transition-colors">
              مشاهده درخواست‌ها <ArrowLeft size={16} />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // =======================
  // اجبار به راه‌اندازی مجموعه (Onboarding - فقط مدیر)
  // =======================
  if (role.toLowerCase() === "owner" && (!isProfileComplete || !hasVenue)) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] relative flex items-center justify-center px-4 py-10 pb-28 lg:pb-10 overflow-hidden"
        dir="rtl"
      >
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-400/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-amber-300/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 bg-white/70 backdrop-blur-2xl border border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[36px] md:rounded-[48px] p-6 md:p-12 w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-[26px] md:text-4xl font-black text-slate-900 mb-2 md:mb-3 tracking-tight">
              به <span className="text-orange-500">ترنج</span> خوش آمدید!
            </h1>
            <p className="text-slate-500 text-[13px] md:text-[15px] font-bold">
              برای دسترسی به پنل مدیریت، ابتدا اطلاعات زیر را تکمیل کنید:
            </p>
          </div>

          <div className="space-y-4 md:space-y-5">
            <div
              className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5 p-5 md:p-6 rounded-[24px] md:rounded-[32px] transition-all duration-300 border ${isProfileComplete ? "bg-emerald-50/60 border-emerald-100/50" : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.06)]"}`}
            >
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[20px] flex items-center justify-center shrink-0 border shadow-inner ${isProfileComplete ? "bg-emerald-100 text-emerald-500 border-emerald-200" : "bg-orange-50 text-orange-500 border-orange-100"}`}
              >
                {isProfileComplete ? (
                  <CheckCircle2
                    size={24}
                    className="md:w-8 md:h-8"
                    strokeWidth={2.5}
                  />
                ) : (
                  <User size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] md:text-xs font-black px-2 py-0.5 rounded-lg ${isProfileComplete ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
                  >
                    قدم اول
                  </span>
                  <h3 className="text-[16px] md:text-lg font-black text-slate-800 tracking-tight">
                    تکمیل اطلاعات حساب
                  </h3>
                </div>
                <p className="text-slate-500 text-[12px] md:text-[14px] font-bold leading-relaxed">
                  نام و مشخصات تماس خود را ثبت کنید.
                </p>
              </div>
              <div className="shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
                {isProfileComplete ? (
                  <div className="w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-[13px] md:text-sm bg-emerald-500/10 text-emerald-600 text-center border border-emerald-500/20">
                    تکمیل شده
                  </div>
                ) : (
                  <Link
                    to="/complete-profile"
                    className="w-full sm:w-auto px-6 py-3 md:py-3.5 rounded-2xl font-black text-[13px] md:text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                  >
                    تکمیل اطلاعات <ArrowLeft size={18} />
                  </Link>
                )}
              </div>
            </div>

            <div
              className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 md:gap-5 p-5 md:p-6 rounded-[24px] md:rounded-[32px] transition-all duration-300 border ${!isProfileComplete ? "bg-slate-100/50 border-slate-200/50 opacity-70 grayscale-[30%]" : hasVenue ? "bg-emerald-50/60 border-emerald-100/50" : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.06)]"}`}
            >
              {!isProfileComplete && <div className="absolute inset-0 z-10" />}
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[20px] flex items-center justify-center shrink-0 border shadow-inner ${!isProfileComplete ? "bg-slate-200 text-slate-400 border-slate-300" : hasVenue ? "bg-emerald-100 text-emerald-500 border-emerald-200" : "bg-orange-50 text-orange-500 border-orange-100"}`}
              >
                {!isProfileComplete ? (
                  <Lock size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
                ) : hasVenue ? (
                  <CheckCircle2
                    size={24}
                    className="md:w-8 md:h-8"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Store
                    size={24}
                    className="md:w-8 md:h-8"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] md:text-xs font-black px-2 py-0.5 rounded-lg ${!isProfileComplete ? "bg-slate-200 text-slate-500" : hasVenue ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
                  >
                    قدم دوم
                  </span>
                  <h3 className="text-[16px] md:text-lg font-black text-slate-800 tracking-tight">
                    راه‌اندازی مجموعه
                  </h3>
                </div>
                <p className="text-slate-500 text-[12px] md:text-[14px] font-bold leading-relaxed">
                  برای ساخت منوی دیجیتال، رستوران خود را ثبت کنید.
                </p>
              </div>
              <div className="shrink-0 mt-3 sm:mt-0 w-full sm:w-auto relative z-20">
                {!isProfileComplete ? (
                  <button
                    disabled
                    className="w-full sm:w-auto px-6 py-3 md:py-3.5 rounded-2xl font-black text-[13px] md:text-sm bg-slate-200 text-slate-400 flex items-center justify-center gap-2"
                  >
                    قفل شده <Lock size={16} strokeWidth={2.5} />
                  </button>
                ) : hasVenue ? (
                  <div className="w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-[13px] md:text-sm bg-emerald-500/10 text-emerald-600 text-center border border-emerald-500/20">
                    تکمیل شده
                  </div>
                ) : (
                  <Link
                    to="/setup-venue"
                    className="w-full sm:w-auto px-6 py-3 md:py-3.5 rounded-2xl font-black text-[13px] md:text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                  >
                    ثبت مجموعه <ArrowLeft size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =======================
  // داشبورد اصلی مدیر (Owner) با مجموعه فعال
  // =======================
  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative overflow-x-hidden font-sans pb-28 lg:pb-12"
      dir="rtl"
    >
      <div className="relative z-10 px-4 py-6 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-6 md:mb-10 flex flex-col gap-1 md:gap-2">
          <h1 className="text-[22px] md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            سلام {userName}، روز بخیر! 👋
          </h1>
          <p className="text-slate-500 text-[12px] md:text-[14px] font-bold">
            {todayDate}
          </p>
        </header>

        {/* ویجت‌های آمار (فروش امروز + مجموع مالی سفارشات + سفارش فعال + میزها) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="bg-white/85 backdrop-blur-xl p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <p className="text-slate-400 text-[11px] md:text-[13px] font-black mb-1 tracking-wide">
                    {kpi.title}
                  </p>
                  <div className="flex items-baseline gap-1 md:gap-1.5 flex-wrap">
                    <span className="text-[18px] md:text-[24px] xl:text-[26px] font-black text-slate-800 tracking-tight">
                      {kpi.value}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-slate-400 font-bold">
                      {kpi.suffix}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-11 h-11 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] flex items-center justify-center shrink-0 shadow-inner ${kpi.bg} ${kpi.color}`}
                >
                  <kpi.icon
                    className="w-5 h-5 md:w-[26px] md:h-[26px]"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              {kpi.subtext && (
                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 pt-2.5 border-t border-slate-100/80 truncate">
                  {kpi.subtext}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* کارت مجموعه */}
          <div className="group relative bg-white/90 backdrop-blur-xl p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-10 relative z-10">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-[18px] md:rounded-[20px] flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Store className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[18px] md:text-2xl font-black text-slate-900 mb-0.5 md:mb-1.5 tracking-tight line-clamp-1">
                    {venueData?.name || "در حال دریافت..."}
                  </h3>
                  <p className="text-slate-500 text-[12px] md:text-[14px] font-black dir-ltr text-right opacity-80 line-clamp-1">
                    toranjmenu.ir/{venueData?.english_name || "..."}
                  </p>
                </div>
              </div>
              <div
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-[14px] text-[10px] md:text-[12px] font-black flex items-center gap-1.5 shrink-0 ${isApproved ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
              >
                {isApproved ? (
                  <CheckCircle2 size={14} className="md:w-4 md:h-4" />
                ) : (
                  <Clock size={14} className="md:w-4 md:h-4" />
                )}
                {isApproved ? "تایید شده" : "در حال بررسی"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-100/80">
              <a
                href={`https://toranjmenu.ir/${venueData?.english_name || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white px-3 md:px-5 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] font-black text-[12px] md:text-[14px] flex items-center justify-center gap-1.5 md:gap-2.5 transition-all active:scale-95 shadow-sm"
              >
                <ExternalLink
                  size={16}
                  className="md:w-5 md:h-5"
                  strokeWidth={2.5}
                />{" "}
                مشاهده منو
              </a>
              <Link
                to="/venue-settings"
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 md:px-5 py-3.5 md:py-4 rounded-[18px] md:rounded-[20px] font-black text-[12px] md:text-[14px] flex items-center justify-center gap-1.5 md:gap-2.5 transition-all active:scale-95 border border-slate-200/50"
              >
                <Settings
                  size={16}
                  className="md:w-5 md:h-5"
                  strokeWidth={2.5}
                />{" "}
                تنظیمات مجموعه
              </Link>
            </div>
          </div>

          {/* کارت سفارشات زنده */}
          <Link
            to="/kitchen"
            className="group relative bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-[40px] -z-10 group-hover:bg-emerald-400/30 transition-colors duration-500" />
            <div className="flex items-start justify-between mb-8 md:mb-10">
              <div>
                <h3 className="text-[20px] md:text-2xl font-black text-white mb-1.5 flex items-center gap-2.5 tracking-tight">
                  سفارشات زنده
                  <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-slate-400 text-[12px] md:text-sm font-bold">
                  مدیریت سفارشات در حال پردازش
                </p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 text-white rounded-[16px] md:rounded-[20px] flex items-center justify-center backdrop-blur-md border border-white/5 shadow-inner">
                <Activity
                  size={24}
                  className="md:w-7 md:h-7"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-5 md:pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {activeOrdersCount.toLocaleString("fa-IR")}
                </span>
                <span className="text-slate-400 text-[12px] md:text-sm font-bold mt-1">
                  سفارش فعال
                </span>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[16px] bg-white/10 group-hover:bg-emerald-500 text-white flex items-center justify-center transition-all duration-300">
                <ArrowLeft
                  size={18}
                  className="md:w-5 md:h-5"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
