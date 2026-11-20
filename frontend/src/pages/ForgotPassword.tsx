import React, { useState } from "react";
import {
  Phone,
  Lock,
  Loader2,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api"; // 🔴 مسیر را هماهنگ کنید

// =======================
// انیمیشن‌های مینیمال
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
  .apple-float-slow { animation: softFloat 6s ease-in-out infinite; }
`;

// =======================
// پنل گرافیکی اختصاصی بازیابی رمز
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
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          دیجی<span className="text-orange-500">منو</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          یکپارچه‌سازی منوی دیجیتال و اتوماسیون رستوران
        </p>
      </div>

      <div className="apple-fade-2">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white w-full apple-float-slow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  بازیابی امن حساب کاربری
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  محافظت شده با رمزنگاری پیشرفته
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50/80 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
              <div className="w-1.5 h-8 bg-blue-400 rounded-full"></div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  تایید هویت پیامکی
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ارسال کد یکبار مصرف (OTP)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ForgotPassword = () => {
  const navigate = useNavigate();

  // اضافه شدن مرحله ۴ برای نمایش پیام موفقیت
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
    if (val.length <= 6) setCode(val);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 11) return;
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPasswordRequest(mobile);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || err?.error || "خطا در ارسال کد تایید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPasswordVerify(mobile, code);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || err?.error || "کد وارد شده اشتباه است.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPasswordReset({
        mobile,
        code,
        newPassword,
        confirmPassword: newPassword,
      });
      // به جای alert، کاربر رو می‌فرستیم به مرحله ۴
      setStep(4);
    } catch (err: any) {
      setError(err?.message || err?.error || "خطا در تغییر رمز عبور.");
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

      {/* سمت راست: فرم */}
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
              به خاطر آوردید؟
            </span>
            <Link
              to="/login"
              className="text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-0.5 group"
            >
              بازگشت به ورود
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
          <div className="w-full max-w-[350px] flex flex-col">
            {/* عنوان هدر - فقط اگر در مراحل 1 تا 3 باشیم نمایش داده شود */}
            {step !== 4 && (
              <div className="mb-8 apple-fade-1">
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  {step === 1
                    ? "بازیابی رمز"
                    : step === 2
                      ? "تایید هویت"
                      : "رمز جدید"}
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                  {step === 1
                    ? "شماره موبایل ثبت‌شده خود را وارد کنید."
                    : step === 2
                      ? `کد پیامک شده به ${mobile} را وارد کنید.`
                      : "رمز عبور جدید و امن برای حساب خود تنظیم کنید."}
                </p>
              </div>
            )}

            {error && step !== 4 && (
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 apple-fade-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            {/* مرحله ۱ */}
            {step === 1 && (
              <form
                className="w-full space-y-5 apple-fade-2"
                onSubmit={handleRequestCode}
              >
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
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 dir-ltr text-left font-mono text-base placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="pt-2">
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
                        <ArrowRight
                          size={18}
                          className="rotate-180 transition-transform duration-300 group-hover:-translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* مرحله ۲ */}
            {step === 2 && (
              <form
                className="w-full space-y-5 apple-fade-2"
                onSubmit={handleVerifyCode}
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    کد پیامک شده
                  </label>
                  <input
                    type="tel"
                    value={code}
                    onChange={handleCodeChange}
                    maxLength={6}
                    placeholder="12345"
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 px-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 dir-ltr text-center font-mono text-xl tracking-[0.5em] placeholder:font-sans placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={!code || isLoading}
                    className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      code && !isLoading
                        ? "bg-slate-900 hover:bg-orange-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      "بررسی کد"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold text-center transition-colors"
                  >
                    اصلاح شماره موبایل
                  </button>
                </div>
              </form>
            )}

            {/* مرحله ۳ */}
            {step === 3 && (
              <form
                className="w-full space-y-5 apple-fade-2"
                onSubmit={handleResetPassword}
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    رمز عبور جدید
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-emerald-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 dir-ltr text-left font-mono text-base placeholder:text-right placeholder:font-sans placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={newPassword.length < 6 || isLoading}
                    className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      newPassword.length >= 6 && !isLoading
                        ? "bg-slate-900 hover:bg-emerald-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      "ثبت و ورود"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* مرحله ۴ (پیام موفقیت) */}
            {step === 4 && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6 apple-fade-1">
                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 mb-2">
                  <CheckCircle2
                    size={48}
                    className="text-emerald-500"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    رمز عبور تغییر یافت
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">
                    حالا می‌توانید با رمز عبور جدید وارد حساب کاربری خود شوید.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-4 mt-2 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] bg-slate-900 hover:bg-emerald-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] active:scale-[0.98]"
                >
                  انتقال به صفحه ورود
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <GraphicPanel />
    </div>
  );
};

export default ForgotPassword;
