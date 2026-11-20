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
