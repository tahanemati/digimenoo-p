import { QrCode, MapPin, Phone, AtSign, Send, Mail } from "lucide-react";
import { motion } from "framer-motion";

// تنظیمات انیمیشن ستون‌ها
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // فاصله زمانی ظاهر شدن هر ستون
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export const LandingFooter = () => {
  return (
    <footer
      className="bg-slate-950 text-slate-400 pt-24 pb-12 mt-20 rounded-t-[3rem] border-t border-slate-800 overflow-hidden relative"
      dir="rtl"
    >
      {/* افکت نوری متحرک پس‌زمینه فوتر */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 border-b border-slate-800/80 pb-16"
        >
          {/* ستون اول: درباره ما */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <QrCode className="text-white" size={22} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                دیجی<span className="text-indigo-500">منو</span>
              </span>
            </div>
            <p className="text-sm leading-loose text-slate-400 font-medium mb-6 text-justify">
              دیجی‌منو پلتفرم جامع ساخت منوی دیجیتال و مدیریت زنده سفارشات است
              که با هدف هوشمندسازی کافه‌ها، رستوران‌ها و فودکورت‌ها توسعه یافته
              است.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:scale-110 transition-all duration-300"
              >
                <AtSign size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:scale-110 transition-all duration-300"
              >
                <Send size={18} />
              </a>
            </div>
          </motion.div>

          {/* ستون دوم: دسترسی سریع */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-black text-lg mb-6 relative inline-block">
              دسترسی سریع
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-indigo-600 rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-sm font-medium mt-4">
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-indigo-400 hover:pr-2 transition-all duration-300 inline-block"
                >
                  نحوه کارکرد سیستم
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-indigo-400 hover:pr-2 transition-all duration-300 inline-block"
                >
                  تعرفه‌ها و اشتراک‌ها
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-indigo-400 hover:pr-2 transition-all duration-300 inline-block"
                >
                  سوالات متداول (FAQ)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-indigo-400 hover:pr-2 transition-all duration-300 inline-block"
                >
                  وبلاگ و آموزش‌ها
                </a>
              </li>
            </ul>
          </motion.div>

          {/* ستون سوم: تماس با ما */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-black text-lg mb-6 relative inline-block">
              ارتباط با ما
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-indigo-600 rounded-full"></span>
            </h3>
            <ul className="space-y-4 text-sm font-medium mt-4">
              <li className="flex items-start gap-3 group">
                <MapPin
                  size={18}
                  className="text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                />
                <span className="leading-relaxed">
                  تهران، پارک فناوری پردیس، ساختمان نوآوری، طبقه ۳، واحد ۳۴
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone
                  size={18}
                  className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform"
                />
                <span
                  dir="ltr"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  ۰۲۱ - ۹۱۰۰ ۸۸ ۷۷
                </span>
              </li>
              <li className="flex items-center gap-3 group">
                <Mail
                  size={18}
                  className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform"
                />
                <span
                  dir="ltr"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  hello@digimenoo.ir
                </span>
              </li>
            </ul>
          </motion.div>

          {/* ستون چهارم: مجوزها (اینماد) */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-black text-lg mb-6 relative inline-block">
              مجوزهای قانونی
              <span className="absolute -bottom-2 right-0 w-1/2 h-1 bg-indigo-600 rounded-full"></span>
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors group mt-4">
              <p className="text-xs text-slate-400 mb-4 font-bold">
                نماد اعتماد الکترونیکی
              </p>
              {/* جایگاه تصویر اینماد */}
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 cursor-pointer p-2 relative overflow-hidden">
                <img
                  src="https://trustseal.enamad.ir/logo.aspx?id=example"
                  alt="eNamad"
                  className="w-full h-full object-contain opacity-90 hover:opacity-100 z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.classList.add(
                      "bg-slate-200",
                    );
                  }}
                />
                <span className="text-slate-800 font-bold text-xs text-center absolute">
                  جایگاه
                  <br />
                  اینماد
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* کپی‌رایت با انیمیشن تاخیری */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500"
        >
          <p>
            © ۲۰۲۶ - تمامی حقوق مادی و معنوی برای پلتفرم دیجی‌منو (DigiMenoo)
            محفوظ است.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">
              قوانین و مقررات
            </a>
            <a href="#" className="hover:text-indigo-400 transition-colors">
              حریم خصوصی
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
