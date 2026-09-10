import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import {
  CreditCard,
  CheckCircle2,
  CalendarDays,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Receipt,
  X,
  Gift,
  TrendingUp,
  Lock,
} from "lucide-react";
import { financeApi } from "../service/api";

type DurationType = "3" | "6" | "12";

export const Subscription = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const [duration, setDuration] = useState<DurationType>("3");

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const plansData = await financeApi.getPlans();
      setPlans(plansData);

      const subData = await financeApi.getSubscription();

      const expDateString = subData.expire_date || subData.end_date;
      const expDate = expDateString ? new Date(expDateString) : new Date();
      const today = new Date();

      const diffTime = expDate.getTime() - today.getTime();
      const calculatedDaysLeft = Math.max(
        0,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
      );

      subData.expireDateFormatted = new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(expDate);

      subData.days_left = calculatedDaysLeft;

      // 🔴 بررسی اینکه آیا کاربر تو دوره آزمایشی ۷ روزه هست یا نه
      subData.is_trial_mode =
        subData.is_trial ||
        (subData.plan_name || subData.name || "").includes("آزمایشی");

      if (subData.is_trial_mode) {
        subData.total_days = 7; // کل روزهای دوره آزمایشی فقط ۷ روز است
      } else if (!subData.total_days) {
        // برای پلن‌های پولی که از بک‌اند روزهاشون نیومده
        if (calculatedDaysLeft > 180) subData.total_days = 365;
        else if (calculatedDaysLeft > 90) subData.total_days = 180;
        else if (calculatedDaysLeft > 30) subData.total_days = 90;
        else subData.total_days = 30;
      }

      setCurrentPlan(subData);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات مالی", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRenew = async (planId: string) => {
    setIsProcessing(true);
    try {
      const planCode = `${planId}_${duration}`;
      await financeApi.renewSubscription(planCode);
      await fetchInitialData();
      alert("خرید شما با موفقیت انجام شد و پلن شما ارتقاء/تمدید یافت!");
    } catch (err) {
      alert("خطا در ارتباط با درگاه پرداخت.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openHistoryModal = async () => {
    setShowHistory(true);
    setIsLoadingHistory(true);
    try {
      const data = await financeApi.getPaymentHistory();
      const formattedData = data.map((item: any) => ({
        ...item,
        dateFormatted: new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date)),
      }));
      setHistoryData(formattedData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in">
        <AlertTriangle size={64} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">
          اطلاعات اشتراک یافت نشد
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold mt-4 transition-all"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const isExpired = currentPlan.days_left <= 0;
  const progressPercentage =
    ((currentPlan.total_days - currentPlan.days_left) /
      currentPlan.total_days) *
    100;

  // 🔴 محاسبه هوشمند اعتبار فقط در صورتی که کاربر پولی پرداخت کرده باشه (آزمایشی نباشه)
  let userCredit = 0;
  const activePlanCode = (
    currentPlan.code ||
    currentPlan.plan_code ||
    currentPlan.name ||
    ""
  ).toLowerCase();

  if (!isExpired && !currentPlan.is_trial_mode) {
    const currentBasePlan = plans.find((p) =>
      activePlanCode.includes(p.id.toLowerCase()),
    );
    if (currentBasePlan) {
      let activeDuration = "3";
      if (activePlanCode.includes("6")) activeDuration = "6";
      if (activePlanCode.includes("12") || activePlanCode.includes("year"))
        activeDuration = "12";

      const paidPrice = currentBasePlan.prices[activeDuration] || 0;
      const totalPlanDays = parseInt(activeDuration) * 30;
      const dailyRate = paidPrice / totalPlanDays;

      // مبلغ قابل کسر = قیمت روزانه * روزهای باقیمانده
      userCredit = dailyRate * currentPlan.days_left;
    }
  }

  const periodLabel = { "3": "۳ ماهه", "6": "۶ ماهه", "12": "یکساله" }[
    duration
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 relative">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <CreditCard size={22} />
          </div>
          <h1 className="text-2xl font-black text-white">اشتراک و تمدید</h1>
        </div>
        <p className="text-slate-500 text-sm">
          مدیریت پکیج‌ها، ارتقاء حساب و مشاهده وضعیت اعتبار پنل
        </p>
      </header>

      {/* 🔴 بخش وضعیت اشتراک فعلی */}
      <div
        className={`bg-gradient-to-br from-black/40 to-black/40 border rounded-[32px] p-6 md:p-8 mb-12 relative overflow-hidden transition-all ${
          isExpired
            ? "border-rose-500/30"
            : currentPlan.is_trial_mode
              ? "border-amber-500/30"
              : "border-emerald-500/30"
        }`}
      >
        <div
          className={`absolute -top-24 -left-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${
            isExpired
              ? "bg-rose-500/10"
              : currentPlan.is_trial_mode
                ? "bg-amber-500/10"
                : "bg-emerald-500/10"
          }`}
        ></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              {isExpired ? (
                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <Lock size={12} />
                  مسدود / پایان یافته
                </span>
              ) : currentPlan.is_trial_mode ? (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <Gift size={12} />۷ روز آزمایشی فعال
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  اشتراک ویژه فعال
                </span>
              )}

              <h2 className="text-xl font-black text-white">
                {currentPlan.name || "پلن"}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
              <CalendarDays size={16} /> تاریخ پایان:{" "}
              <span
                className={`font-bold ${isExpired ? "text-rose-400" : "text-white"}`}
              >
                {currentPlan.expireDateFormatted}
              </span>
            </div>

            <div className="max-w-md">
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-slate-400">اعتبار مصرف شده</span>
                <span
                  className={
                    isExpired
                      ? "text-rose-400"
                      : currentPlan.is_trial_mode
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }
                >
                  {isExpired
                    ? "۰ روز"
                    : `${currentPlan.days_left} روز باقیمانده`}
                </span>
              </div>
              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full ${
                    isExpired
                      ? "bg-rose-500"
                      : currentPlan.is_trial_mode
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-3">
            <button
              onClick={openHistoryModal}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              سابقه پرداخت‌ها
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("plans-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className={`${
                isExpired
                  ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                  : "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              } px-8 py-4 rounded-2xl font-black transition-all hover:scale-105 flex items-center justify-center gap-2`}
            >
              {isExpired
                ? "خرید پلن و فعالسازی مجدد"
                : currentPlan.is_trial_mode
                  ? "ارتقاء به نسخه دائمی"
                  : "ارتقاء یا تمدید پلن"}{" "}
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      <div id="plans-section" className="mb-8 text-center scroll-mt-8">
        <h2 className="text-2xl font-black text-white mb-2">
          {currentPlan.is_trial_mode
            ? "نسخه حرفه‌ای را به طور قطعی خریداری کنید"
            : "ارتقاء به نسخه‌های حرفه‌ای‌تر"}
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          {userCredit > 0
            ? "شما روی این پلن اعتبار پرداخت شده دارید. در صورت ارتقاء، مبلغ روزهای باقیمانده به صورت خودکار از فاکتور جدید کسر می‌شود."
            : currentPlan.is_trial_mode && !isExpired
              ? "شما در حال استفاده از ۷ روز نسخه آزمایشی هستید. با خرید قطعی، پلن شما بدون قطعی ادامه می‌یابد."
              : isExpired
                ? "دوره شما به پایان رسیده است. برای بازگشت منو به حالت آنلاین، یکی از پلن‌های زیر را انتخاب کنید."
                : "پلن مناسب برای رشد کسب‌وکار خود را انتخاب کنید."}
        </p>

        {/* سوییچ انتخاب زمان */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 p-1.5 rounded-2xl flex items-center border border-white/10 flex-wrap justify-center gap-1">
            {[
              { id: "3", label: "۳ ماهه" },
              { id: "6", label: "۶ ماهه" },
              { id: "12", label: "یکساله" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDuration(d.id as DurationType)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  duration === d.id
                    ? "bg-emerald-500 text-gray-950 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* رندر کردن پلن‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start mt-4">
        {plans.map((plan) => {
          const IconComponent = (Icons as any)[plan.icon] || Icons.HelpCircle;

          const isCurrentPlanType = activePlanCode.includes(
            plan.id.toLowerCase(),
          );
          const fullPrice = plan.prices[duration] || 0;

          // 🔴 شرط آپگرید: کسر قیمت فقط اگر کاربر پولی داده باشد و در دوره پولی باشد
          const isUpgrade =
            !isCurrentPlanType &&
            !isExpired &&
            !currentPlan.is_trial_mode &&
            userCredit > 0;

          const finalPrice = isUpgrade
            ? Math.max(0, fullPrice - userCredit)
            : fullPrice;

          return (
            <div
              key={plan.id}
              className={`relative bg-[#030712] border rounded-[32px] p-8 transition-all duration-300 group ${plan.border} ${!plan.isPopular ? "hover:bg-white/[0.02]" : ""}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-gray-950 px-4 py-1.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  پیشنهاد ویژه
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.bgLight} ${plan.color}`}
                >
                  <IconComponent size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isCurrentPlanType && !currentPlan.is_trial_mode
                      ? "پلن فعلی شما"
                      : "مناسب برای کافه‌ها و رستوران‌ها"}
                  </p>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-white/5">
                {isUpgrade && (
                  <div className="text-sm text-slate-500 line-through mb-1 font-mono">
                    {Math.floor(fullPrice).toLocaleString("fa-IR")} تومان
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {Math.floor(finalPrice).toLocaleString("fa-IR")}
                  </span>
                  <span className="text-slate-500 font-medium whitespace-nowrap">
                    تومان / {periodLabel}
                  </span>
                </div>
                {isUpgrade && (
                  <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/20">
                    <TrendingUp size={14} />
                    کسر {Math.floor(userCredit).toLocaleString("fa-IR")} تومان
                    بابت پلن قبلی
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-10 min-h-[220px]">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className={`shrink-0 mt-0.5 ${plan.isPopular ? "text-emerald-400" : "text-slate-600"}`}
                    />
                    <span className="text-sm text-slate-300 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleRenew(plan.id)}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold transition-all text-sm flex justify-center items-center gap-2 ${
                  plan.isPopular
                    ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isCurrentPlanType && !currentPlan.is_trial_mode ? (
                  "تمدید و اضافه شدن زمان"
                ) : currentPlan.is_trial_mode ? (
                  `خرید قطعی پلن ${plan.name}`
                ) : (
                  `ارتقاء به ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* مودال سابقه پرداخت‌ها (بدون تغییر) */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#030712] border border-white/10 rounded-[32px] p-6 w-full max-w-xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 border border-white/10">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  سابقه پرداخت‌ها
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  لیست تمام فاکتورهای خرید شما
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-slate-500" size={32} />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-medium border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  تاکنون پرداختی نداشته‌اید.
                </div>
              ) : (
                historyData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {item.is_successful ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {item.plan_name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                            {item.dateFormatted}
                          </span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-emerald-400 font-mono text-sm">
                          {item.amount}{" "}
                          <span className="text-[10px] font-normal text-slate-500 font-sans">
                            تومان
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          کد: {item.tracking_code}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
