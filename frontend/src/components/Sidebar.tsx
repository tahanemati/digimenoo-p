import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Headset,
  Users,
  LogOut,
  Utensils,
  Wallet,
  QrCode,
  MoreHorizontal,
  Lock,
  ChefHat,
  BellRing,
  BarChart3,
  CalendarCheck,
  Crown,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../service/api";
import {
  useSubscription,
  type FeatureKey,
  type PlanTier,
} from "../context/SubscriptionContext";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface SidebarProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}

type SidebarSegment = "operations" | "management";

interface SidebarMenuItem {
  id: string;
  path: string;
  name: string;
  icon: any;
  segment: SidebarSegment;
  allowedRoles: string[];
  requiredFeature?: FeatureKey;
  requiredTier?: Exclude<PlanTier, "none">;
  upgradeMessage?: string;
}

const TIER_BADGE_LABELS: Record<Exclude<PlanTier, "none">, string> = {
  basic: "پایه",
  standard: "استاندارد",
  plus: "پلاس",
};

const ToranjLogoMark = ({
  className = "w-10 h-10",
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="14" fill="url(#toranj_sidebar_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_sidebar_grad"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EA580C" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
  </svg>
);

export const Sidebar = ({}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    subscription,
    isLoading: isSubLoading,
    can,
    openUpgradeModal,
  } = useSubscription();

  const initialRole = (localStorage.getItem("role") || "owner").toLowerCase();
  const [role, setRole] = useState(initialRole);
  const [userName, setUserName] = useState(
    localStorage.getItem("user_name") &&
      localStorage.getItem("user_name") !== "null"
      ? localStorage.getItem("user_name")!
      : "همکار عزیز",
  );
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [activeSegment, setActiveSegment] =
    useState<SidebarSegment>("operations");

  const [hasVenue, setHasVenue] = useState(initialRole !== "owner");
  const [mobileWarning, setMobileWarning] = useState<string | null>(null);

  const normalizedRole = role.toLowerCase();

  const menuItems: SidebarMenuItem[] = [
    // تب اول: سالن و سفارشات روزانه
    {
      id: "dashboard",
      path: "/dashboard",
      name: "داشبورد",
      icon: LayoutDashboard,
      segment: "operations",
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"],
    },
    {
      id: "kitchenPanel",
      path: "/kitchen",
      name:
        normalizedRole === "waiter"
          ? "درخواست‌های میزها"
          : normalizedRole === "cashier"
            ? "صندوق و سفارشات"
            : "دریافت سفارشات",
      icon: normalizedRole === "waiter" ? BellRing : ChefHat,
      segment: "operations",
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"],
      requiredFeature: "kitchenPanel",
      requiredTier: "basic",
      upgradeMessage:
        "برای استفاده از پنل زنده آشپزخانه نیاز به اشتراک فعال دارید.",
    },
    {
      id: "reservations",
      path: "/reservations",
      name: "وضعیت رزرو میزها",
      icon: CalendarCheck,
      segment: "operations",
      allowedRoles: ["owner"],
      requiredFeature: "reservations",
      requiredTier: "standard",
      upgradeMessage:
        "سیستم رزرو آنلاین میزها در پلن استاندارد و پلاس فعال است.",
    },
    {
      id: "ProductManagement",
      path: "/products",
      name: "محصولات و منو",
      icon: Utensils,
      segment: "operations",
      allowedRoles: ["owner"],
    },
    {
      id: "qrcodes",
      path: "/qrcodes",
      name: "بارکد میزها",
      icon: QrCode,
      segment: "operations",
      allowedRoles: ["owner"],
    },

    // تب دوم: مالی و مدیریت
    {
      id: "financialReports",
      path: "/financial-reports",
      name: "گزارش مالی",
      icon: BarChart3,
      segment: "management",
      allowedRoles: ["owner", "cashier"],
      requiredFeature: "financialReports",
      requiredTier: "basic",
      upgradeMessage: "برای مشاهده گزارشات مالی نیاز به اشتراک فعال دارید.",
    },
    {
      id: "wallet",
      path: "/wallet",
      name: "کیف پول",
      icon: Wallet,
      segment: "management",
      allowedRoles: ["owner"],
    },
    {
      id: "TeamManagement",
      path: "/team",
      name: "تیم من",
      icon: Users,
      segment: "management",
      allowedRoles: ["owner"],
      requiredFeature: "teamManagement",
      requiredTier: "plus",
      upgradeMessage:
        "سیستم تیم‌بندی و تعریف نقش پرسنل (صندوق‌دار، سرآشپز، گارسون) ویژه پلن پلاس است.",
    },
    {
      id: "venues",
      path: "/venues",
      name: "رستوران‌ها",
      icon: Store,
      segment: "management",
      allowedRoles: ["owner"],
    },
    {
      id: "subscription",
      path: "/subscription",
      name: "اشتراک",
      icon: CreditCard,
      segment: "management",
      allowedRoles: ["owner"],
    },
    {
      id: "support",
      path: "/support",
      name: "پشتیبانی",
      icon: Headset,
      segment: "management",
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"],
    },
  ];

  // بررسی قفل بودن آیتم بر اساس پلن فعلی
  const isItemPlanLocked = (item: SidebarMenuItem) => {
    if (isSubLoading || !item.requiredFeature) return false;
    return !can(item.requiredFeature);
  };

  const triggerItemUpgrade = (item: SidebarMenuItem) => {
    openUpgradeModal({
      title: `دسترسی به «${item.name}»`,
      message: item.upgradeMessage,
      requiredTier: item.requiredTier || "plus",
      feature: item.requiredFeature,
    });
  };

  // همگام‌سازی خودکار تب فعال سایدبار با صفحه فعلی
  useEffect(() => {
    const matched = menuItems.find((item) => item.path === location.pathname);
    if (matched) {
      setActiveSegment(matched.segment);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
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

          if (typeof statusData.hasRestaurant !== "undefined") {
            const venueStatus = statusData.hasRestaurant === true;
            setHasVenue(venueStatus);

            if (serverRole === "owner" && venueStatus === true) {
              const hasSeenTour = localStorage.getItem("has_seen_tour");

              if (!hasSeenTour && window.innerWidth > 1024) {
                setTimeout(() => {
                  const tourDriver = driver({
                    showProgress: true,
                    animate: true,
                    progressText: "{{current}} از {{total}}",
                    doneBtnText: "پایان تور",
                    nextBtnText: "بعدی ➔",
                    prevBtnText: "قبلی",
                    overlayColor: "rgba(15, 23, 42, 0.6)",
                    onDestroyStarted: () => {
                      localStorage.setItem("has_seen_tour", "true");
                      setActiveSegment("operations");
                      tourDriver.destroy();
                    },
                    steps: [
                      {
                        element: "#tour-dashboard",
                        onHighlightStarted: () =>
                          setActiveSegment("operations"),
                        popover: {
                          title: "داشبورد مدیریت",
                          description:
                            "در اینجا می‌توانید آمار فروش، تعداد سفارشات زنده و وضعیت کلی رستوران را در یک نگاه ببینید.",
                          side: "left",
                          align: "start",
                        },
                      },
                      {
                        element: "#tour-ProductManagement",
                        onHighlightStarted: () =>
                          setActiveSegment("operations"),
                        popover: {
                          title: "مدیریت محصولات",
                          description:
                            "منوی دیجیتال خود را از اینجا بسازید. دسته‌بندی‌ها را تعریف کنید و غذاها را با عکس و قیمت اضافه کنید.",
                          side: "left",
                        },
                      },
                      {
                        element: "#tour-kitchenPanel",
                        onHighlightStarted: () =>
                          setActiveSegment("operations"),
                        popover: {
                          title: "ترمینال آشپزخانه",
                          description:
                            "این بخش مخصوص آشپزهاست تا سفارشات ثبت شده را به صورت زنده روی مانیتور ببینند و وضعیت پخت را تغییر دهند.",
                          side: "left",
                        },
                      },
                      {
                        element: "#tour-TeamManagement",
                        onHighlightStarted: () =>
                          setActiveSegment("management"),
                        popover: {
                          title: "تیم من",
                          description:
                            "برای آشپزخانه، صندوق‌دار و گارسون‌های خود دسترسی اختصاصی بسازید تا هر کدام پنل خود را داشته باشند.",
                          side: "left",
                        },
                      },
                      {
                        element: "#tour-wallet",
                        onHighlightStarted: () =>
                          setActiveSegment("management"),
                        popover: {
                          title: "کیف پول و تسویه",
                          description:
                            "درآمدهای آنلاین شما به این کیف پول واریز می‌شود و می‌توانید درخواست تسویه‌حساب به حساب بانکی خود بدهید.",
                          side: "left",
                        },
                      },
                    ],
                  });

                  tourDriver.drive();
                }, 1000);
              }
            }
          }
        }
      } catch (error) {
        console.error("خطا در دریافت وضعیت سایدبار:", error);
      }
    };

    fetchUserData();
  }, [location.pathname]);

  const userInitial = userName.charAt(0);

  const allowedItems = menuItems.filter((item) =>
    item.allowedRoles.includes(normalizedRole),
  );

  const showSegmentControl = normalizedRole === "owner";
  const visibleDesktopItems = showSegmentControl
    ? allowedItems.filter((item) => item.segment === activeSegment)
    : allowedItems;

  const mainMobileItems = allowedItems.slice(0, 4);
  const moreMobileItems = allowedItems.slice(4);

  const roleBadgeMap: Record<string, string> = {
    owner: "مدیر مجموعه",
    cashier: "صندوق‌دار",
    kitchen: "آشپزخانه",
    waiter: "گارسون",
  };

  const handleLogout = () => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/";
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobileMoreOpen) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const tabPath = elem
      ?.closest("[data-tab-path]")
      ?.getAttribute("data-tab-path");

    if (tabPath && tabPath !== "more" && tabPath !== location.pathname) {
      if (isMenuLocked && tabPath !== "/dashboard") {
        showMobileWarning();
        return;
      }
      const targetItem = allowedItems.find((i) => i.path === tabPath);
      if (targetItem && isItemPlanLocked(targetItem)) {
        triggerItemUpgrade(targetItem);
        return;
      }
      navigate(tabPath, { replace: true });
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const showMobileWarning = () => {
    setMobileWarning("ابتدا مجموعه خود را ثبت کنید 🔒");
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setTimeout(() => setMobileWarning(null), 3000);
  };

  const isMenuLocked = normalizedRole === "owner" && hasVenue === false;

  return (
    <>
      {/* سایدبار دسکتاپ (Apple Glassmorphism) */}
      <aside className="hidden lg:flex fixed inset-y-6 right-6 z-50 w-[268px] bg-white/55 backdrop-blur-[40px] backdrop-saturate-[200%] border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[34px] flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-5 relative z-10 overflow-y-auto hide-scrollbar">
          {/* هدر برند ترنج */}
          <div className="flex items-center justify-between mb-6 mt-1 px-1.5 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-3">
              <ToranjLogoMark className="w-10 h-10 shadow-md shadow-orange-500/20 shrink-0" />
              <div>
                <span className="text-[21px] font-black text-slate-900 tracking-tight block leading-none">
                  ترن<span className="text-orange-500">ج</span>
                </span>
                <span
                  className="text-[10px] font-mono font-bold text-slate-400 tracking-wide block mt-1"
                  dir="ltr"
                >
                  toranjmenu.ir
                </span>
              </div>
            </Link>
          </div>

          {/* سوئیچر iOS برای خلوت و تمیز ماندن منو */}
          {showSegmentControl && (
            <div className="bg-slate-200/60 p-1 rounded-[16px] grid grid-cols-2 gap-1 mb-5 shrink-0 border border-white/50">
              <button
                type="button"
                onClick={() => setActiveSegment("operations")}
                className={`py-2 px-2 rounded-[13px] text-[12px] font-black transition-all duration-200 ${
                  activeSegment === "operations"
                    ? "bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                سالن و سفارش
              </button>
              <button
                type="button"
                onClick={() => setActiveSegment("management")}
                className={`py-2 px-2 rounded-[13px] text-[12px] font-black transition-all duration-200 ${
                  activeSegment === "management"
                    ? "bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                مالی و مدیریت
              </button>
            </div>
          )}

          {/* لیست آیتم‌های جادار و تمیز */}
          <nav className="flex-1 space-y-2 pb-4 relative">
            {isMenuLocked && (
              <div className="absolute inset-x-0 inset-y-12 z-20 flex flex-col items-center justify-center bg-white/65 backdrop-blur-[3px] rounded-3xl animate-in fade-in duration-500">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-orange-500 mb-3 border border-orange-100 animate-bounce">
                  <Lock size={20} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-black text-slate-700 bg-white/95 px-3.5 py-1.5 rounded-xl shadow-sm">
                  مجموعه خود را ثبت کنید
                </span>
              </div>
            )}

            {visibleDesktopItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isDisabled = isMenuLocked && item.path !== "/dashboard";
              const isPlanLocked = !isDisabled && isItemPlanLocked(item);
              const requiredTierLabel = item.requiredTier
                ? TIER_BADGE_LABELS[item.requiredTier]
                : "پلاس";

              if (isDisabled) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-[20px] text-[14px] font-black text-slate-300 opacity-50 cursor-not-allowed select-none"
                  >
                    <div className="w-8 h-8 rounded-[11px] bg-slate-100/60 flex items-center justify-center shrink-0">
                      <item.icon size={18} strokeWidth={2} />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>
                );
              }

              if (isPlanLocked) {
                return (
                  <button
                    key={item.id}
                    id={`tour-${item.id}`}
                    type="button"
                    onClick={() => triggerItemUpgrade(item)}
                    className="w-full group flex items-center justify-between gap-2 px-3.5 py-3 rounded-[20px] transition-all duration-200 text-[14px] font-black text-slate-500 hover:bg-white/75 hover:text-slate-900 text-right"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-[11px] bg-slate-100/90 text-slate-400 group-hover:text-orange-500 flex items-center justify-center shrink-0 transition-colors">
                        <item.icon size={17} strokeWidth={2.2} />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[10px] font-black shrink-0">
                      <Lock size={10} strokeWidth={2.6} />
                      <span>{requiredTierLabel}</span>
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  id={`tour-${item.id}`}
                  to={item.path}
                  className={`group flex items-center gap-3 px-3.5 py-3 rounded-[20px] transition-all duration-200 text-[14px] font-black ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_8px_24px_rgba(249,115,22,0.10)] border border-orange-100/80"
                      : "text-slate-600 hover:bg-white/65 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-[11px] flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                        : "bg-white/80 text-slate-400 group-hover:text-orange-500 shadow-2xs"
                    }`}
                  >
                    <item.icon size={17} strokeWidth={isActive ? 2.5 : 2.2} />
                  </div>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* کارت وضعیت پلن فعلی + پروفایل پایین سایدبار */}
          <div className="mt-auto pt-2 space-y-2.5 relative z-30 shrink-0">
            {normalizedRole === "owner" && !isSubLoading && (
              <Link
                to="/subscription"
                className={`block p-3 rounded-[20px] border transition-all hover:scale-[1.01] ${
                  !subscription.hasActiveSubscription
                    ? "bg-rose-50/90 border-rose-200 text-rose-800"
                    : subscription.isTrial
                      ? "bg-gradient-to-l from-orange-50 to-amber-50/80 border-orange-200/80 text-slate-800"
                      : "bg-white/80 border-white text-slate-800 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        !subscription.hasActiveSubscription
                          ? "bg-rose-500 text-white"
                          : "bg-slate-900 text-amber-400"
                      }`}
                    >
                      <Crown size={14} />
                    </span>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-black truncate">
                        {!subscription.hasActiveSubscription
                          ? subscription.isRevoked
                            ? "اشتراک خلع شده"
                            : "اشتراک منقضی"
                          : subscription.isTrial
                            ? "پلاس (تست رایگان)"
                            : `پلن ${subscription.tierLabel}`}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-500">
                        {subscription.hasActiveSubscription
                          ? `${subscription.daysRemaining.toLocaleString("fa-IR")} روز باقی‌مانده`
                          : "تمدید / خرید اشتراک"}
                      </span>
                    </div>
                  </div>

                  {subscription.tier !== "plus" && (
                    <span className="text-[10px] font-black text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-lg shrink-0">
                      ارتقا
                    </span>
                  )}
                </div>
              </Link>
            )}

            <div className="bg-white/80 backdrop-blur-md p-2.5 rounded-[22px] shadow-2xs border border-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-10 h-10 rounded-[14px] bg-slate-900 flex items-center justify-center shrink-0 text-white font-black text-sm shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <span className="block text-[13px] font-black text-slate-800 truncate">
                    {userName}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-400 truncate">
                    {roleBadgeMap[normalizedRole] || "همکار"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="خروج از حساب"
                className="w-9 h-9 rounded-[12px] text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors shrink-0"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* موبایل: داک کپسولی بازشونده */}
      {mobileWarning && (
        <div className="lg:hidden fixed bottom-24 inset-x-4 z-50 flex justify-center animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
            <Lock size={16} className="text-orange-400" /> {mobileWarning}
          </div>
        </div>
      )}

      <div
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMoreOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMoreOpen(false)}
      />

      <div
        className={`lg:hidden fixed bottom-[90px] inset-x-4 z-40 bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[32px] p-5 transition-all duration-400 ease-out transform ${
          isMobileMoreOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-20 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-3 gap-4 relative">
          {isMenuLocked && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center">
              <Lock size={32} className="text-slate-300 opacity-50" />
            </div>
          )}
          {moreMobileItems.map((item) => {
            const isPlanLocked = !isMenuLocked && isItemPlanLocked(item);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isMenuLocked) {
                    showMobileWarning();
                    return;
                  }
                  setIsMobileMoreOpen(false);
                  if (isPlanLocked) {
                    triggerItemUpgrade(item);
                    return;
                  }
                  navigate(item.path);
                }}
                className={`flex flex-col items-center gap-2 relative ${
                  isMenuLocked ? "opacity-40" : "cursor-pointer"
                }`}
              >
                <div
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    location.pathname === item.path
                      ? "bg-orange-50 text-orange-500 shadow-inner"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <item.icon size={20} strokeWidth={2.5} />
                  {isPlanLocked && (
                    <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-orange-500 text-white border-2 border-white flex items-center justify-center">
                      <Lock size={10} strokeWidth={2.8} />
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-black text-center leading-tight ${
                    location.pathname === item.path
                      ? "text-orange-500"
                      : "text-slate-600"
                  }`}
                >
                  {item.name}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-2 relative z-20"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <LogOut size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black text-center text-rose-600">
              خروج
            </span>
          </button>
        </div>
      </div>

      <div
        className="lg:hidden fixed bottom-6 inset-x-0 mx-auto w-max max-w-[92vw] px-1.5 py-1.5 bg-white/70 backdrop-blur-[40px] backdrop-saturate-[200%] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-full flex items-center justify-between gap-1 z-50 select-none"
        onTouchMove={handleTouchMove}
      >
        {mainMobileItems.map((item) => {
          const isActive = location.pathname === item.path && !isMobileMoreOpen;
          const isDisabled = isMenuLocked && item.path !== "/dashboard";
          const isPlanLocked = !isDisabled && isItemPlanLocked(item);

          return (
            <div
              key={item.id}
              data-tab-path={item.path}
              onClick={() => {
                if (isDisabled) {
                  showMobileWarning();
                  return;
                }
                setIsMobileMoreOpen(false);
                if (isPlanLocked) {
                  triggerItemUpgrade(item);
                  return;
                }
                navigate(item.path);
              }}
              className={`relative flex items-center justify-center h-12 rounded-full transition-all duration-400 ease-out overflow-hidden ${
                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              } ${
                isActive
                  ? "bg-white shadow-sm px-4 scale-105"
                  : "bg-transparent px-3"
              }`}
            >
              {(isDisabled || isPlanLocked) && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              )}
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`shrink-0 transition-colors duration-300 ${
                  isActive ? "text-orange-500" : "text-slate-500"
                }`}
              />
              <span
                className={`font-black text-[13px] text-orange-500 overflow-hidden whitespace-nowrap transition-all duration-400 ${
                  isActive
                    ? "max-w-[110px] opacity-100 mr-2"
                    : "max-w-0 opacity-0 mr-0"
                }`}
              >
                {item.name}
              </span>
            </div>
          );
        })}

        {moreMobileItems.length > 0 && (
          <div
            data-tab-path="more"
            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
            className={`relative flex items-center justify-center h-12 px-3 rounded-full cursor-pointer transition-all duration-300 ${
              isMobileMoreOpen
                ? "bg-slate-900 text-white scale-105"
                : "bg-transparent text-slate-500"
            }`}
          >
            {isMenuLocked && (
              <div className="absolute top-1 right-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            )}
            <MoreHorizontal
              size={24}
              strokeWidth={isMobileMoreOpen ? 3 : 2}
              className={`transition-transform duration-300 ${
                isMobileMoreOpen ? "rotate-90" : "rotate-0"
              }`}
            />
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .driver-popover {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 28px !important;
          border: 1px solid rgba(255, 255, 255, 1) !important;
          font-family: inherit !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
          padding: 24px !important;
          min-width: 320px;
        }
        .driver-popover-title {
          font-weight: 900 !important;
          font-size: 1.2rem !important;
          color: #0f172a !important;
          margin-bottom: 8px !important;
          direction: rtl !important;
        }
        .driver-popover-description {
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          color: #64748b !important;
          line-height: 1.8 !important;
          direction: rtl !important;
          margin-bottom: 16px !important;
        }
        .driver-popover-footer {
          margin-top: 16px !important;
        }
        .driver-popover-next-btn {
          background-color: #f97316 !important;
          color: white !important;
          text-shadow: none !important;
          border-radius: 14px !important;
          font-weight: 900 !important;
          border: none !important;
          padding: 8px 16px !important;
        }
        .driver-popover-prev-btn {
          border-radius: 14px !important;
          font-weight: 900 !important;
          color: #64748b !important;
          border: 1px solid #e2e8f0 !important;
        }
        .driver-popover-close-btn {
          color: #94a3b8 !important;
        }
        .driver-popover-close-btn:hover {
          color: #f43f5e !important;
        }
        div.driver-active-element {
          border-radius: 24px;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
