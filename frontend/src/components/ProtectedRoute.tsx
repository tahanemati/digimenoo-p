import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  // بررسی می‌کنیم که آیا توکن لاگین در مرورگر وجود دارد یا نه
  const token = localStorage.getItem("access_token");

  // اگر توکنی نبود (یا اشتباهاً undefined ذخیره شده بود)
  if (!token || token === "undefined") {
    // کاربر را به صفحه لاگین (مسیر اصلی '/') هدایت کن
    return <Navigate to="/" replace />;
  }

  // اگر توکن داشت، اجازه بده صفحه مورد نظر لود بشه
  return <Outlet />;
};
