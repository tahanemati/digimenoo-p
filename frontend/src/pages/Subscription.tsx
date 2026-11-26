import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  CreditCard,
  CheckCircle2,
  CalendarDays,
  ArrowLeft,
  Loader2,
  Receipt,
  X,
  Gift,
  Lock,
  Store,
  HelpCircle,
  Wallet,
  Plus,
  AlertTriangle,
  Check,
  Sparkles,
} from "lucide-react";
import { subscriptionApi, walletApi } from "../service/api";
import { Link } from "react-router-dom";

type DurationMonths = 3 | 6 | 9;
type PlanTierKey = "basic" | "standard" | "plus";

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (res?.data && Array.isArray(res.data.items)) return res.data.items;
  return [];
};

const detectTierKey = (plan: any, fallbackIdx: number): PlanTierKey => {
  const rawTier = String(plan?.tier || plan?.code || "").toLowerCase();
  const rawName = String(plan?.name || "").toLowerCase();

  if (rawTier === "basic" || rawName.includes("پایه")) return "basic";
  if (rawTier === "standard" || rawName.includes("استاندارد"))
    return "standard";
  if (rawTier === "plus" || rawName.includes("پلاس")) return "plus";

  if (fallbackIdx === 1) return "standard";
  if (fallbackIdx >= 2) return "plus";
  return "basic";
};

const detectDurationMonths = (plan: any): number | null => {
  if (plan?.durationMonths) return Number(plan.durationMonths);
  if (plan?.duration_months) return Number(plan.duration_months);
  if (plan?.durationDays) {
    const approx = Math.round(Number(plan.durationDays) / 30);
    if ([3, 6, 9].includes(approx)) return approx;
  }
  return null;
};

export const Subscription = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [rawPlans, setRawPlans] = useState<any[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<DurationMonths>(3);

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [pageError, setPageError] = useState("");

  // مودال تایید خرید پلن از کیف پول
  const [confirmPlanModal, setConfirmPlanModal] = useState<any | null>(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState("");

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setPageError("");

      const [subRes, plansRes, transRes, walletRes] = await Promise.all([
        subscriptionApi.getCurrentSubscription().catch((err) => ({
          __error: err?.message || "خطا در دریافت وضعیت اشتراک",
          status: err?.response?.status,
        })),
        subscriptionApi.getPlans().catch(() => []),
        subscriptionApi.getTransactions().catch(() => []),
        walletApi.getBalance().catch(() => ({ data: { balance: 0 } })),
      ]);

      if (subRes?.__error && subRes?.status === 404) {
        setPageError(subRes.__error);
        return;
      }

      const activeSub = subRes?.data?.data || subRes?.data || subRes;
      const wPayload = walletRes?.data?.data || walletRes?.data || walletRes;
      const resolvedBalance = Number(
        activeSub?.walletBalance ?? wPayload?.balance ?? 0,
      );
      setWalletBalance(resolvedBalance);

      const safePlans = extractArray(plansRes);
      const safeHistory = extractArray(transRes);

      let subDetails = null;
      if (activeSub && activeSub.expireDate) {
        const expDate = new Date(activeSub.expireDate);
        const now = new Date();
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        subDetails = {
          ...activeSub,
          days_left: daysLeft,
          total_days: activeSub.totalDays || activeSub.durationDays || 90,
          is_trial_mode: activeSub.isTrial || false,
          expireDateFormatted: new Intl.DateTimeFormat("fa-IR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(expDate),
        };
      }

      const formattedHistory = safeHistory.map((item: any) => ({
        ...item,
        dateFormatted: new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date || item.createdAt || new Date())),
      }));

      setRawPlans(safePlans);
      setCurrentPlan(subDetails);
      setHistoryData(formattedHistory);
    } catch (err: any) {
      console.error("خطا در دریافت اطلاعات اشتراک", err);
      setPageError(
        err?.message ||
          err?.detail ||
          "برای مشاهده اشتراک‌ها، ابتدا باید اطلاعات مجموعه خود را ثبت کنید.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // ساخت لیست ۳ پلن (پایه، استاندارد، پلاس) متناسب با بازه انتخاب‌شده (۳، ۶ یا ۹ ماهه)
  const displayedPlans = (() => {
    const tierConfigs: {
      key: PlanTierKey;
      defaultTitle: string;
      defaultSubtitle: string;
      icon: string;
      color: string;
      bgLight: string;
      isPopular: boolean;
    }[] = [
      {
        key: "basic",
        defaultTitle: "پایه",
        defaultSubtitle: "شروعی عالی برای کافه‌ها و مجموعه‌های کوچک",
        icon: "Package",
        color: "text-blue-500",
        bgLight: "bg-blue-50",
        isPopular: false,
      },
      {
        key: "standard",
        defaultTitle: "استاندارد",
        defaultSubtitle: "ایده‌آل برای رستوران‌های رو به رشد",
        icon: "Store",
        color: "text-orange-500",
        bgLight: "bg-orange-50",
        isPopular: true,
      },
      {
        key: "plus",
        defaultTitle: "پلاس",
        defaultSubtitle: "امکانات کامل برای مجموعه‌های حرفه‌ای و شعب",
        icon: "Crown",
        color: "text-purple-500",
        bgLight: "bg-purple-50",
        isPopular: false,
      },
    ];

    const matchedCards = tierConfigs
      .map((cfg, idx) => {
        // ۱. جستجو برای پلنی که هم سطح (tier) و هم مدت (durationMonths) آن منطبق است
        let matched = rawPlans.find(
          (p, pIdx) =>
            detectTierKey(p, pIdx) === cfg.key &&
            detectDurationMonths(p) === selectedMonths,
        );

        // ۲. اگر در بک‌اند فقط ۳ پلن تعریف شده و قیمت‌های ۳/۶/۹ ماهه روی همان رکورد ذخیره شده‌اند
        if (!matched) {
          const tierOnlyPlan = rawPlans.find(
            (p, pIdx) => detectTierKey(p, pIdx) === cfg.key,
          );
          if (tierOnlyPlan) {
            const dynamicPrice =
              selectedMonths === 3
                ? (tierOnlyPlan.price3m ??
                  tierOnlyPlan.price_3m ??
                  tierOnlyPlan.price)
                : selectedMonths === 6
                  ? (tierOnlyPlan.price6m ??
                    tierOnlyPlan.price_6m ??
                    tierOnlyPlan.price)
                  : (tierOnlyPlan.price9m ??
                    tierOnlyPlan.price_9m ??
                    tierOnlyPlan.price);

            matched = {
              ...tierOnlyPlan,
              price: dynamicPrice,
              durationMonths: selectedMonths,
              durationDays: selectedMonths * 30,
            };
          }
        }

        if (!matched) return null;

        const durationDays =
          Number(matched.durationDays) || selectedMonths * 30;

        return {
          ...matched,
          tierKey: cfg.key,
          displayTitle: matched.name || cfg.defaultTitle,
          subtitle: matched.subtitle || cfg.defaultSubtitle,
          icon: matched.icon || cfg.icon,
          color: cfg.color,
          bgLight: cfg.bgLight,
          isPopular:
            typeof matched.isPopular === "boolean"
              ? matched.isPopular
              : cfg.isPopular,
          selectedMonths,
          durationDays,
          orderIndex: idx,
        };
      })
      .filter(Boolean);

    return matchedCards;
  })();

  const openPurchaseModal = (plan: any) => {
    setPurchaseError("");
    setConfirmPlanModal(plan);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmPlanModal) return;
    setIsProcessing(true);
    setPurchaseError("");

    try {
      const res = await (subscriptionApi.purchasePlan as any)(
        confirmPlanModal.id,
        selectedMonths,
      );
      const payload = res?.data?.data || res?.data || res;

      if (typeof payload?.walletBalance === "number") {
        setWalletBalance(payload.walletBalance);
      }

      setPurchaseSuccess(
        res?.message ||
          `پلن ${confirmPlanModal.displayTitle} (${selectedMonths.toLocaleString("fa-IR")} ماهه) با موفقیت فعال شد!`,
      );
      setConfirmPlanModal(null);
      await fetchInitialData();
    } catch (err: any) {
      setPurchaseError(
        err?.message ||
          err?.response?.data?.message ||
          "خطا در انجام عملیات خرید.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div
        className="min-h-[80vh] flex flex-col justify-center items-center p-6 animate-in fade-in zoom-in-95 duration-500"
        dir="rtl"
      >
        <div className="bg-white max-w-md w-full rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-orange-200 relative">
            <Store size={40} strokeWidth={2} />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <Lock size={18} className="text-slate-400" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            اولین قدم در <span className="text-orange-500">دیجی‌منو</span>
          </h2>
          <p className="text-[14px] font-bold text-slate-500 leading-loose mb-8 px-4">
            {pageError}
          </p>

          <Link
            to="/setup-venue"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1"
          >
            ایجاد مجموعه جدید <ArrowLeft size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = !currentPlan || currentPlan.days_left <= 0;
  const elapsedDays = currentPlan
    ? Math.max(0, currentPlan.total_days - currentPlan.days_left)
    : 0;
  const progressPercentage =
    currentPlan && currentPlan.total_days > 0
      ? (elapsedDays / currentPlan.total_days) * 100
      : 100;

  const durationOptions: {
    months: DurationMonths;
    label: string;
    badge?: string;
  }[] = [
    { months: 3, label: "۳ ماهه" },
    { months: 6, label: "۶ ماهه" },
    { months: 9, label: "۹ ماهه", badge: "به‌صرفه" },
  ];
  const activeDurationIdx = durationOptions.findIndex(
    (d) => d.months === selectedMonths,
  );

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-sans text-slate-800 min-h-screen bg-[#F5F5F7] pb-28 lg:pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto pb-16">
        {/* هدر صفحه + کارت موجودی حساب */}
        <header className="mb-10 relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white text-orange-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                اشتراک و تمدید
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              مدیریت پکیج‌ها، ارتقاء حساب و مشاهده وضعیت اعتبار پنل
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[24px] p-4 sm:px-6 sm:py-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-center justify-between sm:justify-start gap-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <Wallet size={22} strokeWidth={2.2} />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 mb-0.5">
                  موجودی حساب شما
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {walletBalance.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    تومان
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/wallet"
              className="bg-slate-900 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Plus size={15} strokeWidth={3} /> شارژ حساب
            </Link>
          </div>
        </header>

        {purchaseSuccess && (
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{purchaseSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setPurchaseSuccess("")}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* وضعیت اشتراک فعلی */}
        <div
          className={`bg-white/80 backdrop-blur-xl border rounded-[32px] p-6 md:p-8 mb-12 relative overflow-hidden transition-all shadow-[0_10px_40px_rgb(0,0,0,0.03)] ${isExpired ? "border-rose-200" : currentPlan?.is_trial_mode ? "border-amber-200" : "border-emerald-200"}`}
        >
          <div
            className={`absolute -top-24 -left-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${isExpired ? "bg-rose-400/20" : currentPlan?.is_trial_mode ? "bg-amber-400/20" : "bg-emerald-400/20"}`}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {isExpired ? (
                  <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <Lock size={14} /> بدون اشتراک فعال
                  </span>
                ) : currentPlan?.is_trial_mode ? (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <Gift size={14} /> نسخه آزمایشی فعال
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    اشتراک ویژه فعال
                  </span>
                )}
                <h2 className="text-2xl font-black text-slate-800">
                  {currentPlan?.name || currentPlan?.planName || "بدون پلن"}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6 font-medium">
                <CalendarDays size={18} className="text-slate-400" /> تاریخ
                پایان:{" "}
                <span
                  className={`font-black ${isExpired ? "text-rose-500" : "text-slate-800"}`}
                >
                  {currentPlan?.expireDateFormatted || "-"}
                </span>
              </div>

              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2 font-bold">
                  <span className="text-slate-400">
                    روزهای باقیمانده از اشتراک
                  </span>
                  <span
                    className={
                      isExpired
                        ? "text-rose-500"
                        : currentPlan?.is_trial_mode
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                  >
                    {isExpired
                      ? "۰ روز"
                      : `${currentPlan?.days_left.toLocaleString("fa-IR")} روز باقیمانده`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isExpired ? "bg-rose-500" : currentPlan?.is_trial_mode ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`}
                    style={{
                      width: `${Math.min(Math.max(progressPercentage, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("plans-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className={`w-full lg:w-auto px-8 py-4 rounded-2xl font-black transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg ${isExpired ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25" : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25"}`}
              >
                {isExpired ? "خرید پلن و فعالسازی" : "ارتقاء یا تمدید پلن"}{" "}
                <ArrowLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="w-full lg:w-auto bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Receipt size={18} /> سابقه پرداخت‌ها
              </button>
            </div>
          </div>
        </div>

        {/* انتخاب بازه زمانی (۳ ماهه، ۶ ماهه، ۹ ماهه) + ۳ پلن پایه، استاندارد و پلاس */}
        <div
          id="plans-section"
          className="mb-10 text-center scroll-mt-8 relative z-10"
        >
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
            انتخاب پلن اشتراک
          </h2>
          <p className="text-slate-500 text-sm mb-7 font-medium">
            مدت زمان اشتراک و سطح امکانات مورد نیاز مجموعه خود را انتخاب کنید.
          </p>

          {/* سوئیچر کپسولی بازه زمانی (Apple Segmented Toggle) */}
          <div className="relative inline-flex bg-slate-200/70 backdrop-blur-md p-1.5 rounded-full border border-white shadow-2xs mx-auto">
            <div
              style={{
                transform: `translateX(-${activeDurationIdx * 100}%)`,
              }}
              className="absolute top-1.5 bottom-1.5 right-1.5 w-[104px] sm:w-[124px] bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-out"
            />

            {durationOptions.map((opt) => {
              const isSelected = selectedMonths === opt.months;
              return (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`relative z-10 w-[104px] sm:w-[124px] py-2.5 font-black text-xs sm:text-sm transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.badge && (
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {displayedPlans.length === 0 ? (
          <div className="text-center text-slate-400 py-10 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
            هیچ پلنی برای بازه {selectedMonths.toLocaleString("fa-IR")} ماهه از
            سمت سرور تعریف نشده است!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6 lg:gap-8 items-stretch relative z-10">
            {displayedPlans.map((plan: any) => {
              const IconComponent = (Icons as any)[plan.icon] || HelpCircle;
              const isActivePlan =
                currentPlan?.planId === plan.id && !isExpired;
              const badge =
                plan.badgeText || (plan.isPopular ? "محبوب‌ترین انتخاب" : "");

              return (
                <div
                  key={`${plan.id}-${selectedMonths}`}
                  className={`relative bg-white border-2 rounded-[32px] p-8 transition-all duration-300 group shadow-sm hover:shadow-xl flex flex-col h-full ${plan.isPopular ? "border-orange-500 shadow-orange-500/10 lg:-translate-y-3" : "border-slate-100 hover:border-orange-200"}`}
                >
                  {badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-md shadow-orange-500/20 flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles size={13} /> {badge}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${plan.bgLight} ${plan.color}`}
                    >
                      <IconComponent size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-1">
                        {plan.displayTitle}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        {isActivePlan
                          ? "پلن فعال فعلی شما"
                          : `دوره ${selectedMonths.toLocaleString("fa-IR")} ماهه (${plan.durationDays.toLocaleString("fa-IR")} روز)`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-4xl font-black ${plan.isPopular ? "text-orange-500" : "text-slate-800"}`}
                      >
                        {Math.floor(Number(plan.price || 0)).toLocaleString(
                          "fa-IR",
                        )}
                      </span>
                      <span className="text-slate-400 font-bold whitespace-nowrap text-sm">
                        تومان / {selectedMonths.toLocaleString("fa-IR")} ماه
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 text-sm font-medium text-slate-600 leading-relaxed">
                    {plan.description || plan.subtitle}
                  </div>

                  {Array.isArray(plan.featuresList) &&
                    plan.featuresList.length > 0 && (
                      <ul className="space-y-2.5 mb-8">
                        {plan.featuresList.map((feat: string, fIdx: number) => (
                          <li
                            key={fIdx}
                            className="flex items-center gap-2.5 text-xs font-bold text-slate-600"
                          >
                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                  <button
                    type="button"
                    onClick={() => openPurchaseModal(plan)}
                    disabled={isProcessing}
                    className={`w-full mt-auto py-4 rounded-2xl font-black transition-all text-[15px] flex justify-center items-center gap-2 ${plan.isPopular ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25" : "bg-slate-900 hover:bg-orange-500 text-white shadow-md"}`}
                  >
                    {isActivePlan
                      ? `تمدید ${selectedMonths.toLocaleString("fa-IR")} ماهه`
                      : `انتخاب پلن ${plan.displayTitle}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مودال تایید خرید پلن از کیف پول */}
      {confirmPlanModal && (
        <div
          onClick={() => !isProcessing && setConfirmPlanModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
          >
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmPlanModal(null)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 p-2 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              تایید فعال‌سازی اشتراک
            </h3>
            <p className="text-xs font-bold text-slate-400 mb-6">
              هزینه پلن به صورت آنی از موجودی کیف پول شما کسر می‌شود.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100 mb-6">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500">پلن انتخابی:</span>
                <span className="text-slate-900 font-black">
                  {confirmPlanModal.displayTitle} —{" "}
                  {selectedMonths.toLocaleString("fa-IR")} ماهه (
                  {confirmPlanModal.durationDays.toLocaleString("fa-IR")} روز)
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-500">مبلغ پلن:</span>
                <span className="text-orange-600 font-black">
                  {Number(confirmPlanModal.price).toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200/70">
                <span className="text-slate-500">موجودی فعلی کیف پول:</span>
                <span
                  className={`font-black ${walletBalance >= confirmPlanModal.price ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {walletBalance.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>

            {purchaseError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold leading-relaxed">
                {purchaseError}
              </div>
            )}

            {walletBalance < confirmPlanModal.price ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold leading-relaxed">
                  موجودی حساب شما{" "}
                  <span className="font-black">
                    {(confirmPlanModal.price - walletBalance).toLocaleString(
                      "fa-IR",
                    )}{" "}
                    تومان
                  </span>{" "}
                  کمتر از مبلغ این پلن است. ابتدا کیف پول را شارژ کنید.
                </div>
                <Link
                  to="/wallet"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <Wallet size={18} /> رفتن به صفحه شارژ کیف پول
                </Link>
              </div>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPurchase}
                className="w-full bg-slate-900 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-xl"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CheckCircle2 size={18} /> تایید و پرداخت از کیف پول
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* مودال تاریخچه پرداخت‌ها */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-colors border border-slate-100"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100 shadow-sm">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  سابقه تراکنش‌ها
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  لیست تمام واریزها و خریدهای اشتراک شما
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {historyData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-bold border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                  تاکنون تراکنشی نداشته‌اید.
                </div>
              ) : (
                historyData.map((item) => {
                  const isOk =
                    item.status === "success" ||
                    item.isSuccess ||
                    item.is_successful;
                  const isPending = item.status === "pending";

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col gap-4 hover:border-orange-200 transition-colors"
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isOk
                                ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                                : isPending
                                  ? "bg-amber-50 text-amber-500 border-amber-100"
                                  : "bg-rose-50 text-rose-500 border-rose-100"
                            }`}
                          >
                            {isOk ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <AlertTriangle size={20} />
                            )}
                          </div>
                          <div>
                            <span className="font-black text-slate-800 text-sm block mb-1">
                              {item.description || "تراکنش کیف‌پول / اشتراک"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold block">
                              {item.dateFormatted}
                            </span>
                          </div>
                        </div>
                        <div className="text-left bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0">
                          <span className="block font-black text-slate-800 font-mono text-sm">
                            {Math.floor(
                              item.amount || item.Amount || 0,
                            ).toLocaleString("fa-IR")}{" "}
                            <span className="text-[10px] font-bold text-slate-400 font-sans">
                              تومان
                            </span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 block mt-1">
                            کد: {String(item.id).slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
