import { useState } from "react";
import {
  User,
  MapPin,
  Store,
  Link as LinkIcon,
  Phone,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";

export const SetupVenue = () => {
  const [step, setStep] = useState(1);

  const [ownerInfo, setOwnerInfo] = useState({
    firstName: "",
    lastName: "",
    city: "",
  });
  const [venueInfo, setVenueInfo] = useState({
    name: "",
    englishName: "",
    address: "",
    phone: "",
  });

  // 🔴 پیش‌فرض روی پلن استاندارد تنظیم شد
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [billingCycle, setBillingCycle] = useState("6mo");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    message: string;
  } | null>(null);

  const canGoNext = () => {
    if (step === 1) {
      return (
        ownerInfo.firstName.trim() !== "" &&
        ownerInfo.lastName.trim() !== "" &&
        ownerInfo.city.trim() !== ""
      );
    }
    if (step === 2) {
      return (
        venueInfo.name.trim() !== "" &&
        venueInfo.englishName.trim() !== "" &&
        venueInfo.address.trim() !== ""
      );
    }
    return true;
  };

  const nextStep = () => {
    if (canGoNext()) setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // 🔴 ترجمه نام پلن و زمان برای ثبت در دیتابیس
      const planNames: any = {
        basic: "ساده",
        standard: "استاندارد",
        plus: "پلاس",
      };
      const cycleNames: any = {
        "3mo": "۳ ماهه",
        "6mo": "۶ ماهه",
        "12mo": "یکساله",
      };
      const planTitle = `${planNames[selectedPlan]} (${cycleNames[billingCycle]})`;

      const payload = {
        owner_city: ownerInfo.city,
        name: venueInfo.name,
        english_name: venueInfo.englishName,
        address: venueInfo.address,
        phone: venueInfo.phone,
        plan_name: planTitle,
      };

      const data = await venuesApi.createVenue(payload);
      setSuccessData(data);
      setStep(6);
    } catch (err: any) {
      const errorMsg =
        err?.english_name?.[0] ||
        err?.non_field_errors?.[0] ||
        err?.error ||
        "خطایی در ارتباط با سرور رخ داد. ممکن است آدرس تکراری باشد.";

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#030712] text-slate-200 py-12 px-6 flex flex-col"
      dir="rtl"
    >
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center mb-12">
        {step < 6 ? (
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white flex items-center gap-2 font-bold transition-colors"
          >
            <ArrowRight size={20} /> انصراف
          </Link>
        ) : (
          <div></div>
        )}
        <span className="text-2xl font-black text-white tracking-tight">
          Menu<span className="text-emerald-400">Jet</span>
        </span>
      </header>

      <div className="max-w-4xl mx-auto w-full flex-1">
        {step < 6 && (
          <div className="mb-12 animate-in fade-in">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-4 px-2">
              <span className={step >= 1 ? "text-emerald-400" : ""}>مالک</span>
              <span className={step >= 2 ? "text-emerald-400" : ""}>
                مجموعه
              </span>
              <span className={step >= 3 ? "text-emerald-400" : ""}>پکیج</span>
              <span className={step >= 4 ? "text-emerald-400" : ""}>وضعیت</span>
              <span className={step >= 5 ? "text-emerald-400" : ""}>بررسی</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-10 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

          {error && (
            <div className="relative z-20 mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 font-bold animate-in fade-in">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* === مرحله ۱: اطلاعات مالک === */}
          {step === 1 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-white mb-2">
                اطلاعات مالک مجموعه
              </h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                این اطلاعات برای پیگیری درخواست و ارتباط پشتیبانی استفاده
                می‌شود.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    نام *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={ownerInfo.firstName}
                      onChange={(e) =>
                        setOwnerInfo({
                          ...ownerInfo,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pr-11 pl-4 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    value={ownerInfo.lastName}
                    onChange={(e) =>
                      setOwnerInfo({ ...ownerInfo, lastName: e.target.value })
                    }
                    className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 px-4 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    شهر *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      value={ownerInfo.city}
                      onChange={(e) =>
                        setOwnerInfo({ ...ownerInfo, city: e.target.value })
                      }
                      className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pr-11 pl-4 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === مرحله ۲: اطلاعات مجموعه === */}
          {step === 2 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-white mb-2">
                اطلاعات مجموعه و آدرس منو
              </h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                نام انگلیسی مجموعه همان آدرس اختصاصی منوی شماست؛ ساده، کوتاه و
                انگلیسی انتخاب کنید.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    نام مجموعه *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">
                      <Store size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="مثال: کافه لوتوس"
                      value={venueInfo.name}
                      onChange={(e) =>
                        setVenueInfo({ ...venueInfo, name: e.target.value })
                      }
                      className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pr-11 pl-4 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    نام انگلیسی برای آدرس *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">
                      <LinkIcon size={18} />
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="lotuscafe"
                      value={venueInfo.englishName}
                      onChange={(e) =>
                        setVenueInfo({
                          ...venueInfo,
                          englishName: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, ""),
                        })
                      }
                      className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pl-11 pr-4 focus:border-emerald-500 transition-all text-left"
                    />
                  </div>
                  {venueInfo.englishName && (
                    <p className="text-xs text-emerald-400 mt-2 dir-ltr text-right">
                      menujet.ir/{venueInfo.englishName}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    آدرس مجموعه *
                  </label>
                  <input
                    type="text"
                    value={venueInfo.address}
                    onChange={(e) =>
                      setVenueInfo({ ...venueInfo, address: e.target.value })
                    }
                    className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 px-4 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    شماره تماس (اختیاری)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={venueInfo.phone}
                      onChange={(e) =>
                        setVenueInfo({ ...venueInfo, phone: e.target.value })
                      }
                      className="w-full bg-black/30 border border-white/10 text-white rounded-2xl py-3 pl-11 pr-4 focus:border-emerald-500 transition-all text-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === مرحله ۳: پکیج‌ها === */}
          {step === 3 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                  <Gift size={16} /> هر پلنی که انتخاب کنید، ۷ روز اول کاملاً
                  رایگان است!
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  پلن حرفه‌ای خود را انتخاب کنید
                </h2>
                <p className="text-slate-400 text-sm">
                  پس از پایان ۷ روز تست رایگان، می‌توانید پلن خود را تمدید کنید.
                  در این مرحله نیازی به پرداخت نیست.
                </p>
              </div>

              <div className="flex justify-center mb-10">
                <div className="inline-flex bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                  {["3mo", "6mo", "12mo"].map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingCycle === cycle ? "bg-emerald-500 text-gray-950 shadow-lg" : "text-slate-400 hover:text-white"}`}
                    >
                      {cycle === "3mo"
                        ? "۳ ماهه"
                        : cycle === "6mo"
                          ? "۶ ماهه"
                          : "۱ ساله"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div
                  onClick={() => setSelectedPlan("basic")}
                  className={`cursor-pointer border p-6 rounded-[28px] transition-all relative ${selectedPlan === "basic" ? "bg-emerald-500/10 border-emerald-500" : "bg-black/20 border-white/10 hover:border-white/30"}`}
                >
                  {selectedPlan === "basic" && (
                    <div className="absolute top-4 left-4 text-emerald-400">
                      <Check size={24} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">ساده</h3>
                  <p className="text-xs text-slate-400 mb-4 h-8">
                    پلن اقتصادی برای شروع
                  </p>
                  <div className="text-3xl font-black text-white mb-6">
                    {billingCycle === "3mo"
                      ? "890,000"
                      : billingCycle === "6mo"
                        ? "1,480,000"
                        : "2,250,000"}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      تومان
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan("standard")}
                  className={`cursor-pointer border p-6 rounded-[28px] transition-all relative transform lg:-translate-y-4 shadow-xl ${selectedPlan === "standard" ? "bg-emerald-500/10 border-emerald-500" : "bg-gradient-to-b from-white/5 to-transparent border-white/20 hover:border-emerald-500/50"}`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-gray-950 px-3 py-1 rounded-full text-xs font-bold">
                    پیشنهاد ویژه
                  </div>
                  {selectedPlan === "standard" && (
                    <div className="absolute top-4 left-4 text-emerald-400">
                      <Check size={24} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">
                    استاندارد
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 h-8">
                    شامل درخواست گارسون
                  </p>
                  <div className="text-3xl font-black text-white mb-6">
                    {billingCycle === "3mo"
                      ? "1,380,000"
                      : billingCycle === "6mo"
                        ? "2,450,000"
                        : "3,985,000"}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      تومان
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan("plus")}
                  className={`cursor-pointer border p-6 rounded-[28px] transition-all relative ${selectedPlan === "plus" ? "bg-emerald-500/10 border-emerald-500" : "bg-black/20 border-white/10 hover:border-white/30"}`}
                >
                  {selectedPlan === "plus" && (
                    <div className="absolute top-4 left-4 text-emerald-400">
                      <Check size={24} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-1">پلاس</h3>
                  <p className="text-xs text-slate-400 mb-4 h-8">
                    پلن کامل برای حرفه‌ای‌ها
                  </p>
                  <div className="text-3xl font-black text-white mb-6">
                    {billingCycle === "3mo"
                      ? "1,790,000"
                      : billingCycle === "6mo"
                        ? "2,900,000"
                        : "5,200,000"}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === مرحله ۴: وضعیت === */}
          {step === 4 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-white mb-2">
                وضعیت راه‌اندازی و شروع
              </h2>
              <p className="text-slate-400 text-sm mb-8 font-medium">
                شما پلن حرفه‌ای خود را با ۷ روز تست رایگان انتخاب کردید.
              </p>

              <div className="bg-black/30 border border-white/10 rounded-3xl p-8 text-center max-w-2xl mx-auto">
                <ShieldCheck
                  size={48}
                  className="text-emerald-400 mx-auto mb-6"
                />

                <h3 className="text-xl font-bold text-white mb-4">
                  آماده شروع بدون پرداخت!
                </h3>
                <p className="text-slate-300 leading-relaxed mb-6">
                  رستوران شما در سیستم ثبت می‌شود و پس از تایید مدیریت، ۷ روز
                  استفاده رایگان از تمام امکانات این پلن برای شما فعال خواهد شد.
                  پس از اتمام این زمان، در صورت رضایت می‌توانید پلن خود را
                  پرداخت و تمدید کنید.
                </p>

                <div className="mt-6 flex flex-col gap-3 font-mono text-emerald-400 bg-white/5 py-4 rounded-xl dir-ltr text-center font-bold text-lg">
                  <div>menujet.ir/{venueInfo.englishName || "yourname"}</div>
                </div>
              </div>
            </div>
          )}

          {/* === مرحله ۵: بررسی نهایی === */}
          {step === 5 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500 text-center py-10">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                تایید و ارسال درخواست
              </h2>
              <p className="text-slate-300 leading-relaxed max-w-lg mx-auto mb-6">
                با انتخاب دکمه پایین، درخواست شما برای تیم ما ارسال می‌شود. بعد
                از تایید، داشبورد شما کاملاً فعال خواهد شد.
              </p>
            </div>
          )}

          {/* === مرحله ۶: پرده آخر (موفقیت) === */}
          {step === 6 && successData && (
            <div className="relative z-10 animate-in zoom-in duration-500 text-center py-10">
              <div className="w-24 h-24 bg-emerald-500 text-gray-950 rounded-[28px] flex items-center justify-center mx-auto mb-6 rotate-12 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                <Check size={48} className="-rotate-12" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                درخواست شما با موفقیت ثبت شد!
              </h2>
              <p className="text-slate-300 leading-relaxed max-w-lg mx-auto mb-8 font-medium">
                {successData.message ||
                  "درخواست بررسی شعبه ارسال شد. تا ساعاتی دیگر پیامک فعال‌سازی دریافت خواهید کرد."}
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto mb-10">
                <p className="text-sm text-slate-400 mb-4">
                  آدرس اختصاصی منوی شما:
                </p>
                <div className="font-mono text-emerald-400 bg-black/40 py-3 px-4 rounded-xl mb-2 dir-ltr text-center font-bold text-lg">
                  menujet.ir/{venueInfo.englishName}
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-10 py-4 rounded-2xl font-black transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105"
              >
                ورود به پنل مدیریت
              </Link>
            </div>
          )}

          {/* دکمه‌های کنترل پایین فرم (فقط در مراحل ۱ تا ۵ نمایش داده می‌شود) */}
          {step < 6 && (
            <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={step === 1 || isLoading}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${step === 1 ? "opacity-0 pointer-events-none" : "bg-white/5 hover:bg-white/10 text-white"}`}
              >
                <ArrowRight size={18} /> مرحله قبل
              </button>

              {step < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={!canGoNext() || isLoading}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${canGoNext() ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-white/5 text-slate-500 cursor-not-allowed"}`}
                >
                  مرحله بعد <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-10 py-3 rounded-xl font-black transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "تایید و ثبت"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
