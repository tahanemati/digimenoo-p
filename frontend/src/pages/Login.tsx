import React, { useState } from "react";
import {
  Phone,
  Lock,
  Loader2,
  TrendingUp,
  ChefHat,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api"; // اتصال به بک‌‌اند

// =======================
// پنل گرافیکی پرمیوم (سمت چپ)
// =======================
const GraphicPanel = () => (
  <div className="hidden lg:flex w-1/2 bg-[#fafafa] relative items-center justify-center overflow-hidden border-l border-slate-200">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#ffedd5,_transparent_50%)] opacity-70"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#f1f5f9,_transparent_50%)]"></div>
    <div
      className="absolute inset-0 opacity-[0.2]"
      style={{
        backgroundImage:
          "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="mb-4">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
          Menu<span className="text-orange-500">Jet</span> Platform
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          یکپارچه‌سازی منوی دیجیتال و اتوماسیون رستوران
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <ChefHat size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                سفارشات زنده آشپزخانه
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                همین الان بروزرسانی شد
              </p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
          </span>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 transition-colors hover:border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-400 rounded-full"></div>
              <div>
                <p className="text-sm font-bold text-slate-800">میز شماره ۱۲</p>
                <p className="text-xs text-slate-500">
                  پیتزا پپرونی، سیب‌زمینی
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
              <Clock size={14} className="text-orange-500" />
              در حال پخت
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-400 rounded-full"></div>
              <div>
                <p className="text-sm font-bold text-slate-800">میز شماره ۰۵</p>
                <p className="text-xs text-slate-500">پاستا آلفردو، موهیتو</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
              <CheckCircle2 size={14} className="text-emerald-500" />
              آماده تحویل
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-1">
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <TrendingUp size={16} />
            <span className="text-xs font-bold">فروش امروز</span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            ۸,۴۵۰,۰۰۰{" "}
            <span className="text-sm font-medium text-slate-400">تومان</span>
          </div>
        </div>

        <div className="bg-orange-500 rounded-3xl p-5 shadow-[0_8px_30px_rgba(249,115,22,0.2)] flex-1 text-white flex flex-col justify-center relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold">مدیریت مالی</span>
            <ChevronLeft
              size={18}
              className="opacity-70 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Login = () => {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
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

  // =======================
  // 🔴 ورود با موبایل و رمز عبور (API)
  // =======================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 11 || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await authApi.login({
        phone_number: mobile,
        password: password,
      });

      // 🔴 رفع باگ: ذخیره دقیق کلمات کلیدی توکن و رول
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role || "owner"); // حتماً باید رول ذخیره شود

      // 🔴 انتقال به داشبورد با رفرش کامل صفحه برای خوانده شدن توکن جدید
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err.detail || err.error || "شماره موبایل یا رمز عبور اشتباه است.",
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
            <span className="text-slate-500 hidden sm:block">
              حساب کاربری ندارید؟
            </span>
            <Link
              to="/register"
              className="text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
            >
              ثبت‌نام کنید <ChevronLeft size={16} />
            </Link>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[360px] flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                خوش آمدید!
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                برای دسترسی به داشبورد رستوران خود وارد شوید.
              </p>
            </div>

            {error && (
              <div className="w-full mb-6 p-3.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold flex items-center gap-3 animate-in fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            <form className="w-full space-y-4" onSubmit={handleLogin}>
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

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-slate-500">
                    رمز عبور
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-orange-500 hover:text-orange-600 font-bold transition-colors"
                  >
                    فراموشی رمز؟
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-left font-mono text-base placeholder:font-sans placeholder:text-right"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={mobile.length !== 11 || !password || isLoading}
                className={`w-full mt-2 py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-[15px] ${
                  mobile.length === 11 && password && !isLoading
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    ورود به حساب <ArrowRight size={18} className="rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400">
                  یا ورود با
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 shadow-sm"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.8 3.57-.84 1.56-.05 2.92.8 3.72 2.04-3.32 1.94-2.73 6.44.48 7.74-.75 1.25-1.52 2.47-2.85 3.23zm-3.66-14c.2-1.92-1.46-3.61-3.35-3.8-1.07 2.06.66 3.93 3.35 3.8z" />
                  </svg>
                  Apple
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GraphicPanel />
    </div>
  );
};
