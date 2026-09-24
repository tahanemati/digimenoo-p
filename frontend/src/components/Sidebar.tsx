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
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) => {
  const location = useLocation();

  // 🔴 گرفتن نقش (Role) و نام کاربر از مرورگر
  const role = localStorage.getItem("role") || "owner";
  const userName = localStorage.getItem("user_name") || "همکار عزیز";

  // 🔴 اضافه کردن allowedRoles برای محدود کردن دسترسی پرسنل
  const menuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      name: "داشبورد",
      icon: LayoutDashboard,
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"], // همه داشبورد اختصاصی خودشان را دارند
    },
    {
      id: "ProductManagement",
      path: "/products",
      name: "مدیریت محصولات",
      icon: Store,
      allowedRoles: ["owner"], // فقط مدیر
    },
    {
      id: "TeamManagement",
      path: "/team",
      name: "مدیریت تیم",
      icon: Users,
      allowedRoles: ["owner"], // فقط مدیر
    },
    {
      id: "venues",
      path: "/venues",
      name: "رستوران‌ها",
      icon: Store,
      allowedRoles: ["owner"], // فقط مدیر
    },
    {
      id: "subscription",
      path: "/subscription",
      name: "اشتراک / تمدید",
      icon: CreditCard,
      allowedRoles: ["owner"], // فقط مدیر
    },
    {
      id: "wallet",
      path: "/wallet",
      name: "کیف پول",
      icon: Wallet,
      allowedRoles: ["owner"], // فقط مدیر
    },
    {
      id: "support",
      path: "/support",
      name: "پشتیبانی",
      icon: Headset,
      allowedRoles: ["owner", "cashier", "kitchen", "waiter"], // همه می‌توانند به پشتیبانی پیام دهند
    },
  ];

  const handleLogout = () => {
    // 🔴 رفع باگ آنبوردینگ: این دستور کل ردپاهای مرورگر (توکن، رول و...) را کاملاً پاک می‌کند
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white/80 backdrop-blur-2xl border-l border-slate-200 shadow-[10px_0_40px_rgba(0,0,0,0.03)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          {/* هدر سایدبار - لوگو */}
          <div className="flex items-center justify-between mb-10 mt-2 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <Utensils className="text-white" size={20} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                Menu<span className="text-orange-500">Jet</span>
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-orange-500 transition-colors bg-slate-50 p-1.5 rounded-lg border border-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* منوی لینک‌ها */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              // 🔴 اگر رول کاربر تو لیست مجازِ این منو نبود، اصلاً رندرش نکن
              if (!item.allowedRoles.includes(role)) return null;

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-sm font-bold ${
                    isActive
                      ? "bg-orange-50 text-orange-600 shadow-sm border border-orange-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                  }`}
                >
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? "text-orange-500" : "text-slate-400"}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* بخش پروفایل و خروج (پایین سایدبار) */}
          <div className="pt-6 border-t border-slate-200 mt-auto">
            <div className="flex items-center gap-3 px-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200 shrink-0">
                {/* گرفتن حرف اول اسم کاربر */}
                <span className="text-sm font-black text-orange-600">
                  {userName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 text-right truncate">
                <div className="text-sm font-bold text-slate-800 truncate">
                  {userName}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {role === "owner"
                    ? "نسخه حرفه‌ای"
                    : role === "cashier"
                      ? "صندوق‌دار"
                      : role === "kitchen"
                        ? "آشپزخانه"
                        : "گارسون"}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
                title="خروج از حساب"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay برای موبایل */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}
    </>
  );
};
