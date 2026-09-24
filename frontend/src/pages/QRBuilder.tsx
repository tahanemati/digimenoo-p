import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Palette,
  Printer,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  ScanLine,
  Camera,
  SmartphoneNfc,
  Box,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

// رنگ‌های مجاز برای بارکد
const HEX_COLORS: Record<string, string> = {
  orange: "#f97316",
  emerald: "#10b981",
  rose: "#f43f5e",
  blue: "#3b82f6",
  purple: "#a855f7",
  black: "#1e293b",
};

export const QRBuilder = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<any>(null);

  const [tableCount, setTableCount] = useState(0);
  const [brandColor, setBrandColor] = useState(HEX_COLORS.orange);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // قیمت پایه برای هر میز (به تومان)
  const WOOD_STAND_PRICE_PER_TABLE = 75000;
  const NFC_TAG_PRICE_PER_TABLE = 120000;

  // =======================
  // داده‌های نمایشی (Mock Data)
  // =======================
  useEffect(() => {
    const fetchVenue = () => {
      setIsLoading(true);
      setTimeout(() => {
        // شبیه‌سازی دریافت اطلاعات از دیتابیس
        setVenue({
          name: "کافه لوتوس",
          english_name: "lotuscafe",
        });
        setTableCount(15); // فرض می‌کنیم کاربر در مرحله قبل 15 میز ثبت کرده است
        setBrandColor(HEX_COLORS.orange);
        setIsLoading(false);
      }, 800);
    };
    fetchVenue();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestService = (serviceName: string) => {
    alert(
      `درخواست شما برای "${serviceName}" ثبت شد. کارشناسان ما به زودی با شما تماس می‌گیرند.`,
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!venue || tableCount === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-slate-800">
        <ScanLine size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black mb-2">اطلاعاتی یافت نشد!</h2>
        <p className="text-sm font-medium text-slate-500 mb-6">
          ابتدا باید رستوران و تعداد میزهای خود را در تنظیمات ثبت کنید.
        </p>
        <Link
          to="/venue-settings"
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 transition-all"
        >
          رفتن به تنظیمات
        </Link>
      </div>
    );
  }

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative font-sans text-slate-800 bg-slate-50 min-h-screen"
      dir="rtl"
    >
      {/* افکت‌های پس‌زمینه */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none print:hidden" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none print:hidden" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto">
        {/* هدر صفحه (مخفی در پرینت) */}
        <div className="print:hidden">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm"
              >
                <ChevronRight size={24} />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  کارخانه QR Code
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  طراحی، شخصی‌سازی و چاپ بارکد اختصاصی برای {tableCount} میز شما
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Printer size={20} /> چاپ A4 (PDF)
            </button>
          </header>

          {/* =======================
              بخش پیشنهادات ویژه (Upsell)
          ======================= */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-orange-500" size={20} />
              <h2 className="text-lg font-black text-slate-800">
                پیشنهادات ویژه برای مجموعه شما
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* کارت استند چوبی */}
              <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-amber-200 text-amber-600 shadow-sm shrink-0">
                    <Box size={28} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">
                      ساخت و حکاکی استند چوبی
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mb-4 leading-relaxed">
                      طراحی و برش لیزری لوگو و بارکد روی چوب درجه یک، ضد آب و
                      مقاوم برای قرارگیری روی تمام میزها.
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-[11px] text-slate-400 font-bold mb-0.5">
                          قیمت برای {tableCount} میز:
                        </span>
                        <span className="text-xl font-black text-amber-600">
                          {(
                            tableCount * WOOD_STAND_PRICE_PER_TABLE
                          ).toLocaleString("fa-IR")}{" "}
                          <span className="text-xs font-bold text-slate-500">
                            تومان
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestService("استند چوبی")}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-colors"
                      >
                        <ShoppingCart size={16} /> ثبت سفارش
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* کارت تگ NFC */}
              <div className="bg-blue-50 border border-blue-200 rounded-[28px] p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-blue-200 text-blue-600 shadow-sm shrink-0">
                    <SmartphoneNfc size={28} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">
                      تگ‌های هوشمند NFC
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mb-4 leading-relaxed">
                      مشتری کافیست گوشی خود را روی میز نزدیک تگ کند تا منو فوراً
                      باز شود (بدون نیاز به اسکن دوربین).
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-[11px] text-slate-400 font-bold mb-0.5">
                          قیمت برای {tableCount} میز:
                        </span>
                        <span className="text-xl font-black text-blue-600">
                          {(
                            tableCount * NFC_TAG_PRICE_PER_TABLE
                          ).toLocaleString("fa-IR")}{" "}
                          <span className="text-xs font-bold text-slate-500">
                            تومان
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleRequestService("تگ NFC")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-colors"
                      >
                        <ShoppingCart size={16} /> ثبت سفارش
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =======================
              بخش شخصی‌سازی
          ======================= */}
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[28px] p-6 shadow-sm mb-12 flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                <Palette className="text-orange-500" size={18} /> رنگ استندها
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.values(HEX_COLORS).map((colorHex) => (
                  <button
                    key={colorHex}
                    onClick={() => setBrandColor(colorHex)}
                    className={`w-12 h-12 rounded-xl transition-all shadow-sm ${
                      brandColor === colorHex
                        ? "ring-4 ring-orange-500/30 scale-110 shadow-md"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: colorHex }}
                  >
                    {brandColor === colorHex && (
                      <CheckCircle2
                        size={20}
                        className="text-white drop-shadow-md mx-auto"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
              <input
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                ref={fileInputRef}
                onChange={handleLogoUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 bg-white border border-dashed border-slate-300 hover:border-orange-500 rounded-2xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group shrink-0 shadow-sm"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Camera
                    size={24}
                    className="text-slate-400 group-hover:text-orange-500"
                  />
                )}
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-700 mb-1">
                  لوگوی وسط بارکد (اختیاری)
                </h2>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  برای خوانایی بهتر، یک تصویر PNG (بدون پس‌زمینه) با کیفیت مناسب
                  انتخاب کنید.
                </p>
                {logoPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoPreview(null);
                    }}
                    className="text-[10px] font-bold text-rose-500 mt-2 bg-rose-50 px-2 py-1 rounded"
                  >
                    حذف تصویر
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            نمایش بارکدها (بخش پرینت)
        ======================= */}
        <div className="print:m-0 print:p-0">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <ScanLine className="text-orange-500" size={24} /> استندهای آماده
              چاپ
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 print:grid-cols-3 print:gap-4 print:w-full">
            {tables.map((tableNum) => {
              // لینک زنده اختصاصی هر میز
              const liveMenuUrl = `https://menujet.ir/${venue.english_name}?table=${tableNum}`;

              // ساخت بارکد از طریق API با کیفیت High (ecc=H)
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&margin=2&data=${encodeURIComponent(liveMenuUrl)}&color=${brandColor.replace("#", "")}`;

              return (
                <div
                  key={tableNum}
                  className="relative bg-white rounded-t-[32px] rounded-b-2xl shadow-xl flex flex-col items-center p-5 border-b-8 print:shadow-none print:border border-slate-100 print:break-inside-avoid"
                  style={{ borderBottomColor: brandColor }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-4 rounded-t-[32px] transition-colors duration-500"
                    style={{ backgroundColor: brandColor }}
                  ></div>

                  <div className="text-center mt-3 mb-4 w-full">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight line-clamp-1">
                      {venue.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      اسکن کنید و سفارش دهید
                    </p>
                  </div>

                  <div className="relative p-2 bg-white rounded-[20px] shadow-sm border border-slate-100 mb-5 w-40 h-40 flex justify-center items-center">
                    <img
                      src={qrCodeUrl}
                      alt={`QR Code Table ${tableNum}`}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                    {/* لوگوی وسط QR */}
                    {logoPreview && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl p-1 shadow-md flex items-center justify-center border border-slate-100">
                        <img
                          src={logoPreview}
                          alt="Center Logo"
                          className="w-full h-full object-contain rounded-lg"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                    <span className="text-xs font-black text-slate-400">
                      شماره میز
                    </span>
                    <span
                      className="text-2xl font-black transition-colors duration-500 font-mono"
                      style={{ color: brandColor }}
                    >
                      {tableNum.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
