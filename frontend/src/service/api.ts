import axios from "axios";

// ==========================================
// ۱. پیکربندی اولیه کلاینت Axios
// ==========================================
export const apiClient = axios.create({
  baseURL: "http://localhost:5000/api", // در زمان پابلیش، این آدرس باید تغییر کند
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// ۲. رهگیرها (Interceptors)
// ==========================================

// الف) رهگیر ریکوئست: ردیاب و تزریق‌کننده توکن
apiClient.interceptors.request.use(
  (config) => {
    // استخراج توکن از لوکال استوریج
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      // چسباندن توکن به هدر (فاصله بعد از Bearer الزامی است)
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ توکن به ریکوئست متصل شد.");
    } else {
      console.warn("❌ هشدار: توکنی در لوکال استوریج یافت نشد.");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ب) رهگیر ریسپانس: مدیریت ارورهای شبکه و هندلینگ ۴۰۱
apiClient.interceptors.response.use(
  (response) => {
    // اگر ریکوئست با موفقیت انجام شد، خود ریسپانس رو برگردون
    return response;
  },
  (error) => {
    // لاگ کردن کل ارور برای دیباگ راحت‌تر در کنسول مرورگر
    console.error("🔥 ارور رهگیری شده در Axios:", error);

    // خروج خودکار در صورت انقضای توکن (۴۰۱)
    if (error.response?.status === 401) {
      console.warn("🔒 ارور 401: توکن منقضی یا نامعتبر است. خروج خودکار...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("role");
      window.location.href = "/login";
      return Promise.reject(error); // متوقف کردن پروسه
    }

    // استخراج ارورهای دقیق ولیدیشن C#
    let errorMessage = "خطا در ارتباط با سرور";

    if (error.response?.data) {
      const data = error.response.data;
      if (data.errors) {
        const firstKey = Object.keys(data.errors)[0];
        errorMessage = data.errors[firstKey][0];
      } else if (data.message || data.detail || data.title) {
        errorMessage = data.message || data.detail || data.title;
      } else if (typeof data === "string") {
        errorMessage = data;
      }
    }

    // 🔴 تغییر حیاتی: به جای قایم کردن ارور واقعی پشت یک استرینگ ساده،
    // خود آبجکتِ ارور رو همراه با پیام دستکاری شده برمی‌گردونیم.
    // اینطوری در فایل‌های UI (مثل SetupVenue) ارور 403 دقیقاً نشون داده میشه.
    error.message = errorMessage;
    return Promise.reject(error);
  },
);

// ==========================================
// ۳. توابع API با ساختار هماهنگ با Swagger
// ==========================================

export const authApi = {
  // لاگین
  login: async (credentials: { mobile: string; password: string }) => {
    const res = await apiClient.post("/Authentication/login", credentials);
    return res.data;
  },

  // ثبت‌نام (ارسال کد)
  sendOtp: async (mobileNumber: string) => {
    const res = await apiClient.post("/Registration/register", {
      mobile: mobileNumber,
      password: "User@123456", // پسورد موقت
    });
    return res.data;
  },

  // تایید کد
  verifyOtp: async (mobileNumber: string, code: string) => {
    const res = await apiClient.post("/Registration/verify", {
      mobile: mobileNumber,
      code: code,
    });
    return res.data;
  },

  // ارسال مجدد کد
  resendOtp: async (mobileNumber: string) => {
    const res = await apiClient.post("/Registration/resend-code", {
      mobile: mobileNumber,
    });
    return res.data;
  },

  // تکمیل اطلاعات حساب
  completeRegistration: async (data: {
    mobile: string;
    name: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await apiClient.post("/Registration/complete", data);
    return res.data;
  },

  // وضعیت داشبورد و مراحل Onboarding
  getDashboardStatus: async () => {
    const res = await apiClient.get("/Restaurant/onboarding-status");
    return res.data;
  },
};

// =======================
// 🔴 توابع مربوط به رستوران / مجموعه (منطبق با Swagger)
// =======================
export const venuesApi = {
  // ۱. ثبت اولیه رستوران (نام و اسلاگ)
  createVenue: async (data: { name: string; slug: string }) => {
    const res = await apiClient.post("/Restaurant", data);
    return res.data;
  },

  // ۲. تکمیل اطلاعات مکانی رستوران
  completeVenue: async (data: {
    city: string;
    tableCount: number;
    phone: string;
    address: string;
  }) => {
    const res = await apiClient.put("/Restaurant/complete", data);
    return res.data;
  },

  // ۳. دریافت کامل اطلاعات رستوران من (استفاده در صفحه تنظیمات)
  getMyVenue: async () => {
    const res = await apiClient.get("/Restaurant/mine");
    return res.data;
  },

  // ۴. آپدیت تنظیمات و امکانات
  updateSettings: async (data: {
    orderingEnabled: boolean;
    bilingual: boolean;
    callWaiterEnabled: boolean;
    callChefEnabled: boolean;
    aboutUsFa: string;
    aboutUsEn: string;
  }) => {
    const res = await apiClient.put("/Restaurant/settings", data);
    return res.data;
  },

  // ۵. آپلود لوگو
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/Restaurant/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.logoUrl || res.data?.url || res.data;
  },

  // ۶. آپدیت برندینگ و قالب
  updateBranding: async (data: { logoUrl: string; theme: string }) => {
    const res = await apiClient.put("/Restaurant/branding", data);
    return res.data;
  },
};

// =======================
// سایر توابع API (آینده‌نگرانه)
// =======================
export const restaurantApi = {
  // برای جلوگیری از ارور داپلیکیت، از venuesApi استفاده کنید
  getMyRestaurant: async () => (await apiClient.get("/Restaurant/mine")).data,
};

export const menuApi = {
  getCategories: async () => (await apiClient.get("/Category")).data,
  createCategory: async (data: any) =>
    (await apiClient.post("/Category", data)).data,
  getProducts: async () => (await apiClient.get("/Product")).data,
  createProduct: async (data: any) =>
    (await apiClient.post("/Product", data)).data,
};

export const ordersApi = {
  getActiveOrders: async () => (await apiClient.get("/Order")).data,
  getKitchenOrders: async () => (await apiClient.get("/Order/kitchen")).data,
  updateOrderStatus: async (id: number, status: string) =>
    (await apiClient.put(`/Order/${id}/status/${status}`)).data,
};

// جلوگیری از ارور (سفیدی صفحه) برای ایمپورت‌های خالی در آینده
export const profileApi = {};
export const dashboardApi = {};
export const reportsApi = {};
export const staffApi = {};
export const kdsApi = {};
export const subscriptionApi = {};
export const publicApi = {};
export const supportApi = {};
