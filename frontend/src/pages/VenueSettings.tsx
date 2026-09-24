import { useState, useRef, useEffect } from "react";
import {
  Settings,
  Trash2,
  Palette,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  X,
  Camera,
  ShoppingBag,
  BellRing,
  Lock,
  Check,
  Loader2,
  Store,
  MapPin,
  Phone,
  Hash,
  Link as LinkIcon,
  ArrowRight,
  ChefHat,
  Globe,
  Languages,
} from "lucide-react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";

export const VenueSettings = () => {
  // 🔴 تغییر وضعیت استپ‌ها به ۱، ۲ و ۳
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadySetup, setIsAlreadySetup] = useState(false);

  const [restaurantName, setRestaurantName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [tableCount, setTableCount] = useState<number | string>("");

  const [restaurantDesc, setRestaurantDesc] = useState("");
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
  const [isWaiterEnabled, setIsWaiterEnabled] = useState(true);
  const [isChefRequestEnabled, setIsChefRequestEnabled] = useState(false);
  const [isBilingual, setIsBilingual] = useState(false);

  // 🔴 استیت‌های جدید برای متن‌های انگلیسی
  const [restaurantDescEn, setRestaurantDescEn] = useState("");
  const [addressEn, setAddressEn] = useState("");

  const [userPlanCode, setUserPlanCode] = useState("standard");
  const [templates, setTemplates] = useState<any[]>([]);

  const [stepOneErrors, setStepOneErrors] = useState({ desc: false });

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [showQRPopup, setShowQRPopup] = useState(false);

  const isPlusPlan = userPlanCode === "plus";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venueData, templatesData] = await Promise.all([
          venuesApi.getMyVenue(),
          venuesApi.getTemplates(),
        ]);

        setTemplates(templatesData);

        setRestaurantName(venueData.name);
        setEnglishName(venueData.english_name);
        setAddress(venueData.address);
        setPhone(venueData.phone);
        setTableCount(venueData.table_count);

        setRestaurantDesc(venueData.description || "");
        // 🔴 لود کردن دیتای انگلیسی از بک‌اند
        setRestaurantDescEn(venueData.description_en || "");
        setAddressEn(venueData.address_en || "");

        setIsOrderingEnabled(venueData.is_ordering_enabled);
        setIsWaiterEnabled(venueData.is_waiter_enabled);
        setIsChefRequestEnabled(venueData.is_chef_request_enabled);
        setIsBilingual(venueData.is_bilingual);
        setSelectedTemplate(
          venueData.template_id || templatesData[0]?.code || "",
        );
        setUserPlanCode(venueData.plan_code || "standard");

        if (venueData.logo) {
          setLogoPreview(venueData.logo);
        }

        setIsAlreadySetup(venueData.has_completed_settings);
      } catch (err) {
        console.error("خطا در دریافت اطلاعات", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveVenueSettings = async (showPopup = false) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("description", restaurantDesc);
      formData.append("is_ordering_enabled", String(isOrderingEnabled));
      formData.append(
        "is_waiter_enabled",
        String(isPlusPlan ? isWaiterEnabled : false),
      );
      formData.append(
        "is_chef_request_enabled",
        String(isPlusPlan ? isChefRequestEnabled : false),
      );

      const bilingualActive = isPlusPlan ? isBilingual : false;
      formData.append("is_bilingual", String(bilingualActive));

      // 🔴 ارسال دیتای انگلیسی (اگر دوزبانه خاموش باشه، خالی میفرستیم)
      if (bilingualActive) {
        formData.append("description_en", restaurantDescEn);
        formData.append("address_en", addressEn);
      } else {
        formData.append("description_en", "");
        formData.append("address_en", "");
      }

      formData.append("template_id", selectedTemplate);

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (logoPreview === null) {
        formData.append("logo", "");
      }

      await venuesApi.updateVenueSettings(formData);
      setIsAlreadySetup(true);
      if (showPopup) setShowQRPopup(true);
    } catch (err) {
      console.error("خطا در ذخیره", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!restaurantDesc.trim()) {
        setStepOneErrors({ desc: true });
        return;
      }
      saveVenueSettings();
      // 🔴 هدایت به مرحله بعد بر اساس روشن بودن تیک دوزبانه
      setCurrentStep(isBilingual && isPlusPlan ? 2 : 3);
    } else if (currentStep === 2) {
      saveVenueSettings();
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

  const handleFinalSubmit = () => {
    if (!restaurantDesc.trim()) {
      setStepOneErrors({ desc: true });
      setCurrentStep(1);
      return;
    }
    saveVenueSettings(true);
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
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );

  // 🔴 داینامیک کردن تب‌های بالا
  const steps = [
    {
      id: 1,
      icon: Settings,
      title: "اطلاعات پایه",
      desc: "مشخصات و دسترسی‌ها",
    },
    ...(isBilingual && isPlusPlan
      ? [
          {
            id: 2,
            icon: Languages,
            title: "زبان انگلیسی",
            desc: "اطلاعات برای توریست‌ها",
          },
        ]
      : []),
    { id: 3, icon: Palette, title: "برندینگ", desc: "قالب و لوگو" },
  ];

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative font-sans text-slate-800"
      dir="rtl"
    >
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] left-[-5%] w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-2 md:mb-0">
            <Link
              to="/dashboard"
              className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all"
            >
              <ChevronRight size={24} />
            </Link>
            <div className="text-center md:text-right">
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                {isAlreadySetup
                  ? "ویرایش منو و تنظیمات"
                  : "تکمیل مشخصات و ساخت منو"}
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                با کلیک روی هر مرحله، تغییرات خود را اعمال کنید.
              </p>
            </div>
          </div>
        </header>

        <div className="mb-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
            {steps.map((item) => {
              const isActive = currentStep === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.id === 3 && currentStep === 1) handleNextStep();
                    else setCurrentStep(item.id as 1 | 2 | 3);
                  }}
                  className={`cursor-pointer flex-1 flex items-center gap-4 bg-white p-2.5 pr-4 rounded-[20px] border-2 transition-all duration-300 shadow-sm ${
                    isActive
                      ? "border-orange-500 shadow-orange-500/10 -translate-y-1"
                      : "border-slate-100 hover:border-orange-200"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner ${isActive ? "bg-orange-50 text-orange-500" : "bg-slate-50 text-slate-400"}`}
                  >
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="pl-4">
                    <h3
                      className={`font-black text-[15px] ${isActive ? "text-slate-800" : "text-slate-500"}`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] p-6 md:p-10 shadow-[0_15px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
          {/* ============================== */}
          {/* مرحله اول: تنظیمات پایه */}
          {/* ============================== */}
          {currentStep === 1 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm shadow-sm">
                  ۱
                </span>
                اطلاعات و دسترسی‌های رستوران
              </h2>

              <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 mb-4 border-b border-slate-100 pb-2">
                    اطلاعات ثبت‌شده (فقط خواندنی)
                  </h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="flex items-center gap-3 text-sm">
                      <Store size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-500 w-24">
                        نام مجموعه:
                      </span>
                      <span className="font-black text-slate-800">
                        {restaurantName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <LinkIcon size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-500 w-24">
                        آدرس منو:
                      </span>
                      <span className="font-mono font-bold text-orange-500 dir-ltr">
                        menujet.ir/{englishName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-500 w-24">
                        تلفن تماس:
                      </span>
                      <span className="font-bold text-slate-800 dir-ltr">
                        {phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Hash size={18} className="text-slate-400" />
                      <span className="font-bold text-slate-500 w-24">
                        تعداد میز:
                      </span>
                      <span className="font-black text-slate-800">
                        {tableCount} عدد
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-200/60">
                      <MapPin
                        size={18}
                        className="text-slate-400 shrink-0 mt-0.5"
                      />
                      <span className="font-bold text-slate-800 leading-relaxed">
                        {address}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">
                      درباره ما (نمایش در منوی مشتری){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="توضیح کوتاهی درباره کافه یا رستوران خود بنویسید..."
                      value={restaurantDesc}
                      onChange={(e) => {
                        setRestaurantDesc(e.target.value);
                        setStepOneErrors({ desc: false });
                      }}
                      className={`w-full bg-slate-50 border text-slate-800 rounded-2xl py-3.5 px-4 focus:outline-none transition-all shadow-sm resize-none font-medium ${
                        stepOneErrors.desc
                          ? "border-rose-400 ring-4 ring-rose-500/10 bg-white"
                          : "border-slate-200 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                      }`}
                    ></textarea>
                    {stepOneErrors.desc && (
                      <p className="text-rose-500 text-xs font-bold mt-1">
                        تکمیل این فیلد اجباری است.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 mb-4 border-b border-slate-100 pb-2">
                    قابلیت‌های سیستم منو
                  </h3>

                  <div
                    className={`p-5 rounded-[20px] border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${isOrderingEnabled ? "bg-white border-orange-400 shadow-md shadow-orange-500/10" : "bg-slate-50 border-slate-200"}`}
                    onClick={() => setIsOrderingEnabled(!isOrderingEnabled)}
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isOrderingEnabled ? "bg-orange-50 text-orange-500" : "bg-white text-slate-400 border border-slate-200"}`}
                      >
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <h4
                          className={`font-black text-sm mb-1 ${isOrderingEnabled ? "text-slate-800" : "text-slate-500"}`}
                        >
                          سفارش‌دهی آنلاین مشتری
                        </h4>
                        <p className="text-xs font-bold text-slate-400">
                          مشتری می‌تواند سفارش خود را در منو ثبت کند.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative w-12 h-7 shrink-0 rounded-full flex items-center p-1 transition-colors ${isOrderingEnabled ? "bg-orange-500" : "bg-slate-200"}`}
                      dir="ltr"
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isOrderingEnabled ? "translate-x-5" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-[20px] border-2 transition-all flex items-center justify-between gap-4 ${!isPlusPlan ? "opacity-60 grayscale bg-slate-50 border-slate-200 cursor-not-allowed" : isBilingual ? "bg-white border-blue-400 shadow-md shadow-blue-500/10 cursor-pointer" : "bg-slate-50 border-slate-200 cursor-pointer"}`}
                    onClick={() => {
                      if (isPlusPlan) setIsBilingual(!isBilingual);
                      else
                        alert(
                          "برای استفاده از منوی دو زبانه نیاز به پلن پلاس دارید.",
                        );
                    }}
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isBilingual && isPlusPlan ? "bg-blue-50 text-blue-500" : "bg-white text-slate-400 border border-slate-200"}`}
                      >
                        {!isPlusPlan ? <Lock size={24} /> : <Globe size={24} />}
                      </div>
                      <div>
                        <h4
                          className={`font-black text-sm mb-1 flex items-center gap-2 ${isBilingual && isPlusPlan ? "text-slate-800" : "text-slate-500"}`}
                        >
                          منوی دو زبانه (فا / EN)
                          {!isPlusPlan && (
                            <span className="bg-rose-50 text-rose-500 border border-rose-200 px-2 py-0.5 rounded text-[10px]">
                              نیاز به ارتقاء
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-bold text-slate-400">
                          فعال‌سازی زبان انگلیسی برای توریست‌ها.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative w-12 h-7 shrink-0 rounded-full flex items-center p-1 transition-colors ${!isPlusPlan ? "bg-slate-200" : isBilingual ? "bg-blue-500" : "bg-slate-200"}`}
                      dir="ltr"
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isBilingual && isPlusPlan ? "translate-x-5" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-[20px] border-2 transition-all flex items-center justify-between gap-4 ${!isPlusPlan ? "opacity-60 grayscale bg-slate-50 border-slate-200 cursor-not-allowed" : isChefRequestEnabled ? "bg-white border-orange-400 shadow-md shadow-orange-500/10 cursor-pointer" : "bg-slate-50 border-slate-200 cursor-pointer"}`}
                    onClick={() => {
                      if (isPlusPlan)
                        setIsChefRequestEnabled(!isChefRequestEnabled);
                      else
                        alert(
                          "برای استفاده از درخواست اختصاصی نیاز به پلن پلاس دارید.",
                        );
                    }}
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isChefRequestEnabled && isPlusPlan ? "bg-orange-50 text-orange-500" : "bg-white text-slate-400 border border-slate-200"}`}
                      >
                        {!isPlusPlan ? (
                          <Lock size={24} />
                        ) : (
                          <ChefHat size={24} />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`font-black text-sm mb-1 flex items-center gap-2 ${isChefRequestEnabled && isPlusPlan ? "text-slate-800" : "text-slate-500"}`}
                        >
                          سفارش اختصاصی به آشپز
                          {!isPlusPlan && (
                            <span className="bg-rose-50 text-rose-500 border border-rose-200 px-2 py-0.5 rounded text-[10px]">
                              نیاز به ارتقاء
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-bold text-slate-400">
                          مشتری می‌تواند درخواست پخت خاص ثبت کند.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative w-12 h-7 shrink-0 rounded-full flex items-center p-1 transition-colors ${!isPlusPlan ? "bg-slate-200" : isChefRequestEnabled ? "bg-orange-500" : "bg-slate-200"}`}
                      dir="ltr"
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isChefRequestEnabled && isPlusPlan ? "translate-x-5" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-[20px] border-2 transition-all flex items-center justify-between gap-4 ${!isPlusPlan ? "opacity-60 grayscale bg-slate-50 border-slate-200 cursor-not-allowed" : isWaiterEnabled ? "bg-white border-orange-400 shadow-md shadow-orange-500/10 cursor-pointer" : "bg-slate-50 border-slate-200 cursor-pointer"}`}
                    onClick={() => {
                      if (isPlusPlan) setIsWaiterEnabled(!isWaiterEnabled);
                      else
                        alert(
                          "برای استفاده از زنگ گارسون نیاز به پلن پلاس دارید.",
                        );
                    }}
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isWaiterEnabled && isPlusPlan ? "bg-orange-50 text-orange-500" : "bg-white text-slate-400 border border-slate-200"}`}
                      >
                        {!isPlusPlan ? (
                          <Lock size={24} />
                        ) : (
                          <BellRing size={24} />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`font-black text-sm mb-1 flex items-center gap-2 ${isWaiterEnabled && isPlusPlan ? "text-slate-800" : "text-slate-500"}`}
                        >
                          درخواست گارسون
                          {!isPlusPlan && (
                            <span className="bg-rose-50 text-rose-500 border border-rose-200 px-2 py-0.5 rounded text-[10px]">
                              نیاز به ارتقاء
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-bold text-slate-400">
                          مشتری با یک کلیک گارسون را احضار می‌کند.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`relative w-12 h-7 shrink-0 rounded-full flex items-center p-1 transition-colors ${!isPlusPlan ? "bg-slate-200" : isWaiterEnabled ? "bg-orange-500" : "bg-slate-200"}`}
                      dir="ltr"
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isWaiterEnabled && isPlusPlan ? "translate-x-5" : "translate-x-0"}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={handleNextStep}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "ذخیره و مرحله بعد"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================== */}
          {/* مرحله دوم: اطلاعات انگلیسی (نمایش فقط در صورت روشن بودن تیک) */}
          {/* ============================== */}
          {currentStep === 2 && isBilingual && isPlusPlan && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm shadow-sm">
                  ۲
                </span>
                اطلاعات بین‌المللی (انگلیسی)
              </h2>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6">
                  <p className="text-sm font-bold text-blue-800 leading-relaxed">
                    با وارد کردن اطلاعات رستوران به زبان انگلیسی، توریست‌ها
                    تجربه‌ی بسیار بهتری از منوی شما خواهند داشت. این اطلاعات فقط
                    زمانی که مشتری زبان منو را روی EN تنظیم کند نمایش داده
                    می‌شوند.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">
                    درباره ما (انگلیسی) / About Us
                  </label>
                  <textarea
                    dir="ltr"
                    rows={4}
                    placeholder="Write a short description about your cafe or restaurant..."
                    value={restaurantDescEn}
                    onChange={(e) => setRestaurantDescEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 px-4 focus:outline-none transition-all shadow-sm resize-none font-medium focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-left"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">
                    آدرس دقیق (انگلیسی) / Address
                  </label>
                  <textarea
                    dir="ltr"
                    rows={2}
                    placeholder="No 1, Valiasr St, Tehran..."
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 px-4 focus:outline-none transition-all shadow-sm resize-none font-medium focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-left"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={handlePrevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <ArrowRight size={18} /> مرحله قبل
                </button>
                <button
                  onClick={handleNextStep}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "ذخیره و مرحله بعد"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================== */}
          {/* مرحله سوم: برندینگ */}
          {/* ============================== */}
          {currentStep === 3 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-300 relative z-10">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm shadow-sm">
                  {isBilingual && isPlusPlan ? "۳" : "۲"}
                </span>
                هویت بصری و برندینگ
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-slate-600 mb-4 flex justify-between items-center">
                    <span>قالب منوی دیجیتال</span>
                    {!isPlusPlan && (
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                        بعضی قالب‌ها فقط در پلن پلاس فعالند
                      </span>
                    )}
                  </label>

                  {templates.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                      در حال دریافت لیست قالب‌ها...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {templates.map((tpl, index) => {
                        const isLocked = tpl.is_plus_only && !isPlusPlan;

                        return (
                          <div
                            key={tpl.code}
                            onClick={() => {
                              if (isLocked) {
                                alert(
                                  "برای انتخاب این قالب حرفه‌ای، لطفاً پلن خود را به پلاس ارتقا دهید.",
                                );
                              } else {
                                setSelectedTemplate(tpl.code);
                              }
                            }}
                            className={`relative cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 transition-all duration-300 ${
                              isLocked
                                ? "border-slate-200 bg-slate-50 opacity-60 grayscale"
                                : selectedTemplate === tpl.code
                                  ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]"
                                  : "border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50"
                            }`}
                          >
                            {isLocked && (
                              <div className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg z-10">
                                <Lock size={14} />
                              </div>
                            )}

                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedTemplate === tpl.code ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"}`}
                            >
                              <span className="font-black text-2xl">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-700 text-center leading-tight">
                              {tpl.name}
                            </span>
                            <a
                              href={`/${tpl.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:underline bg-blue-50 px-2 py-1.5 rounded-lg transition-colors w-full justify-center"
                            >
                              پیش‌نمایش <ExternalLink size={12} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-600 mb-4">
                    لوگوی رستوران
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                  {logoPreview ? (
                    <div className="relative border border-slate-200 rounded-[28px] flex flex-col items-center justify-center p-4 bg-slate-50 shadow-inner min-h-[250px] group overflow-hidden max-w-sm mx-auto md:mx-0">
                      <img
                        src={logoPreview}
                        className="max-h-[160px] object-contain rounded-2xl shadow-sm"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            setLogoFile(null);
                          }}
                          className="bg-white text-rose-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-rose-50"
                        >
                          <Trash2 size={18} /> حذف تصویر
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-[28px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-500 transition-colors cursor-pointer min-h-[250px] shadow-sm max-w-sm mx-auto md:mx-0"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-slate-400 shadow-sm border border-slate-100 group-hover:text-orange-500">
                        <Camera size={28} />
                      </div>
                      <div className="font-bold text-slate-500 text-sm">
                        بارگذاری لوگو
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 mt-2">
                        فرمت‌های مجاز: PNG, JPG
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={handlePrevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <ArrowRight size={18} /> مرحله قبل
                </button>
                <button
                  disabled={isSaving || !selectedTemplate}
                  onClick={handleFinalSubmit}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Check size={20} strokeWidth={3} />{" "}
                      {isAlreadySetup ? "ذخیره نهایی" : "انتشار منو"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQRPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-[40px] p-8 md:p-12 w-full max-w-md text-center relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setShowQRPopup(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-colors border border-slate-100"
            >
              <X size={24} />
            </button>
            <div className="w-28 h-28 bg-emerald-100 border-4 border-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 rotate-12">
              <CheckCircle2
                className="text-emerald-500 -rotate-12"
                size={56}
                strokeWidth={3}
              />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-4">
              تنظیمات ذخیره شد! 🎉
            </h3>
            <p className="text-slate-500 font-bold leading-relaxed mb-8">
              تنظیمات و هویت بصری منوی شما با موفقیت ذخیره شد. اکنون برای تکمیل
              منو و افزودن محصولات به بخش مدیریت دسته‌بندی‌ها و محصولات بروید.
            </p>
            <div className="space-y-3">
              <Link
                to="/products"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-1"
              >
                افزودن محصولات به منو
              </Link>
              <Link
                to="/dashboard"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1"
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
