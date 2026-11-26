import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Search,
  ArrowRight,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  EyeOff,
  Server,
  CreditCard,
  Users,
  KeyRound,
  UserCheck,
  Mail,
  PhoneCall,
  QrCode,
  ChevronUp,
  AlertCircle,
  X,
} from "lucide-react";

interface PrivacySection {
  id: string;
  number: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  clauses: string[];
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "data-collection",
    number: "بخش ۱",
    title: "اطلاعاتی که جمع‌آوری می‌کنیم",
    summary:
      "شفافیت کامل درباره داده‌های ثبت‌نام مدیران مجموعه، اطلاعات سفارش مشتریان و داده‌های فنی.",
    icon: Database,
    clauses: [
      "اطلاعات حساب پذیرنده (مالک مجموعه): شامل نام و نام خانوادگی، شماره تلفن همراه، نام تجاری کافه یا رستوران، نشانی، شماره تماس مجموعه و لوگو جهت راه‌اندازی پنل مدیریت و منوی اختصاصی.",
      "اطلاعات سفارش و رزرو میز مشتریان: هنگامی که مشتری از طریق منوی دیجیتال اقدام به ثبت سفارش یا رزرو آنلاین میز می‌کند، اطلاعاتی نظیر نام، شماره تماس، شماره میز و آیتم‌های انتخابی صرفاً برای پردازش همان سفارش یا رزرو ثبت می‌شود.",
      "اطلاعات فنی و نشست کاربری: داده‌های پایه مرورگر و وضعیت اتصال زنده (WebSocket) برای همگام‌سازی آنی وضعیت سفارش‌ها بین سالن، صندوق و مانیتور آشپزخانه (KDS) پردازش می‌گردد.",
    ],
  },
  {
    id: "data-usage",
    number: "بخش ۲",
    title: "نحوه استفاده از اطلاعات",
    summary:
      "داده‌ها منحصراً برای ارائه خدمات نرم‌افزاری، ثبت سفارش و گزارش‌گیری مالی شما استفاده می‌شوند.",
    icon: Server,
    clauses: [
      "ارائه و اجرای سرویس‌های اصلی ترنج شامل نمایش منوی دیجیتال، ارسال لحظه‌ای فیش به آشپزخانه، مدیریت وضعیت رزرو میزها و محاسبه گزارش‌های فروش.",
      "ارسال کدهای احراز هویت پیامکی (OTP) برای ورود امن به حساب کاربری و اطلاع‌رسانی‌های ضروری مربوط به وضعیت اشتراک یا تایید تراکنش‌های کیف پول.",
      "بهبود پایداری سرورها، عیب‌یابی فنی و ارتقای سرعت بارگذاری منوها در دستگاه‌های موبایل مشتریان بدون شناسایی هویت شخصی بازدیدکنندگان.",
    ],
  },
  {
    id: "customer-data-ownership",
    number: "بخش ۳",
    title: "مالکیت و محرمانگی داده‌های مشتریان شما",
    summary:
      "اطلاعات مشتریان هر رستوران متعلق به همان مجموعه است و ترنج هرگز آن‌ها را نمی‌فروشد.",
    icon: EyeOff,
    clauses: [
      "پلتفرم ترنج تحت هیچ شرایطی اطلاعات تماس یا سوابق سفارش مشتریان مجموعه‌ها را به اشخاص ثالث، شرکت‌های تبلیغاتی یا شبکه‌های بازاریابی واگذار نمی‌کند و نمی‌فروشد.",
      "دسترسی به فهرست رزروها و سوابق سفارش‌های ثبت‌شده در هر مجموعه، منحصراً در اختیار مالک همان مجموعه و پرسنل مجاز تعریف‌شده توسط او قرار دارد.",
      "پذیرندگان نیز متعهد هستند از شماره تماس‌های ثبت‌شده مشتریان در بخش رزرو میز یا سفارش آنلاین، برای ارسال پیامک‌های تبلیغاتی ناخواسته استفاده نکنند.",
    ],
  },
  {
    id: "technical-security",
    number: "بخش ۴",
    title: "امنیت فنی، رمزنگاری و حفاظت از سرورها",
    summary:
      "استانداردهای امنیتی چندلایه برای محافظت از ارتباطات، پایگاه داده و نشست‌های زنده.",
    icon: Lock,
    clauses: [
      "تمامی ارتباطات بین مرورگر کاربران، منوی مشتریان و سرورهای ترنج از طریق پروتکل رمزنگاری‌شده HTTPS و کانال‌های امن WebSocket (WSS) انجام می‌شود.",
      "کلمات عبور پرسنل و توکن‌های احراز هویت با الگوریتم‌های استاندارد رمزنگاری (Hashing) در پایگاه داده ذخیره می‌شوند و به صورت متن ساده قابل مشاهده نیستند.",
      "زیرساخت بک‌اند ترنج در برابر حملات رایج وب از جمله SQL Injection، XSS و CSRF محافظت شده و نسخه‌های پشتیبان (Backup) به‌صورت منظم و رمزنگاری‌شده تهیه می‌شوند.",
    ],
  },
  {
    id: "financial-wallet-security",
    number: "بخش ۵",
    title: "امنیت اطلاعات مالی، کیف پول و رسیدها",
    summary:
      "حفاظت از سوابق تراکنش‌های شارژ کیف پول، خرید اشتراک و گزارش‌های فروش رستوران.",
    icon: CreditCard,
    clauses: [
      "ترنج هرگز اطلاعات محرمانه کارت بانکی (شامل رمز دوم یا CVV2) کاربران را درخواست یا ذخیره نمی‌کند.",
      "تصاویر رسیدهای واریزی بارگذاری‌شده برای شارژ کیف پول در فضای ذخیره‌سازی محافظت‌شده نگهداری می‌شوند و صرفاً توسط مدیر سیستم جهت تایید اعتبار بررسی می‌گردند.",
      "گزارش‌های مالی، تراکنش‌های صندوق و آمار فروش روزانه هر رستوران به صورت ایزوله برای همان مجموعه نگهداری شده و قابل دسترسی برای سایر مجموعه‌ها نیست.",
    ],
  },
  {
    id: "role-based-access",
    number: "بخش ۶",
    title: "کنترل دسترسی پرسنل و تفکیک نقش‌ها",
    summary:
      "محدودسازی هوشمند دسترسی‌ها تا هر عضو تیم فقط به بخش مرتبط با وظیفه خود دسترسی داشته باشد.",
    icon: KeyRound,
    clauses: [
      "مالک مجموعه می‌تواند برای صندوق‌دار، سرآشپز و سالن‌دار حساب‌های کاربری مجزا با نام کاربری و رمز عبور اختصاصی ایجاد کند.",
      "سرآشپز فقط به مانیتور مراحل پخت و پیام‌های آشپزخانه دسترسی دارد، سالن‌دار درخواست‌های میز را مشاهده می‌کند و گزارش‌های جامع مالی و تنظیمات اشتراک تنها در اختیار مدیر کل است.",
      "در صورت قطع همکاری هر یک از پرسنل، مالک مجموعه می‌تواند در لحظه دسترسی او را از بخش مدیریت پرسنل غیرفعال یا رمز عبور را تغییر دهد.",
    ],
  },
  {
    id: "cookies-local-storage",
    number: "بخش ۷",
    title: "کوکی‌ها و حافظه محلی مرورگر (Local Storage)",
    summary:
      "استفاده حداقلی از حافظه مرورگر برای حفظ سبد خرید مشتری و نشست ورود مدیران.",
    icon: Users,
    clauses: [
      "ترنج از کوکی‌های ردیابی تبلیغاتی شخص ثالث استفاده نمی‌کند.",
      "حافظه محلی مرورگر (Local Storage) صرفاً برای نگهداری توکن ورود امن به پنل مدیریت، ذخیره زبان انتخابی منو (فارسی یا انگلیسی) و حفظ آیتم‌های سبد خرید مشتری هنگام مشاهده منو به کار می‌رود.",
    ],
  },
  {
    id: "user-rights",
    number: "بخش ۸",
    title: "حقوق کاربران، ویرایش و حذف اطلاعات",
    summary:
      "اختیار کامل شما برای مشاهده، خروجی گرفتن، اصلاح یا حذف کامل اطلاعات مجموعه.",
    icon: UserCheck,
    clauses: [
      "پذیرندگان در هر زمان می‌توانند اطلاعات پروفایل، مشخصات مجموعه، تصاویر محصولات و تنظیمات نمایش منوی خود را از طریق داشبورد ویرایش یا حذف نمایند.",
      "امکان دریافت خروجی و چاپ گزارش‌های مالی و سوابق سفارش‌ها در هر لحظه برای مالک مجموعه فراهم است.",
      "در صورت تمایل به لغو حساب کاربری و حذف کامل داده‌های مجموعه از سرورهای ترنج، کافی است درخواست خود را از طریق پشتیبانی رسمی ثبت نمایید تا پس از تایید هویت مالک، اطلاعات طبق ضوابط پاک‌سازی شوند.",
    ],
  },
];

const ToranjLogoMark: React.FC<{ className?: string }> = ({
  className = "w-9 h-9",
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="12" fill="url(#toranj_privacy_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_privacy_grad"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#EA580C" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
    </defs>
  </svg>
);

export const Privacy: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>(
    PRIVACY_SECTIONS[0].id,
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PRIVACY_SECTIONS;

    return PRIVACY_SECTIONS.map((section) => {
      const titleMatch =
        section.title.toLowerCase().includes(q) ||
        section.number.toLowerCase().includes(q) ||
        section.summary.toLowerCase().includes(q);

      if (titleMatch) return section;

      const matchedClauses = section.clauses.filter((c) =>
        c.toLowerCase().includes(q),
      );
      if (matchedClauses.length > 0) {
        return { ...section, clauses: matchedClauses };
      }
      return null;
    }).filter(Boolean) as PrivacySection[];
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const scrollOffset = 180;
      for (let i = PRIVACY_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(PRIVACY_SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= scrollOffset) {
            setActiveSectionId(PRIVACY_SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen bg-[#fffaf5] text-gray-800 antialiased selection:bg-orange-500/20"
      dir="rtl"
    >
      {/* نوار ناوبری بالای صفحه */}
      <nav className="sticky top-0 z-40 bg-[#fffaf5]/85 backdrop-blur-xl border-b border-orange-100/80 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <ToranjLogoMark className="w-10 h-10 shadow-md shadow-orange-500/20 rounded-xl group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-black text-2xl text-gray-900 tracking-tight block leading-none">
                ترن<span className="text-orange-500">ج</span>
              </span>
              <span
                className="text-[11px] font-mono font-bold text-gray-400"
                dir="ltr"
              >
                toranjmenu.ir
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-full text-xs font-bold transition-all"
            >
              <Printer size={15} className="text-orange-500" />
              <span>چاپ سیاست‌نامه</span>
            </button>

            <Link
              to="/terms"
              className="hidden md:inline-flex items-center gap-1.5 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 px-4 py-2.5 rounded-full text-xs font-bold transition-all"
            >
              <span>قوانین و مقررات</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 px-4 py-2.5 rounded-full text-xs font-bold transition-all"
            >
              <ArrowRight size={15} />
              <span>صفحه اصلی</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full text-xs font-black transition-all shadow-sm"
            >
              <span>ورود به پنل</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* هدر و معرفی حریم خصوصی و امنیت */}
      <header className="relative pt-14 pb-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.3] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#fed7aa 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -top-20 right-1/4 w-[460px] h-[460px] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200/80 text-emerald-700 text-xs font-black mb-5 shadow-2xs">
              <ShieldCheck size={15} />
              <span>سیاست‌نامه حفاظت از داده‌ها و امنیت اطلاعات</span>
            </div>

            <h1 className="font-black text-3xl sm:text-5xl text-gray-900 leading-tight tracking-tight mb-4">
              حریم خصوصی و امنیت در{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-orange-400">
                پلتفرم ترنج
              </span>
            </h1>

            <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium mb-6">
              حفظ امنیت اطلاعات تجاری رستوران‌ها و حریم خصوصی مشتریان شما،
              بنیادی‌ترین اصل در طراحی زیرساخت{" "}
              <strong className="text-gray-800 font-mono">toranjmenu.ir</strong>{" "}
              است. در این صفحه به‌صورت شفاف توضیح داده‌ایم چه داده‌هایی ثبت
              می‌شوند، چگونه رمزنگاری و محافظت می‌گردند و چه کنترل‌هایی در
              اختیار شما قرار دارد.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
              <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs">
                <Clock size={14} className="text-orange-500" />
                آخرین به‌روزرسانی: آبان ۱۴۰۵
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs">
                <Lock size={14} className="text-emerald-600" />
                رمزنگاری سراسری HTTPS / WSS
              </span>
            </div>
          </div>

          {/* باکس تعهدات امنیتی در یک نگاه */}
          <div className="mt-10 bg-white/90 backdrop-blur-xl border border-orange-100 rounded-[28px] p-6 sm:p-7 shadow-[0_14px_40px_rgba(234,88,12,0.05)]">
            <div className="flex items-center gap-2.5 text-orange-600 font-black text-sm mb-4">
              <Sparkles size={18} />
              <span>اصول چهارگانه امنیت و حریم خصوصی ترنج</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "عدم فروش یا اشتراک داده‌ها",
                  desc: "اطلاعات مشتریان و آمار فروش رستوران شما هرگز در اختیار اشخاص ثالث قرار نمی‌گیرد.",
                },
                {
                  title: "رمزنگاری کامل ارتباطات",
                  desc: "تبادل اطلاعات سفارش‌ها، رزرو میزها و نشست‌های پنل مدیریت در بستر امن TLS انجام می‌شود.",
                },
                {
                  title: "تفکیک دسترسی پرسنل",
                  desc: "صندوق‌دار، سرآشپز و سالن‌دار فقط به بخش‌های مجاز خود دسترسی دارند و اطلاعات مالی ایزوله است.",
                },
                {
                  title: "پشتیبان‌گیری منظم ابری",
                  desc: "از اطلاعات منو و سوابق تراکنش‌های شما به‌صورت دوره‌ای نسخه پشتیبان امن تهیه می‌شود.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[#fffaf5] rounded-2xl p-4 border border-orange-100/80"
                >
                  <div className="flex items-center gap-2 font-black text-gray-900 text-xs mb-1.5">
                    <CheckCircle2
                      size={15}
                      className="text-emerald-500 shrink-0"
                    />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* بدنه اصلی: فهرست موضوعی چسبان + متن بندهای حریم خصوصی */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* سایدبار فهرست بخش‌ها */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4 print:hidden">
            {/* باکس جستجو */}
            <div className="bg-white rounded-2xl p-2 border border-gray-200/80 shadow-2xs flex items-center gap-2">
              <Search size={17} className="text-gray-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در حریم خصوصی (مثلاً: رمزنگاری، کوکی)..."
                className="w-full py-2 text-xs font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* فهرست دسترسی سریع */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[28px] p-5 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <span className="block text-xs font-black text-gray-400 mb-3 px-2">
                سرفصل‌های حریم خصوصی و امنیت
              </span>
              <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible hide-scrollbar pb-1 lg:pb-0">
                {PRIVACY_SECTIONS.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`shrink-0 lg:shrink text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                          : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      <span className="truncate">
                        <strong className="font-black ml-1.5">
                          {sec.number}:
                        </strong>
                        {sec.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* کارت گزارش امنیتی و ارتباط با تیم */}
            <div className="hidden lg:block bg-gray-900 text-white rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-black text-base mb-1.5">
                واحد امنیت و حفاظت از داده‌ها
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed mb-4">
                در صورت نیاز به حذف اطلاعات، دریافت نسخه پشتیبان یا گزارش مورد
                امنیتی، مستقیماً با تیم فنی ترنج در ارتباط باشید.
              </p>
              <a
                href="/#contact-section"
                className="w-full bg-white text-gray-900 hover:bg-orange-500 hover:text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>تماس با تیم امنیت</span>
                <ArrowLeft size={14} />
              </a>
            </div>
          </aside>

          {/* ستون متن کامل بخش‌ها */}
          <div className="lg:col-span-8 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-gray-100">
                <Search size={36} className="text-gray-300 mx-auto mb-3" />
                <h3 className="font-black text-base text-gray-800 mb-1">
                  موردی با عبارت جستجو‌شده یافت نشد
                </h3>
                <p className="text-xs text-gray-400 font-bold mb-4">
                  عبارت دیگری را امتحان کنید یا فیلتر جستجو را پاک نمایید.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black"
                >
                  نمایش تمام بخش‌ها
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                const IconComp = section.icon;
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="bg-white rounded-[30px] p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.025)] scroll-mt-28 transition-all hover:border-orange-200/70"
                  >
                    <div className="flex items-start gap-4 pb-5 mb-5 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                        <IconComp size={23} />
                      </div>
                      <div>
                        <span className="inline-block text-[11px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg mb-1">
                          {section.number}
                        </span>
                        <h2 className="font-black text-xl sm:text-2xl text-gray-900">
                          {section.title}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                          {section.summary}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {section.clauses.map((clause, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3.5 text-sm sm:text-[15px] text-gray-700 leading-8 font-medium"
                        >
                          <span className="w-6 h-6 rounded-lg bg-[#fffaf5] border border-orange-200/70 text-orange-600 font-black text-xs flex items-center justify-center shrink-0 mt-1">
                            {(idx + 1).toLocaleString("fa-IR")}
                          </span>
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })
            )}

            {/* باکس فراخوان ورود به پنل */}
            <div className="bg-gradient-to-l from-gray-950 to-stone-900 text-white rounded-[32px] p-7 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
              <div>
                <h3 className="font-black text-xl mb-1.5">
                  با خیال آسوده منوی دیجیتال مجموعه خود را بسازید
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  حفاظت از داده‌های کسب‌وکار و مشتریان شما اولویت همیشگی ترنج
                  است.
                </p>
              </div>
              <Link
                to="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
              >
                <span>ورود به پنل مدیریت</span>
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* دکمه بازگشت به بالا */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="بازگشت به بالا"
          className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-gray-900 hover:bg-orange-500 text-white shadow-xl flex items-center justify-center transition-all print:hidden"
        >
          <ChevronUp size={20} />
        </button>
      )}

      {/* فوتر هماهنگ با برند ترنج */}
      <footer className="bg-[#09090b] text-white py-10 border-t border-white/10 print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ToranjLogoMark className="w-9 h-9" />
            <div>
              <span className="font-black text-xl text-white">
                ترن<span className="text-orange-500">ج</span>
              </span>
              <span
                className="block text-[11px] font-mono text-gray-400"
                dir="ltr"
              >
                toranjmenu.ir
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-400">
            <Link
              to="/terms"
              className="hover:text-orange-400 transition-colors"
            >
              قوانین و مقررات
            </Link>
            <span className="flex items-center gap-1.5">
              <Mail size={14} className="text-orange-400" />
              info@toranjmenu.ir
            </span>
            <span className="flex items-center gap-1.5" dir="ltr">
              <PhoneCall size={14} className="text-orange-400" />
              ۰۲۱ - ۴۴۵۲ ۶۴۴۸
            </span>
            <span className="flex items-center gap-1.5">
              <QrCode size={14} className="text-orange-400" />
              پلتفرم منوی دیجیتال
            </span>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            © ۲۰۲۶ تمامی حقوق متعلق به{" "}
            <strong className="text-gray-300">ترنج (toranjmenu.ir)</strong> است.
          </p>
        </div>
      </footer>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Privacy;
