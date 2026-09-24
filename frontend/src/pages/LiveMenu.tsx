import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "../service/api";
import { Loader2, AlertCircle } from "lucide-react";

// 🔴 ایمپورت قالب‌ها (دموهای بعدی را هم به مرور اینجا اضافه می‌کنی)
import { OneDemo } from "../pages/demos/OneDemo";
// import { TwoDemo } from "./templates/TwoDemo";
// import { ThreeDemo } from "./templates/ThreeDemo";

export const LiveMenu = () => {
  // گرفتن آدرس از URL (مثلاً cafe-dena)
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        if (slug) {
          // دریافت اطلاعات رستوران بدون نیاز به توکن ورود
          const data = await publicApi.getLiveMenu(slug);
          setMenuData(data);
        }
      } catch (err: any) {
        setError(
          err.error || "منویی با این آدرس یافت نشد یا هنوز فعال نشده است.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  // 1. وضعیت بارگذاری (Loading)
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-orange-500 gap-4">
        <Loader2 className="animate-spin" size={48} strokeWidth={2.5} />
        <p className="font-black text-slate-400 animate-pulse text-sm">
          در حال بارگذاری منو...
        </p>
      </div>
    );
  }

  // 2. وضعیت خطا (رستوران پیدا نشد یا غیرفعال است)
  if (error || !menuData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4 p-6 text-center"
        dir="rtl"
      >
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-2">
          <AlertCircle size={48} className="text-rose-400 opacity-80" />
        </div>
        <h1 className="text-2xl font-black text-slate-800">
          خطا در دریافت منو
        </h1>
        <p className="font-bold text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          {error}
        </p>
      </div>
    );
  }

  // 3. توزیع‌کننده قالب‌ها (Switch)
  // بر اساس template_id که مدیر در پنل خود ثبت کرده، قالب مناسب را رندر می‌کند
  switch (menuData.template_id) {
    case "onedemo":
      return <OneDemo data={menuData} />;

    case "twodemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب مینیمال (دمو ۲) در حال ساخت است...
        </div>
      );

    case "threedemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب سفارشی (دمو ۳) در حال ساخت است...
        </div>
      );

    case "fourdemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب سایدبار (دمو ۴) در حال ساخت است...
        </div>
      );

    case "fivedemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب لندینگ (دمو ۵) در حال ساخت است...
        </div>
      );

    case "sixdemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب استوری (دمو ۶) در حال ساخت است...
        </div>
      );

    case "sevendemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب کشویی (دمو ۷) در حال ساخت است...
        </div>
      );

    case "eightdemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب روزنامه (دمو ۸) در حال ساخت است...
        </div>
      );

    case "ninedemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب سوپر اپ (دمو ۹) در حال ساخت است...
        </div>
      );

    case "tendemo":
      return (
        <div className="min-h-screen flex items-center justify-center font-black text-slate-400">
          قالب بنتو (دمو ۱۰) در حال ساخت است...
        </div>
      );

    default:
      // اگر به هر دلیلی قالبی در دیتابیس ست نشده بود، پیش‌فرض دمو اول را لود کن
      return <OneDemo data={menuData} />;
  }
};

export default LiveMenu;
