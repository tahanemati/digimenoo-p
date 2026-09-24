import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu as MenuIcon } from "lucide-react";

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // 🔴 تم تاریک حذف شد و به bg-slate-50 و text-slate-800 تغییر یافت
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex font-sans"
      dir="rtl"
    >
      {/* دکمه منوی موبایل (هماهنگ با تم روشن) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 right-6 z-40 bg-white/80 p-2.5 rounded-xl border border-slate-200 text-slate-700 shadow-sm backdrop-blur-md hover:bg-slate-50 transition-colors"
      >
        <MenuIcon size={24} />
      </button>

      {/* سایدبار ثابت */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* بخش متغیر صفحه (Outlet) */}
      {/* 🔴 پدینگ‌های اضافه رو حذف کردم چون خود داشبورد پدینگ داره */}
      <main className="flex-1 lg:mr-72 h-screen overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full">
          <Outlet /> {/* صفحات مختلف اینجا لود میشن */}
        </div>
      </main>
    </div>
  );
};
