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
import { subscriptionApi } from "../service/api";

type DurationType = "3" | "6" | "12";

export const Subscription = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const [duration, setDuration] = useState<DurationType>("3");

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // =======================
  // اتصال زنده به دیتابیس جنگو
  // =======================
  const fetchInitialData = async () => {
    try {
      const data = await subscriptionApi.getData();

      const expDate = new Date(data.subscription.expire_date);
      data.subscription.expireDateFormatted = new Intl.DateTimeFormat("fa-IR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(expDate);

      const formattedHistory = data.history.map((item: any) => ({
        ...item,
        dateFormatted: new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.date)),
      }));

      setPlans(data.plans);
      setCurrentPlan(data.subscription);
      setHistoryData(formattedHistory);
    } catch (err) {
      console.error("خطا در دریافت اطلاعات اشتراک", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRenew = async (planCode: string) => {
    setIsProcessing(true);
    try {
      await subscriptionApi.purchase(planCode, duration);
      alert("خرید با موفقیت انجام شد! پلن شما ارتقاء/تمدید یافت.");
      await fetchInitialData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      alert(err.error || "خطا در انجام عملیات خرید.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openHistoryModal = () => {
    setShowHistory(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!currentPlan) return null;

  const isExpired = currentPlan.days_left <= 0;
  const progressPercentage =
    ((currentPlan.total_days - currentPlan.days_left) /
      currentPlan.total_days) *
    100;

  // 🔴 محاسبه اعتبار (دقیقاً کل مبلغ پلن فعلی، بدون کسر روزانه)
  let userCredit = 0;
  const activePlanCode = (
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

      // کسر کل مبلغی که برای پلن فعلی پرداخت شده
      userCredit = currentBasePlan.prices[activeDuration] || 0;
    }
  }

  const periodLabel = { "3": "۳ ماهه", "6": "۶ ماهه", "12": "یکساله" }[
    duration
  ];

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-sans text-slate-800"
      dir="rtl"
    >
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto pb-12">
        <header className="mb-10 relative z-10">
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
        </header>

        <div
          className={`bg-white/80 backdrop-blur-xl border rounded-[32px] p-6 md:p-8 mb-12 relative overflow-hidden transition-all shadow-[0_10px_40px_rgb(0,0,0,0.03)] ${
            isExpired
              ? "border-rose-200"
              : currentPlan.is_trial_mode
                ? "border-amber-200"
                : "border-emerald-200"
          }`}
        >
          <div
            className={`absolute -top-24 -left-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${
              isExpired
                ? "bg-rose-400/20"
                : currentPlan.is_trial_mode
                  ? "bg-amber-400/20"
                  : "bg-emerald-400/20"
            }`}
          ></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {isExpired ? (
                  <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <Lock size={14} /> مسدود / پایان یافته
                  </span>
                ) : currentPlan.is_trial_mode ? (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <Gift size={14} /> ۷ روز آزمایشی فعال
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    اشتراک ویژه فعال
                  </span>
                )}

                <h2 className="text-2xl font-black text-slate-800">
                  {currentPlan.name || "بدون پلن"}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6 font-medium">
                <CalendarDays size={18} className="text-slate-400" /> تاریخ
                پایان:{" "}
                <span
                  className={`font-black ${isExpired ? "text-rose-500" : "text-slate-800"}`}
                >
                  {currentPlan.expireDateFormatted}
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
                        : currentPlan.is_trial_mode
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                  >
                    {isExpired
                      ? "۰ روز"
                      : `${currentPlan.days_left} روز باقیمانده`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isExpired
                        ? "bg-rose-500"
                        : currentPlan.is_trial_mode
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 w-full lg:w-auto">
              <button
                onClick={() =>
                  document
                    .getElementById("plans-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className={`w-full lg:w-auto px-8 py-4 rounded-2xl font-black transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg ${
                  isExpired
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                    : currentPlan.is_trial_mode
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
                }`}
              >
                {isExpired
                  ? "خرید پلن و فعالسازی مجدد"
                  : currentPlan.is_trial_mode
                    ? "خرید و ارتقاء به نسخه دائمی"
                    : "ارتقاء یا تمدید پلن"}{" "}
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={openHistoryModal}
                className="w-full lg:w-auto bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Receipt size={18} /> سابقه پرداخت‌ها
              </button>
            </div>
          </div>
        </div>

        <div
          id="plans-section"
          className="mb-8 text-center scroll-mt-8 relative z-10"
        >
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {currentPlan.is_trial_mode
              ? "نسخه حرفه‌ای را به طور قطعی خریداری کنید"
              : "ارتقاء به نسخه‌های حرفه‌ای‌تر"}
          </h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">
            {userCredit > 0
              ? "شما روی این پلن اعتبار پرداخت شده دارید. در صورت ارتقاء به پلن بالاتر، مبلغ پرداختی قبلی شما کاملاً از فاکتور جدید کسر می‌شود."
              : currentPlan.is_trial_mode && !isExpired
                ? "شما در حال استفاده از ۷ روز نسخه آزمایشی هستید. با خرید قطعی، پلن شما بدون قطعی ادامه می‌یابد."
                : isExpired
                  ? "دوره شما به پایان رسیده است. برای بازگشت منو به حالت آنلاین، یکی از پلن‌های زیر را انتخاب کنید."
                  : "پلن مناسب برای رشد کسب‌وکار خود را انتخاب کنید."}
          </p>

          <div className="flex justify-center mb-10">
            <div className="bg-white p-1.5 rounded-2xl flex items-center border border-slate-200 shadow-sm flex-wrap justify-center gap-1">
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
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="text-center text-slate-400 py-10 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
            هیچ پلنی از سمت مدیریت سایت (جنگو) تعریف نشده است!
          </div>
        ) : (
          /* 🔴 گرید ۲ ستونه برای نمایش بی‌نقص ۲ پلن (استاندارد و پلاس) */
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-6 lg:gap-8 items-start relative z-10">
            {plans.map((plan) => {
              const IconComponent =
                (Icons as any)[plan.icon] || Icons.HelpCircle;

              const isCurrentPlanType = activePlanCode.includes(
                plan.id.toLowerCase(),
              );
              const fullPrice = plan.prices[duration] || 0;

              // ارتقا فقط در صورتی است که پلن متفاوت باشد و قیمت پلن جدید از اعتبار کاربر بیشتر باشد
              const isUpgrade =
                !isCurrentPlanType &&
                !isExpired &&
                !currentPlan.is_trial_mode &&
                userCredit > 0 &&
                fullPrice > userCredit;

              const finalPrice = isUpgrade
                ? Math.max(0, fullPrice - userCredit)
                : fullPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white border-2 rounded-[32px] p-8 transition-all duration-300 group shadow-sm hover:shadow-xl ${
                    plan.isPopular
                      ? "border-orange-500 shadow-orange-500/10 lg:-translate-y-4"
                      : "border-slate-100 hover:border-orange-200"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-md shadow-orange-500/20">
                      پیشنهاد ویژه
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
                        {plan.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        {isCurrentPlanType && !currentPlan.is_trial_mode
                          ? "پلن فعال شما"
                          : "مناسب برای کافه‌ها و رستوران‌ها"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    {isUpgrade && (
                      <div className="text-sm text-slate-400 line-through mb-1 font-mono">
                        {Math.floor(fullPrice).toLocaleString("fa-IR")} تومان
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-4xl font-black ${plan.isPopular ? "text-orange-500" : "text-slate-800"}`}
                      >
                        {Math.floor(finalPrice).toLocaleString("fa-IR")}
                      </span>
                      <span className="text-slate-400 font-bold whitespace-nowrap text-sm">
                        تومان / {periodLabel}
                      </span>
                    </div>

                    {/* 🔴 نمایش کسر دقیق کل مبلغ پرداختی قبلی */}
                    {isUpgrade && (
                      <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                        <TrendingUp size={14} /> کسر کامل{" "}
                        {Math.floor(userCredit).toLocaleString("fa-IR")} تومان
                        بابت پلن فعلی
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-10 min-h-[200px]">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className={`shrink-0 mt-0.5 ${plan.isPopular ? "text-orange-500" : "text-slate-400"}`}
                        />
                        <span className="text-sm font-medium text-slate-600 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleRenew(plan.id)}
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-2xl font-black transition-all text-[15px] flex justify-center items-center gap-2 ${
                      plan.isPopular
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : isCurrentPlanType && !currentPlan.is_trial_mode ? (
                      "تمدید و افزودن زمان"
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
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
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
                  سابقه پرداخت‌ها
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  لیست تمام فاکتورهای خرید شما
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {historyData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-bold border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
                  تاکنون پرداختی نداشته‌اید.
                </div>
              ) : (
                historyData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col gap-4 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {item.is_successful ? (
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                          </div>
                        )}
                        <div>
                          <span className="font-black text-slate-800 text-sm block mb-1">
                            {item.plan_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold block">
                            {item.dateFormatted}
                          </span>
                        </div>
                      </div>
                      <div className="text-left bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span className="block font-black text-slate-800 font-mono text-sm">
                          {item.amount.toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px] font-bold text-slate-400 font-sans">
                            تومان
                          </span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block mt-1">
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
