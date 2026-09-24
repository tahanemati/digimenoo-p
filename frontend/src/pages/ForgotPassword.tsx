import React, { useState } from "react";
import {
  Phone,
  Loader2,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Lock,
  Smartphone,
  QrCode,
  ShoppingBag,
  Store,
  CheckCircle2,
  Clock,
  ChefHat,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api"; // 🔴 اتصال به API

// =======================
// پنل گرافیکی پرمیوم (سمت چپ) - تمرکز روی امنیت
// =======================
const GraphicPanel = () => (
  <div className="hidden lg:flex w-1/2 bg-[#fafafa] relative items-center justify-center overflow-hidden border-l border-slate-200">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#dcfce7,_transparent_50%)] opacity-50"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#ffedd5,_transparent_50%)] opacity-60"></div>

    <div
      className="absolute inset-0 opacity-[0.2]"
      style={{
        backgroundImage:
          "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 w-full max-w-lg flex items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="relative w-[260px] h-[540px] bg-slate-50 rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden shrink-0 z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-30"></div>

        <div className="w-full h-full bg-white relative flex flex-col pt-10">
          <div className="px-5 py-4 flex flex-col items-center border-b border-slate-100">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mb-3">
              <Store size={24} />
            </div>
            <h3 className="font-black text-slate-800">کافه رستوران لوتوس</h3>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-hidden">
            <div className="bg-white border border-slate-100 p-2.5 rounded-2xl flex gap-3 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center">
                <ShoppingBag size={20} className="text-slate-300" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-3/4 h-3 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-slate-100 rounded mb-3"></div>
                <div className="flex justify-between items-center">
                  <div className="w-1/3 h-3 bg-orange-400 rounded"></div>
                  <div className="w-6 h-6 bg-orange-50 rounded-md"></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-100 p-2.5 rounded-2xl flex gap-3 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0"></div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-2/3 h-3 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-slate-100 rounded mb-3"></div>
                <div className="w-1/3 h-3 bg-orange-400 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-[-40px] top-1/4 bg-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 z-30 animate-in zoom-in fade-in delay-300 duration-700">
        <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-2xl p-2 mb-4 flex items-center justify-center">
          <QrCode size={80} className="text-slate-800" strokeWidth={1} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400">شماره میز</span>
          <span className="text-xl font-black text-orange-500">۰۵</span>
        </div>
      </div>

      <div className="absolute left-[-20px] bottom-1/4 bg-white/80 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl border border-slate-100 z-30 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <Smartphone size={20} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">منوی دیجیتال</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            بدون نیاز به نصب اپلیکیشن
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // استیت‌های فرم
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // تبدیل اعداد فارسی/عربی به انگلیسی
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
    if (val.length <= 6) setOtp(val); // تغییر به ۶ رقم
  };

  // =======================
  // 🔴 اتصال به API: مرحله ۱ (ارسال کد)
  // =======================
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mobile.length !== 11) return;

    setIsLoading(true);
    setError("");

    try {
      await authApi.forgotPasswordSendOtp(mobile);
      setStep(2);
      setOtp("");
    } catch (err: any) {
      setError(
        err.error || err.detail || err.message || "خطا در ارتباط با سرور.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // 🔴 اتصال به API: مرحله ۲ (تایید کد)
  // =======================
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      await authApi.forgotPasswordVerifyOtp(mobile, otp);
      setStep(3);
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err.error || err.detail || err.message || "کد وارد شده نامعتبر است.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // 🔴 اتصال به API: مرحله ۳ (ثبت رمز عبور جدید)
  // =======================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    if (!password || password.length < 4) {
      setError("لطفاً یک رمز عبور معتبر (حداقل ۴ کاراکتر) وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.resetPassword({ phone_number: mobile, password });
      // پس از تغییر موفق رمز عبور، کاربر را به صفحه لاگین منتقل می‌کنیم
      navigate("/login");
    } catch (err: any) {
      setError(
        err.error || err.detail || err.message || "خطا در تغییر رمز عبور.",
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
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white">
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <div className="lg:hidden text-xl font-black text-slate-900 tracking-tight">
            Menu<span className="text-orange-500">Jet</span>
          </div>
          <div className="hidden lg:block"></div>

          <div className="flex items-center gap-3 text-sm font-bold">
            <Link
              to="/login"
              className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full"
            >
              <ArrowRight size={16} /> بازگشت به ورود
            </Link>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[360px] flex flex-col pb-10">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                بازیابی رمز عبور
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                برای تغییر رمز عبور، مراحل زیر را طی کنید.
              </p>
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    step >= s ? "bg-slate-900" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="w-full mb-6 p-3.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in-95">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            <form
              className="w-full space-y-4"
              onSubmit={
                step === 1
                  ? handleSendOTP
                  : step === 2
                    ? handleVerifyOTP
                    : handleResetPassword
              }
            >
              {/* === مرحله ۱: شماره موبایل === */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={handleMobileChange}
                        maxLength={11}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all dir-ltr text-left font-mono text-base placeholder:font-sans placeholder:text-right"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={mobile.length !== 11 || isLoading}
                    className={`w-full mt-2 py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-[15px] ${
                      mobile.length === 11 && !isLoading
                        ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        دریافت کد تایید <ArrowLeft size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* === مرحله ۲: کد تایید === */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      کد ۶ رقمی
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={18} />
                      </div>
                      <input
                        type="tel"
                        value={otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        placeholder="- - - - - -"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-center tracking-[1em] font-mono text-xl"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                      className="w-16 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl transition-all flex justify-center items-center shrink-0"
                    >
                      <ArrowRight size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={otp.length !== 6 || isLoading}
                      className={`flex-1 py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-[15px] shadow-lg ${
                        otp.length === 6 && !isLoading
                          ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-transparent"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        "بررسی کد"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* === مرحله ۳: تنظیم رمز عبور جدید === */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      رمز عبور جدید
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                      تکرار رمز عبور
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        dir="ltr"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pr-10 pl-3 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-left text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        setError("");
                      }}
                      className="w-16 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl transition-all flex justify-center items-center shrink-0"
                    >
                      <ArrowRight size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !password || !confirmPassword}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-[15px] shadow-lg shadow-slate-900/20"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        "ذخیره و ورود"
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
