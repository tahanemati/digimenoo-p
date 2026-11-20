import axios from "axios";

// ==========================================
// 🔴 متغیرهای پایه (تغییر در زمان پابلیش)
// ==========================================
const BASE_URL = "http://localhost:5000/api";

// ==========================================
// ۱. پیکربندی کلاینت خصوصی (نیاز به توکن - پنل ادمین)
// ==========================================
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// ۲. پیکربندی کلاینت عمومی (مخصوص منوی مشتری)
// ==========================================
export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// ۳. رهگیرها (Interceptors)
// ==========================================

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/otp") ||
      url.includes("/auth/forgot-password");

    if (!isAuthRoute) {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

      if (token && token !== "undefined" && token !== "null") {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("🔥 ارور رهگیری شده در Axios:", error);

    const reqUrl = error.config?.url || "";
    const isAuthRoute =
      reqUrl.includes("/auth/login") ||
      reqUrl.includes("/auth/otp") ||
      reqUrl.includes("/auth/forgot-password");

    // استخراج ارورهای دقیق جنگو / DRF
    let errorMessage = "خطا در ارتباط با سرور";

    if (error.response?.data) {
      const resData = error.response.data;
      if (resData.data && typeof resData.data === "object") {
        const firstKey = Object.keys(resData.data)[0];
        const firstVal = resData.data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          errorMessage = firstVal[0];
        } else if (typeof firstVal === "string") {
          errorMessage = firstVal;
        } else if (resData.message) {
          errorMessage = resData.message;
        }
      } else if (resData.errors) {
        const firstKey = Object.keys(resData.errors)[0];
        errorMessage = resData.errors[firstKey][0];
      } else if (resData.message || resData.detail || resData.title) {
        errorMessage = resData.message || resData.detail || resData.title;
      } else if (typeof resData === "string") {
        errorMessage = resData;
      }
    }

    error.message = errorMessage;

    // خروج خودکار در صورت انقضای توکن (۴۰۱) - به جز در صفحات لاگین و ثبت‌نام
    if (error.response?.status === 401 && !isAuthRoute) {
      console.warn("🔒 ارور 401: توکن منقضی یا نامعتبر است. خروج خودکار...");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("role");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

publicApiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");

    if (token && token !== "undefined" && token !== "null") {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

publicApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("ارور در کلاینت پابلیک:", error);
    return Promise.reject(error);
  },
);

// ==========================================
// ۴. توابع احراز هویت (متصل به Django accounts)
// ==========================================
export const authApi = {
  login: async (credentials: { mobile: string; password: string }) => {
    const res = await apiClient.post("/auth/login/", credentials);
    return res.data;
  },
  sendOtp: async (mobileNumber: string) => {
    const res = await apiClient.post("/auth/otp/send/", {
      mobile: mobileNumber,
    });
    return res.data;
  },
  verifyOtp: async (mobileNumber: string, code: string) => {
    const res = await apiClient.post("/auth/otp/verify/", {
      mobile: mobileNumber,
      code: code,
    });
    return res.data;
  },
  resendOtp: async (mobileNumber: string) => {
    const res = await apiClient.post("/auth/otp/resend/", {
      mobile: mobileNumber,
    });
    return res.data;
  },
  completeRegistration: async (data: {
    mobile?: string;
    name?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }) => {
    const res = await apiClient.post("/auth/complete-profile/", data);
    return res.data;
  },
  getDashboardStatus: async () => {
    const res = await apiClient.get("/auth/dashboard-status/");
    return res.data;
  },
  forgotPasswordRequest: async (mobile: string) => {
    const res = await apiClient.post("/auth/forgot-password/request/", {
      mobile,
    });
    return res.data;
  },
  forgotPasswordVerify: async (mobile: string, code: string) => {
    const res = await apiClient.post("/auth/forgot-password/verify/", {
      mobile,
      code,
    });
    return res.data;
  },
  forgotPasswordReset: async (payload: any) => {
    const res = await apiClient.post("/auth/forgot-password/reset/", payload);
    return res.data;
  },
};

// =======================
// توابع رستوران / مجموعه
// =======================
export const venuesApi = {
  checkSlug: async (slug: string) => {
    const res = await apiClient.get(
      `/restaurants/check-slug/?slug=${encodeURIComponent(slug)}`,
    );
    return res.data;
  },
  getTemplates: async () => {
    const res = await apiClient.get("/restaurants/templates/");
    return res.data;
  },
  createVenue: async (data: { name: string; slug: string }) => {
    const res = await apiClient.post("/restaurants/", data);
    return res.data;
  },
  completeVenue: async (data: {
    city: string;
    tableCount: number;
    phone: string;
    address: string;
  }) => {
    const res = await apiClient.put("/restaurants/complete/", data);
    return res.data;
  },
  getMyVenue: async () => {
    const res = await apiClient.get("/restaurants/mine/");
    return res.data;
  },
  updateSettings: async (data: {
    orderingEnabled: boolean;
    bilingual: boolean;
    callWaiterEnabled: boolean;
    callChefEnabled: boolean;
    aboutUsFa: string;
    aboutUsEn: string;
  }) => {
    const res = await apiClient.put("/restaurants/settings/", data);
    return res.data;
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/restaurants/logo/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (
      res.data?.data?.logoUrl || res.data?.logoUrl || res.data?.url || res.data
    );
  },
  updateBranding: async (data: { logoUrl: string; theme: string }) => {
    const res = await apiClient.put("/restaurants/branding/", data);
    return res.data;
  },
};

export const restaurantApi = {
  getMyRestaurant: async () => (await apiClient.get("/restaurants/mine/")).data,
};

// =======================
// توابع منو و محصولات (مدیریت)
// =======================
export const menuApi = {
  getCategories: async () => {
    const res = await apiClient.get(`/menu/categories/?_t=${Date.now()}`);
    return res.data;
  },
  createCategory: async (data: { nameFa: string; nameEn?: string }) => {
    const res = await apiClient.post("/menu/categories/", data);
    return res.data;
  },
  updateCategory: async (
    id: string,
    data: { id?: string; nameFa: string; nameEn?: string },
  ) => {
    const res = await apiClient.put(`/menu/categories/${id}/`, data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/menu/categories/${id}/`);
    return res.data;
  },

  getProducts: async () => {
    const res = await apiClient.get(`/menu/products/?_t=${Date.now()}`);
    return res.data;
  },
  createProduct: async (data: {
    categoryId: string;
    nameFa: string;
    nameEn?: string;
    descriptionFa?: string;
    descriptionEn?: string;
    price: number;
    stock: number | null;
    isAvailableInMenu: boolean;
    imageUrl?: string;
  }) => {
    const res = await apiClient.post("/menu/products/", data);
    return res.data;
  },
  updateProduct: async (
    id: string,
    data: {
      id?: string;
      categoryId: string;
      nameFa: string;
      nameEn?: string;
      descriptionFa?: string;
      descriptionEn?: string;
      price: number;
      stock: number | null;
      isAvailableInMenu: boolean;
      imageUrl?: string;
    },
  ) => {
    const res = await apiClient.put(`/menu/products/${id}/`, data);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await apiClient.delete(`/menu/products/${id}/`);
    return res.data;
  },
  uploadProductImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/menu/products/${id}/image/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (
      res.data?.data?.imageUrl ||
      res.data?.data?.url ||
      res.data?.imageUrl ||
      res.data?.url ||
      ""
    );
  },
};
// =======================
// سفارشات، صندوق و آشپزخانه
// =======================
export const ordersApi = {
  getKitchenOrders: async () => {
    const res = await apiClient.get("/orders/kitchen/");
    return res.data;
  },
  getKitchenStages: async () => {
    const res = await apiClient.get("/orders/kitchen-stages/");
    return res.data;
  },
  updateOrderStage: async (orderId: string, stageId: string) => {
    const res = await apiClient.put(
      `/orders/kitchen/${orderId}/stage/${stageId}/`,
    );
    return res.data;
  },
  completeOrder: async (orderId: string) => {
    const res = await apiClient.post(`/orders/kitchen/${orderId}/complete/`);
    return res.data;
  },
  payOrder: async (orderId: string) => {
    const res = await apiClient.post(`/orders/kitchen/${orderId}/pay/`);
    return res.data;
  },
  resolveCall: async (callId: string) => {
    const res = await apiClient.post(
      `/orders/kitchen/calls/${callId}/resolve/`,
    );
    return res.data;
  },
  updateStages: async (
    stages: {
      id: string | null;
      name: string;
      color: string;
      orderIndex: number;
    }[],
  ) => {
    const res = await apiClient.put("/orders/kitchen-stages/", stages);
    return res.data;
  },
  getKitchenWsUrl: () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      "";
    const apiRoot =
      typeof BASE_URL === "string" && BASE_URL.startsWith("http")
        ? BASE_URL
        : "http://localhost:5000/api";
    const wsBase = apiRoot.replace(/^http/, "ws").replace(/\/api\/?$/, "");
    return `${wsBase}/ws/kitchen/?token=${encodeURIComponent(token)}`;
  },
};

// =======================
// پشتیبانی و تیکت‌ها
// =======================
export const supportApi = {
  getTickets: async () => {
    const res = await apiClient.get("/support/tickets/");
    return res.data;
  },
  getTicketDetails: async (id: string) => {
    const res = await apiClient.get(`/support/tickets/${id}/`);
    return res.data;
  },
  createTicket: async (data: {
    subject: string;
    body: string;
    priority?: number;
  }) => {
    const res = await apiClient.post("/support/tickets/", data);
    return res.data;
  },
  replyTicket: async (
    id: string,
    data: { ticketId?: string; body: string },
  ) => {
    const res = await apiClient.post(`/support/tickets/${id}/reply/`, data);
    return res.data;
  },
};

// =======================
// پرسنل و تیم (متصل به Django accounts)
// =======================
export const teamApi = {
  getStaff: async () => {
    const res = await apiClient.get("/staff/");
    return res.data;
  },
  addStaff: async (data: {
    name: string;
    lastName?: string;
    mobile: string;
    password: string;
    role: "cashier" | "kitchen" | "waiter";
  }) => {
    const res = await apiClient.post("/staff/", data);
    return res.data;
  },
  toggleActive: async (id: string) => {
    const res = await apiClient.put(`/staff/${id}/active/`);
    return res.data;
  },
};

// =======================
// اشتراک و مالی
// =======================
export const subscriptionApi = {
  getPlans: async () => {
    const res = await apiClient.get(`/billing/plans/?_t=${Date.now()}`);
    return res.data;
  },
  getCurrentSubscription: async () => {
    const res = await apiClient.get(`/billing/subscription/?_t=${Date.now()}`);
    return res.data;
  },
  purchasePlan: async (planId: string) => {
    const res = await apiClient.post("/billing/subscription/purchase/", {
      planId,
    });
    return res.data;
  },
  getTransactions: async () => {
    const res = await apiClient.get(
      `/billing/wallet/transactions/?_t=${Date.now()}`,
    );
    return res.data;
  },
};

export const financialApi = {
  getReport: async (params: {
    period: "daily" | "monthly" | "yearly" | "custom";
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams({ period: params.period });
    if (params.startDate) query.append("start_date", params.startDate);
    if (params.endDate) query.append("end_date", params.endDate);
    const res = await apiClient.get(
      `/orders/financial-reports/?${query.toString()}`,
    );
    return res.data;
  },
};

export const reservationsApi = {
  getManageData: async () => {
    const res = await apiClient.get("/reservations/");
    return res.data;
  },
  createManual: async (data: {
    tableNumber: number;
    customerName: string;
    customerMobile: string;
    guestsCount?: number;
    reservationTime?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post("/reservations/", data);
    return res.data;
  },
  updateStatus: async (
    reservationId: string,
    status: "confirmed" | "cancelled" | "completed",
  ) => {
    const res = await apiClient.patch(
      `/reservations/${reservationId}/status/`,
      { status },
    );
    return res.data;
  },
  getPublicTables: async (slug: string) => {
    const res = await apiClient.get(`/reservations/public/tables/${slug}/`);
    return res.data;
  },
  createPublicReservation: async (data: {
    restaurantSlug: string;
    tableNumber: number;
    customerName: string;
    customerMobile: string;
    guestsCount?: number;
    reservationTime?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post("/reservations/public/", data);
    return res.data;
  },
};

// ==========================================
// ۵. توابع مخصوص منوی مشتری (پابلیک)
// ==========================================
export const customerApi = {
  getRestaurantInfo: async (slug: string) => {
    const res = await publicApiClient.get(`/restaurants/${slug}/`);
    return res.data;
  },
  getCategories: async (slug: string) => {
    const res = await publicApiClient.get(`/menu/public/${slug}/categories/`);
    return res.data;
  },
  getProducts: async (slug: string) => {
    const res = await publicApiClient.get(`/menu/public/${slug}/products/`);
    return res.data;
  },
  submitOrder: async (data: {
    restaurantSlug: string;
    tableNumber: number;
    customerName?: string;
    customerMobile?: string;
    items: { productId: string; quantity: number; notes?: string }[];
  }) => {
    const res = await publicApiClient.post("/orders/public/", data);
    return res.data;
  },
  getOrderStatus: async (orderId: string) => {
    const res = await publicApiClient.get(`/orders/public/${orderId}/`);
    return res.data;
  },
  callWaiter: async (data: {
    restaurantSlug: string;
    tableNumber: number;
    message?: string;
  }) => {
    const res = await publicApiClient.post("/orders/public/call-waiter/", data);
    return res.data;
  },
  callChef: async (data: {
    restaurantSlug: string;
    tableNumber: number;
    message?: string;
  }) => {
    const res = await publicApiClient.post("/orders/public/call-chef/", data);
    return res.data;
  },
  getOrderWsUrl: (orderId: string) => {
    const apiRoot =
      typeof BASE_URL === "string" && BASE_URL.startsWith("http")
        ? BASE_URL
        : "http://localhost:5000/api";
    const wsBase = apiRoot.replace(/^http/, "ws").replace(/\/api\/?$/, "");
    return `${wsBase}/ws/orders/${encodeURIComponent(orderId)}/`;
  },
};

// =======================
// کیف پول
// =======================
export const walletApi = {
  getBalance: async () => {
    const res = await apiClient.get(`/billing/wallet/?_t=${Date.now()}`);
    return res.data;
  },
  topUp: async (amount: number, receiptFile: File) => {
    const formData = new FormData();
    formData.append("amount", String(amount));
    formData.append("receipt", receiptFile);
    const res = await apiClient.post("/billing/wallet/top-up/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  getTransactions: async () => {
    const res = await apiClient.get(
      `/billing/wallet/transactions/?_t=${Date.now()}`,
    );
    return res.data;
  },
};

export const profileApi = {};
export const dashboardApi = {};
export const reportsApi = {};
export const staffApi = {};
export const kdsApi = {};
export const publicApi = {};
