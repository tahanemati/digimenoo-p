import React, { useState } from "react";
import {
  Lock,
  Loader2,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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
// پنل گرافیکی مینیمال (سمت چپ)
// =======================
const GraphicPanel = ({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) => (
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
      <div className="mb-2 apple-fade-1 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold mb-3">
          <ShieldCheck size={13} />
          <span>امنیت حساب کاربری</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          پروفایل مدیریت
        </h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">
          دسترسی یکپارچه به تمامی ابزارهای مدیریتی دیجی‌منو
        </p>
      </div>

      <div className="apple-fade-2">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-[0_12px_40px_rgb(0,0,0,0.04)] border border-white w-full max-w-[340px] mx-auto apple-float-slow">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/25 border-4 border-white">
                {firstName ? (
                  firstName.charAt(0)
                ) : (
                  <User size={32} strokeWidth={2} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                <CheckCircle2 size={12} />
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">
              {firstName || lastName
                ? `${firstName} ${lastName}`
                : "مدیر مجموعه"}
            </h3>
            <p className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
              مالک حساب (Owner)
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-bold text-slate-700">
                موبایل تایید شد
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm border border-slate-100/50">
                <Lock size={16} />
              </div>
              <p className="text-xs font-bold text-slate-700">
                تخصیص رمز عبور امن
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CompleteProfile = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // =======================
  // 🔴 ارسال به بک‌اند (نسخه حرفه‌ای با Auto-Login)
  // =======================
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !password || !confirmPassword) {
      setError("لطفاً تمامی فیلدها را پر کنید.");
      return;
    }
    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }
    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    const realMobile = localStorage.getItem("registered_mobile");
    if (!realMobile) {
      setError("شماره موبایل یافت نشد! لطفاً مجدداً وارد شوید.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // ۱. ثبت اطلاعات کاربر در دیتابیس
      const completeRes = await authApi.completeRegistration({
        mobile: realMobile,
        name: firstName,
        lastName: lastName,
        password: password,
        confirmPassword: confirmPassword,
      });

      const completeData = completeRes.data || completeRes;
      let token =
        completeData?.token ||
        completeData?.Token ||
        completeData?.accessToken ||
        completeData?.access_token;
      let refresh =
        completeData?.refreshToken ||
        completeData?.refresh_token ||
        completeData?.RefreshToken;

      // 🔴 ۲. عملیات لاگین خودکار (Auto-Login)
      // اگر دات‌نت بعد از تکمیل پروفایل توکنی نداد، ما خودمون با پسوردی که الان ساختیم لاگین می‌کنیم!
      if (!token) {
        console.log("در حال لاگین خودکار برای دریافت توکن اصلی...");
        const loginRes = await authApi.login({
          mobile: realMobile,
          password: password, // همون پسوردی که کاربر تو فیلد بالا وارد کرده
        });

        const loginData = loginRes.data || loginRes;
        token =
          loginData?.token ||
          loginData?.Token ||
          loginData?.accessToken ||
          loginData?.access_token;
        refresh =
          loginData?.refreshToken ||
          loginData?.refresh_token ||
          loginData?.RefreshToken;

        // ذخیره نقش کاربر (از لاگین)
        localStorage.setItem(
          "role",
          loginData?.role || loginData?.Role || "owner",
        );
      }

      // ۳. ذخیره توکن دائمی
      if (token) {
        localStorage.setItem("access_token", token);
      } else {
        throw new Error("خطا در دریافت توکن. لطفاً از صفحه ورود لاگین کنید.");
      }

      if (refresh) {
        localStorage.setItem("refresh_token", refresh);
      }

      localStorage.setItem("user_name", `${firstName} ${lastName}`);

      // پاک‌سازی
      localStorage.removeItem("registered_mobile");

      // ۴. ورود مقتدرانه به داشبورد
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err.message ||
          err.detail ||
          err.error ||
          "خطا در برقراری ارتباط با سرور.",
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

      {/* سمت راست: فرم تکمیل پروفایل مینیمال */}
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white">
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <Link
            to="/"
            className="text-xl font-black text-slate-900 tracking-tight"
          >
            دیجی<span className="text-orange-500">منو</span>
          </Link>
          <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
            مرحله نهایی
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[380px] flex flex-col pb-10">
            <div className="mb-8 apple-fade-1">
              <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                تکمیل اطلاعات حساب
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                ثبت‌نام شما تقریباً تمام شده است! برای امنیت بیشتر، مشخصات خود
                را وارد کنید.
              </p>
            </div>

            {error && (
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 apple-fade-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
                {error}
              </div>
            )}

            <form
              className="w-full space-y-4 apple-fade-2"
              onSubmit={handleCompleteProfile}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* نام */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    نام
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-orange-500">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="علی"
                      className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-3 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* نام خانوادگی */}
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="رضایی"
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* رمز عبور */}
              <div className="group pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                  رمز عبور امن
                </label>
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
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 text-left font-mono text-base placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* تکرار رمز عبور */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 mb-2 mr-1 transition-colors group-focus-within:text-slate-800">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 transition-colors duration-300 group-focus-within:text-orange-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 rounded-2xl py-4 pr-11 pl-4 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 text-left font-mono text-base placeholder:font-sans placeholder:text-right placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* دکمه ارسال */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={
                    !firstName ||
                    !lastName ||
                    !password ||
                    !confirmPassword ||
                    isLoading
                  }
                  className={`group w-full py-4 rounded-2xl font-bold transition-all duration-300 flex justify-center items-center gap-2 text-[15px] ${
                    firstName &&
                    lastName &&
                    password &&
                    confirmPassword &&
                    !isLoading
                      ? "bg-slate-900 hover:bg-emerald-500 text-white shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] hover:-translate-y-0.5 active:scale-[0.98]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>تایید و ورود به پلتفرم</span>
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

      {/* سمت چپ: پنل گرافیکی اختصاصی */}
      <GraphicPanel firstName={firstName} lastName={lastName} />
    </div>
  );
};
