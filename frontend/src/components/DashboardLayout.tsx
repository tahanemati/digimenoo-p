import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu as MenuIcon } from "lucide-react";

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex" dir="rtl">
      {/* دکمه منوی موبایل */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 right-6 z-40 bg-white/5 p-2 rounded-xl border border-white/10 text-white backdrop-blur-md"
      >
        <MenuIcon size={24} />
      </button>

      {/* سایدبار ثابت */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* بخش متغیر صفحه (Outlet) */}
      <main className="flex-1 lg:mr-72 p-6 md:p-10 pt-24 lg:pt-10 h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet /> {/* صفحات مختلف مثل داشبورد یا کیف پول اینجا لود میشن */}
        </div>
      </main>
    </div>
  );
};
