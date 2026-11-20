import React, { useState } from "react";
import {
  MapPin,
  Store,
  Link as LinkIcon,
  Phone,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Map,
  Hash,
  Sparkles,
  Rocket,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { venuesApi } from "../service/api";

// =======================
// انیمیشن‌های مینیمال اپل
// =======================
const appleAnimations = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes softFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .apple-fade-1 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .apple-fade-2 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
  .apple-fade-3 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
  .apple-float-slow { animation: softFloat 6s ease-in-out infinite; }
  .apple-scale { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
`;

// =======================
// پنل گرافیکی
// =======================
const GraphicPanel = () => (
  <div className="hidden lg:flex w-1/2 bg-[#fafafa] relative items-center justify-center overflow-hidden border-r border-slate-200/70 select-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#ffedd5,_transparent_55%)] opacity-70 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#f1f5f9,_transparent_55%)] pointer-events-none" />

    <div
      className="absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 w-full max-w-md flex flex-col gap-6 px-4">
      <div className="mb-2 apple-fade-1 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25 border-4 border-white mb-4">
          <Store size={28} strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          ثبت مجموعه در دیجی<span className="text-orange-500">منو</span>
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed max-w-xs text-center">
          شعبه دیجیتال و هوشمند رستوران خود را در کمتر از ۱ دقیقه راه‌اندازی
          کنید.
        </p>
      </div>

      <div className="apple-fade-2 space-y-4 w-full">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white flex items-center gap-4 apple-float-slow">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <Rocket size={22} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-0.5">
              دامنه اختصاصی شما
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              مشتریان مستقیماً از طریق لینک منحصر‌به‌فرد وارد منوی شما می‌شوند.
            </p>
          </div>
        </div>

        <div
          className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white flex items-center gap-4 apple-float-slow"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-0.5">
              اتصال یکپارچه به داشبورد
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              پس از ثبت، تمام امکانات فروش و انبارداری برای شما فعال خواهد شد.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SetupVenue = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    city: "",
    phone: "",
    address: "",
    tableCount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ message: string } | null>(
    null,
  );

  const toEnglishDigits = (str: string) => {
    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return str
      .split("")
      .map((c) => {
        let idx = persianNumbers.indexOf(c);
        if (idx >= 0) return idx;
        idx = arabicNumbers.indexOf(c);
        if (idx >= 0) return idx;
        return c;
      })
      .join("");
  };

  const canGoNext = () => {
    if (step === 1) {
      return (
        formData.name.trim().length >= 2 && formData.slug.trim().length >= 3
      );
    }
    if (step === 2) {
      return (
        formData.city.trim() !== "" &&
        formData.phone.trim() !== "" &&
        formData.address.trim() !== "" &&
        parseInt(formData.tableCount, 10) >= 1
      );
    }
    return true;
  };

  const nextStep = async () => {
    if (!canGoNext()) return;

    setIsCheckingSlug(true);
    setError("");
    try {
      await venuesApi.checkSlug(formData.slug.trim());
      setStep(2);
    } catch (err: any) {
      setError(err.message || "این آدرس انگلیسی قبلاً ثبت شده یا نامعتبر است.");
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // =======================
  // ارسال اطلاعات به جنگو
  // =======================
  const handleSubmit = async () => {
    if (!canGoNext()) return;
    setIsLoading(true);
    setError("");

    try {
      // مرحله ۱: ساخت اولیه رستوران
      await venuesApi.createVenue({
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
      });

      // مرحله ۲: تکمیل اطلاعات مکانی و تعداد میز
      await venuesApi.completeVenue({
        city: formData.city.trim(),
        tableCount: parseInt(formData.tableCount, 10) || 1,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      localStorage.setItem("has_venue", "true");

      setSuccessData({
        message: "مجموعه شما با موفقیت در پلتفرم دیجی‌منو ثبت شد.",
      });

      setStep(3);
    } catch (err: any) {
      console.error("ارور دریافتی از سرور:", err);
      setError(
        err.message ||
          err.response?.data?.message ||
          "خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-full bg-white flex font-sans text-slate-800 overflow-hidden"
      dir="rtl"
    >
      <style>{appleAnimations}</style>

      {/* سمت راست: فرم راه‌اندازی مجموعه */}
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white">
        {/* نوار بالا */}
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <Link
            to="/"
            className="text-xl font-black text-slate-900 tracking-tight"
          >
            دیجی<span className="text-orange-500">منو</span>
          </Link>

          {step < 3 && (
            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1.5 font-bold text-sm bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ChevronRight size={16} /> انصراف
            </Link>
          )}
        </div>

        {/* مرکز فرم */}
        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {step < 3 ? (
            <div className="w-full max-w-[380px] flex flex-col pb-10">
              <div className="flex gap-2 mb-8 apple-fade-1">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                      step >= i
                        ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                        : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="w-full mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 apple-fade-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                  {error}
                </div>
              )}

              <div className="flex-1 relative min-h-[300px]">
                {/* مرحله ۱ */}
                {step === 1 && (
                  <div className="apple-fade-2 absolute inset-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                      شناسه مجموعه
                    </h2>
                    <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                      نام رستوران و آدرس اختصاصی (لینک منو) خود را وارد کنید.
                    </p>

                    <div className="space-y-5">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                          نام رستوران / کافه
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Store size={18} />
                          </div>
                          <input
                            type="text"
                            autoFocus
                            placeholder="مثال: رستوران ارکیده"
                            value={formData.name}
                            onChange={(e) => {
                              setError("");
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              });
                            }}
                            className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="group pt-2">
                        <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                          آدرس انگلیسی منو (Slug)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <LinkIcon size={18} />
                          </div>
                          <input
                            type="text"
                            dir="ltr"
                            placeholder="orkideh-cafe"
                            value={formData.slug}
                            onChange={(e) => {
                              setError("");
                              setFormData({
                                ...formData,
                                slug: toEnglishDigits(e.target.value)
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^a-z0-9-]/g, ""),
                              });
                            }}
                            className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-600 px-3 py-2 rounded-xl text-[11px] font-black dir-ltr flex items-center gap-2 shadow-sm max-w-full overflow-hidden">
                            <Sparkles
                              size={14}
                              className="text-emerald-500 shrink-0"
                            />
                            <span className="truncate flex-1">
                              digimenoo.ir/
                              {formData.slug || (
                                <span className="text-emerald-300">
                                  yourname
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* مرحله ۲ */}
                {step === 2 && (
                  <div className="apple-fade-2 absolute inset-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                      اطلاعات مکانی
                    </h2>
                    <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                      جزئیات تماس و آدرس مجموعه را برای ثبت در سیستم وارد کنید.
                    </p>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                            شهر
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                              <MapPin size={18} />
                            </div>
                            <input
                              type="text"
                              autoFocus
                              placeholder="تهران"
                              value={formData.city}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  city: e.target.value,
                                })
                              }
                              className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-3 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                            تعداد میز
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                              <Hash size={18} />
                            </div>
                            <input
                              type="tel"
                              dir="ltr"
                              placeholder="15"
                              value={formData.tableCount}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  tableCount: toEnglishDigits(
                                    e.target.value,
                                  ).replace(/[^0-9]/g, ""),
                                })
                              }
                              className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-3 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="group pt-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                          شماره تماس
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Phone size={18} />
                          </div>
                          <input
                            type="tel"
                            dir="ltr"
                            placeholder="021-88..."
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                phone: toEnglishDigits(e.target.value).replace(
                                  /[^0-9-]/g,
                                  "",
                                ),
                              })
                            }
                            className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-sm font-mono placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="group pt-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                          آدرس دقیق
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors"></div>
                          <input
                            type="text"
                            placeholder="خیابان اصلی، کوچه..."
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* دکمه‌های ناوبری */}
              <div className="mt-14 pt-4 border-t border-slate-100 flex items-center gap-3 apple-fade-3">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isLoading}
                    className="w-14 h-14 shrink-0 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/90 flex items-center justify-center transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canGoNext() || isCheckingSlug}
                    className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      canGoNext() && !isCheckingSlug
                        ? "bg-slate-900 hover:bg-orange-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isCheckingSlug ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        مرحله بعد
                        <ArrowLeft
                          size={18}
                          className="transition-transform duration-300 group-hover:-translate-x-1"
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canGoNext() || isLoading}
                    className={`group flex-1 py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      canGoNext() && !isLoading
                        ? "bg-orange-500 hover:bg-emerald-500 text-white shadow-[0_10px_25px_rgba(249,115,22,0.2)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        ثبت و راه‌اندازی مجموعه
                        <Check
                          size={18}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[380px] flex flex-col items-center justify-center text-center apple-scale">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white relative z-10">
                  <Check size={48} strokeWidth={3} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 z-20">
                  <Sparkles size={20} className="text-orange-500" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                تبریک! شعبه ساخته شد 🎉
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                {successData?.message || "رستوران شما در سیستم ثبت شد."} الان
                می‌توانید وارد پنل مدیریت شوید.
              </p>

              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                ورود به داشبورد <ArrowLeft size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <GraphicPanel />
    </div>
  );
};

export default SetupVenue;
