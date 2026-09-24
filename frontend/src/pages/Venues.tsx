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

        setHasVenue(true);

        setVenueData({
          ...data,
          owner_name: "مدیر مجموعه",
          owner_city: data.city,
          plan_name: "اشتراک فعال",
        });
      } catch (error: any) {
        setHasVenue(false);
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
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  // =======================
  // حالت: کاربر هنوز مجموعه‌ای نساخته است
  // =======================
  if (!hasVenue) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100 shadow-sm">
          <Store size={40} className="text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">
          شما هیچ مجموعه‌ای ندارید
        </h2>
        <p className="text-slate-500 mb-8 max-w-md font-medium leading-relaxed">
          برای استفاده از امکانات سیستم و مدیریت منو، ابتدا باید اطلاعات رستوران
          یا کافه خود را ثبت کنید.
        </p>
        <Link
          to="/setup-venue"
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={3} /> ثبت اولین مجموعه
        </Link>
      </div>
    );
  }

  // =======================
  // بررسی وضعیت (Status)
  // =======================
  const venueStatus = venueData?.status;
  const isApproved = venueStatus === "approved";
  const isRejected = venueStatus === "rejected";

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen relative font-sans text-slate-800"
      dir="rtl"
    >
      {/* افکت‌های پس‌زمینه */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 🔴 کانتینر اصلی که جا مانده بود */}
      <div className="relative z-10 p-6 md:p-10 max-w-6xl mx-auto pb-20">
        {/* هدر صفحه */}
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 tracking-tight">
            رستوران‌ها و مجموعه‌ها
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            پیگیری وضعیت درخواست‌ها و مشاهده مشخصات مجموعه
          </p>
        </header>

        {/* کارت اصلی شیشه‌ای */}
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] p-6 md:p-10 relative overflow-hidden">
          {/* افکت نوری پس‌زمینه داینامیک متناسب با وضعیت */}
          <div
            className={`absolute top-[-20%] right-[-10%] w-[500px] h-[500px] blur-[120px] pointer-events-none ${
              isApproved
                ? "bg-emerald-400/10"
                : isRejected
                  ? "bg-rose-400/10"
                  : "bg-amber-400/10"
            }`}
          />

          <div className="relative z-10">
            {/* بخش وضعیت */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-8">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-3">
                  وضعیت مجموعه شما
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                  {isApproved
                    ? "مجموعه شما با موفقیت تایید شده و کاملاً فعال است. هم‌اکنون می‌توانید منوی خود را مدیریت کنید."
                    : isRejected
                      ? "متاسفانه درخواست ثبت مجموعه شما توسط کارشناسان ما رد شده است. لطفاً اشکالات را برطرف کنید."
                      : "درخواست شما با موفقیت ثبت شده و در صف بررسی کارشناسان قرار دارد. شکیبا باشید."}
                </p>
              </div>

              <div
                className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border shadow-sm ${
                  isApproved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : isRejected
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-amber-50 border-amber-200 text-amber-600"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 size={20} />
                ) : isRejected ? (
                  <AlertCircle size={20} />
                ) : (
                  <Loader2 className="animate-spin" size={20} />
                )}
                {isApproved
                  ? "تایید شده و فعال"
                  : isRejected
                    ? "درخواست رد شد"
                    : "در انتظار بررسی"}
              </div>
            </div>

            {/* تایم‌لاین (مراحل) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative">
              {/* خط اتصال بین مراحل در دسکتاپ */}
              <div className="hidden md:block absolute top-6 right-12 left-12 h-0.5 bg-slate-100 z-0" />

              {/* مرحله ۱ */}
              <div className="relative z-10 flex flex-col gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="font-black text-slate-800 mb-1">
                    ثبت درخواست
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    اطلاعات شما با موفقیت دریافت شد.
                  </div>
                </div>
              </div>

              {/* مرحله ۲ */}
              <div className="relative z-10 flex flex-col gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-500 border-emerald-200"
                      : isRejected
                        ? "bg-rose-50 text-rose-500 border-rose-200"
                        : "bg-amber-500 text-white shadow-amber-500/30 border-transparent animate-pulse"
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 size={24} />
                  ) : isRejected ? (
                    <XCircle size={24} />
                  ) : (
                    <Clock size={24} />
                  )}
                </div>
                <div>
                  <div
                    className={`font-black mb-1 ${isRejected ? "text-rose-600" : "text-slate-800"}`}
                  >
                    بررسی مدیریت
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      isApproved
                        ? "text-slate-500"
                        : isRejected
                          ? "text-rose-500"
                          : "text-amber-600"
                    }`}
                  >
                    {isApproved
                      ? "اطلاعات مجموعه شما تایید شد."
                      : isRejected
                        ? "اطلاعات مجموعه تایید نشد."
                        : "در حال بررسی دقیق توسط کارشناسان."}
                  </div>
                </div>
              </div>

              {/* مرحله ۳ */}
              <div
                className={`relative z-10 flex flex-col gap-3 ${!isApproved && "opacity-50"}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-500 border-emerald-200"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Store size={24} />
                  )}
                </div>
                <div>
                  <div className="font-black text-slate-800 mb-1">
                    ساخت خودکار رستوران
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {isApproved
                      ? "رستوران شما در سیستم MenuJet ساخته شد."
                      : isRejected
                        ? "عملیات به دلیل رد اطلاعات متوقف شد."
                        : "پس از تایید کارشناس انجام می‌شود."}
                  </div>
                </div>
              </div>
            </div>

            {/* باکس خلاصه اطلاعات (Summary) */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-[28px] p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-slate-800 font-black flex items-center gap-2 text-lg">
                  <Store className="text-orange-500" size={22} /> خلاصه مشخصات
                  مجموعه
                </h3>
                {isApproved && (
                  <Link
                    to="/venue-settings"
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors"
                  >
                    ویرایش اطلاعات
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <User className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      مالک مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-sm">
                      {venueData?.owner_name || "---"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      شهر
                    </div>
                    <div className="font-black text-slate-800 text-sm">
                      {venueData?.owner_city || "---"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Store className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      نام مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-sm">
                      {venueData?.name}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Package className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      پکیج فعلی
                    </div>
                    <div className="font-black text-orange-500 text-sm">
                      {venueData?.plan_name || "---"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start lg:col-span-2">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Link2 className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1.5">
                      آدرس منوی اختصاصی شما
                    </div>
                    <div className="flex flex-col gap-1 font-mono text-base text-orange-500 dir-ltr text-right font-black">
                      <a
                        href={`/${venueData?.english_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-orange-600 transition-colors flex items-center gap-1 justify-end bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 w-fit ml-auto"
                      >
                        <ChevronLeft size={16} /> menujet.ir/
                        {venueData?.english_name}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start md:col-span-2 lg:col-span-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Map className="text-slate-400" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">
                      آدرس فیزیکی مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-sm leading-relaxed max-w-2xl">
                      {venueData?.address || "---"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* هشدارهای داینامیک فوتر متناسب با تم لایت */}
            {isRejected ? (
              <div className="mt-8 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3 items-start text-rose-700 shadow-sm">
                <AlertCircle size={24} className="shrink-0 text-rose-500" />
                <p className="text-sm leading-relaxed font-bold">
                  درخواست شما تایید نشد. این مشکل معمولاً به دلیل اطلاعات ناقص
                  یا تکراری بودن نام دامنه (URL) است. لطفاً با تیم پشتیبانی در
                  تماس باشید.
                </p>
              </div>
            ) : !isApproved ? (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3 items-start text-blue-700 shadow-sm">
                <AlertCircle size={24} className="shrink-0 text-blue-500" />
                <p className="text-sm leading-relaxed font-bold">
                  درخواست شما در صف بررسی است. پس از تایید، رستوران شما دقیقاً
                  با همین اطلاعات در پلتفرم ساخته می‌شود و منوی دیجیتال در دسترس
                  قرار می‌گیرد.
                </p>
              </div>
            ) : (
              <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3 items-start text-emerald-700 shadow-sm">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-500" />
                <p className="text-sm leading-relaxed font-bold">
                  رستوران شما کاملاً فعال است. می‌توانید از طریق داشبورد مدیریت،
                  محصولات خود را اضافه کنید و QR کدهای اختصاصی میزها را چاپ
                  نمایید.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
