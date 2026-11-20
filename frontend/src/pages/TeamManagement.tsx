import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ChefHat,
  Calculator,
  BellRing,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Phone,
  UserCheck,
  UserX,
  KeyRound,
  RefreshCcw,
} from "lucide-react";
import { teamApi } from "../service/api";

type Role = "owner" | "kitchen" | "cashier" | "waiter";

type StaffMember = {
  id: string;
  name: string;
  lastName: string;
  mobile: string;
  role: string;
  status: "active" | "inactive";
  joined_at: string;
};

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (res?.data && Array.isArray(res.data.items)) return res.data.items;
  return [];
};

export const TeamManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("cashier");

  const [successPopup, setSuccessPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await teamApi.getStaff();
      const rawData = extractArray(res);

      const formattedStaff = rawData.map((s: any) => ({
        id: String(s.id || s.Id),
        name: s.name || s.Name || "نامشخص",
        lastName: s.lastName || s.LastName || "",
        mobile: s.mobile || s.Mobile || s.phone || "ثبت نشده",
        role: String(s.role || s.Role).toLowerCase(),
        status:
          s.isActive === false || s.status === 0 || s.Status === 0
            ? "inactive"
            : "active",
        joined_at:
          s.createdAt || s.CreationDate
            ? new Intl.DateTimeFormat("fa-IR").format(
                new Date(s.createdAt || s.CreationDate),
              )
            : "امروز",
      }));

      setStaffList(formattedStaff);
    } catch (err) {
      console.error("خطا در دریافت لیست پرسنل", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "owner":
        return {
          label: "مدیر کل",
          desc: "دسترسی کامل به تنظیمات، منو، مالی و تیم",
          textClass: "text-orange-500",
          bgClass: "bg-orange-50",
          borderClass: "border-orange-200",
          icon: Shield,
        };
      case "kitchen":
        return {
          label: "آشپزخانه",
          desc: "مشاهده سفارشات، تغییر مرحله پخت و دریافت درخواست‌های سرآشپز",
          textClass: "text-blue-500",
          bgClass: "bg-blue-50",
          borderClass: "border-blue-200",
          icon: ChefHat,
        };
      case "cashier":
        return {
          label: "صندوق‌دار",
          desc: "مشاهده و دریافت سفارشات و دسترسی به حسابداری و فروش",
          textClass: "text-emerald-500",
          bgClass: "bg-emerald-50",
          borderClass: "border-emerald-200",
          icon: Calculator,
        };
      case "waiter":
        return {
          label: "گارسون",
          desc: "مشاهده درخواست‌های میزها و مراجعه به میزها",
          textClass: "text-purple-500",
          bgClass: "bg-purple-50",
          borderClass: "border-purple-200",
          icon: BellRing,
        };
      default:
        return {
          label: "کاربر ساده",
          desc: "",
          textClass: "text-slate-500",
          bgClass: "bg-slate-50",
          borderClass: "border-slate-200",
          icon: Users,
        };
    }
  };

  const openModal = () => {
    setFormName("");
    setFormPhone("");
    setFormPassword("");
    setFormRole("cashier");
    setModalError("");
    setIsModalOpen(true);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
    let pass = "";
    for (let i = 0; i < 6; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormPassword(pass);
    setModalError("");
  };

  const handleSaveStaff = async () => {
    if (!formName.trim() || !formPhone.trim() || !formPassword.trim()) {
      setModalError("لطفاً تمامی فیلدها را کامل پر کنید.");
      return;
    }
    if (formPhone.length !== 11) {
      setModalError("شماره موبایل باید دقیقاً ۱۱ رقم باشد.");
      return;
    }
    if (formPassword.length < 6) {
      setModalError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const nameParts = formName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "-";

      await teamApi.addStaff({
        name: firstName,
        lastName,
        mobile: formPhone,
        password: formPassword,
        role: formRole as "cashier" | "kitchen" | "waiter",
      });

      await fetchStaff();

      setIsModalOpen(false);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 4500);
    } catch (err: any) {
      setModalError(
        err?.message ||
          err?.detail ||
          err?.error ||
          "خطا در ثبت اطلاعات. مجدداً تلاش کنید.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStaffStatus = async (
    id: string,
    role: string,
    currentStatus: string,
  ) => {
    if (role === "owner") {
      alert("شما نمی‌توانید دسترسی یا وضعیت مدیر کل را تغییر دهید!");
      return;
    }

    const actionText = currentStatus === "active" ? "غیرفعال" : "فعال";

    if (window.confirm(`آیا از ${actionText} کردن این شخص مطمئن هستید؟`)) {
      try {
        setStaffList((prev) =>
          prev.map((staff) =>
            staff.id === id
              ? {
                  ...staff,
                  status: currentStatus === "active" ? "inactive" : "active",
                }
              : staff,
          ),
        );

        await teamApi.toggleActive(id);
      } catch (err: any) {
        alert(err?.message || "خطا در تغییر وضعیت پرسنل.");
        fetchStaff();
      }
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      staff.name.toLowerCase().includes(query) ||
      staff.lastName.toLowerCase().includes(query) ||
      staff.mobile.includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative font-sans text-slate-800 pb-28 lg:pb-12 overflow-x-hidden"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-4 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1.5 tracking-tight flex items-center gap-2">
              <Users
                className="text-orange-500 hidden md:block"
                size={28}
                strokeWidth={2.5}
              />{" "}
              مدیریت تیم و کارکنان
            </h1>
            <p className="text-slate-500 text-[13px] md:text-sm font-bold">
              تعیین سطح دسترسی برای صندوق‌دار، آشپزخانه و گارسون‌ها.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[18px] md:rounded-[20px] font-black transition-all text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> عضو جدید
          </button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
          {[
            {
              label: "کل پرسنل",
              value: staffList.length,
              icon: Users,
              color: "text-slate-700",
              bg: "bg-slate-100",
            },
            {
              label: "صندوق‌داران",
              value: staffList.filter((s) => s.role === "cashier").length,
              icon: Calculator,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "آشپزخانه",
              value: staffList.filter((s) => s.role === "kitchen").length,
              icon: ChefHat,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "گارسون‌ها",
              value: staffList.filter((s) => s.role === "waiter").length,
              icon: BellRing,
              color: "text-purple-500",
              bg: "bg-purple-50",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/80 backdrop-blur-2xl border border-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:scale-[1.02] transition-transform"
            >
              <div>
                <div className="text-[11px] md:text-xs font-bold text-slate-400 mb-1">
                  {item.label}
                </div>
                <div
                  className={`text-2xl md:text-3xl font-black tracking-tight ${item.color}`}
                >
                  {item.value.toLocaleString("fa-IR")}
                </div>
              </div>
              <div
                className={`w-12 h-12 md:w-14 md:h-14 ${item.bg} ${item.color} rounded-[16px] md:rounded-2xl flex items-center justify-center shadow-inner`}
              >
                <item.icon
                  size={24}
                  className="md:w-[26px] md:h-[26px]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[32px] md:rounded-[40px] p-5 md:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100/80 pb-6">
            <h2 className="text-[18px] md:text-xl font-black text-slate-800 tracking-tight">
              لیست دسترسی‌ها
            </h2>
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی همکار..."
                className="w-full bg-slate-50 border border-slate-200/60 text-slate-800 rounded-[16px] py-3 pr-11 pl-4 text-[13px] font-bold focus:outline-none focus:border-orange-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold text-sm">
                همکاری با این مشخصات یافت نشد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStaff.map((staff) => {
                const conf = getRoleConfig(staff.role);
                const RoleIcon = conf.icon;
                const isActive = staff.status === "active";

                return (
                  <div
                    key={staff.id}
                    className={`bg-white border ${isActive ? "border-slate-100" : "border-rose-100 opacity-75 grayscale-[20%]"} rounded-[24px] p-5 hover:border-slate-200 hover:shadow-lg transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative group overflow-hidden flex flex-col justify-between`}
                  >
                    <div
                      className={`absolute right-0 top-0 bottom-0 w-1.5 ${isActive ? conf.bgClass : "bg-rose-100"}`}
                    ></div>

                    <div>
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-sm ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                          >
                            <RoleIcon size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-[14px] mb-1 tracking-tight">
                              {staff.name}{" "}
                              {staff.lastName !== "-" ? staff.lastName : ""}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                            >
                              {conf.label}
                            </span>
                          </div>
                        </div>

                        {staff.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStaffStatus(
                                staff.id,
                                staff.role,
                                staff.status,
                              )
                            }
                            title={isActive ? "غیرفعال کردن" : "فعال کردن"}
                            className={`w-8 h-8 rounded-[12px] border flex items-center justify-center transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 shadow-sm ${
                              isActive
                                ? "bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100"
                                : "bg-rose-50 border-rose-100 text-rose-500 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100"
                            }`}
                          >
                            {isActive ? (
                              <X size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                          </button>
                        )}
                      </div>

                      {conf.desc && (
                        <p className="text-[11px] font-bold text-slate-400 mb-4 leading-relaxed">
                          {conf.desc}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50/80 rounded-[16px] p-3.5 border border-slate-100">
                      <div className="flex items-center gap-2 text-[13px] text-slate-700 font-black mb-3">
                        <Phone size={14} className="text-slate-400" />
                        <span className="font-mono dir-ltr">
                          {staff.mobile}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-400">
                          افزوده شده: {staff.joined_at}
                        </span>

                        {isActive ? (
                          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                            <UserCheck size={14} /> فعال
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-black text-rose-500">
                            <UserX size={14} /> غیرفعال
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-3xl border border-white rounded-[40px] p-6 md:p-8 w-full max-w-lg shadow-[0_30px_100px_rgba(0,0,0,0.15)] relative max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2.5 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3 mb-8 pr-2 mt-2">
              <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-orange-50 border border-orange-100 text-orange-500 shadow-sm">
                <Users size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  افزودن همکار جدید
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-1">
                  شخص جدید با شماره موبایل و این رمز وارد پنل خود خواهد شد.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[12px] font-black text-slate-700 mb-1.5 ml-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 rounded-[20px] py-3.5 px-4 font-bold text-[13px] focus:bg-white focus:outline-none focus:border-orange-500 transition-all shadow-sm placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-black text-slate-700 mb-1.5 ml-1">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="tel"
                      dir="ltr"
                      value={formPhone}
                      onChange={(e) =>
                        setFormPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="09123456789"
                      maxLength={11}
                      className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 rounded-[20px] py-3.5 pl-4 pr-11 text-left font-mono text-[14px] tracking-wider focus:bg-white focus:outline-none focus:border-orange-500 transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-black text-slate-700 mb-1.5 ml-1">
                    رمز عبور ورود
                  </label>
                  <div className="relative flex">
                    <KeyRound
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="aB1234"
                      className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 rounded-[20px] py-3.5 pl-12 pr-11 text-left font-mono text-[14px] tracking-wider focus:bg-white focus:outline-none focus:border-orange-500 transition-all shadow-sm placeholder:text-slate-400"
                    />
                    <button
                      onClick={generatePassword}
                      type="button"
                      title="تولید رمز خودکار"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600 transition-colors p-1"
                    >
                      <RefreshCcw size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-black text-slate-700 mb-3 ml-1 mt-4">
                  انتخاب نقش (سطح دسترسی)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "cashier",
                      label: "صندوق‌دار",
                      sub: "سفارشات و حسابداری",
                      icon: Calculator,
                    },
                    {
                      id: "kitchen",
                      label: "آشپزخانه",
                      sub: "سفارشات و درخواست آشپز",
                      icon: ChefHat,
                    },
                    {
                      id: "waiter",
                      label: "گارسون",
                      sub: "فقط درخواست میزها",
                      icon: BellRing,
                    },
                  ].map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setFormRole(role.id as Role)}
                      className={`cursor-pointer border-2 rounded-[20px] p-3 flex flex-col items-center text-center transition-all ${
                        formRole === role.id
                          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-500/10"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-2 shadow-inner ${formRole === role.id ? "bg-white text-orange-500" : "bg-slate-50 text-slate-400"}`}
                      >
                        <role.icon size={20} strokeWidth={2.5} />
                      </div>
                      <span
                        className={`font-black text-[12px] ${formRole === role.id ? "text-orange-700" : "text-slate-600"}`}
                      >
                        {role.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {role.sub}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-600 text-[11px] font-black bg-rose-50 p-3.5 rounded-[16px] border border-rose-100">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveStaff}
              disabled={isSaving}
              className="w-full py-4 rounded-[20px] font-black transition-all flex items-center justify-center gap-2 text-[14px] bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "ایجاد دسترسی همکار"
              )}
            </button>
          </div>
        </div>
      )}

      {successPopup && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md border border-emerald-100 rounded-[20px] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-10 h-10 bg-emerald-50 rounded-[14px] flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-[13px] tracking-tight">
              عضو جدید اضافه شد!
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">
              رمز عبور و موبایل را به همکارتان اطلاع دهید.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
