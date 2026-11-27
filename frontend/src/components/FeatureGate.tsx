import React from "react";
import { Link } from "react-router-dom";
import { Lock, Crown, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import {
  useSubscription,
  type FeatureKey,
  type PlanTier,
} from "../context/SubscriptionContext";

interface FeatureGateProps {
  feature: FeatureKey;
  requiredTier?: Exclude<PlanTier, "none">;
  title: string;
  description: string;
  children: React.ReactNode;
}

const TIER_NAMES: Record<Exclude<PlanTier, "none">, string> = {
  basic: "پایه",
  standard: "استاندارد",
  plus: "پلاس",
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier = "plus",
  title,
  description,
  children,
}) => {
  const { can, isLoading, subscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (can(feature)) {
    return <>{children}</>;
  }

  const tierName = TIER_NAMES[requiredTier];

  return (
    <div
      dir="rtl"
      className="min-h-[75vh] flex items-center justify-center p-4 sm:p-8"
    >
      <div className="max-w-lg w-full bg-white/95 backdrop-blur-2xl border border-white rounded-[36px] p-8 sm:p-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="w-20 h-20 rounded-[26px] bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/25 relative">
          <Crown size={36} />
          <span className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-slate-900 text-white border-4 border-white flex items-center justify-center">
            <Lock size={13} />
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-orange-600 text-xs font-black mb-3">
          <Sparkles size={13} />
          ویژه پلن {tierName}
        </span>

        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {title}
        </h2>

        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
          {description}
        </p>

        <div className="bg-[#F5F5F7] rounded-2xl p-3.5 text-xs font-bold text-slate-600 mb-7">
          {!subscription.hasActiveSubscription
            ? subscription.isRevoked
              ? "اشتراک فعلی شما غیرفعال (خلع) شده است."
              : "اشتراک فعلی شما منقضی شده است."
            : `پلن فعلی شما «${subscription.tierLabel}» است. با ارتقا به پلن «${tierName}» این بخش بلافاصله فعال می‌شود.`}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/subscription"
            className="bg-slate-900 hover:bg-orange-500 text-white px-7 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <span>مشاهده پلن‌ها و ارتقا</span>
            <ArrowLeft size={17} />
          </Link>

          <Link
            to="/dashboard"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center transition-colors"
          >
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeatureGate;
