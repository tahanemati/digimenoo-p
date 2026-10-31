import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import {
  Utensils,
  CreditCard,
  Zap,
  Palette,
  ShieldCheck,
  ArrowLeft,
  Check,
  Sparkles,
  Smartphone,
  QrCode,
  ScanLine,
  Globe,
  BarChart3,
  BellRing,
  Coffee,
  Flame,
  CheckCircle2,
  ChevronDown,
  Store,
  MenuSquare,
  TrendingUp,
} from "lucide-react";
import { LandingFooter } from "../components/LandingFooter";

// انیمیشن‌های پایه
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export const Landing = () => {
  // ==========================================
  // استیت‌ها و هوک‌ها
  // ==========================================
  const [billingCycle, setBillingCycle] = useState<"3mo" | "6mo" | "9mo">(
    "6mo",
  );
  const [orderStage, setOrderStage] = useState(0);
  const [showNav, setShowNav] = useState(false);

  // تغییر خودکار وضعیت سفارش (هر 3 ثانیه)
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderStage((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // کنترل اسکرول کل صفحه
  const { scrollYProgress, scrollY } = useScroll();

  // کنترل نمایش نوبار (فقط بعد از 100 پیکسل باز می‌شود)
  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowNav(latest > 100);
  });

  // حرکت ربات سه‌بعدی بر اساس اسکرول
  const robotX = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1],
    ["5vw", "-40vw", "10vw", "-35vw"],
  );
  const robotY = useTransform(scrollYProgress, [0, 1], ["10vh", "85vh"]);
  const robotScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 1.2]);

  // رفرنس برای بخش "خط پیشرفت"
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsScroll } = useScroll({
    target: stepsRef,
    offset: ["start center", "end center"],
  });
  // پر شدن خط پیشرفت
  const lineHeight = useTransform(stepsScroll, [0, 1], ["0%", "100%"]);

  return (
    <div
      className="min-h-screen font-sans bg-[#fdfaf6] text-slate-800 selection:bg-orange-500/20 overflow-x-hidden"
      dir="rtl"
    >
      {/* ========================================== */}
      {/* ربات سه‌بعدی همراه (Scroll Companion) */}
      {/* ========================================== */}
      <motion.div
        style={{ x: robotX, y: robotY, scale: robotScale }}
        className="fixed z-40 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {/* هاله نوری پشت ربات */}
          <div className="absolute inset-0 bg-orange-400/30 blur-[40px] rounded-full"></div>
          {/* عکس ربات 3D (می‌توانی تغییر دهی) */}
          <img
            src="https://cdn3d.iconscout.com/3d/premium/thumb/robot-waiter-6547671-5401918.png"
            alt="DigiMenoo Robot"
            className="w-48 h-auto drop-shadow-2xl relative z-10"
          />
        </motion.div>
      </motion.div>

      {/* ========================================== */}
      {/* 1. نوبار شیشه‌ای (نمایش با انیمیشن پس از اسکرول) */}
      {/* ========================================== */}
      <motion.nav
        initial={{ y: -150, opacity: 0 }}
        animate={{ y: showNav ? 0 : -150, opacity: showNav ? 1 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl h-20 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-full z-50 flex items-center justify-between px-6 shadow-[0_10px_40px_rgba(234,88,12,0.1)]"
      >
        <div className="font-black text-2xl tracking-tighter text-slate-900">
          دیجی<span className="text-orange-500">منو</span>
        </div>
        <ul className="hidden md:flex items-center gap-8 font-bold text-slate-600">
          <li className="hover:text-orange-500 transition-colors cursor-pointer">
            چگونه کار می‌کند؟
          </li>
          <li className="hover:text-orange-500 transition-colors cursor-pointer">
            امکانات
          </li>
          <li className="hover:text-orange-500 transition-colors cursor-pointer">
            تعرفه‌ها
          </li>
        </ul>
        <Link
          to="/register"
          className="bg-gradient-to-r from-orange-600 to-orange-400 text-white px-8 py-3 rounded-full font-black transition-all shadow-[0_8px_20px_rgba(234,88,12,0.3)] hover:shadow-[0_10px_25px_rgba(234,88,12,0.5)] hover:scale-105 flex items-center gap-2"
        >
          ورود / ثبت‌نام
        </Link>
      </motion.nav>

      {/* ========================================== */}
      {/* 2. هیرو سکشن (Glass & 3D Tilt) */}
      {/* ========================================== */}
      <section className="relative min-h-[100vh] pt-32 pb-20 px-6 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto gap-12">
        {/* هاله‌های رنگی نارنجی */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-300/20 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="flex-1 text-center lg:text-right relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 border border-orange-100 backdrop-blur-xl text-orange-600 text-sm font-black mb-8 shadow-sm"
          >
            <Sparkles size={16} className="animate-pulse" />
            <span>انقلاب هوشمندسازی رستوران‌ها در ۲۰۲۶</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.15] mb-8 tracking-tight"
          >
            رستوران شما، <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
              در جیب مشتری.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl font-medium"
          >
            با دیجی‌منو، مشتری گوشی خود را روی میز می‌گیرد و وارد دنیای خوشمزه‌ی
            رستوران شما می‌شود. منوی کاغذی را دور بیندازید و فروش خود را چند
            برابر کنید.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start"
          >
            <Link
              to="/register"
              className="group relative overflow-hidden bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all hover:shadow-2xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 opacity-0 group-hover:opacity-20 transition-opacity" />
              <span className="relative z-10">ساخت منوی رایگان</span>
              <ArrowLeft
                size={20}
                className="relative z-10 group-hover:-translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="#order-tracker"
              className="px-8 py-4 rounded-2xl font-bold text-lg text-slate-700 flex items-center gap-2 hover:bg-white/60 bg-white/40 backdrop-blur-xl border border-white transition-all shadow-sm"
            >
              مشاهده دمو
              <ChevronDown
                size={20}
                className="text-orange-500 animate-bounce mt-1"
              />
            </a>
          </motion.div>
        </div>

        {/* موکاپ اسکنر شیشه‌ای سه‌بعدی */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex-1 w-full max-w-md relative perspective-1000"
        >
          <div className="relative w-full h-[550px] bg-white/30 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-[0_30px_60px_rgba(234,88,12,0.1)] overflow-hidden flex flex-col items-center justify-center transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700">
            <div className="absolute top-0 w-32 h-6 bg-white rounded-b-2xl z-20 shadow-sm"></div>

            <div className="text-center z-10">
              <QrCode
                size={120}
                className="text-slate-800 mb-6 mx-auto opacity-40"
              />
              <h3 className="font-black text-2xl text-slate-800">اسکن کنید</h3>
              <p className="text-slate-600 font-medium mt-2">
                بدون نیاز به نصب اپلیکیشن
              </p>
            </div>

            {/* لیزر اسکنر نارنجی */}
            <motion.div
              animate={{ top: ["20%", "80%", "20%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] z-20 flex items-center justify-center"
            >
              <ScanLine className="absolute text-orange-500 w-16 h-16 drop-shadow-lg" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================== */}
      {/* 3. خط پیشرفت اسکرولی (Scroll Progress Steps) */}
      {/* ========================================== */}
      <section
        ref={stepsRef}
        className="py-32 px-6 relative bg-white/40 backdrop-blur-md border-y border-white/60"
      >
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            مسیر موفقیت رستوران شما
          </h2>
          <p className="text-slate-500 font-medium">
            فقط ۳ قدم تا رسیدن به فروش چند برابری فاصله دارید.
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0">
          {/* خط پس‌زمینه افقی (در دسکتاپ) / عمودی (در موبایل) */}
          <div className="absolute left-1/2 md:left-10 md:right-10 top-0 bottom-0 md:top-1/2 md:bottom-auto w-1 md:w-auto md:h-1 bg-slate-200 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 z-0 rounded-full overflow-hidden">
            {/* خط پر شونده نارنجی (وصل به اسکرول) */}
            <motion.div
              style={{ height: "100%", width: lineHeight }}
              className="bg-gradient-to-b md:bg-gradient-to-r from-orange-400 to-orange-600 hidden md:block"
            />
            <motion.div
              style={{ height: lineHeight, width: "100%" }}
              className="bg-gradient-to-b from-orange-400 to-orange-600 md:hidden"
            />
          </div>

          {/* قدم 1 */}
          <div className="relative z-10 flex flex-col items-center bg-[#fdfaf6] p-4 rounded-full">
            <div className="w-16 h-16 bg-white border border-slate-200 shadow-xl rounded-full flex items-center justify-center text-orange-500 mb-4">
              <Store size={28} />
            </div>
            <h3 className="font-black text-xl text-slate-800">۱. ثبت‌نام</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 text-center w-32">
              اطلاعات رستوران را وارد کنید
            </p>
          </div>

          {/* قدم 2 */}
          <div className="relative z-10 flex flex-col items-center bg-[#fdfaf6] p-4 rounded-full">
            <div className="w-16 h-16 bg-white border border-slate-200 shadow-xl rounded-full flex items-center justify-center text-orange-500 mb-4">
              <MenuSquare size={28} />
            </div>
            <h3 className="font-black text-xl text-slate-800">۲. دریافت منو</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 text-center w-32">
              منوی اختصاصی شما ساخته می‌شود
            </p>
          </div>

          {/* قدم 3 */}
          <div className="relative z-10 flex flex-col items-center bg-[#fdfaf6] p-4 rounded-full">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-400 text-white shadow-[0_10px_20px_rgba(234,88,12,0.3)] rounded-full flex items-center justify-center mb-4">
              <TrendingUp size={28} />
            </div>
            <h3 className="font-black text-xl text-slate-800">۳. فروش!</h3>
            <p className="text-sm text-slate-500 font-medium mt-2 text-center w-32">
              افزایش چشمگیر سرعت و درآمد
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. شبیه‌ساز خودکار وضعیت سفارش */}
      {/* ========================================== */}
      <section id="order-tracker" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full font-black text-sm mb-6 border border-orange-200">
              <Zap size={18} /> کاملاً خودکار و بلادرنگ
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              مشتریان چطور سفارش را <br className="hidden md:block" /> پیگیری
              می‌کنند؟
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              دیجی‌منو وضعیت سفارش را به صورت زنده و پیامکی از آشپزخانه به گوشی
              مشتری مخابره می‌کند. مشتری روی میز می‌نشیند و از مسیر آماده‌سازی
              لذت می‌برد.
            </p>
          </div>

          {/* موکاپ زنده */}
          <div className="relative w-full max-w-[320px] shrink-0">
            <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col h-[600px] relative">
              <div className="bg-gradient-to-br from-orange-600 to-amber-500 h-40 p-6 text-white flex flex-col justify-end relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80')] bg-cover opacity-20 mix-blend-luminosity"></div>
                <div className="relative z-10">
                  <div className="text-sm font-bold opacity-90">
                    سفارش #۴۰۹۲
                  </div>
                  <div className="text-2xl font-black">میز شماره ۵</div>
                </div>
              </div>

              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-slate-200">
                  {/* مرحله 0 */}
                  <div
                    className={`relative flex items-center gap-4 transition-all duration-500 ${orderStage >= 0 ? "opacity-100 scale-100" : "opacity-40 scale-95"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 z-10 bg-white shadow-sm ${orderStage >= 0 ? "border-amber-500 text-amber-500" : "border-slate-300 text-slate-300"}`}
                    >
                      <Coffee size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <div
                        className={`font-black text-lg ${orderStage >= 0 ? "text-slate-800" : "text-slate-500"}`}
                      >
                        ثبت و آماده‌سازی
                      </div>
                      {orderStage === 0 && (
                        <div className="text-sm font-bold text-amber-500 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>{" "}
                          در حال انجام
                        </div>
                      )}
                    </div>
                  </div>

                  {/* مرحله 1 */}
                  <div
                    className={`relative flex items-center gap-4 transition-all duration-500 ${orderStage >= 1 ? "opacity-100 scale-100" : "opacity-40 scale-95"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 z-10 bg-white shadow-sm ${orderStage >= 1 ? "border-orange-500 text-orange-500" : "border-slate-300 text-slate-300"}`}
                    >
                      <Flame size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <div
                        className={`font-black text-lg ${orderStage >= 1 ? "text-slate-800" : "text-slate-500"}`}
                      >
                        در حال پخت
                      </div>
                      {orderStage === 1 && (
                        <div className="text-sm font-bold text-orange-500 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>{" "}
                          روی آتش
                        </div>
                      )}
                    </div>
                  </div>

                  {/* مرحله 2 */}
                  <div
                    className={`relative flex items-center gap-4 transition-all duration-500 ${orderStage >= 2 ? "opacity-100 scale-100" : "opacity-40 scale-95"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 z-10 bg-white shadow-sm ${orderStage >= 2 ? "border-green-500 text-green-500" : "border-slate-300 text-slate-300"}`}
                    >
                      <CheckCircle2 size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <div
                        className={`font-black text-lg ${orderStage >= 2 ? "text-slate-800" : "text-slate-500"}`}
                      >
                        آماده تحویل
                      </div>
                      {orderStage === 2 && (
                        <div className="text-sm font-bold text-green-500 mt-1">
                          نوش جان!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 5. تعرفه‌ها (Pricing) */}
      {/* ========================================== */}
      <section
        id="pricing"
        className="py-24 px-6 relative bg-white border-t border-slate-100"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-6">
              پلن مناسب خود را انتخاب کنید
            </h2>

            <div className="inline-flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <button
                onClick={() => setBillingCycle("3mo")}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === "3mo" ? "bg-white text-orange-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                ۳ ماهه
              </button>
              <button
                onClick={() => setBillingCycle("6mo")}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === "6mo" ? "bg-white text-orange-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                ۶ ماهه
              </button>
              <button
                onClick={() => setBillingCycle("9mo")}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === "9mo" ? "bg-white text-orange-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
              >
                ۹ ماهه
                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                  ویژه
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* پایه */}
            <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                پلن پایه
              </h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                کافه‌های کوچک
              </p>
              <div className="mb-8 border-b border-slate-100 pb-6">
                <span className="text-4xl font-black text-slate-900">
                  {billingCycle === "3mo"
                    ? "۴۵۰"
                    : billingCycle === "6mo"
                      ? "۸۰۰"
                      : "۱,۱۰۰"}
                </span>
              </div>
              <ul className="space-y-4 mb-10 text-slate-600 font-bold">
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-orange-500" /> ثبت تا ۵۰ آیتم
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-orange-500" /> یک قالب
                  پیش‌فرض
                </li>
              </ul>
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-xl font-black transition-colors">
                انتخاب پایه
              </button>
            </div>

            {/* استاندارد */}
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3rem] shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 py-1.5 rounded-full text-sm font-black shadow-lg">
                محبوب‌ترین
              </div>
              <h3 className="text-2xl font-black text-white mb-2">استاندارد</h3>
              <p className="text-slate-400 text-sm mb-6 font-medium">
                رستوران‌های رو به رشد
              </p>
              <div className="mb-8 border-b border-slate-800 pb-6">
                <span className="text-5xl font-black text-white">
                  {billingCycle === "3mo"
                    ? "۷۵۰"
                    : billingCycle === "6mo"
                      ? "۱,۴۰۰"
                      : "۲,۰۰۰"}
                </span>
              </div>
              <ul className="space-y-4 mb-10 text-white font-bold">
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-amber-400" /> آیتم نامحدود
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-amber-400" /> شخصی‌سازی رنگ
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-amber-400" /> درگاه پرداخت
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:scale-105 text-white py-4 rounded-xl font-black transition-all shadow-lg">
                شروع استاندارد
              </button>
            </div>

            {/* پلاس */}
            <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                پلن پلاس
              </h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                فودکورت‌ها
              </p>
              <div className="mb-8 border-b border-slate-100 pb-6">
                <span className="text-4xl font-black text-slate-900">
                  {billingCycle === "3mo"
                    ? "۱,۲۰۰"
                    : billingCycle === "6mo"
                      ? "۲,۲۰۰"
                      : "۳,۱۰۰"}
                </span>
              </div>
              <ul className="space-y-4 mb-10 text-slate-600 font-bold">
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-orange-500" /> تمام امکانات
                </li>
                <li className="flex items-center gap-3">
                  <Check size={20} className="text-orange-500" /> پنل آشپزخانه
                  (KDS)
                </li>
              </ul>
              <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-xl font-black transition-colors">
                انتخاب پلاس
              </button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};
