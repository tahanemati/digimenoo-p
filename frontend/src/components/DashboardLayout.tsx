import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import {
  Crown,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useSubscription } from "../context/SubscriptionContext";

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { subscription, isLoading } = useSubscription();
  const location = useLocation();

  const role = (localStorage.getItem("role") || "owner").toLowerCase();
  const isOwner = role === "owner";
  const isOnSubscriptionPage = location.pathname === "/subscription";

  const renderSubscriptionBanner = () => {
    if (isLoading) return null;

    // ۱. حالت خلع شده توسط ادمین
    if (subscription.isRevoked) {
      return (
        <div className="px-4 sm:px-6 md:px-10 pt-4">
          <div className="bg-rose-50/95 backdrop-blur-xl border border-rose-200 rounded-[22px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldAlert size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs sm:text-sm font-black text-rose-900">
                  اشتراک مجموعه غیرفعال (خلع) شده است
                </span>
                <span className="block text-[11px] font-bold text-rose-700/85 mt-0.5">
                  امکانات مدیریتی و منو محدود شده‌اند. برای فعال‌سازی مجدد
                  اشتراک تهیه کنید یا با پشتیبانی در ارتباط باشید.
                </span>
              </div>
            </div>

            {isOwner && !isOnSubscriptionPage && (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to="/support"
                  className="bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-black transition-colors"
                >
                  پشتیبانی
                </Link>
                <Link
                  to="/subscription"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>خرید اشتراک</span>
                  <ArrowLeft size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ۲. حالت منقضی شده یا بدون اشتراک فعال
    if (!subscription.hasActiveSubscription) {
      return (
        <div className="px-4 sm:px-6 md:px-10 pt-4">
          <div className="bg-amber-50/95 backdrop-blur-xl border border-amber-200 rounded-[22px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs sm:text-sm font-black text-amber-950">
                  {subscription.isExpired
                    ? "مدت اشتراک مجموعه شما به پایان رسیده است"
                    : "هنوز اشتراک فعالی برای مجموعه ثبت نشده است"}
                </span>
                <span className="block text-[11px] font-bold text-amber-800/80 mt-0.5">
                  برای دسترسی کامل به قالب‌ها، سفارش‌دهی آنلاین و پنل مدیریت،
                  پلن مورد نظر خود را فعال کنید.
                </span>
              </div>
            </div>

            {isOwner && !isOnSubscriptionPage && (
              <Link
                to="/subscription"
                className="bg-slate-900 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-sm transition-colors"
              >
                <span>مشاهده و تمدید پلن</span>
                <ArrowLeft size={14} />
              </Link>
            )}
          </div>
        </div>
      );
    }

    // ۳. حالت دوره آزمایشی ۷ روزه رایگان پلاس
    if (subscription.isTrial) {
      return (
        <div className="px-4 sm:px-6 md:px-10 pt-4">
          <div className="bg-gradient-to-l from-orange-500/10 via-amber-50 to-white border border-orange-200/80 rounded-[22px] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">
                <span className="font-black text-slate-900">
                  دوره آزمایشی رایگان پلاس فعال است
                </span>{" "}
                —{" "}
                <span className="font-black text-orange-600">
                  {subscription.daysRemaining.toLocaleString("fa-IR")} روز
                </span>{" "}
                تا پایان دسترسی رایگان باقی مانده است.
              </p>
            </div>

            {isOwner && !isOnSubscriptionPage && (
              <Link
                to="/subscription"
                className="bg-slate-900 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors"
              >
                <Crown size={13} className="text-amber-400" />
                <span>انتخاب پلن دائمی</span>
              </Link>
            )}
          </div>
        </div>
      );
    }

    // ۴. اشتراک پولی فعال که ۷ روز یا کمتر از آن باقی مانده
    if (subscription.daysRemaining <= 7 && isOwner) {
      return (
        <div className="px-4 sm:px-6 md:px-10 pt-4">
          <div className="bg-white/90 border border-amber-200 rounded-[22px] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span>
                تنها{" "}
                <strong className="text-amber-600 font-black">
                  {subscription.daysRemaining.toLocaleString("fa-IR")} روز
                </strong>{" "}
                تا پایان اشتراک {subscription.tierLabel} باقی مانده است.
              </span>
            </p>

            {!isOnSubscriptionPage && (
              <Link
                to="/subscription"
                className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black shrink-0 self-end sm:self-center transition-colors"
              >
                تمدید اشتراک
              </Link>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex font-sans"
      dir="rtl"
    >
      {/* سایدبار ثابت */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* بخش متغیر صفحه (Outlet) */}
      <main className="flex-1 lg:mr-72 h-screen overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full">
          {renderSubscriptionBanner()}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
