import { useState } from "react";
import {
  MapPin,
  Store,
  Link as LinkIcon,
  Phone,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Gift,
  Map,
  Hash,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { venuesApi } from "../service/api"; // 🔴 اتصال به فایل API

export const SetupVenue = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    city: "",
    phone: "",
    name: "",
    englishName: "",
    address: "",
    tableCount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ message: string } | null>(
    null,
  );

  const canGoNext = () => {
    if (step === 1) {
      return formData.city.trim() !== "" && formData.phone.trim() !== "";
    }
    if (step === 2) {
      return (
        formData.name.trim() !== "" &&
        formData.englishName.trim() !== "" &&
        formData.address.trim() !== "" &&
        formData.tableCount.trim() !== ""
      );
    }
    return true;
  };

  const nextStep = () => {
    if (canGoNext()) setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // =======================
  // 🔴 ثبت واقعی در دیتابیس جنگو
  // =======================
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // ارسال اطلاعات به بک‌‌اند. نام متغیرها را به فرمت جنگو تغییر می‌دهیم
      await venuesApi.createVenue({
        name: formData.name,
        english_name: formData.englishName,
        city: formData.city,
        phone: formData.phone,
        address: formData.address,
        table_count: parseInt(formData.tableCount) || 1,
      });

      // در صورت موفقیت
      setSuccessData({
        message: "رستوران شما با موفقیت ثبت شد و پلن پلاس برای شما فعال گردید.",
      });
      setStep(4);
    } catch (err: any) {
      setError(
        err.error ||
          err.detail ||
          "خطا در ثبت اطلاعات. لطفاً مجدداً تلاش کنید.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6 flex flex-col font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-400/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-amber-300/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.3] pointer-events-none"></div>

      <header className="max-w-4xl mx-auto w-full flex justify-between items-center mb-12 relative z-10">
        {step < 4 ? (
          <Link
            to="/dashboard"
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowRight size={18} /> انصراف
          </Link>
        ) : (
          <div></div>
        )}
        <span className="text-2xl font-black text-slate-800 tracking-tight">
          Menu<span className="text-orange-500">Jet</span>
        </span>
      </header>

      <div className="max-w-4xl mx-auto w-full flex-1 relative z-10">
        {step < 4 && (
          <div className="mb-12 animate-in fade-in">
            <div className="flex justify-between text-[11px] md:text-xs font-bold text-slate-400 mb-3 px-2">
              <span className={step >= 1 ? "text-orange-600" : ""}>
                اطلاعات اولیه
              </span>
              <span className={step >= 2 ? "text-orange-600" : ""}>
                مشخصات مجموعه
              </span>
              <span className={step >= 3 ? "text-orange-600" : ""}>
                تایید نهایی
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    step >= i
                      ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-[0_10px_40px_rgb(0,0,0,0.04)]">
          {error && (
            <div className="relative z-20 mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                اطلاعات اولیه
              </h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">
                برای شروع، شهر و شماره تماس مجموعه خود را وارد کنید.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    شهر *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="مثال: تهران"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pr-11 pl-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    شماره تماس مجموعه *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pl-11 pr-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                مشخصات مجموعه و آدرس منو
              </h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">
                نام انگلیسی مجموعه همان آدرس اختصاصی منوی شماست؛ ساده، کوتاه و
                انگلیسی انتخاب کنید.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    نام مجموعه *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <Store size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="مثال: کافه لوتوس"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pr-11 pl-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    نام انگلیسی برای آدرس (دامنه) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <LinkIcon size={18} />
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="lotuscafe"
                      value={formData.englishName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          englishName: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, ""),
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pl-11 pr-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right placeholder:text-slate-300"
                    />
                  </div>
                  {formData.englishName && (
                    <p className="text-xs font-bold text-orange-500 mt-2 dir-ltr text-right bg-orange-50 px-2 py-1 rounded-md inline-block w-full border border-orange-100">
                      menujet.ir/{formData.englishName}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    آدرس دقیق مجموعه *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <Map size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pr-11 pl-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    تعداد میز رستوران *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                      <Hash size={18} />
                    </div>
                    <input
                      type="number"
                      min="1"
                      dir="ltr"
                      placeholder="مثال: ۱۵"
                      value={formData.tableCount}
                      onChange={(e) =>
                        setFormData({ ...formData, tableCount: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3 pl-11 pr-4 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">
                تایید نهایی و راه‌اندازی
              </h2>
              <p className="text-slate-500 text-sm mb-8 font-medium text-center">
                همه چیز آماده است! آدرس منوی شما تنظیم شد.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm">
                <div className="mb-10">
                  <p className="text-sm font-bold text-slate-500 mb-4">
                    آدرس اختصاصی منوی شما:
                  </p>
                  <div className="flex flex-col gap-2 bg-white border border-slate-200 py-5 px-6 rounded-2xl dir-ltr text-center font-black text-2xl text-orange-600 shadow-sm w-fit mx-auto">
                    menujet.ir/{formData.englishName || "yourname"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-[24px] shadow-lg shadow-orange-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                      <Gift size={28} />
                    </div>
                    <h3 className="text-xl font-black">هدیه ویژه شروع کار!</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed font-medium">
                    با تکمیل این ثبت‌نام،{" "}
                    <strong className="text-white bg-white/20 px-2 py-0.5 rounded-md">
                      ۷ روز استفاده کاملاً رایگان
                    </strong>{" "}
                    از پلن «پلاس» (کامل‌ترین پلن سیستم) برای مجموعه شما فعال
                    خواهد شد.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-sm font-bold text-orange-100">
                    <Sparkles size={16} /> بدون نیاز به پرداخت اولیه
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && successData && (
            <div className="relative z-10 animate-in zoom-in duration-500 text-center py-12">
              <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-[0_10px_40px_rgba(16,185,129,0.4)] border-4 border-white">
                <Check size={56} strokeWidth={3} className="-rotate-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                تکمیل شد! 🎉
              </h2>
              <p className="text-slate-500 leading-relaxed max-w-md mx-auto mb-8 font-medium">
                {successData.message}
              </p>
              <Link
                to="/dashboard"
                className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1"
              >
                ورود به داشبورد مدیریت
              </Link>
            </div>
          )}

          {step < 4 && (
            <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={step === 1 || isLoading}
                className={`px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                  step === 1
                    ? "opacity-0 pointer-events-none"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                }`}
              >
                <ArrowRight size={18} /> مرحله قبل
              </button>

              {step < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!canGoNext() || isLoading}
                  className={`px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                    canGoNext()
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  مرحله بعد <ArrowLeft size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "تایید و راه‌اندازی"
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
