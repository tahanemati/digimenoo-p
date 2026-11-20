import React, { useState, useEffect, useRef } from "react";
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

export const Wallet = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [balance, setBalance] = useState<number>(0);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "6219861944703734",
    cardHolder: "زهرا محمدولی",
    bankName: "بانک سامان",
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const quickAmounts = [100000, 200000, 500000, 1000000];

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
    return clean.replace(/(\d{4})(?=\d)/g, "$1 - ");
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
      className="min-h-screen bg-[#F5F5F7] font-sans pb-24 relative overflow-x-hidden"
      dir="rtl"
    >
      {/* هاله‌های پس‌زمینه گرافیکی */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto p-4 md:p-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="w-12 h-12 bg-white/80 backdrop-blur-xl shadow-sm border border-white rounded-[20px] flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all active:scale-95 shrink-0"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-1">
              کیف پول و مالی
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-bold">
              مدیریت موجودی، شارژ کارت‌به‌کارت و تاریخچه تراکنش‌ها
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ستون راست: کارت کیف پول و فرم شارژ */}
          <div className="lg:col-span-5 space-y-6">
            {/* کارت موجودی کیف پول */}
            <div className="relative overflow-hidden rounded-[32px] p-8 shadow-2xl shadow-orange-500/20 bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start mb-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <WalletIcon
                    size={24}
                    className="text-white"
                    strokeWidth={2}
                  />
                </div>
                <span className="text-white/80 font-bold text-sm tracking-widest uppercase">
                  DigiMenoo Wallet
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-white/80 font-bold text-sm mb-1">
                  موجودی فعلی حساب شما
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
                    {balance.toLocaleString("fa-IR")}
                  </h2>
                  <span className="text-lg font-bold text-white/90">تومان</span>
                </div>
              </div>
            </div>

            {/* باکس شارژ کیف پول (۲ مرحله‌ای) */}
            <div className="bg-white/85 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CreditCard className="text-orange-500" size={20} />
                  {topUpStep === 1 ? "شارژ کیف پول" : "اطلاعات واریز و رسید"}
                </h3>
                <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  مرحله {topUpStep} از ۲
                </span>
              </div>

              {submitSuccessMsg && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-bold leading-relaxed flex items-start gap-2.5">
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
                <div className="animate-in fade-in duration-300">
                  {/* مبالغ آماده */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
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
                          className={`rounded-[16px] py-3 text-sm font-black transition-all active:scale-95 border ${
                            isSelected
                              ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                              : "bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border-slate-100 hover:border-orange-200"
                          }`}
                        >
                          {amt.toLocaleString("fa-IR")}{" "}
                          <span
                            className={`text-[10px] font-bold ${isSelected ? "text-white/80" : "opacity-60"}`}
                          >
                            تومان
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ورودی مبلغ دلخواه */}
                  <div className="relative mb-6">
                    <input
                      type="tel"
                      placeholder="مبلغ دلخواه (حداقل ۱۰,۰۰۰)..."
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
                      className="w-full bg-white border border-slate-200 rounded-[20px] py-4 pl-16 pr-5 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 font-mono font-black text-[16px] text-slate-800 shadow-sm transition-all text-left dir-ltr placeholder:font-sans placeholder:text-right placeholder:text-sm"
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      تومان
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={numericAmount < 10000}
                    onClick={handleGoToCardStep}
                    className="w-full bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-[20px] font-black flex justify-center items-center gap-2 transition-all shadow-xl shadow-slate-900/15 active:scale-95"
                  >
                    <span>ادامه و دریافت شماره کارت</span>
                    <ArrowLeft size={18} />
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* کارت مقصد برای واریز */}
                  <div className="bg-slate-900 text-white rounded-[24px] p-5 relative overflow-hidden shadow-lg">
                    <div className="absolute -left-8 -top-8 w-28 h-28 bg-orange-500/25 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-3">
                      <span>شماره کارت مقصد</span>
                      <span className="text-orange-400">
                        {cardInfo.bankName}
                      </span>
                    </div>

                    <div
                      className="font-mono text-lg sm:text-xl font-black tracking-wider text-center py-2.5 px-3 bg-white/5 rounded-xl border border-white/10 mb-3 select-all"
                      dir="ltr"
                    >
                      {formatCardNumber(cardInfo.cardNumber)}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-xs font-bold text-slate-300">
                        به نام:{" "}
                        <span className="text-white font-black text-sm">
                          {cardInfo.cardHolder}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCard}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
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

                  {/* خلاصه مبلغ واریزی */}
                  <div className="flex items-center justify-between bg-orange-50/80 border border-orange-100 rounded-2xl px-4 py-3">
                    <span className="text-xs font-bold text-slate-600">
                      مبلغ قابل واریز:
                    </span>
                    <span className="text-base font-black text-orange-600">
                      {numericAmount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>

                  {/* باکس آپلود عکس رسید */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 mr-1">
                      آپلود تصویر رسید پرداخت
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
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => receiptInputRef.current?.click()}
                            className="bg-white text-slate-800 px-3.5 py-2 rounded-xl text-xs font-black"
                          >
                            تغییر عکس
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="bg-rose-500 text-white p-2 rounded-xl"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => receiptInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/70 hover:bg-orange-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-orange-500 mb-2.5">
                          <Upload size={20} />
                        </div>
                        <span className="text-xs font-black text-slate-700 mb-1">
                          انتخاب یا بارگذاری عکس رسید واریز
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          فرمت‌های تصویر (حداکثر ۱۰ مگابایت)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* دکمه‌های بازگشت و ارسال نهایی */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setFormError("");
                        setTopUpStep(1);
                      }}
                      className="w-12 h-13 shrink-0 rounded-[18px] bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    >
                      <ArrowRight size={18} />
                    </button>

                    <button
                      type="button"
                      disabled={!receiptFile || isSubmitting}
                      onClick={handleSubmitReceipt}
                      className="flex-1 bg-slate-900 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-[18px] font-black text-sm flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} /> ثبت و ارسال برای تایید
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ستون چپ: تاریخچه تراکنش‌ها */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <History className="text-slate-400" size={20} /> تاریخچه
                  تراکنش‌ها
                </h3>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History size={24} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-500">
                    هیچ تراکنشی ثبت نشده است.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const isDeposit = tx.type === "deposit";
                    const isSuccess = tx.status === "success";

                    return (
                      <div
                        key={tx.id}
                        className="bg-white border border-slate-100 p-4 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-200 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                              isDeposit
                                ? "bg-emerald-50 text-emerald-500"
                                : "bg-rose-50 text-rose-500"
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownLeft size={20} />
                            ) : (
                              <ArrowUpRight size={20} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-[14px] mb-1">
                              {tx.description ||
                                (isDeposit
                                  ? "شارژ کیف پول"
                                  : "خرید اشتراک / خدمات")}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
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
                                  className="text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md"
                                >
                                  <Eye size={12} /> مشاهده رسید
                                </button>
                              )}
                            </div>

                            {tx.status === "failed" && tx.adminNote && (
                              <p className="text-[11px] font-bold text-rose-500 mt-1.5">
                                علت رد: {tx.adminNote}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t border-slate-50 sm:border-0 pt-3 sm:pt-0">
                          <span
                            className={`font-black text-[15px] flex items-center gap-1 ${
                              isDeposit ? "text-emerald-600" : "text-rose-600"
                            }`}
                            dir="ltr"
                          >
                            {isDeposit ? "+" : "-"}
                            {Number(tx.amount || 0).toLocaleString(
                              "fa-IR",
                            )}{" "}
                            <span className="text-[10px] text-slate-400 ml-1">
                              تومان
                            </span>
                          </span>

                          {/* وضعیت تراکنش */}
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-max ${
                              isSuccess
                                ? "bg-emerald-50 text-emerald-600"
                                : tx.status === "pending"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {isSuccess ? (
                              <>
                                <CheckCircle2 size={12} /> تایید شده
                              </>
                            ) : tx.status === "pending" ? (
                              <>
                                <Clock size={12} /> در انتظار تایید ادمین
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
      </div>

      {/* مودال نمایش تصویر رسید */}
      {previewReceiptUrl && (
        <div
          onClick={() => setPreviewReceiptUrl(null)}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[28px] p-4 max-w-md w-full relative shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewReceiptUrl(null)}
              className="absolute top-3 left-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h4 className="font-black text-slate-800 text-sm mb-3 px-2 pt-1">
              تصویر رسید ارسالی
            </h4>
            <img
              src={previewReceiptUrl}
              alt="رسید واریزی"
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-slate-50"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
