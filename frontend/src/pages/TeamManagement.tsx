import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ChefHat,
  Calculator,
  BellRing,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Phone,
  UserCheck,
  KeyRound,
  RefreshCcw,
} from "lucide-react";
import { teamApi } from "../service/api"; // 🔴 اتصال به بک‌‌اند

type Role = "owner" | "kitchen" | "cashier" | "waiter";

type StaffMember = {
  id: number;
  name: string;
  phone: string;
  role: Role;
  status: "active" | "inactive";
  joined_at: string;
};

export const TeamManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // استیت‌های مودال افزودن/ویرایش
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("cashier");

  const [successPopup, setSuccessPopup] = useState(false);

  // =======================
  // 🔴 دریافت اطلاعات واقعی پرسنل از جنگو
  // =======================
  const fetchStaff = async () => {
    try {
      const data = await teamApi.getStaff();
      setStaffList(data);
    } catch (err) {
      console.error("خطا در دریافت لیست پرسنل", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const getRoleConfig = (role: Role) => {
    switch (role) {
      case "owner":
        return {
          label: "مدیر کل",
          color: "text-orange-500",
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: Shield,
        };
      case "kitchen":
        return {
          label: "آشپزخانه",
          color: "text-blue-500",
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: ChefHat,
        };
      case "cashier":
        return {
          label: "صندوق‌دار",
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: Calculator,
        };
      case "waiter":
        return {
          label: "گارسون",
          color: "text-purple-500",
          bg: "bg-purple-50",
          border: "border-purple-200",
          icon: BellRing,
        };
      default:
        return {
          label: "نامشخص",
          color: "text-slate-500",
          bg: "bg-slate-50",
          border: "border-slate-200",
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

  // =======================
  // 🔴 ارسال پرسنل جدید به جنگو
  // =======================
  const handleSaveStaff = async () => {
    if (!formName.trim() || !formPhone.trim() || !formPassword.trim()) {
      setModalError("لطفاً تمامی فیلدها را کامل پر کنید.");
      return;
    }
    if (formPhone.length < 10) {
      setModalError("شماره موبایل نامعتبر است.");
      return;
    }
    if (formPassword.length < 6) {
      setModalError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      await teamApi.addStaff({
        name: formName,
        phone: formPhone,
        password: formPassword,
        role: formRole,
      });

      // رفرش کردن لیست بعد از اضافه شدن موفقیت‌آمیز
      await fetchStaff();

      setIsModalOpen(false);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 4000);
    } catch (err: any) {
      setModalError(err.error || "خطا در ثبت اطلاعات. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = (id: number, role: Role) => {
    if (role === "owner") {
      alert("شما نمی‌توانید مدیر کل را حذف کنید!");
      return;
    }
    if (window.confirm("آیا از حذف دسترسی این شخص مطمئن هستید؟")) {
      // بعداً API حذف را متصل می‌کنیم
      setStaffList((prev) => prev.filter((staff) => staff.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-sans text-slate-800 pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto">
        <header className="mb-10 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white text-orange-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              مدیریت تیم و کارکنان
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            تعیین سطح دسترسی برای صندوق‌دار، آشپزخانه و گارسون‌ها بدون نیاز به
            اشتراک‌گذاری رمز اصلی.
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-orange-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                کل پرسنل
              </div>
              <div className="text-2xl font-black text-slate-800">
                {staffList.length.toLocaleString("fa-IR")}{" "}
                <span className="text-xs text-slate-400 font-bold">نفر</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-emerald-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                صندوق‌داران
              </div>
              <div className="text-2xl font-black text-emerald-500">
                {staffList
                  .filter((s) => s.role === "cashier")
                  .length.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
              <Calculator size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                آشپزخانه
              </div>
              <div className="text-2xl font-black text-blue-500">
                {staffList
                  .filter((s) => s.role === "kitchen")
                  .length.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center border border-blue-100">
              <ChefHat size={20} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-purple-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                گارسون‌ها
              </div>
              <div className="text-2xl font-black text-purple-500">
                {staffList
                  .filter((s) => s.role === "waiter")
                  .length.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center border border-purple-100">
              <BellRing size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_15px_40px_rgb(0,0,0,0.04)] rounded-[32px] p-6 md:p-8 flex flex-col relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              لیست دسترسی‌ها
            </h2>
            <div className="flex w-full sm:w-auto gap-3">
              <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="جستجوی همکار..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pr-9 pl-3 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <button
                onClick={openModal}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 shrink-0"
              >
                <Plus size={18} strokeWidth={2.5} /> عضو جدید
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const roleConfig = getRoleConfig(staff.role);
              const RoleIcon = roleConfig.icon;

              return (
                <div
                  key={staff.id}
                  className="bg-white border border-slate-200 rounded-[20px] p-5 hover:border-orange-200 transition-colors shadow-sm relative group overflow-hidden"
                >
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-1 ${roleConfig.bg}`}
                  ></div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}
                      >
                        <RoleIcon size={22} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-[15px] mb-1">
                          {staff.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}
                        >
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>
                    {staff.role !== "owner" && (
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.role)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Phone size={14} className="text-slate-400" />
                      <span className="font-mono dir-ltr tracking-wide">
                        {staff.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-400">
                        تاریخ افزودن: {staff.joined_at}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                        <UserCheck size={14} /> دسترسی فعال
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full animate-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 pr-2 mt-2">
              <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-orange-50 border border-orange-100 text-orange-500 shadow-sm">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  افزودن همکار جدید
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  شخص جدید با شماره موبایل خود وارد پنل اختصاصی‌اش خواهد شد.
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 px-4 font-bold text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      value={formPhone}
                      onChange={(e) =>
                        setFormPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="09123456789"
                      maxLength={11}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 pl-4 pr-11 text-left font-mono text-[15px] tracking-wider focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                    رمز عبور موقت
                  </label>
                  <div className="relative flex">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="مثال: aB1234"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 pl-12 pr-11 text-left font-mono text-[15px] tracking-wider focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-sans"
                    />
                    <button
                      onClick={generatePassword}
                      type="button"
                      title="تولید رمز عبور خودکار"
                      className="absolute inset-y-0 left-0 pl-3 pr-3 flex items-center text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3 ml-1 mt-2">
                  انتخاب سطح دسترسی (نقش)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "cashier",
                      label: "صندوق‌دار",
                      desc: "مدیریت سفارشات",
                      icon: Calculator,
                      color: "emerald",
                    },
                    {
                      id: "kitchen",
                      label: "آشپزخانه",
                      desc: "پنل پخت و تحویل",
                      icon: ChefHat,
                      color: "blue",
                    },
                    {
                      id: "waiter",
                      label: "گارسون",
                      desc: "مدیریت میزها",
                      icon: BellRing,
                      color: "purple",
                    },
                  ].map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setFormRole(role.id as Role)}
                      className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center text-center transition-all ${
                        formRole === role.id
                          ? `border-${role.color}-500 bg-${role.color}-50 shadow-md shadow-${role.color}-500/10`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-inner ${formRole === role.id ? `bg-white text-${role.color}-500` : "bg-slate-50 text-slate-400 border border-slate-100"}`}
                      >
                        <role.icon size={20} />
                      </div>
                      <span
                        className={`font-black text-sm mb-1 ${formRole === role.id ? `text-${role.color}-700` : "text-slate-600"}`}
                      >
                        {role.label}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 leading-tight">
                        {role.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in slide-in-from-top-2">
                  <AlertTriangle size={18} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveStaff}
              disabled={isSaving}
              className="w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[15px] bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  ایجاد دسترسی <UserCheck size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {successPopup && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">
              عضو جدید اضافه شد!
            </h4>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              رمز عبور و موبایل را به همکارتان اطلاع دهید.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
