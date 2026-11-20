import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  AlertCircle,
  Loader2,
  Store,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { venuesApi } from "../service/api";

export const QrCodes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<{
    slug: string;
    tableCount: number;
    name: string;
  } | null>(null);
  const [error, setError] = useState("");

  // به صورت خودکار در لوکال localhost:5173 و روی سرور اصلی digimenoo.ir می‌گیرد
  const MENU_BASE_URL = window.location.origin;

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await venuesApi.getMyVenue();
        const data = response?.data?.data || response?.data || response;
        if (data && (data.slug || data.Slug || data.name || data.Name)) {
          setVenueData({
            slug: data.slug || data.Slug || "",
            tableCount: Number(
              data.tableCount ?? data.TableCount ?? data.table_count ?? 0,
            ),
            name: data.name || data.Name || "مجموعه من",
          });
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
    window.print();
  };

  // دانلود آنی PNG مستقیم از Canvas مرورگر بدون درخواست به سرور
  const handleDownload = (tableNum: number) => {
    const canvas = document.getElementById(
      `qr-canvas-${tableNum}`,
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${venueData?.slug || "menu"}-Table-${tableNum}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] font-sans text-slate-800 pb-20 relative overflow-x-hidden"
      dir="rtl"
    >
      {/* استایل‌های مخصوص چاپ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-print-area, #qr-print-area * {
            visibility: visible;
          }
          #qr-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
          }
          .print-card {
            border: 2px dashed #cbd5e1 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* بک‌گراند گرافیکی */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-[100px] pointer-events-none no-print" />

      <div className="max-w-[1400px] mx-auto p-4 md:p-10 relative z-10">
        {/* هدر صفحه */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 no-print animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="w-12 h-12 bg-white/80 backdrop-blur-xl shadow-sm border border-white rounded-[20px] flex items-center justify-center text-slate-500 hover:text-orange-500 transition-all active:scale-95 shrink-0"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-1">
                بارکد میزها
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-bold">
                تولید و چاپ QR Code اختصاصی برای هر میز
              </p>
            </div>
          </div>

          {tables.length > 0 && (
            <button
              type="button"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
            >
              <Printer size={18} strokeWidth={2.5} /> چاپ همه بارکدها
            </button>
          )}
        </header>

        {/* ناحیه محتوا و چاپ */}
        <div id="qr-print-area" className="bg-transparent">
          {/* هدر مخصوص حالت چاپ */}
          <div className="hidden print:block text-center mb-10 border-b-2 border-slate-200 pb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{name}</h1>
            <p className="text-lg font-bold text-slate-500">
              اسکن کنید و آنلاین سفارش دهید
            </p>
          </div>

          {tables.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[32px] p-10 text-center flex flex-col items-center justify-center no-print shadow-sm">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                تعداد میزها مشخص نیست!
              </h3>
              <p className="text-slate-500 font-bold mb-6 max-w-md leading-relaxed">
                شما هنوز تعداد میزهای مجموعه خود را ثبت نکرده‌اید. برای تولید
                بارکد، ابتدا باید ظرفیت رستوران مشخص شود.
              </p>
              <Link
                to="/venue-settings"
                className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                رفتن به تنظیمات مجموعه
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 print-grid">
              {tables.map((tableNum) => {
                const menuLink = `${MENU_BASE_URL}/${slug}?table=${tableNum}`;

                return (
                  <div
                    key={tableNum}
                    className="print-card bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 no-print" />

                    <div className="w-full flex justify-between items-center mb-4">
                      <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Store size={16} strokeWidth={2.5} />
                      </div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">
                        میز{" "}
                        <span className="text-orange-500 text-xl">
                          {tableNum}
                        </span>
                      </h4>
                    </div>

                    <div className="w-full aspect-square bg-slate-50 rounded-[20px] p-3 border border-slate-100 mb-4 flex items-center justify-center">
                      <QRCodeCanvas
                        id={`qr-canvas-${tableNum}`}
                        value={menuLink}
                        size={512}
                        level="H"
                        fgColor="#0f172a"
                        bgColor="#ffffff"
                        marginSize={2}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>

                    <p className="text-[10px] font-bold text-slate-400 dir-ltr mb-4 opacity-70 truncate w-full no-print">
                      /{slug}?table={tableNum}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleDownload(tableNum)}
                      className="w-full bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-500 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 no-print"
                    >
                      <Download size={16} strokeWidth={2.5} /> دانلود تصویر
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCodes;
