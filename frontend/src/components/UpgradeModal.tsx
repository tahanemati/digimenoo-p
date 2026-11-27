import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import type {
  PlanTier,
  SubscriptionEntitlements,
  UpgradeModalPayload,
} from "../context/SubscriptionContext";

interface UpgradeModalProps {
  isOpen: boolean;
  payload: UpgradeModalPayload | null;
  currentSubscription: SubscriptionEntitlements;
  onClose: () => void;
}

const TIER_INFO: Record<
  Exclude<PlanTier, "none">,
  {
    name: string;
    badge: string;
    gradient: string;
    highlights: string[];
  }
> = {
  basic: {
    name: "پایه",
    badge: "شروع کار",
    gradient: "from-slate-800 to-slate-900",
    highlights: [
      "دسترسی به ۳ قالب اول منو",
      "پنل زنده آشپزخانه (KDS)",
      "گزارشات مالی و فروش",
      "ساخت بارکد QR اختصاصی میزها",
    ],
  },
  standard: {
    name: "استاندارد",
    badge: "پیشنهاد محبوب",
    gradient: "from-orange-500 to-amber-500",
    highlights: [
      "دسترسی به ۶ قالب اول منو",
      "سفارش‌دهی آنلاین از منو و رزرو میز",
      "منوی دو زبانه (فارسی و انگلیسی)",
      "درخواست گارسون و سرآشپز + KDS و گزارش مالی",
    ],
  },
  plus: {
    name: "پلاس",
    badge: "کامل‌ترین بسته",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    highlights: [
      "دسترسی کامل به هر ۱۵ قالب اختصاصی منو",
      "سیستم تیم‌بندی و تعریف نقش پرسنل",
      "تمامی امکانات پلن استاندارد (رزرو، سفارش، دوزبانه، گارسون و سرآشپز)",
      "پنل زنده آشپزخانه (KDS) و گزارشات مالی",
    ],
  },
};
const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  payload,
  currentSubscription,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const targetTier = payload?.requiredTier || "plus";
  const tierMeta = TIER_INFO[targetTier] || TIER_INFO.plus;
  const isInactive = !currentSubscription.hasActiveSubscription;

  const title =
    payload?.title ||
    (isInactive
      ? currentSubscription.isRevoked
        ? "اشتراک مجموعه غیرفعال شده است"
        : "اشتراک مجموعه به پایان رسیده است"
      : `نیازمند ارتقا به پلن ${tierMeta.name}`);

  const message =
    payload?.message ||
    (isInactive
      ? "برای استفاده از امکانات مدیریتی و ویرایش منو، لطفاً اشتراک خود را تمدید یا فعال کنید."
      : `این قابلیت در پلن فعلی شما فعال نیست و از پلن «${tierMeta.name}» به بالا در دسترس می‌باشد.`);

  const handleGoToPlans = () => {
    onClose();
    navigate("/subscription");
  };

  return (
    <div
      onClick={onClose}
      dir="rtl"
      className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[34px] sm:rounded-[34px] p-6 pb-8 shadow-2xl border border-slate-100 relative overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        <div
          className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${
            isInactive ? "from-rose-500 to-orange-500" : tierMeta.gradient
          } text-white flex items-center justify-center shadow-lg mb-5`}
        >
          {isInactive ? <ShieldAlert size={30} /> : <Crown size={30} />}
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-[11px] font-black">
              <Sparkles size={11} />
              پلن {tierMeta.name}
            </span>
            {currentSubscription.hasActiveSubscription && (
              <span className="text-[11px] font-bold text-slate-400">
                پلن فعلی: {currentSubscription.tierLabel}
              </span>
            )}
          </div>

          <h3 className="text-xl font-black text-slate-900 leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="bg-[#F5F5F7] rounded-[24px] p-4 space-y-2.5 mb-6">
          <span className="block text-[11px] font-black text-slate-500 mb-1">
            امکانات پلن {tierMeta.name}:
          </span>
          {tierMeta.highlights.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2.5 text-xs font-bold text-slate-700"
            >
              <CheckCircle2
                size={15}
                className="text-emerald-500 shrink-0"
                strokeWidth={2.5}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleGoToPlans}
            className="flex-1 bg-slate-900 hover:bg-orange-500 text-white py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>مشاهده و ارتقای پلن</span>
            <ArrowLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="sm:w-28 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 px-4 rounded-2xl font-black text-xs transition-colors"
          >
            فعلاً نه
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
