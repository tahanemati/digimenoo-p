import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Trash2,
  Palette,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  X,
  ShoppingBag,
  BellRing,
  Loader2,
  Store,
  Hash,
  ArrowLeft,
  ChefHat,
  Globe,
  Languages,
  Save,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
  Lock,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";
import {
  useSubscription,
  normalizeTemplateCode,
  resolveTemplateRequiredTier,
  type FeatureKey,
  type PlanTier,
} from "../context/SubscriptionContext";

type SettingsTab = "general" | "features" | "branding";

const PUBLIC_MENU_ORIGIN = "https://toranjmenu.ir";

const TIER_LABELS: Record<Exclude<PlanTier, "none">, string> = {
  basic: "پایه",
  standard: "استاندارد",
  plus: "پلاس",
};

// گرادیانت پس‌زمینه کارت در صورت نبود تصویر بندانگشتی (۱۵ قالب کامل)
const getTemplateSwatch = (code: string, index: number) => {
  const numMatch = String(code || "").match(/\d+/);
  const idx = numMatch ? parseInt(numMatch[0], 10) : index + 1;

  const swatches = [
    "from-orange-500 to-amber-400",
    "from-[#431407] to-orange-500",
    "from-[#0F4C5C] to-amber-400",
    "from-slate-800 to-slate-500",
    "from-[#09090B] via-[#1C1917] to-[#D4AF37]",
    "from-[#4F6354] to-[#B86B35]",
    "from-[#7A1632] to-[#E9A6B5]",
    "from-[#141824] to-[#D92D20]",
    "from-[#141414] to-[#C81E1E]",
    "from-[#2F5E41] to-[#B85D3B]",
    "from-[#09090F] via-[#00F0FF] to-[#FF2A85]",
    "from-[#1D1D1F] to-[#0071E3]",
    "from-[#09090D] via-[#1E202B] to-[#E5B869]",
    "from-[#143B2E] via-[#2D6A4F] to-[#C96442]",
    "from-[#070B18] via-[#1D4ED8] to-[#FF6B4A]",
  ];

  return swatches[(Math.max(1, idx) - 1) % swatches.length];
};

export const VenueSettings: React.FC = () => {
  const {
    subscription,
    isLoading: isSubLoading,
    can,
    canUseTemplate,
    openUpgradeModal,
    refreshSubscription,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);
  const [pageError, setPageError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // اطلاعات نمایشی رستوران (Read-only)
  const [restaurantName, setRestaurantName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableCount, setTableCount] = useState<number | string>("");

  // فیلدهای تنظیمات
  const [aboutUsFa, setAboutUsFa] = useState("");
  const [aboutUsEn, setAboutUsEn] = useState("");
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
  const [isWaiterEnabled, setIsWaiterEnabled] = useState(true);
  const [isChefRequestEnabled, setIsChefRequestEnabled] = useState(false);
  const [isBilingual, setIsBilingual] = useState(false);
  const [theme, setTheme] = useState("template_1");

  const [templates, setTemplates] = useState<any[]>([]);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [descError, setDescError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>("");

  const [showQRPopup, setShowQRPopup] = useState(false);

  // وضعیت رفرش و لود شدن پیش‌نمایش زنده iframe
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    const SERVER_URL = "http://localhost:5000";
    return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await venuesApi.getMyVenue();
        const venueData = response?.data?.data || response?.data || response;

        const fallbackTemplates = Array.from({ length: 15 }, (_, i) => ({
          code: `template_${i + 1}`,
          name: `قالب منو ${(i + 1).toLocaleString("fa-IR")}`,
          thumbnailUrl: "",
        }));

        let templatesData: any[] = [];
        try {
          const tplRes = await venuesApi.getTemplates?.();
          templatesData = tplRes?.data?.items || tplRes?.data || tplRes || [];
        } catch {
          console.warn("خطا در دریافت قالب‌ها، استفاده از لیست پیش‌فرض");
        }

        const rawTemplates =
          Array.isArray(templatesData) && templatesData.length > 0
            ? templatesData
            : fallbackTemplates;

        const finalTemplates = rawTemplates.map((tpl: any, idx: number) => {
          const code = normalizeTemplateCode(
            tpl?.code ||
              tpl?.Code ||
              tpl?.slug ||
              tpl?.id ||
              `template_${idx + 1}`,
          );
          const reqTier: Exclude<PlanTier, "none"> =
            tpl?.requiredTier || resolveTemplateRequiredTier(code);
          return {
            ...tpl,
            code,
            name:
              tpl?.name ||
              tpl?.Name ||
              `قالب منو ${(idx + 1).toLocaleString("fa-IR")}`,
            thumbnailUrl: tpl?.thumbnailUrl || tpl?.ThumbnailUrl || "",
            requiredTier: reqTier,
            requiredTierLabel: tpl?.requiredTierLabel || TIER_LABELS[reqTier],
          };
        });

        setTemplates(finalTemplates);

        setRestaurantName(venueData.name || venueData.Name || "رستوران من");
        setEnglishName(
          venueData.slug || venueData.Slug || venueData.english_name || "menu",
        );
        setPhone(
          venueData.phone || venueData.Phone || venueData.phoneNumber || "---",
        );
        setTableCount(
          venueData.tableCount ??
            venueData.TableCount ??
            venueData.table_count ??
            0,
        );

        setAboutUsFa(
          venueData.aboutUsFa ||
            venueData.AboutUsFa ||
            venueData.description ||
            "",
        );
        setAboutUsEn(venueData.aboutUsEn || venueData.AboutUsEn || "");

        setIsOrderingEnabled(
          venueData.orderingEnabled ?? venueData.OrderingEnabled ?? true,
        );
        setIsWaiterEnabled(
          venueData.callWaiterEnabled ?? venueData.CallWaiterEnabled ?? true,
        );
        setIsChefRequestEnabled(
          venueData.callChefEnabled ?? venueData.CallChefEnabled ?? false,
        );
        setIsBilingual(venueData.bilingual ?? venueData.Bilingual ?? false);

        const savedTheme = normalizeTemplateCode(
          venueData.theme ||
            venueData.Theme ||
            venueData.template ||
            venueData.templateCode ||
            finalTemplates[0]?.code ||
            "template_1",
        );
        setTheme(savedTheme);

        const logo = venueData.logoUrl || venueData.LogoUrl || venueData.logo;
        if (logo) {
          setLogoPreview(getFullImageUrl(logo));
          setExistingLogoUrl(logo);
        }

        setIsAlreadySetup(
          venueData.has_completed_settings === true ||
            venueData.HasCompletedSettings === true,
        );

        // همگام‌سازی کانتکست اشتراک با آخرین وضعیت سرور
        refreshSubscription();
      } catch (err: any) {
        console.error("❌ خطا در دریافت اطلاعات مجموعه:", err.message);
        setPageError(
          err.message ||
            "اطلاعات مجموعه یافت نشد. لطفاً ابتدا مجموعه خود را ثبت کنید.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refreshSubscription]);

  // هر بار که قالب یا رفرش تغییر کند، اسپینر لودینگ iframe نمایش داده شود
  useEffect(() => {
    setIsIframeLoading(true);
  }, [englishName, theme, previewRefreshKey]);

  const isTemplateLocked = (tpl: any): boolean => {
    if (isSubLoading) return Boolean(tpl?.isLocked);
    if (!subscription.hasActiveSubscription) return true;
    if (typeof tpl?.isLocked === "boolean") {
      return tpl.isLocked || !canUseTemplate(tpl.code);
    }
    return !canUseTemplate(tpl.code);
  };

  const selectedTemplateObj = templates.find((t) => t.code === theme);
  const selectedThemeRequiredTier: Exclude<PlanTier, "none"> =
    selectedTemplateObj?.requiredTier || resolveTemplateRequiredTier(theme);
  const isSelectedThemeLocked = selectedTemplateObj
    ? isTemplateLocked(selectedTemplateObj)
    : !isSubLoading && !canUseTemplate(theme);

  const canBilingual = can("bilingual");
  const canOnlineOrdering = can("onlineOrdering");
  const canCallWaiter = can("callWaiter");
  const canCallChef = can("callChef");

  const effectiveBilingual = canBilingual && isBilingual;
  const effectiveOrdering = canOnlineOrdering && isOrderingEnabled;
  const effectiveWaiter = canCallWaiter && isWaiterEnabled;
  const effectiveChef = canCallChef && isChefRequestEnabled;

  const publicMenuUrl = `${PUBLIC_MENU_ORIGIN}/${englishName}`;

  const handleCopyMenuUrl = () => {
    navigator.clipboard?.writeText(publicMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleFeature = (
    featureKey: FeatureKey,
    requiredTier: Exclude<PlanTier, "none">,
    title: string,
    message: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!can(featureKey)) {
      openUpgradeModal({
        title,
        message,
        requiredTier,
        feature: featureKey,
      });
      return;
    }
    setter((prev) => !prev);
  };

  const handleFinalSubmit = async () => {
    if (!subscription.hasActiveSubscription) {
      openUpgradeModal({
        requiredTier: "basic",
        message:
          "اشتراک مجموعه شما فعال نیست. برای ذخیره تنظیمات و انتشار منو، ابتدا اشتراک خود را فعال کنید.",
      });
      return;
    }

    if (isSelectedThemeLocked) {
      const reqLabel = TIER_LABELS[selectedThemeRequiredTier];
      openUpgradeModal({
        title: `فعال‌سازی ${selectedTemplateObj?.name || "این قالب"}`,
        message: `قالب انتخاب‌شده ویژه پلن «${reqLabel}» به بالا است. برای ذخیره این قالب پلن خود را ارتقا دهید یا یکی از قالب‌های باز پلن فعلی را انتخاب کنید.`,
        requiredTier: selectedThemeRequiredTier,
        feature: "template",
      });
      return;
    }

    if (!aboutUsFa.trim()) {
      setDescError(true);
      setActiveTab("general");
      return;
    }

    setIsSaving(true);
    try {
      // ۱. آپدیت تنظیمات پایه و دوزبانه (با رعایت دقیق دسترسی‌های پلن فعال)
      await venuesApi.updateSettings({
        orderingEnabled: effectiveOrdering,
        bilingual: effectiveBilingual,
        callWaiterEnabled: effectiveWaiter,
        callChefEnabled: effectiveChef,
        aboutUsFa: aboutUsFa.trim(),
        aboutUsEn: effectiveBilingual ? aboutUsEn.trim() : "",
      });

      // ۲. آپلود لوگو (فقط در صورت انتخاب فایل جدید)
      let finalLogoUrl = existingLogoUrl;
      if (logoFile) {
        const uploadRes = await venuesApi.uploadLogo(logoFile);
        finalLogoUrl =
          typeof uploadRes === "string"
            ? uploadRes
            : uploadRes?.data?.logoUrl ||
              uploadRes?.logoUrl ||
              uploadRes?.url ||
              "";
      } else if (logoPreview === null) {
        finalLogoUrl = "";
      }

      const finalThemeCode = normalizeTemplateCode(
        theme || templates[0]?.code || "template_1",
      );

      // ۳. آپدیت برندینگ (قالب و مسیر نهایی لوگو)
      await venuesApi.updateBranding({
        logoUrl: finalLogoUrl,
        theme: finalThemeCode,
      });

      setTheme(finalThemeCode);
      setExistingLogoUrl(finalLogoUrl);
      setLogoFile(null);
      if (finalLogoUrl) {
        setLogoPreview(getFullImageUrl(finalLogoUrl));
      }

      // رفرش خودکار iframe موبایل برای نمایش آخرین تغییرات ذخیره‌شده
      setPreviewRefreshKey((prev) => prev + 1);
      setIsAlreadySetup(true);
      setShowQRPopup(true);
    } catch (err: any) {
      console.error("خطا در ذخیره اطلاعات:", err);
      // اگر خطا از نوع UPGRADE_REQUIRED بود، مودال ارتقا خودکار از api.ts باز شده است
      if (err?.response?.data?.data?.code !== "UPGRADE_REQUIRED") {
        alert(err.message || "خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      setLogoFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  if (pageError) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6"
        dir="rtl"
      >
        <div className="bg-white/90 backdrop-blur-2xl max-w-md w-full rounded-[36px] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.08)] flex flex-col items-center text-center border border-white">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            مجموعه‌ای یافت نشد
          </h2>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">
            {pageError}
          </p>
          <Link
            to="/setup-venue"
            className="w-full bg-slate-900 hover:bg-orange-500 text-white py-4 rounded-2xl font-black transition-all"
          >
            ثبت اطلاعات مجموعه
          </Link>
        </div>
      </div>
    );
  }

  const displayedTemplates = showAllTemplates
    ? templates
    : templates.slice(0, 6);

  // آدرس واقعی منو روی دامنه اصلی toranjmenu.ir/slug برای نمایش داخل قاب گوشی
  const livePreviewUrl = englishName
    ? `${PUBLIC_MENU_ORIGIN}/${englishName}?previewTheme=${encodeURIComponent(theme)}&v=${previewRefreshKey}`
    : "";

  const featureCards: {
    key: string;
    featureKey: FeatureKey;
    requiredTier: Exclude<PlanTier, "none">;
    enabled: boolean;
    locked: boolean;
    onClick: () => void;
    icon: any;
    title: string;
    desc: string;
  }[] = [
    {
      key: "ordering",
      featureKey: "onlineOrdering",
      requiredTier: "standard",
      enabled: effectiveOrdering,
      locked: !canOnlineOrdering,
      onClick: () =>
        handleToggleFeature(
          "onlineOrdering",
          "standard",
          "سفارش‌دهی آنلاین از منو",
          "قابلیت ثبت سفارش مستقیم مشتریان از منوی دیجیتال در پلن استاندارد و پلاس فعال است.",
          setIsOrderingEnabled,
        ),
      icon: ShoppingBag,
      title: "سفارش‌دهی آنلاین سر میز",
      desc: "مشتریان بدون نیاز به گارسون آیتم‌ها را به سبد خرید اضافه و ثبت می‌کنند.",
    },
    {
      key: "bilingual",
      featureKey: "bilingual",
      requiredTier: "standard",
      enabled: effectiveBilingual,
      locked: !canBilingual,
      onClick: () =>
        handleToggleFeature(
          "bilingual",
          "standard",
          "منوی دو زبانه (فارسی / انگلیسی)",
          "نمایش منو به دو زبان فارسی و انگلیسی در پلن استاندارد و پلاس در دسترس است.",
          setIsBilingual,
        ),
      icon: Globe,
      title: "منوی دو زبانه (فارسی / انگلیسی)",
      desc: "نمایش دکمه تغییر زبان در منو برای مهمانان و گردشگران خارجی.",
    },
    {
      key: "waiter",
      featureKey: "callWaiter",
      requiredTier: "standard",
      enabled: effectiveWaiter,
      locked: !canCallWaiter,
      onClick: () =>
        handleToggleFeature(
          "callWaiter",
          "standard",
          "درخواست گارسون سر میز",
          "قابلیت احضار سالن‌دار با ذکر شماره میز در پلن استاندارد و پلاس فعال است.",
          setIsWaiterEnabled,
        ),
      icon: BellRing,
      title: "دکمه احضار سالن‌دار",
      desc: "ارسال اعلان فوری به پنل گارسون با ذکر شماره میز مشتری.",
    },
    {
      key: "chef",
      featureKey: "callChef",
      requiredTier: "standard",
      enabled: effectiveChef,
      locked: !canCallChef,
      onClick: () =>
        handleToggleFeature(
          "callChef",
          "standard",
          "درخواست و یادداشت به سرآشپز",
          "ارسال مستقیم یادداشت و درخواست پخت به آشپزخانه در پلن استاندارد و پلاس فعال است.",
          setIsChefRequestEnabled,
        ),
      icon: ChefHat,
      title: "یادداشت اختصاصی به سرآشپز",
      desc: "امکان ارسال پیام یا درخواست ویژه پخت مستقیماً به آشپزخانه.",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] font-sans text-slate-800 pb-28 lg:pb-14 relative overflow-x-hidden"
      dir="rtl"
    >
      {/* هاله‌های نوری ملایم */}
      <div className="absolute top-0 right-0 w-[650px] h-[650px] bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-300/10 to-transparent rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-[1480px] mx-auto p-4 sm:p-6 md:p-10 relative z-10">
        {/* ================= هدر و دکمه ذخیره دائمی ================= */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="w-12 h-12 bg-white/90 backdrop-blur-xl shadow-2xs border border-white rounded-2xl flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all active:scale-95 shrink-0"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  {isAlreadySetup
                    ? "تنظیمات و شخصی‌سازی منو"
                    : "راه‌اندازی منو در ترنج"}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[11px] font-black">
                  <Sparkles size={12} /> ترنج
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-bold mt-0.5">
                نمونه واقعی منوی شما در قاب موبایل قابل مشاهده و تعامل است
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={publicMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all"
            >
              <ExternalLink size={16} className="text-orange-500" />
              <span>مشاهده منوی آنلاین</span>
            </a>

            <button
              type="button"
              disabled={isSaving || !theme}
              onClick={handleFinalSubmit}
              className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:bg-slate-300 ${
                isSelectedThemeLocked
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                  : "bg-slate-900 hover:bg-orange-500 text-white shadow-slate-900/15"
              }`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isSelectedThemeLocked ? (
                <Crown size={17} strokeWidth={2.4} />
              ) : (
                <Save size={17} strokeWidth={2.5} />
              )}
              <span>
                {isSelectedThemeLocked
                  ? `ارتقا به پلن ${TIER_LABELS[selectedThemeRequiredTier]} برای فعال‌سازی`
                  : isAlreadySetup
                    ? "ذخیره تغییرات"
                    : "انتشار منو در ترنج"}
              </span>
            </button>
          </div>
        </header>

        {/* ================= گرید اصلی: استودیو تنظیمات + پیش‌نمایش واقعی موبایل ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* ستون راست (۷ ستون): کارت هویت مجموعه + تب‌های تنظیمات */}
          <div className="lg:col-span-7 space-y-6">
            {/* کارت خلاصه اطلاعات مجموعه */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[30px] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={restaurantName}
                      className="w-full h-full object-cover bg-white"
                    />
                  ) : (
                    <Store size={26} />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                    {restaurantName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100 truncate"
                      dir="ltr"
                    >
                      toranjmenu.ir/{englishName}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMenuUrl}
                      title="کپی آدرس منو"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      {copiedLink ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="bg-slate-50 border border-slate-200/70 px-3.5 py-2 rounded-2xl text-center">
                  <span className="block text-[10px] font-bold text-slate-400">
                    شماره تماس
                  </span>
                  <span
                    className="font-mono text-xs font-black text-slate-800"
                    dir="ltr"
                  >
                    {phone}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 px-3.5 py-2 rounded-2xl text-center">
                  <span className="block text-[10px] font-bold text-slate-400">
                    تعداد میز
                  </span>
                  <span className="text-xs font-black text-slate-800 flex items-center justify-center gap-1">
                    <Hash size={12} className="text-orange-500" />
                    {Number(tableCount || 0).toLocaleString("fa-IR")} میز
                  </span>
                </div>
              </div>
            </div>

            {/* نوار تب‌های دسترسی سریع */}
            <div className="bg-slate-200/70 p-1.5 rounded-[22px] grid grid-cols-3 gap-1.5 border border-white/80">
              {[
                {
                  id: "general" as SettingsTab,
                  label: "۱. معرفی و زبان‌ها",
                  icon: Settings,
                },
                {
                  id: "features" as SettingsTab,
                  label: "۲. امکانات هوشمند",
                  icon: Sparkles,
                },
                {
                  id: "branding" as SettingsTab,
                  label: "۳. لوگو و قالب منو",
                  icon: Palette,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <TabIcon
                      size={16}
                      className={isActive ? "text-orange-500" : ""}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ================= محتوای تب ۱: معرفی و دوزبانه‌سازی ================= */}
            {activeTab === "general" && (
              <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      معرفی و درباره مجموعه (فارسی)
                    </label>
                    <span className="text-[11px] font-bold text-slate-400">
                      نمایش در بالای منوی مشتریان
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="مثلاً: با بهترین دانه‌های قهوه تخصصی و مواد اولیه تازه در فضایی دنج میزبان شما هستیم..."
                    value={aboutUsFa}
                    onChange={(e) => {
                      setAboutUsFa(e.target.value);
                      if (descError) setDescError(false);
                    }}
                    className={`w-full bg-slate-50/70 focus:bg-white border-2 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none transition-all resize-none leading-relaxed ${
                      descError
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-slate-200/80 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                    }`}
                  />

                  {descError && (
                    <p className="text-rose-500 text-xs font-black mt-2 flex items-center gap-1.5">
                      <AlertCircle size={15} /> نوشتن معرفی کوتاه مجموعه الزامی
                      است.
                    </p>
                  )}
                </div>

                {/* باکس فعال‌سازی منوی دوزبانه (قفل در پلن پایه) */}
                <div
                  className={`border rounded-2xl p-4 sm:p-5 transition-colors ${
                    !canBilingual
                      ? "bg-slate-50/60 border-slate-200/60"
                      : "bg-slate-50/80 border-slate-200/70"
                  }`}
                >
                  <div
                    onClick={() =>
                      handleToggleFeature(
                        "bilingual",
                        "standard",
                        "منوی دو زبانه (فارسی / انگلیسی)",
                        "پشتیبانی از زبان انگلیسی و نمایش منوی دو زبانه در پلن استاندارد و پلاس فعال است.",
                        setIsBilingual,
                      )
                    }
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          effectiveBilingual
                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                            : "bg-white text-slate-400 border border-slate-200"
                        }`}
                      >
                        <Languages size={21} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900">
                            پشتیبانی از زبان انگلیسی (منوی دوزبانه)
                          </h4>
                          {!canBilingual && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[10px] font-black">
                              <Lock size={10} strokeWidth={2.6} />
                              استاندارد
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">
                          فعال‌سازی نمایش توضیحات و نام محصولات به زبان انگلیسی
                        </p>
                      </div>
                    </div>

                    {!canBilingual ? (
                      <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <Lock size={16} />
                      </span>
                    ) : (
                      <div
                        dir="ltr"
                        className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                          effectiveBilingual
                            ? "bg-emerald-500 justify-end"
                            : "bg-slate-300 justify-start"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                      </div>
                    )}
                  </div>

                  {effectiveBilingual && (
                    <div className="mt-5 pt-5 border-t border-slate-200/70 animate-in fade-in duration-300">
                      <label
                        className="block text-xs font-black text-slate-600 mb-2 text-left"
                        dir="ltr"
                      >
                        About Us (English Description)
                      </label>
                      <textarea
                        dir="ltr"
                        rows={3}
                        placeholder="Welcome to our cafe & restaurant. Enjoy freshly brewed specialty coffee and artisanal dishes..."
                        value={aboutUsEn}
                        onChange={(e) => setAboutUsEn(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-2xl p-4 text-sm font-medium text-slate-800 outline-none resize-none text-left leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!aboutUsFa.trim()) {
                        setDescError(true);
                        return;
                      }
                      setActiveTab("features");
                    }}
                    className="bg-slate-900 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-colors"
                  >
                    <span>مرحله بعد: امکانات هوشمند</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ================= محتوای تب ۲: امکانات هوشمند سالن ================= */}
            {activeTab === "features" && (
              <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      امکانات تعاملی منوی مشتریان
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      قابلیت‌های مورد نیاز سالن و سفارش‌گیری را فعال یا غیرفعال
                      کنید
                    </p>
                  </div>
                  <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    پلن فعلی: {subscription.tierLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featureCards.map((item) => {
                    const FeatureIcon = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={item.onClick}
                        className={`cursor-pointer rounded-[26px] p-5 border-2 transition-all flex flex-col justify-between gap-4 relative ${
                          item.locked
                            ? "bg-slate-50/60 border-slate-200/70 hover:border-orange-300"
                            : item.enabled
                              ? "bg-orange-50/40 border-orange-500 shadow-sm"
                              : "bg-slate-50/70 border-slate-200/70 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                              item.locked
                                ? "bg-slate-100 text-slate-400 border border-slate-200"
                                : item.enabled
                                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                  : "bg-white text-slate-400 border border-slate-200"
                            }`}
                          >
                            <FeatureIcon size={21} />
                          </div>

                          {item.locked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-[10px] font-black">
                              <Lock size={11} strokeWidth={2.6} />
                              پلن {TIER_LABELS[item.requiredTier]}
                            </span>
                          ) : (
                            <div
                              dir="ltr"
                              className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                                item.enabled
                                  ? "bg-emerald-500 justify-end"
                                  : "bg-slate-300 justify-start"
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-sm text-slate-900 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("branding")}
                    className="bg-slate-900 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-colors"
                  >
                    <span>مرحله بعد: لوگو و قالب منو</span>
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ================= محتوای تب ۳: لوگو و انتخاب قالب منو ================= */}
            {activeTab === "branding" && (
              <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-8 animate-in fade-in duration-300">
                {/* آپلود لوگو */}
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    لوگوی اختصاصی مجموعه
                  </h3>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50/80 border border-slate-200/70 rounded-[26px] p-5">
                    {logoPreview ? (
                      <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-2 relative group overflow-hidden shrink-0 shadow-2xs">
                        <img
                          src={logoPreview}
                          className="w-full h-full object-contain rounded-xl"
                          alt="Logo"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-white bg-rose-500 p-2 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white hover:border-orange-400 transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 text-slate-400 hover:text-orange-500"
                      >
                        <ImageIcon size={24} className="mb-1" />
                        <span className="text-[11px] font-black">
                          آپلود لوگو
                        </span>
                      </div>
                    )}

                    <div className="text-center sm:text-right flex-1">
                      <h4 className="font-black text-sm text-slate-900 mb-1">
                        نشان تجاری کافه یا رستوران شما
                      </h4>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed mb-3">
                        تصویر مربعی با پس‌زمینه شفاف (PNG) در هدر منوی دیجیتال و
                        کارت‌های سفارش بهترین نمایش را دارد.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors"
                        >
                          {logoPreview ? "تغییر تصویر لوگو" : "انتخاب فایل"}
                        </button>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            حذف لوگو
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* انتخاب قالب منو (همراه با وضعیت قفل پلن‌ها و پیش‌نمایش آزاد) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      انتخاب قالب ظاهری منو
                    </h3>
                    <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                      دسترسی پلن {subscription.tierLabel}:{" "}
                      {subscription.maxTemplates.toLocaleString("fa-IR")} از{" "}
                      {templates.length.toLocaleString("fa-IR")} قالب
                    </span>
                  </div>

                  {isSelectedThemeLocked && (
                    <div className="mb-4 bg-orange-50/90 border border-orange-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-orange-900">
                        <Lock size={15} className="text-orange-500 shrink-0" />
                        <span>
                          در حال پیش‌نمایش{" "}
                          <strong>{selectedTemplateObj?.name}</strong> هستید؛
                          ذخیره و فعال‌سازی این قالب نیازمند پلن{" "}
                          <strong>
                            {TIER_LABELS[selectedThemeRequiredTier]}
                          </strong>{" "}
                          است.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openUpgradeModal({
                            title: `فعال‌سازی ${selectedTemplateObj?.name || "قالب انتخابی"}`,
                            requiredTier: selectedThemeRequiredTier,
                            feature: "template",
                          })
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-[11px] font-black shrink-0 self-end sm:self-center transition-colors"
                      >
                        ارتقای پلن
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {displayedTemplates.map((tpl, idx) => {
                      const isSelected = theme === tpl.code;
                      const isLocked = isTemplateLocked(tpl);
                      const swatch = getTemplateSwatch(tpl.code, idx);

                      return (
                        <div
                          key={tpl.code}
                          onClick={() => setTheme(tpl.code)}
                          className={`cursor-pointer rounded-[24px] p-2.5 border-2 transition-all relative ${
                            isSelected
                              ? isLocked
                                ? "bg-orange-50/50 text-slate-900 border-orange-500 shadow-md scale-[1.02]"
                                : "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]"
                              : "bg-white text-slate-800 border-slate-100 hover:border-orange-200"
                          }`}
                        >
                          <div className="h-24 rounded-2xl overflow-hidden bg-slate-100 relative flex items-center justify-center mb-2.5">
                            {tpl.thumbnailUrl ? (
                              <img
                                src={getFullImageUrl(tpl.thumbnailUrl)}
                                alt={tpl.name}
                                className={`w-full h-full object-cover ${isLocked ? "opacity-85" : ""}`}
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${swatch} p-3 flex flex-col justify-between ${
                                  isLocked ? "opacity-85" : ""
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-white/25 block" />
                                <div className="space-y-1.5">
                                  <span className="block h-1.5 w-2/3 bg-white/80 rounded-full" />
                                  <span className="block h-1.5 w-1/2 bg-white/45 rounded-full" />
                                </div>
                              </div>
                            )}

                            {isLocked && (
                              <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-300 border border-white/15 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                                <Lock size={10} strokeWidth={2.6} />
                                <span>{tpl.requiredTierLabel}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between px-1 gap-1">
                            <span className="text-xs font-black truncate">
                              {tpl.name}
                            </span>
                            {isSelected ? (
                              isLocked ? (
                                <Crown
                                  size={15}
                                  className="text-orange-500 shrink-0"
                                />
                              ) : (
                                <CheckCircle2
                                  size={16}
                                  className="text-orange-400 shrink-0"
                                />
                              )
                            ) : isLocked ? (
                              <Lock
                                size={13}
                                className="text-slate-400 shrink-0"
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {templates.length > 6 && (
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllTemplates(!showAllTemplates)}
                        className="flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-5 py-2.5 rounded-xl transition-colors"
                      >
                        <span>
                          {showAllTemplates
                            ? "نمایش قالب‌های منتخب"
                            : `مشاهده همه ${templates.length.toLocaleString("fa-IR")} قالب`}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-300 ${
                            showAllTemplates ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* دکمه ذخیره پایین فرم */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    disabled={isSaving || !theme}
                    onClick={handleFinalSubmit}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isSelectedThemeLocked ? (
                      <>
                        <Crown size={18} />
                        <span>
                          ارتقا به پلن {TIER_LABELS[selectedThemeRequiredTier]}{" "}
                          برای فعال‌سازی
                        </span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>
                          {isAlreadySetup
                            ? "ذخیره نهایی تنظیمات"
                            : "انتشار منو در ترنج"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= ستون چپ (۵ ستون): پیش‌نمایش زنده واقعی منو روی toranjmenu.ir ================= */}
          <aside className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col items-center">
            <div className="w-full max-w-[365px] flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                <Smartphone size={15} className="text-orange-500" />
                پیش‌نمایش واقعی منو
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewRefreshKey((prev) => prev + 1)}
                  title="بارگذاری مجدد پیش‌نمایش"
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors"
                >
                  <RefreshCw
                    size={13}
                    className={
                      isIframeLoading ? "animate-spin text-orange-500" : ""
                    }
                  />
                </button>
                <a
                  href={publicMenuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="باز کردن در تب جدید"
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* قاب گوشی با نمایش واقعی صفحه منو روی toranjmenu.ir/slug */}
            <div className="w-[335px] sm:w-[365px] bg-slate-900 rounded-[3.2rem] p-3 shadow-[0_30px_70px_rgba(15,23,42,0.18)] border-4 border-slate-800">
              <div className="rounded-[2.4rem] overflow-hidden bg-white flex flex-col h-[660px] relative">
                {/* نوار آدرس بالای مرورگر موبایل */}
                <div className="bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between text-[10px] font-mono shrink-0">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                  <span
                    className="text-zinc-300 truncate max-w-[220px]"
                    dir="ltr"
                  >
                    toranjmenu.ir/{englishName}
                  </span>
                </div>

                {/* iframe واقعی صفحه منو روی دامنه اصلی */}
                <div className="relative flex-1 w-full bg-[#F5F5F7]">
                  {isIframeLoading && (
                    <div className="absolute inset-0 z-10 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                      <Loader2
                        size={28}
                        className="animate-spin text-orange-500"
                      />
                      <span className="text-[11px] font-bold text-slate-500">
                        در حال بارگذاری منوی واقعی...
                      </span>
                    </div>
                  )}

                  {livePreviewUrl && (
                    <iframe
                      key={`${englishName}-${theme}-${previewRefreshKey}`}
                      src={livePreviewUrl}
                      title={`پیش‌نمایش منوی ${restaurantName}`}
                      onLoad={() => setIsIframeLoading(false)}
                      className="w-full h-full border-0 block bg-white"
                    />
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* مودال تایید ذخیره تنظیمات */}
      {showQRPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] lg:rounded-[44px] p-8 md:p-10 w-full max-w-md text-center relative shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowQRPopup(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2.5 rounded-2xl transition-colors"
            >
              <X size={22} />
            </button>

            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 rotate-6 border-4 border-white">
              <CheckCircle2 className="-rotate-6" size={48} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              تنظیمات در ترنج ذخیره شد!
            </h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-8 text-sm">
              هویت بصری و تنظیمات پایه مجموعه بروزرسانی شد. اکنون می‌توانید
              محصولات منوی خود را مدیریت کنید.
            </p>

            <div className="space-y-3">
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-lg transition-all"
              >
                <span>مشاهده منوی ذخیره شده</span>
                <ExternalLink size={18} />
              </a>
              <Link
                to="/products"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-lg transition-all"
              >
                <span>مدیریت محصولات و منو</span>
                <ArrowLeft size={18} />
              </Link>
              <Link
                to="/dashboard"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-black flex justify-center items-center transition-all"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueSettings;
