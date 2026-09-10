import { QrCode } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingHeader = () => {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header className="w-full max-w-6xl h-20 bg-white/80 backdrop-blur-2xl border border-zinc-200/80 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-between px-6 lg:px-8 pointer-events-auto transition-all">
        {/* بخش لوگو */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
            <QrCode className="text-white" size={22} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black text-zinc-900 tracking-tight hidden sm:block">
            منو<span className="text-emerald-500"> جت </span>
          </span>
        </div>

        {/* منوی ناوبری وسط */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-500">
          <a
            href="#how-it-works"
            className="hover:text-emerald-500 hover:scale-105 transition-all"
          >
            چطور کار میکنه؟
          </a>
          <a
            href="#advantages"
            className="hover:text-emerald-500 hover:scale-105 transition-all"
          >
            مزایا
          </a>
          <a
            href="#demo"
            className="hover:text-emerald-500 hover:scale-105 transition-all"
          >
            ظاهر منو
          </a>
          <a
            href="#pricing"
            className="hover:text-emerald-500 hover:scale-105 transition-all"
          >
            تعرفه‌ها
          </a>
        </nav>

        {/* دکمه‌های ورود و ثبت‌نام */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-zinc-600 hover:text-zinc-900 font-bold text-sm px-2 sm:px-4 transition-colors"
          >
            ورود
          </Link>
          <Link
            to="/register"
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            ثبت‌نام رایگان
          </Link>
        </div>
      </header>
    </div>
  );
};
