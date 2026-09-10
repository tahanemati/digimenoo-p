import { useState, useEffect } from "react";
import {
  Store,
  User,
  MapPin,
  Package,
  Link2,
  Map,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronLeft,
  Plus,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";

export const Venues = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);
  const [hasVenue, setHasVenue] = useState<boolean>(false);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const data = await venuesApi.getMyVenue();
        setHasVenue(data.has_venue);
        if (data.has_venue) {
          setVenueData(data.venue);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات مجموعه", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVenue();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!hasVenue) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Store size={64} className="text-slate-600 mb-6" />
        <h2 className="text-2xl font-black text-white mb-4">
          شما هیچ مجموعه‌ای ندارید
        </h2>
        <p className="text-slate-400 mb-8 max-w-md">
          برای استفاده از امکانات سیستم و مدیریت منو، ابتدا باید مجموعه خود را
          ثبت کنید.
        </p>
        <Link
          to="/setup-venue"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
        >
          <Plus size={20} /> ثبت اولین مجموعه
        </Link>
      </div>
    );
  }

  // چک کردن دقیق استاتوس از بک‌اند
  const venueStatus = venueData?.status;
  const isApproved = venueStatus === "approved";
  const isRejected = venueStatus === "rejected";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="mb-10">
        <h1 className="text-2xl font-black text-white mb-2">
          رستوران‌ها و مجموعه‌ها
        </h1>
        <p className="text-slate-500 text-sm">
          پیگیری وضعیت درخواست‌ها و مدیریت منوهای فعال
        </p>
      </header>

      <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
        {/* افکت نوری پس‌زمینه داینامیک */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 blur-[100px] pointer-events-none ${isApproved ? "bg-emerald-500/10" : isRejected ? "bg-rose-500/10" : "bg-amber-500/10"}`}
        />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">
                وضعیت مجموعه شما
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                {isApproved
                  ? "مجموعه شما با موفقیت تایید شده و فعال است. می‌توانید منوی خود را ویرایش کنید."
                  : isRejected
                    ? "متاسفانه درخواست ثبت مجموعه شما توسط کارشناسان رد شده است. لطفا با پشتیبانی در ارتباط باشید."
                    : "درخواست شما ثبت شده و در صف بررسی قرار دارد. بعد از تایید، رستوران ساخته می‌شود."}
              </p>
            </div>

            <div
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border ${isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : isRejected ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
            >
              {isApproved ? (
                <CheckCircle2 size={18} />
              ) : isRejected ? (
                <AlertCircle size={18} />
              ) : (
                <Loader2 className="animate-spin" size={18} />
              )}
              {isApproved
                ? "تایید شده و فعال"
                : isRejected
                  ? "درخواست رد شد"
                  : "در انتظار بررسی"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
            <div className="hidden md:block absolute top-5 right-10 left-10 h-0.5 bg-white/5 z-0" />

            <div className="relative z-10 flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="font-bold text-white mb-1">ثبت درخواست</div>
                <div className="text-xs text-slate-500">
                  اطلاعات شما دریافت شده است.
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : isRejected ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500 text-gray-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-4 ring-amber-500/20 animate-pulse"}`}
              >
                {isApproved ? (
                  <CheckCircle2 size={20} />
                ) : isRejected ? (
                  <XCircle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>
              <div>
                <div
                  className={`font-bold text-white mb-1 ${isRejected && "text-rose-400"}`}
                >
                  بررسی مدیریت
                </div>
                <div
                  className={`text-xs ${isApproved ? "text-slate-500" : isRejected ? "text-rose-400/80" : "text-amber-400/80"}`}
                >
                  {isApproved
                    ? "اطلاعات شما تایید شد."
                    : isRejected
                      ? "اطلاعات شما تایید نشد."
                      : "در حال بررسی و پیگیری است."}
                </div>
              </div>
            </div>

            <div
              className={`relative z-10 flex flex-col gap-3 ${!isApproved && "opacity-50"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border ${isApproved ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/10"}`}
              >
                {isApproved ? <CheckCircle2 size={20} /> : <Store size={20} />}
              </div>
              <div>
                <div className="font-bold text-white mb-1">
                  ساخت خودکار رستوران
                </div>
                <div className="text-xs text-slate-500">
                  {isApproved
                    ? "رستوران شما در سیستم ساخته شد."
                    : isRejected
                      ? "عملیات متوقف شد."
                      : "بعد از تایید انجام می‌شود."}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Store className="text-slate-400" size={18} /> خلاصه اطلاعات
                مجموعه
              </h3>
              {isApproved && (
                <Link
                  to="/venue-settings"
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  ویرایش اطلاعات
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
              <div className="flex gap-3">
                <User className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-1">مالک</div>
                  <div className="font-bold text-white text-sm">
                    {venueData?.owner_name || "---"}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-1">شهر</div>
                  <div className="font-bold text-white text-sm">
                    {venueData?.owner_city || "---"}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Store className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-1">نام مجموعه</div>
                  <div className="font-bold text-white text-sm">
                    {venueData?.name}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Package className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-1">پکیج</div>
                  <div className="font-bold text-emerald-400 text-sm">
                    {venueData?.plan_name}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 lg:col-span-2">
                <Link2 className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    آدرس منوی شما
                  </div>
                  <div className="flex flex-col gap-1 font-mono text-lg text-emerald-400 dir-ltr text-right font-bold">
                    {/* 🔴 لینک با آدرس‌دهی نسبی اصلاح شد تا روی لوکال‌هاست به درستی کار کند */}
                    <a
                      href={`/${venueData?.english_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 justify-end"
                    >
                      <ChevronLeft size={16} /> menujet.ir/
                      {venueData?.english_name}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 md:col-span-2 lg:col-span-3">
                <Map className="text-slate-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-xs text-slate-500 mb-1">آدرس مجموعه</div>
                  <div className="font-bold text-white text-sm leading-relaxed">
                    {venueData?.address || "---"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* هشدارهای داینامیک فوتر */}
          {isRejected ? (
            <div className="mt-8 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start text-rose-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed font-medium">
                درخواست شما تایید نشد. این مشکل معمولا به دلیل اطلاعات ناقص یا
                تکراری بودن نام دامنه است. لطفا با ما در تماس باشید.
              </p>
            </div>
          ) : !isApproved ? (
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start text-blue-400">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed font-medium">
                درخواست شما در صف بررسی است. پس از تایید، رستوران با همین
                اطلاعات ساخته می‌شود.
              </p>
            </div>
          ) : (
            <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 items-start text-emerald-400">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed font-medium">
                رستوران شما کاملاً فعال است. می‌توانید از بخش مدیریت منو،
                محصولات خود را اضافه کنید.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
