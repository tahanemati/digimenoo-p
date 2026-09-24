import { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  ShieldCheck,
  History,
  Info,
  Plus,
  Loader2,
  ArrowDownLeft,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

// تبدیل اعداد فارسی به انگلیسی برای محاسبات
const parsePersianCurrency = (val: string) => {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "۹"];
  let res = "";
  for (let i = 0; i < val.length; i++) {
    let char = val[i];
    let p = persian.indexOf(char);
    let a = arabic.indexOf(char);
    if (p !== -1) res += p;
    else if (a !== -1) res += a;
    else res += char;
  }
  const cleanNumber = res.replace(/\D/g, "");
  return parseInt(cleanNumber, 10);
};

export const Wallet = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "deposit" | null;
  }>({ isOpen: false, type: null });

  const [amountInput, setAmountInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalStep, setModalStep] = useState<"input" | "success">("input");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // =======================
  // داده‌های نمایشی (Mock Data) برای تست رابط کاربری
  // =======================
  const fetchWallet = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockData = {
        balance: 1450000,
        stats: {
          total_tx: 12,
          total_deposits: 4500000,
        },
        transactions: [
          {
            id: 1,
            type: "deposit",
            type_display: "افزایش اعتبار",
            amount: 500000,
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            tracking_code: "TRK-58293",
          },
          {
            id: 2,
            type: "deposit",
            type_display: "افزایش اعتبار",
            amount: 1500000,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            tracking_code: "TRK-11204",
          },
          {
            id: 3,
            type: "deposit",
            type_display: "تلاش برای شارژ کیف پول",
            amount: 800000,
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            status: "failed",
            tracking_code: "TRK-00000",
          },
        ],
      };

      mockData.transactions = mockData.transactions.map((tx: any) => ({
        ...tx,
        dateFormatted: new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(tx.date)),
      }));

      setWalletData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const openModal = () => {
    setModalConfig({ isOpen: true, type: "deposit" });
    setAmountInput("");
    setModalError("");
    setModalStep("input");
  };

  const closeModal = () => {
    if (isProcessing) return;
    setModalConfig({ isOpen: false, type: null });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setAmountInput("");
      setModalError("");
      return;
    }
    const numericValue = parsePersianCurrency(val);
    if (!isNaN(numericValue))
      setAmountInput(numericValue.toLocaleString("fa-IR"));
    else setAmountInput("");
    setModalError("");
  };

  const submitTransaction = () => {
    const amount = parsePersianCurrency(amountInput);

    if (isNaN(amount) || amount <= 0)
      return setModalError("لطفاً مبلغ معتبری وارد کنید.");

    setIsProcessing(true);
    setModalError("");

    // شبیه‌سازی درخواست به سرور
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage("کیف پول شما با موفقیت شارژ شد.");
      setModalStep("success");

      // شبیه‌سازی آپدیت موجودی و تراکنش‌ها بعد از ۳ ثانیه بسته شدن مودال
      setTimeout(() => {
        closeModal();
        fetchWallet();
      }, 3000);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-sans text-slate-800"
      dir="rtl"
    >
      {/* افکت‌های نوری پس‌زمینه (متناسب با تم لایت) */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* کانتینر اصلی */}
      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto pb-12">
        <header className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white text-orange-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <WalletIcon size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              کیف پول مالی
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            مشاهده موجودی حساب و شارژ کیف پول برای پرداخت‌های درون سیستمی.
          </p>
        </header>

        {/* کارت اصلی کیف پول (نارنجی و شیشه‌ای) */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 border border-orange-400 rounded-[32px] p-6 md:p-10 relative overflow-hidden mb-8 shadow-[0_15px_40px_rgba(249,115,22,0.2)]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  کیف پول فعال
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck size={14} /> پرداخت امن
                </span>
              </div>

              <div className="text-orange-50 text-sm mb-2 font-bold">
                موجودی فعلی کیف پول
              </div>
              <div className="flex items-baseline gap-2 mb-1 text-white">
                <span className="text-5xl font-black tracking-tight">
                  {walletData.balance.toLocaleString("fa-IR")}
                </span>
                <span className="font-bold opacity-90">تومان</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <button
                onClick={openModal}
                className="bg-white text-orange-600 px-10 py-4 rounded-2xl font-black transition-all shadow-[0_10px_25px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Plus size={20} strokeWidth={3} /> افزایش موجودی
              </button>
            </div>
          </div>
        </div>

        {/* آمار خلاصه - ۳ ستونه شد */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-200 transition-colors shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-2">
              تعداد پرداخت‌ها
            </div>
            <div className="text-2xl font-black text-slate-800 mb-1">
              {walletData.stats.total_tx.toLocaleString("fa-IR")}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-200 transition-colors shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-2">
              مجموع شارژ حساب
            </div>
            <div className="text-2xl font-black text-emerald-500 mb-1">
              {walletData.stats.total_deposits.toLocaleString("fa-IR")}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-200 transition-colors shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-2">
              آخرین تراکنش
            </div>
            <div className="text-sm font-black text-slate-800 mb-1 mt-2">
              {walletData.transactions.length > 0
                ? walletData.transactions[0].dateFormatted
                : "—"}
            </div>
          </div>
        </div>

        {/* لیست تراکنش‌ها و راهنما */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* لیست تراکنش‌ها */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-[28px] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-800 mb-1">
                  تاریخچه تراکنش‌ها
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  سوابق پرداختی‌ها و افزایش اعتبار شما.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full max-h-[500px]">
              {walletData.transactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 min-h-[300px]">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-400 shadow-sm">
                    <History size={32} />
                  </div>
                  <h3 className="text-slate-800 font-black mb-2">
                    هنوز تراکنشی ثبت نشده است
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-[250px] font-medium">
                    پس از شارژ کیف پول، سوابق شما در این بخش نمایش داده می‌شود.
                  </p>
                </div>
              ) : (
                walletData.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl flex items-center justify-between hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-emerald-50 border-emerald-100">
                        <ArrowDownLeft size={20} className="text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-sm mb-1">
                          {tx.type_display}
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 font-mono">
                          {tx.dateFormatted} | کد: {tx.tracking_code}
                        </div>
                      </div>
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <div className="font-black text-slate-800 font-mono text-[15px]">
                        +{tx.amount.toLocaleString("fa-IR")}{" "}
                        <span className="text-[10px] font-bold font-sans text-slate-400">
                          تومان
                        </span>
                      </div>

                      {tx.status === "pending" ? (
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Clock size={10} /> در حال بررسی
                        </span>
                      ) : tx.status === "processing" ? (
                        <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 mt-1 bg-blue-50 px-2 py-0.5 rounded-md">
                          <RefreshCcw size={10} className="animate-spin" /> در
                          حال واریز
                        </span>
                      ) : tx.status === "completed" ? (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={10} /> موفق
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 mt-1 bg-rose-50 px-2 py-0.5 rounded-md">
                          ناموفق
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* بخش راهنما */}
          <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-6 h-fit shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 text-blue-500 p-1.5 rounded-lg">
                <Info size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-800">راهنما</h2>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
              شما می‌توانید از موجودی کیف پول خود برای تمدید سریع پلن‌ها یا خرید
              پیامک استفاده کنید.
            </p>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-700 mb-4">
                مزایای شارژ کیف پول
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    پرداخت و تمدید سرویس‌ها با یک کلیک بدون نیاز به ورود مجدد به
                    درگاه بانکی.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    امکان استفاده از کدهای تخفیف و جشنواره‌های ویژه مختص کیف
                    پول.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* =======================
          مودال افزایش موجودی (تم لایت)
      ======================= */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {modalStep === "input" ? (
              <>
                <button
                  onClick={closeModal}
                  disabled={isProcessing}
                  className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-colors disabled:opacity-50 border border-slate-100"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6 pr-2 mt-2">
                  <div className="w-12 h-12 rounded-[18px] flex items-center justify-center border shadow-sm bg-emerald-50 border-emerald-100 text-emerald-500">
                    <Plus size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">
                      افزایش موجودی کیف
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                      مبلغ مورد نظر (تومان)
                    </label>
                    <input
                      type="text"
                      value={amountInput}
                      onChange={handleAmountChange}
                      placeholder="مثال: ۵۰,۰۰۰"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-4 px-5 font-black text-lg focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>

                  {modalError && (
                    <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in slide-in-from-top-2">
                      <AlertTriangle size={18} />
                      <span>{modalError}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={submitTransaction}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[15px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "انتقال به درگاه پرداخت"
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 animate-in zoom-in">
                <div className="w-24 h-24 bg-emerald-100 border-4 border-white rounded-[24px] flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2
                    size={48}
                    strokeWidth={3}
                    className="text-emerald-500"
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  عملیات موفقیت‌آمیز
                </h3>
                <p className="text-slate-500 font-bold leading-relaxed max-w-[250px]">
                  {successMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
