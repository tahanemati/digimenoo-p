import React, { useState, useEffect } from "react";
import {
  Loader2,
  Store,
  BellRing,
  ChefHat,
  Globe,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Search,
  ShoppingBag,
  RefreshCw,
  MessageSquarePlus,
  Send,
  UtensilsCrossed,
  Sparkles,
  Users,
  User,
  Phone,
  Check,
  AlertCircle,
  MapPin,
  Info,
} from "lucide-react";
import { reservationsApi } from "../../service/api";
import type {
  TemplateProps,
  OrderStageInfo,
  ActiveOrderInfo,
  PublicTableSlot,
} from "./Template1";

const FALLBACK_STAGES: OrderStageInfo[] = [
  {
    id: "pending",
    name: "ثبت سفارش",
    description: "سفارش شما با موفقیت در سیستم ثبت شد",
  },
  {
    id: "preparing",
    name: "در حال آماده‌سازی",
    description: "آشپزخانه مشغول آماده کردن سفارش شماست",
  },
  {
    id: "ready",
    name: "آماده تحویل",
    description: "سفارش آماده است و تا لحظاتی دیگر سرو می‌شود",
  },
];

type CategoryIconType =
  | "all"
  | "coffee"
  | "cold_drink"
  | "burger"
  | "pizza"
  | "kebab"
  | "pasta"
  | "salad"
  | "dessert"
  | "breakfast"
  | "default";

const detectCategory3DType = (cat: any, index: number): CategoryIconType => {
  const label =
    `${cat?.nameFa || ""} ${cat?.nameEn || ""} ${cat?.name || ""}`.toLowerCase();

  if (
    label.includes("قهوه") ||
    label.includes("کافه") ||
    label.includes("گرم") ||
    label.includes("چای") ||
    label.includes("دمنوش") ||
    label.includes("اسپرسو") ||
    label.includes("coffee") ||
    label.includes("hot") ||
    label.includes("tea")
  )
    return "coffee";

  if (
    label.includes("سرد") ||
    label.includes("نوشیدنی") ||
    label.includes("شیک") ||
    label.includes("موکتل") ||
    label.includes("موهیتو") ||
    label.includes("اسموتی") ||
    label.includes("آبمیوه") ||
    label.includes("cold") ||
    label.includes("drink") ||
    label.includes("shake") ||
    label.includes("juice") ||
    label.includes("mocktail")
  )
    return "cold_drink";

  if (
    label.includes("برگر") ||
    label.includes("ساندویچ") ||
    label.includes("سخناری") ||
    label.includes("سوخاری") ||
    label.includes("هات داگ") ||
    label.includes("فست") ||
    label.includes("burger") ||
    label.includes("sandwich")
  )
    return "burger";

  if (label.includes("پیتزا") || label.includes("pizza")) return "pizza";

  if (
    label.includes("کباب") ||
    label.includes("ایرانی") ||
    label.includes("چلو") ||
    label.includes("خورشت") ||
    label.includes("خورش") ||
    label.includes("سنتی") ||
    label.includes("استیک") ||
    label.includes("غذای اصلی") ||
    label.includes("اصلی") ||
    label.includes("kebab") ||
    label.includes("persian") ||
    label.includes("main") ||
    label.includes("grill") ||
    label.includes("steak")
  )
    return "kebab";

  if (
    label.includes("پاستا") ||
    label.includes("ماکارونی") ||
    label.includes("نودل") ||
    label.includes("لازانیا") ||
    label.includes("pasta") ||
    label.includes("noodle")
  )
    return "pasta";

  if (
    label.includes("سالاد") ||
    label.includes("پیش") ||
    label.includes("سوپ") ||
    label.includes("سیب") ||
    label.includes("مزه") ||
    label.includes("salad") ||
    label.includes("starter") ||
    label.includes("appetizer") ||
    label.includes("soup") ||
    label.includes("fries")
  )
    return "salad";

  if (
    label.includes("دسر") ||
    label.includes("کیک") ||
    label.includes("بستنی") ||
    label.includes("وافل") ||
    label.includes("شیرینی") ||
    label.includes("تارت") ||
    label.includes("dessert") ||
    label.includes("cake") ||
    label.includes("ice") ||
    label.includes("sweet")
  )
    return "dessert";

  if (
    label.includes("صبحانه") ||
    label.includes("املت") ||
    label.includes("کرواسان") ||
    label.includes("breakfast") ||
    label.includes("brunch")
  )
    return "breakfast";

  const fallbacks: CategoryIconType[] = [
    "default",
    "burger",
    "coffee",
    "pizza",
    "kebab",
    "cold_drink",
    "salad",
    "dessert",
    "pasta",
  ];
  return fallbacks[index % fallbacks.length];
};

const ICON_TILE_BG: Record<CategoryIconType, string> = {
  all: "from-orange-50 to-amber-100/80 border-orange-200/60",
  coffee: "from-amber-50 to-orange-100/80 border-amber-200/60",
  cold_drink: "from-sky-50 to-cyan-100/80 border-sky-200/60",
  burger: "from-orange-50 to-rose-100/70 border-orange-200/60",
  pizza: "from-yellow-50 to-orange-100/80 border-amber-200/60",
  kebab: "from-red-50 to-amber-100/70 border-red-200/50",
  pasta: "from-amber-50 to-red-100/70 border-amber-200/60",
  salad: "from-emerald-50 to-lime-100/80 border-emerald-200/60",
  dessert: "from-pink-50 to-rose-100/80 border-pink-200/60",
  breakfast: "from-yellow-50 to-amber-100/80 border-yellow-200/60",
  default: "from-slate-50 to-zinc-200/70 border-slate-200/80",
};

// آیکون‌های سه‌بعدی اختصاصی (سبک Apple 3D Clay / Glossy) بدون وابستگی به عکس محصول یا CDN
const Category3DIcon: React.FC<{
  type: CategoryIconType;
  uid: string;
}> = ({ type, uid }) => {
  const id = `t4-3d-${type}-${uid}`;

  switch (type) {
    case "all":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(234,88,12,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id={`${id}-2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id={`${id}-3`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id={`${id}-4`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect
            x="6"
            y="6"
            width="16"
            height="16"
            rx="5.5"
            fill={`url(#${id}-1)`}
          />
          <rect
            x="8"
            y="8"
            width="6"
            height="3"
            rx="1.5"
            fill="#fff"
            fillOpacity="0.45"
          />
          <rect
            x="26"
            y="6"
            width="16"
            height="16"
            rx="5.5"
            fill={`url(#${id}-2)`}
          />
          <rect
            x="28"
            y="8"
            width="6"
            height="3"
            rx="1.5"
            fill="#fff"
            fillOpacity="0.5"
          />
          <rect
            x="6"
            y="26"
            width="16"
            height="16"
            rx="5.5"
            fill={`url(#${id}-3)`}
          />
          <rect
            x="8"
            y="28"
            width="6"
            height="3"
            rx="1.5"
            fill="#fff"
            fillOpacity="0.4"
          />
          <rect
            x="26"
            y="26"
            width="16"
            height="16"
            rx="5.5"
            fill={`url(#${id}-4)`}
          />
          <rect
            x="28"
            y="28"
            width="6"
            height="3"
            rx="1.5"
            fill="#fff"
            fillOpacity="0.45"
          />
        </svg>
      );

    case "coffee":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(120,53,15,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="60%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id={`${id}-sleeve`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <path
            d="M18 11 C17 7, 21 6, 20 3"
            stroke="#FB923C"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M27 11 C26 7, 30 6, 29 3"
            stroke="#FB923C"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          <path
            d="M12 18 L36 18 L33 41 C32.7 43 31 44 29 44 L19 44 C17 44 15.3 43 15 41 Z"
            fill={`url(#${id}-cup)`}
          />
          <path d="M13 24 L35 24 L34 35 L14 35 Z" fill={`url(#${id}-sleeve)`} />
          <circle cx="24" cy="29.5" r="3.4" fill="#FDBA74" />
          <rect
            x="10"
            y="14"
            width="28"
            height="5"
            rx="2.5"
            fill={`url(#${id}-lid)`}
          />
          <rect x="13" y="11" width="22" height="4" rx="2" fill="#F8FAFC" />
          <path
            d="M16 20 L18 40"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      );

    case "cold_drink":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(2,132,199,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-liq`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="55%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id={`${id}-lime`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#BEF264" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>
          <path
            d="M28 5 L24 22"
            stroke="#FB7185"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M28 5 L35 5"
            stroke="#FB7185"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="34" cy="17" r="7" fill={`url(#${id}-lime)`} />
          <circle cx="34" cy="17" r="4.5" fill="#ECFCCB" opacity="0.7" />
          <path
            d="M13 15 L35 15 L32 41 C31.7 43 30 44 28 44 L20 44 C18 44 16.3 43 16 41 Z"
            fill={`url(#${id}-liq)`}
          />
          <ellipse cx="24" cy="15" rx="11" ry="3.2" fill="#E0F2FE" />
          <rect
            x="18"
            y="21"
            width="6"
            height="6"
            rx="1.8"
            fill="#FFFFFF"
            fillOpacity="0.45"
            transform="rotate(-12 21 24)"
          />
          <rect
            x="24"
            y="27"
            width="5.5"
            height="5.5"
            rx="1.6"
            fill="#FFFFFF"
            fillOpacity="0.35"
            transform="rotate(14 26 29)"
          />
          <path
            d="M17 19 L19 39"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );

    case "burger":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(234,88,12,0.3)]"
        >
          <defs>
            <linearGradient id={`${id}-bun`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id={`${id}-meat`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9A3412" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          <path
            d="M9 22 C9 12, 16 8, 24 8 C32 8, 39 12, 39 22 Z"
            fill={`url(#${id}-bun)`}
          />
          <ellipse cx="18" cy="13.5" rx="1.5" ry="0.9" fill="#FEF3C7" />
          <ellipse cx="24" cy="12" rx="1.6" ry="0.9" fill="#FEF3C7" />
          <ellipse cx="30" cy="14" rx="1.5" ry="0.9" fill="#FEF3C7" />
          <path
            d="M14 14 C18 11, 23 11, 27 12"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
            fill="none"
          />
          <path
            d="M7 23 Q12 20 17 23 T27 23 T37 23 Q40 21 41 24 L40 27 L8 27 Z"
            fill="#22C55E"
          />
          <path d="M8 25 L40 25 L36 32 L28 28 L20 33 L12 28 Z" fill="#FACC15" />
          <rect
            x="8"
            y="28"
            width="32"
            height="7"
            rx="3.5"
            fill={`url(#${id}-meat)`}
          />
          <path
            d="M10 35 L38 35 C38 40, 35 42, 30 42 L18 42 C13 42, 10 40, 10 35 Z"
            fill={`url(#${id}-bun)`}
          />
        </svg>
      );

    case "pizza":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(217,119,6,0.3)]"
        >
          <defs>
            <linearGradient id={`${id}-cheese`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="65%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id={`${id}-crust`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
          </defs>
          <path
            d="M9 14 Q24 5 39 14 L36 19 Q24 12 12 19 Z"
            fill={`url(#${id}-crust)`}
          />
          <path d="M12 17 Q24 11 36 17 L24 43 Z" fill={`url(#${id}-cheese)`} />
          <circle cx="21" cy="22" r="3.4" fill="#DC2626" />
          <circle cx="20" cy="21" r="1" fill="#FCA5A5" opacity="0.7" />
          <circle cx="28" cy="25" r="3.2" fill="#DC2626" />
          <circle cx="27" cy="24" r="0.9" fill="#FCA5A5" opacity="0.7" />
          <circle cx="23.5" cy="32.5" r="2.9" fill="#DC2626" />
          <ellipse
            cx="25"
            cy="18.5"
            rx="2.4"
            ry="1.3"
            fill="#16A34A"
            transform="rotate(-18 25 18.5)"
          />
        </svg>
      );

    case "kebab":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(180,83,9,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id={`${id}-rice`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id={`${id}-skewer`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
          </defs>
          <ellipse cx="24" cy="34" rx="19" ry="9" fill={`url(#${id}-plate)`} />
          <ellipse cx="24" cy="33" rx="15" ry="6.2" fill="#F8FAFC" />
          <path d="M12 32 C13 21, 33 21, 35 32 Z" fill={`url(#${id}-rice)`} />
          <rect
            x="11"
            y="21"
            width="26"
            height="6.5"
            rx="3.2"
            fill={`url(#${id}-skewer)`}
            transform="rotate(-14 24 24)"
          />
          <circle cx="34" cy="29" r="4.2" fill="#EF4444" />
          <circle cx="32.8" cy="27.8" r="1.2" fill="#FECACA" opacity="0.8" />
          <path
            d="M19 14 C18 11, 21 10, 20 7"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M27 13 C26 10, 29 9, 28 6"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </svg>
      );

    case "pasta":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(220,38,38,0.25)]"
        >
          <defs>
            <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id={`${id}-noodle`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <path d="M10 25 C12 13, 36 13, 38 25 Z" fill={`url(#${id}-noodle)`} />
          <path
            d="M14 22 Q24 15 34 22"
            stroke="#FEF9C3"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="24" cy="18" r="5" fill="#DC2626" />
          <ellipse
            cx="28"
            cy="14"
            rx="4"
            ry="2.1"
            fill="#22C55E"
            transform="rotate(-25 28 14)"
          />
          <path
            d="M7 24 L41 24 C40 36, 33 41, 24 41 C15 41, 8 36, 7 24 Z"
            fill={`url(#${id}-bowl)`}
          />
          <path
            d="M12 28 C14 34, 18 37, 23 38"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />
        </svg>
      );

    case "salad":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(22,163,74,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
          </defs>
          <circle cx="17" cy="21" r="8" fill={`url(#${id}-leaf)`} />
          <circle cx="31" cy="21" r="8" fill="#22C55E" />
          <circle cx="24" cy="17" r="8.5" fill="#4ADE80" />
          <circle cx="19" cy="18" r="3.4" fill="#EF4444" />
          <circle cx="29" cy="19" r="3.2" fill="#FACC15" />
          <circle cx="24" cy="13.5" r="2.8" fill="#EF4444" />
          <path
            d="M8 24 L40 24 C39 36, 33 41, 24 41 C15 41, 9 36, 8 24 Z"
            fill={`url(#${id}-bowl)`}
          />
          <path
            d="M13 28 C15 33, 19 36, 23 37"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.35"
            fill="none"
          />
        </svg>
      );

    case "dessert":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(219,39,119,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-cream`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBCFE8" />
              <stop offset="55%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="10" r="4.2" fill="#E11D48" />
          <circle cx="22.8" cy="8.8" r="1.2" fill="#FDA4AF" />
          <path
            d="M11 26 C11 17, 17 13, 24 13 C31 13, 37 17, 37 26 Z"
            fill={`url(#${id}-cream)`}
          />
          <path
            d="M15 21 C18 17, 23 16, 27 17"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.45"
            fill="none"
          />
          <path
            d="M12 26 L36 26 L32.5 41 C32 42.5 30.5 43.5 28.5 43.5 L19.5 43.5 C17.5 43.5 16 42.5 15.5 41 Z"
            fill={`url(#${id}-base)`}
          />
          <line
            x1="20"
            y1="27"
            x2="21"
            y2="42"
            stroke="#B45309"
            strokeWidth="1.4"
            opacity="0.4"
          />
          <line
            x1="28"
            y1="27"
            x2="27"
            y2="42"
            stroke="#B45309"
            strokeWidth="1.4"
            opacity="0.4"
          />
        </svg>
      );

    case "breakfast":
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(202,138,4,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-white`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <radialGradient id={`${id}-yolk`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </radialGradient>
          </defs>
          <path
            d="M14 13 C20 7, 32 8, 37 16 C42 24, 39 36, 30 39 C22 42, 11 39, 9 30 C7 22, 9 17, 14 13 Z"
            fill={`url(#${id}-white)`}
          />
          <circle cx="25" cy="24" r="9" fill={`url(#${id}-yolk)`} />
          <ellipse
            cx="22"
            cy="20.5"
            rx="2.6"
            ry="1.4"
            fill="#FFFFFF"
            fillOpacity="0.65"
            transform="rotate(-25 22 20.5)"
          />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 48 48"
          className="w-7 h-7 drop-shadow-[0_4px_6px_rgba(71,85,105,0.28)]"
        >
          <defs>
            <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id={`${id}-tray`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="13" r="3.4" fill="#F59E0B" />
          <path
            d="M9 32 C9 21, 15.5 15, 24 15 C32.5 15, 39 21, 39 32 Z"
            fill={`url(#${id}-dome)`}
          />
          <path
            d="M14 26 C15.5 21, 19.5 18.5, 24 18"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.7"
            fill="none"
          />
          <rect
            x="6"
            y="32"
            width="36"
            height="5"
            rx="2.5"
            fill={`url(#${id}-tray)`}
          />
        </svg>
      );
  }
};

const Template4: React.FC<TemplateProps> = ({
  venueData,
  menuData,
  tableNumber,
  language,
  setLanguage,
  cart,
  addToCart,
  removeFromCart,
  updateItemNotes,
  submitOrder,
  checkOrderStatus,
  getOrderWsUrl,
  callWaiter,
  callChef,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(
    null,
  );
  const [modalNoteText, setModalNoteText] = useState("");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});

  const [waiterModal, setWaiterModal] = useState(false);
  const [chefModal, setChefModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // سیستم رزرو آنلاین میزها
  const [reserveModal, setReserveModal] = useState(false);
  const [tablesList, setTablesList] = useState<PublicTableSlot[]>(() => {
    if (Array.isArray(venueData?.tablesStatus?.tables)) {
      return venueData.tablesStatus.tables;
    }
    const count = Number(
      venueData?.tableCount ??
        venueData?.TableCount ??
        venueData?.table_count ??
        0,
    );
    if (count > 0) {
      return Array.from({ length: count }, (_, idx) => ({
        tableNumber: idx + 1,
        state: "available",
      }));
    }
    return [];
  });
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [selectedReserveTable, setSelectedReserveTable] = useState<
    number | null
  >(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveMobile, setReserveMobile] = useState("");
  const [reserveGuests, setReserveGuests] = useState<number>(2);
  const [reserveTime, setReserveTime] = useState("");
  const [reserveNotes, setReserveNotes] = useState("");
  const [reserveError, setReserveError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<{
    tableNumber: number;
    customerName: string;
    customerMobile: string;
    guestsCount: number;
    reservationTime: string;
  } | null>(null);

  const [venueStages, setVenueStages] = useState<OrderStageInfo[]>(() =>
    Array.isArray(venueData?.kitchenStages) &&
    venueData.kitchenStages.length > 0
      ? venueData.kitchenStages
      : FALLBACK_STAGES,
  );

  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isRefreshingOrder, setIsRefreshingOrder] = useState(false);

  const isFa = language === "fa";

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3200);
  };

  useEffect(() => {
    if (
      Array.isArray(venueData?.kitchenStages) &&
      venueData.kitchenStages.length > 0
    ) {
      setVenueStages(venueData.kitchenStages);
    }
  }, [venueData?.kitchenStages]);

  const fetchPublicTables = async () => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;
    setIsLoadingTables(true);
    try {
      const res = await reservationsApi.getPublicTables(slug);
      const data = res?.data?.data || res?.data || res;
      if (Array.isArray(data?.tables)) {
        setTablesList(data.tables);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchPublicTables();
  }, [venueData?.slug, venueData?.Slug]);

  // اتصال WebSocket منو (مراحل پخت + وضعیت لحظه‌ای میزها)
  useEffect(() => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;

    const wsUrl = `ws://localhost:5000/ws/menu/${encodeURIComponent(slug)}/`;
    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (
            payload?.event === "stages_updated" &&
            Array.isArray(payload?.data?.stages) &&
            payload.data.stages.length > 0
          ) {
            setVenueStages(payload.data.stages);
            setActiveOrder((prev) =>
              prev ? { ...prev, stages: payload.data.stages } : prev,
            );
          } else if (
            payload?.event === "tables_updated" &&
            Array.isArray(payload?.data?.tables)
          ) {
            const updatedTables: PublicTableSlot[] = payload.data.tables;
            setTablesList(updatedTables);

            setSelectedReserveTable((prevSelected) => {
              if (!prevSelected) return null;
              const found = updatedTables.find(
                (t) => t.tableNumber === prevSelected,
              );
              if (found && found.state !== "available") {
                setReserveError(
                  isFa
                    ? `میز شماره ${prevSelected} لحظاتی پیش رزرو شد. لطفاً میز دیگری انتخاب کنید.`
                    : `Table #${prevSelected} was just taken. Please pick another table.`,
                );
                return null;
              }
              return prevSelected;
            });
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, [venueData?.slug, venueData?.Slug, isFa]);

  // اتصال WebSocket پیگیری سفارش فعال
  useEffect(() => {
    if (!activeOrder?.id || !getOrderWsUrl) return;
    if (String(activeOrder.status).toLowerCase() === "completed") return;

    let ws: WebSocket | null = null;
    let isUnmounted = false;

    try {
      ws = new WebSocket(getOrderWsUrl(activeOrder.id));
      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.event === "order_updated" && payload?.data) {
            const d = payload.data;
            if (Array.isArray(d.stages) && d.stages.length > 0) {
              setVenueStages(d.stages);
            }
            setActiveOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: String(d.status || prev.status),
                    stageId: String(d.stageId || prev.stageId || ""),
                    stages:
                      Array.isArray(d.stages) && d.stages.length > 0
                        ? d.stages
                        : prev.stages,
                  }
                : prev,
            );
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      isUnmounted = true;
      if (ws) ws.close();
    };
  }, [activeOrder?.id, activeOrder?.status, getOrderWsUrl]);

  const openProductShowcase = (prod: any) => {
    const existing = cart.find((c) => c.product?.id === prod?.id);
    setModalNoteText(existing?.notes || "");
    setSelectedProductModal(prod);
  };

  const openReservationModal = () => {
    setConfirmedReservation(null);
    setReserveError("");
    setReserveModal(true);
    fetchPublicTables();
  };

  const handleCustomerReserve = async () => {
    const slug = venueData?.slug || venueData?.Slug;
    if (!slug) return;

    if (!selectedReserveTable) {
      setReserveError(
        isFa
          ? "لطفاً ابتدا یک میز آزاد را انتخاب کنید."
          : "Please select an available table first.",
      );
      return;
    }
    if (reserveName.trim().length < 2) {
      setReserveError(
        isFa
          ? "لطفاً نام و نام خانوادگی خود را وارد کنید."
          : "Please enter your full name.",
      );
      return;
    }
    if (reserveMobile.trim().length < 10) {
      setReserveError(
        isFa
          ? "لطفاً شماره تماس معتبر وارد کنید."
          : "Please enter a valid mobile number.",
      );
      return;
    }

    setIsReserving(true);
    setReserveError("");
    try {
      await reservationsApi.createPublicReservation({
        restaurantSlug: slug,
        tableNumber: selectedReserveTable,
        customerName: reserveName.trim(),
        customerMobile: reserveMobile.trim(),
        guestsCount: reserveGuests,
        reservationTime: reserveTime.trim(),
        notes: reserveNotes.trim(),
      });

      setConfirmedReservation({
        tableNumber: selectedReserveTable,
        customerName: reserveName.trim(),
        customerMobile: reserveMobile.trim(),
        guestsCount: reserveGuests,
        reservationTime: reserveTime.trim(),
      });

      setSelectedReserveTable(null);
      setReserveName("");
      setReserveMobile("");
      setReserveTime("");
      setReserveNotes("");
      fetchPublicTables();

      showToast(
        isFa ? "رزرو میز با موفقیت ثبت شد!" : "Table reservation confirmed!",
      );
    } catch (err: any) {
      setReserveError(
        err?.message ||
          (isFa
            ? "خطا در ثبت رزرو میز. لطفاً دوباره تلاش کنید."
            : "Failed to reserve table."),
      );
    } finally {
      setIsReserving(false);
    }
  };

  const dynamicStages: OrderStageInfo[] =
    Array.isArray(activeOrder?.stages) && activeOrder.stages.length > 0
      ? activeOrder.stages
      : venueStages;

  const getActiveStageIndex = () => {
    if (!activeOrder) return 0;
    const statusStr = String(activeOrder.status || "").toLowerCase();
    if (statusStr === "completed") return dynamicStages.length;

    if (activeOrder.stageId) {
      const idx = dynamicStages.findIndex(
        (s) => String(s.id) === String(activeOrder.stageId),
      );
      if (idx >= 0) return idx;
    }

    if (statusStr === "ready") return Math.max(0, dynamicStages.length - 1);
    if (statusStr === "preparing") return dynamicStages.length > 1 ? 1 : 0;
    return 0;
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0,
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleCall = async (type: "waiter" | "chef") => {
    if (isProcessing) return;
    setIsProcessing(true);
    const success =
      type === "waiter" ? await callWaiter(message) : await callChef(message);
    setIsProcessing(false);
    if (success) {
      setWaiterModal(false);
      setChefModal(false);
      setMessage("");
      showToast(
        isFa ? "درخواست شما با موفقیت ارسال شد." : "Request sent successfully.",
      );
    } else {
      showToast(isFa ? "خطا در ارسال درخواست." : "Failed to send request.");
    }
  };

  const handleOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await submitOrder(customerName, "");
      if (result) {
        const orderStages =
          Array.isArray(result.stages) && result.stages.length > 0
            ? result.stages
            : venueStages;

        if (Array.isArray(result.stages) && result.stages.length > 0) {
          setVenueStages(result.stages);
        }

        const normalizedOrder: ActiveOrderInfo =
          typeof result === "object"
            ? {
                id: String(result.id || ""),
                orderNumber: Number(result.orderNumber || 1001),
                status: String(result.status || "pending"),
                stageId: String(result.stageId || orderStages[0]?.id || ""),
                stages: orderStages,
                totalPrice: Number(result.totalPrice || totalPrice),
              }
            : {
                id: String(result),
                orderNumber: Number(result) || 1001,
                status: "pending",
                stages: orderStages,
                totalPrice,
              };

        setIsCartOpen(false);
        setActiveOrder(normalizedOrder);
        setIsTrackerOpen(true);
        showToast(
          isFa
            ? `سفارش #${normalizedOrder.orderNumber} ثبت شد!`
            : `Order #${normalizedOrder.orderNumber} placed!`,
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshOrder = async () => {
    if (!activeOrder?.id || !checkOrderStatus || isRefreshingOrder) return;
    setIsRefreshingOrder(true);
    const latest = await checkOrderStatus(activeOrder.id);
    if (latest) {
      if (Array.isArray(latest.stages) && latest.stages.length > 0) {
        setVenueStages(latest.stages);
      }
      setActiveOrder(latest);
    }
    setIsRefreshingOrder(false);
  };

  const safeVenueName = venueData?.name || venueData?.Name || "کافه و رستوران";
  const safeLogo = venueData?.logoUrl || venueData?.LogoUrl || "";
  const safeAboutFa = venueData?.aboutUsFa || venueData?.AboutUsFa || "";
  const safeAboutEn = venueData?.aboutUsEn || venueData?.AboutUsEn || "";
  const safeAddress = venueData?.address || venueData?.Address || "";
  const safePhone = venueData?.phone || venueData?.Phone || "";

  const availableTablesCount = tablesList.filter(
    (t) => t.state === "available",
  ).length;

  const safeCategories = Array.isArray(menuData) ? menuData : [];

  const filteredMenu = safeCategories
    .filter((cat) => {
      if (searchQuery.trim()) return true;
      return selectedCategoryId === "all" || cat.id === selectedCategoryId;
    })
    .map((cat) => {
      const q = searchQuery.trim().toLowerCase();
      const prods = (cat.products || []).filter((p: any) => {
        if (!q) return true;
        return (
          String(p.nameFa || "")
            .toLowerCase()
            .includes(q) ||
          String(p.nameEn || "")
            .toLowerCase()
            .includes(q) ||
          String(p.descriptionFa || "")
            .toLowerCase()
            .includes(q)
        );
      });
      return { ...cat, products: prods };
    })
    .filter((cat) => cat.products.length > 0 || !searchQuery.trim());

  const currentStageIndex = getActiveStageIndex();

  const timePresetsFa = ["۱۳:۰۰", "۱۴:۳۰", "۲۰:۰۰", "۲۱:۳۰"];
  const timePresetsEn = ["13:00", "14:30", "20:00", "21:30"];

  const waiterPresetsFa = [
    "درخواست صورت‌حساب",
    "نیاز به آب و لیوان",
    "قاشق، چنگال و دستمال",
    "حضور سالن‌دار سر میز",
  ];
  const waiterPresetsEn = [
    "Request the bill",
    "Water & glasses",
    "Cutlery & napkins",
    "Table assistance",
  ];

  const chefPresetsFa = [
    "غذا بدون پیاز و سیر باشد",
    "کم‌نمک و بدون ادویه تند",
    "سس جداگانه سرو شود",
    "حساسیت غذایی دارم",
  ];
  const chefPresetsEn = [
    "No onions or garlic",
    "Less salt & mild spices",
    "Sauce on the side",
    "Food allergy note",
  ];

  const handleCategoryClick = (catId: string) => {
    setSelectedCategoryId(catId);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans antialiased selection:bg-orange-500/20 overflow-x-hidden"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* اعلان شناور سبک Apple Dynamic Pill */}
      {toastMsg && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-[#1D1D1F]/95 backdrop-blur-xl text-white px-4 py-2.5 rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.22)] font-bold text-xs flex items-center gap-2 border border-white/10">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" strokeWidth={3} />
            </span>
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          نوار بالای شیشه‌ای اپلی (Ultra-Compact Apple Header)
         ======================================================== */}
      <header className="sticky top-0 z-30 bg-[#F5F5F7]/85 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto h-14 px-3 sm:px-5 flex items-center justify-between gap-2">
          {/* لوگو و نام مجموعه */}
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-right group"
          >
            <div className="w-9 h-9 rounded-[12px] bg-white shadow-2xs border border-black/[0.06] overflow-hidden flex items-center justify-center shrink-0">
              {safeLogo ? (
                <img
                  src={getFullImageUrl(safeLogo)}
                  alt={safeVenueName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store size={18} className="text-orange-500" />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="font-black text-[14px] sm:text-[16px] text-[#1D1D1F] truncate leading-tight">
                {safeVenueName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {tableNumber ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    {isFa ? `میز ${tableNumber}` : `Table #${tableNumber}`}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#86868B] flex items-center gap-1">
                    <Info size={10} />
                    {isFa ? "اطلاعات مجموعه" : "Venue Info"}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* ابزارک‌های فشرده هدر */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsTrackerOpen(true)}
                className="h-8 px-2.5 rounded-full bg-orange-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>#{activeOrder.orderNumber}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              aria-label="جستجو"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isSearchOpen || searchQuery
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-black/[0.05] text-[#1D1D1F] hover:bg-black/[0.09]"
              }`}
            >
              {isSearchOpen ? <X size={15} /> : <Search size={15} />}
            </button>

            {venueData?.bilingual && (
              <button
                type="button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
                className="h-8 px-2.5 rounded-full bg-black/[0.05] hover:bg-black/[0.09] text-[#1D1D1F] font-black text-[11px] flex items-center gap-1 transition-colors"
              >
                <Globe size={13} className="text-orange-500" />
                <span>{isFa ? "EN" : "فا"}</span>
              </button>
            )}
          </div>
        </div>

        {/* نوار جستجوی کشویی تمیز زیر هدر */}
        {isSearchOpen && (
          <div className="max-w-6xl mx-auto px-3 sm:px-5 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search
                size={15}
                className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
                  isFa ? "right-3.5" : "left-3.5"
                }`}
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa ? "جستجو در نام یا ترکیبات غذا..." : "Search menu..."
                }
                className={`w-full bg-white border border-black/[0.08] focus:border-orange-500 rounded-[14px] py-2.5 text-xs font-bold text-[#1D1D1F] placeholder:text-[#86868B] outline-none shadow-2xs ${
                  isFa ? "pr-9 pl-9" : "pl-9 pr-9"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
                    isFa ? "left-3" : "right-3"
                  }`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          ساختار دو ستونه: سایدبار ثابت سمت راست با آیکون‌های سه‌بعدی
         ======================================================== */}
      <div
        className={`max-w-6xl mx-auto flex items-start ${
          isFa ? "flex-row" : "flex-row-reverse"
        }`}
      >
        {/* سایدبار عمودی سمت راست در موبایل و دسکتاپ */}
        <aside
          aria-label="دسته‌بندی‌ها"
          className="sticky top-14 h-[calc(100dvh-3.5rem)] w-[76px] sm:w-[90px] lg:w-[236px] shrink-0 bg-white/90 backdrop-blur-2xl border-l border-black/[0.06] overflow-y-auto no-scrollbar py-3 px-1.5 lg:px-3 z-20"
        >
          <div className="space-y-2 pb-24">
            {/* دکمه نمایش همه دسته‌بندی‌ها با آیکون سه‌بعدی */}
            <button
              type="button"
              onClick={() => handleCategoryClick("all")}
              className={`relative w-full rounded-[18px] py-2.5 px-1 lg:px-3 flex flex-col lg:flex-row items-center lg:justify-between gap-1.5 lg:gap-2.5 transition-all duration-200 ${
                selectedCategoryId === "all" && !searchQuery
                  ? "bg-[#F5F5F7] text-[#1D1D1F]"
                  : "text-[#6E6E73] hover:bg-[#F5F5F7]/60"
              }`}
            >
              {selectedCategoryId === "all" && !searchQuery && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3.5px] h-8 bg-orange-500 rounded-l-full" />
              )}

              <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-[15px] flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    selectedCategoryId === "all" && !searchQuery
                      ? "bg-[#1D1D1F] border-black shadow-[0_8px_18px_rgba(29,29,31,0.22)] scale-105"
                      : `bg-gradient-to-br ${ICON_TILE_BG.all} shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_8px_rgba(0,0,0,0.04)]`
                  }`}
                >
                  <Category3DIcon type="all" uid="all" />
                </div>
                <span
                  className={`text-[10px] lg:text-xs leading-tight text-center lg:text-right truncate max-w-full ${
                    selectedCategoryId === "all" && !searchQuery
                      ? "font-black text-[#1D1D1F]"
                      : "font-bold text-[#6E6E73]"
                  }`}
                >
                  {isFa ? "همه" : "All"}
                </span>
              </div>
            </button>

            {/* لیست دسته‌بندی‌ها با آیکون‌های سه‌بعدی اختصاصی */}
            {safeCategories.map((cat: any, idx: number) => {
              const isSelected =
                selectedCategoryId === cat.id && !searchQuery.trim();
              const iconType = detectCategory3DType(cat, idx);
              const catTitle = isFa
                ? cat.nameFa || cat.name
                : cat.nameEn || cat.nameFa || cat.name;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`relative w-full rounded-[18px] py-2.5 px-1 lg:px-3 flex flex-col lg:flex-row items-center lg:justify-between gap-1.5 lg:gap-2.5 transition-all duration-200 ${
                    isSelected
                      ? "bg-[#F5F5F7] text-[#1D1D1F]"
                      : "text-[#6E6E73] hover:bg-[#F5F5F7]/60"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3.5px] h-8 bg-orange-500 rounded-l-full" />
                  )}

                  <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 min-w-0 w-full">
                    <div
                      className={`w-11 h-11 rounded-[15px] flex items-center justify-center shrink-0 border transition-all duration-300 ${
                        isSelected
                          ? "bg-[#1D1D1F] border-black shadow-[0_8px_18px_rgba(29,29,31,0.22)] scale-105"
                          : `bg-gradient-to-br ${ICON_TILE_BG[iconType]} shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_8px_rgba(0,0,0,0.04)]`
                      }`}
                    >
                      <Category3DIcon
                        type={iconType}
                        uid={String(cat.id ?? idx)}
                      />
                    </div>

                    <span
                      className={`text-[10px] lg:text-xs leading-[1.25] text-center lg:text-right line-clamp-2 lg:line-clamp-1 px-0.5 ${
                        isSelected
                          ? "font-black text-[#1D1D1F]"
                          : "font-bold text-[#6E6E73]"
                      }`}
                    >
                      {catTitle}
                    </span>
                  </div>

                  <span
                    className={`hidden lg:inline-block text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                      isSelected
                        ? "bg-white text-[#1D1D1F]"
                        : "bg-[#F5F5F7] text-[#86868B]"
                    }`}
                  >
                    {(cat.products?.length || 0).toLocaleString("fa-IR")}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ========================================================
            محتوای اصلی منو (ستون سمت چپ در کنار سایدبار)
           ======================================================== */}
        <main className="flex-1 min-w-0 px-3 sm:px-5 pt-3 pb-32">
          {/* نوار چیپ‌های عملیات سریع (رزرو میز + سالن‌دار + سرآشپز) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
            <button
              type="button"
              onClick={openReservationModal}
              className="shrink-0 bg-[#1D1D1F] text-white px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
            >
              <CalendarCheck size={13} className="text-orange-400" />
              <span>{isFa ? "رزرو میز" : "Reserve"}</span>
              {tablesList.length > 0 && (
                <span className="bg-white/15 text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px]">
                  {availableTablesCount > 0
                    ? availableTablesCount.toLocaleString("fa-IR")
                    : "۰"}
                </span>
              )}
            </button>

            {tableNumber && venueData?.callWaiterEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setWaiterModal(true);
                }}
                className="shrink-0 bg-white border border-black/[0.06] text-[#1D1D1F] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
              >
                <BellRing size={13} className="text-orange-500" />
                <span>{isFa ? "سالن‌دار" : "Waiter"}</span>
              </button>
            )}

            {tableNumber && venueData?.callChefEnabled && (
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setChefModal(true);
                }}
                className="shrink-0 bg-white border border-black/[0.06] text-[#1D1D1F] px-3.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-2xs active:scale-95 transition-transform"
              >
                <ChefHat size={13} className="text-orange-500" />
                <span>{isFa ? "سرآشپز" : "Chef"}</span>
              </button>
            )}
          </div>

          {/* پیام راهنمای اسکن بارکد در صورت نبود شماره میز */}
          {!tableNumber && (
            <div className="mb-4 bg-white border border-black/[0.05] rounded-[18px] p-3 flex items-center justify-between gap-2 shadow-2xs">
              <p className="text-[11px] font-bold text-[#6E6E73] leading-relaxed">
                {isFa
                  ? "برای ثبت سفارش سر میز، QR میز خود را اسکن کنید."
                  : "Scan your table QR to place orders."}
              </p>
              <button
                type="button"
                onClick={openReservationModal}
                className="shrink-0 text-[11px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full"
              >
                {isFa ? "رزرو میز" : "Reserve"}
              </button>
            </div>
          )}

          {/* لیست دسته‌بندی‌ها و کارت‌های محصول اپلی */}
          {filteredMenu.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 text-center border border-black/[0.04]">
              <UtensilsCrossed
                size={32}
                className="text-black/15 mx-auto mb-2.5"
              />
              <p className="text-xs font-bold text-[#86868B]">
                {isFa ? "آیتمی با این جستجو پیدا نشد." : "No items found."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredMenu.map((cat: any) => {
                const hasProducts =
                  Array.isArray(cat.products) && cat.products.length > 0;

                return (
                  <section key={cat.id}>
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <h2 className="text-[15px] sm:text-lg font-black text-[#1D1D1F] tracking-tight">
                        {isFa
                          ? cat.nameFa || cat.name
                          : cat.nameEn || cat.nameFa || cat.name}
                      </h2>
                      <span className="text-[11px] font-bold text-[#86868B]">
                        {(cat.products?.length || 0).toLocaleString("fa-IR")}{" "}
                        {isFa ? "آیتم" : "items"}
                      </span>
                    </div>

                    {!hasProducts ? (
                      <div className="bg-white rounded-[20px] p-5 text-center text-xs font-bold text-[#86868B] border border-black/[0.04]">
                        {isFa ? "محصولی ثبت نشده است." : "No items yet."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {cat.products.map((prod: any) => {
                          const cartItem = cart.find(
                            (c: any) => c.product?.id === prod?.id,
                          );
                          const hasFiniteStock =
                            prod?.stock !== null && prod?.stock !== undefined;
                          const isAvailable =
                            prod?.isAvailableInMenu !== false &&
                            (!hasFiniteStock || Number(prod.stock) > 0);
                          const reachedMaxStock =
                            hasFiniteStock &&
                            cartItem &&
                            cartItem.quantity >= Number(prod.stock);

                          return (
                            <article
                              key={prod?.id}
                              onClick={() => openProductShowcase(prod)}
                              className={`cursor-pointer bg-white rounded-[22px] p-3 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.025)] active:scale-[0.99] transition-all flex flex-col justify-between ${
                                !isAvailable ? "opacity-55" : ""
                              }`}
                            >
                              {/* ردیف بالا: عکس + عنوان و توضیحات */}
                              <div className="flex items-start gap-3">
                                <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-[16px] bg-[#F5F5F7] shrink-0 overflow-hidden relative flex items-center justify-center">
                                  {prod?.imageUrl ? (
                                    <img
                                      src={getFullImageUrl(prod.imageUrl)}
                                      alt={isFa ? prod.nameFa : prod.nameEn}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <UtensilsCrossed
                                      size={22}
                                      className="text-black/15"
                                    />
                                  )}

                                  {isAvailable &&
                                    hasFiniteStock &&
                                    Number(prod.stock) <= 5 && (
                                      <span className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-md text-amber-300 text-[9px] font-black text-center py-0.5 rounded-md">
                                        {isFa
                                          ? `${prod.stock} مانده`
                                          : `${prod.stock} left`}
                                      </span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                  <h3 className="font-black text-[13.5px] sm:text-[14.5px] text-[#1D1D1F] leading-snug line-clamp-2">
                                    {isFa
                                      ? prod?.nameFa
                                      : prod?.nameEn || prod?.nameFa}
                                  </h3>
                                  {(isFa
                                    ? prod?.descriptionFa
                                    : prod?.descriptionEn ||
                                      prod?.descriptionFa) && (
                                    <p className="text-[11px] font-medium text-[#6E6E73] line-clamp-2 leading-relaxed mt-1">
                                      {isFa
                                        ? prod?.descriptionFa
                                        : prod?.descriptionEn ||
                                          prod?.descriptionFa}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* ردیف پایین اختصاصی: قیمت + دکمه کنترل تعداد اپلی */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3 pt-2.5 border-t border-black/[0.04] flex items-center justify-between gap-2"
                              >
                                <div className="flex items-baseline gap-1 min-w-0">
                                  <span className="font-black text-[14px] sm:text-[15px] text-[#1D1D1F]">
                                    {Number(prod?.price || 0).toLocaleString(
                                      "fa-IR",
                                    )}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#86868B]">
                                    {isFa ? "تومان" : "IRT"}
                                  </span>
                                </div>

                                {venueData?.orderingEnabled && tableNumber && (
                                  <>
                                    {!isAvailable ? (
                                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                                        {isFa ? "ناموجود" : "Sold out"}
                                      </span>
                                    ) : cartItem ? (
                                      <div className="flex items-center gap-2 bg-[#1D1D1F] text-white rounded-full p-0.5 shadow-sm">
                                        <button
                                          type="button"
                                          disabled={Boolean(reachedMaxStock)}
                                          onClick={() => addToCart(prod)}
                                          className="w-7 h-7 rounded-full bg-orange-500 disabled:opacity-35 text-white flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Plus size={13} strokeWidth={2.8} />
                                        </button>
                                        <span className="text-xs font-black min-w-[16px] text-center">
                                          {cartItem.quantity.toLocaleString(
                                            "fa-IR",
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeFromCart(prod.id)
                                          }
                                          className="w-7 h-7 rounded-full bg-white/15 text-white flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Minus size={13} strokeWidth={2.8} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => addToCart(prod)}
                                        className="bg-[#F5F5F7] hover:bg-[#1D1D1F] text-[#1D1D1F] hover:text-white px-3 py-1.5 rounded-full font-black text-[11px] flex items-center gap-1 transition-all active:scale-95"
                                      >
                                        <Plus size={13} strokeWidth={2.8} />
                                        <span>{isFa ? "افزودن" : "Add"}</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {/* امضای ظریف ترنج پایین صفحه */}
          <footer className="mt-10 pt-4 text-center">
            <a
              href="https://toranjmenu.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#86868B] hover:text-orange-500 transition-colors"
            >
              <Sparkles size={12} className="text-orange-500" />
              <span>قدرت‌گرفته از منوی دیجیتال ترنج</span>
            </a>
          </footer>
        </main>
      </div>

      {/* ========================================================
          نوار سبد سفارش شناور پایین صفحه (Apple Floating Bar)
         ======================================================== */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-3 z-40 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md bg-[#1D1D1F]/95 hover:bg-black backdrop-blur-2xl text-white p-3 px-4 rounded-full font-black flex items-center justify-between shadow-[0_18px_40px_rgba(0,0,0,0.28)] border border-white/10 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                {totalItems.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs sm:text-sm font-black">
                {isFa ? "تکمیل و ثبت سفارش" : "View Order"}
              </span>
            </div>

            <span className="text-xs sm:text-sm font-black text-orange-400">
              {totalPrice.toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] font-bold text-white/70">
                {isFa ? "تومان" : "IRT"}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* ========================================================
          مودال اطلاعات مجموعه (Venue Info Sheet)
         ======================================================== */}
      {isInfoOpen && (
        <div
          onClick={() => setIsInfoOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-[#F5F5F7] overflow-hidden flex items-center justify-center border border-black/[0.06]">
                  {safeLogo ? (
                    <img
                      src={getFullImageUrl(safeLogo)}
                      alt={safeVenueName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={22} className="text-orange-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {safeVenueName}
                  </h3>
                  <span className="text-[11px] font-bold text-[#86868B]">
                    {isFa ? "مشخصات مجموعه" : "About Venue"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {(isFa ? safeAboutFa : safeAboutEn) && (
              <p className="text-xs font-medium text-[#6E6E73] leading-relaxed mb-4">
                {isFa ? safeAboutFa : safeAboutEn}
              </p>
            )}

            <div className="bg-[#F5F5F7] rounded-[18px] p-4 space-y-2.5 text-xs font-bold text-[#1D1D1F]">
              {safeAddress && (
                <div className="flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="text-orange-500 shrink-0 mt-0.5"
                  />
                  <span>{safeAddress}</span>
                </div>
              )}
              {safePhone && (
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-orange-500 shrink-0" />
                  <span dir="ltr">{safePhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال جزئیات محصول (Apple Product Sheet)
         ======================================================== */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="relative h-56 w-full bg-[#F5F5F7]">
              {selectedProductModal.imageUrl ? (
                <img
                  src={getFullImageUrl(selectedProductModal.imageUrl)}
                  alt={
                    isFa
                      ? selectedProductModal.nameFa
                      : selectedProductModal.nameEn
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/15">
                  <UtensilsCrossed size={44} />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-[#1D1D1F] flex items-center justify-center shadow-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 pb-7 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#1D1D1F]">
                  {isFa
                    ? selectedProductModal.nameFa
                    : selectedProductModal.nameEn ||
                      selectedProductModal.nameFa}
                </h3>
                <span className="text-base font-black text-orange-600 shrink-0">
                  {Number(selectedProductModal.price || 0).toLocaleString(
                    "fa-IR",
                  )}{" "}
                  <span className="text-[11px] text-[#86868B]">
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </span>
              </div>

              {(isFa
                ? selectedProductModal.descriptionFa
                : selectedProductModal.descriptionEn ||
                  selectedProductModal.descriptionFa) && (
                <p className="text-xs font-medium text-[#6E6E73] leading-relaxed">
                  {isFa
                    ? selectedProductModal.descriptionFa
                    : selectedProductModal.descriptionEn ||
                      selectedProductModal.descriptionFa}
                </p>
              )}

              {venueData?.orderingEnabled && tableNumber ? (
                <div className="space-y-3 pt-1">
                  {updateItemNotes && (
                    <input
                      type="text"
                      value={modalNoteText}
                      onChange={(e) => {
                        setModalNoteText(e.target.value);
                        updateItemNotes(
                          selectedProductModal.id,
                          e.target.value,
                        );
                      }}
                      placeholder={
                        isFa
                          ? "توضیحات برای آشپزخانه (مثلاً: بدون پیاز)..."
                          : "Special note for kitchen..."
                      }
                      className="w-full bg-[#F5F5F7] border border-black/[0.06] focus:border-orange-500 rounded-[14px] px-4 py-3 text-xs font-bold text-[#1D1D1F] outline-none"
                    />
                  )}

                  {(() => {
                    const cItem = cart.find(
                      (c) => c.product?.id === selectedProductModal.id,
                    );
                    const hasFiniteStock =
                      selectedProductModal.stock !== null &&
                      selectedProductModal.stock !== undefined;
                    const isAvail =
                      selectedProductModal.isAvailableInMenu !== false &&
                      (!hasFiniteStock ||
                        Number(selectedProductModal.stock) > 0);

                    if (!isAvail) {
                      return (
                        <div className="w-full py-3.5 rounded-[16px] bg-rose-50 text-rose-600 font-black text-xs text-center">
                          {isFa ? "اتمام موجودی" : "Sold Out"}
                        </div>
                      );
                    }

                    if (cItem) {
                      return (
                        <div className="flex items-center justify-between bg-[#F5F5F7] p-1.5 rounded-full">
                          <div className="flex items-center gap-3 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(selectedProductModal.id)
                              }
                              className="w-9 h-9 rounded-full bg-white text-[#1D1D1F] shadow-2xs flex items-center justify-center"
                            >
                              <Minus size={15} strokeWidth={2.5} />
                            </button>
                            <span className="font-black text-base text-[#1D1D1F] min-w-[20px] text-center">
                              {cItem.quantity.toLocaleString("fa-IR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(selectedProductModal)}
                              className="w-9 h-9 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProductModal(null)}
                            className="bg-orange-500 text-white px-6 py-2.5 rounded-full font-black text-xs"
                          >
                            {isFa ? "تایید" : "Done"}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(selectedProductModal);
                          if (modalNoteText.trim() && updateItemNotes) {
                            updateItemNotes(
                              selectedProductModal.id,
                              modalNoteText.trim(),
                            );
                          }
                          setSelectedProductModal(null);
                          showToast(
                            isFa ? "به سبد سفارش اضافه شد" : "Added to order",
                          );
                        }}
                        className="w-full bg-[#1D1D1F] hover:bg-orange-500 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Plus size={17} strokeWidth={2.5} />
                        <span>{isFa ? "افزودن به سفارش" : "Add to Order"}</span>
                      </button>
                    );
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full font-black text-xs"
                >
                  {isFa ? "بستن" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          مودال رزرو آنلاین میزها (متصل به reservationsApi + WebSocket)
         ======================================================== */}
      {reserveModal && (
        <div
          onClick={() => !isReserving && setReserveModal(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] rounded-t-[28px] sm:rounded-[28px] p-5 pb-7 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-[#1D1D1F] text-orange-400 flex items-center justify-center">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-[#1D1D1F]">
                      {isFa ? "رزرو آنلاین میز" : "Reserve a Table"}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {isFa ? "زنده" : "Live"}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#86868B]">
                    {safeVenueName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReserveModal(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-[22px] bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#1D1D1F]">
                    {isFa ? "رزرو شما ثبت شد!" : "Reservation Confirmed!"}
                  </h4>
                  <p className="text-xs font-bold text-[#86868B] mt-0.5">
                    {isFa
                      ? "اطلاعات رزرو در پنل پذیرش ثبت گردید"
                      : "Your table is reserved"}
                  </p>
                </div>

                <div className="bg-white rounded-[20px] p-4 space-y-2 text-xs font-bold text-right">
                  <div className="flex justify-between py-1 border-b border-black/[0.05]">
                    <span className="text-[#86868B]">
                      {isFa ? "میز:" : "Table:"}
                    </span>
                    <span className="font-black">
                      {isFa
                        ? `میز ${confirmedReservation.tableNumber.toLocaleString("fa-IR")}`
                        : `#${confirmedReservation.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/[0.05]">
                    <span className="text-[#86868B]">
                      {isFa ? "نام مهمان:" : "Name:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/[0.05]">
                    <span className="text-[#86868B]">
                      {isFa ? "تماس:" : "Phone:"}
                    </span>
                    <span className="font-mono font-black" dir="ltr">
                      {confirmedReservation.customerMobile}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#86868B]">
                      {isFa ? "نفرات:" : "Guests:"}
                    </span>
                    <span className="font-black">
                      {confirmedReservation.guestsCount.toLocaleString("fa-IR")}{" "}
                      {isFa ? "نفر" : "guests"}
                      {confirmedReservation.reservationTime
                        ? ` • ${confirmedReservation.reservationTime}`
                        : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReserveModal(false)}
                  className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full font-black text-sm"
                >
                  {isFa ? "بازگشت به منو" : "Done"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3.5 mb-4 no-scrollbar">
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-[14px] text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {isFa ? "آزاد" : "Free"}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {isFa ? "رزرو" : "Reserved"}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {isFa ? "اشغال" : "Busy"}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-black text-[#1D1D1F]">
                        {isFa ? "انتخاب شماره میز:" : "Pick a table:"}
                      </label>
                      {isLoadingTables && (
                        <Loader2
                          size={14}
                          className="animate-spin text-orange-500"
                        />
                      )}
                    </div>

                    {tablesList.length === 0 ? (
                      <div className="bg-white rounded-[16px] p-4 text-center text-xs font-bold text-[#86868B]">
                        {isFa
                          ? "میزی برای رزرو تعریف نشده است."
                          : "No tables available."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {tablesList.map((t) => {
                          const isFree = t.state === "available";
                          const isSelected =
                            selectedReserveTable === t.tableNumber;

                          return (
                            <button
                              key={t.tableNumber}
                              type="button"
                              disabled={!isFree}
                              onClick={() => {
                                setSelectedReserveTable(t.tableNumber);
                                setReserveError("");
                              }}
                              className={`relative py-2.5 rounded-[14px] border-2 transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? "border-[#1D1D1F] bg-[#1D1D1F] text-white shadow-md"
                                  : isFree
                                    ? "border-transparent bg-white text-[#1D1D1F] hover:border-emerald-400"
                                    : "border-transparent bg-black/[0.04] text-[#86868B] opacity-55 cursor-not-allowed"
                              }`}
                            >
                              <span className="text-xs font-black">
                                {isFa
                                  ? `میز ${t.tableNumber.toLocaleString("fa-IR")}`
                                  : `#${t.tableNumber}`}
                              </span>
                              <span
                                className={`text-[9px] font-bold mt-0.5 ${
                                  isSelected
                                    ? "text-orange-400"
                                    : isFree
                                      ? "text-emerald-600"
                                      : t.state === "reserved"
                                        ? "text-amber-600"
                                        : "text-rose-600"
                                }`}
                              >
                                {isSelected
                                  ? isFa
                                    ? "انتخاب شد"
                                    : "Picked"
                                  : isFree
                                    ? isFa
                                      ? "آزاد"
                                      : "Free"
                                    : t.state === "reserved"
                                      ? isFa
                                        ? "رزرو"
                                        : "Reserved"
                                      : isFa
                                        ? "اشغال"
                                        : "Busy"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-[18px] p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <Users size={14} className="text-orange-500" />
                        {isFa ? "تعداد نفرات" : "Guests"}
                      </span>
                      <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.max(1, g - 1))
                          }
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-2xs"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black min-w-[38px] text-center">
                          {reserveGuests.toLocaleString("fa-IR")}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReserveGuests((g) => Math.min(30, g + 1))
                          }
                          className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(isFa ? timePresetsFa : timePresetsEn).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            setReserveTime(reserveTime === slot ? "" : slot)
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            reserveTime === slot
                              ? "bg-[#1D1D1F] text-white"
                              : "bg-[#F5F5F7] text-[#6E6E73]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <User
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
                          isFa ? "right-3.5" : "left-3.5"
                        }`}
                      />
                      <input
                        type="text"
                        value={reserveName}
                        onChange={(e) => {
                          setReserveName(e.target.value);
                          if (reserveError) setReserveError("");
                        }}
                        placeholder={
                          isFa ? "نام و نام خانوادگی *" : "Full Name *"
                        }
                        className={`w-full bg-white rounded-[14px] py-3 text-xs font-bold outline-none ${
                          isFa ? "pr-9 pl-3.5" : "pl-9 pr-3.5"
                        }`}
                      />
                    </div>

                    <div className="relative">
                      <Phone
                        size={14}
                        className={`absolute top-1/2 -translate-y-1/2 text-[#86868B] ${
                          isFa ? "right-3.5" : "left-3.5"
                        }`}
                      />
                      <input
                        type="tel"
                        dir="ltr"
                        maxLength={11}
                        value={reserveMobile}
                        onChange={(e) => {
                          setReserveMobile(e.target.value.replace(/\D/g, ""));
                          if (reserveError) setReserveError("");
                        }}
                        placeholder="09123456789"
                        className="w-full bg-white rounded-[14px] py-3 px-9 text-left font-mono text-xs font-bold outline-none"
                      />
                    </div>

                    <input
                      type="text"
                      value={reserveNotes}
                      onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder={
                        isFa ? "توضیحات (اختیاری)..." : "Note (optional)..."
                      }
                      className="w-full bg-white rounded-[14px] py-3 px-3.5 text-xs font-bold outline-none"
                    />
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-600 rounded-[14px] p-3 text-xs font-black">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{reserveError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isReserving || availableTablesCount === 0}
                  onClick={handleCustomerReserve}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
                >
                  {isReserving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CalendarCheck size={17} />
                      <span>
                        {selectedReserveTable
                          ? isFa
                            ? `ثبت رزرو میز ${selectedReserveTable.toLocaleString("fa-IR")}`
                            : `Reserve Table #${selectedReserveTable}`
                          : isFa
                            ? "ثبت نهایی رزرو"
                            : "Confirm Reservation"}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          دراور سبد سفارش (Apple Cart Sheet)
         ======================================================== */}
      {isCartOpen && (
        <div
          onClick={() => !isProcessing && setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] w-full max-w-lg mx-auto rounded-t-[28px] p-5 pb-7 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-[#1D1D1F]">
                  {isFa ? "سبد سفارش" : "Your Order"}
                </h3>
                {tableNumber && (
                  <p className="text-xs font-bold text-orange-600">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 no-scrollbar">
              {cart.map((item) => {
                const pid = item.product.id;
                const isNoteOpen = Boolean(openNoteIds[pid] || item.notes);

                return (
                  <div
                    key={pid}
                    className="bg-white p-3.5 rounded-[18px] space-y-2.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[#1D1D1F] truncate">
                          {isFa
                            ? item.product?.nameFa
                            : item.product?.nameEn || item.product?.nameFa}
                        </h4>
                        <p className="text-xs text-orange-600 font-bold mt-0.5">
                          {(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString("fa-IR")}{" "}
                          {isFa ? "تومان" : "IRT"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {updateItemNotes && (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenNoteIds((prev) => ({
                                ...prev,
                                [pid]: !prev[pid],
                              }))
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isNoteOpen
                                ? "bg-orange-500 text-white"
                                : "bg-[#F5F5F7] text-[#6E6E73]"
                            }`}
                          >
                            <MessageSquarePlus size={14} />
                          </button>
                        )}

                        <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(pid)}
                            className="w-7 h-7 rounded-full bg-white text-[#1D1D1F] flex items-center justify-center shadow-2xs"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black min-w-[16px] text-center">
                            {item.quantity.toLocaleString("fa-IR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(item.product)}
                            className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isNoteOpen && updateItemNotes && (
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(pid, e.target.value)}
                        placeholder={
                          isFa
                            ? "یادداشت برای آشپزخانه..."
                            : "Note for kitchen..."
                        }
                        className="w-full bg-[#F5F5F7] rounded-[12px] px-3 py-2 text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mb-3.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  isFa ? "نام شما (اختیاری)" : "Your Name (optional)"
                }
                className="w-full bg-white rounded-[14px] px-4 py-3 text-xs font-bold outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleOrder}
              className="w-full bg-[#1D1D1F] hover:bg-orange-500 disabled:opacity-50 text-white py-3.5 rounded-full font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ShoppingBag size={17} />
                  <span>
                    {isFa ? "ارسال به آشپزخانه" : "Send Order"} —{" "}
                    {totalPrice.toLocaleString("fa-IR")}{" "}
                    {isFa ? "تومان" : "IRT"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال احضار سالن‌دار */}
      {waiterModal && (
        <div
          onClick={() => !isProcessing && setWaiterModal(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-orange-50 text-orange-500 flex items-center justify-center">
                  <BellRing size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {isFa ? "احضار سالن‌دار" : "Call Waiter"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#86868B]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaiterModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3.5">
              {(isFa ? waiterPresetsFa : waiterPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    message === preset
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F]"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isFa ? "پیام دلخواه (اختیاری)..." : "Message (optional)..."
              }
              className="w-full bg-[#F5F5F7] rounded-[16px] p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("waiter")}
              className="w-full bg-[#1D1D1F] hover:bg-orange-500 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال درخواست" : "Send Request"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال پیام به سرآشپز */}
      {chefModal && (
        <div
          onClick={() => !isProcessing && setChefModal(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-7 w-full max-w-md shadow-2xl"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[14px] bg-orange-500 text-white flex items-center justify-center">
                  <ChefHat size={19} />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F]">
                    {isFa ? "پیام به سرآشپز" : "Note to Chef"}
                  </h3>
                  <p className="text-[11px] font-bold text-[#86868B]">
                    {isFa
                      ? `میز شماره ${tableNumber}`
                      : `Table #${tableNumber}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChefModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F7] text-[#6E6E73] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3.5">
              {(isFa ? chefPresetsFa : chefPresetsEn).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    message === preset
                      ? "bg-orange-500 text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F]"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isFa
                  ? "توضیحات پخت یا حساسیت غذایی..."
                  : "Cooking note or allergies..."
              }
              className="w-full bg-[#F5F5F7] rounded-[16px] p-3.5 text-xs font-bold outline-none resize-none mb-4"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleCall("chef")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-full font-black text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isFa ? "ارسال به آشپزخانه" : "Send to Kitchen"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* مودال پیگیری زنده سفارش */}
      {isTrackerOpen && activeOrder && (
        <div
          onClick={() => setIsTrackerOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F5F5F7] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 pb-7 shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4 shrink-0">
              <button
                type="button"
                onClick={handleRefreshOrder}
                disabled={isRefreshingOrder}
                className="bg-white text-[#1D1D1F] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshingOrder ? "animate-spin" : ""}
                />
                <span>{isFa ? "بروزرسانی" : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrackerOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-[#6E6E73] flex items-center justify-center shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center mb-4 shrink-0">
              <div className="w-14 h-14 mx-auto rounded-[18px] bg-[#1D1D1F] text-orange-400 flex items-center justify-center mb-2.5">
                <Sparkles size={24} />
              </div>
              <span className="inline-block text-[11px] font-black text-orange-600 bg-orange-50 px-3 py-0.5 rounded-full mb-1.5">
                {isFa
                  ? `سفارش #${activeOrder.orderNumber}`
                  : `Order #${activeOrder.orderNumber}`}
              </span>
              <h2 className="text-lg font-black text-[#1D1D1F]">
                {String(activeOrder.status).toLowerCase() === "completed"
                  ? isFa
                    ? "نوش جان! سفارش تحویل داده شد"
                    : "Order Completed!"
                  : isFa
                    ? "وضعیت زنده سفارش"
                    : "Live Order Status"}
              </h2>
            </div>

            <div className="bg-white rounded-[20px] p-4 space-y-3.5 mb-5 overflow-y-auto no-scrollbar">
              {dynamicStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3 transition-opacity ${
                      isPending ? "opacity-35" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-orange-500 text-white"
                            : "bg-[#F5F5F7] text-[#86868B]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : isActive ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Clock size={14} />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <span className="block font-black text-xs sm:text-sm text-[#1D1D1F]">
                        {stage.name}
                      </span>
                      {stage.description && (
                        <span className="block text-[11px] font-medium text-[#86868B] mt-0.5">
                          {stage.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsTrackerOpen(false)}
              className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full font-black text-sm shrink-0"
            >
              {isFa ? "بازگشت به منو" : "Back to Menu"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Template4;
