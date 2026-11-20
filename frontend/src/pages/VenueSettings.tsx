import { useState, useRef, useEffect } from "react";
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
  Phone,
  Hash,
  ArrowLeft,
  ChefHat,
  Globe,
  Languages,
  Save,
  Image as ImageIcon,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";

export const VenueSettings = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);
  const [pageError, setPageError] = useState("");

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
  const [stepOneErrors, setStepOneErrors] = useState({ desc: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>("");

  const [showQRPopup, setShowQRPopup] = useState(false);

  // ساخت آدرس کامل عکس از سرور جنگو
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
          name: `قالب منو ${i + 1}`,
          thumbnailUrl: "",
        }));

        let templatesData: any[] = [];
        try {
          const tplRes = await venuesApi.getTemplates?.();
          templatesData = tplRes?.data?.items || tplRes?.data || tplRes || [];
        } catch {
          console.warn("خطا در دریافت قالب‌ها، استفاده از لیست پیش‌فرض");
        }

        const finalTemplates =
          Array.isArray(templatesData) && templatesData.length > 0
            ? templatesData
            : fallbackTemplates;
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

        setTheme(venueData.theme || venueData.Theme || finalTemplates[0].code);

        const logo = venueData.logoUrl || venueData.LogoUrl || venueData.logo;
        if (logo) {
          setLogoPreview(getFullImageUrl(logo));
          setExistingLogoUrl(logo);
        }

        setIsAlreadySetup(
          venueData.has_completed_settings === true ||
            venueData.HasCompletedSettings === true,
        );
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
  }, []);

  const handleFinalSubmit = async () => {
    if (!aboutUsFa.trim()) {
      setStepOneErrors({ desc: true });
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      // ۱. آپدیت تنظیمات پایه و دوزبانه
      await venuesApi.updateSettings({
        orderingEnabled: isOrderingEnabled,
        bilingual: isBilingual,
        callWaiterEnabled: isWaiterEnabled,
        callChefEnabled: isChefRequestEnabled,
        aboutUsFa: aboutUsFa.trim(),
        aboutUsEn: isBilingual ? aboutUsEn.trim() : "",
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

      // ۳. آپدیت برندینگ (قالب و مسیر نهایی لوگو)
      await venuesApi.updateBranding({
        logoUrl: finalLogoUrl,
        theme:
          theme || (templates.length > 0 ? templates[0].code : "template_1"),
      });

      setExistingLogoUrl(finalLogoUrl);
      setLogoFile(null);
      if (finalLogoUrl) {
        setLogoPreview(getFullImageUrl(finalLogoUrl));
      }

      setIsAlreadySetup(true);
      setShowQRPopup(true);
    } catch (err: any) {
      console.error("خطا در ذخیره اطلاعات:", err);
      alert(err.message || "خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepSelect = (targetStep: 1 | 2 | 3) => {
    if (targetStep > 1 && !aboutUsFa.trim()) {
      setStepOneErrors({ desc: true });
      setCurrentStep(1);
      return;
    }
    setCurrentStep(targetStep);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!aboutUsFa.trim()) {
        setStepOneErrors({ desc: true });
        return;
      }
      setCurrentStep(isBilingual ? 2 : 3);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(isBilingual ? 2 : 1);
    } else if (currentStep === 2) {
      setCurrentStep(1);
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
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  if (pageError) {
    return (
      <div
        className="min-h-screen bg-[#f4f7f9] flex flex-col justify-center items-center p-6"
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

  const steps = [
    {
      id: 1 as const,
      icon: Settings,
      title: "تنظیمات پایه",
      desc: "مشخصات و دسترسی‌ها",
    },
    ...(isBilingual
      ? [
          {
            id: 2 as const,
            icon: Languages,
            title: "زبان بین‌المللی",
            desc: "درباره ما به انگلیسی",
          },
        ]
      : []),
    {
      id: 3 as const,
      icon: Palette,
      title: "هویت بصری",
      desc: "قالب و لوگو",
    },
  ];

  const IosToggle = ({ enabled, onClick, icon: Icon, title, desc }: any) => (
    <div
      onClick={onClick}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 lg:p-6 transition-all duration-300 cursor-pointer hover:bg-slate-50"
    >
      <div className="flex gap-4 items-start sm:items-center mb-4 sm:mb-0">
        <div
          className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm ${enabled ? "bg-orange-50 text-orange-500 border border-orange-100" : "bg-white text-slate-400 border border-slate-200"}`}
        >
          <Icon size={24} strokeWidth={2} className="lg:w-6 lg:h-6 w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-[15px] lg:text-[16px] text-slate-800 mb-1">
            {title}
          </h4>
          <p className="text-[12px] lg:text-[13px] font-bold text-slate-500 max-w-sm leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <div
        className={`relative w-12 h-[30px] lg:w-14 lg:h-[34px] shrink-0 rounded-full flex items-center p-1 transition-all duration-300 ease-in-out border ${enabled ? "bg-emerald-500 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]" : "bg-slate-200 border-slate-200"}`}
        dir="ltr"
      >
        <div
          className={`w-5 h-5 lg:w-7 lg:h-7 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${enabled ? "translate-x-[18px] lg:translate-x-[20px]" : "translate-x-0"}`}
        ></div>
      </div>
    </div>
  );

  const displayedTemplates = showAllTemplates
    ? templates
    : templates.slice(0, 6);

  return (
    <div
      className="min-h-screen bg-[#f4f7f9] font-sans text-slate-800 pb-8 relative overflow-x-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-300/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 relative z-10">
        <header className="flex items-center gap-4 sm:gap-6 mb-8 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            to="/dashboard"
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[20px] sm:rounded-[24px] flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-100 hover:shadow-orange-500/10 transition-all active:scale-95 shrink-0"
          >
            <ChevronRight
              size={24}
              className="sm:w-7 sm:h-7"
              strokeWidth={2.5}
            />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-1 lg:mb-2">
              {isAlreadySetup ? "تنظیمات مجموعه" : "راه‌اندازی دیجی‌منو"}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-bold">
              شخصی‌سازی امکانات، ظاهر و اطلاعات رستوران شما در پلتفرم دیجی‌منو
            </p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
          <div className="w-full lg:w-[340px] sticky top-4 lg:top-10 z-30 shrink-0 self-start">
            <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar snap-x snap-mandatory">
              {steps.map((item) => {
                const isActive = currentStep === item.id;
                const isPast = currentStep > item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleStepSelect(item.id)}
                    className={`cursor-pointer min-w-[220px] lg:min-w-full flex items-center gap-4 p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] transition-all duration-500 snap-center ${
                      isActive
                        ? "bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white lg:scale-[1.02]"
                        : "bg-white/40 lg:bg-transparent hover:bg-white/50 text-slate-500 border border-slate-200/50 lg:border-transparent backdrop-blur-md"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 lg:w-16 lg:h-16 rounded-[18px] lg:rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isActive
                          ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : isPast
                            ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                            : "bg-white border border-slate-200 text-slate-400"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 size={24} strokeWidth={2.5} />
                      ) : (
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      )}
                    </div>
                    <div>
                      <h3
                        className={`font-black text-[14px] lg:text-[17px] tracking-tight mb-0.5 lg:mb-1 ${isActive ? "text-slate-900" : ""}`}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={`text-[11px] lg:text-[13px] font-bold ${isActive ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 w-full bg-white/70 backdrop-blur-2xl rounded-[32px] lg:rounded-[48px] shadow-[0_30px_80px_rgba(0,0,0,0.03)] border border-white relative flex flex-col pb-[100px] lg:pb-0">
            <div className="p-5 sm:p-8 md:p-14 flex-1 relative z-10">
              {/* --- مرحله 1 --- */}
              {currentStep === 1 && (
                <div className="animate-in slide-in-from-left-8 fade-in duration-500">
                  <div className="bg-slate-900 rounded-[28px] lg:rounded-[36px] p-6 lg:p-10 mb-8 lg:mb-14 text-white relative overflow-hidden shadow-2xl border border-slate-800">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
                      <div>
                        <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 rounded-[18px] lg:rounded-[20px] backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                            <Store
                              className="text-orange-400"
                              size={24}
                              strokeWidth={2}
                            />
                          </div>
                          <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-md">
                            {restaurantName}
                          </h2>
                        </div>
                        <a
                          href={`https://digimenoo.ir/${englishName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/50 transition-colors px-4 py-2.5 rounded-xl text-xs lg:text-sm font-mono font-bold text-orange-300 dir-ltr backdrop-blur-xl border border-white/5"
                        >
                          digimenoo.ir/{englishName} <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="flex gap-6 lg:gap-8 lg:border-r border-t lg:border-t-0 border-white/10 pt-5 lg:pt-0 lg:pr-10">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-slate-400 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">
                            Phone
                          </p>
                          <p className="font-mono font-black text-lg lg:text-xl dir-ltr text-white flex items-center gap-2">
                            <Phone
                              size={16}
                              className="text-slate-400 hidden sm:block"
                            />{" "}
                            {phone}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-slate-400 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em]">
                            Tables
                          </p>
                          <p className="font-black text-lg lg:text-xl flex items-center gap-1.5 text-white">
                            <Hash size={18} className="text-orange-400" />{" "}
                            {tableCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10 lg:space-y-12">
                    <div>
                      <h3 className="text-lg lg:text-xl font-black text-slate-900 mb-4 lg:mb-5 flex items-center gap-3">
                        <div className="w-1.5 lg:w-2 h-7 lg:h-8 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full"></div>
                        درباره مجموعه
                      </h3>
                      <textarea
                        rows={5}
                        placeholder="متنی جذاب برای معرفی کافه یا رستوران خود بنویسید..."
                        value={aboutUsFa}
                        onChange={(e) => {
                          setAboutUsFa(e.target.value);
                          setStepOneErrors({ desc: false });
                        }}
                        className={`w-full bg-white border-2 rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 text-[14px] lg:text-[15px] font-bold text-slate-700 focus:outline-none transition-all resize-none placeholder:text-slate-300 shadow-sm ${
                          stepOneErrors.desc
                            ? "border-rose-400 bg-rose-50/30"
                            : "border-slate-200/70 focus:border-orange-400 focus:shadow-[0_8px_30px_rgb(249,115,22,0.12)]"
                        }`}
                      ></textarea>
                      {stepOneErrors.desc && (
                        <p className="text-rose-500 text-xs lg:text-sm font-black mt-2 flex items-center gap-1.5">
                          <AlertCircle size={16} /> نوشتن توضیحات الزامی است.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg lg:text-xl font-black text-slate-900 mb-4 lg:mb-5 flex items-center gap-3">
                        <div className="w-1.5 lg:w-2 h-7 lg:h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full"></div>
                        امکانات هوشمند دیجی‌منو
                      </h3>
                      <div className="bg-white border border-slate-200/80 rounded-[28px] lg:rounded-[36px] overflow-hidden shadow-sm divide-y divide-slate-100">
                        <IosToggle
                          enabled={isOrderingEnabled}
                          onClick={() =>
                            setIsOrderingEnabled(!isOrderingEnabled)
                          }
                          icon={ShoppingBag}
                          title="سفارش‌دهی آنلاین"
                          desc="مشتریان می‌توانند بدون گارسون سفارش ثبت کنند."
                        />
                        <IosToggle
                          enabled={isBilingual}
                          onClick={() => setIsBilingual(!isBilingual)}
                          icon={Globe}
                          title="منوی دو زبانه (انگلیسی)"
                          desc="پشتیبانی از زبان انگلیسی برای توریست‌ها."
                        />
                        <IosToggle
                          enabled={isWaiterEnabled}
                          onClick={() => setIsWaiterEnabled(!isWaiterEnabled)}
                          icon={BellRing}
                          title="سیستم احضار گارسون"
                          desc="دکمه درخواست گارسون از روی میز."
                        />
                        <IosToggle
                          enabled={isChefRequestEnabled}
                          onClick={() =>
                            setIsChefRequestEnabled(!isChefRequestEnabled)
                          }
                          icon={ChefHat}
                          title="درخواست اختصاصی از آشپز"
                          desc="امکان ثبت یادداشت متنی برای پخت."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- مرحله 2 --- */}
              {currentStep === 2 && isBilingual && (
                <div className="animate-in slide-in-from-left-8 fade-in duration-500">
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 mb-6 lg:mb-8 tracking-tight">
                    اطلاعات بین‌المللی (English)
                  </h3>
                  <div className="bg-blue-50/80 border border-blue-100 rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 mb-8 lg:mb-10 flex gap-4 lg:gap-6 items-center shadow-inner">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white text-blue-500 rounded-[20px] lg:rounded-[24px] shadow-sm border border-blue-100 flex items-center justify-center shrink-0">
                      <Globe size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-black text-blue-950 mb-1 lg:mb-2 text-lg lg:text-xl">
                        International Profile
                      </h4>
                      <p className="text-[12px] lg:text-[14px] font-bold text-blue-800/80 leading-relaxed max-w-lg">
                        این متون فقط هنگام تغییر زبان به انگلیسی نمایش داده
                        می‌شوند.
                      </p>
                    </div>
                  </div>
                  <label className="block text-[13px] lg:text-[15px] font-black text-slate-800 mb-3 dir-ltr text-left">
                    About Us (Description)
                  </label>
                  <textarea
                    dir="ltr"
                    rows={6}
                    placeholder="Welcome to our restaurant..."
                    value={aboutUsEn}
                    onChange={(e) => setAboutUsEn(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200/70 rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 text-[14px] lg:text-[15px] font-medium text-slate-700 focus:outline-none transition-all resize-none focus:border-blue-400 focus:shadow-[0_8px_30px_rgb(59,130,246,0.12)] text-left shadow-sm"
                  ></textarea>
                </div>
              )}

              {/* --- مرحله 3 (هویت بصری و انتخاب قالب) --- */}
              {currentStep === 3 && (
                <div className="animate-in slide-in-from-left-8 fade-in duration-500">
                  <h3 className="text-xl lg:text-2xl font-black text-slate-900 mb-8 lg:mb-10 tracking-tight">
                    هویت بصری و برندینگ
                  </h3>

                  <div className="mb-10 lg:mb-14">
                    <h4 className="text-md lg:text-lg font-black text-slate-900 mb-4 lg:mb-5 flex items-center gap-3">
                      <div className="w-1.5 lg:w-2 h-6 lg:h-7 bg-gradient-to-b from-purple-400 to-purple-500 rounded-full"></div>
                      لوگوی مجموعه
                    </h4>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10 bg-white border border-slate-200/80 rounded-[28px] lg:rounded-[40px] p-6 lg:p-10 shadow-sm">
                      {logoPreview ? (
                        <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[24px] lg:rounded-[32px] bg-white border border-slate-200 shadow-sm p-2 lg:p-3 relative group overflow-hidden shrink-0">
                          <img
                            src={logoPreview}
                            className="w-full h-full object-contain rounded-[18px] lg:rounded-[24px]"
                            alt="Logo"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              type="button"
                              onClick={handleRemoveLogo}
                              className="text-white hover:text-rose-400 bg-white/10 p-3 rounded-2xl hover:bg-rose-500/20"
                            >
                              <Trash2 size={24} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-32 h-32 lg:w-40 lg:h-40 rounded-[24px] lg:rounded-[32px] border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-orange-400 transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 text-slate-400 hover:text-orange-500"
                        >
                          <ImageIcon
                            size={32}
                            strokeWidth={1.5}
                            className="mb-2 lg:mb-3"
                          />
                          <span className="text-[13px] font-black">
                            انتخاب لوگو
                          </span>
                        </div>
                      )}
                      <div className="text-center sm:text-right">
                        <h5 className="font-black text-slate-900 mb-2 text-lg">
                          تصویر با کیفیت آپلود کنید
                        </h5>
                        <p className="text-[12px] lg:text-[14px] font-bold text-slate-500 leading-relaxed">
                          فایل‌های مربعی (PNG) با پس‌زمینه شفاف بهترین نتیجه را
                          دارند.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md lg:text-lg font-black text-slate-900 mb-5 flex items-center gap-3">
                      <div className="w-1.5 lg:w-2 h-6 lg:h-7 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full"></div>
                      انتخاب قالب منو{" "}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                        ({templates.length} قالب)
                      </span>
                    </h4>

                    {templates.length === 0 ? (
                      <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-[28px] text-slate-400 font-black">
                        در حال دریافت قالب‌ها...
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                          {displayedTemplates.map((tpl) => {
                            const isSelected = theme === tpl.code;
                            return (
                              <div
                                key={tpl.code}
                                onClick={() => setTheme(tpl.code)}
                                className={`relative cursor-pointer rounded-[24px] lg:rounded-[36px] p-1.5 lg:p-2 transition-all duration-300 ${isSelected ? "bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-slate-900/25 scale-[1.02]" : "bg-white border-2 border-slate-100 hover:border-slate-300 hover:-translate-y-1"}`}
                              >
                                <div
                                  className={`h-28 lg:h-32 rounded-[18px] lg:rounded-[24px] overflow-hidden flex flex-col items-center justify-center ${isSelected ? "shadow-inner border border-white/10" : "bg-slate-50 text-slate-300"}`}
                                >
                                  {tpl.thumbnailUrl ? (
                                    <img
                                      src={getFullImageUrl(tpl.thumbnailUrl)}
                                      alt={tpl.name}
                                      className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100"
                                    />
                                  ) : (
                                    <>
                                      <Sparkles
                                        size={28}
                                        strokeWidth={1.5}
                                        className={`mb-2 ${isSelected ? "text-white" : "text-slate-300"}`}
                                      />
                                      <div
                                        className={`w-12 h-2 rounded-full ${isSelected ? "bg-white/30" : "bg-slate-200"}`}
                                      ></div>
                                    </>
                                  )}
                                </div>
                                <div
                                  className={`p-4 flex items-center justify-between ${isSelected ? "text-white" : "text-slate-800"}`}
                                >
                                  <span className="text-[13px] lg:text-[14px] font-black line-clamp-1">
                                    {tpl.name}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2
                                      size={18}
                                      className="text-white shrink-0 ml-1"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {templates.length > 6 && (
                          <div className="mt-8 flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setShowAllTemplates(!showAllTemplates)
                              }
                              className="flex items-center gap-2 text-[14px] font-black text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-200/50 px-6 py-3 rounded-2xl transition-all active:scale-95"
                            >
                              {showAllTemplates
                                ? "نمایش کمتر"
                                : "مشاهده همه قالب‌ها"}
                              <ChevronDown
                                size={20}
                                className={`transition-transform duration-300 ${showAllTemplates ? "rotate-180" : ""}`}
                              />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-4 left-4 right-4 lg:static lg:bottom-auto lg:left-auto lg:right-auto bg-white/95 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none border border-slate-200 lg:border-none p-3 lg:p-8 flex items-center justify-between gap-3 lg:gap-4 mt-auto z-50 lg:z-20 rounded-[28px] lg:rounded-b-[48px] shadow-[0_15px_40px_rgba(0,0,0,0.12)] lg:shadow-none lg:border-t lg:border-slate-100">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-14 lg:w-auto h-14 lg:h-auto px-0 lg:px-8 py-0 lg:py-5 rounded-[20px] font-black transition-all flex items-center justify-center gap-3 text-slate-500 hover:text-slate-900 bg-slate-100 lg:bg-slate-100/50 hover:bg-slate-200 active:scale-95 shrink-0"
                >
                  <ArrowRight size={22} className="lg:m-0" />
                  <span className="hidden lg:inline">بازگشت</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 lg:flex-none h-14 lg:h-auto bg-slate-900 hover:bg-slate-800 text-white px-6 lg:px-10 py-0 lg:py-5 rounded-[20px] font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95 lg:hover:-translate-y-1"
                >
                  <span className="text-[15px] lg:text-[16px]">مرحله بعد</span>{" "}
                  <ArrowLeft size={22} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving || !theme}
                  onClick={handleFinalSubmit}
                  className="flex-1 lg:flex-none h-14 lg:h-auto bg-orange-500 hover:bg-orange-600 text-white px-6 lg:px-10 py-0 lg:py-5 rounded-[20px] font-black transition-all flex items-center justify-center gap-2 lg:gap-3 shadow-xl shadow-orange-500/25 active:scale-95 lg:hover:-translate-y-1 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Save
                        size={22}
                        strokeWidth={2.5}
                        className="hidden sm:block"
                      />
                      <span className="text-[15px] lg:text-[16px]">
                        {isAlreadySetup
                          ? "ذخیره تغییرات"
                          : "انتشار در دیجی‌منو"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQRPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] lg:rounded-[48px] p-8 md:p-12 w-full max-w-md text-center relative shadow-[0_30px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowQRPopup(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-2.5 rounded-[16px] transition-colors shadow-sm border border-slate-100"
            >
              <X size={24} />
            </button>
            <div className="w-28 h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-[28px] lg:rounded-[32px] flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-2xl shadow-emerald-500/30 rotate-12 border-4 border-white">
              <CheckCircle2
                className="-rotate-12"
                size={56}
                strokeWidth={2.5}
              />
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mb-4 tracking-tight">
              تنظیمات ذخیره شد!
            </h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-8 text-[14px] lg:text-[15px]">
              هویت بصری و تنظیمات پایه مجموعه بروزرسانی شد. اکنون برای تکمیل
              دیجی‌منو خود، به بخش مدیریت محصولات بروید.
            </p>
            <div className="space-y-3 lg:space-y-4">
              <Link
                to="/products"
                className="w-full bg-slate-900 text-white py-4 lg:py-5 rounded-[20px] font-black flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all"
              >
                مدیریت محصولات <ArrowLeft size={20} />
              </Link>
              <Link
                to="/dashboard"
                className="w-full bg-white text-slate-600 border-2 border-slate-100 py-4 lg:py-5 rounded-[20px] font-black flex justify-center items-center hover:bg-slate-50 transition-all"
              >
                بازگشت به داشبورد
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default VenueSettings;
