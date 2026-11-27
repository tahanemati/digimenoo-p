import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import { authApi, subscriptionApi, venuesApi } from "../service/api";
import UpgradeModal from "../components/UpgradeModal";

export type PlanTier = "none" | "basic" | "standard" | "plus";

export type FeatureKey =
  | "bilingual"
  | "onlineOrdering"
  | "teamManagement"
  | "callWaiter"
  | "callChef"
  | "reservations"
  | "kitchenPanel"
  | "financialReports"
  | "inventory";

export interface SubscriptionEntitlements {
  hasSubscription: boolean;
  hasActiveSubscription: boolean;
  isActive: boolean;
  isTrial: boolean;
  isRevoked: boolean;
  isExpired: boolean;
  tier: PlanTier;
  tierLabel: string;
  planName: string;
  expireDate: string | null;
  daysRemaining: number;
  maxTemplates: number;
  allowedTemplates: string[];
  features: Record<FeatureKey, boolean>;
}

export interface UpgradeModalPayload {
  title?: string;
  message?: string;
  requiredTier?: Exclude<PlanTier, "none">;
  feature?: string;
}

interface SubscriptionContextValue {
  subscription: SubscriptionEntitlements;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  can: (feature: FeatureKey) => boolean;
  canUseTemplate: (templateCode: string) => boolean;
  getTemplateRequiredTier: (templateCode: string) => Exclude<PlanTier, "none">;
  openUpgradeModal: (payload?: UpgradeModalPayload) => void;
  closeUpgradeModal: () => void;
}

const TIER_LABELS: Record<PlanTier, string> = {
  none: "بدون اشتراک فعال",
  basic: "پایه",
  standard: "استاندارد",
  plus: "پلاس",
};

const TIER_FALLBACK_SPECS: Record<
  PlanTier,
  {
    maxTemplates: number;
    allowedTemplates: string[];
    features: Record<FeatureKey, boolean>;
  }
> = {
  none: {
    maxTemplates: 0,
    allowedTemplates: [],
    features: {
      bilingual: false,
      onlineOrdering: false,
      teamManagement: false,
      callWaiter: false,
      callChef: false,
      reservations: false,
      kitchenPanel: false,
      financialReports: false,
      inventory: false,
    },
  },
  basic: {
    maxTemplates: 3,
    allowedTemplates: ["template_1", "template_2", "template_3"],
    features: {
      bilingual: false,
      onlineOrdering: false,
      teamManagement: false,
      callWaiter: false,
      callChef: false,
      reservations: false,
      kitchenPanel: true,
      financialReports: true,
      inventory: true,
    },
  },
  standard: {
    maxTemplates: 6,
    allowedTemplates: [
      "template_1",
      "template_2",
      "template_3",
      "template_4",
      "template_5",
      "template_6",
    ],
    features: {
      bilingual: true,
      onlineOrdering: true,
      teamManagement: false,
      callWaiter: true,
      callChef: true,
      reservations: true,
      kitchenPanel: true,
      financialReports: true,
      inventory: true,
    },
  },
  plus: {
    maxTemplates: 15,
    allowedTemplates: Array.from({ length: 15 }, (_, i) => `template_${i + 1}`),
    features: {
      bilingual: true,
      onlineOrdering: true,
      teamManagement: true,
      callWaiter: true,
      callChef: true,
      reservations: true,
      kitchenPanel: true,
      financialReports: true,
      inventory: true,
    },
  },
};

const DEFAULT_ENTITLEMENTS: SubscriptionEntitlements = {
  hasSubscription: false,
  hasActiveSubscription: false,
  isActive: false,
  isTrial: false,
  isRevoked: false,
  isExpired: false,
  tier: "none",
  tierLabel: TIER_LABELS.none,
  planName: "",
  expireDate: null,
  daysRemaining: 0,
  ...TIER_FALLBACK_SPECS.none,
};

export const normalizeTemplateCode = (code: unknown): string => {
  const cleaned = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!cleaned) return "template_1";
  if (/^\d+$/.test(cleaned)) return `template_${cleaned}`;
  if (/^template\d+$/.test(cleaned)) {
    return cleaned.replace(/^template(\d+)$/, "template_$1");
  }
  return cleaned;
};

export const resolveTemplateRequiredTier = (
  templateCode: string,
): Exclude<PlanTier, "none"> => {
  const code = normalizeTemplateCode(templateCode);
  const match = code.match(/(\d+)$/);
  const num = match ? parseInt(match[1], 10) : 99;
  if (num <= 3) return "basic";
  if (num <= 6) return "standard";
  return "plus";
};

const normalizeTier = (rawTier: unknown, planName?: unknown): PlanTier => {
  const t = String(rawTier || "")
    .trim()
    .toLowerCase();
  if (t === "basic" || t === "standard" || t === "plus" || t === "none") {
    return t;
  }
  const n = String(planName || "").toLowerCase();
  if (n.includes("پلاس") || n.includes("plus")) return "plus";
  if (n.includes("استاندارد") || n.includes("standard")) return "standard";
  if (n.includes("پایه") || n.includes("basic")) return "basic";
  return "none";
};

const buildNormalizedSubscription = (raw: any): SubscriptionEntitlements => {
  if (!raw || typeof raw !== "object") return DEFAULT_ENTITLEMENTS;

  const isRevoked = Boolean(raw.isRevoked);
  const isTrial = Boolean(raw.isTrial);
  const expireDate: string | null = raw.expireDate || null;
  const computedExpired = expireDate
    ? new Date(expireDate).getTime() <= Date.now()
    : true;
  const isExpired =
    typeof raw.isExpired === "boolean" ? raw.isExpired : computedExpired;

  const hasActiveSubscription =
    typeof raw.hasActiveSubscription === "boolean"
      ? raw.hasActiveSubscription
      : typeof raw.isActive === "boolean"
        ? raw.isActive
        : Boolean(raw.hasSubscription && !isRevoked && !isExpired);

  const rawTier = normalizeTier(raw.tier, raw.planName || raw.name);
  const effectiveTier: PlanTier = hasActiveSubscription
    ? rawTier === "none"
      ? isTrial
        ? "plus"
        : "basic"
      : rawTier
    : "none";

  const fallbackSpec = TIER_FALLBACK_SPECS[effectiveTier];

  const daysRemaining =
    typeof raw.daysRemaining === "number"
      ? Math.max(0, raw.daysRemaining)
      : hasActiveSubscription && expireDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(expireDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

  const allowedTemplates =
    Array.isArray(raw.allowedTemplates) && raw.allowedTemplates.length > 0
      ? raw.allowedTemplates.map(normalizeTemplateCode)
      : fallbackSpec.allowedTemplates;

  const features: Record<FeatureKey, boolean> =
    raw.features && typeof raw.features === "object"
      ? {
          ...fallbackSpec.features,
          ...raw.features,
        }
      : fallbackSpec.features;

  return {
    hasSubscription: Boolean(raw.hasSubscription ?? hasActiveSubscription),
    hasActiveSubscription,
    isActive: hasActiveSubscription,
    isTrial,
    isRevoked,
    isExpired,
    tier: effectiveTier,
    tierLabel: raw.tierLabel || TIER_LABELS[effectiveTier],
    planName: raw.planName || raw.name || "",
    expireDate,
    daysRemaining,
    maxTemplates:
      typeof raw.maxTemplates === "number"
        ? raw.maxTemplates
        : fallbackSpec.maxTemplates,
    allowedTemplates,
    features,
  };
};

export const UPGRADE_EVENT_NAME = "toranj:upgrade-required";

export const triggerGlobalUpgradeModal = (payload: UpgradeModalPayload) => {
  window.dispatchEvent(
    new CustomEvent(UPGRADE_EVENT_NAME, { detail: payload }),
  );
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined,
);

const REFRESH_ROUTES = new Set([
  "/dashboard",
  "/venue-settings",
  "/subscription",
  "/team",
  "/reservations",
  "/kitchen",
  "/financial-reports",
  "/inventory",
]);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [subscription, setSubscription] =
    useState<SubscriptionEntitlements>(DEFAULT_ENTITLEMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradePayload, setUpgradePayload] =
    useState<UpgradeModalPayload | null>(null);

  const refreshSubscription = useCallback(async () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access");

    if (!token || token === "undefined" || token === "null") {
      setSubscription(DEFAULT_ENTITLEMENTS);
      setIsLoading(false);
      return;
    }

    try {
      let subPayload: any = null;

      // ۱. اولویت اول: اندپوینت مستقیم اشتراک
      try {
        const subRes = await subscriptionApi.getCurrentSubscription();
        const data = subRes?.data?.data || subRes?.data || subRes;
        if (
          data &&
          typeof data === "object" &&
          ("tier" in data || "hasSubscription" in data || "expireDate" in data)
        ) {
          subPayload = data;
        }
      } catch {
        // اگر هنوز رستوران ثبت نشده یا خطا داد، سراغ مسیرهای بعدی می‌رویم
      }

      // ۲. اولویت دوم: وضعیت داشبورد (حتی قبل از ثبت رستوران کار می‌کند)
      if (!subPayload) {
        try {
          const statusRes = await authApi.getDashboardStatus();
          const statusData =
            statusRes?.data?.data || statusRes?.data || statusRes;
          if (statusData?.subscription) {
            subPayload = statusData.subscription;
          }
        } catch {
          // ignore
        }
      }

      // ۳. اولویت سوم: اطلاعات رستوران من
      if (!subPayload) {
        const venueRes = await venuesApi.getMyVenue();
        const venueData = venueRes?.data?.data || venueRes?.data || venueRes;
        if (venueData?.subscription) {
          subPayload = venueData.subscription;
        }
      }

      if (subPayload) {
        setSubscription(buildNormalizedSubscription(subPayload));
      }
    } catch {
      // حفظ وضعیت قبلی در صورت خطای شبکه
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  useEffect(() => {
    if (REFRESH_ROUTES.has(location.pathname)) {
      refreshSubscription();
    }
  }, [location.pathname, refreshSubscription]);

  useEffect(() => {
    const handleGlobalUpgrade = (event: Event) => {
      const customEvent = event as CustomEvent<UpgradeModalPayload>;
      setUpgradePayload(customEvent.detail || {});
    };

    window.addEventListener(UPGRADE_EVENT_NAME, handleGlobalUpgrade);
    return () => {
      window.removeEventListener(UPGRADE_EVENT_NAME, handleGlobalUpgrade);
    };
  }, []);

  const can = useCallback(
    (feature: FeatureKey): boolean => {
      if (!subscription.hasActiveSubscription) return false;
      return Boolean(subscription.features?.[feature]);
    },
    [subscription],
  );

  const canUseTemplate = useCallback(
    (templateCode: string): boolean => {
      if (!subscription.hasActiveSubscription) return false;
      const normalized = normalizeTemplateCode(templateCode);
      return subscription.allowedTemplates.includes(normalized);
    },
    [subscription],
  );

  const openUpgradeModal = useCallback((payload: UpgradeModalPayload = {}) => {
    setUpgradePayload(payload);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradePayload(null);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        refreshSubscription,
        can,
        canUseTemplate,
        getTemplateRequiredTier: resolveTemplateRequiredTier,
        openUpgradeModal,
        closeUpgradeModal,
      }}
    >
      {children}
      <UpgradeModal
        isOpen={Boolean(upgradePayload)}
        payload={upgradePayload}
        currentSubscription={subscription}
        onClose={closeUpgradeModal}
      />
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription باید داخل SubscriptionProvider استفاده شود.",
    );
  }
  return ctx;
};
