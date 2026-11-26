import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  ArrowLeft,
  PlayCircle,
  Plus,
  ShoppingCart,
  Check,
  Rocket,
  UserPlus,
  Store,
  Smartphone,
  Zap,
  Hand,
  Monitor,
  Clock,
  Flame,
  CheckCircle2,
  ArrowLeftRight,
  Wand2,
  Users,
  Calculator,
  Headset,
  Paintbrush,
  UserCircle,
  CreditCard,
  ChefHat,
  Utensils,
  Coffee,
  Sandwich,
  Soup,
  Pizza,
  Wine,
  IceCream,
  Croissant,
  Building2,
  HelpCircle,
  ChevronDown,
  MapPin,
  PhoneCall,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Award,
  Menu,
  X,
  RotateCcw,
  CalendarCheck,
  Sparkles,
  BellRing,
  TrendingUp,
  Globe,
  Loader2,
} from "lucide-react";
import { subscriptionApi } from "../service/api";

interface KdsOrder {
  id: number;
  table: number;
  items: { qty: number; name: string }[];
  time: string;
  col: 1 | 2 | 3;
}

type DurationMonths = 3 | 6 | 9;
type PlanTierKey = "basic" | "standard" | "plus";

interface DynamicPlanCard {
  id: string;
  tierKey: PlanTierKey;
  name: string;
  subtitle: string;
  price3m: number;
  price6m: number;
  price9m: number;
  featuresList: string[];
  badgeText: string;
  isPopular: boolean;
}

const INITIAL_KDS_ORDERS: KdsOrder[] = [
  {
    id: 1042,
    table: 4,
    items: [
      { qty: 2, name: "چیزبرگر دبل" },
      { qty: 1, name: "سیب‌زمینی ویژه" },
    ],
    time: "۲ دقیقه پیش",
    col: 1,
  },
  {
    id: 1043,
    table: 7,
    items: [{ qty: 1, name: "پیتزا پپرونی تنوری" }],
    time: "هم‌اکنون",
    col: 1,
  },
  {
    id: 1040,
    table: 2,
    items: [
      { qty: 1, name: "سالاد سزار گریل" },
      { qty: 2, name: "موخیتو نعناع" },
    ],
    time: "۸ دقیقه پیش",
    col: 2,
  },
];

// پلن‌های پیش‌فرض صرفاً تا زمان دریافت پاسخ از بک‌اند
const FALLBACK_PLANS: DynamicPlanCard[] = [
  {
    id: "basic",
    tierKey: "basic",
    name: "پایه",
    subtitle: "شروعی عالی برای کافه‌ها و مجموعه‌های کوچک.",
    price3m: 450000,
    price6m: 800000,
    price9m: 1100000,
    featuresList: [
      "ثبت تا ۵۰ آیتم منو",
      "قالب منوی دیجیتال هوشمند",
      "ساخت بارکد QR اختصاصی میزها",
      "پشتیبانی آنلاین",
    ],
    badgeText: "",
    isPopular: false,
  },
  {
    id: "standard",
    tierKey: "standard",
    name: "استاندارد",
    subtitle: "ایده‌آل برای رستوران‌های رو به رشد با سفارش‌گیری زنده.",
    price3m: 750000,
    price6m: 1400000,
    price9m: 2000000,
    featuresList: [
      "ثبت آیتم و دسته‌بندی بی‌نهایت",
      "شخصی‌سازی کامل رنگ، لوگو و قالب منو",
      "سیستم رزرو آنلاین و وضعیت زنده میزها",
      "درگاه پرداخت اختصاصی و کیف پول",
    ],
    badgeText: "محبوب‌ترین انتخاب",
    isPopular: true,
  },
  {
    id: "plus",
    tierKey: "plus",
    name: "پلاس",
    subtitle: "امکانات کامل برای مجموعه‌های حرفه‌ای، صنعتی و شعب.",
    price3m: 1200000,
    price6m: 2200000,
    price9m: 3100000,
    featuresList: [
      "تمامی امکانات پلن استاندارد",
      "پنل زنده آشپزخانه (KDS) و مراحل پخت",
      "تعریف نقش‌های پرسنل (صندوق‌دار، سرآشپز، گارسون)",
      "گزارشات جامع مالی و چاپ صورت‌حساب رسمی",
    ],
    badgeText: "کامل‌ترین بسته",
    isPopular: false,
  },
];

const FAQ_ITEMS = [
  {
    question: "آیا مشتریان برای دیدن منوی دیجیتال باید اپلیکیشن نصب کنند؟",
    answer:
      "خیر، به هیچ وجه! مشتریان تنها با باز کردن دوربین گوشی خود و اسکن بارکد (QR Code) قرار گرفته روی میز، در کسری از ثانیه و بدون نیاز به نصب هیچ برنامه‌ای وارد منوی دیجیتال شما می‌شوند.",
  },
  {
    question: "آیا پلتفرم ترنج از سفارش‌های ثبت‌شده کارمزد دریافت می‌کند؟",
    answer:
      "خیر، ترنج هیچ‌گونه کارمزد یا درصدی از فروش رستوران دریافت نمی‌کند و تسویه فروش مستقیماً متعلق به مجموعه است.",
  },
  {
    question: "چگونه بارکد اختصاصی هر میز را تهیه و چاپ کنیم؟",
    answer:
      "پس از ثبت تعداد میزها در پنل مدیریت ترنج، استند QR Code اختصاصی هر میز به‌صورت خودکار تولید شده و با فرمت چاپی A4 یا فایل PNG باکیفیت قابل دانلود و چاپ است.",
  },
  {
    question: "آیا امکان اتصال به پرینتر آشپزخانه وجود دارد؟",
    answer:
      "بله! علاوه بر مانیتور لایو آشپزخانه (KDS)، شما می‌توانید سیستم را به پرینترهای حرارتی استاندارد شبکه (LAN) یا بلوتوثی متصل کنید تا به محض ثبت سفارش، فیش کاغذی نیز در آشپزخانه یا صندوق چاپ شود.",
  },
  {
    question: "در صورت قطعی اینترنت چه اتفاقی می‌افتد؟",
    answer:
      "منوی دیجیتال بر بستر وب فعالیت می‌کند. در صورت اختلال اینترنت بین‌الملل، سرورهای داخلی (اینترانت ملی) فعال می‌مانند تا فرآیند مشاهده منو و ثبت سفارش در داخل رستوران متوقف نشود.",
  },
];

const extractPlansArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const detectTier = (plan: any, idx: number): PlanTierKey => {
  const t = String(plan?.tier || "").toLowerCase();
  const n = String(plan?.name || "").toLowerCase();
  if (t === "basic" || n.includes("پایه")) return "basic";
  if (t === "standard" || n.includes("استاندارد")) return "standard";
  if (t === "plus" || n.includes("پلاس")) return "plus";
  if (idx === 1) return "standard";
  if (idx >= 2) return "plus";
  return "basic";
};

// نشان هندسی اختصاصی برند ترنج
const ToranjLogoMark: React.FC<{ className?: string }> = ({
  className = "w-9 h-9",
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect width="40" height="40" rx="12" fill="url(#toranj_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_grad"
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

export const Landing: React.FC = () => {
  // نوبار و منوی موبایل
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // سبد خرید تعاملی داخل موکاپ موبایل Hero
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isPhonePulsing, setIsPhonePulsing] = useState(false);

  // بخش مراحل راه‌اندازی (Interactive Step Deck)
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // برد تعاملی KDS آشپزخانه
  const [kdsOrders, setKdsOrders] = useState<KdsOrder[]>(INITIAL_KDS_ORDERS);
  const [removingOrderId, setRemovingOrderId] = useState<number | null>(null);
  const [kdsToast, setKdsToast] = useState<string | null>(null);
  const kdsBoardScrollRef = useRef<HTMLDivElement | null>(null);
  const kdsColRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // پلن‌های اشتراک متصل به بک‌اند جنگو
  const [plans, setPlans] = useState<DynamicPlanCard[]>(FALLBACK_PLANS);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(true);
  const [selectedMonths, setSelectedMonths] = useState<DurationMonths>(3);
  const [isPriceFading, setIsPriceFading] = useState(false);

  // آکاردئون سوالات متداول (FAQ)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // تنظیم متاتگ‌های سئو، Open Graph و Structured Data (JSON-LD)
  useEffect(() => {
    const pageTitle =
      "ترنج | ساخت منوی دیجیتال هوشمند و سیستم سفارش‌گیری آنلاین رستوران و کافه";
    const pageDesc =
      "با پلتفرم ترنج (toranjmenu.ir) در کمتر از ۵ دقیقه منوی دیجیتال QR کد، سیستم سفارش‌گیری سر میز، رزرو آنلاین میز و پنل آشپزخانه (KDS) را با ۰٪ کارمزد راه‌اندازی کنید.";
    const pageKeywords =
      "منوی دیجیتال, منوی آنلاین رستوران, منوی دیجیتال کافه, بارکد میز رستوران, منو QR کد, سفارش گیری آنلاین رستوران, ترنج";

    document.title = pageTitle;

    const upsertMeta = (
      attrName: "name" | "property",
      attrValue: string,
      content: string,
    ) => {
      let tag = document.querySelector(
        `meta[${attrName}="${attrValue}"]`,
      ) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    upsertMeta("name", "description", pageDesc);
    upsertMeta("name", "keywords", pageKeywords);
    upsertMeta("name", "robots", "index, follow");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "fa_IR");
    upsertMeta("property", "og:site_name", "ترنج | منوی دیجیتال هوشمند");
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", pageDesc);
    upsertMeta("property", "og:url", "https://toranjmenu.ir/");

    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://toranjmenu.ir/");

    // تزریق Schema.org JSON-LD هماهنگ با محتوای صفحه
    const schemaScriptId = "toranj-landing-jsonld";
    let schemaScript = document.getElementById(
      schemaScriptId,
    ) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = schemaScriptId;
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "ترنج - پلتفرم منوی دیجیتال هوشمند",
          url: "https://toranjmenu.ir",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: pageDesc,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "IRR",
            description: "بدون دریافت کارمزد از سفارش‌ها",
          },
        },
        {
          "@type": "Organization",
          name: "ترنج",
          url: "https://toranjmenu.ir",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+98-21-44526448",
            contactType: "customer service",
            areaServed: "IR",
            availableLanguage: ["Persian", "English"],
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ],
    };

    schemaScript.text = JSON.stringify(structuredData);

    return () => {
      const existingSchema = document.getElementById(schemaScriptId);
      if (existingSchema) existingSchema.remove();
    };
  }, []);

  // دریافت پلن‌ها از بک‌اند جنگو
  useEffect(() => {
    let isMounted = true;

    const loadBackendPlans = async () => {
      try {
        const res = await subscriptionApi.getPlans();
        const rawList = extractPlansArray(res);

        if (isMounted && rawList.length > 0) {
          const mapped: DynamicPlanCard[] = rawList.map(
            (p: any, idx: number) => {
              const tierKey = detectTier(p, idx);
              const p3 = Number(p.price3m ?? p.price_3m ?? p.price ?? 0);
              const p6 = Number(
                p.price6m ?? p.price_6m ?? (p3 > 0 ? p3 * 2 : 0),
              );
              const p9 = Number(
                p.price9m ?? p.price_9m ?? (p3 > 0 ? p3 * 3 : 0),
              );

              return {
                id: String(p.id || tierKey),
                tierKey,
                name: p.name || "پلن اشتراک",
                subtitle:
                  p.description || "دسترسی کامل به امکانات مدیریت مجموعه.",
                price3m: p3,
                price6m: p6,
                price9m: p9,
                featuresList: Array.isArray(p.featuresList)
                  ? p.featuresList
                  : [],
                badgeText:
                  p.badgeText || (p.isPopular ? "محبوب‌ترین انتخاب" : ""),
                isPopular: Boolean(p.isPopular),
              };
            },
          );

          const orderMap: Record<PlanTierKey, number> = {
            basic: 0,
            standard: 1,
            plus: 2,
          };
          mapped.sort((a, b) => orderMap[a.tierKey] - orderMap[b.tierKey]);
          setPlans(mapped);
        }
      } catch {
        // در صورت عدم دسترسی اولیه، پلن‌های پیش‌فرض نمایش داده می‌شوند
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    };

    loadBackendPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // کنترل اسکرول برای نمایش نوبار شناور
  useEffect(() => {
    const handleScroll = () => {
      setIsNavbarVisible(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // قفل کردن اسکرول بدنه هنگام باز بودن منوی موبایل
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  // افزودن محصول به سبد خرید موکاپ Hero
  const handleAddToMockCart = (price: number) => {
    setCartTotalAmount((prev) => prev + price);
    setCartItemsCount((prev) => prev + 1);
    setIsAddedFeedback(true);
    setIsPhonePulsing(true);

    setTimeout(() => setIsPhonePulsing(false), 150);
    setTimeout(() => setIsAddedFeedback(false), 1200);
  };

  // جابه‌جایی کارت سفارش در برد KDS
  const handleMoveKdsOrder = (order: KdsOrder) => {
    if (removingOrderId === order.id) return;

    if (order.col === 3) {
      setRemovingOrderId(order.id);
      setKdsToast(`سفارش #${order.id} (میز ${order.table}) تحویل داده شد!`);
      setTimeout(() => setKdsToast(null), 2600);
      setTimeout(() => {
        setKdsOrders((prev) => prev.filter((o) => o.id !== order.id));
        setRemovingOrderId(null);
      }, 220);
      return;
    }

    const nextCol = (order.col + 1) as 1 | 2 | 3;
    setKdsOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, col: nextCol } : o)),
    );

    const statusMsg =
      nextCol === 2
        ? `سفارش میز ${order.table} در حال پخت قرار گرفت`
        : `اعلان «آماده تحویل» برای میز ${order.table} ارسال شد`;
    setKdsToast(statusMsg);
    setTimeout(() => setKdsToast(null), 2600);

    if (window.innerWidth < 768 && kdsBoardScrollRef.current) {
      const targetColEl = kdsColRefs.current[nextCol];
      if (targetColEl) {
        kdsBoardScrollRef.current.scrollTo({
          left: targetColEl.offsetLeft - 16,
          behavior: "smooth",
        });
      }
    }
  };

  // تغییر بازه زمانی پلن‌های قیمت
  const handleChangeDuration = (months: DurationMonths) => {
    if (months === selectedMonths) return;
    setIsPriceFading(true);
    setTimeout(() => {
      setSelectedMonths(months);
      setIsPriceFading(false);
    }, 200);
  };

  const durationTabs: {
    months: DurationMonths;
    label: string;
    tag?: string;
  }[] = [
    { months: 3, label: "۳ ماهه" },
    { months: 6, label: "۶ ماهه" },
    { months: 9, label: "۹ ماهه", tag: "به‌صرفه" },
  ];
  const activeDurationIndex = durationTabs.findIndex(
    (d) => d.months === selectedMonths,
  );

  const stepsData = [
    {
      num: "۰۱",
      title: "ساخت حساب منوی دیجیتال در ۱۰ ثانیه",
      subtitle: "بدون فرم‌های پیچیده و کاغذبازی",
      desc: "تنها با وارد کردن شماره موبایل و تایید کد پیامکی، پنل مدیریت اختصاصی کافه یا رستوران خود را در ترنج فعال کنید.",
      icon: UserPlus,
      badge: "گام اول",
      previewTitle: "ورود سریع با شماره موبایل",
      previewDetail: "کد تایید ارسال شد • دسترسی آنی به داشبورد",
    },
    {
      num: "۰۲",
      title: "ثبت مجموعه و دریافت بارکد QR میزها",
      subtitle: "آدرس اختصاصی toranjmenu.ir/your-brand",
      desc: "نام کافه یا رستوران، لوگو و تعداد میزها را وارد کنید تا استند بارکدهای QR اختصاصی هر میز به‌صورت خودکار ساخته و آماده چاپ شوند.",
      icon: Store,
      badge: "گام دوم",
      previewTitle: "toranjmenu.ir/lamiz-cafe",
      previewDetail: "۱۲ بارکد میز آماده چاپ و نصب روی میزها",
    },
    {
      num: "۰۳",
      title: "چیدمان منوی آنلاین و دریافت سفارش زنده",
      subtitle: "اتصال هم‌زمان سالن، صندوق و آشپزخانه",
      desc: "دسته‌بندی‌ها و غذاها را با قیمت و تصویر وارد کنید. از همین لحظه مشتریان سفارش سر میز و رزرو آنلاین را ثبت می‌کنند.",
      icon: Smartphone,
      badge: "گام سوم",
      previewTitle: "منو آنلاین و فعال است",
      previewDetail: "سفارش میز ۴ در پنل آشپزخانه ثبت شد",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#fffaf5] text-gray-800 antialiased overflow-x-hidden selection:bg-orange-500/20"
      dir="rtl"
    >
      {/* ================= Navbar ================= */}
      <nav
        aria-label="منوی اصلی سایت"
        className={`fixed top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(234,88,12,0.08)] rounded-full z-50 px-5 py-2.5 flex items-center justify-between transition-all duration-700 ${
          isNavbarVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-[150%] opacity-0 pointer-events-none"
        }`}
      >
        <a
          href="#hero-section"
          className="flex items-center gap-2.5 font-black text-2xl text-gray-900 tracking-tight z-50"
        >
          <ToranjLogoMark className="w-8 h-8" />
          <span>
            ترن<span className="text-orange-500">ج</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-sm text-gray-600">
          <li>
            <a href="#steps-section" className="nav-link hover:text-gray-900">
              مراحل شروع
            </a>
          </li>
          <li>
            <a href="#kds-section" className="nav-link hover:text-gray-900">
              پنل آشپزخانه
            </a>
          </li>
          <li>
            <a
              href="#features-section"
              className="nav-link hover:text-gray-900"
            >
              امکانات
            </a>
          </li>
          <li>
            <a href="#pricing-section" className="nav-link hover:text-gray-900">
              تعرفه‌ها
            </a>
          </li>
          <li>
            <a href="#faq-section" className="nav-link hover:text-gray-900">
              سوالات متداول
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2 z-50">
          <Link
            to="/login"
            className="hidden sm:inline-flex font-bold text-sm bg-gray-900 text-white px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors duration-300"
          >
            ورود به پنل
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="باز کردن منوی ناوبری"
            className="md:hidden flex items-center justify-center w-10 h-10 bg-gray-50 rounded-full border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* منوی تمام صفحه شیشه‌ای برای موبایل */}
      <div
        className={`fixed inset-0 bg-white/90 backdrop-blur-2xl z-[60] flex flex-col items-center justify-center transition-all duration-500 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none translate-y-8"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="بستن منو"
          className="absolute top-8 right-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-200 hover:rotate-90 transition-all duration-300"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <ul className="flex flex-col items-center gap-8 font-black text-2xl text-gray-800 text-center">
          <li>
            <a
              href="#steps-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-orange-500 transition-colors block"
            >
              مراحل راه‌اندازی
            </a>
          </li>
          <li>
            <a
              href="#kds-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-orange-500 transition-colors block"
            >
              پنل آشپزخانه (KDS)
            </a>
          </li>
          <li>
            <a
              href="#features-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-orange-500 transition-colors block"
            >
              امکانات پلتفرم
            </a>
          </li>
          <li>
            <a
              href="#pricing-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-orange-500 transition-colors block"
            >
              تعرفه‌ها و اشتراک
            </a>
          </li>
          <li>
            <a
              href="#faq-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-orange-500 transition-colors block"
            >
              سوالات متداول
            </a>
          </li>
        </ul>

        <Link
          to="/login"
          onClick={() => setIsMobileMenuOpen(false)}
          className="mt-12 font-bold text-base bg-orange-500 text-white px-10 py-4 rounded-full shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95 transition-all"
        >
          ورود به پنل مدیریت
        </Link>
      </div>

      <main id="main-content">
        {/* ================= 1. Hero Section ================= */}
        <section
          id="hero-section"
          className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden bg-[#fffaf5]"
        >
          {/* هاله‌های نوری و بافت هندسی ظریف پس‌زمینه */}
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#fed7aa 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="absolute top-16 right-[-5%] w-[560px] h-[560px] bg-orange-300/25 rounded-full blur-[130px] pointer-events-none z-0" />
          <div className="absolute bottom-0 left-[-8%] w-[480px] h-[480px] bg-amber-400/15 rounded-full blur-[110px] pointer-events-none z-0" />

          {/* محتوای اصلی Hero */}
          <div className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row gap-14 lg:gap-10 items-center relative z-10">
            {/* ستون راست: کپی‌رایتینگ، آمار و دکمه‌ها */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-right">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-orange-200/70 text-orange-600 text-xs sm:text-[13px] font-black mb-7 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                </span>
                <span>پلتفرم منوی دیجیتال QR کد و مدیریت سالن ترنج</span>
              </div>

              <h1 className="font-black text-4xl sm:text-5xl lg:text-[62px] leading-[1.18] mb-6 text-gray-900 tracking-tight">
                منوی دیجیتال هوشمند و{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-l from-orange-600 via-orange-500 to-amber-500">
                    سفارش‌گیری آنلاین
                  </span>
                  <span className="absolute bottom-2 inset-x-0 h-3 bg-orange-200/50 -z-0 rounded-full" />
                </span>{" "}
                رستوران و کافه.
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed mb-9 max-w-xl font-medium">
                با <strong className="text-gray-800 font-black">ترنج</strong>،
                منوی آنلاین اختصاصی مجموعه خود را با بارکد QR میزها و{" "}
                <strong className="text-gray-800 font-bold">
                  ۰٪ کارمزد از فروش
                </strong>{" "}
                بسازید؛ قیمت‌ها را لحظه‌ای تغییر دهید و سفارش‌ها را مستقیم در
                پنل آشپزخانه دریافت کنید.
              </p>

              {/* دکمه‌های CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-10">
                <Link
                  to="/register"
                  className="group relative flex items-center justify-center gap-3 bg-gradient-to-l from-orange-600 to-orange-500 text-white font-black text-base px-8 py-4 rounded-2xl shadow-[0_14px_35px_rgba(234,88,12,0.28)] hover:shadow-[0_18px_45px_rgba(234,88,12,0.38)] transition-all duration-300 w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                  <span>ساخت منوی دیجیتال رایگان</span>
                  <ArrowLeft
                    size={18}
                    strokeWidth={2.5}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                </Link>

                <a
                  href="#kds-section"
                  className="flex items-center justify-center gap-2.5 bg-white/90 text-gray-800 border border-gray-200/90 font-bold text-base px-7 py-4 rounded-2xl hover:bg-white hover:border-orange-200 transition-all duration-300 w-full sm:w-auto shadow-2xs"
                >
                  <PlayCircle size={20} className="text-orange-500" />
                  <span>تجربه پنل آشپزخانه</span>
                </a>
              </div>

              {/* نوار اعتماد و شاخص‌های کلیدی */}
              <div className="w-full max-w-lg grid grid-cols-3 gap-3 bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                <div className="text-center lg:text-right px-2">
                  <span className="block font-black text-xl sm:text-2xl text-gray-900">
                    +۵۰۰
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">
                    کافه و رستوران فعال
                  </span>
                </div>
                <div className="text-center lg:text-right px-2 border-x border-gray-100">
                  <span className="block font-black text-xl sm:text-2xl text-orange-600">
                    ۰٪
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">
                    کارمزد از سفارش‌ها
                  </span>
                </div>
                <div className="text-center lg:text-right px-2">
                  <span className="block font-black text-xl sm:text-2xl text-gray-900">
                    ۱۵ قالب
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">
                    مدرن، لوکس و سنتی
                  </span>
                </div>
              </div>
            </div>

            {/* ستون چپ: ویترین تعاملی موبایل + کارت‌های شناور */}
            <div className="flex-1 w-full flex justify-center items-center relative">
              {/* کارت شناور ۱: رزرو میز زنده */}
              <div className="hidden xl:flex items-center gap-3 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.08)] border border-orange-100/80 absolute -right-4 top-14 z-30 animate-float">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <span className="block text-xs font-black text-gray-900">
                    رزرو آنلاین میز ۴
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-600">
                    تایید شد • ساعت ۲۱:۰۰
                  </span>
                </div>
              </div>

              {/* کارت شناور ۲: اتصال لحظه‌ای به آشپزخانه */}
              <div className="hidden xl:flex items-center gap-3 bg-gray-900 text-white p-3.5 rounded-2xl shadow-[0_20px_45px_rgba(15,23,42,0.22)] border border-white/10 absolute -left-4 bottom-20 z-30">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <span className="block text-xs font-black">
                    ارسال آنی به آشپزخانه
                  </span>
                  <span className="block text-[10px] font-bold text-orange-300">
                    همگام‌سازی زنده WebSocket
                  </span>
                </div>
              </div>

              {/* بدنه موکاپ گوشی */}
              <div
                style={{
                  transform: isPhonePulsing ? "scale(0.98)" : undefined,
                }}
                className="relative w-[305px] sm:w-[325px] h-[610px] sm:h-[640px] bg-white rounded-[3.1rem] p-2.5 shadow-[0_40px_90px_rgba(234,88,12,0.14),_inset_0_0_0_10px_rgba(243,244,246,1)] transition-transform duration-500 flex flex-col z-20 group"
              >
                {/* داینامیک آیلند */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-950 rounded-full z-40 shadow-sm flex items-center justify-between px-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-gray-300 tracking-wide">
                    toranjmenu
                  </span>
                </div>

                {/* اسکرین داخلی */}
                <div className="relative w-full h-full bg-[#faf8f5] rounded-[2.5rem] overflow-hidden flex flex-col shadow-inner">
                  {/* هدر مجموعه داخل گوشی */}
                  <div className="bg-white px-5 pt-14 pb-4 flex flex-col items-center border-b border-gray-100 shadow-2xs relative z-10 shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white mb-2 shadow-md shadow-orange-500/20">
                      <Coffee size={26} strokeWidth={2.2} />
                    </div>
                    <h2 className="font-black text-gray-900 text-base">
                      کافه رستوران ترنج
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-orange-100">
                        میز شماره ۴
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        سفارش آنلاین فعال
                      </span>
                    </div>
                  </div>

                  {/* لیست محصولات تعاملی */}
                  <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 relative z-0 flex flex-col gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex gap-3 items-center hover:border-orange-200 transition-colors">
                      <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center border border-orange-100 shrink-0">
                        <Coffee size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-800 text-[13px] leading-tight mb-1 truncate">
                          کارامل ماکیاتو ویژه
                        </h3>
                        <p className="text-[10px] text-gray-400 truncate">
                          اسپرسو دبل، شیر بخارداده و سس کارامل
                        </p>
                        <p className="text-[12px] text-orange-600 font-black mt-1">
                          ۸۵,۰۰۰ <span className="text-[9px]">تومان</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="افزودن کارامل ماکیاتو به سبد خرید"
                        onClick={() => handleAddToMockCart(85)}
                        className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all active:scale-75 shrink-0"
                      >
                        <Plus size={15} strokeWidth={2.8} />
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex gap-3 items-center hover:border-orange-200 transition-colors">
                      <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
                        <Sandwich size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-800 text-[13px] leading-tight mb-1 truncate">
                          چیزبرگر ذغالی دبل
                        </h3>
                        <p className="text-[10px] text-gray-400 truncate">
                          دو ورق گوشت تازه، پنیر چدار و سس مخصوص
                        </p>
                        <p className="text-[12px] text-orange-600 font-black mt-1">
                          ۲۴۰,۰۰۰ <span className="text-[9px]">تومان</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="افزودن چیزبرگر ذغالی به سبد خرید"
                        onClick={() => handleAddToMockCart(240)}
                        className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all active:scale-75 shrink-0"
                      >
                        <Plus size={15} strokeWidth={2.8} />
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex gap-3 items-center hover:border-orange-200 transition-colors">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                        <Soup size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-800 text-[13px] leading-tight mb-1 truncate">
                          سالاد سزار با مرغ گریل
                        </h3>
                        <p className="text-[10px] text-gray-400 truncate">
                          کاهو رسمی، فیله گریل، پارمزان و کروتان
                        </p>
                        <p className="text-[12px] text-orange-600 font-black mt-1">
                          ۱۸۰,۰۰۰ <span className="text-[9px]">تومان</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="افزودن سالاد سزار به سبد خرید"
                        onClick={() => handleAddToMockCart(180)}
                        className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all active:scale-75 shrink-0"
                      >
                        <Plus size={15} strokeWidth={2.8} />
                      </button>
                    </div>
                  </div>

                  {/* سبد خرید استیکی داخل گوشی */}
                  <div
                    className={`absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] transform transition-transform duration-500 ease-out z-20 ${
                      cartItemsCount > 0
                        ? "translate-y-0"
                        : "translate-y-[120%]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3 px-1">
                      <span className="font-bold text-gray-600 text-[12px] flex items-center gap-1.5">
                        <ShoppingCart size={15} className="text-orange-500" />
                        سبد سفارش (
                        <span className="text-orange-600 font-black">
                          {cartItemsCount.toLocaleString("fa-IR")}
                        </span>
                        )
                      </span>
                      <span className="font-black text-gray-900 text-sm">
                        {cartTotalAmount.toLocaleString("fa-IR")}{" "}
                        <span className="text-[9px] text-gray-400 font-bold">
                          هزار تومان
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`w-full bg-gradient-to-r ${
                        isAddedFeedback
                          ? "from-emerald-500 to-green-500"
                          : "from-orange-600 to-orange-500"
                      } text-white font-black py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2`}
                    >
                      {isAddedFeedback ? (
                        <>
                          <Check size={15} strokeWidth={3} />
                          <span>به سفارش اضافه شد</span>
                        </>
                      ) : (
                        "ثبت سفارش و ارسال به آشپزخانه"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. Steps Section ================= */}
        <section
          id="steps-section"
          className="relative py-28 bg-white overflow-hidden border-y border-orange-100/60"
        >
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black mb-4">
                  <Rocket size={15} /> راه‌اندازی منوی آنلاین در کمتر از ۵ دقیقه
                </div>
                <h2 className="font-black text-3xl sm:text-5xl text-gray-900 tracking-tight">
                  مراحل ساخت{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-orange-400">
                    منوی دیجیتال QR کد.
                  </span>
                </h2>
              </div>
              <p className="text-gray-500 text-sm sm:text-base max-w-md font-medium">
                بدون نیاز به دانش فنی یا تجهیزات گران‌قیمت؛ روی هر مرحله کلیک
                کنید تا نحوه عملکرد آن را ببینید.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 grid grid-cols-1 gap-4">
                {stepsData.map((step, idx) => {
                  const isSelected = activeStepIdx === idx;
                  const StepIcon = step.icon;

                  return (
                    <article
                      key={step.num}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`cursor-pointer rounded-[28px] p-6 border-2 transition-all duration-300 flex items-start gap-5 ${
                        isSelected
                          ? "bg-[#fffaf5] border-orange-500 shadow-[0_16px_40px_rgba(234,88,12,0.09)]"
                          : "bg-gray-50/70 border-gray-100 hover:bg-white hover:border-orange-200"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                            : "bg-white text-gray-400 border border-gray-200/80"
                        }`}
                      >
                        <StepIcon size={26} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg ${
                              isSelected
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-200/70 text-gray-500"
                            }`}
                          >
                            {step.badge}
                          </span>
                          <span className="font-black text-2xl text-gray-200 select-none">
                            {step.num}
                          </span>
                        </div>

                        <h3 className="font-black text-lg sm:text-xl text-gray-900 mb-1.5">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-gray-950 via-gray-900 to-stone-900 text-white rounded-[32px] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-orange-300 text-xs font-black">
                      پیش‌نمایش {stepsData[activeStepIdx].badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <button
                          key={dot}
                          type="button"
                          aria-label={`نمایش مرحله ${dot + 1}`}
                          onClick={() => setActiveStepIdx(dot)}
                          className={`h-2 rounded-full transition-all ${
                            activeStepIdx === dot
                              ? "w-7 bg-orange-500"
                              : "w-2 bg-white/25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                        {React.createElement(stepsData[activeStepIdx].icon, {
                          size: 24,
                        })}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-white">
                          {stepsData[activeStepIdx].previewTitle}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">
                          {stepsData[activeStepIdx].subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        {stepsData[activeStepIdx].previewDetail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-8 flex items-center justify-between gap-4">
                  <Link
                    to="/register"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                  >
                    <span>همین حالا رایگان شروع کنید</span>
                    <ArrowLeft size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. KDS Section ================= */}
        <section
          id="kds-section"
          className="relative py-24 md:py-32 overflow-hidden bg-[#0c0a09] text-white"
        >
          <div className="absolute top-1/3 right-[-10%] w-[520px] h-[520px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="absolute bottom-0 left-[-5%] w-[420px] h-[420px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

          {kdsToast && (
            <div className="fixed bottom-6 left-6 z-50 bg-white text-gray-900 px-5 py-3.5 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2.5 border border-orange-200 animate-in fade-in slide-in-from-bottom-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{kdsToast}</span>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-orange-400 text-xs font-black mb-4">
                  <Monitor size={15} /> سیستم نمایشگر زنده آشپزخانه (KDS)
                </div>
                <h2 className="font-black text-4xl md:text-5xl lg:text-6xl leading-[1.18] tracking-tight">
                  مدیریت سفارش‌های{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-amber-300">
                    آشپزخانه در یک نگاه.
                  </span>
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="inline-flex items-center gap-2.5 bg-white/[0.07] border border-white/10 px-4 py-3 rounded-2xl text-xs font-bold text-orange-300">
                  <Hand size={17} className="animate-bounce text-orange-400" />
                  <span>روی هر فیش کلیک کنید تا مرحله پخت تغییر کند</span>
                </div>

                {kdsOrders.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setKdsOrders(INITIAL_KDS_ORDERS)}
                    className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-3 rounded-2xl transition-colors"
                  >
                    <RotateCcw size={15} />
                    <span>بازنشانی فیش‌ها</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <span className="font-black text-sm text-white block">
                      ترمینال زنده آشپزخانه ترنج
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      بروزرسانی لحظه‌ای وضعیت سفارش در گوشی مشتری
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-black flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    متصل به سالن
                  </span>
                </div>
              </div>

              <div className="md:hidden text-center mb-3 flex items-center justify-center gap-1.5 text-gray-400 font-bold text-[11px]">
                <ArrowLeftRight size={14} /> برای مشاهده ستون‌های دیگر به چپ
                بکشید
              </div>

              <div
                ref={kdsBoardScrollRef}
                className="flex flex-row md:grid md:grid-cols-3 gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory hide-scrollbar pb-2 md:pb-0"
              >
                {[
                  {
                    colId: 1 as const,
                    title: "سفارش‌های جدید",
                    icon: Clock,
                    accentDot: "bg-sky-400",
                    badgeBg: "bg-sky-500/15 text-sky-300 border-sky-500/30",
                    cardBorder: "hover:border-sky-400/50",
                  },
                  {
                    colId: 2 as const,
                    title: "در حال آماده‌سازی",
                    icon: Flame,
                    accentDot: "bg-orange-400",
                    badgeBg:
                      "bg-orange-500/15 text-orange-300 border-orange-500/30",
                    cardBorder: "hover:border-orange-400/50",
                  },
                  {
                    colId: 3 as const,
                    title: "آماده تحویل به میز",
                    icon: CheckCircle2,
                    accentDot: "bg-emerald-400",
                    badgeBg:
                      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                    cardBorder: "hover:border-emerald-400/50",
                  },
                ].map((colDef) => {
                  const colOrders = kdsOrders.filter(
                    (o) => o.col === colDef.colId,
                  );
                  const ColIcon = colDef.icon;

                  return (
                    <div
                      key={colDef.colId}
                      ref={(el) => {
                        kdsColRefs.current[colDef.colId] = el;
                      }}
                      className="min-w-[85%] md:min-w-0 snap-center bg-white/[0.03] rounded-3xl border border-white/[0.08] p-4 flex flex-col min-h-[340px]"
                    >
                      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/[0.07]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${colDef.accentDot}`}
                          />
                          <ColIcon size={16} className="text-gray-300" />
                          <h3 className="font-black text-sm text-white">
                            {colDef.title}
                          </h3>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${colDef.badgeBg}`}
                        >
                          {colOrders.length.toLocaleString("fa-IR")}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1">
                        {colOrders.map((order) => (
                          <div
                            key={order.id}
                            onClick={() => handleMoveKdsOrder(order)}
                            className={`kds-card cursor-pointer bg-[#171412] border border-white/10 ${colDef.cardBorder} rounded-2xl p-4 transition-all relative group/card ${
                              removingOrderId === order.id
                                ? "scale-90 opacity-0"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.07]">
                              <div className="flex items-center gap-2">
                                <span className="bg-orange-500 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                                  میز {order.table.toLocaleString("fa-IR")}
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                  #{order.id}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                <Clock size={12} /> {order.time}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-xs font-bold"
                                >
                                  <span className="text-gray-200">
                                    {item.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-orange-300 font-black">
                                    ×{item.qty.toLocaleString("fa-IR")}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-black text-orange-400">
                              <span>
                                {order.col === 3
                                  ? "کلیک برای تحویل نهایی"
                                  : "کلیک برای مرحله بعد"}
                              </span>
                              <ArrowLeft size={14} />
                            </div>
                          </div>
                        ))}

                        {colOrders.length === 0 && (
                          <div className="h-44 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
                            فیشی در این مرحله نیست
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. Features Section ================= */}
        <section
          id="features-section"
          className="relative py-28 bg-[#fffaf5] overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black mb-4">
                <Wand2 size={15} /> امکانات نرم‌افزار منوی دیجیتال ترنج
              </div>
              <h2 className="font-black text-4xl md:text-5xl text-gray-900 tracking-tight mb-4">
                ابزارهای هوشمند{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-orange-400">
                  مدیریت رستوران و کافه.
                </span>
              </h2>
              <p className="text-gray-500 text-base font-medium">
                جایگزین مدرن منوی کاغذی برای کاهش هزینه‌های چاپ، تغییر لحظه‌ای
                قیمت‌ها و افزایش سرعت سرویس‌دهی.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* کارت ۱ */}
              <article className="md:col-span-7 bg-white rounded-[32px] p-7 sm:p-8 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:border-orange-200 transition-all">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                      <Calculator size={24} />
                    </div>
                    <h3 className="font-black text-2xl text-gray-900 mb-2">
                      حسابداری دقیق و گزارشات رسمی فروش
                    </h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md">
                      گزارش فروش روزانه، ماهانه و سالانه، تفکیک فروش نقدی و
                      آنلاین، پرفروش‌ترین غذاها و چاپ صورت‌حساب رسمی با یک کلیک.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-xl">
                    <TrendingUp size={14} /> +۲۸٪ رشد فروش
                  </span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-end justify-between gap-3 h-32">
                  {[38, 55, 44, 72, 63, 92, 84].map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <div
                        style={{ height: `${val}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          idx === 5
                            ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-md shadow-orange-500/20"
                            : "bg-gray-200 group-hover:bg-orange-200"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </article>

              {/* کارت ۲ */}
              <article className="md:col-span-5 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-[32px] p-7 sm:p-8 shadow-[0_18px_45px_rgba(234,88,12,0.22)] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                    <CalendarCheck size={24} />
                  </div>
                  <h3 className="font-black text-2xl mb-2">
                    رزرو آنلاین و نقشه زنده میزها
                  </h3>
                  <p className="text-sm text-white/90 font-medium leading-relaxed">
                    مشتری میزهای آزاد را به‌صورت زنده می‌بیند و رزرو می‌کند؛
                    میزهایی که سفارش باز دارند نیز به‌صورت خودکار رزرو محسوب
                    می‌شوند.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mt-6 bg-black/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center text-xs font-black">
                  <div className="bg-white text-emerald-700 py-2.5 rounded-xl">
                    میز ۱ • آزاد
                  </div>
                  <div className="bg-white/20 text-white py-2.5 rounded-xl">
                    میز ۲ • رزرو
                  </div>
                  <div className="bg-white text-emerald-700 py-2.5 rounded-xl">
                    میز ۳ • آزاد
                  </div>
                </div>
              </article>

              {/* کارت ۳ */}
              <article className="md:col-span-4 bg-white rounded-[32px] p-7 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-blue-200 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Users size={24} />
                  </div>
                  <h3 className="font-black text-xl text-gray-900 mb-2">
                    سطح دسترسی هوشمند تیم و پرسنل
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                    پنل اختصاصی برای سرآشپز، صندوق‌دار و سالن‌دار با نام کاربری
                    و رمز عبور مجزا.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  {[
                    {
                      label: "مدیر کل",
                      icon: UserCircle,
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      label: "صندوق‌دار",
                      icon: CreditCard,
                      color: "text-pink-600 bg-pink-50",
                    },
                    {
                      label: "سرآشپز",
                      icon: ChefHat,
                      color: "text-orange-600 bg-orange-50",
                    },
                    {
                      label: "سالن‌دار",
                      icon: BellRing,
                      color: "text-emerald-600 bg-emerald-50",
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs font-black text-gray-700"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.color}`}
                      >
                        <r.icon size={15} />
                      </div>
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              {/* کارت ۴ */}
              <article className="md:col-span-4 bg-white rounded-[32px] p-7 border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-purple-200 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <Paintbrush size={24} />
                  </div>
                  <h3 className="font-black text-xl text-gray-900 mb-2">
                    ۱۵ قالب گرافیکی اختصاصی منو
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                    انتخاب بین قالب مینیمال مدرن، گالری مجله‌ای و قالب اصیل سنتی
                    مخصوص کافه‌ها و رستوران‌ها.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <span className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-center text-xs font-black">
                    مدرن اپل
                  </span>
                  <span className="flex-1 py-2.5 rounded-xl bg-stone-900 text-amber-400 text-center text-xs font-black">
                    گالری
                  </span>
                  <span className="flex-1 py-2.5 rounded-xl bg-[#0F4C5C] text-[#FDE68A] text-center text-xs font-black">
                    سنتی
                  </span>
                </div>
              </article>

              {/* کارت ۵ */}
              <article className="md:col-span-4 bg-gray-900 text-white rounded-[32px] p-7 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-orange-400 flex items-center justify-center mb-4">
                    <Globe size={24} />
                  </div>
                  <h3 className="font-black text-xl mb-2">
                    منوی دوزبانه و پشتیبانی ۲۴/۷
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                    نمایش هم‌زمان منو به زبان فارسی و انگلیسی برای مهمانان خارجی
                    همراه با پشتیبانی دائمی تیم فنی ترنج.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between bg-white/[0.06] border border-white/10 px-4 py-3 rounded-2xl text-xs font-black">
                  <span className="text-orange-400">FA / EN</span>
                  <span className="text-emerald-400">پاسخگویی سریع</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ================= 5. Pricing Section (متصل به بک‌اند جنگو) ================= */}
        <section
          id="pricing-section"
          className="relative py-28 overflow-hidden bg-[#fffaf5]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-100/40 rounded-full blur-[120px] pointer-events-none z-0" />

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-black text-4xl md:text-5xl text-gray-900 tracking-tight mb-4">
                تعرفه اشتراک{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                  منوی دیجیتال بدون کارمزد.
                </span>
              </h2>
              <p className="text-gray-500 text-lg mb-10 font-medium">
                پلن مناسب مجموعه خود را انتخاب کنید. بدون هیچ‌گونه کمیسیون از
                سفارش‌ها.
              </p>

              {/* سوئیچر کپسولی بازه زمانی ۳، ۶ و ۹ ماهه */}
              <div className="relative inline-flex bg-gray-200/60 backdrop-blur-md p-1.5 rounded-full border border-white shadow-sm mx-auto">
                <div
                  style={{
                    transform: `translateX(-${activeDurationIndex * 100}%)`,
                  }}
                  className="absolute top-1.5 bottom-1.5 right-1.5 w-[104px] md:w-[124px] bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-out"
                />

                {durationTabs.map((tab) => (
                  <button
                    key={tab.months}
                    type="button"
                    onClick={() => handleChangeDuration(tab.months)}
                    className={`relative z-10 w-[104px] md:w-[124px] py-2.5 font-black text-sm transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                      selectedMonths === tab.months
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.tag && (
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingPlans && plans.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-orange-500" size={36} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
                {plans.map((plan) => {
                  const rawAmount =
                    selectedMonths === 3
                      ? plan.price3m
                      : selectedMonths === 6
                        ? plan.price6m
                        : plan.price9m;
                  const formattedPrice =
                    Math.floor(rawAmount).toLocaleString("fa-IR");

                  return (
                    <article
                      key={plan.id}
                      className={`relative backdrop-blur-2xl rounded-[2.8rem] transition-all duration-500 flex flex-col h-full ${
                        plan.isPopular
                          ? "bg-white/95 border-2 border-orange-200 p-9 md:p-10 shadow-[0_20px_50px_rgba(234,88,12,0.09)] md:-translate-y-4 hover:-translate-y-6 z-10"
                          : "bg-white/80 border border-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1"
                      }`}
                    >
                      {plan.badgeText && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-orange-400 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(234,88,12,0.3)] border border-white/50 whitespace-nowrap">
                          {plan.badgeText}
                        </div>
                      )}

                      <h3 className="font-black text-2xl text-gray-900 mb-2">
                        پلن {plan.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-8 font-medium">
                        {plan.subtitle}
                      </p>

                      <div
                        className={`mb-8 pb-8 border-b border-gray-100 flex items-baseline gap-2 transition-opacity duration-200 ${
                          isPriceFading ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        <span
                          className={`font-black ${
                            plan.isPopular ? "text-4xl sm:text-5xl" : "text-4xl"
                          } text-gray-900`}
                        >
                          {formattedPrice}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400 font-bold">
                          تومان / {selectedMonths.toLocaleString("fa-IR")} ماه
                        </span>
                      </div>

                      <ul className="flex flex-col gap-3.5 mb-10 flex-1">
                        {plan.featuresList.map((feature, idx) => (
                          <li
                            key={idx}
                            className={`flex items-start gap-3 text-sm ${
                              plan.isPopular
                                ? "text-gray-800 font-bold"
                                : "text-gray-700 font-medium"
                            }`}
                          >
                            <CheckCircle2
                              size={18}
                              className={`shrink-0 mt-0.5 ${
                                plan.isPopular
                                  ? "text-orange-500"
                                  : "text-gray-400"
                              }`}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        to="/register"
                        className={`w-full py-4 rounded-2xl font-black text-sm text-center transition-all ${
                          plan.isPopular
                            ? "bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-[0_8px_25px_rgba(234,88,12,0.25)] hover:shadow-[0_12px_30px_rgba(234,88,12,0.35)] hover:scale-[1.02]"
                            : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {plan.isPopular
                          ? `شروع با پلن ${plan.name}`
                          : `انتخاب پلن ${plan.name}`}
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ================= 6. Clients & Testimonials ================= */}
        <section
          id="clients-section"
          className="relative py-32 overflow-hidden bg-white"
        >
          <div className="text-center mb-16 relative z-20 px-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-gray-600 text-sm font-bold mb-4 shadow-sm">
              <Building2 size={16} className="text-orange-500" /> خانواده بزرگ
              ترنج
            </div>
            <h2 className="font-black text-4xl md:text-5xl leading-[1.3] text-gray-900 tracking-tight">
              مورد اعتمادِ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                بهترین کافه‌ها و رستوران‌ها.
              </span>
            </h2>
          </div>

          {/* نوار اسکرول بی‌نهایت */}
          <div
            aria-hidden="true"
            className="relative w-full flex flex-col gap-6 mb-24 opacity-60 z-10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10 pointer-events-none" />

            <div className="marquee-track flex gap-8 w-[200%]">
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  className="marquee-content flex gap-8 items-center justify-around animate-marquee whitespace-nowrap"
                >
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-400 mx-8">
                    <Coffee size={24} /> کافه لمیز
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-400 mx-8">
                    <Sandwich size={24} /> برگرلند
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-400 mx-8">
                    <Soup size={24} /> رستوران روحی
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-400 mx-8">
                    <Pizza size={24} /> پیتزا سیب
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-400 mx-8">
                    <Wine size={24} /> کافه ویونا
                  </div>
                </div>
              ))}
            </div>

            <div className="marquee-track flex gap-8 w-[200%]">
              {[0, 1].map((dup) => (
                <div
                  key={dup}
                  className="marquee-content flex gap-8 items-center justify-around animate-marquee-reverse whitespace-nowrap"
                >
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-300 mx-8">
                    <Store size={24} /> فودکورت آرتمیس
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-300 mx-8">
                    <Utensils size={24} /> رستوران نایب
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-300 mx-8">
                    <Coffee size={24} /> کافه رئیس
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-300 mx-8">
                    <IceCream size={24} /> ژلاتو هاوس
                  </div>
                  <div className="flex items-center gap-3 font-black text-2xl text-gray-300 mx-8">
                    <Croissant size={24} /> نان سحر
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* کارت‌های نظرات مشتریان */}
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
            <article className="group relative rounded-[2rem] p-[2px] overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 group-hover:from-orange-400 group-hover:to-orange-600 transition-colors duration-500" />
              <div className="relative h-full bg-white/95 backdrop-blur-2xl rounded-[calc(2rem-2px)] p-8 flex flex-col">
                <div className="w-14 h-14 bg-gray-50 text-orange-500 rounded-full flex items-center justify-center border border-gray-100 mb-6 group-hover:scale-110 transition-transform">
                  <Coffee size={26} />
                </div>
                <p className="text-gray-600 text-sm leading-loose mb-6 flex-1 font-medium">
                  «از وقتی ترنج رو راه‌اندازی کردیم، سرعت سفارش‌گیری ما ۳ برابر
                  شده و اشتباهات گارسون‌ها به صفر رسیده. پنل KDS فوق‌العادست.»
                </p>
                <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop"
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover grayscale opacity-80"
                      alt="تصویر علی محمدی مدیریت کافه لمیز"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">
                      علی محمدی
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">
                      مدیریت کافه لمیز
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="group relative rounded-[2rem] p-[2px] overflow-hidden transform hover:-translate-y-2 transition-transform duration-500 shadow-[0_15px_40px_rgba(234,88,12,0.08)]">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-gray-100 group-hover:from-orange-400 group-hover:to-orange-600 transition-colors duration-500" />
              <div className="relative h-full bg-white/95 backdrop-blur-2xl rounded-[calc(2rem-2px)] p-8 flex flex-col">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border border-orange-100 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  <Sandwich size={26} />
                </div>
                <p className="text-gray-600 text-sm leading-loose mb-6 flex-1 font-medium">
                  «مشتری‌ها عاشق این شدن که می‌تونن عکس باکیفیت غذاها رو روی
                  گوشی خودشون ببینن. فروش ما تو ماه اول ۲۰ درصد افزایش پیدا
                  کرد.»
                </p>
                <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover grayscale opacity-80"
                      alt="تصویر سینا راد مالک برگرلند"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">
                      سینا راد
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">
                      مالک برگرلند
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="group relative rounded-[2rem] p-[2px] overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 group-hover:from-orange-400 group-hover:to-orange-600 transition-colors duration-500" />
              <div className="relative h-full bg-white/95 backdrop-blur-2xl rounded-[calc(2rem-2px)] p-8 flex flex-col">
                <div className="w-14 h-14 bg-gray-50 text-orange-500 rounded-full flex items-center justify-center border border-gray-100 mb-6 group-hover:scale-110 transition-transform">
                  <Store size={26} />
                </div>
                <p className="text-gray-600 text-sm leading-loose mb-6 flex-1 font-medium">
                  «قابلیت حسابداری و اتصال مستقیم به درگاه پرداخت برای مجموعه
                  بزرگ ما یک معجزه بود. همه چیز یکپارچه و دقیق کار می‌کنه.»
                </p>
                <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover grayscale opacity-80"
                      alt="تصویر سارا حسینی مدیر فودکورت آرتمیس"
                    />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">
                      سارا حسینی
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">
                      مدیر فودکورت آرتمیس
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ================= 7. FAQ Section ================= */}
        <section
          id="faq-section"
          className="relative py-32 overflow-hidden bg-[#fffaf5]"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-bold mb-4 shadow-sm">
                <HelpCircle size={16} /> سوالات متداول
              </div>
              <h2 className="font-black text-4xl md:text-5xl leading-[1.3] text-gray-900 tracking-tight">
                سوالات متداول درباره{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                  منوی دیجیتال ترنج.
                </span>
              </h2>
              <p className="text-gray-500 text-lg mt-4 font-medium">
                پاسخ به پرتکرارترین پرسش‌های مدیران کافه و رستوران.
              </p>
            </div>

            <div className="bg-white/75 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 md:p-10">
              <div className="flex flex-col">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-right py-6 flex justify-between items-center group transition-colors gap-4"
                      >
                        <h3
                          className={`font-bold text-base sm:text-lg transition-colors pr-2 ${
                            isOpen
                              ? "text-orange-600"
                              : "text-gray-800 group-hover:text-orange-600"
                          }`}
                        >
                          {item.question}
                        </h3>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-orange-50 transition-colors">
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-300 ${
                              isOpen
                                ? "rotate-180 text-orange-500"
                                : "text-gray-400 group-hover:text-orange-500"
                            }`}
                          />
                        </div>
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-gray-500 leading-relaxed pb-6 pr-2 font-medium text-sm md:text-base">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-gray-500 text-sm font-medium">
                سوال دیگری دارید؟{" "}
                <a
                  href="#contact-section"
                  className="font-bold text-orange-600 hover:text-orange-500 transition-colors border-b border-orange-200 pb-0.5"
                >
                  با پشتیبانی ۲۴ ساعته ما تماس بگیرید.
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ================= 8. Contact & Support Section ================= */}
        <section
          id="contact-section"
          className="relative py-32 overflow-hidden bg-white"
        >
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-gray-600 text-sm font-bold mb-6 w-fit shadow-sm">
                  <Headset size={16} className="text-orange-500" /> ارتباط با
                  ترنج
                </div>

                <h2 className="font-black text-4xl md:text-5xl leading-[1.2] text-gray-900 tracking-tight mb-10">
                  پاسخگوی <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                    صدای شما.
                  </span>
                </h2>

                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shrink-0">
                      <MapPin size={22} />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        آدرس دفتر مرکزی
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed font-medium">
                        تهرانسر، بلوار اصلی، چهارراه صدف
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shrink-0">
                      <PhoneCall size={22} />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        تماس تلفنی
                      </h3>
                      <p
                        className="text-gray-500 text-sm leading-relaxed font-bold tracking-widest"
                        dir="ltr"
                      >
                        ۰۲۱ - ۴۴۵۲ ۶۴۴۸
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors shrink-0">
                      <Mail size={22} />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        پست الکترونیک
                      </h3>
                      <p
                        className="text-gray-500 text-sm leading-relaxed font-medium"
                        dir="ltr"
                      >
                        info@toranjmenu.ir
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative w-full mt-10 lg:mt-0">
                <div className="bg-white/75 backdrop-blur-2xl border border-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] text-center relative z-10 transform transition-transform duration-500 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-100 text-orange-500">
                    <MessageCircle size={32} />
                  </div>

                  <h3 className="font-black text-2xl text-gray-900 mb-3">
                    پشتیبانی آنلاین
                  </h3>
                  <p className="text-gray-500 text-sm mb-10 leading-relaxed font-medium">
                    کارشناسان ما در پیام‌رسان‌های زیر، آماده‌ی پاسخگویی سریع به
                    سوالات و مشکلات شما هستند.
                  </p>

                  <div className="flex flex-col gap-4">
                    <a
                      href="https://t.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#0088cc]/5 border border-[#0088cc]/20 hover:bg-[#0088cc] hover:shadow-[0_10px_20px_rgba(0,136,204,0.3)] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#0088cc]">
                          <Send size={20} />
                        </div>
                        <span className="font-bold text-gray-800 group-hover:text-white transition-colors">
                          پشتیبانی تلگرام
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-white">
                        <ArrowLeft size={16} />
                      </div>
                    </a>

                    <a
                      href="https://ble.ir/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#1fc16d]/5 border border-[#1fc16d]/20 hover:bg-[#1fc16d] hover:shadow-[0_10px_20px_rgba(31,193,109,0.3)] transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#1fc16d]">
                          <MessageCircle size={20} />
                        </div>
                        <span className="font-bold text-gray-800 group-hover:text-white transition-colors">
                          پشتیبانی پیام‌رسان بله
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-white">
                        <ArrowLeft size={16} />
                      </div>
                    </a>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full blur-[40px] opacity-30 -z-10 animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= 9. Footer ================= */}
      <footer className="relative bg-[#09090b] text-white pt-10 pb-10 mt-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[340px] bg-orange-500/15 rounded-full blur-[140px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* کارت فراخوان پیش‌فوتر */}
          <div className="bg-gradient-to-l from-orange-600 via-orange-500 to-amber-500 rounded-[2.5rem] p-8 md:p-12 mb-16 shadow-[0_25px_60px_rgba(234,88,12,0.28)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#ffffff 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10 text-center lg:text-right max-w-xl">
              <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-white mb-4">
                <Sparkles size={14} />
                <span>ساخت منوی دیجیتال در کمتر از ۵ دقیقه</span>
              </div>
              <h2 className="font-black text-3xl sm:text-4xl text-white leading-tight mb-3">
                کافه یا رستوران خود را به{" "}
                <span className="underline decoration-white/50 underline-offset-8">
                  ترنج
                </span>{" "}
                مجهز کنید.
              </h2>
              <p className="text-white/90 text-sm sm:text-base font-medium">
                بدون هزینه راه‌اندازی اولیه و بدون کمیسیون از فروش؛ همین امروز
                بارکد اختصاصی میزهایتان را بسازید.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
              <div className="bg-white/95 text-gray-900 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg w-full sm:w-auto justify-center">
                <QrCode size={26} className="text-orange-600 shrink-0" />
                <div className="text-left" dir="ltr">
                  <span className="block text-[10px] font-bold text-gray-400">
                    OFFICIAL DOMAIN
                  </span>
                  <span className="font-mono font-black text-sm text-gray-900">
                    toranjmenu.ir
                  </span>
                </div>
              </div>

              <Link
                to="/register"
                className="bg-gray-950 hover:bg-gray-900 text-white font-black text-sm px-7 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 w-full sm:w-auto"
              >
                <span>ساخت پنل رایگان</span>
                <ArrowLeft size={17} />
              </Link>
            </div>
          </div>

          {/* شبکه اصلی محتوای فوتر */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-white/10">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <ToranjLogoMark className="w-11 h-11" />
                  <div>
                    <span className="font-black text-3xl text-white tracking-tight block leading-none">
                      ترن<span className="text-orange-500">ج</span>
                    </span>
                    <span
                      className="text-xs font-mono text-orange-400 font-bold"
                      dir="ltr"
                    >
                      toranjmenu.ir
                    </span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed max-w-md font-medium mb-6">
                  پلتفرم جامع منوی دیجیتال، رزرو هوشمند میز، نمایشگر زنده
                  آشپزخانه (KDS) و حسابداری یکپارچه برای کافه‌ها، رستوران‌ها و
                  مجموعه‌های پذیرایی مدرن و سنتی.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/10 px-4 py-2.5 rounded-2xl w-fit">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-gray-300">
                  تمامی سرویس‌های ترنج فعال هستند (آپتایم ۹۹.۹٪)
                </span>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-black text-white text-base mb-5">
                بخش‌های پلتفرم
              </h3>
              <ul className="space-y-3.5 text-sm font-medium text-gray-400">
                <li>
                  <a
                    href="#steps-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    مراحل راه‌اندازی
                  </a>
                </li>
                <li>
                  <a
                    href="#kds-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    مانیتور آشپزخانه
                  </a>
                </li>
                <li>
                  <a
                    href="#features-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    امکانات و قالب‌ها
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    تعرفه‌های اشتراک
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-black text-white text-base mb-5">
                کاربران و پشتیبانی
              </h3>
              <ul className="space-y-3.5 text-sm font-medium text-gray-400">
                <li>
                  <Link
                    to="/register"
                    className="hover:text-orange-400 transition-colors"
                  >
                    ثبت‌نام مجموعه جدید
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-orange-400 transition-colors"
                  >
                    ورود به پنل مدیریت
                  </Link>
                </li>
                <li>
                  <a
                    href="#faq-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    سوالات متداول
                  </a>
                </li>
                <li>
                  <a
                    href="#contact-section"
                    className="hover:text-orange-400 transition-colors"
                  >
                    ارتباط با پشتیبانی
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-white text-base mb-5">
                  مجوزها و شبکه‌های اجتماعی
                </h3>

                <div className="flex gap-3 mb-5">
                  <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-500/40 transition-colors">
                    <ShieldCheck size={24} className="text-orange-400" />
                    <span className="font-bold text-[10px] text-gray-400 text-center">
                      نماد اعتماد الکترونیک
                    </span>
                  </div>

                  <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-500/40 transition-colors">
                    <Award size={24} className="text-orange-400" />
                    <span className="font-bold text-[10px] text-gray-400 text-center">
                      نشان ملی ثبت دیجیتال
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="اینستاگرام ترنج"
                  className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 hover:bg-orange-500 hover:text-white transition-all"
                >
                  <CameraIcon />
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="تلگرام ترنج"
                  className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 hover:bg-[#0088cc] hover:text-white transition-all"
                >
                  <Send size={17} />
                </a>
                <a
                  href="https://ble.ir"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="بله ترنج"
                  className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-gray-300 hover:bg-[#1fc16d] hover:text-white transition-all"
                >
                  <MessageCircle size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* تایپوگرافی برند در پس‌زمینه پایین فوتر */}
          <div
            aria-hidden="true"
            className="relative py-6 select-none pointer-events-none overflow-hidden flex justify-center"
          >
            <span
              className="font-black text-[64px] sm:text-[110px] lg:text-[150px] leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/[0.07] to-transparent"
              dir="ltr"
            >
              TORANJMENU
            </span>
          </div>

          {/* نوار کپی‌رایت نهایی */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
            <p>
              © ۲۰۲۶ تمامی حقوق مادی و معنوی متعلق به پلتفرم{" "}
              <strong className="text-gray-300 font-bold">
                ترنج (toranjmenu.ir)
              </strong>{" "}
              است.
            </p>
            <div className="flex items-center gap-5">
              <Link to="/terms" className="hover:text-white transition-colors">
                قوانین و مقررات
              </Link>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                حریم خصوصی
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-link {
          position: relative;
          transition: color 0.3s ease;
        }
        .nav-link::before {
          content: "";
          position: absolute;
          inset: -6px -12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 9999px;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }
        .nav-link:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }

        @keyframes kdsPop {
          0% { transform: scale(0.88); opacity: 0; }
          60% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .kds-card {
          animation: kdsPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 35s linear infinite;
        }
        .marquee-track:hover .marquee-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

const CameraIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default Landing;
