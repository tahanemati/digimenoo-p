import { Receipt, Flame, Coffee } from "lucide-react";

export const MOCK_VENUE = {
  name: "کافه رستوران دمو",
  about_us: "این یک صفحه تستی برای نمایش ظاهر قالب‌ها است. طعم واقعی و کیفیت بی‌نظیر را با ما تجربه کنید.",
  address: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
  phone: "021-12345678",
  logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
  brand_color: "orange",
  is_ordering_enabled: true,
  is_waiter_enabled: true,
  is_chef_request_enabled: true,
};

export const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "نوشیدنی گرم",
    items: [
      { id: 101, name: "لته آرت ویژه", price: 85000, description: "اسپرسو سینگل، شیر فوم گرفته شده", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop", is_available: true },
      { id: 102, name: "کاپوچینو", price: 75000, description: "اسپرسو دبل، فوم شیر کلاسیک", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop", is_available: true },
    ],
  },
  {
    id: 2,
    name: "غذای اصلی",
    items: [
      { id: 201, name: "پاستا آلفردو", price: 220000, description: "پنه، سس آلفردو، مرغ گریل شده، قارچ", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop", is_available: true },
    ],
  },
];

export const HEX_COLORS: Record<string, string> = {
  emerald: "#10b981", rose: "#f43f5e", amber: "#f59e0b", blue: "#3b82f6", purple: "#a855f7", orange: "#f97316",
};

export const ORDER_STAGES = [
  { id: "new", label: "ثبت سفارش", icon: Receipt },
  { id: "preparing", label: "در حال پخت", icon: Flame },
  { id: "ready", label: "آماده تحویل", icon: Coffee },
];