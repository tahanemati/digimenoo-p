export const API_BASE_URL = "http://127.0.0.1:8000/api";

export const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authApi = {
  sendOtp: async (phoneNumber: string) => {
    const res = await fetch(`${API_BASE_URL}/accounts/register/send-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  verifyOtp: async (phoneNumber: string, code: string) => {
    const res = await fetch(`${API_BASE_URL}/accounts/register/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  completeRegistration: async (userData: any) => {
    const res = await fetch(`${API_BASE_URL}/accounts/register/complete/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },

  // =====================================
  // بخش فراموشی رمز عبور (اصلاح شده با fetch)
  // =====================================
  forgotPasswordSendOtp: async (phone_number: string) => {
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

  forgotPasswordVerifyOtp: async (phone_number: string, code: string) => {
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

  resetPassword: async (data: { phone_number: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/accounts/forgot-password/reset/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

export const venuesApi = {
  createVenue: async (venueData: any) => {
    const res = await fetch(`${API_BASE_URL}/venues/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(venueData),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getMyVenue: async () => {
    const res = await fetch(`${API_BASE_URL}/venues/my-venue/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  updateSettings: async (data: any) => {
    const isFormData = data instanceof FormData;
    const headers: any = { ...getAuthHeader() };
    if (!isFormData) headers["Content-Type"] = "application/json";
    const res = await fetch(`${API_BASE_URL}/venues/settings/`, {
      method: "PUT",
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

export const financeApi = {
  getSubscription: async () => {
    const res = await fetch(`${API_BASE_URL}/finance/subscription/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  renewSubscription: async (planCode: string) => {
    const res = await fetch(`${API_BASE_URL}/finance/subscription/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ plan_code: planCode }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getPaymentHistory: async () => {
    const res = await fetch(`${API_BASE_URL}/finance/history/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getWalletInfo: async () => {
    const res = await fetch(`${API_BASE_URL}/finance/wallet/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  walletAction: async (
    actionType: "deposit" | "withdraw",
    amount: number,
    extraData?: any,
  ) => {
    const res = await fetch(`${API_BASE_URL}/finance/wallet/${actionType}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ amount, ...extraData }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getPlans: async () => {
    const res = await fetch(
      `${API_BASE_URL}/finance/plans/?t=${new Date().getTime()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

export const menuApi = {
  getCategories: async () => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  createCategory: async (name: string) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  updateCategory: async (id: number, name: string) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  deleteCategory: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return true;
  },
  createProduct: async (data: any) => {
    const isFormData = data instanceof FormData;
    const headers: any = { ...getAuthHeader() };
    if (!isFormData) headers["Content-Type"] = "application/json";
    const res = await fetch(`${API_BASE_URL}/menu/items/`, {
      method: "POST",
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  updateProduct: async (id: number, data: any) => {
    const isFormData = data instanceof FormData;
    const headers: any = { ...getAuthHeader() };
    if (!isFormData) headers["Content-Type"] = "application/json";
    const res = await fetch(`${API_BASE_URL}/menu/items/${id}/`, {
      method: "PATCH",
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  deleteProduct: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/menu/items/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return true;
  },
};

export const publicApi = {
  getLiveMenu: async (englishName: string) => {
    const res = await fetch(
      `${API_BASE_URL}/menu/public/${englishName}/?t=${new Date().getTime()}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  submitOrder: async (englishName: string, orderData: any) => {
    const res = await fetch(
      `${API_BASE_URL}/menu/public/${englishName}/submit-order/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  callWaiter: async (englishName: string, tableNumber: string) => {
    const res = await fetch(
      `${API_BASE_URL}/menu/public/${englishName}/call-waiter/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: tableNumber }),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

export const kitchenApi = {
  getOrders: async () => {
    const res = await fetch(
      `${API_BASE_URL}/menu/kitchen-orders/?t=${new Date().getTime()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        cache: "no-store",
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  updateOrderStatus: async (id: number, payload: any) => {
    const res = await fetch(
      `${API_BASE_URL}/menu/kitchen-orders/${id}/change_status/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getWaiterCalls: async () => {
    const res = await fetch(
      `${API_BASE_URL}/menu/waiter-calls/?t=${new Date().getTime()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        cache: "no-store",
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  resolveWaiterCall: async (id: number) => {
    const res = await fetch(
      `${API_BASE_URL}/menu/waiter-calls/${id}/resolve/`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      },
    );
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};

export const supportApi = {
  getTickets: async () => {
    const res = await fetch(`${API_BASE_URL}/venues/tickets/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  createTicket: async (subject: string, message: string) => {
    const res = await fetch(`${API_BASE_URL}/venues/tickets/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ subject, message }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  getTicketDetails: async (ticketId: number) => {
    const res = await fetch(`${API_BASE_URL}/venues/tickets/${ticketId}/`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
  replyTicket: async (ticketId: number, message: string) => {
    const res = await fetch(`${API_BASE_URL}/venues/tickets/${ticketId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw await res.json();
    return await res.json();
  },
};
