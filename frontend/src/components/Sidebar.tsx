import {
  LayoutDashboard,
  Store,
  CreditCard,
  Wallet,
  Headset,
  QrCode,
  LogOut,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation(); // گرفتن آدرس فعلی مرورگر

  const menuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      name: "داشبورد",
      icon: LayoutDashboard,
    },
    { id: "venues", path: "/venues", name: "رستوران‌ها", icon: Store },
    {
      id: "subscription",
      path: "/subscription",
      name: "اشتراک / تمدید",
      icon: CreditCard,
    },
    { id: "wallet", path: "/wallet", name: "کیف پول", icon: Wallet },
    { id: "support", path: "/support", name: "پشتیبانی", icon: Headset },
  ];

  // 🔴 تابع خروج از حساب
  const handleLogout = () => {
    // ۱. پاک کردن توکن کاربری از حافظه
    localStorage.removeItem("access_token");

    // (اگر توکن رفرش یا دیتای دیگه‌ای هم داری اینجا پاک کن)
    // localStorage.removeItem("refresh_token");

    // ۲. هدایت به صفحه اصلی و ریست کردن کامل برنامه
    window.location.href = "/";
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#030712] border-l border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                <QrCode className="text-gray-950" size={22} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Risto<span className="text-emerald-400">Pay</span>
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path; // بررسی فعال بودن تب
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={isActive ? "text-emerald-400" : "text-slate-500"}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <span className="text-sm font-bold text-emerald-400">ط</span>
              </div>
              <div className="flex-1 text-right">
                <div className="text-sm font-bold text-white">
                  مدیریت پلتفرم
                </div>
                <div className="text-xs text-slate-500">نسخه حرفه‌ای</div>
              </div>
              {/* 🔴 اتصال تابع خروج به دکمه */}
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 transition-colors"
                title="خروج از حساب"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
};
