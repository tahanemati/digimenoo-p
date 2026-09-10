import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { venuesApi } from "../service/api";
import {
  ChevronRight,
  Palette,
  Printer,
  Image as ImageIcon,
  CheckCircle2,
  Settings2,
  Loader2,
  ScanLine,
} from "lucide-react";

const HEX_COLORS: Record<string, string> = {
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#a855f7",
};

export const QRBuilder = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<any>(null);

  const [tableCount, setTableCount] = useState(20);
  const [brandColor, setBrandColor] = useState("#10b981");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await venuesApi.getMyVenue();
        if (res.has_venue) {
          setVenue(res.venue);
          setTableCount(res.venue.table_count || 20);
          setBrandColor(HEX_COLORS[res.venue.brand_color] || "#10b981");
          setLogoPreview(res.venue.logo);
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات", error);
      } finally {
        setIsLoading(false);
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-white text-center mt-20 font-bold">
        شعبه‌ای یافت نشد!
      </div>
    );
  }

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);
  const baseUrl =
    window.location.hostname === "localhost"
      ? window.location.origin
      : "https://menujet.ir";

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="print:hidden">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link
                to="/dashboard"
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight size={20} />
              </Link>
              <h1 className="text-2xl font-black text-white">
                کارخانه QR Code
              </h1>
            </div>
            <p className="text-slate-500 text-sm">
              طراحی، شخصی‌سازی و چاپ استندهای بارکد اختصاصی برای هر میز
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-6 py-3 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-105 flex items-center gap-2"
          >
            <Printer size={20} /> چاپ A4 (PDF)
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="text-emerald-400" size={18} /> رنگ استندها
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.values(HEX_COLORS).map((colorHex) => (
                <button
                  key={colorHex}
                  onClick={() => setBrandColor(colorHex)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    brandColor === colorHex
                      ? "ring-4 ring-white/20 scale-110 shadow-lg"
                      : "opacity-40 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: colorHex }}
                >
                  {brandColor === colorHex && (
                    <CheckCircle2
                      size={16}
                      className="text-white drop-shadow-md mx-auto"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5 flex items-center gap-4">
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 bg-black/40 border border-dashed border-white/20 hover:border-emerald-500/50 rounded-2xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group shrink-0"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <ImageIcon
                  size={20}
                  className="text-slate-500 group-hover:text-emerald-400"
                />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                لوگوی وسط QR
              </h2>
              <p className="text-xs text-slate-500">
                برای تغییر کلیک کنید (PNG بدون پس‌زمینه)
              </p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Settings2 className="text-emerald-400" size={18} /> تعداد میزها
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="w-20 bg-black/40 border border-white/10 text-xl font-black text-white text-center rounded-xl py-2 focus:border-emerald-500 outline-none transition-colors"
                min="1"
                max="200"
              />
              <span className="text-sm text-slate-400 font-medium">
                عدد بارکد ساخته شد.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="print:m-0 print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <ScanLine className="text-emerald-400" size={20} /> استندهای آماده
            چاپ
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 print:grid-cols-3 print:gap-4 print:w-full">
          {tables.map((tableNum) => {
            const liveMenuUrl = `https://menujet.ir/${venue.english_name}?table=${tableNum}`;

            // 🔴 جادوی حل مشکل اینجاست: پارامتر ecc=H به API اضافه شد (High Error Correction)
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(liveMenuUrl)}&color=${brandColor.replace("#", "")}`;

            return (
              <div
                key={tableNum}
                className="relative bg-white rounded-t-3xl rounded-b-xl shadow-xl flex flex-col items-center p-6 border-b-8 border-gray-200 print:shadow-none print:border-gray-300 print:break-inside-avoid"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-3 rounded-t-3xl transition-colors duration-500"
                  style={{ backgroundColor: brandColor }}
                ></div>

                <div className="text-center mt-2 mb-4 w-full">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {venue.name}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    اسکن کنید و سفارش دهید
                  </p>
                </div>

                <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 w-40 h-40 flex justify-center items-center">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code Table ${tableNum}`}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                  {/* لوگوی وسط QR با سایز استاندارد که مانع اسکن نشود */}
                  {logoPreview && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white rounded-[10px] p-1 shadow-md flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Center Logo"
                        className="w-full h-full object-contain rounded-md"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center justify-between border-t border-dashed border-gray-200 pt-4">
                  <span className="text-sm font-bold text-gray-400">
                    شماره میز
                  </span>
                  <span
                    className="text-2xl font-black transition-colors duration-500"
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
  );
};
