import { useState, useEffect } from "react";
import {
  Wallet as WalletIcon,
  ShieldCheck,
  ArrowUpRight,
  History,
  Info,
  Plus,
  Loader2,
  ArrowDownLeft,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw, // آیکون جدید برای در حال واریز
} from "lucide-react";
import { financeApi } from "../service/api";

const parsePersianCurrency = (val: string) => {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
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
    type: "deposit" | "withdraw" | null;
  }>({ isOpen: false, type: null });
  const [amountInput, setAmountInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalStep, setModalStep] = useState<"input" | "success">("input");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [shabaNumber, setShabaNumber] = useState("");

  const fetchWallet = async () => {
    try {
      const data = await financeApi.getWalletInfo();
      data.transactions = data.transactions.map((tx: any) => ({
        ...tx,
        dateFormatted: new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(tx.date)),
      }));
      setWalletData(data);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات کیف پول", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const openModal = (type: "deposit" | "withdraw") => {
    setModalConfig({ isOpen: true, type });
    setAmountInput("");
    setAccountName("");
    setCardNumber("");
    setShabaNumber("");
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

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join("-") || val;
    setCardNumber(formatted);
    setModalError("");
  };

  const handleShabaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 24) val = val.slice(0, 24);
    setShabaNumber(val);
    setModalError("");
  };

  const submitTransaction = async () => {
    const amount = parsePersianCurrency(amountInput);

    if (isNaN(amount) || amount <= 0)
      return setModalError("لطفاً مبلغ معتبری وارد کنید.");

    let extraData = {};

    if (modalConfig.type === "withdraw") {
      if (amount < 10000)
        return setModalError("حداقل مبلغ برداشت ۱۰,۰۰۰ تومان است.");
      if (!accountName.trim())
        return setModalError("لطفاً نام صاحب حساب را وارد کنید.");

      const cleanCard = cardNumber.replace(/-/g, "");
      if (cleanCard.length !== 16)
        return setModalError("شماره کارت باید ۱۶ رقم باشد.");
      if (shabaNumber.length !== 24)
        return setModalError("شماره شبا باید ۲۴ رقم باشد.");

      extraData = {
        account_name: accountName,
        card_number: cleanCard,
        shaba_number: `IR${shabaNumber}`,
      };
    }

    setIsProcessing(true);
    setModalError("");

    try {
      const res = await financeApi.walletAction(
        modalConfig.type!,
        amount,
        extraData,
      );
      setSuccessMessage(res.message);
      setModalStep("success");
      await fetchWallet();
      setTimeout(() => closeModal(), 3000);
    } catch (err: any) {
      setModalError(err.error || "خطایی رخ داد. مجدداً تلاش کنید.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  const txIcon = (type: string) => {
    if (type === "deposit")
      return <ArrowDownLeft size={16} className="text-emerald-400" />;
    if (type === "withdrawal")
      return <ArrowUpRight size={16} className="text-rose-400" />;
    return <Info size={16} className="text-blue-400" />;
  };

  const txColor = (type: string) => {
    if (type === "deposit") return "bg-emerald-500/10 border-emerald-500/20";
    if (type === "withdrawal") return "bg-rose-500/10 border-rose-500/20";
    return "bg-blue-500/10 border-blue-500/20";
  };

  // محاسبه مبلغ برای نمایش در زمان درخواست برداشت
  const numericAmount = parsePersianCurrency(amountInput);
  const taxAmount = isNaN(numericAmount) ? 0 : Math.floor(numericAmount * 0.1);
  const netAmount = isNaN(numericAmount) ? 0 : numericAmount - taxAmount;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-10 relative">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <WalletIcon size={22} />
          </div>
          <h1 className="text-2xl font-black text-white">کیف پول میزینو</h1>
        </div>
        <p className="text-slate-500 text-sm">
          مدیریت موجودی، افزایش اعتبار و درخواست برداشت برای پنل رستوران/کافه
          شما.
        </p>
      </header>

      <div className="bg-gradient-to-br from-emerald-900/30 via-[#030712] to-[#030712] border border-emerald-500/20 rounded-[32px] p-6 md:p-10 relative overflow-hidden mb-8 shadow-[0_10px_40px_rgba(16,185,129,0.05)]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>{" "}
                وضعیت: فعال
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <ShieldCheck size={14} /> تسویه امن
              </span>
            </div>

            <div className="text-slate-400 text-sm mb-2 font-medium">
              موجودی قابل استفاده
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-black text-white">
                {walletData.balance.toLocaleString("fa-IR")}
              </span>
              <span className="text-slate-400 font-bold">تومان</span>
            </div>
            <div className="text-xs text-slate-500">
              حداقل برداشت: ۱۰,۰۰۰ تومان
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={() => openModal("withdraw")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpRight size={20} className="text-rose-400" /> ثبت درخواست
              برداشت
            </button>
            <button
              onClick={() => openModal("deposit")}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 flex items-center justify-center gap-2"
            >
              <Plus size={20} /> افزایش موجودی
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <div className="text-xs text-slate-500 mb-2">تراکنش‌ها</div>
          <div className="text-2xl font-black text-white mb-1">
            {walletData.stats.total_tx.toLocaleString("fa-IR")}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <div className="text-xs text-slate-500 mb-2">مجموع واریزی‌ها</div>
          <div className="text-2xl font-black text-emerald-400 mb-1">
            {walletData.stats.total_deposits.toLocaleString("fa-IR")}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <div className="text-xs text-slate-500 mb-2">مجموع برداشت‌ها</div>
          <div className="text-2xl font-black text-rose-400 mb-1">
            {walletData.stats.total_withdrawals.toLocaleString("fa-IR")}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <div className="text-xs text-slate-500 mb-2">آخرین تراکنش</div>
          <div className="text-sm font-black text-slate-300 mb-1 mt-2">
            {walletData.transactions.length > 0
              ? walletData.transactions[0].dateFormatted
              : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-[28px] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                تراکنش‌های کیف پول
              </h2>
              <p className="text-xs text-slate-500">
                سوابق واریز/برداشت و تغییرات موجودی شما.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full max-h-[500px]">
            {walletData.transactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01] min-h-[300px]">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <History size={32} />
                </div>
                <h3 className="text-white font-bold mb-2">
                  هنوز تراکنشی ثبت نشده است
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
                  پس از افزایش موجودی یا برداشت، سوابق شما در این بخش نمایش داده
                  می‌شود.
                </p>
              </div>
            ) : (
              walletData.transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${txColor(tx.type)}`}
                    >
                      {txIcon(tx.type)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm mb-1">
                        {tx.type_display}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {tx.dateFormatted} | کد: {tx.tracking_code}
                      </div>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <div className="font-black text-white font-mono text-sm">
                      {tx.type === "deposit" ? "+" : "-"}
                      {tx.amount.toLocaleString("fa-IR")}{" "}
                      <span className="text-[10px] font-sans text-slate-500">
                        تومان
                      </span>
                    </div>
                    {/* 🔴 نمایش وضعیت‌های جدید (در حال واریز) */}
                    {tx.status === "pending" ? (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1">
                        <Clock size={10} /> در حال بررسی
                      </span>
                    ) : tx.status === "processing" ? (
                      <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 mt-1">
                        <RefreshCcw size={10} className="animate-spin" /> در حال
                        واریز
                      </span>
                    ) : tx.status === "completed" ? (
                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
                        <CheckCircle2 size={10} /> موفق
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 mt-1">
                        ناموفق
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-[28px] p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Info className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white">وضعیت و راهنما</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            نکات مهم برداشت و مدیریت مالی پنل شما.
          </p>
          <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 mb-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4">
              خلاصه سریع
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">تعداد تراکنش‌ها</span>
                <span className="text-white font-mono">
                  {walletData.stats.total_tx.toLocaleString("fa-IR")}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/5">
                <span className="text-slate-500">حداقل برداشت</span>
                <span className="text-amber-400 font-bold">۱۰,۰۰۰ تومان</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-3">
                <span className="text-slate-500">مالیات بر برداشت</span>
                <span className="text-rose-400 font-bold">۱۰٪ کسر می‌شود</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4">
              راهنمای برداشت
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  شماره شبا و کارت باید به نام صاحب حساب ثبت‌شده باشد.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  زمان انجام برداشت معمولاً بین ۱ تا ۳ روز کاری است.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  هنگام تسویه‌حساب، **۱۰ درصد مالیات و کارمزد پلتفرم** از مبلغ
                  درخواستی کسر می‌گردد.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#030712] border border-white/10 rounded-[32px] p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {modalStep === "input" ? (
              <>
                <button
                  onClick={closeModal}
                  disabled={isProcessing}
                  className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6 pr-2 mt-2">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${modalConfig.type === "deposit" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}
                  >
                    {modalConfig.type === "deposit" ? (
                      <Plus size={24} />
                    ) : (
                      <ArrowUpRight size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {modalConfig.type === "deposit"
                        ? "افزایش موجودی"
                        : "درخواست برداشت"}
                    </h3>
                    {modalConfig.type === "withdraw" && (
                      <p className="text-xs text-slate-500 mt-1">
                        تکمیل اطلاعات حساب مقصد
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">
                      مبلغ مورد نظر (تومان)
                    </label>
                    <input
                      type="text"
                      value={amountInput}
                      onChange={handleAmountChange}
                      placeholder="مثال: ۵۰,۰۰۰"
                      className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-4 px-5 font-black text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* 🔴 نمایش محاسبات مالیات فقط برای برداشت */}
                  {modalConfig.type === "withdraw" && numericAmount > 0 && (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <div className="flex justify-between items-center text-xs px-2 text-slate-400">
                        <span>کسر ۱۰٪ مالیات و کارمزد پلتفرم:</span>
                        <span className="font-mono text-rose-400">
                          - {taxAmount.toLocaleString("fa-IR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm px-2 font-bold text-white bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl">
                        <span>مبلغ خالص واریزی به حساب شما:</span>
                        <span className="font-mono text-emerald-400">
                          {netAmount.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    </div>
                  )}

                  {modalConfig.type === "withdraw" && (
                    <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p>
                          دقت کنید: شماره شبا و کارت حتماً باید به نام صاحب حساب
                          ثبت‌شده در سایت باشد.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">
                          نام صاحب حساب
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="مثال: علی رضایی"
                          className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-3 px-5 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">
                          شماره کارت
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={cardNumber}
                          onChange={handleCardChange}
                          placeholder="1111-2222-3333-4444"
                          className="w-full bg-black/40 border border-white/10 text-white font-mono text-center rounded-2xl py-3 px-5 text-lg tracking-widest focus:outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">
                          شماره شبا
                        </label>
                        <div className="flex" dir="ltr">
                          <span className="bg-white/5 text-slate-400 px-4 py-3 rounded-l-2xl border-y border-l border-white/10 font-mono text-lg flex items-center justify-center font-bold">
                            IR
                          </span>
                          <input
                            type="text"
                            value={shabaNumber}
                            onChange={handleShabaChange}
                            placeholder="123456789012345678901234"
                            className="w-full bg-black/40 border border-white/10 border-l-0 text-white font-mono rounded-r-2xl py-3 px-3 text-sm tracking-widest focus:outline-none focus:border-rose-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {modalError && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 animate-in slide-in-from-top-2">
                      <AlertTriangle size={16} />
                      <span className="font-bold">{modalError}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={submitTransaction}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${modalConfig.type === "deposit" ? "bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"}`}
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : modalConfig.type === "deposit" ? (
                    "پرداخت و شارژ کیف پول"
                  ) : (
                    "ثبت درخواست تسویه"
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 animate-in zoom-in">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  عملیات موفق
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
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
