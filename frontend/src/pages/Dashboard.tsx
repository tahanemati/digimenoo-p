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
  User,
  CheckCircle2,
  ArrowLeft,
  LayoutList,
  ChevronLeft,
  Settings,
  Package, // 🔴 اضافه شد
  ChefHat, // 🔴 اضافه شد
} from "lucide-react";
import { Link } from "react-router-dom";
import { authApi, kitchenApi } from "../service/api";

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
  // 🔴 نام و نقش حالا به صورت داینامیک از بک‌اند گرفته می‌شوند
  const [userName, setUserName] = useState("کاربر عزیز");
  const [role, setRole] = useState("owner");

  const todayDate = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);

  // ==========================================
  // استیت‌های مربوط به وضعیت حساب کاربری
  // ==========================================
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [hasVenue, setHasVenue] = useState<boolean>(false);
  const [hasVenueSettings, setHasVenueSettings] = useState<boolean>(false);
  const [hasMenuContent, setHasMenuContent] = useState<boolean>(false);

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [liveViews, setLiveViews] = useState(12);

  useEffect(() => {
    let ordersInterval: NodeJS.Timeout;

    const fetchDashboardData = async () => {
      try {
        const statusRes = await authApi.getDashboardStatus();

        // 🔴 ذخیره نقش و نام از بک‌‌اند
        setRole(statusRes.role || "owner");
        setUserName(statusRes.name || "همکار عزیز");

        setIsProfileComplete(statusRes.is_profile_complete);
        setHasVenue(statusRes.has_venue);
        setHasMenuContent(statusRes.has_menu_content);
        setHasVenueSettings(statusRes.has_venue_settings || false);

        if (statusRes.has_venue) {
          setVenueData({
            name: statusRes.venue_name,
            english_name: statusRes.venue_english_name,
            status: statusRes.venue_status,
            table_count: statusRes.table_count,
          });

          if (statusRes.venue_status === "approved") {
            const fetchLiveOrders = async () => {
              try {
                const ordersRes = await kitchenApi.getOrders();
                if (Array.isArray(ordersRes)) {
                  setLiveOrders(ordersRes);
                  const sales = ordersRes.reduce(
                    (sum: number, order: Order) =>
                      sum + parseInt(order.total_price || "0"),
                    0,
                  );
                  setTotalSales(sales);
                } else {
                  setLiveOrders([]);
                }
              } catch (e) {
                console.error("خطا در آپدیت زنده سفارشات", e);
                setLiveOrders([]);
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
        return "bg-amber-100 text-amber-600 border-amber-200";
      case "preparing":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "ready":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const kpis = [
    {
      title: "فروش امروز",
      value: isApproved ? totalSales.toLocaleString("fa-IR") : "۰",
      suffix: "تومان",
      trend: isApproved ? "+۱۲٪ نسبت به دیروز" : "۰٪",
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-100",
      trendUp: true,
      isLive: isApproved,
    },
    {
      title: "سفارشات فعال",
      value: isApproved ? liveOrders.length.toLocaleString("fa-IR") : "۰",
      suffix: "سفارش",
      trend: isApproved ? "در حال پردازش در آشپزخانه" : "۰٪",
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-100",
      trendUp: true,
    },
    {
      title: "بازدید زنده منو",
      value: isApproved ? liveViews.toLocaleString("fa-IR") : "۰",
      suffix: "نفر",
      trend: isApproved ? "همین الان آنلاین هستند" : "-",
      icon: Users,
      color: "text-rose-500",
      bg: "bg-rose-100",
      isLive: isApproved,
    },
    {
      title: "میزهای مجموعه",
      value: isApproved
        ? (venueData?.table_count || 0).toLocaleString("fa-IR")
        : "۰",
      suffix: "میز",
      trend: isApproved ? "آماده دریافت سفارش" : "-",
      icon: QrCode,
      color: "text-amber-500",
      bg: "bg-amber-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  // =======================
  // 🔴 داشبورد اختصاصی صندوق‌دار
  // =======================
  if (role === "cashier") {
    return (
      <div
        className="min-h-screen bg-slate-50 relative font-sans p-6 md:p-10 max-w-[1200px] mx-auto"
        dir="rtl"
      >
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
            سلام {userName}، خسته نباشید! 👋
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            داشبورد اختصاصی صندوق‌داری و مدیریت سفارشات
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/orders"
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:border-orange-300 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 text-center group"
          >
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <ShoppingBag size={40} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              صندوق و سفارشات
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-xs">
              مشاهده فروش امروز، تایید سفارشات جدید و چاپ فاکتور مشتریان
            </p>
          </Link>

          <Link
            to="/inventory"
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 text-center group"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Package size={40} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              انبارداری و موجودی
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-xs">
              مدیریت اتمام موجودی غذاها در منو و کنترل مواد اولیه
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // =======================
  // 🔴 داشبورد اختصاصی آشپزخانه
  // =======================
  if (role === "kitchen") {
    return (
      <div
        className="min-h-screen bg-slate-50 relative font-sans p-6 md:p-10 max-w-[800px] mx-auto text-center"
        dir="rtl"
      >
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm mt-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ChefHat size={48} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            سلام {userName}!
          </h1>
          <p className="text-slate-500 font-medium mb-8">
            به پنل مدیریت سفارشات آشپزخانه خوش آمدید.
          </p>
          <Link
            to="/kitchen"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-1"
          >
            ورود به پنل زنده آشپزخانه (KDS) <ArrowLeft size={20} />
          </Link>
        </div>
      </div>
    );
  }

  // =======================
  // 🔴 داشبورد اختصاصی گارسون
  // =======================
  if (role === "waiter") {
    return (
      <div
        className="min-h-screen bg-slate-50 relative font-sans p-6 md:p-10 max-w-[800px] mx-auto text-center"
        dir="rtl"
      >
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm mt-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Bell size={48} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            خسته نباشید {userName}!
          </h1>
          <p className="text-slate-500 font-medium mb-8">
            برای مشاهده درخواست‌های مشتریان وارد پنل شوید.
          </p>
          <Link
            to="/waiter"
            className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 hover:-translate-y-1"
          >
            مدیریت میزها و درخواست‌ها <ArrowLeft size={20} />
          </Link>
        </div>
      </div>
    );
  }

  // =======================
  // 🔴 داشبورد اصلی (مختص مدیر کل - Owner)
  // =======================

  // نمای حالت Onboarding (فقط برای مدیر تا ثبت رستوران)
  if (!isProfileComplete || !hasVenue) {
    return (
      <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-[40px] p-8 md:p-12 max-w-2xl w-full flex flex-col animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">
              به <span className="text-orange-500">MenuJet</span> خوش آمدید!
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              برای دسترسی به داشبورد و ابزارهای مدیریت، این دو قدم را تکمیل
              کنید:
            </p>
          </div>

          <div className="space-y-4">
            <div
              className={`relative overflow-hidden flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-[28px] border transition-all duration-300 ${
                isProfileComplete
                  ? "bg-emerald-50/50 border-emerald-100"
                  : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.08)]"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isProfileComplete
                    ? "bg-emerald-100 text-emerald-500 border-emerald-200"
                    : "bg-orange-50 text-orange-500 border-orange-100"
                }`}
              >
                {isProfileComplete ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <User size={28} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isProfileComplete
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    قدم اول
                  </span>
                  <h3 className="text-lg font-black text-slate-800">
                    تکمیل اطلاعات حساب
                  </h3>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  برای امنیت بیشتر و شناسایی در سیستم، نام و رمز عبور خود را ثبت
                  کنید.
                </p>
              </div>

              <div className="shrink-0 mt-2 md:mt-0">
                {isProfileComplete ? (
                  <div className="px-5 py-2.5 rounded-xl font-bold text-sm bg-transparent text-emerald-500 flex items-center gap-1.5">
                    تکمیل شده
                  </div>
                ) : (
                  <Link
                    to="/complete-profile"
                    className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5"
                  >
                    تکمیل اطلاعات <ArrowLeft size={16} />
                  </Link>
                )}
              </div>
            </div>

            <div
              className={`relative overflow-hidden flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-[28px] border transition-all duration-300 ${
                !isProfileComplete
                  ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale-[50%]"
                  : hasVenue
                    ? "bg-emerald-50/50 border-emerald-100"
                    : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.08)]"
              }`}
            >
              {!isProfileComplete && <div className="absolute inset-0 z-10" />}

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  !isProfileComplete
                    ? "bg-slate-100 text-slate-400 border-slate-200"
                    : hasVenue
                      ? "bg-emerald-100 text-emerald-500 border-emerald-200"
                      : "bg-orange-50 text-orange-500 border-orange-100"
                }`}
              >
                {!isProfileComplete ? (
                  <Lock size={24} />
                ) : hasVenue ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <Store size={28} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      !isProfileComplete
                        ? "bg-slate-200 text-slate-500"
                        : hasVenue
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    قدم دوم
                  </span>
                  <h3 className="text-lg font-black text-slate-800">
                    ثبت مجموعه و شعبه
                  </h3>
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  آدرس و مشخصات رستوران یا کافه خود را برای ایجاد دامنه اختصاصی
                  وارد کنید.
                </p>
              </div>

              <div className="shrink-0 mt-2 md:mt-0 relative z-20">
                {!isProfileComplete ? (
                  <button
                    disabled
                    className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-slate-200 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    قفل شده <Lock size={16} />
                  </button>
                ) : hasVenue ? (
                  <div className="px-5 py-2.5 rounded-xl font-bold text-sm bg-transparent text-emerald-500 flex items-center gap-1.5">
                    تکمیل شده
                  </div>
                ) : (
                  <Link
                    to="/setup-venue"
                    className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5"
                  >
                    راه‌اندازی مجموعه <ArrowLeft size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // نمای کامل داشبورد برای مدیر
  return (
    <div
      className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto">
        {isApproved && (
          <>
            {!hasVenueSettings ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 md:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="bg-white shadow-sm text-blue-500 p-3 rounded-2xl shrink-0 border border-blue-100">
                    <Settings size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg mb-1">
                      تنظیمات منوی شما کامل نیست!
                    </h3>
                    <p className="text-sm font-medium text-slate-600">
                      ابتدا درباره مجموعه بنویسید، دسترسی‌ها را تعیین کرده و
                      قالب و لوگوی خود را انتخاب کنید.
                    </p>
                  </div>
                </div>
                <Link
                  to="/venue-settings"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto hover:-translate-y-0.5"
                >
                  <Settings size={18} strokeWidth={3} /> تکمیل تنظیمات
                </Link>
              </div>
            ) : (
              !hasMenuContent && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-5 md:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="bg-white shadow-sm text-orange-500 p-3 rounded-2xl shrink-0 border border-orange-100">
                      <LayoutList size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg mb-1">
                        منوی شما هنوز خالی است!
                      </h3>
                      <p className="text-sm font-medium text-slate-600">
                        برای شروع دریافت سفارش و نمایش غذاها به مشتریان،
                        دسته‌بندی‌ها و محصولات خود را اضافه کنید.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/products"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto hover:-translate-y-0.5"
                  >
                    <Plus size={18} strokeWidth={3} /> افزودن محصولات به منو
                  </Link>
                </div>
              )
            )}
          </>
        )}

        {venueStatus === "pending" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 mb-8 flex items-center gap-4 shadow-sm">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-0.5">
                در انتظار تایید کارشناسان
              </h3>
              <p className="text-xs font-medium opacity-80">
                اطلاعات رستوران شما در حال بررسی است. داشبورد به زودی کاملاً
                فعال می‌شود.
              </p>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">
              سلام {userName}، روز بخیر! 👋
            </h1>
            <p className="text-slate-500 text-sm font-medium">{todayDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="جستجو..."
                className="bg-white border border-slate-200 text-slate-700 rounded-2xl py-2.5 pr-11 pl-4 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all w-64 shadow-sm"
              />
            </div>
            <button className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all relative shadow-sm hover:shadow">
              <Bell size={20} />
              {isApproved && liveOrders.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)] border-2 border-white"></span>
              )}
            </button>
          </div>
        </header>

        <div className="relative">
          {!isApproved && (
            <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 pb-4 px-4 bg-slate-50/40 backdrop-blur-md rounded-[32px]">
              <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[32px] p-8 md:p-12 text-center max-w-md w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div
                  className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 border-2 ${isRejected ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-amber-50 border-amber-100 text-amber-500"}`}
                >
                  {isRejected ? <AlertCircle size={36} /> : <Lock size={36} />}
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3">
                  {isRejected ? "نیاز به بررسی مجدد" : "داشبورد موقتاً قفل است"}
                </h2>
                <p className="text-slate-500 leading-relaxed mb-8 font-medium text-sm">
                  {isRejected
                    ? "متاسفانه اطلاعات مجموعه‌ی شما تایید نشد. می‌توانید با ثبت اطلاعات صحیح، مجدداً درخواست دهید."
                    : "رستوران شما در صف بررسی است. پس از تایید نهایی، تمام آمارها و ابزارها اینجا فعال خواهند شد."}
                </p>

                {isRejected && (
                  <Link
                    to="/setup-venue"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 w-full flex items-center justify-center gap-2"
                  >
                    <Plus size={20} strokeWidth={3} /> ثبت درخواست جدید
                  </Link>
                )}
              </div>
            </div>
          )}

          <div
            className={`transition-all duration-700 ${!isApproved ? "opacity-40 blur-[8px] pointer-events-none select-none grayscale-[30%]" : ""}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-5 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  {kpi.isLive && (
                    <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-70 animate-pulse"></div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${kpi.bg} ${kpi.color} shadow-inner`}
                    >
                      <kpi.icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/50">
                      {kpi.isLive && (
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping mr-0.5"></span>
                      )}
                      {kpi.trend}
                    </div>
                  </div>
                  <h3 className="text-slate-500 text-xs font-bold mb-1">
                    {kpi.title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {kpi.value}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {kpi.suffix}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-base font-black text-slate-800">
                    مجموعه من
                  </h3>
                </div>
                <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[28px] p-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                      <Store size={26} className="text-slate-700" />
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> تایید شده
                    </span>
                  </div>

                  <h4 className="text-xl font-black text-slate-800 mb-1">
                    {venueData?.name || "بدون نام"}
                  </h4>
                  <p className="text-sm text-slate-500 mb-8 dir-ltr text-right font-mono font-bold bg-slate-100/50 inline-block px-3 py-1 rounded-lg self-start border border-slate-200">
                    menujet.ir/{venueData?.english_name || "..."}
                  </p>

                  <div className="flex flex-col gap-3 mt-auto">
                    <a
                      href={`/${venueData?.english_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 flex justify-center items-center gap-2 shadow-sm"
                    >
                      مشاهده منوی زنده <ExternalLink size={16} />
                    </a>
                    <Link
                      to="/venue-settings"
                      className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all text-center bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
                    >
                      تنظیمات و برندینگ
                    </Link>
                    <Link
                      to="/products"
                      className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all text-center bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
                    >
                      مدیریت محصولات منو
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Clock className="text-orange-500" size={18} /> سفارشات زنده
                    آشپزخانه
                  </h3>
                  {liveOrders.length > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                      در حال بروزرسانی
                    </span>
                  )}
                </div>

                <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[28px] p-6 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.3] pointer-events-none"></div>

                  <div className="space-y-3 flex-1 relative z-10">
                    {liveOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-100 p-4 rounded-[20px] hover:border-orange-200 transition-colors cursor-pointer shadow-sm group"
                      >
                        <div className="flex justify-between items-center mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                              {order.table_number}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {order.time_created}
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                            #{order.id}
                          </span>
                        </div>

                        <p className="text-[13px] font-bold text-slate-700 mb-3 truncate group-hover:text-slate-900 transition-colors">
                          {(order.items || []).map((i) => (
                            <span
                              key={i.id}
                              className="inline-block bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 ml-1.5 mb-1"
                            >
                              <span className="text-orange-500">
                                {i.quantity}x
                              </span>{" "}
                              {i.product_name}
                            </span>
                          ))}
                        </p>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100/80">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                          <span className="text-sm font-black text-slate-800 font-mono">
                            {(parseInt(order.total_price) || 0).toLocaleString(
                              "fa-IR",
                            )}{" "}
                            <span className="text-[10px] font-bold text-slate-400 font-sans">
                              تومان
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {liveOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full py-12 opacity-60">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <ShoppingBag size={28} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                          در حال حاضر سفارش فعالی وجود ندارد
                        </p>
                      </div>
                    )}

                    {liveOrders.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          و {liveOrders.length - 3} سفارش دیگر...
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/kitchen"
                    className="w-full mt-4 py-3.5 text-[13px] font-bold transition-all bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:text-orange-600 hover:border-orange-200 shadow-sm relative z-10"
                  >
                    انتقال به پنل تخصصی آشپزخانه{" "}
                    <ChevronLeft size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
