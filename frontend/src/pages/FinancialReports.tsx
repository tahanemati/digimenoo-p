import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Printer,
  RefreshCw,
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Award,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Calendar,
  Loader2,
  Receipt,
  CreditCard,
  Wallet,
  Sparkles,
} from "lucide-react";
import { financialApi } from "../service/api";

type PeriodType = "daily" | "monthly" | "yearly" | "custom";
type SortByType = "quantity_desc" | "revenue_desc" | "quantity_asc";

type ProductReportItem = {
  id: string;
  name: string;
  categoryName: string;
  unitPrice: number;
  quantitySold: number;
  totalRevenue: number;
  ordersCount: number;
  revenueShare: number;
  quantityShare: number;
};

type ChartPoint = {
  label: string;
  sales: number;
  orders: number;
};

type TransactionItem = {
  id: string;
  orderNumber: number;
  tableNumber: number;
  customerName: string;
  totalPrice: number;
  paymentMethod: "online" | "cashier";
  paymentStatus: "paid" | "pending";
  status: string;
  jalaliDate: string;
  time: string;
  itemsSummary: string;
};

type FinancialReportData = {
  restaurantName: string;
  period: PeriodType;
  periodLabel: string;
  generatedAt: string;
  summary: {
    totalSales: number;
    paidSales: number;
    unpaidSales: number;
    onlineSales: number;
    cashierSales: number;
    totalOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
  };
  chartData: ChartPoint[];
  products: ProductReportItem[];
  transactions: TransactionItem[];
};

export const FinancialReports = () => {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [report, setReport] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortByType>("quantity_desc");
  const [txFilter, setTxFilter] = useState<"all" | "paid" | "pending">("all");
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  const fetchReport = useCallback(
    async (showSpin = false) => {
      if (period === "custom" && (!startDate || !endDate)) return;
      if (showSpin) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await financialApi.getReport({
          period,
          startDate,
          endDate,
        });
        const data = res?.data?.data || res?.data || res;
        if (data && data.summary) {
          setReport(data);
        }
      } catch (err) {
        console.error("خطا در دریافت گزارش مالی:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [period, startDate, endDate],
  );

  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
    }
  }, [period, fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const summary = report?.summary || {
    totalSales: 0,
    paidSales: 0,
    unpaidSales: 0,
    onlineSales: 0,
    cashierSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
  };

  const sortedProducts = [...(report?.products || [])]
    .filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
        p.categoryName
          .toLowerCase()
          .includes(productSearch.toLowerCase().trim()),
    )
    .sort((a, b) => {
      if (sortBy === "revenue_desc") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "quantity_asc") return a.quantitySold - b.quantitySold;
      return b.quantitySold - a.quantitySold;
    });

  const topThreeProducts = (report?.products || []).slice(0, 3);

  const filteredTransactions = (report?.transactions || []).filter((tx) => {
    if (txFilter === "paid") return tx.paymentStatus === "paid";
    if (txFilter === "pending") return tx.paymentStatus !== "paid";
    return true;
  });

  const chartPoints = report?.chartData || [];
  const maxChartSales = Math.max(...chartPoints.map((c) => c.sales), 1);

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-slate-800 font-sans pb-28 lg:pb-12 print-container"
      dir="rtl"
    >
      {/* استایل اختصاصی چاپ (A4 رسمی بدون سایدبار و المان‌های اضافه) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          aside, nav, .no-print {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            border-radius: 14px !important;
            break-inside: avoid;
          }
          .print-table-wrap {
            overflow: visible !important;
          }
          .print-only {
            display: block !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto px-4 py-6 md:p-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* سربرگ رسمی مخصوص نسخه چاپی */}
        <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                گزارش رسمی مالی و فروش — {report?.restaurantName || "مجموعه"}
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-1">
                دوره گزارش: {report?.periodLabel}
              </p>
            </div>
            <div className="text-left text-xs font-bold text-slate-600 space-y-1">
              <p>تاریخ و ساعت صدور: {report?.generatedAt}</p>
              <p>سیستم مدیریت هوشمند دیجی‌منو</p>
            </div>
          </div>
        </div>

        {/* هدر صفحه (نمایش در وب) */}
        <header className="no-print flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                <BarChart3 size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-[22px] md:text-3xl font-black text-slate-900 tracking-tight">
                گزارشات جامع مالی و فروش
              </h1>
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-bold flex items-center gap-2">
              <Calendar size={15} className="text-orange-500" />
              <span>{report?.periodLabel || "در حال بارگذاری..."}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* انتخابگر بازه زمانی */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1">
              {(
                [
                  { id: "daily", label: "روزانه (امروز)" },
                  { id: "monthly", label: "ماهانه" },
                  { id: "yearly", label: "سالانه" },
                  { id: "custom", label: "بازه دلخواه" },
                ] as { id: PeriodType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriod(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    period === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fetchReport(true)}
              title="بروزرسانی آمار"
              className="w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center text-slate-600 shadow-2xs transition-all active:scale-95"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? "animate-spin text-orange-500" : ""}
              />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <Printer size={18} strokeWidth={2.5} />
              <span>چاپ گزارش / PDF</span>
            </button>
          </div>
        </header>

        {/* انتخابگر بازه دلخواه */}
        {period === "custom" && (
          <div className="no-print bg-white p-4 md:p-5 rounded-[24px] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-end gap-4 animate-in fade-in">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-black text-slate-600 mb-1.5">
                از تاریخ (میلادی):
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-black text-slate-600 mb-1.5">
                تا تاریخ (میلادی):
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="button"
              disabled={!startDate || !endDate}
              onClick={() => fetchReport(true)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all"
            >
              اعمال فیلتر تاریخ
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <Loader2 size={42} className="text-orange-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">
              در حال پردازش و تجمیع تراکنش‌های مالی...
            </p>
          </div>
        ) : (
          <>
            {/* ۴ کارت شاخص کلیدی مالی (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="print-card bg-white p-5 md:p-6 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 block mb-1">
                      مجموع فروش دوره
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl md:text-3xl font-black text-slate-900">
                        {summary.totalSales.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        تومان
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <DollarSign size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-600">
                    تسویه‌شده: {summary.paidSales.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-amber-600">
                    مانده: {summary.unpaidSales.toLocaleString("fa-IR")}
                  </span>
                </div>
              </div>

              <div className="print-card bg-white p-5 md:p-6 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 block mb-1">
                      تعداد کل سفارشات
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl md:text-3xl font-black text-slate-900">
                        {summary.totalOrders.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        فاکتور
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <ShoppingBag size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>میانگین هر سفارش:</span>
                  <span className="text-slate-800 font-black">
                    {summary.averageOrderValue.toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              </div>

              <div className="print-card bg-white p-5 md:p-6 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 block mb-1">
                      تعداد اقلام فروخته‌شده
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl md:text-3xl font-black text-slate-900">
                        {summary.totalItemsSold.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        عدد / پرس
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>تنوع محصولات فروخته‌شده:</span>
                  <span className="text-slate-800 font-black">
                    {(report?.products?.length || 0).toLocaleString("fa-IR")}{" "}
                    محصول
                  </span>
                </div>
              </div>

              <div className="print-card bg-white p-5 md:p-6 rounded-[28px] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-black text-slate-400 block mb-1">
                      تفکیک روش پرداخت
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl md:text-3xl font-black text-slate-900">
                        {summary.paidSales.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        وصولی
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Wallet size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} /> آنلاین:{" "}
                    {summary.onlineSales.toLocaleString("fa-IR")}
                  </span>
                  <span>
                    صندوق: {summary.cashierSales.toLocaleString("fa-IR")}
                  </span>
                </div>
              </div>
            </div>

            {/* پرفروش‌ترین محصولات (Top 3 Best Sellers) */}
            {topThreeProducts.length > 0 && (
              <section className="print-card bg-white rounded-[32px] p-6 md:p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                      <Award size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900">
                        پرفروش‌ترین محصولات این دوره
                      </h2>
                      <p className="text-xs font-bold text-slate-400">
                        محبوب‌ترین آیتم‌های منو بر اساس تعداد سفارش مشتریان
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-full text-xs font-black">
                    <Sparkles size={14} /> رتبه‌بندی برتر
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                  {topThreeProducts.map((prod, idx) => {
                    const rankStyles = [
                      {
                        badge: "رتبه ۱ (پرفروش‌ترین)",
                        ring: "border-amber-300 bg-amber-50/40",
                        pill: "bg-amber-500 text-white",
                      },
                      {
                        badge: "رتبه ۲",
                        ring: "border-slate-200 bg-slate-50/60",
                        pill: "bg-slate-800 text-white",
                      },
                      {
                        badge: "رتبه ۳",
                        ring: "border-orange-200 bg-orange-50/40",
                        pill: "bg-orange-500 text-white",
                      },
                    ][idx];

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-[24px] p-5 border-2 ${rankStyles.ring} flex flex-col justify-between gap-4`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span
                              className={`text-[11px] font-black px-3 py-1 rounded-full ${rankStyles.pill}`}
                            >
                              {rankStyles.badge}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              {prod.categoryName}
                            </span>
                          </div>
                          <h3 className="text-base md:text-lg font-black text-slate-900 mb-1">
                            {prod.name}
                          </h3>
                          <p className="text-xs font-bold text-slate-500">
                            سهم از کل فروش:{" "}
                            <span className="text-slate-900 font-black">
                              {prod.revenueShare.toLocaleString("fa-IR")}٪
                            </span>
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.05] flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400">
                              تعداد فروش
                            </span>
                            <span className="text-base font-black text-slate-900">
                              {prod.quantitySold.toLocaleString("fa-IR")} عدد
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="block text-[10px] font-bold text-slate-400">
                              درآمد حاصل
                            </span>
                            <span className="text-base font-black text-emerald-600">
                              {prod.totalRevenue.toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px]">تومان</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* نمودار روند فروش دوره */}
            {chartPoints.length > 0 && (
              <section className="no-print bg-white rounded-[32px] p-6 md:p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900">
                        نمودار روند فروش ({report?.periodLabel})
                      </h2>
                      <p className="text-xs font-bold text-slate-400">
                        نشانگر را روی هر ستون ببرید تا مبلغ و تعداد سفارش را
                        ببینید
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[640px] h-64 flex items-end gap-2 pt-10 px-2 border-b border-slate-100 relative">
                    {chartPoints.map((pt, idx) => {
                      const heightPercent =
                        pt.sales > 0
                          ? Math.max(
                              8,
                              Math.round((pt.sales / maxChartSales) * 100),
                            )
                          : 3;
                      const isHovered = hoveredBarIdx === idx;

                      return (
                        <div
                          key={pt.label}
                          onMouseEnter={() => setHoveredBarIdx(idx)}
                          onMouseLeave={() => setHoveredBarIdx(null)}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          {isHovered && (
                            <div className="absolute -top-2 z-20 bg-slate-900 text-white px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap shadow-xl pointer-events-none">
                              <div className="font-black text-orange-400">
                                {pt.sales.toLocaleString("fa-IR")} تومان
                              </div>
                              <div className="text-slate-300">
                                {pt.orders.toLocaleString("fa-IR")} سفارش
                              </div>
                            </div>
                          )}

                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                              pt.sales > 0
                                ? isHovered
                                  ? "bg-orange-500 scale-x-110"
                                  : "bg-slate-800/85 hover:bg-orange-500"
                                : "bg-slate-100"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="min-w-[640px] flex items-center gap-2 pt-2 px-2">
                    {chartPoints.map((pt) => (
                      <div
                        key={pt.label}
                        className="flex-1 text-center text-[10px] font-bold text-slate-400 truncate"
                      >
                        {pt.label}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* جدول جامع فروش به تفکیک هر محصول */}
            <section className="print-card bg-white rounded-[32px] p-6 md:p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900">
                    آمار فروش به تفکیک هر محصول
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    تعداد فروش، درآمد کل و درصد سهم هر محصول در این بازه زمانی
                  </p>
                </div>

                <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="جستجوی محصول..."
                      className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-9 pl-3 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <ArrowUpDown size={14} className="text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortByType)}
                      className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="quantity_desc">بیشترین تعداد فروش</option>
                      <option value="revenue_desc">
                        بیشترین درآمد (تومان)
                      </option>
                      <option value="quantity_asc">کمترین فروش</option>
                    </select>
                  </div>
                </div>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-sm">
                  در این بازه زمانی فروشی برای محصولات ثبت نشده است.
                </div>
              ) : (
                <div className="print-table-wrap overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[11px] font-black text-slate-400">
                        <th className="py-3.5 px-3">رتبه</th>
                        <th className="py-3.5 px-3">نام محصول</th>
                        <th className="py-3.5 px-3">دسته‌بندی</th>
                        <th className="py-3.5 px-3">قیمت واحد</th>
                        <th className="py-3.5 px-3">تعداد فروخته‌شده</th>
                        <th className="py-3.5 px-3">مجموع فروش</th>
                        <th className="py-3.5 px-3">سهم از فروش</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {sortedProducts.map((prod, idx) => (
                        <tr
                          key={prod.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-700"
                                  : idx === 1
                                    ? "bg-slate-200 text-slate-700"
                                    : idx === 2
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {(idx + 1).toLocaleString("fa-IR")}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-black text-slate-900">
                            {prod.name}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            {prod.categoryName}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {prod.unitPrice.toLocaleString("fa-IR")} تومان
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-black">
                              {prod.quantitySold.toLocaleString("fa-IR")} عدد
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-black text-emerald-600">
                            {prod.totalRevenue.toLocaleString("fa-IR")} تومان
                          </td>
                          <td className="py-3.5 px-3 min-w-[130px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{
                                    width: `${Math.min(100, prod.revenueShare)}%`,
                                  }}
                                  className="h-full bg-orange-500 rounded-full"
                                />
                              </div>
                              <span className="text-[11px] font-black text-slate-700 w-10 text-left">
                                {prod.revenueShare.toLocaleString("fa-IR")}٪
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50/70 font-black text-xs text-slate-900">
                        <td colSpan={4} className="py-3.5 px-3">
                          جمع کل فروش محصولات
                        </td>
                        <td className="py-3.5 px-3 text-blue-700">
                          {summary.totalItemsSold.toLocaleString("fa-IR")} عدد
                        </td>
                        <td className="py-3.5 px-3 text-emerald-700">
                          {summary.totalSales.toLocaleString("fa-IR")} تومان
                        </td>
                        <td className="py-3.5 px-3">۱۰۰٪</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            {/* جدول ریز فاکتورها و تراکنش‌های دوره */}
            <section className="print-card bg-white rounded-[32px] p-6 md:p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Receipt size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900">
                      ریز فاکتورها و تراکنش‌ها
                    </h2>
                    <p className="text-xs font-bold text-slate-400">
                      لیست سفارشات ثبت‌شده به همراه وضعیت تسویه
                    </p>
                  </div>
                </div>

                <div className="no-print flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {(
                    [
                      { id: "all", label: "همه فاکتورها" },
                      { id: "paid", label: "تسویه‌شده" },
                      { id: "pending", label: "در انتظار تسویه" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTxFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        txFilter === f.id
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  تراکنشی در این فیلتر یافت نشد.
                </div>
              ) : (
                <div className="print-table-wrap overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 text-[11px] font-black text-slate-400">
                        <th className="py-3 px-3">شماره فیش</th>
                        <th className="py-3 px-3">میز</th>
                        <th className="py-3 px-3">تاریخ و ساعت</th>
                        <th className="py-3 px-3">اقلام سفارش</th>
                        <th className="py-3 px-3">وضعیت تسویه</th>
                        <th className="py-3 px-3">مبلغ کل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-black text-slate-800">
                            #{tx.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            میز {tx.tableNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono">
                            {tx.jalaliDate} | {tx.time}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                            {tx.itemsSummary}
                          </td>
                          <td className="py-3 px-3">
                            {tx.paymentStatus === "paid" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] font-black">
                                <CheckCircle2 size={13} /> تسویه‌شده
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-[11px] font-black">
                                <Clock size={13} /> در انتظار تسویه
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900">
                            {tx.totalPrice.toLocaleString("fa-IR")} تومان
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* کادر امضا و تاییدیه انتهای برگه چاپ */}
            <div className="print-only pt-8 mt-8 border-t border-slate-300">
              <div className="grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-700 pt-4">
                <div>
                  <p className="mb-12">تنظیم‌کننده (صندوق‌دار)</p>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1">
                    امضا و تاریخ
                  </div>
                </div>
                <div>
                  <p className="mb-12">تایید حسابداری</p>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1">
                    امضا و تاریخ
                  </div>
                </div>
                <div>
                  <p className="mb-12">مهر و امضای مدیریت مجموعه</p>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1">
                    مهر و امضا
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
