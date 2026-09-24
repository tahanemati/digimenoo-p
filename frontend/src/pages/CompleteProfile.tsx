import React, { useState } from "react";
import {
  Lock,
  Loader2,
  User,
  ShieldCheck,
  CheckCircle2,
  Utensils,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../service/api"; // 🔴 اتصال به API

// =======================
// پنل گرافیکی پرمیوم (سمت چپ) - موکاپ پروفایل کاربری امن
// =======================
const GraphicPanel = ({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) => (
  <div className="hidden lg:flex w-1/2 bg-[#fafafa] relative items-center justify-center overflow-hidden border-l border-slate-200">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#ffedd5,_transparent_50%)] opacity-70"></div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_#dcfce7,_transparent_50%)] opacity-50"></div>

    <div
      className="absolute inset-0 opacity-[0.3]"
      style={{
        backgroundImage:
          "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 w-full max-w-md flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 items-center">
      <div className="bg-white/70 backdrop-blur-2xl rounded-[40px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white w-full max-w-[340px] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-400 to-orange-500 opacity-90"></div>
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/30 text-white text-[10px] font-bold">
          <ShieldCheck size={14} /> حساب امن
        </div>

        <div className="relative z-10 mt-6 flex justify-center mb-6">
          <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-orange-500 text-3xl font-black">
              {firstName ? (
                firstName.charAt(0)
              ) : (
                <User size={40} className="text-slate-300" strokeWidth={1.5} />
              )}
            </div>
          </div>
        </div>

        <div className="text-center relative z-10 mb-8">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
            {firstName || lastName
              ? `${firstName} ${lastName}`
              : "مدیر رستوران"}
          </h3>
          <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-1.5">
            مالک حساب MenuJet{" "}
            <CheckCircle2 size={14} className="text-emerald-500" />
          </p>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-xs font-bold text-slate-600">
              تایید شماره موبایل
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Lock size={16} />
            </div>
            <p className="text-xs font-bold text-slate-600">
              ایجاد رمز عبور امن
            </p>
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
  // 🔴 اتصال به API تکمیل پروفایل
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
    if (password.length < 4) {
      setError("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // ارسال اطلاعات به بک‌اند جنگو
      await authApi.completeRegistration({
        first_name: firstName,
        last_name: lastName,
        password: password,
      });

      // بعد از ثبت موفقیت‌آمیز، کاربر را به داشبورد می‌فرستیم
      // داشبورد به صورت اتوماتیک تشخیص می‌دهد که پروفایل تکمیل شده و قفل مرحله ۲ را باز می‌کند.
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.error ||
          err.detail ||
          err.message ||
          "خطا در ثبت اطلاعات. لطفاً مجدداً تلاش کنید.",
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
      <div className="w-full lg:w-1/2 h-full flex flex-col relative bg-white shadow-[10px_0_40px_rgba(0,0,0,0.03)] lg:shadow-none z-20">
        <div className="w-full px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Utensils className="text-white" size={18} />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">
              Menu<span className="text-orange-500">Jet</span>
            </span>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center px-6 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="w-full max-w-[380px] flex flex-col pb-10">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                تکمیل اطلاعات حساب
              </h1>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                ثبت‌نام شما تقریباً تمام شده است! برای امنیت بیشتر و شناسایی در
                سیستم، اطلاعات زیر را تکمیل کنید.
              </p>
            </div>

            {error && (
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in-95">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></div>
                {error}
              </div>
            )}

            <form className="w-full space-y-4" onSubmit={handleCompleteProfile}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    نام
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="علی"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pr-10 pl-3 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="رضایی"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                  رمز عبور امن
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
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-left font-mono text-base placeholder:font-sans placeholder:text-right shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">
                  تکرار رمز عبور
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
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3.5 pr-11 pl-4 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-left font-mono text-base placeholder:font-sans placeholder:text-right shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  !firstName ||
                  !lastName ||
                  !password ||
                  !confirmPassword ||
                  isLoading
                }
                className={`w-full mt-6 py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-2 text-[15px] ${
                  firstName &&
                  lastName &&
                  password &&
                  confirmPassword &&
                  !isLoading
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    تایید و ورود به پلتفرم{" "}
                    <ArrowRight size={18} className="rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <GraphicPanel firstName={firstName} lastName={lastName} />
    </div>
  );
};
