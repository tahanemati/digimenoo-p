import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Wallet as WalletIcon,
  CreditCard,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Receipt,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { walletApi } from "../service/api";

type Transaction = {
  id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payment";
  status: "success" | "pending" | "failed";
  createdAt: string;
  description: string;
  adminNote?: string;
  receiptUrl?: string;
};

type TxFilter = "all" | "deposit" | "payment" | "pending";

const toEnglishDigits = (str: string) => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str
    .split("")
    .map((c) => {
      let idx = persianNumbers.indexOf(c);
      if (idx >= 0) return idx;
      idx = arabicNumbers.indexOf(c);
      if (idx >= 0) return idx;
      return c;
    })
    .join("");
};

// نشان هندسی اختصاصی برند ترنج
const ToranjLogoMark: React.FC<{ className?: string }> = ({
  className = "w-8 h-8",
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="12" fill="url(#toranj_wallet_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_wallet_grad"
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

export const Wallet: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [balance, setBalance] = useState<number>(0);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "6219861944703734",
    cardHolder: "زهرا محمدولی",
    bankName: "بانک سامان",
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [customAmount, setCustomAmount] = useState<string>("");

  // مراحل شارژ: ۱ = انتخاب مبلغ | ۲ = نمایش شماره کارت و آپلود رسید
  const [topUpStep, setTopUpStep] = useState<1 | 2>(1);
  const [copiedCard, setCopiedCard] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  // فایل رسید
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // پیش‌نمایش رسید در تاریخچه تراکنش‌ها
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
    null,
  );

  const quickAmounts = [250000, 500000, 1000000, 2000000];

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatCardNumber = (num: string) => {
    const clean = num.replace(/\D/g, "");
    return clean.replace(/(\d{4})(?=\d)/g, "$1  -  ");
  };

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [balanceRes, transRes] = await Promise.all([
          walletApi.getBalance().catch(() => ({ data: { balance: 0 } })),
          walletApi.getTransactions().catch(() => ({ data: [] })),
        ]);

        const bPayload =
          balanceRes?.data?.data || balanceRes?.data || balanceRes;
        setBalance(Number(bPayload?.balance ?? 0));

        if (bPayload?.cardNumber) {
          setCardInfo({
            cardNumber: bPayload.cardNumber,
            cardHolder: bPayload.cardHolder || "زهرا محمدولی",
            bankName: bPayload.bankName || "بانک سامان",
          });
        }

        const transList =
          transRes?.data?.items ?? transRes?.data ?? transRes ?? [];
        if (Array.isArray(transList)) {
          setTransactions(transList);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات مالی", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  // خلاصه آماری تراکنش‌ها
  const walletStats = useMemo(() => {
    let pendingAmount = 0;
    let pendingCount = 0;
    let totalDeposited = 0;
    let totalSpent = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "deposit" && tx.status === "pending") {
        pendingAmount += amt;
        pendingCount += 1;
      } else if (tx.type === "deposit" && tx.status === "success") {
        totalDeposited += amt;
      } else if (tx.type === "payment" && tx.status === "success") {
        totalSpent += amt;
      }
    });

    return { pendingAmount, pendingCount, totalDeposited, totalSpent };
  }, [transactions]);

  // فیلتر تراکنش‌ها
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txFilter === "all") return true;
      if (txFilter === "pending") return tx.status === "pending";
      return tx.type === txFilter;
    });
  }, [transactions, txFilter]);

  const numericAmount =
    parseInt(toEnglishDigits(customAmount).replace(/[^0-9]/g, ""), 10) || 0;

  const handleGoToCardStep = () => {
    setFormError("");
    setSubmitSuccessMsg("");
    if (numericAmount < 10000) {
      setFormError("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.");
      return;
    }
    setTopUpStep(2);
  };

  const handleCopyCard = async () => {
    try {
      await navigator.clipboard.writeText(cardInfo.cardNumber);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = cardInfo.cardNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2500);
    }
  };

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormError("");
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
    }
  };

  const handleSubmitReceipt = async () => {
    setFormError("");
    if (numericAmount < 10000) {
      setFormError("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.");
      return;
    }
    if (!receiptFile) {
      setFormError("لطفاً ابتدا تصویر رسید واریزی را انتخاب کنید.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await walletApi.topUp(numericAmount, receiptFile);
      const createdTx = res?.data?.data || res?.data || res;

      if (createdTx && createdTx.id) {
        setTransactions((prev) => [createdTx, ...prev]);
      }

      setSubmitSuccessMsg(
        res?.message ||
          "رسید واریزی ثبت شد و پس از تایید ادمین به موجودی شما اضافه می‌شود.",
      );
      setCustomAmount("");
      handleRemoveReceipt();
      setTopUpStep(1);
    } catch (error: any) {
      setFormError(
        error?.message ||
          error?.response?.data?.message ||
          "خطا در ثبت رسید واریزی. لطفاً مجدداً تلاش کنید.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPersianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "تاریخ نامشخص";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] font-sans pb-28 lg:pb-14 relative overflow-x-hidden text-slate-800"
      dir="rtl"
    >
      {/* هاله‌های نوری ملایم */}
      <div className="absolute top-[-8%] right-[-5%] w-[520px] h-[520px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-8%] w-[480px] h-[480px] bg-amber-300/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 md:p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ================= هدر صفحه ================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
                  کیف پول ترنج
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[11px] font-black">
                  <ShieldCheck size={13} /> حساب اختصاصی
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-bold mt-0.5">
                مدیریت اعتبار حساب، شارژ کارت‌به‌کارت و سوابق مالی
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200/80 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 self-start sm:self-auto"
          >
            <Sparkles size={16} className="text-orange-500" />
            <span>مشاهده پلن‌های اشتراک</span>
            <ArrowLeft size={15} />
          </Link>
        </header>

        {/* ================= ردیف اول: کارت نئوبانکی ترنج + ۲ کارت خلاصه وضعیت ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
          {/* کارت اصلی کیف پول (۷ ستون) */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-[34px] p-7 sm:p-9 bg-gradient-to-br from-[#161518] via-[#1E1B18] to-[#0C0A09] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] border border-white/10 flex flex-col justify-between min-h-[235px]">
            {/* بافت نقطه‌ای و هاله‌های کهربایی */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#fb923c 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/25 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-24 right-10 w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* ردیف بالای کارت */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ToranjLogoMark className="w-10 h-10 shadow-lg shadow-orange-500/25" />
                <div>
                  <span className="font-black text-lg text-white tracking-tight block leading-none">
                    کیف پول <span className="text-orange-400">ترنج</span>
                  </span>
                  <span
                    className="text-[11px] font-mono text-zinc-400 font-bold"
                    dir="ltr"
                  >
                    toranjmenu.ir
                  </span>
                </div>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/10 text-[11px] font-black text-orange-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                اعتبار فعال
              </span>
            </div>

            {/* موجودی و دکمه اقدام */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5 mt-8 pt-6 border-t border-white/10">
              <div>
                <p className="text-zinc-400 font-bold text-xs mb-1.5">
                  موجودی قابل استفاده
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {balance.toLocaleString("fa-IR")}
                  </h2>
                  <span className="text-base font-bold text-orange-400">
                    تومان
                  </span>
                </div>
              </div>

              <Link
                to="/subscription"
                className="bg-gradient-to-l from-orange-500 to-amber-500 hover:brightness-110 text-zinc-950 px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95 shrink-0"
              >
                <WalletIcon size={17} strokeWidth={2.5} />
                <span>خرید / تمدید اشتراک</span>
              </Link>
            </div>
          </div>

          {/* ستون کناری کارت‌های آماری (۵ ستون) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* کارت رسیدهای در انتظار تایید */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-black text-slate-400">
                    در انتظار تایید مدیریت
                  </span>
                  {walletStats.pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                      {walletStats.pendingCount.toLocaleString("fa-IR")} رسید
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {walletStats.pendingAmount.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    تومان
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  مبالغ واریزی در صف بررسی رسید
                </p>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
            </div>

            {/* کارت مجموع شارژ و پرداخت‌ها */}
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[28px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-black text-slate-400 mb-1.5">
                  مجموع شارژهای تاییدشده
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-600">
                    {walletStats.totalDeposited.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    تومان
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  هزینه اشتراک‌ها:{" "}
                  <strong className="text-slate-600">
                    {walletStats.totalSpent.toLocaleString("fa-IR")} تومان
                  </strong>
                </p>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Receipt size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= ردیف دوم: استودیو شارژ کیف پول + دفتر تراکنش‌ها ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ستون راست: باکس شارژ کیف پول (۵ ستون) */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
            {/* هدر و نوار پیشرفت ۲ مرحله‌ای */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center">
                  <Plus size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    افزایش موجودی کیف پول
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    {topUpStep === 1
                      ? "مبلغ مورد نظر برای شارژ را انتخاب کنید"
                      : "واریز کارت‌به‌کارت و بارگذاری تصویر رسید"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[11px] font-black text-slate-600">
                <span className="text-orange-600">
                  {topUpStep.toLocaleString("fa-IR")}
                </span>
                <span>/</span>
                <span>۲</span>
              </div>
            </div>

            {submitSuccessMsg && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>{submitSuccessMsg}</span>
              </div>
            )}

            {formError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {topUpStep === 1 ? (
              <div className="animate-in fade-in duration-300 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2.5">
                    انتخاب سریع مبلغ (تومان):
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {quickAmounts.map((amt) => {
                      const isSelected = numericAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setFormError("");
                            setSubmitSuccessMsg("");
                            setCustomAmount(amt.toString());
                          }}
                          className={`rounded-2xl py-3.5 px-3 text-sm font-black transition-all active:scale-95 border flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-slate-900 text-orange-400 border-slate-900 shadow-md"
                              : "bg-slate-50/80 hover:bg-orange-50/70 text-slate-700 hover:text-orange-600 border-slate-200/70 hover:border-orange-200"
                          }`}
                        >
                          <span>{amt.toLocaleString("fa-IR")}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              isSelected ? "text-zinc-400" : "text-slate-400"
                            }`}
                          >
                            تومان
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-500">
                      یا وارد کردن مبلغ دلخواه:
                    </label>
                    {numericAmount >= 10000 && (
                      <span className="text-[11px] font-black text-orange-600">
                        {numericAmount.toLocaleString("fa-IR")} تومان
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="مثلاً: 500,000"
                      value={
                        numericAmount > 0
                          ? numericAmount.toLocaleString("en-US")
                          : ""
                      }
                      onChange={(e) => {
                        setFormError("");
                        setSubmitSuccessMsg("");
                        const digits = toEnglishDigits(e.target.value).replace(
                          /[^0-9]/g,
                          "",
                        );
                        setCustomAmount(digits);
                      }}
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 rounded-2xl py-4 pl-16 pr-5 outline-none font-mono font-black text-lg text-slate-900 transition-all text-left dir-ltr placeholder:font-sans placeholder:text-right placeholder:text-sm"
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      تومان
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={numericAmount < 10000}
                  onClick={handleGoToCardStep}
                  className="w-full bg-gradient-to-l from-orange-600 to-orange-500 hover:brightness-110 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:shadow-none active:scale-95"
                >
                  <span>مرحله بعد و دریافت شماره کارت</span>
                  <ArrowLeft size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* کارت بانکی سه‌بعدی مقصد */}
                <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-stone-900 text-white rounded-[26px] p-5 relative overflow-hidden shadow-xl border border-white/10">
                  <div className="absolute -left-10 -top-10 w-36 h-36 bg-orange-500/25 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between text-xs font-bold mb-4">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-orange-400" />
                      کارت مقصد ترنج
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 font-black text-[11px]">
                      {cardInfo.bankName}
                    </span>
                  </div>

                  <div
                    className="font-mono text-base sm:text-lg font-black tracking-wider text-center py-3 px-3 bg-white/[0.06] rounded-2xl border border-white/10 mb-4 select-all"
                    dir="ltr"
                  >
                    {formatCardNumber(cardInfo.cardNumber)}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-zinc-400">
                      صاحب حساب:{" "}
                      <span className="text-white font-black text-sm">
                        {cardInfo.cardHolder}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCard}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                        copiedCard
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 hover:bg-white/20 text-orange-300"
                      }`}
                    >
                      {copiedCard ? (
                        <>
                          <Check size={14} /> کپی شد
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> کپی شماره کارت
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* مبلغ قابل واریز */}
                <div className="flex items-center justify-between bg-orange-50/90 border border-orange-200/70 rounded-2xl px-4 py-3.5">
                  <span className="text-xs font-black text-slate-600">
                    مبلغ قابل واریز:
                  </span>
                  <span className="text-base font-black text-orange-600">
                    {numericAmount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {/* آپلود تصویر رسید */}
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">
                    تصویر رسید واریز بانکی
                  </label>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptSelect}
                    className="hidden"
                  />

                  {receiptPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-44 group">
                      <img
                        src={receiptPreview}
                        alt="پیش‌نمایش رسید"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => receiptInputRef.current?.click()}
                          className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black"
                        >
                          تغییر تصویر
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="bg-rose-500 text-white p-2.5 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => receiptInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/80 hover:bg-orange-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-orange-500 mb-2.5">
                        <Upload size={22} />
                      </div>
                      <span className="text-xs font-black text-slate-700 mb-1">
                        بارگذاری عکس رسید پرداخت
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        فرمت‌های JPG / PNG (حداکثر ۱۰ مگابایت)
                      </span>
                    </div>
                  )}
                </div>

                {/* دکمه‌های بازگشت و تایید نهایی */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setFormError("");
                      setTopUpStep(1);
                    }}
                    title="بازگشت به انتخاب مبلغ"
                    className="w-12 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    disabled={!receiptFile || isSubmitting}
                    onClick={handleSubmitReceipt}
                    className="flex-1 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>ثبت نهایی و ارسال رسید</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ستون چپ: دفترچه تراکنش‌ها با فیلتر (۷ ستون) */}
          <div className="lg:col-span-7 bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <History size={21} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    تاریخچه تراکنش‌ها
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    {transactions.length.toLocaleString("fa-IR")} تراکنش ثبت‌شده
                    در حساب
                  </p>
                </div>
              </div>

              {/* تب‌های فیلتر تراکنش */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto hide-scrollbar">
                {[
                  { id: "all" as TxFilter, label: "همه" },
                  { id: "deposit" as TxFilter, label: "واریزها" },
                  { id: "payment" as TxFilter, label: "خرید اشتراک" },
                  { id: "pending" as TxFilter, label: "در انتظار تایید" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTxFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      txFilter === tab.id
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/60 rounded-[24px] border border-dashed border-slate-200">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-2xs border border-slate-100 flex items-center justify-center mx-auto mb-3">
                  <History size={24} className="text-slate-300" />
                </div>
                <p className="font-black text-slate-600 text-sm mb-1">
                  تراکنشی در این بخش یافت نشد
                </p>
                <p className="text-xs font-bold text-slate-400">
                  سوابق شارژ کیف پول و خرید اشتراک‌های شما در این قسمت نمایش
                  داده می‌شوند.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1 hide-scrollbar">
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type === "deposit";
                  const isSuccess = tx.status === "success";

                  return (
                    <div
                      key={tx.id}
                      className="bg-white border border-slate-100 hover:border-orange-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isDeposit
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-orange-50 text-orange-600 border border-orange-100"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft size={20} />
                          ) : (
                            <ArrowUpRight size={20} />
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 text-sm mb-1">
                            {tx.description ||
                              (isDeposit
                                ? "شارژ کیف پول ترنج"
                                : "خرید پلن اشتراک")}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />{" "}
                              {formatPersianDate(tx.createdAt)}
                            </span>

                            {tx.receiptUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewReceiptUrl(
                                    getFullImageUrl(tx.receiptUrl!),
                                  )
                                }
                                className="text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100 transition-colors"
                              >
                                <Eye size={12} /> مشاهده رسید
                              </button>
                            )}
                          </div>

                          {tx.status === "failed" && tx.adminNote && (
                            <p className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg mt-2 inline-block">
                              علت رد: {tx.adminNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t border-slate-50 sm:border-0 pt-3 sm:pt-0">
                        <span
                          className={`font-black text-base flex items-center gap-1 ${
                            isDeposit ? "text-emerald-600" : "text-slate-900"
                          }`}
                          dir="ltr"
                        >
                          {isDeposit ? "+" : "-"}
                          {Number(tx.amount || 0).toLocaleString("fa-IR")}{" "}
                          <span className="text-[10px] text-slate-400 font-bold">
                            تومان
                          </span>
                        </span>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : tx.status === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle2 size={12} /> تایید شده
                            </>
                          ) : tx.status === "pending" ? (
                            <>
                              <Clock size={12} /> در انتظار تایید
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> رد شده
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال نمایش تصویر رسید */}
      {previewReceiptUrl && (
        <div
          onClick={() => setPreviewReceiptUrl(null)}
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[30px] p-5 max-w-md w-full relative shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute top-4 left-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h4 className="font-black text-slate-900 text-sm mb-3 px-1 pt-0.5">
              تصویر رسید واریزی
            </h4>
            <img
              src={previewReceiptUrl}
              alt="رسید واریزی"
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-slate-50 border border-slate-100"
            />
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

export default Wallet;
