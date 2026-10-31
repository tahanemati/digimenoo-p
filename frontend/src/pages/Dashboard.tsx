import { useState, useEffect } from "react";
import {
  Bell,
  Store,
  Users,
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
  ChefHat,
  ChevronLeft,
  Activity,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
// 🔴 venuesApi اضافه شد تا بتونیم اطلاعات دقیق رستوران رو بخونیم
import { authApi, venuesApi } from "../service/api";

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
  const localUserName = localStorage.getItem("user_name");

  const isProfileDoneLocally =
    !!localUserName &&
    localUserName.trim() !== "" &&
    localUserName !== "null" &&
    localUserName !== "undefined";

  const isVenueDoneLocally = localStorage.getItem("has_venue") === "true";

  const [userName, setUserName] = useState(localUserName || "کاربر عزیز");
  const [role, setRole] = useState(localStorage.getItem("role") || "owner");

  const [isProfileComplete, setIsProfileComplete] =
    useState<boolean>(isProfileDoneLocally);
  const [hasVenue, setHasVenue] = useState<boolean>(isVenueDoneLocally);
  const [hasVenueSettings, setHasVenueSettings] = useState<boolean>(false);
  const [hasMenuContent, setHasMenuContent] = useState<boolean>(false);

  const todayDate = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);

  // آمارهای زنده
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [liveViews, setLiveViews] = useState(0);

  useEffect(() => {
    let statsInterval: NodeJS.Timeout;

    const fetchDashboardData = async () => {
      try {
        const rawRes = await authApi.getDashboardStatus();
        const statusRes = rawRes.data || rawRes;

        setRole(statusRes.role || statusRes.Role || "owner");
        setUserName(
          statusRes.name ||
            statusRes.Name ||
            statusRes.firstName ||
            statusRes.FirstName ||
            localUserName ||
            "همکار عزیز",
        );

        setIsProfileComplete(
          statusRes.is_profile_complete === true ||
            statusRes.isProfileComplete === true ||
            statusRes.IsProfileComplete === true ||
            isProfileDoneLocally,
        );

        const venueExists =
          statusRes.has_venue === true ||
          statusRes.hasVenue === true ||
          statusRes.HasVenue === true ||
          isVenueDoneLocally;

        setHasVenue(venueExists);

        setHasMenuContent(
          statusRes.has_menu_content ??
            statusRes.hasMenuContent ??
            statusRes.HasMenuContent ??
            false,
        );
        setHasVenueSettings(
          statusRes.has_venue_settings ??
            statusRes.hasVenueSettings ??
            statusRes.HasVenueSettings ??
            false,
        );

        if (venueExists) {
          // 🔴 تغییر مهم: اگر رستوران ثبت شده بود، میریم از API مشخصات کامل (نام و اسلاگ) رو می‌گیریم
          try {
            const venueInfoRes = await venuesApi.getMyVenue();
            const vData = venueInfoRes.data || venueInfoRes;

            setVenueData({
              name: vData.name || vData.Name || "رستوران من",
              english_name: vData.slug || vData.Slug || "menu", // 🔴 اسلاگ کاربر مستقیماً اینجا نشست
              status: vData.status || vData.Status || "approved",
              table_count:
                vData.tableCount || vData.TableCount || vData.table_count || 0,
            });

            const currentStatus = vData.status || vData.Status || "approved";
            if (currentStatus === "approved" || currentStatus === "Approved") {
              const fetchRealStats = async () => {
                setLiveOrders([]);
                setTotalSales(0);
                setActiveOrdersCount(0);
                setLiveViews(0);
              };

              await fetchRealStats();
              statsInterval = setInterval(fetchRealStats, 10000);
            }
          } catch (venueError) {
            console.warn(
              "⚠️ نتوانستیم مشخصات دقیق رستوران (اسلاگ) را بگیریم:",
              venueError,
            );
            // بک‌آپ روی اطلاعات استاتوس در صورت قطعی API دوم
            setVenueData({
              name: statusRes.venue_name || "رستوران من",
              english_name: statusRes.venue_english_name || "menu",
              status: "approved",
              table_count: 0,
            });
          }
        }
      } catch (error: any) {
        console.warn("⚠️ API وضعیت داشبورد ارور داد:", error.message);
        setIsProfileComplete(isProfileDoneLocally);
        setHasVenue(isVenueDoneLocally);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [isProfileDoneLocally, isVenueDoneLocally]);

  const venueStatus = venueData?.status;
  const isApproved = venueStatus === "approved" || venueStatus === "Approved";

  const kpis = [
    {
      title: "فروش امروز",
      value: isApproved ? totalSales.toLocaleString("fa-IR") : "۰",
      suffix: "تومان",
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
    {
      title: "سفارشات فعال",
      value: isApproved ? activeOrdersCount.toLocaleString("fa-IR") : "۰",
      suffix: "سفارش",
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      title: "بازدید زنده منو",
      value: isApproved ? liveViews.toLocaleString("fa-IR") : "۰",
      suffix: "نفر",
      icon: Users,
      color: "text-rose-500",
      bg: "bg-rose-100",
    },
    {
      title: "میزهای مجموعه",
      value: isApproved
        ? (venueData?.table_count || 0).toLocaleString("fa-IR")
        : "۰",
      suffix: "میز",
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
  if (role === "cashier" || role === "Cashier") {
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
  if (role === "kitchen" || role === "Kitchen") {
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
  if (role === "waiter" || role === "Waiter") {
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
  // 🔴 داشبورد اصلی مدیر (Owner) - حالت Onboarding
  // =======================
  if (!isProfileComplete || !hasVenue) {
    return (
      <div
        className="min-h-screen bg-slate-50 relative flex items-center justify-center p-6 overflow-hidden"
        dir="rtl"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-[40px] p-8 md:p-12 max-w-2xl w-full flex flex-col animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">
              به <span className="text-orange-500">دیجی‌منو</span> خوش آمدید!
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              برای دسترسی به داشبورد و ابزارهای مدیریت، این دو قدم را تکمیل
              کنید:
            </p>
          </div>

          <div className="space-y-4">
            <div
              className={`relative overflow-hidden flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-[28px] border transition-all duration-300 ${isProfileComplete ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.08)]"}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${isProfileComplete ? "bg-emerald-100 text-emerald-500 border-emerald-200" : "bg-orange-50 text-orange-500 border-orange-100"}`}
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
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${isProfileComplete ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
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
              className={`relative overflow-hidden flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-[28px] border transition-all duration-300 ${!isProfileComplete ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale-[50%]" : hasVenue ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.08)]"}`}
            >
              {!isProfileComplete && <div className="absolute inset-0 z-10" />}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${!isProfileComplete ? "bg-slate-100 text-slate-400 border-slate-200" : hasVenue ? "bg-emerald-100 text-emerald-500 border-emerald-200" : "bg-orange-50 text-orange-500 border-orange-100"}`}
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
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${!isProfileComplete ? "bg-slate-200 text-slate-500" : hasVenue ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
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

  // =======================
  // 🔴 نمای کامل داشبورد برای مدیر
  // =======================
  return (
    <div
      className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-12"
      dir="rtl"
    >
      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tight">
              سلام {userName}، روز بخیر! 👋
            </h1>
            <p className="text-slate-500 text-sm font-medium">{todayDate}</p>
          </div>
        </header>

        {/* بخش کارت‌های آمار */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}
              >
                <kpi.icon size={28} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold mb-1">
                  {kpi.title}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-800">
                    {kpi.value}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {kpi.suffix}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔴 کارت‌های اصلی داشبورد */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* کارت ۱: مجموعه من (نمایش اطلاعات و لینک‌ها) */}
          <div className="group relative bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/40 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-start justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Store size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1.5 tracking-tight">
                    {venueData?.name || "در حال دریافت..."}
                  </h3>
                  <p className="text-slate-500 text-[15px] font-bold dir-ltr text-right">
                    digimenoo.ir/{venueData?.english_name || "..."}
                  </p>
                </div>
              </div>

              <div
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 ${
                  isApproved
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                {isApproved ? "تایید شده" : "در حال بررسی"}
              </div>
            </div>

            {/* دکمه‌های عملیاتی برای رستوران */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100/80">
              <a
                href={`https://digimenoo.ir/${venueData?.english_name || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white px-5 py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-colors shadow-sm"
              >
                <ExternalLink size={20} /> مشاهده منو
              </a>
              <Link
                to="/venue-settings"
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-colors border border-slate-200/60"
              >
                <Settings size={20} /> تنظیمات مجموعه
              </Link>
            </div>
          </div>

          {/* کارت ۲: سفارشات زنده */}
          <Link
            to="/orders"
            className="group relative bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-lg shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] -z-10 group-hover:bg-emerald-500/20 transition-colors duration-500" />

            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                  سفارشات زنده
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-slate-400 text-sm font-medium">
                  مدیریت و پیگیری سفارشات در حال پردازش
                </p>
              </div>

              <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Activity size={32} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-white">
                  {activeOrdersCount.toLocaleString("fa-IR")}
                </span>
                <span className="text-slate-400 font-medium">سفارش فعال</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-emerald-500 text-white flex items-center justify-center transition-colors">
                <ArrowLeft size={20} />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
