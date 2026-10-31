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
import { authApi } from "../service/api";

// =======================
// انیمیشن‌های مینیمال و فیزیک نرم اپل
// =======================
const appleAnimations = `
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
// پنل گرافیکی (سمت چپ - خلوت و اصیل)
// =======================
const GraphicPanel = () => (
  <div className="hidden lg:flex w-1/2 bg-[#fafafa] relative items-center justify-center overflow-hidden border-r border-slate-200/70 select-none">
    {/* نورهای محیطی بسیار نرم */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#ffedd5,_transparent_55%)] opacity-70 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#f1f5f9,_transparent_55%)] pointer-events-none" />

    {/* گرید ظریف پس‌زمینه */}
    <div
      className="absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 w-full max-w-md flex flex-col gap-5 px-4">
      {/* عنوان برند */}
      <div className="mb-2 apple-fade-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          دیجی<span className="text-orange-500">منو</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">
          یکپارچه‌سازی منوی دیجیتال و اتوماسیون رستوران
        </p>
      </div>

      {/* کارت اصلی سفارشات زنده */}
      <div className="apple-fade-2">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white w-full apple-float-slow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                <ChefHat size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  سفارشات زنده آشپزخانه
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  همین الان بروزرسانی شد
                </p>
              </div>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100 transition-all duration-300 hover:border-orange-200/80 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-orange-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    میز شماره ۱۲
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    پیتزا پپرونی، سیب‌زمینی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-600 shadow-sm">
                <Clock size={14} className="text-orange-500" />
                در حال پخت
              </div>
            </div>

            <div className="bg-slate-50/80 hover:bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100 transition-all duration-300 hover:border-emerald-200/80 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-emerald-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    میز شماره ۰۵
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    پاستا آلفردو، موهیتو
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-600 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-500" />
                آماده تحویل
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* کارت‌های پایین */}
      <div className="flex gap-4 apple-fade-3">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-5 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white flex-1 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <TrendingUp size={16} className="text-orange-500" />
            <span className="text-xs font-bold text-slate-500">فروش امروز</span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            ۸,۴۵۰,۰۰۰{" "}
            <span className="text-xs font-medium text-slate-400">تومان</span>
          </div>
        </div>

        <div className="bg-orange-500 hover:bg-orange-600 rounded-3xl p-5 shadow-[0_12px_30px_rgba(249,115,22,0.22)] flex-1 text-white flex flex-col justify-center relative overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-bold">مدیریت مالی</span>
            <ChevronLeft
              size={18}
              className="opacity-80 group-hover:-translate-x-1 transition-transform duration-300"
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
  // 🔴 اتصال ضدگلوله به API بک‌اند .NET
  // =======================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 11 || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login({
        mobile: mobile,
        password: password,
      });

      // 🔴 استخراج امن اطلاعات (پشتیبانی از فرمت‌های مختلف C#)
      const resultData = response.data || response;
      const token =
        resultData.token ||
        resultData.Token ||
        resultData.accessToken ||
        resultData.Access_token;

      if (!token) {
        setError("لاگین انجام شد اما توکن امنیتی یافت نشد.");
        setIsLoading(false);
        return;
      }

      // ذخیره توکن‌ها
      localStorage.setItem("access_token", token);
      if (resultData.refreshToken || resultData.Refresh_token) {
        localStorage.setItem(
          "refresh_token",
          resultData.refreshToken || resultData.Refresh_token,
        );
      }

      // ذخیره نام و نقش
      localStorage.setItem(
        "role",
        resultData.role || resultData.Role || "owner",
      );
      localStorage.setItem(
        "user_name",
        resultData.fullName || resultData.UserName || "",
      );

      // 🔴 حیاتی: ذخیره شماره موبایل تا در صورتی که کاربر پروفایل نداشت، به صفحه Complete-Profile برود و آنجا ارور نگیرد.
      localStorage.setItem("registered_mobile", mobile);

      // ورود موفقیت‌آمیز و انتقال به داشبورد
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err.message ||
          err.detail ||
          err.error ||
          "شماره موبایل یا رمز عبور اشتباه است.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isReady = mobile.length === 11 && password.length > 0 && !isLoading;

  return (
    <div
      className="h-screen w-full bg-white flex font-sans text-slate-800 overflow-hidden"
      dir="rtl"
    >
      <style>{appleAnimations}</style>

      {/* سمت راست: فرم لاگین مینیمال */}
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white">
        {/* نوار بالا */}
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <Link
            to="/"
            className="text-xl font-black text-slate-900 tracking-tight"
          >
            دیجی<span className="text-orange-500">منو</span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-slate-400 hidden sm:block font-medium">
              حساب کاربری ندارید؟
            </span>
            <Link
              to="/register"
              className="text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-0.5 group"
            >
              ثبت‌نام کنید
              <ChevronLeft
                size={16}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>

        {/* مرکز فرم */}
        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[350px] flex flex-col">
            <div className="mb-8 apple-fade-1">
              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                خوش آمدید
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                برای دسترسی به داشبورد رستوران خود وارد شوید.
              </p>
            </div>

            {error && (
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 apple-fade-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            <form
              className="w-full space-y-5 apple-fade-2"
              onSubmit={handleLogin}
            >
              {/* شماره موبایل */}
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
                  />
                </div>
              </div>

              {/* رمز عبور */}
              <div className="group">
                <div className="flex justify-between items-center mb-2 mr-1">
                  <label className="block text-xs font-bold text-slate-500 transition-colors group-focus-within:text-slate-800">
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
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-orange-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 text-left font-mono text-base placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* دکمه ورود */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isReady}
                  className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                    isReady
                      ? "bg-slate-900 hover:bg-orange-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>ورود به حساب</span>
                      <ArrowRight
                        size={18}
                        className="rotate-180 transition-transform duration-300 group-hover:-translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* سمت چپ: پنل گرافیکی */}
      <GraphicPanel />
    </div>
  );
};
