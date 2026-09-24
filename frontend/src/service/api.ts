// آدرس پایه بک‌اند جنگو
export const API_BASE_URL = "http://127.0.0.1:8000/api";

// هدر احراز هویت (خواندن در لحظه توکن برای جلوگیری از باگ)
export const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// ==========================================
// 1. احراز هویت و حساب کاربری (Auth & Accounts)
// ==========================================
export const authApi = {
  // ارسال پیامک کد تایید (OTP)
  sendOtp: async (phone_number: string) => {
    const res = await fetch(`${API_BASE_URL}/accounts/send-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // بررسی و تایید کد پیامک
  verifyOtp: async (phone_number: string, otp: string) => {
    const res = await fetch(`${API_BASE_URL}/accounts/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number, otp }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // لاگین پرسنل (صندوق‌دار، گارسون، آشپز) با شماره و رمز عبور
  login: async (data: {
    phone_number?: string;
    phone?: string;
    password: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/accounts/staff-login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // تکمیل اطلاعات پروفایل بعد از اولین ثبت نام مدیر
  completeRegistration: async (data: {
    first_name: string;
    last_name: string;
    password: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/accounts/complete-profile/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // دریافت وضعیت حساب برای رندر کردن داشبورد
  getDashboardStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/accounts/dashboard-status/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // فراموشی رمز عبور - ارسال کد
  sendForgotPasswordOtp: async (phone_number: string) => {
    const res = await fetch(
      `${API_BASE_URL}/accounts/forgot-password/send-otp/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number }),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // فراموشی رمز عبور - تایید کد
  verifyForgotPasswordOtp: async (phone_number: string, code: string) => {
    const res = await fetch(
      `${API_BASE_URL}/accounts/forgot-password/verify-otp/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number, code }),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // فراموشی رمز عبور - تنظیم رمز جدید
  resetPassword: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/accounts/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

// ==========================================
// 2. مدیریت رستوران‌ها (Venues)
// ==========================================
export const venuesApi = {
  createVenue: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/venues/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  getMyVenue: async () => {
    const res = await fetch(`${API_BASE_URL}/venues/me/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  updateVenueSettings: async (formData: FormData) => {
    const res = await fetch(`${API_BASE_URL}/venues/me/`, {
      method: "PATCH",
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getTemplates: async () => {
    const res = await fetch(`${API_BASE_URL}/venues/templates/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

// ==========================================
// درخواست‌های عمومی (منوی مشتری)
// ==========================================

// ==========================================
// 3. مدیریت اشتراک‌ها (Subscriptions)
// ==========================================
export const subscriptionApi = {
  getData: async () => {
    const res = await fetch(`${API_BASE_URL}/subscription/data/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  purchase: async (plan_code: string, duration: string) => {
    const res = await fetch(`${API_BASE_URL}/subscription/purchase/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ plan_code, duration }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

// ==========================================
// 4. مدیریت تیم و پرسنل (Team)
// ==========================================
export const teamApi = {
  getStaff: async () => {
    const res = await fetch(`${API_BASE_URL}/venues/staff/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  addStaff: async (data: any) => {
    // کلمه api رو از اول مسیر حذف کردم
    const res = await fetch(`${API_BASE_URL}/accounts/staff/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

// ==========================================
// 5. آشپزخانه و سفارشات زنده (Kitchen)
// ==========================================
export const kitchenApi = {
  getOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/kitchen/orders/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (res.status === 404) return [];
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};
// ==========================================
// 6. منوی عمومی مشتریان (Public API)
// ==========================================
export const publicApi = {
  getLiveMenu: async (slug: string) => {
    // 🔴 دقت کن که اینجا از getAuthHeader استفاده نمی‌کنیم چون مشتری لاگین نیست
    const res = await fetch(`${API_BASE_URL}/menu/public/${slug}/`);
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

// 🔴 این بخش اصلاح شد و به جای api.post از fetch استاندارد استفاده می‌کند
export const ordersApi = {
  // 🍔 ثبت سفارش از طرف مشتری
  createOrder: async (venueSlug: string, data: any) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/public/${venueSlug}/create-order/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔴 اینجا getAuthHeader نیاز نیست چون مشتری لاگین نکرده
        },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // 👨‍🍳 دریافت زنده سفارشات و مراحل برای آشپزخانه
  getKitchenOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/orders/kitchen/orders/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // 🔥 انتقال سفارش به مرحله بعد
  advanceOrder: async (orderId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/kitchen/orders/${orderId}/advance/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // 💳 تسویه حساب سفارش
  payOrder: async (orderId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/kitchen/orders/${orderId}/pay/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  // 📍 رهگیری زنده وضعیت سفارش توسط مشتری
  getOrderStatus: async (orderId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/public/order-status/${orderId}/`,
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  // 🔴 ذخیره مراحل داینامیک پخت (مخصوص پنل تنظیمات آشپزخانه)
  updateStages: async (stages: any[]) => {
    const res = await fetch(`${API_BASE_URL}/orders/kitchen/stages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ stages }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  // 🛎️ ارسال درخواست گارسون یا آشپز
  // 🔴 ارسال درخواست گارسون یا آشپز (توسط مشتری)
  callStaff: async (
    venueSlug: string,
    data: { table_number: string; call_type: string },
  ) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/public/${venueSlug}/call/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // ✅ زدن تیک انجام شد برای درخواست میز
  resolveCall: async (callId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/orders/kitchen/calls/${callId}/resolve/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};
// ==========================================
// 7. مدیریت منو و محصولات (Menu & Products)
// ==========================================
// ==========================================
// 7. مدیریت منو و محصولات (Menu & Products)
// ==========================================
export const menuApi = {
  // دریافت کل دسته‌بندی‌ها و محصولات داخلشان
  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // ساخت دسته‌بندی جدید
  createCategory: async (data: { name: string; position?: number }) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // ویرایش دسته‌بندی (اضافه شد 🔴)
  updateCategory: async (
    id: number,
    data: { name: string; position?: number },
  ) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // حذف دسته‌بندی (اضافه شد 🔴)
  deleteCategory: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok && res.status !== 204) throw await res.json();
    return res;
  },

  // اضافه کردن محصول جدید
  createProduct: async (data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/menu/products/`, {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeader(),
      },
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // ویرایش محصول (اضافه شد 🔴)
  updateProduct: async (id: number, data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/menu/products/${id}/`, {
      method: "PATCH",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...getAuthHeader(),
      },
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // حذف یک محصول
  deleteProduct: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/menu/products/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok && res.status !== 204) throw await res.json();
    return res;
  },
};
// ==========================================
// 8. سیستم پشتیبانی (Support)
// ==========================================
export const supportApi = {
  getTickets: async () => {
    const res = await fetch(`${API_BASE_URL}/support/tickets/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  createTicket: async (data: { subject: string; message: string }) => {
    const res = await fetch(`${API_BASE_URL}/support/tickets/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  getTicketDetails: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/support/tickets/${id}/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  replyTicket: async (id: number, message: string) => {
    const res = await fetch(`${API_BASE_URL}/support/tickets/${id}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};
