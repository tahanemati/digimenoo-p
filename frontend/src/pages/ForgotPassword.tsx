import React, { useState, useEffect } from "react";
import {
  Phone,
  Lock,
  Loader2,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api";

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

const ToranjLogoMark: React.FC<{ className?: string }> = ({
  className = "w-8 h-8",
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="12" fill="url(#toranj_forgot_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_forgot_grad"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EA580C" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
  </svg>
);

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
      <div className="mb-2 apple-fade-1 flex items-center gap-3.5">
        <ToranjLogoMark className="w-12 h-12 shadow-lg shadow-orange-500/20" />
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            ترن<span className="text-orange-500">ج</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-bold">
            پلتفرم منوی دیجیتال هوشمند و اتوماسیون رستوران 
          </p>
        </div>
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
              <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  تایید هویت پیامکی
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ارسال کد یکبار مصرف (OTP) به شماره مالک مجموعه
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  const extractApiError = (err: any, fallback: string) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      err?.error ||
      fallback
    );
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
    if (val === "" || val.startsWith("0")) {
      if (val.length <= 11) {
        setMobile(val);
        if (error) setError("");
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = toEnglishDigits(e.target.value).replace(/[^0-9]/g, "");
    if (val.length <= 6) {
      setCode(val);
      if (error) setError("");
    }
  };

  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^09\d{9}$/.test(mobile)) {
      setError("لطفاً شماره موبایل معتبر ۱۱ رقمی (با شروع ۰۹) وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError("");
    setInfoMsg("");
    try {
      const res = await authApi.forgotPasswordRequest(mobile);
      setStep(2);
      setResendTimer(120);
      if (res?.message) {
        setInfoMsg(res.message);
      }
    } catch (err: any) {
      setError(extractApiError(err, "خطا در ارسال کد تایید."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      setError("کد تایید را کامل وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError("");
    setInfoMsg("");
    try {
      await authApi.forgotPasswordVerify(mobile, code);
      setStep(3);
    } catch (err: any) {
      setError(extractApiError(err, "کد وارد شده نامعتبر یا منقضی شده است."));
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
      setStep(4);
    } catch (err: any) {
      setError(extractApiError(err, "خطا در تغییر رمز عبور."));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
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
            className="flex items-center gap-2.5 text-xl font-black text-slate-900 tracking-tight"
          >
            <ToranjLogoMark className="w-8 h-8" />
            <span>
              ترن<span className="text-orange-500">ج</span>
            </span>
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
          <div className="w-full max-w-[360px] flex flex-col">
            {step !== 4 && (
              <div className="mb-8 apple-fade-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[11px] font-black mb-3">
                  مرحله {step.toLocaleString("fa-IR")} از ۳
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  {step === 1
                    ? "بازیابی رمز عبور"
                    : step === 2
                      ? "تایید کد پیامکی"
                      : "تنظیم رمز جدید"}
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                  {step === 1
                    ? "شماره موبایل ثبت‌شده خود را وارد کنید."
                    : step === 2
                      ? `کد ارسال‌شده به شماره ${mobile} را وارد کنید.`
                      : "رمز عبور جدید و ایمن برای حساب خود انتخاب کنید."}
                </p>
              </div>
            )}

            {error && step !== 4 && (
              <div className="w-full mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2.5 apple-fade-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && step === 2 && !error && (
              <div className="w-full mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2.5 apple-fade-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* مرحله ۱: دریافت شماره موبایل */}
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
                      placeholder="09123456789"
                      className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 dir-ltr text-left font-mono text-base placeholder:text-slate-400"
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

            {/* مرحله ۲: تایید کد پیامک شده */}
            {step === 2 && (
              <form
                className="w-full space-y-5 apple-fade-2"
                onSubmit={handleVerifyCode}
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    کد تایید ارسال‌شده
                  </label>
                  <input
                    type="tel"
                    value={code}
                    onChange={handleCodeChange}
                    maxLength={6}
                    placeholder="• • • • •"
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 px-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 dir-ltr text-center font-mono text-xl tracking-[0.45em] placeholder:tracking-widest placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={code.length < 4 || isLoading}
                    className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                      code.length >= 4 && !isLoading
                        ? "bg-slate-900 hover:bg-orange-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      "تایید کد و ادامه"
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setCode("");
                        setError("");
                      }}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors"
                    >
                      اصلاح شماره موبایل
                    </button>

                    {resendTimer > 0 ? (
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        ارسال مجدد تا {formatTimer(resendTimer)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleRequestCode()}
                        className="text-orange-600 hover:text-orange-700 text-xs font-black flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={13} />
                        <span>ارسال مجدد کد</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* مرحله ۳: ثبت رمز عبور جدید */}
            {step === 3 && (
              <form
                className="w-full space-y-5 apple-fade-2"
                onSubmit={handleResetPassword}
              >
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    رمز عبور جدید (حداقل ۶ کاراکتر)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-emerald-500">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-11 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 dir-ltr text-left font-mono text-base placeholder:text-slate-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
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
                      "ثبت رمز جدید و ورود"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* مرحله ۴: پیام موفقیت */}
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
                    رمز عبور حساب شما در ترنج با موفقیت بروزرسانی شد. اکنون
                    می‌توانید وارد شوید.
                  </p>
                </div>
                <button
                  type="button"
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
