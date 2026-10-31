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
  Lock,
  Loader2,
  Store,
  MapPin,
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { venuesApi } from "../service/api";

export const VenueSettings = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);

  // اطلاعات نمایشی رستوران (Read-only)
  const [restaurantName, setRestaurantName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [tableCount, setTableCount] = useState<number | string>("");

  // فیلدهای تنظیمات طبق Swagger
  const [aboutUsFa, setAboutUsFa] = useState("");
  const [aboutUsEn, setAboutUsEn] = useState("");
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
  const [isWaiterEnabled, setIsWaiterEnabled] = useState(true);
  const [isChefRequestEnabled, setIsChefRequestEnabled] = useState(false);
  const [isBilingual, setIsBilingual] = useState(false);
  const [theme, setTheme] = useState("");

  const [userPlanCode, setUserPlanCode] = useState("standard");
  const [templates, setTemplates] = useState<any[]>([]);
  const [stepOneErrors, setStepOneErrors] = useState({ desc: false });

  // فیلدهای لوگو
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>("");

  const [showQRPopup, setShowQRPopup] = useState(false);

  const isPlusPlan = userPlanCode === "plus";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await venuesApi.getMyVenue();
        const venueData = response.data || response;

        const templatesData = (await venuesApi.getTemplates?.()) || [
          { code: "modern", name: "مدرن", is_plus_only: false },
          { code: "classic", name: "کلاسیک", is_plus_only: false },
        ];

        setTemplates(templatesData);

        setRestaurantName(venueData.name || venueData.Name || "رستوران من");
        setEnglishName(
          venueData.slug || venueData.Slug || venueData.english_name || "menu",
        );
        setAddress(venueData.address || venueData.Address || "آدرس ثبت نشده");
        setPhone(
          venueData.phone || venueData.Phone || venueData.phoneNumber || "---",
        );
        setTableCount(
          venueData.tableCount ||
            venueData.TableCount ||
            venueData.table_count ||
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
          venueData.callWaiterEnabled ?? venueData.CallWaiterEnabled ?? false,
        );
        setIsChefRequestEnabled(
          venueData.callChefEnabled ?? venueData.CallChefEnabled ?? false,
        );
        setIsBilingual(venueData.bilingual ?? venueData.Bilingual ?? false);

        setTheme(
          venueData.theme || venueData.Theme || templatesData[0]?.code || "",
        );
        setUserPlanCode(
          venueData.plan_code || venueData.PlanCode || "standard",
        );

        const logo = venueData.logoUrl || venueData.LogoUrl || venueData.logo;
        if (logo) {
          setLogoPreview(logo);
          setExistingLogoUrl(logo);
        }

        setIsAlreadySetup(
          venueData.has_completed_settings ||
            venueData.HasCompletedSettings ||
            false,
        );
      } catch (err: any) {
        console.error("❌ خطا در دریافت اطلاعات", err.message);
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
      // ۱. آپدیت تنظیمات و امکانات
      await venuesApi.updateSettings({
        orderingEnabled: isOrderingEnabled,
        bilingual: isPlusPlan ? isBilingual : false,
        callWaiterEnabled: isPlusPlan ? isWaiterEnabled : false,
        callChefEnabled: isPlusPlan ? isChefRequestEnabled : false,
        aboutUsFa: aboutUsFa,
        aboutUsEn: isPlusPlan && isBilingual ? aboutUsEn : "",
      });

      // ۲. آپلود لوگو در صورت تغییر
      let finalLogoUrl = existingLogoUrl;
      if (logoFile) {
        finalLogoUrl = await venuesApi.uploadLogo(logoFile);
      } else if (logoPreview === null) {
        finalLogoUrl = "";
      }

      // ۳. آپدیت برندینگ و قالب (همراه با محکم‌کاری برای بک‌اند)
      const brandingPayload = {
        logoUrl: finalLogoUrl || "", // جلوگیری از ارسال null یا undefined
        theme: theme || "modern", // مقدار پیش‌فرض در صورت خالی بودن
      };

      console.log("📤 دیتای برندینگ که به سرور می‌رود:", brandingPayload);
      await venuesApi.updateBranding(brandingPayload);

      setIsAlreadySetup(true);
      setShowQRPopup(true);
    } catch (err) {
      console.error("خطا در ذخیره اطلاعات:", err);
      alert("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!aboutUsFa.trim()) {
        setStepOneErrors({ desc: true });
        return;
      }
      setCurrentStep(isBilingual && isPlusPlan ? 2 : 3);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(isBilingual && isPlusPlan ? 2 : 1);
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

  if (isLoading)
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  const steps = [
    {
      id: 1,
      icon: Settings,
      title: "تنظیمات پایه",
      desc: "مشخصات و دسترسی‌ها",
    },
    ...(isBilingual && isPlusPlan
      ? [
          {
            id: 2,
            icon: Languages,
            title: "زبان بین‌المللی",
            desc: "درباره ما به انگلیسی",
          },
        ]
      : []),
    { id: 3, icon: Palette, title: "هویت بصری", desc: "قالب و لوگو" },
  ];

  const IosToggle = ({
    enabled,
    onClick,
    icon: Icon,
    title,
    desc,
    locked = false,
  }: any) => (
    <div
      onClick={locked ? undefined : onClick}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-all duration-300 ${locked ? "opacity-50 cursor-not-allowed bg-slate-50/50" : "cursor-pointer hover:bg-slate-50"}`}
    >
      <div className="flex gap-4 items-start sm:items-center mb-4 sm:mb-0">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm ${enabled && !locked ? "bg-orange-50 text-orange-500 border border-orange-100" : "bg-white text-slate-400 border border-slate-200"}`}
        >
          {locked ? <Lock size={24} /> : <Icon size={24} strokeWidth={2} />}
        </div>
        <div>
          <h4 className="font-black text-[16px] text-slate-800 flex items-center gap-2 mb-1.5">
            {title}
            {locked && (
              <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg text-[11px] border border-rose-100 shadow-sm">
                ویژه پلاس
              </span>
            )}
          </h4>
          <p className="text-[13px] font-bold text-slate-500 max-w-sm leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
      <div
        className={`relative w-14 h-[34px] shrink-0 rounded-full flex items-center p-1 transition-all duration-300 ease-in-out border ${enabled && !locked ? "bg-emerald-500 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]" : "bg-slate-200 border-slate-200"}`}
        dir="ltr"
      >
        <div
          className={`w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${enabled && !locked ? "translate-x-[20px]" : "translate-x-0"}`}
        ></div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#f4f7f9] font-sans text-slate-800 pb-24 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background Soft Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-orange-300/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto p-6 md:p-10 relative z-10">
        <header className="flex items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <Link
            to="/dashboard"
            className="w-14 h-14 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white rounded-[24px] flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-100 hover:shadow-orange-500/10 transition-all active:scale-95"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">
              {isAlreadySetup ? "تنظیمات مجموعه" : "راه‌اندازی دیجی‌منو"}
            </h1>
            <p className="text-slate-500 text-sm font-bold">
              شخصی‌سازی امکانات، ظاهر و اطلاعات رستوران شما در پلتفرم دیجی‌منو
            </p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className="w-full lg:w-[340px] sticky top-8 space-y-4 shrink-0">
            {steps.map((item) => {
              const isActive = currentStep === item.id;
              const isPast = currentStep > item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 3 && currentStep === 1) handleNextStep();
                    else setCurrentStep(item.id as 1 | 2 | 3);
                  }}
                  className={`cursor-pointer w-full flex items-center gap-5 p-5 rounded-[32px] transition-all duration-500 ${
                    isActive
                      ? "bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-white scale-[1.02]"
                      : "hover:bg-white/50 text-slate-500 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isActive
                        ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : isPast
                          ? "bg-emerald-50 text-emerald-500 border border-emerald-100"
                          : "bg-white border border-slate-200 text-slate-400"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 size={28} strokeWidth={2.5} />
                    ) : (
                      <item.icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`font-black text-[17px] tracking-tight mb-1 ${isActive ? "text-slate-900" : ""}`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-[13px] font-bold ${isActive ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white/70 backdrop-blur-2xl rounded-[48px] shadow-[0_30px_80px_rgba(0,0,0,0.03)] border border-white overflow-hidden relative flex flex-col min-h-[700px]">
            <div className="p-8 md:p-14 flex-1 relative z-10">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="animate-in slide-in-from-left-12 fade-in duration-500">
                  {/* VIP Glass Card */}
                  <div className="bg-slate-900 rounded-[36px] p-8 md:p-10 mb-14 text-white relative overflow-hidden shadow-2xl shadow-slate-900/15 border border-slate-800">
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-white/10 rounded-[20px] backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                            <Store
                              className="text-orange-400"
                              size={26}
                              strokeWidth={2}
                            />
                          </div>
                          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                            {restaurantName}
                          </h2>
                        </div>
                        <a
                          href={`https://digimenoo.ir/${englishName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/50 transition-colors px-5 py-3 rounded-2xl text-sm font-mono font-bold text-orange-300 dir-ltr backdrop-blur-xl border border-white/5 shadow-inner"
                        >
                          digimenoo.ir/{englishName} <ExternalLink size={16} />
                        </a>
                      </div>

                      <div className="flex gap-8 md:border-r border-white/10 pt-6 md:pt-0 md:pr-10">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                            Phone Number
                          </p>
                          <p className="font-mono font-black text-xl dir-ltr text-white drop-shadow-sm flex items-center gap-2">
                            <Phone size={16} className="text-slate-400" />{" "}
                            {phone}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                            Total Tables
                          </p>
                          <p className="font-black text-xl flex items-center gap-2 text-white drop-shadow-sm">
                            <Hash size={18} className="text-orange-400" />{" "}
                            {tableCount}{" "}
                            <span className="text-sm text-slate-400 font-bold">
                              میز
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* About Us Input */}
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-5 tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full shadow-sm"></div>
                        درباره مجموعه
                      </h3>
                      <div className="relative">
                        <textarea
                          rows={5}
                          placeholder="متنی جذاب برای معرفی کافه یا رستوران خود در صفحه اصلی دیجی‌منو بنویسید..."
                          value={aboutUsFa}
                          onChange={(e) => {
                            setAboutUsFa(e.target.value);
                            setStepOneErrors({ desc: false });
                          }}
                          className={`w-full bg-white border-2 rounded-[32px] p-6 text-[15px] font-bold text-slate-700 focus:outline-none transition-all resize-none placeholder:text-slate-300 shadow-sm ${
                            stepOneErrors.desc
                              ? "border-rose-400 bg-rose-50/30"
                              : "border-slate-200/70 focus:border-orange-400 focus:shadow-[0_8px_30px_rgb(249,115,22,0.12)]"
                          }`}
                        ></textarea>
                      </div>
                      {stepOneErrors.desc && (
                        <p className="text-rose-500 text-sm font-black mt-3 flex items-center gap-1.5 animate-in slide-in-from-top-2">
                          <AlertCircle size={18} /> نوشتن توضیحات مجموعه الزامی
                          است.
                        </p>
                      )}
                    </div>

                    {/* Features Setup */}
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-5 tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full shadow-sm"></div>
                        امکانات هوشمند دیجی‌منو
                      </h3>
                      <div className="bg-white border border-slate-200/80 rounded-[36px] overflow-hidden shadow-sm divide-y divide-slate-100">
                        <IosToggle
                          enabled={isOrderingEnabled}
                          onClick={() =>
                            setIsOrderingEnabled(!isOrderingEnabled)
                          }
                          icon={ShoppingBag}
                          title="سفارش‌دهی آنلاین"
                          desc="مشتریان می‌توانند بدون نیاز به حضور گارسون، مستقیماً از روی موبایل خود سفارش ثبت کنند."
                        />
                        <IosToggle
                          enabled={isBilingual}
                          onClick={() => {
                            if (isPlusPlan) setIsBilingual(!isBilingual);
                          }}
                          icon={Globe}
                          title="منوی دو زبانه (انگلیسی)"
                          desc="پشتیبانی از زبان انگلیسی برای راهنمایی دقیق‌تر توریست‌ها و مشتریان بین‌المللی."
                          locked={!isPlusPlan}
                        />
                        <IosToggle
                          enabled={isWaiterEnabled}
                          onClick={() => {
                            if (isPlusPlan)
                              setIsWaiterEnabled(!isWaiterEnabled);
                          }}
                          icon={BellRing}
                          title="سیستم احضار گارسون"
                          desc="اضافه شدن دکمه درخواست گارسون به منوی مشتریان حاضر در سالن."
                          locked={!isPlusPlan}
                        />
                        <IosToggle
                          enabled={isChefRequestEnabled}
                          onClick={() => {
                            if (isPlusPlan)
                              setIsChefRequestEnabled(!isChefRequestEnabled);
                          }}
                          icon={ChefHat}
                          title="درخواست اختصاصی از آشپز"
                          desc="امکان ثبت یادداشت متنی مشتری برای پخت (مثلاً بدون نمک، کاملاً برشته و ...)."
                          locked={!isPlusPlan}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && isBilingual && isPlusPlan && (
                <div className="animate-in slide-in-from-left-12 fade-in duration-500">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">
                    اطلاعات بین‌المللی (English)
                  </h3>
                  <div className="bg-blue-50/80 border border-blue-100 rounded-[32px] p-8 mb-12 flex gap-6 items-center shadow-inner">
                    <div className="w-16 h-16 bg-white text-blue-500 rounded-[24px] shadow-sm border border-blue-100 flex items-center justify-center shrink-0">
                      <Globe size={32} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-black text-blue-950 mb-2 text-xl tracking-tight">
                        International Profile
                      </h4>
                      <p className="text-[14.5px] font-bold text-blue-800/80 leading-relaxed max-w-lg">
                        این توضیحات فقط زمانی که کاربر زبان منوی دیجی‌منو را به
                        انگلیسی تغییر دهد، در صفحه اصلی رستوران نمایش داده
                        می‌شود.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[15px] font-black text-slate-800 mb-4 dir-ltr text-left">
                      About Us (Description)
                    </label>
                    <textarea
                      dir="ltr"
                      rows={6}
                      placeholder="Welcome to our restaurant. We serve the best food in town..."
                      value={aboutUsEn}
                      onChange={(e) => setAboutUsEn(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200/70 rounded-[32px] p-6 text-[15px] font-medium text-slate-700 focus:outline-none transition-all resize-none focus:border-blue-400 focus:shadow-[0_8px_30px_rgb(59,130,246,0.12)] text-left shadow-sm"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="animate-in slide-in-from-left-12 fade-in duration-500">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">
                    هویت بصری و برندینگ
                  </h3>

                  <div className="mb-14">
                    <h4 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-3">
                      <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-500 rounded-full shadow-sm"></div>
                      لوگوی مجموعه
                    </h4>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-10 bg-white border border-slate-200/80 rounded-[40px] p-10 shadow-sm">
                      {logoPreview ? (
                        <div className="w-40 h-40 rounded-[32px] bg-white border border-slate-200 shadow-sm p-3 relative group overflow-hidden shrink-0">
                          <img
                            src={logoPreview}
                            className="w-full h-full object-contain rounded-[24px]"
                            alt="Logo"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-[32px]">
                            <button
                              onClick={() => {
                                setLogoPreview(null);
                                setLogoFile(null);
                              }}
                              className="text-white hover:text-rose-400 transition-colors bg-white/10 p-3 rounded-2xl border border-white/20 hover:bg-rose-500/20"
                            >
                              <Trash2 size={26} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-40 h-40 rounded-[32px] border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-orange-50 hover:border-orange-400 transition-all flex flex-col items-center justify-center cursor-pointer shrink-0 group text-slate-400 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-500/15"
                        >
                          <ImageIcon
                            size={40}
                            strokeWidth={1.5}
                            className="mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1"
                          />
                          <span className="text-[14px] font-black tracking-tight">
                            انتخاب لوگو
                          </span>
                        </div>
                      )}
                      <div>
                        <h5 className="font-black text-slate-900 mb-2.5 text-xl tracking-tight">
                          تصویر با کیفیت آپلود کنید
                        </h5>
                        <p className="text-[14px] font-bold text-slate-500 leading-relaxed max-w-sm">
                          لوگوی شما در صفحه اصلی دیجی‌منو و فاکتور مشتریان نمایش
                          داده می‌شود. فایل‌های مربعی (PNG) با پس‌زمینه شفاف
                          (Transparent) بهترین نتیجه را دارند.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-6 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full shadow-sm"></div>
                        انتخاب قالب منو
                      </div>
                      {!isPlusPlan && (
                        <span className="text-[12px] font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 shadow-sm flex items-center gap-1.5">
                          <Lock size={14} /> برخی قالب‌ها قفل هستند
                        </span>
                      )}
                    </h4>
                    {templates.length === 0 ? (
                      <div className="text-center p-14 border-2 border-dashed border-slate-200 rounded-[40px] text-slate-400 font-black text-lg">
                        در حال دریافت قالب‌های دیجی‌منو...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {templates.map((tpl) => {
                          const isLocked = tpl.is_plus_only && !isPlusPlan;
                          const isSelected = theme === tpl.code;
                          return (
                            <div
                              key={tpl.code}
                              onClick={() => {
                                if (isLocked)
                                  alert(
                                    "برای انتخاب این قالب حرفه‌ای، لطفاً حساب کاربری خود را به پلن پلاس ارتقا دهید.",
                                  );
                                else setTheme(tpl.code);
                              }}
                              className={`relative cursor-pointer rounded-[36px] p-2 transition-all duration-300 ${
                                isLocked
                                  ? "opacity-50 grayscale hover:grayscale-0 bg-slate-50"
                                  : isSelected
                                    ? "bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-slate-900/25 scale-[1.02] -translate-y-1"
                                    : "bg-white border-2 border-slate-100 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1"
                              }`}
                            >
                              <div
                                className={`h-40 rounded-[28px] flex flex-col items-center justify-center ${isSelected ? "bg-white/10 text-white border border-white/10 shadow-inner" : "bg-slate-50 text-slate-300 border border-slate-100/50"}`}
                              >
                                <Palette
                                  size={44}
                                  strokeWidth={1.5}
                                  className={
                                    isSelected
                                      ? "opacity-100 text-orange-400 drop-shadow-md"
                                      : "opacity-50"
                                  }
                                />
                              </div>
                              <div
                                className={`p-5 flex items-center justify-between ${isSelected ? "text-white" : "text-slate-800"}`}
                              >
                                <span className="text-[16px] font-black tracking-tight">
                                  {tpl.name}
                                </span>
                                {isLocked && (
                                  <Lock size={20} className="text-rose-500" />
                                )}
                                {isSelected && (
                                  <CheckCircle2
                                    size={24}
                                    className="text-emerald-400"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 md:p-8 flex items-center justify-between mt-auto z-20 rounded-b-[48px]">
              <button
                onClick={handlePrevStep}
                className={`px-8 py-4 rounded-[20px] font-black transition-all flex items-center gap-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 ${currentStep === 1 ? "opacity-0 pointer-events-none" : ""}`}
              >
                <ArrowRight size={22} /> بازگشت
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-[20px] font-black transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(15,23,42,0.2)] active:scale-95 hover:-translate-y-1"
                >
                  مرحله بعد <ArrowLeft size={22} />
                </button>
              ) : (
                <button
                  disabled={isSaving || !theme}
                  onClick={handleFinalSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[20px] font-black transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95 hover:-translate-y-1 disabled:opacity-50 disabled:active:scale-100 disabled:hover:translate-y-0"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Save size={24} strokeWidth={2.5} />{" "}
                      {isAlreadySetup ? "ذخیره تغییرات" : "انتشار در دیجی‌منو"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showQRPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-[48px] p-10 md:p-14 w-full max-w-md text-center relative shadow-[0_30px_80px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-500">
            <button
              onClick={() => setShowQRPopup(false)}
              className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-3 rounded-[18px] transition-colors shadow-sm border border-slate-100"
            >
              <X size={24} />
            </button>
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 rotate-12 border-4 border-white">
              <CheckCircle2
                className="-rotate-12"
                size={64}
                strokeWidth={2.5}
              />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              تنظیمات ذخیره شد!
            </h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-10 text-[15px]">
              هویت بصری و تنظیمات پایه مجموعه بروزرسانی شد. اکنون برای تکمیل
              دیجی‌منو خود، به بخش مدیریت محصولات بروید.
            </p>
            <div className="space-y-4">
              <Link
                to="/products"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[24px] font-black flex justify-center items-center gap-2 shadow-[0_10px_30px_rgba(15,23,42,0.15)] transition-all hover:-translate-y-1 active:scale-95"
              >
                مدیریت محصولات <ArrowLeft size={20} />
              </Link>
              <Link
                to="/dashboard"
                className="w-full bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-100 py-5 rounded-[24px] font-black flex justify-center items-center transition-all active:scale-95"
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
