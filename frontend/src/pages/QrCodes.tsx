import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  Download,
  AlertCircle,
  Loader2,
  ChevronRight,
  Copy,
  Check,
  Search,
  ScanLine,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { venuesApi } from "../service/api";

type StandTheme = "light" | "dark" | "brand";

// نشان هندسی اختصاصی برند ترنج
const ToranjLogoMark: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="40" height="40" rx="12" fill="url(#toranj_qr_grad)" />
    <path
      d="M20 7L24.2 15.8L33 20L24.2 24.2L20 33L15.8 24.2L7 20L15.8 15.8L20 7Z"
      stroke="white"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="20" r="3.5" fill="white" />
    <defs>
      <linearGradient
        id="toranj_qr_grad"
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

export const QrCodes: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<{
    slug: string;
    tableCount: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");

  // تنظیمات ظاهری استند و فیلتر میزها
  const [standTheme, setStandTheme] = useState<StandTheme>("light");
  const [tableSearch, setTableSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const MENU_BASE_URL = window.location.origin;

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await venuesApi.getMyVenue();
        const data = response?.data?.data || response?.data || response;
        if (data && (data.slug || data.Slug || data.name || data.Name)) {
          const resolvedName = data.name || data.Name || "مجموعه من";
          setVenueData({
            slug: data.slug || data.Slug || "",
            tableCount: Number(
              data.tableCount ?? data.TableCount ?? data.table_count ?? 0,
            ),
            name: resolvedName,
          });
          document.title = `استند و بارکد میزها | ترنج (${resolvedName})`;
        } else {
          setError("اطلاعات مجموعه یافت نشد.");
        }
      } catch (err: any) {
        setError(err?.message || "خطا در دریافت اطلاعات مجموعه.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVenue();
  }, []);

  const handlePrint = () => {
    if (venueData?.name) {
      document.title = `استند بارکد میزهای ${venueData.name} | ترنج (toranjmenu.ir)`;
    }
    window.print();
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // تولید تصویر کارت استند باکیفیت PNG با برندینگ ترنج (toranjmenu.ir)
  const handleDownloadStandPng = (
    canvasId: string,
    titleLabel: string,
    fileName: string,
  ) => {
    const qrCanvas = document.getElementById(
      canvasId,
    ) as HTMLCanvasElement | null;
    if (!qrCanvas || !venueData) return;

    try {
      const exportCanvas = document.createElement("canvas");
      const W = 800;
      const H = 1080;
      exportCanvas.width = W;
      exportCanvas.height = H;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      const isDark = standTheme === "dark";
      const isBrand = standTheme === "brand";

      drawRoundRect(0, 0, W, H, 56);
      ctx.fillStyle = isDark ? "#111114" : isBrand ? "#FFF7ED" : "#FFFFFF";
      ctx.fill();

      ctx.lineWidth = 6;
      ctx.strokeStyle = isDark ? "#27272A" : isBrand ? "#FDBA74" : "#E2E8F0";
      ctx.stroke();

      ctx.save();
      drawRoundRect(0, 0, W, H, 56);
      ctx.clip();
      const topGrad = ctx.createLinearGradient(0, 0, W, 0);
      topGrad.addColorStop(0, "#EA580C");
      topGrad.addColorStop(1, "#F59E0B");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 22);
      ctx.restore();

      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "#FFFFFF" : "#0F172A";
      ctx.font = "900 42px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText(venueData.name, W / 2, 115);

      const pillW = 300;
      const pillH = 64;
      const pillX = (W - pillW) / 2;
      const pillY = 148;
      drawRoundRect(pillX, pillY, pillW, pillH, 32);
      ctx.fillStyle = isDark ? "#F97316" : "#FFF7ED";
      ctx.fill();
      if (!isDark) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FDBA74";
        ctx.stroke();
      }
      ctx.fillStyle = isDark ? "#09090B" : "#EA580C";
      ctx.font = "900 30px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText(titleLabel, W / 2, pillY + 43);

      const boxSize = 510;
      const boxX = (W - boxSize) / 2;
      const boxY = 255;
      drawRoundRect(boxX, boxY, boxSize, boxSize, 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = isDark ? "#3F3F46" : "#E2E8F0";
      ctx.stroke();

      const qrPad = 36;
      ctx.drawImage(
        qrCanvas,
        boxX + qrPad,
        boxY + qrPad,
        boxSize - qrPad * 2,
        boxSize - qrPad * 2,
      );

      ctx.fillStyle = isDark ? "#E4E4E7" : "#334155";
      ctx.font = "800 28px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText("دوربین گوشی را مقابل بارکد بگیرید", W / 2, 835);

      ctx.fillStyle = isDark ? "#A1A1AA" : "#64748B";
      ctx.font = "600 22px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText("مشاهده منوی دیجیتال و ثبت سفارش آنلاین", W / 2, 878);

      ctx.beginPath();
      ctx.moveTo(90, 930);
      ctx.lineTo(W - 90, 930);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? "#27272A" : "#E2E8F0";
      ctx.stroke();

      ctx.fillStyle = "#F97316";
      ctx.font = "900 26px Vazirmatn, Tahoma, sans-serif";
      ctx.fillText("ترنج  |  toranjmenu.ir", W / 2, 995);

      const pngUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      const fallbackUrl = qrCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = fallbackUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const allTables = useMemo(() => {
    if (!venueData) return [];
    return Array.from({ length: venueData.tableCount }, (_, i) => i + 1);
  }, [venueData]);

  const filteredTables = useMemo(() => {
    const q = tableSearch.trim();
    if (!q) return allTables;
    return allTables.filter((num) => String(num).includes(q));
  }, [allTables, tableSearch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !venueData) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans p-6"
        dir="rtl"
      >
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <p className="font-bold text-slate-600 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-block bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  const { slug, tableCount, name } = venueData;
  const generalMenuUrl = `${MENU_BASE_URL}/${slug}`;

  const getCardClasses = () => {
    if (standTheme === "dark") {
      return {
        wrapper:
          "bg-[#121215] text-white border-zinc-800 shadow-[0_14px_40px_rgba(0,0,0,0.18)]",
        topStripe: "from-amber-400 via-orange-500 to-amber-500",
        venueText: "text-white",
        badge:
          "bg-gradient-to-l from-orange-500 to-amber-500 text-zinc-950 border-transparent",
        qrBox: "bg-white border-zinc-700",
        cornerColor: "border-orange-400",
        scanTitle: "text-zinc-200",
        scanSub: "text-zinc-400",
        divider: "border-zinc-800",
        brandText: "text-orange-400",
      };
    }
    if (standTheme === "brand") {
      return {
        wrapper:
          "bg-gradient-to-b from-[#FFF7ED] to-white text-slate-900 border-orange-200 shadow-[0_14px_35px_rgba(234,88,12,0.08)]",
        topStripe: "from-orange-600 via-orange-500 to-amber-400",
        venueText: "text-slate-900",
        badge: "bg-orange-500 text-white border-orange-600/20",
        qrBox: "bg-white border-orange-200",
        cornerColor: "border-orange-500",
        scanTitle: "text-slate-800",
        scanSub: "text-orange-700/80",
        divider: "border-orange-200/70",
        brandText: "text-orange-600",
      };
    }
    return {
      wrapper:
        "bg-white text-slate-900 border-slate-200/80 shadow-[0_12px_35px_rgba(0,0,0,0.04)]",
      topStripe: "from-orange-500 to-amber-400",
      venueText: "text-slate-900",
      badge: "bg-orange-50 text-orange-600 border-orange-200/80",
      qrBox: "bg-slate-50/70 border-slate-200/70",
      cornerColor: "border-orange-500",
      scanTitle: "text-slate-800",
      scanSub: "text-slate-400",
      divider: "border-slate-100",
      brandText: "text-slate-700",
    };
  };

  const themeStyle = getCardClasses();

  // پرتال اختصاصی چاپ (مستقیماً زیر body برای جلوگیری از برش چندصفحه‌ای)
  const printSheetPortal =
    allTables.length > 0 && typeof document !== "undefined"
      ? createPortal(
          <div
            id="toranj-print-portal"
            dir="rtl"
            className="hidden print:block bg-white text-slate-900 font-sans w-full"
          >
            {/* سربرگ برگه چاپ با نام برند ترنج */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-5">
              <div className="flex items-center gap-3">
                <ToranjLogoMark className="w-10 h-10 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-slate-900">
                      ترن<span className="text-orange-500">ج</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-black text-lg text-slate-800">
                      {name}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    استندهای منوی دیجیتال و سفارش آنلاین میزها
                  </p>
                </div>
              </div>

              <div className="text-left" dir="ltr">
                <span className="block font-mono font-black text-sm text-orange-600">
                  toranjmenu.ir/{slug}
                </span>
                <span className="block text-[11px] font-bold text-slate-400">
                  تعداد کل: {tableCount} میز
                </span>
              </div>
            </div>

            {/* شبکه استندهای چاپی (۳ ستونه در A4 بدون برش بین صفحات) */}
            <div className="grid grid-cols-3 gap-4">
              {allTables.map((tableNum) => {
                const menuLink = `${MENU_BASE_URL}/${slug}?table=${tableNum}`;
                return (
                  <div
                    key={`print-table-${tableNum}`}
                    style={{
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                    className={`rounded-[22px] p-4 border-2 flex flex-col items-center text-center relative overflow-hidden ${themeStyle.wrapper}`}
                  >
                    <div
                      className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${themeStyle.topStripe}`}
                    />

                    <span
                      className={`text-xs font-black truncate max-w-full mt-0.5 mb-1.5 ${themeStyle.venueText}`}
                    >
                      {name}
                    </span>

                    <div
                      className={`px-3.5 py-1 rounded-full border text-xs font-black mb-2.5 ${themeStyle.badge}`}
                    >
                      میز شماره {tableNum.toLocaleString("fa-IR")}
                    </div>

                    {/* بارکد برداری (SVG) برای چاپ بی‌نقص در تمام صفحات */}
                    <div
                      className={`relative w-[132px] h-[132px] rounded-2xl p-2 border mb-2.5 flex items-center justify-center ${themeStyle.qrBox}`}
                    >
                      <span
                        className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 rounded-br ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl ${themeStyle.cornerColor}`}
                      />

                      <div className="w-full h-full bg-white rounded-lg p-1 flex items-center justify-center">
                        <QRCodeSVG
                          value={menuLink}
                          size={112}
                          level="H"
                          fgColor="#0f172a"
                          bgColor="#ffffff"
                        />
                      </div>
                    </div>

                    <p
                      className={`text-[11px] font-black mb-2 ${themeStyle.scanTitle}`}
                    >
                      اسکن کنید و سفارش دهید
                    </p>

                    <div
                      className={`w-full pt-2 border-t flex items-center justify-between text-[9px] font-black ${themeStyle.divider}`}
                    >
                      <span className={themeStyle.brandText}>ترنج</span>
                      <span
                        className="font-mono text-orange-500 font-bold"
                        dir="ltr"
                      >
                        toranjmenu.ir
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className="min-h-screen bg-[#F5F5F7] font-sans text-slate-800 pb-24 relative overflow-x-hidden print:hidden"
        dir="rtl"
      >
        {/* استایل‌های چاپ صفحه */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              background: #ffffff !important;
              height: auto !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #root {
              display: none !important;
            }
            #toranj-print-portal {
              display: block !important;
              position: static !important;
              width: 100% !important;
              overflow: visible !important;
            }
          }
        `}</style>

        {/* هاله نوری پس‌زمینه */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto p-4 sm:p-6 md:p-10 relative z-10">
          {/* هدر صفحه */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
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
                    استند و بارکد میزها
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[11px] font-black">
                    <Sparkles size={12} /> ترنج
                  </span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm font-bold mt-0.5">
                  طراحی، دانلود تصویر کارت‌دار و چاپ استند QR اختصاصی برای
                  میزهای{" "}
                  <span className="text-slate-800 font-black">{name}</span>
                </p>
              </div>
            </div>

            {tableCount > 0 && (
              <button
                type="button"
                onClick={handlePrint}
                className="bg-slate-900 hover:bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-slate-900/15 active:scale-95 transition-all"
              >
                <Printer size={18} strokeWidth={2.5} />
                <span>
                  چاپ همه بارکدها ({tableCount.toLocaleString("fa-IR")} میز)
                </span>
              </button>
            )}
          </header>

          {/* نوار ابزار انتخاب تم کارت و جستجو */}
          {tableCount > 0 && (
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[26px] p-3.5 sm:p-4 mb-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-500 ml-1">
                  طرح استند و چاپ:
                </span>

                {[
                  {
                    id: "light" as StandTheme,
                    label: "مینیمال روشن",
                    dot: "bg-slate-200 border-slate-400",
                  },
                  {
                    id: "dark" as StandTheme,
                    label: "مشکی لوکس",
                    dot: "bg-zinc-900 border-orange-400",
                  },
                  {
                    id: "brand" as StandTheme,
                    label: "نارنجی ترنج",
                    dot: "bg-orange-500 border-orange-300",
                  },
                ].map((t) => {
                  const active = standTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setStandTheme(t.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${
                        active
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full border ${t.dot}`}
                      />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    value={tableSearch}
                    onChange={(e) =>
                      setTableSearch(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="جستجوی شماره میز..."
                    className="w-full sm:w-44 bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-orange-500 rounded-xl py-2 pr-9 pl-8 text-xs font-bold outline-none transition-all"
                  />
                  {tableSearch && (
                    <button
                      type="button"
                      onClick={() => setTableSearch("")}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyLink("general", generalMenuUrl)}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/70 px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedId === "general" ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span>لینک منوی عمومی کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>کپی لینک منوی عمومی</span>
                    </>
                  )}
                </button>

                <a
                  href={generalMenuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>پیش‌نمایش منو</span>
                </a>
              </div>
            </div>
          )}

          {/* گرید کارت‌های میز در صفحه */}
          {tableCount === 0 ? (
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[32px] p-10 text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                تعداد میزها مشخص نیست!
              </h3>
              <p className="text-slate-500 font-bold mb-6 max-w-md leading-relaxed">
                شما هنوز تعداد میزهای مجموعه خود را ثبت نکرده‌اید. برای تولید
                بارکد، ابتدا باید ظرفیت سالن در تنظیمات مشخص شود.
              </p>
              <Link
                to="/venue-settings"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                رفتن به تنظیمات مجموعه
              </Link>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="bg-white rounded-[28px] p-12 text-center border border-slate-100">
              <p className="text-sm font-black text-slate-600 mb-3">
                میزی با شماره «{tableSearch}» وجود ندارد.
              </p>
              <button
                type="button"
                onClick={() => setTableSearch("")}
                className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-xs font-black"
              >
                نمایش همه میزها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredTables.map((tableNum) => {
                const menuLink = `${MENU_BASE_URL}/${slug}?table=${tableNum}`;
                const cardKey = `table-${tableNum}`;

                return (
                  <div
                    key={tableNum}
                    className={`rounded-[30px] p-5 border flex flex-col items-center text-center relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${themeStyle.wrapper}`}
                  >
                    <div
                      className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${themeStyle.topStripe}`}
                    />

                    <div className="w-full pt-1 mb-4 flex flex-col items-center">
                      <span
                        className={`text-xs font-black truncate max-w-full mb-2 ${themeStyle.venueText}`}
                      >
                        {name}
                      </span>

                      <div
                        className={`px-4 py-1.5 rounded-full border text-sm font-black tracking-tight ${themeStyle.badge}`}
                      >
                        میز شماره {tableNum.toLocaleString("fa-IR")}
                      </div>
                    </div>

                    <div
                      className={`relative w-full aspect-square rounded-[24px] p-3.5 border mb-3.5 flex items-center justify-center ${themeStyle.qrBox}`}
                    >
                      <span
                        className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-[2.5px] border-r-[2.5px] rounded-tr-md ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-[2.5px] border-l-[2.5px] rounded-tl-md ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-[2.5px] border-r-[2.5px] rounded-br-md ${themeStyle.cornerColor}`}
                      />
                      <span
                        className={`absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-[2.5px] border-l-[2.5px] rounded-bl-md ${themeStyle.cornerColor}`}
                      />

                      <div className="w-full h-full bg-white rounded-xl p-1.5 flex items-center justify-center">
                        <QRCodeCanvas
                          id={`qr-canvas-${tableNum}`}
                          value={menuLink}
                          size={512}
                          level="H"
                          fgColor="#0f172a"
                          bgColor="#ffffff"
                          marginSize={1}
                          style={{ width: "100%", height: "100%" }}
                        />
                      </div>
                    </div>

                    <div className="mb-3.5">
                      <p
                        className={`text-xs font-black flex items-center justify-center gap-1.5 ${themeStyle.scanTitle}`}
                      >
                        <ScanLine size={13} className="text-orange-500" />
                        <span>اسکن کنید و سفارش دهید</span>
                      </p>
                      <p
                        className={`text-[10px] font-bold mt-0.5 ${themeStyle.scanSub}`}
                      >
                        منوی دیجیتال هوشمند
                      </p>
                    </div>

                    <div
                      className={`w-full pt-2.5 border-t flex items-center justify-between text-[10px] font-black ${themeStyle.divider}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ToranjLogoMark className="w-4 h-4 rounded-md" />
                        <span className={themeStyle.brandText}>ترنج</span>
                      </div>
                      <span
                        className="font-mono text-orange-500 font-bold"
                        dir="ltr"
                      >
                        toranjmenu.ir
                      </span>
                    </div>

                    <div className="w-full grid grid-cols-5 gap-2 mt-3.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadStandPng(
                            `qr-canvas-${tableNum}`,
                            `میز شماره ${tableNum.toLocaleString("fa-IR")}`,
                            `${slug}-Table-${tableNum}-Toranj.png`,
                          )
                        }
                        className="col-span-4 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"
                      >
                        <Download size={14} strokeWidth={2.5} />
                        <span>دانلود کارت میز</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(cardKey, menuLink)}
                        title="کپی لینک مستقیم میز"
                        className={`col-span-1 rounded-xl flex items-center justify-center border transition-colors ${
                          standTheme === "dark"
                            ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                            : "bg-slate-100 border-slate-200/70 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {copiedId === cardKey ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* پرتال چاپ */}
      {printSheetPortal}
    </>
  );
};

export default QrCodes;
