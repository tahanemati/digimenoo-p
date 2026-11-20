import { useState, useEffect } from "react";
import {
  Store,
  User,
  MapPin,
  Link2,
  Map,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronLeft,
  Plus,
  XCircle,
  Phone,
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
        const response = await venuesApi.getMyVenue();
        const data = response?.data?.data || response?.data || response;

        if (data && (data.id || data.Id || data.name || data.Name)) {
          setHasVenue(true);
          setVenueData({
            name: data.name || data.Name || "رستوران من",
            english_name: data.slug || data.Slug || data.english_name || "menu",
            status: data.status ?? data.Status ?? "pending",
            owner_name:
              data.ownerName ||
              data.OwnerName ||
              localStorage.getItem("user_name") ||
              "مدیر مجموعه",
            owner_city: data.city || data.City || "ثبت نشده",
            address: data.address || data.Address || "آدرس ثبت نشده",
            phone: data.phone || data.Phone || "ثبت نشده",
          });
        } else {
          setHasVenue(false);
        }
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
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  // =======================
  // حالت: کاربر مجموعه‌ای ندارد
  // =======================
  if (!hasVenue) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center text-center px-6"
        dir="rtl"
      >
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          <Store size={40} className="text-slate-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tight">
          شما هیچ مجموعه‌ای ندارید
        </h2>
        <p className="text-slate-500 mb-8 max-w-sm font-medium leading-relaxed text-[14px]">
          برای استفاده از امکانات سیستم و مدیریت منو، ابتدا باید اطلاعات رستوران
          یا کافه خود را ثبت کنید.
        </p>
        <Link
          to="/setup-venue"
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/15 active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={3} /> ثبت اولین مجموعه
        </Link>
      </div>
    );
  }

  const venueStatus = String(venueData?.status || "").toLowerCase();

  const isApproved =
    venueStatus === "approved" ||
    venueStatus === "active" ||
    venueStatus === "1";
  const isRejected =
    venueStatus === "rejected" ||
    venueStatus === "suspended" ||
    venueStatus === "2";

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative font-sans text-slate-800 pb-28 lg:pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-4 md:p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-6 md:mb-10">
          <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1.5 tracking-tight">
            مدیریت رستوران و شعبه
          </h1>
          <p className="text-slate-500 text-[13px] md:text-sm font-bold">
            وضعیت درخواست و مشخصات مجموعه خود را اینجا پیگیری کنید.
          </p>
        </header>

        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[32px] md:rounded-[40px] p-6 md:p-10 relative overflow-hidden">
          <div className="relative z-10">
            {/* --- هدر وضعیت --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 border-b border-slate-100/80 pb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                  وضعیت مجموعه شما
                </h2>
                <p className="text-slate-500 text-[13px] leading-relaxed max-w-md font-bold">
                  {isApproved
                    ? "مجموعه شما با موفقیت تایید شده و کاملاً فعال است."
                    : isRejected
                      ? "درخواست ثبت مجموعه شما رد شده است. لطفاً اشکالات را برطرف کنید."
                      : "درخواست شما ثبت شده و در صف بررسی کارشناسان قرار دارد."}
                </p>
              </div>

              <div
                className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-[20px] font-black text-[14px] border shadow-sm ${
                  isApproved
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : isRejected
                      ? "bg-rose-50 border-rose-100 text-rose-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 size={20} strokeWidth={2.5} />
                ) : isRejected ? (
                  <AlertCircle size={20} strokeWidth={2.5} />
                ) : (
                  <Clock size={20} strokeWidth={2.5} />
                )}
                {isApproved
                  ? "تایید شده و فعال"
                  : isRejected
                    ? "درخواست رد شد"
                    : "در انتظار بررسی"}
              </div>
            </div>

            {/* --- تایم‌لاین مراحل --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 relative">
              <div className="hidden md:block absolute top-7 right-12 left-12 h-[2px] bg-slate-100 z-0 rounded-full" />

              {/* مرحله ۱ */}
              <div className="relative z-10 flex flex-col gap-3 md:items-center text-right md:text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-[20px] flex items-center justify-center border border-emerald-100 shadow-sm mx-0 md:mx-auto shrink-0">
                  <CheckCircle2 size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-black text-slate-800 mb-1 text-[15px]">
                    ثبت درخواست
                  </div>
                  <div className="text-[12px] font-bold text-slate-400">
                    اطلاعات با موفقیت دریافت شد.
                  </div>
                </div>
              </div>

              {/* مرحله ۲ */}
              <div className="relative z-10 flex flex-col gap-3 md:items-center text-right md:text-center">
                <div
                  className={`w-14 h-14 rounded-[20px] flex items-center justify-center border shadow-sm mx-0 md:mx-auto shrink-0 ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                      : isRejected
                        ? "bg-rose-50 text-rose-500 border-rose-100"
                        : "bg-amber-400 text-white shadow-amber-400/30 border-transparent animate-pulse"
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 size={26} strokeWidth={2.5} />
                  ) : isRejected ? (
                    <XCircle size={26} strokeWidth={2.5} />
                  ) : (
                    <Clock size={26} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <div
                    className={`font-black mb-1 text-[15px] ${isRejected ? "text-rose-600" : "text-slate-800"}`}
                  >
                    بررسی مدیریت
                  </div>
                  <div
                    className={`text-[12px] font-bold ${isApproved ? "text-slate-400" : isRejected ? "text-rose-500" : "text-amber-500"}`}
                  >
                    {isApproved
                      ? "اطلاعات مجموعه شما تایید شد."
                      : isRejected
                        ? "اطلاعات مجموعه تایید نشد."
                        : "در حال بررسی توسط کارشناسان."}
                  </div>
                </div>
              </div>

              {/* مرحله ۳ */}
              <div
                className={`relative z-10 flex flex-col gap-3 md:items-center text-right md:text-center ${!isApproved && "opacity-50 grayscale-[50%]"}`}
              >
                <div
                  className={`w-14 h-14 rounded-[20px] flex items-center justify-center border shadow-sm mx-0 md:mx-auto shrink-0 ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                      : "bg-white text-slate-300 border-slate-200"
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 size={26} strokeWidth={2.5} />
                  ) : (
                    <Store size={26} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <div className="font-black text-slate-800 mb-1 text-[15px]">
                    ساخت منوی آنلاین
                  </div>
                  <div className="text-[12px] font-bold text-slate-400">
                    {isApproved
                      ? "رستوران شما ساخته شد."
                      : "پس از تایید انجام می‌شود."}
                  </div>
                </div>
              </div>
            </div>

            {/* --- خلاصه مشخصات --- */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-[28px] md:rounded-[32px] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200/60 pb-4">
                <h3 className="text-slate-800 font-black flex items-center gap-2 text-[16px] md:text-lg tracking-tight">
                  <Store
                    className="text-orange-500"
                    size={22}
                    strokeWidth={2.5}
                  />{" "}
                  مشخصات رستوران
                </h3>
                {isApproved && (
                  <Link
                    to="/venue-settings"
                    className="text-[11px] md:text-xs font-black text-slate-500 hover:text-slate-800 transition-colors bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
                  >
                    ویرایش مشخصات
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Store
                      className="text-slate-400"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                      نام مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-[14px]">
                      {venueData?.name}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <User
                      className="text-slate-400"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                      مالک مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-[14px]">
                      {venueData?.owner_name}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin
                      className="text-slate-400"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                      شهر
                    </div>
                    <div className="font-black text-slate-800 text-[14px]">
                      {venueData?.owner_city}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Phone
                      className="text-slate-400"
                      size={18}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                      تلفن تماس
                    </div>
                    <div className="font-black text-slate-800 text-[14px] dir-ltr text-right">
                      {venueData?.phone}
                    </div>
                  </div>
                </div>

                {/* آدرس فیزیکی */}
                <div className="flex gap-3 items-start md:col-span-2 lg:col-span-4 pt-2">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm"></div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-0.5">
                      آدرس فیزیکی مجموعه
                    </div>
                    <div className="font-black text-slate-800 text-[14px] leading-relaxed max-w-2xl">
                      {venueData?.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* آدرس منوی اختصاصی */}
              {isApproved && (
                <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Link2
                      className="text-orange-500"
                      size={20}
                      strokeWidth={2.5}
                    />
                    <span className="text-[13px] font-black text-slate-700">
                      لینک اختصاصی منوی شما:
                    </span>
                  </div>
                  <a
                    href={`https://digimenoo.ir/${venueData?.english_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white px-4 py-2.5 rounded-[14px] border border-orange-100 transition-colors font-mono font-black text-[14px] dir-ltr shrink-0 shadow-sm"
                  >
                    <ChevronLeft size={16} strokeWidth={3} /> digimenoo.ir/
                    {venueData?.english_name}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Venues;
