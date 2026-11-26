import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Scale,
  Search,
  ArrowRight,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  Store,
  Users,
  Server,
  Lock,
  AlertCircle,
  Mail,
  PhoneCall,
  QrCode,
  ChevronUp,
  BookOpen,
  X,
} from "lucide-react";

interface TermsSection {
  id: string;
  number: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  clauses: string[];
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "definitions",
    number: "ماده ۱",
    title: "تعاریف و اصطلاحات پایه",
    summary:
      "آشنایی با مفاهیم کلیدی پلتفرم ترنج، پذیرندگان (کافه‌ها و رستوران‌ها) و مشتریان نهایی.",
    icon: BookOpen,
    clauses: [
      "«پلتفرم ترنج» به نرم‌افزار تحت وب، زیرساخت منوی دیجیتال، سیستم رزرو میز، پنل آشپزخانه (KDS) و کلیه خدمات ارائه‌شده تحت دامنه رسمی toranjmenu.ir اطلاق می‌شود.",
      "«پذیرنده یا بهره‌بردار» شخص حقیقی یا حقوقی (مالک یا مدیر کافه، رستوران، فودکورت یا مجموعه پذیرایی) است که با ثبت‌نام در ترنج، پنل مدیریت اختصاصی ایجاد می‌کند.",
      "«مشتری نهایی» شخصی است که از طریق اسکن بارکد (QR Code) میز یا لینک اختصاصی مجموعه، منوی دیجیتال را مشاهده کرده و اقدام به ثبت سفارش یا رزرو میز می‌نماید.",
      "«پنل مدیریت و پرسنل» محیط کاربری اختصاصی پذیرنده است که امکان تعریف سطوح دسترسی مجزا برای صندوق‌دار، سرآشپز و سالن‌دار را فراهم می‌کند.",
    ],
  },
  {
    id: "account-security",
    number: "ماده ۲",
    title: "ثبت‌نام، احراز هویت و امنیت حساب",
    summary:
      "شرایط ایجاد حساب کاربری و مسئولیت حفظ محرمانگی دسترسی‌های مدیر و پرسنل مجموعه.",
    icon: Lock,
    clauses: [
      "ثبت‌نام در ترنج از طریق شماره تلفن همراه معتبر انجام می‌شود و پذیرنده متعهد است اطلاعات هویتی و مشخصات مجموعه خود را به‌صورت صحیح و واقعی وارد نماید.",
      "مسئولیت حفظ و نگهداری اطلاعات ورود به پنل مدیریت و حساب‌های تعریف‌شده برای پرسنل (صندوق‌دار، سرآشپز و گارسون) تماماً بر عهده مالک مجموعه است.",
      "هرگونه اقدام، تغییر قیمت، لغو سفارش یا درخواست تسویه که از طریق حساب کاربری پذیرنده یا پرسنل معرفی‌شده توسط او انجام شود، به منزله اقدام خود پذیرنده تلقی می‌گردد.",
      "واگذاری، فروش یا اجاره حساب کاربری به اشخاص ثالث بدون هماهنگی و تایید کتبی پشتیبانی ترنج مجاز نیست.",
    ],
  },
  {
    id: "merchant-responsibilities",
    number: "ماده ۳",
    title: "مالکیت محتوای منو و مسئولیت‌های پذیرنده",
    summary:
      "ترنج ارائه‌دهنده زیرساخت نرم‌افزاری است و مسئولیت قیمت‌گذاری، موجودی و کیفیت غذا با مجموعه است.",
    icon: Store,
    clauses: [
      "کلیه حقوق و مسئولیت‌های مربوط به نام محصولات، تصاویر بارگذاری‌شده، توضیحات مواد اولیه، قیمت‌ها و وضعیت موجودی منو بر عهده پذیرنده است.",
      "پذیرنده متعهد می‌شود از بارگذاری تصاویر یا محتوای مغایر با قوانین جمهوری اسلامی ایران و حقوق مالکیت معنوی اشخاص ثالث خودداری کند.",
      "ترنج صرفاً ارائه‌دهنده بستر نرم‌افزاری مدیریت منو و سفارش‌گیری است و هیچ‌گونه دخالت یا مسئولیتی در قبال کیفیت طبخ، زمان آماده‌سازی غذا، بهداشت محیط یا مغایرت قیمت درج‌شده توسط پذیرنده ندارد.",
      "پاسخگویی به مشتریان نهایی در خصوص سفارش‌های ثبت‌شده، رزرو میزها و صدور صورت‌حساب قانونی بر عهده مجموعه پذیرنده است.",
    ],
  },
  {
    id: "subscriptions-wallet",
    number: "ماده ۴",
    title: "اشتراک‌ها، کیف پول و قوانین مالی",
    summary:
      "نحوه خرید پلن‌های پایه، استاندارد و پلاس در دوره‌های ۳، ۶ و ۹ ماهه و قوانین شارژ کیف پول.",
    icon: CreditCard,
    clauses: [
      "استفاده از امکانات ترنج در قالب پلن‌های «پایه»، «استاندارد» و «پلاس» و در بازه‌های زمانی «۳ ماهه»، «۶ ماهه» و «۹ ماهه» مطابق تعرفه‌های اعلام‌شده در پنل کاربری ارائه می‌شود.",
      "ترنج هیچ‌گونه کارمزد یا پورسانتی از تعداد یا مبلغ سفارش‌های ثبت‌شده مشتریان در رستوران دریافت نمی‌کند و هزینه اشتراک صرفاً بر اساس پلن انتخابی محاسبه می‌شود.",
      "شارژ کیف پول از طریق ثبت رسید واریز بانکی یا درگاه‌های متصل انجام می‌گیرد و پس از تایید تراکنش، اعتبار به‌صورت آنی در حساب پذیرنده منظور می‌شود.",
      "پس از انتخاب پلن و کسر هزینه از کیف پول، اشتراک بلافاصله فعال می‌گردد؛ به دلیل اختصاص منابع ابری و زیرساخت اختصاصی، امکان لغو و استرداد وجه دوره فعال وجود ندارد (مگر در صورت بروز نقص فنی غیرقابل رفع از سوی تیم فنی ترنج).",
      "در صورت تمدید اشتراک پیش از پایان مهلت دوره فعلی، روزهای باقی‌مانده قبلی با اعتبار دوره جدید جمع خواهد شد.",
    ],
  },
  {
    id: "orders-reservations",
    number: "ماده ۵",
    title: "سفارش‌گیری آنلاین، رزرو میز و پنل آشپزخانه",
    summary:
      "ضوابط استفاده از سیستم رزرو زنده میزها، سفارش‌گیری سر میز و مانیتور آشپزخانه (KDS).",
    icon: Users,
    clauses: [
      "در ماژول رزرو آنلاین میزها، میزهایی که دارای سفارش باز در سیستم باشند به‌صورت خودکار در وضعیت «اشغال / رزرو» قرار می‌گیرند تا از تداخل پذیرش جلوگیری شود.",
      "پذیرنده موظف است وضعیت سفارش‌های تحویل‌شده را در پنل آشپزخانه یا صندوق مختومه (تکمیل) نماید تا ظرفیت میزها به‌صورت دقیق در منوی مشتریان به‌روز شود.",
      "اطلاعات تماس مشتریان که هنگام رزرو میز یا ثبت سفارش وارد می‌شود، محرمانه بوده و پذیرنده مجاز به استفاده تبلیغاتی مزاحم یا واگذاری آن‌ها به غیر نیست.",
    ],
  },
  {
    id: "uptime-force-majeure",
    number: "ماده ۶",
    title: "پایداری سرویس و حوادث غیرمترقبه",
    summary:
      "تعهد ما به پایداری ۹۹.۹٪ سرورها و شرایط مربوط به اختلالات سراسری اینترنت.",
    icon: Server,
    clauses: [
      "تیم فنی ترنج تمام تلاش خود را برای حفظ پایداری و دسترس‌پذیری مداوم سرویس‌ها (آپتایم ۹۹.۹٪) به کار می‌گیرد و به‌روزرسانی‌های سیستمی را در ساعات کم‌ترافیک انجام می‌دهد.",
      "در صورت بروز حوادث غیرمترقبه (فورس ماژور) از جمله قطع سراسری اینترنت، اختلال در شبکه‌های مخابراتی یا مراکز داده خارج از کنترل ترنج، مسئولیتی متوجه پلتفرم نخواهد بود.",
    ],
  },
  {
    id: "intellectual-property",
    number: "ماده ۷",
    title: "حقوق مالکیت فکری پلتفرم ترنج",
    summary:
      "حفاظت از کدها، طراحی رابط کاربری، قالب‌های اختصاصی منو و نام تجاری ترنج.",
    icon: ShieldCheck,
    clauses: [
      "کلیه کدهای منبع، طراحی‌های رابط کاربری، قالب‌های منو، نشان تجاری «ترنج» و دامنه toranjmenu.ir متعلق به پلتفرم ترنج است.",
      "هرگونه مهندسی معکوس، کپی‌برداری از قالب‌ها، استخراج خودکار داده‌ها (Scraping) یا استفاده تجاری بدون مجوز از بخش‌های نرم‌افزاری ترنج پیگرد قانونی دارد.",
    ],
  },
  {
    id: "termination-disputes",
    number: "ماده ۸",
    title: "تعلیق حساب و مرجع حل اختلاف",
    summary:
      "شرایط محدودسازی دسترسی در صورت تخلف و نحوه رسیدگی به اختلافات احتمالی.",
    icon: Scale,
    clauses: [
      "در صورت مشاهده هرگونه فعالیت غیرقانونی، سوءاستفاده از زیرساخت پیامکی یا نقض مفاد این توافق‌نامه، ترنج حق دارد پس از اخطار یا در موارد حاد به‌صورت فوری دسترسی حساب را موقتاً تعلیق نماید.",
      "تفسیر و اجرای کلیه مفاد این قوانین تابع قوانین جاری جمهوری اسلامی ایران است و در صورت بروز اختلاف، طرفین ابتدا از طریق مذاکره و واحد پشتیبانی رسمی اقدام به حل‌وفصل موضوع خواهند کرد.",
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
    <rect width="40" height="40" rx="12" fill="url(#toranj_terms_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_terms_grad"
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

export const Terms: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>(
    TERMS_SECTIONS[0].id,
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TERMS_SECTIONS;

    return TERMS_SECTIONS.map((section) => {
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
    }).filter(Boolean) as TermsSection[];
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const scrollOffset = 180;
      for (let i = TERMS_SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TERMS_SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= scrollOffset) {
            setActiveSectionId(TERMS_SECTIONS[i].id);
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
              <span>چاپ قوانین</span>
            </button>

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

      {/* هدر و معرفی قوانین و مقررات */}
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200/80 text-orange-600 text-xs font-black mb-5 shadow-2xs">
              <Scale size={15} />
              <span>توافق‌نامه رسمی استفاده از خدمات</span>
            </div>

            <h1 className="font-black text-3xl sm:text-5xl text-gray-900 leading-tight tracking-tight mb-4">
              قوانین و مقررات استفاده از{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-orange-400">
                پلتفرم ترنج
              </span>
            </h1>

            <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium mb-6">
              این سند چارچوب حقوقی و عملیاتی استفاده از خدمات منوی دیجیتال، رزرو
              آنلاین میزها، پنل آشپزخانه (KDS) و کیف پول الکترونیک در وب‌سایت{" "}
              <strong className="text-gray-800 font-mono">toranjmenu.ir</strong>{" "}
              را مشخص می‌کند. ثبت‌نام و استفاده از پنل مدیریت به منزله مطالعه و
              پذیرش کامل این مفاد است.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
              <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs">
                <Clock size={14} className="text-orange-500" />
                آخرین به‌روزرسانی: آبان ۱۴۰۵
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-gray-100 shadow-2xs">
                <FileText size={14} className="text-emerald-600" />
                تعداد مواد: ۸ ماده قانونی
              </span>
            </div>
          </div>

          {/* باکس خلاصه به زبان ساده */}
          <div className="mt-10 bg-white/90 backdrop-blur-xl border border-orange-100 rounded-[28px] p-6 sm:p-7 shadow-[0_14px_40px_rgba(234,88,12,0.05)]">
            <div className="flex items-center gap-2.5 text-orange-600 font-black text-sm mb-4">
              <Sparkles size={18} />
              <span>خلاصه کلیدی قوانین در یک نگاه</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "۰٪ کارمزد سفارش‌ها",
                  desc: "درآمد فروش رستوران مستقیماً متعلق به شماست و هیچ کمیسیونی از سفارش‌ها کسر نمی‌شود.",
                },
                {
                  title: "مالکیت کامل منو و مشتریان",
                  desc: "اطلاعات منو، قیمت‌ها و مشتریان مجموعه شما محرمانه و در اختیار خودتان است.",
                },
                {
                  title: "مسئولیت صحت اطلاعات غذا",
                  desc: "درج قیمت صحیح، موجودی و کیفیت آماده‌سازی غذا بر عهده مدیریت مجموعه است.",
                },
                {
                  title: "تمدید هوشمند اشتراک",
                  desc: "در صورت تمدید پیش از پایان دوره، روزهای باقی‌مانده به اشتراک جدید اضافه می‌شود.",
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

      {/* بدنه اصلی: فهرست موضوعی چسبان + متن مواد قانونی */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* سایدبار فهرست مواد (دسکتاپ) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4 print:hidden">
            {/* باکس جستجو در قوانین */}
            <div className="bg-white rounded-2xl p-2 border border-gray-200/80 shadow-2xs flex items-center gap-2">
              <Search size={17} className="text-gray-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در مواد قوانین (مثلاً: کیف پول، اشتراک)..."
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
                فهرست مواد قانونی
              </span>
              <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible hide-scrollbar pb-1 lg:pb-0">
                {TERMS_SECTIONS.map((sec) => {
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

            {/* کارت راهنمای حقوقی و پشتیبانی */}
            <div className="hidden lg:block bg-gray-900 text-white rounded-[28px] p-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-black text-base mb-1.5">
                سوالی درباره قوانین دارید؟
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed mb-4">
                کارشناسان پشتیبانی ترنج آماده پاسخگویی به ابهامات شما پیش از
                راه‌اندازی مجموعه هستند.
              </p>
              <a
                href="/#contact-section"
                className="w-full bg-white text-gray-900 hover:bg-orange-500 hover:text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>ارتباط با پشتیبانی</span>
                <ArrowLeft size={14} />
              </a>
            </div>
          </aside>

          {/* ستون متن کامل مواد قانونی */}
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
                  نمایش تمام مواد
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

            {/* باکس تایید و ورود به پنل در انتهای قوانین */}
            <div className="bg-gradient-to-l from-gray-950 to-stone-900 text-white rounded-[32px] p-7 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
              <div>
                <h3 className="font-black text-xl mb-1.5">
                  آماده ساخت منوی اختصاصی مجموعه خود هستید؟
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  با ورود به پنل ترنج، در کمتر از ۵ دقیقه منوی دیجیتال و بارکد
                  میزهایتان را فعال کنید.
                </p>
              </div>
              <Link
                to="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
              >
                <span>ورود و شروع کار</span>
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

export default Terms;
