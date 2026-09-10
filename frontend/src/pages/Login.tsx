import { useState } from "react";
import {
  QrCode,
  RefreshCw,
  Palette,
  Smile,
  Phone,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../service/api";

export const Login = () => {
  const navigate = useNavigate();

  // استیت‌های فرم
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  // استیت‌های وضعیت
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // فیلتر کردن ورودی موبایل
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val === "" || val.startsWith("0")) {
      if (val.length <= 11) setMobile(val);
    }
  };

  // ارسال ریکوئست لاگین
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

      // ذخیره توکن‌های احراز هویت
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // هدایت کاربر به صفحه داشبورد
      navigate("/dashboard");
    } catch (err: any) {
      if (err.detail) {
        setError("شماره موبایل یا رمز عبور اشتباه است.");
      } else {
        setError("ارتباط با سرور برقرار نشد. لطفاً اینترنت خود را بررسی کنید.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // پنل گرافیکی ثابت (سمت چپ) - لایت مود
  // =======================
  const LeftPanel = () => (
    <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-l border-slate-200 p-12 flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-lg">
        <h2 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
          شروع حرفه‌ای برای <br />
          <span className="text-emerald-500">رستوران و کافه</span>
        </h2>
        <p className="text-lg text-slate-500 mb-12 font-medium">
          عضویت در پلتفرم MenuJet
        </p>
        <p className="text-slate-600 leading-relaxed mb-10 text-justify">
          با عضویت در پلتفرم ما، منوی خود را آنلاین کنید، قیمت‌ها و آیتم‌ها را
          سریع تغییر دهید و برای هر میز QR کد اختصاصی بسازید. همه‌چیز با پنل
          مدیریت لوکس و ریسپانسیو.
        </p>
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold mb-1">
                QR کدهای آماده و شیک
              </h3>
              <p className="text-sm text-slate-500">
                برای میزها یا لینک‌ها، با ظاهر حرفه‌ای و سریع.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold mb-1">
                بروزرسانی لحظه‌ای منو
              </h3>
              <p className="text-sm text-slate-500">
                آیتم‌ها و قیمت‌ها را سریع تغییر دهید؛ همیشه به‌روز.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold mb-1">
                تم‌ساز و ظاهر برندینگ
              </h3>
              <p className="text-sm text-slate-500">
                منویی هماهنگ با رنگ و سبک رستوران/کافه شما.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              <Smile size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold mb-1">
                تجربهٔ مشتری بهتر
              </h3>
              <p className="text-sm text-slate-500">
                اسکن، انتخاب، سفارش — سریع و شفاف.
              </p>
            </div>
          </div>
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

          <div className="mb-10 text-center lg:text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              ورود به پنل
            </h1>
            <p className="text-slate-500 text-sm">
              برای مدیریت رستوران خود وارد شوید.
            </p>
          </div>

          {/* ارور باکس */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold animate-in fade-in flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                شماره موبایل
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
                  placeholder="09127772211"
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all dir-ltr text-left font-mono text-lg placeholder:font-sans placeholder:text-right shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  رمز عبور
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-600 hover:text-emerald-500 hover:underline font-medium"
                >
                  فراموشی رمز؟
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-4 pr-12 pl-4 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-left shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={mobile.length !== 11 || !password || isLoading}
              className={`w-full mt-4 py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 ${
                mobile.length === 11 && password && !isLoading
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  ورود به سیستم <ArrowLeft size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            هنوز ثبت‌نام نکرده‌اید؟{" "}
            <Link
              to="/register"
              className="text-emerald-600 font-bold hover:text-emerald-500 hover:underline"
            >
              ساخت حساب جدید
            </Link>
          </p>
        </div>
      </div>
      <LeftPanel />
    </div>
  );
};
