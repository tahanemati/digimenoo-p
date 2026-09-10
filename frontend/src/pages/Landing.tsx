import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ScanLine,
  Utensils,
  CreditCard,
  Zap,
  Palette,
  ShieldCheck,
  ArrowLeft,
  Check,
  Sparkles,
  TrendingUp,
  Paintbrush,
  QrCode,
  Smartphone,
  Wifi,
} from "lucide-react";
import { LandingHeader } from "../components/LandingHeader";
import { LandingFooter } from "../components/LandingFooter";

export const Landing = () => {
  const [billingCycle, setBillingCycle] = useState<"6mo" | "12mo">("12mo");
  const [themeColor, setThemeColor] = useState("emerald");

  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setQrUrl(`${window.location.origin}/modern-demo`);
  }, []);

  const themeColors = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
  };

  return (
    <div
      className="min-h-screen font-sans bg-[#fcfcfc] text-zinc-900 selection:bg-emerald-200 selection:text-emerald-900"
      dir="rtl"
    >
      {/* استایل انیمیشن اسکنر و امواج NFC */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 2.5s linear infinite; }
      `}</style>

      <LandingHeader />

      {/* هیرو سکشن */}
      <section className="pt-48 pb-20 px-6 relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-sm font-bold mb-8 relative z-10">
          <Sparkles size={16} />
          <span>خداحافظی با منوهای کاغذی و کثیف!</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-zinc-900 leading-[1.2] mb-8 relative z-10 tracking-tight max-w-4xl">
          رستوران شما، <br />
          <span className="text-emerald-500">در گوشی مشتری شماست.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-500 leading-relaxed mb-12 max-w-2xl relative z-10 font-medium">
          یک سیستم ساده که منوی شما را به یک اپلیکیشن زیبا تبدیل می‌کند. مشتری
          گوشی خود را نزدیک میز می‌کند، عکس غذاها را می‌بیند و سفارش می‌دهد.
        </p>

        {/* دکمه‌های هیرو */}
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 mb-16">
          <Link
            to="/register"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:-translate-y-1"
          >
            همین الان رایگان شروع کن
            <ArrowLeft size={20} />
          </Link>
          <a
            href="#how-it-works"
            className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-8 py-4 rounded-2xl font-bold text-lg transition-all"
          >
            دقیقاً چطور کار می‌کنه؟
          </a>
        </div>

        {/* کارت QR Code برای دمو */}
        <div className="relative z-10 flex flex-col items-center">
          <Link to="/modern-demo" target="_blank" className="group">
            <div className="bg-white p-3 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.15)] border border-emerald-100 flex flex-col items-center gap-3 transition-transform duration-500 group-hover:-translate-y-2">
              <div className="w-36 h-36 bg-zinc-50 rounded-2xl overflow-hidden p-2 border border-zinc-100 flex items-center justify-center relative">
                {qrUrl ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                    alt="Demo QR"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <QrCode className="text-zinc-300 animate-pulse" size={40} />
                )}
                <div className="absolute left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-scan z-20"></div>
              </div>

              <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-4 py-1.5 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                نمونه تم رستوران
              </span>
            </div>
          </Link>
          <div className="text-xs font-bold text-zinc-400 mt-4 flex items-center gap-1.5">
            <ScanLine size={14} className="text-emerald-500" /> با دوربین گوشی
            اسکن کنید
          </div>
        </div>
      </section>

      {/* بخش آموزشی: زبان ساده (ELI5) */}
      <section
        id="how-it-works"
        className="py-24 px-6 bg-white border-y border-zinc-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-zinc-900 mb-6 tracking-tight">
              داستان از چه قراره؟
            </h2>
            <p className="text-lg text-zinc-500 max-w-3xl mx-auto leading-relaxed">
              فرض کنید امروز ظهر، یک مشتری وارد کافه یا رستوران شما می‌شود. به
              جای اینکه منتظر گارسون بماند تا یک منوی کاغذیِ خط‌خورده را برایش
              بیاورد، این اتفاق می‌افتد:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-zinc-100 z-0 border-t-2 border-dashed border-zinc-200" />

            {/* مرحله ۱ (تغییر یافته برای NFC) */}
            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-zinc-100 mb-8 text-emerald-500 relative">
                <Smartphone size={36} />
                <Wifi
                  size={20}
                  className="absolute -top-1 -right-1 text-emerald-300 rotate-45"
                />
              </div>
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 absolute -top-4 shadow-md">
                ۱
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-4">
                گوشی را به میز نزدیک می‌کند
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                مشتری روی صندلی می‌نشیند. فقط کافیست گوشی خود را به تگ NFC
                هوشمندی که روی میز چسبانده‌اید نزدیک کند (یا بارکد را اسکن کند).
                بدون نیاز به نصب برنامه!
              </p>
            </div>

            {/* مرحله ۲ */}
            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-zinc-100 mb-8 text-emerald-500">
                <Utensils size={36} />
              </div>
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 absolute -top-4 shadow-md">
                ۲
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-4">
                منوی خوشمزه باز می‌شود
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                در کسری از ثانیه، یک منوی دیجیتال بسیار زیبا با رنگ‌بندی و لوگوی
                خود شما باز می‌شود. مشتری عکس واقعی غذاها، قیمت‌ها و توضیحات را
                با لذت ورق می‌زند.
              </p>
            </div>

            {/* مرحله ۳ */}
            <div className="relative z-10 flex flex-col items-center text-center bg-[#fcfcfc] p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-zinc-100 mb-8 text-emerald-500">
                <CreditCard size={36} />
              </div>
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 absolute -top-4 shadow-md">
                ۳
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-4">
                سفارش می‌دهد و پرداخت می‌کند
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                غذاها را انتخاب می‌کند، دکمه پرداخت را می‌زند و با رمز پویا پول
                را پرداخت می‌کند. در همان لحظه، فیش سفارش به همراه شماره میز در
                آشپزخانه شما چاپ می‌شود!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* مزایای رقابتی */}
      <section id="advantages" className="py-24 px-6 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">
              چرا ما بی‌رقیب هستیم؟
            </h2>
            <p className="text-zinc-500">
              امکاناتی که مدیریت رستوران را برای شما تبدیل به تفریح می‌کند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* کارت جدید NFC (عرض کامل و خیره‌کننده) */}
            <div className="md:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-400 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex flex-col md:flex-row items-center justify-between text-white overflow-hidden relative group">
              <div className="absolute inset-0 bg-black opacity-[0.03] mix-blend-overlay"></div>
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/20 blur-[100px] rounded-full pointer-events-none"></div>

              <div className="relative z-10 md:w-2/3 mb-10 md:mb-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-white text-xs font-bold mb-6 backdrop-blur-md shadow-sm border border-white/30">
                  <Sparkles size={16} className="text-emerald-100" />
                  هدیه ویژه ما به شما (کاملاً رایگان)
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-5 tracking-tight drop-shadow-md">
                  جادوی NFC؛ فقط گوشی را نزدیک کن!
                </h3>
                <p className="text-emerald-50 leading-relaxed text-lg font-medium max-w-2xl drop-shadow-sm">
                  دوران باز کردن دوربین و زوم کردن روی بارکدها تمام شد! ما همراه
                  با اشتراک شما، تگ‌های هوشمند NFC اختصاصی را به تعداد میزهایتان{" "}
                  <strong className="bg-white/20 px-2 py-0.5 rounded-md">
                    رایگان
                  </strong>{" "}
                  ارسال می‌کنیم. مشتری گوشی‌اش را روی میز می‌گذارد و منو مثل
                  جادو باز می‌شود.
                </p>
              </div>

              <div className="relative z-10 flex justify-center items-center md:w-1/3">
                <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border-[6px] border-white/20 backdrop-blur-md relative shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 border-[6px] border-white/40 rounded-full animate-ping opacity-30"></div>
                  <Smartphone size={72} className="text-white relative z-10" />
                  <Wifi
                    size={40}
                    className="text-emerald-200 absolute top-6 right-6 rotate-45 animate-pulse"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-zinc-200 p-10 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] transition-transform group-hover:scale-150" />
              <Palette className="text-emerald-500 mb-6" size={36} />
              <h3 className="text-2xl font-black text-zinc-900 mb-4">
                ۱۰۰٪ اختصاصی به نام خودتان
              </h3>
              <p className="text-zinc-500 leading-relaxed max-w-md font-medium">
                برخلاف پلتفرم‌های دیگر، مشتریان شما نامی از ما نمی‌بینند. منو با
                دامنه اختصاصی شما، رنگ‌سازمانی شما و لوگوی شما بالا می‌آید.
                انگار اپلیکیشن شخصی خودتان را نوشته‌اید!
              </p>
            </div>

            <div className="bg-white border border-zinc-200 p-10 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
              <Zap className="text-amber-500 mb-6" size={36} />
              <h3 className="text-xl font-black text-zinc-900 mb-4">
                تغییرات در کسر ثانیه
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm font-medium">
                موجودی یک غذا تمام شد؟ می‌خواهید قیمت را عوض کنید؟ با یک کلیک در
                پنل شما، قیمت روی گوشی تمام مشتریان داخل رستوران در همان لحظه
                عوض می‌شود.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 p-10 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
              <TrendingUp className="text-blue-500 mb-6" size={36} />
              <h3 className="text-xl font-black text-zinc-900 mb-4">
                فروشنده هوشمند
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm font-medium">
                سیستم ما می‌فهمد مشتری چه چیزی سفارش داده و بلافاصله به او
                پیشنهاد می‌دهد: «آیا با پیتزای خود، سیب‌زمینی و نوشابه هم میل
                دارید؟»
              </p>
            </div>

            <div className="md:col-span-2 bg-zinc-900 p-10 rounded-[2rem] shadow-xl flex items-center justify-between text-white overflow-hidden relative">
              <div className="absolute right-0 top-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800 via-transparent to-transparent opacity-50"></div>

              <div className="relative z-10">
                <ShieldCheck className="text-emerald-400 mb-6" size={36} />
                <h3 className="text-2xl font-black mb-4">
                  تسویه مستقیم و بدون کارمزد
                </h3>
                <p className="text-zinc-300 leading-relaxed max-w-sm font-medium">
                  مبالغ پرداختی توسط مشتریان روی میز، مستقیماً و بدون حتی یک
                  ریال کارمزد اضافی، به حساب و درگاه بانکی اختصاصی خود رستوران
                  واریز می‌شود.
                </p>
              </div>
              <div className="hidden md:flex relative z-10 items-center justify-center w-32 h-32 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                <CreditCard size={40} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* دموی زنده شخصی‌سازی */}
      <section
        id="demo"
        className="py-24 px-6 bg-white border-y border-zinc-100 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-zinc-900 mb-6 tracking-tight">
              منویی به رنگ برند شما
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-8 text-lg">
              هیچ دو رستورانی شبیه هم نیستند. شما می‌توانید ظاهر منو را دقیقاً
              با دکوراسیون و لوگوی خود هماهنگ کنید. یکی از رنگ‌های زیر را انتخاب
              کنید تا جادو را ببینید:
            </p>

            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 w-fit">
              <Paintbrush className="text-zinc-400" size={20} />
              <div className="w-px h-6 bg-zinc-200"></div>
              {(
                Object.keys(themeColors) as Array<keyof typeof themeColors>
              ).map((color) => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-10 h-10 rounded-full transition-all duration-300 ${themeColors[color]} ${
                    themeColor === color
                      ? "ring-4 ring-zinc-200 scale-110 shadow-md"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative w-[300px] h-[600px] bg-zinc-900 rounded-[3rem] border-[12px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-900 rounded-b-3xl z-20"></div>

            <div className="flex-1 bg-zinc-50 flex flex-col relative z-10">
              <div
                className={`${themeColors[themeColor as keyof typeof themeColors]} h-48 rounded-b-[2.5rem] p-6 text-white transition-colors duration-500 flex flex-col justify-end pb-10 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="font-black text-2xl drop-shadow-md">
                    رستوران شما
                  </div>
                  <div className="text-sm font-medium opacity-90 mt-1">
                    میز شماره ۴
                  </div>
                </div>
              </div>

              <div className="px-5 -mt-6 flex flex-col gap-4 relative z-10">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 flex gap-4 items-center"
                  >
                    <div className="w-16 h-16 bg-zinc-100 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-3.5 bg-zinc-200 rounded-full w-3/4 mb-3"></div>
                      <div className="h-2.5 bg-zinc-100 rounded-full w-1/2 mb-4"></div>
                      <div
                        className={`h-6 rounded-md w-1/3 mr-auto transition-colors duration-500 opacity-80 ${themeColors[themeColor as keyof typeof themeColors]}`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* تعرفه‌ها */}
      <section id="pricing" className="py-24 px-6 bg-[#fcfcfc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-zinc-900 mb-6 tracking-tight">
              سرمایه‌گذاری روی آرامش شما
            </h2>
            <p className="text-zinc-500 mb-10 text-lg">
              هزینه یک ماه استفاده از این سیستم، کمتر از چاپ کردن ۱۰ عدد منوی
              کاغذی است!
            </p>

            <div className="inline-flex items-center bg-zinc-100 border border-zinc-200 p-1.5 rounded-2xl">
              <button
                onClick={() => setBillingCycle("6mo")}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${billingCycle === "6mo" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                ۶ ماهه
              </button>
              <button
                onClick={() => setBillingCycle("12mo")}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === "12mo" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                سالیانه
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                  ۲۰٪ تخفیف
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* پلن استاندارد */}
            <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] shadow-sm">
              <h3 className="text-2xl font-black text-zinc-900 mb-2">
                نسخه استاندارد
              </h3>
              <p className="text-zinc-500 text-sm mb-8 font-medium">
                برای کافه‌ها و فست‌فودهای دنج
              </p>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-zinc-900 tracking-tight">
                  {billingCycle === "12mo" ? "۲۹۹" : "۳۵۰"}
                </span>
                <span className="text-zinc-500 font-bold">
                  هزار تومان / ماهانه
                </span>
              </div>
              <ul className="flex flex-col gap-5 mb-10 text-sm text-zinc-600 font-medium">
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-500 shrink-0" size={20} /> ساخت
                  منوی دیجیتال تا ۵۰ آیتم
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-500 shrink-0" size={20} />{" "}
                  دسترسی به قالب مینیمال
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-500 shrink-0" size={20} />{" "}
                  پشتیبانی تیکتی
                </li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-4 rounded-2xl font-bold transition-colors"
              >
                انتخاب این پلن
              </Link>
            </div>

            {/* پلن حرفه‌ای */}
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20">
                محبوب‌ترین
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                نسخه حرفه‌ای (VIP)
              </h3>
              <p className="text-zinc-400 text-sm mb-8 font-medium">
                برای رستوران‌های شلوغ و حرفه‌ای
              </p>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tight">
                  {billingCycle === "12mo" ? "۵۹۹" : "۶۹۰"}
                </span>
                <span className="text-zinc-400 font-bold">
                  هزار تومان / ماهانه
                </span>
              </div>
              <ul className="flex flex-col gap-5 mb-10 text-sm text-zinc-300 font-medium">
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-400 shrink-0" size={20} />{" "}
                  <strong className="text-white">نامحدود</strong> آیتم در منو
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-400 shrink-0" size={20} />{" "}
                  تگ‌های رایگان <strong>NFC</strong>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-400 shrink-0" size={20} />{" "}
                  اتصال مستقیم به درگاه پرداخت
                </li>
                <li className="flex items-center gap-3">
                  <Check className="text-emerald-400 shrink-0" size={20} /> هوش
                  مصنوعی پیشنهاد فروش
                </li>
              </ul>
              <Link
                to="/register"
                className="block text-center w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-colors shadow-lg shadow-emerald-500/20"
              >
                شروع قدرتمند با VIP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* کامپوننت فوتر */}
      <LandingFooter />
    </div>
  );
};
