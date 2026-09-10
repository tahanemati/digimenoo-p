import { useState } from "react";
import {
  QrCode,
  ArrowRight,
  Phone,
  KeyRound,
  Lock,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val === "" || val.startsWith("0")) {
      if (val.length <= 11) setMobile(val);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= 5) setOtp(val);
  };

  // =======================
  // توابع ارتباط با سرور
  // =======================

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPasswordSendOtp(mobile);
      setStep(2);
    } catch (err: any) {
      setError(
        err.phone_number?.[0] ||
          err.non_field_errors?.[0] ||
          "کاربری با این شماره یافت نشد.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      await authApi.forgotPasswordVerifyOtp(mobile, otp);
      setStep(3);
    } catch (err: any) {
      setError(err.non_field_errors?.[0] || "کد وارد شده نامعتبر است.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    if (!password) {
      setError("لطفاً رمز عبور را وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await authApi.resetPassword({
        phone_number: mobile,
        password: password,
      });

      alert("رمز عبور شما با موفقیت تغییر کرد! حالا می‌توانید وارد شوید.");
      navigate("/login");
    } catch (err: any) {
      setError("خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // پنل گرافیکی ثابت (لایت مود)
  // =======================
  const LeftPanel = () => (
    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-l border-slate-200 p-12 flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-lg">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm mb-8">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
          رمزت رو فراموش کردی؟ <br />
          <span className="text-emerald-500">جای نگرانی نیست!</span>
        </h2>
        <p className="text-lg text-slate-500 mb-8 font-medium">
          ما در ۳ مرحله ساده حسابت رو برمی‌گردونیم.
        </p>
        <div className="space-y-6 text-slate-600 leading-relaxed font-medium">
          <p className="flex gap-3 items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              ۱
            </span>
            شماره موبایلی که باهاش ثبت‌نام کردی رو وارد کن.
          </p>
          <p className="flex gap-3 items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              ۲
            </span>
            کد پیامک شده به گوشیت رو تایید کن.
          </p>
          <p className="flex gap-3 items-center">
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
              ۳
            </span>
            یک رمز عبور جدید و قوی انتخاب کن.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800" dir="rtl">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-white lg:bg-transparent">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
            <QrCode className="text-emerald-500" size={28} />
            <span className="text-2xl font-black text-slate-900">
              Menu<span className="text-emerald-500">Jet</span>
            </span>
          </div>

          <div className="mb-8 text-center lg:text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              بازیابی رمز عبور
            </h1>
            <p className="text-slate-500 text-sm">
              مرحله {step} از ۳:{" "}
              {step === 1
                ? "شماره موبایل"
                : step === 2
                  ? "تایید شماره"
                  : "رمز عبور جدید"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold animate-in fade-in flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-8">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-emerald-500" : "bg-slate-200"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-emerald-500" : "bg-slate-200"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-emerald-500" : "bg-slate-200"}`}
            />
          </div>

          <form
            className="space-y-6"
            onSubmit={
              step === 3 ? handleResetPassword : (e) => e.preventDefault()
            }
          >
            {/* مرحله ۱: موبایل */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  شماره موبایل خود را وارد کنید
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    maxLength={11}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all dir-ltr text-left font-mono text-lg placeholder:font-sans placeholder:text-right shadow-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={mobile.length !== 11 || isLoading}
                  className={`w-full mt-6 py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 ${
                    mobile.length === 11 && !isLoading
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      ارسال کد تایید <ArrowLeft size={18} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* مرحله ۲: کد تایید */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  کد پیامک شده را وارد کنید
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={20} />
                  </div>
                  <input
                    type="tel"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={5}
                    placeholder="- - - - -"
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-center tracking-[1em] font-mono text-xl shadow-sm"
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all flex justify-center items-center"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 5 || isLoading}
                    className={`w-2/3 py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 ${
                      otp.length === 5 && !isLoading
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "تایید کد"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* مرحله ۳: تغییر رمز */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    رمز عبور جدید
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 pr-10 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-left shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تکرار رمز عبور جدید
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      dir="ltr"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 pr-10 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-left shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "تغییر و ثبت رمز عبور"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            رمز عبور یادتان آمد؟{" "}
            <Link
              to="/login"
              className="text-emerald-600 font-bold hover:text-emerald-500 hover:underline"
            >
              بازگشت به ورود
            </Link>
          </p>
        </div>
      </div>
      <LeftPanel />
    </div>
  );
};
