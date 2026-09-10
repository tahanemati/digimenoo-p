import { QrCode, MapPin, Phone, AtSign, Send, Mail } from "lucide-react";

export const LandingFooter = () => {
  return (
    <footer
      className="bg-zinc-950 text-zinc-400 pt-24 pb-12 mt-20 rounded-t-[3rem] border-t border-zinc-800 overflow-hidden relative"
      dir="rtl"
    >
      {/* افکت نوری پس زمینه فوتر */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 border-b border-zinc-800/50 pb-16">
          {/* ستون اول: درباره ما */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <QrCode className="text-white" size={22} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Risto<span className="text-emerald-500">Pay</span>
              </span>
            </div>
            <p className="text-sm leading-loose text-zinc-400 font-medium mb-6 text-justify">
              میزینو (ریستوپی) پلتفرم جامع ساخت منوی دیجیتال و مدیریت سفارشات
              روی میز است که با هدف هوشمندسازی کافه‌ها و رستوران‌ها توسعه یافته
              است.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
              >
                <AtSign size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
              >
                <Send size={18} />
              </a>
            </div>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div>
            <h3 className="text-white font-black text-lg mb-6">دسترسی سریع</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-emerald-400 transition-colors"
                >
                  نحوه کارکرد سیستم
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-emerald-400 transition-colors"
                >
                  تعرفه‌ها و اشتراک‌ها
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  سوالات متداول (FAQ)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  وبلاگ و آموزش‌ها
                </a>
              </li>
            </ul>
          </div>

          {/* ستون سوم: تماس با ما */}
          <div>
            <h3 className="text-white font-black text-lg mb-6">ارتباط با ما</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <span className="leading-relaxed">
                  تهران، پارک فناوری پردیس، ساختمان نوآوری، طبقه ۳، واحد ۳۴
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <span dir="ltr">۰۲۱ - ۹۱۰۰ ۸۸ ۷۷</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-emerald-500 shrink-0" />
                <span dir="ltr">hello@ristopay.ir</span>
              </li>
            </ul>
          </div>

          {/* ستون چهارم: مجوزها (اینماد) */}
          <div>
            <h3 className="text-white font-black text-lg mb-6">
              مجوزهای قانونی
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center justify-center backdrop-blur-sm hover:bg-white/10 transition-colors group">
              <p className="text-xs text-zinc-400 mb-4 font-bold">
                نماد اعتماد الکترونیکی
              </p>
              {/* جایگاه تصویر اینماد */}
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform cursor-pointer p-2 relative">
                <img
                  src="https://trustseal.enamad.ir/logo.aspx?id=example"
                  alt="eNamad"
                  className="w-full h-full object-contain opacity-90 hover:opacity-100"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.classList.add("bg-zinc-100");
                  }}
                />
                <span className="text-zinc-800 font-bold text-xs text-center absolute">
                  جایگاه
                  <br />
                  اینماد
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-500">
          <p>
            © ۲۰۲۶ - تمامی حقوق مادی و معنوی برای پلتفرم RistoPay محفوظ است.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              قوانین و مقررات
            </a>
            <a href="#" className="hover:text-white transition-colors">
              حریم خصوصی
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
