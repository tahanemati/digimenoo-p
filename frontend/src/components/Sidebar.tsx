import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Wallet,
  Headset,
  Users,
  LogOut,
  X,
  Utensils,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { authApi } from "../service/api";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();

  // 🔴 استفاده از State برای داینامیک شدن اسم و نقش
  const [role, setRole] = useState(localStorage.getItem("role") || "owner");
  const [userName, setUserName] = useState(
    localStorage.getItem("user_name") &&
      localStorage.getItem("user_name") !== "null"
      ? localStorage.getItem("user_name")!
      : "همکار عزیز",
  );

  // 🔴 هوشمندسازی سایدبار: گرفتن اسم به صورت مستقیم از بک‌اند بدون نیاز به تغییر فایل‌های لاگین
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await authApi.getDashboardStatus();
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem("user_name", data.name);
        }
        if (data.role) {
          setRole(data.role);
          localStorage.setItem("role", data.role);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات کاربر برای سایدبار:", error);
      }
    };

    fetchUserData();
  }, []);

  // حرف اول اسم برای آواتار
  const userInitial = userName.charAt(0);

  const menuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      name: "داشبورد",
      icon: LayoutDashboard,
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"],
    },
    {
      id: "ProductManagement",
      path: "/products",
      name: "مدیریت محصولات",
      icon: Store,
      allowedRoles: ["owner"],
    },
    {
      id: "TeamManagement",
      path: "/team",
      name: "مدیریت تیم",
      icon: Users,
      allowedRoles: ["owner"],
      comingSoon: true,
    },
    {
      id: "venues",
      path: "/venues",
      name: "رستوران‌ها",
      icon: Store,
      allowedRoles: ["owner"],
    },
    {
      id: "subscription",
      path: "/subscription",
      name: "اشتراک و تمدید",
      icon: CreditCard,
      allowedRoles: ["owner"],
    },
    {
      id: "wallet",
      path: "/wallet",
      name: "کیف پول",
      icon: Wallet,
      allowedRoles: ["owner"],
      comingSoon: true,
    },
    {
      id: "support",
      path: "/support",
      name: "پشتیبانی زنده",
      icon: Headset,
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"],
    },
  ];

  const handleLogout = () => {
    // انیمیشن خروج نرم
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "/";
    }, 400);
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[280px] bg-white/70 backdrop-blur-2xl border-l border-white/40 shadow-[-20px_0_40px_rgba(0,0,0,0.04)] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* افکت نوری پس زمینه سایدبار */}
        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />

        <div className="flex-1 flex flex-col p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* ========================================== */}
          {/* لوگو و هدر سایدبار */}
          {/* ========================================== */}
          <div className="flex items-center justify-between mb-8 mt-2 px-2 relative z-10">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-orange-500/30 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
                <Utensils className="text-white" size={22} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[22px] font-black text-slate-800 tracking-tight leading-none">
                  Digi-<span className="text-orange-500">Menoo</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">
                  Management Panel
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* ========================================== */}
          {/* منوی ناوبری */}
          {/* ========================================== */}
          <nav className="flex-1 space-y-1.5 relative z-10">
            {menuItems.map((item) => {
              if (!item.allowedRoles.includes(role)) return null;

              if (item.comingSoon) {
                return (
                  <div
                    key={item.id}
                    className="group w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] text-sm font-bold text-slate-400 bg-slate-50/50 opacity-70 cursor-not-allowed select-none border border-transparent transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        strokeWidth={2}
                        className="opacity-50"
                      />
                      {item.name}
                    </div>
                    <div className="bg-slate-200 text-slate-500 text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 group-hover:bg-slate-300 transition-colors">
                      <Sparkles size={10} /> بزودی
                    </div>
                  </div>
                );
              }

              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] transition-all duration-300 text-sm font-black overflow-hidden ${
                    isActive
                      ? "bg-white text-orange-600 shadow-[0_8px_20px_rgb(249,115,22,0.08)] border border-orange-100/50 scale-[1.02]"
                      : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent"
                  }`}
                >
                  {/* خط رنگی نشانگر حالت فعال (راست چین) */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l-full shadow-[0_0_10px_rgb(249,115,22,0.5)]"></div>
                  )}

                  <div className="flex items-center gap-3 transition-transform duration-300 group-hover:-translate-x-1">
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-orange-500"
                          : "text-slate-400 group-hover:text-slate-600"
                      } group-hover:scale-110`}
                    />
                    {item.name}
                  </div>

                  {!isActive && (
                    <ChevronLeft
                      size={16}
                      className="text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ========================================== */}
          {/* کارت پروفایل و خروج (Sticky Bottom) */}
          {/* ========================================== */}
          <div className="mt-8 pt-4 relative z-10">
            <div className="bg-white border border-slate-100 p-2.5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden pr-1">
                {/* آواتار هوشمند */}
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-sm font-black text-white uppercase">
                    {userInitial}
                  </span>
                </div>

                <div className="flex flex-col truncate">
                  <span
                    className="text-[13px] font-black text-slate-800 truncate"
                    title={userName}
                  >
                    {userName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    {role === "owner"
                      ? "مدیر کل مجموعه"
                      : role === "cashier"
                        ? "مسئول صندوق"
                        : role === "kitchen"
                          ? "مدیریت آشپزخانه"
                          : "نیروی سالن (گارسون)"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                title="خروج از حساب کاربری"
              >
                <LogOut
                  size={18}
                  strokeWidth={2.5}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay (پس‌زمینه تاریک موبایل) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        />
      )}
    </>
  );
};
