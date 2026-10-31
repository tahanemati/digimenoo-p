import React, { useState, useEffect } from "react";
import {
  Phone,
  KeyRound,
  Loader2,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Store,
  Sparkles,
  QrCode,
  Smartphone,
  RefreshCcw,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api";

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
  .apple-fade-1 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
  .apple-fade-2 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both; }
  .apple-fade-3 { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both; }
  .apple-float-slow { animation: softFloat 6s ease-in-out infinite; }
`;

// =======================
// پنل گرافیکی (سمت چپ)
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

    <div className="relative z-10 w-full max-w-md flex flex-col gap-5 px-4">
      <div className="mb-2 apple-fade-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold mb-3">
          <Sparkles size={13} />
          <span>هوشمندسازی در ۳۰ ثانیه</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          ثبت‌نام مجموعه
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">
          تنها با وارد کردن شماره موبایل، رستوران یا کافه خود را به نسل جدید
          منوهای دیجیتال متصل کنید.
        </p>
      </div>

      <div className="apple-fade-2">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white w-full apple-float-slow">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100/50">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  ایجاد پروفایل مجموعه
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  آماده اتصال به پنل
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100/50">
                <Smartphone size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  تایید شماره موبایل
                </p>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="w-full h-full bg-emerald-400"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 opacity-60 grayscale">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100/50">
                <QrCode size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  تولید لینک و QR Code اختصاصی
                </p>
                <p className="text-[10px] text-slate-400 mt-1">مرحله بعدی</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
    if (val === "" || val.startsWith("0")) {
      if (val.length <= 11) setMobile(val);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
    if (val.length <= 6) setOtp(val);
  };

  // =======================
  // 🔴 مرحله ۱: ارسال موبایل به سرور
  // =======================
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mobile.length !== 11) return;

    setIsLoading(true);
    setError("");

    try {
      await authApi.sendOtp(mobile);
      setStep(2);
      setOtp("");
      setCountdown(120);
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور.");
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // 🔴 ارسال مجدد کد
  // =======================
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError("");

    try {
      await authApi.resendOtp(mobile);
      setCountdown(120);
      setOtp("");
    } catch (err: any) {
      setError(err.message || "خطا در ارسال مجدد کد.");
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // 🔴 مرحله ۲: تایید نهایی کد
  // =======================
  // =======================
  // 🔴 مرحله ۲: تایید نهایی کد (در فایل Register.tsx)
  // =======================
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await authApi.verifyOtp(mobile, otp);

      // ۱. ذخیره توکن‌ها
      localStorage.setItem(
        "access_token",
        data.token || data.accessToken || data.access_token,
      );
      if (data.refreshToken || data.refresh_token) {
        localStorage.setItem(
          "refresh_token",
          data.refreshToken || data.refresh_token,
        );
      }
      localStorage.setItem("role", data.role || "owner");

      // ۲. ذخیره شماره موبایل برای صفحه تکمیل
      localStorage.setItem("registered_mobile", mobile);

      // ۳. 🔴 فیکس نهایی: کلا شرط بک‌اند رو برداشتیم.
      // با استفاده از navigate (بدون رفرش شدن صفحه) مستقیم برو به پروفایل!
      navigate("/complete-profile");
    } catch (err: any) {
      setError(err.message || "کد وارد شده نامعتبر یا منقضی شده است.");
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

      {/* سمت راست: فرم ثبت‌نام مینیمال */}
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white">
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <Link
            to="/"
            className="text-xl font-black text-slate-900 tracking-tight"
          >
            دیجی<span className="text-orange-500">منو</span>
          </Link>

          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-slate-400 hidden sm:block font-medium">
              قبلاً ثبت‌نام کرده‌اید؟
            </span>
            <Link
              to="/login"
              className="text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-0.5 group"
            >
              ورود با رمز عبور
              <ChevronLeft
                size={16}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[360px] flex flex-col pb-10">
            <div className="mb-8 apple-fade-1">
              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                ورود یا ثبت‌نام
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                {step === 1
                  ? "برای شروع، شماره موبایل خود را وارد کنید."
                  : `کد ۶ رقمی ارسال شده به ${mobile} را وارد کنید.`}
              </p>
            </div>

            <div className="flex gap-2 mb-8 apple-fade-1">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    step >= s ? "bg-slate-900" : "bg-slate-100"
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

            <form
              className="w-full space-y-4"
              onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}
            >
              {/* === مرحله ۱ === */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-orange-500">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={handleMobileChange}
                        maxLength={11}
                        placeholder="09125654321"
                        className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 dir-ltr text-left font-mono text-base placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={mobile.length !== 11 || isLoading}
                    className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      mobile.length === 11 && !isLoading
                        ? "bg-slate-900 hover:bg-orange-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <span>دریافت کد تایید</span>
                        <ArrowLeft
                          size={18}
                          className="transition-transform duration-300 group-hover:-translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* === مرحله ۲ === */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-5">
                  <div className="group">
                    <div className="flex justify-between items-center mb-2 mr-1">
                      <label className="block text-xs font-bold text-slate-500 transition-colors group-focus-within:text-slate-800">
                        کد ۶ رقمی
                      </label>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || isLoading}
                        className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                          countdown > 0
                            ? "text-slate-400 cursor-not-allowed"
                            : "text-orange-500 hover:text-orange-600"
                        }`}
                      >
                        {countdown > 0 ? (
                          <span>
                            ارسال مجدد ({Math.floor(countdown / 60)}:
                            {(countdown % 60).toString().padStart(2, "0")})
                          </span>
                        ) : (
                          <>
                            <RefreshCcw size={12} /> ارسال مجدد کد
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-orange-500">
                        <KeyRound size={18} />
                      </div>
                      <input
                        type="tel"
                        value={otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        placeholder="- - - - - -"
                        className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 text-center tracking-[1em] font-mono text-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError("");
                        setCountdown(0);
                      }}
                      className="w-14 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-all flex justify-center items-center shrink-0 hover:border-slate-300"
                    >
                      <ArrowRight size={18} />
                    </button>

                    <button
                      type="submit"
                      disabled={otp.length !== 6 || isLoading}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                        otp.length === 6 && !isLoading
                          ? "bg-slate-900 hover:bg-emerald-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        "تایید و ورود"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <GraphicPanel />
    </div>
  );
};
