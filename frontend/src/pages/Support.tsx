import { useState, useEffect, useRef } from "react";
import {
  Headset,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Inbox,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  X,
  User,
  Shield,
  Search,
} from "lucide-react";
import { supportApi } from "../service/api"; // 🔴 اتصال به API واقعی

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch (error) {
    return "تاریخ نامشخص";
  }
};

export const Support = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    answered: 0,
    closed: 0,
  });

  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTicketDetails) scrollToBottom();
  }, [activeTicketDetails]);

  // =======================
  // 🔴 دریافت اطلاعات واقعی از سرور
  // =======================
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const data = await supportApi.getTickets();
      setTickets(data.tickets);
      setStats(data.stats);
    } catch (error) {
      console.error("خطا در دریافت لیست تیکت‌ها:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 🔴 دریافت جزئیات یک تیکت (پیام‌های چت)
  const handleSelectTicket = async (id: number) => {
    setActiveTicketId(id);
    setIsChatLoading(true);

    try {
      const data = await supportApi.getTicketDetails(id);
      setActiveTicketDetails(data);
    } catch (error) {
      console.error("خطا در دریافت پیام‌های تیکت:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 🔴 ارسال پاسخ جدید
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    setIsReplying(true);
    try {
      const updatedTicket = await supportApi.replyTicket(
        activeTicketId,
        replyMessage,
      );

      // آپدیت کردن چت فعلی با اطلاعات جدیدی که از سرور اومد
      setActiveTicketDetails(updatedTicket);

      // آپدیت کردن وضعیت تیکت در لیست منوی کناری به "در انتظار پاسخ"
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicketId
            ? { ...t, status: "pending", status_display: "در انتظار پاسخ" }
            : t,
        ),
      );

      setReplyMessage("");
    } catch (error: any) {
      alert(error.error || "خطا در ارسال پیام.");
    } finally {
      setIsReplying(false);
    }
  };

  // 🔴 ایجاد تیکت جدید
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      setModalError("لطفاً موضوع و متن پیام را کامل کنید.");
      return;
    }
    setIsCreating(true);
    setModalError("");

    try {
      await supportApi.createTicket({
        subject: newSubject,
        message: newMessage,
      });

      // بعد از ثبت، لیست تیکت‌ها رو دوباره از سرور می‌گیریم تا تیکت جدید اضافه بشه
      await fetchTickets();

      setIsModalOpen(false);
      setNewSubject("");
      setNewMessage("");
    } catch (error: any) {
      setModalError(error.error || "خطا در ثبت تیکت. مجدداً تلاش کنید.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    if (status === "pending")
      return "text-amber-600 bg-amber-50 border-amber-200";
    if (status === "answered")
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative font-sans text-slate-800 pb-12"
      dir="rtl"
    >
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto">
        <header className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white text-orange-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
              <Headset size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              پشتیبانی
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            ارسال و پیگیری درخواست‌ها، نظرات و رفع مشکلات منوی دیجیتال.
          </p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                کل تیکت‌ها
              </div>
              <div className="text-2xl font-black text-slate-800">
                {stats?.total || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100">
              <Ticket size={24} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-amber-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                در انتظار پاسخ
              </div>
              <div className="text-2xl font-black text-amber-500">
                {stats?.pending || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100">
              <Clock size={24} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-emerald-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                پاسخ داده شده
              </div>
              <div className="text-2xl font-black text-emerald-500">
                {stats?.answered || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-rose-200 transition-colors shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">
                بسته شده
              </div>
              <div className="text-2xl font-black text-rose-500">
                {stats?.closed || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100">
              <XCircle size={24} />
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ستون راست: لیست تیکت‌ها */}
          <div className="lg:col-span-4 xl:col-span-4 bg-white/80 backdrop-blur-xl border border-white shadow-sm rounded-[28px] p-5 flex flex-col h-[500px] lg:h-[650px] relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-lg font-black text-slate-800">
                لیست تیکت‌ها
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-md shadow-orange-500/20"
              >
                <Plus size={16} strokeWidth={3} /> تیکت جدید
              </button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="جستجو در تیکت‌ها..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pr-9 pl-3 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {!tickets || tickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-400 shadow-sm">
                    <Inbox size={32} />
                  </div>
                  <h3 className="text-slate-800 font-black mb-2">
                    تیکتی یافت نشد
                  </h3>
                  <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-[200px]">
                    برای ارتباط با تیم پشتیبانی، دکمه "تیکت جدید" را بزنید.
                  </p>
                </div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`w-full text-right p-4 rounded-2xl transition-all border shrink-0 ${
                      activeTicketId === t.id
                        ? "bg-orange-50 border-orange-200 shadow-sm"
                        : "bg-white border-slate-100 hover:border-orange-100 hover:bg-orange-50/50 shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <h3
                        className={`font-bold text-sm line-clamp-1 flex-1 ${activeTicketId === t.id ? "text-orange-700" : "text-slate-700"}`}
                      >
                        {t.subject}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0 mr-3">
                        {formatDate(t.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        شماره: #{t.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusColor(
                          t.status,
                        )}`}
                      >
                        {t.status_display}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ستون چپ: محیط چت */}
          <div className="lg:col-span-8 xl:col-span-8 bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-[28px] flex flex-col h-[500px] lg:h-[650px] relative overflow-hidden">
            {!activeTicketId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 opacity-50 pointer-events-none">
                  <MessageSquare size={250} />
                </div>
                <div className="relative z-10 flex flex-col items-center max-w-sm">
                  <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 text-orange-500 border border-slate-100 shadow-xl shadow-orange-500/10">
                    <MessageSquare size={36} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">
                    تیکت را انتخاب کنید
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">
                    برای مشاهده گفتگو و پاسخ‌های تیم پشتیبانی MenuJet، یک تیکت
                    از لیست کنار انتخاب کنید.
                  </p>
                </div>
              </div>
            ) : isChatLoading ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                <Loader2 className="animate-spin text-orange-500" size={40} />
              </div>
            ) : (
              activeTicketDetails && (
                <>
                  {/* هدر چت */}
                  <div className="bg-white border-b border-slate-100 p-5 shrink-0 flex justify-between items-center z-10 shadow-sm">
                    <div>
                      <h3 className="font-black text-slate-800 text-[15px]">
                        {activeTicketDetails?.subject}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                        تیکت #{activeTicketDetails?.id}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${getStatusColor(
                        activeTicketDetails?.status,
                      )}`}
                    >
                      {activeTicketDetails?.status_display}
                    </span>
                  </div>

                  {/* محیط چت */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full z-10 relative bg-slate-50/50">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

                    {(activeTicketDetails?.messages || []).map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex relative z-10 ${
                          msg.is_admin_reply ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                            msg.is_admin_reply ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <div className="shrink-0 mt-auto mb-6">
                            {msg.is_admin_reply ? (
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shadow-sm">
                                <Shield size={18} />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-white text-orange-500 flex items-center justify-center border border-slate-200 shadow-sm">
                                <User size={18} />
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex flex-col ${
                              msg.is_admin_reply ? "items-start" : "items-end"
                            }`}
                          >
                            <div
                              className={`p-4 text-[13px] leading-loose whitespace-pre-wrap font-medium shadow-sm ${
                                msg.is_admin_reply
                                  ? "bg-white text-slate-700 rounded-2xl rounded-tr-sm border border-slate-200"
                                  : "bg-orange-500 text-white rounded-2xl rounded-tl-sm shadow-orange-500/20"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1.5 font-mono px-1">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* نوار ارسال پیام */}
                  <div className="p-4 bg-white border-t border-slate-100 shrink-0 z-10 relative">
                    {activeTicketDetails?.status === "closed" ? (
                      <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold p-4 rounded-xl text-center flex justify-center items-center gap-2 shadow-sm">
                        <XCircle size={18} /> این تیکت بسته شده است و امکان
                        ارسال پیام جدید وجود ندارد.
                      </div>
                    ) : (
                      <form
                        onSubmit={handleReply}
                        className="flex items-end gap-3"
                      >
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 focus-within:bg-white focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all shadow-sm">
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="پیام خود را بنویسید..."
                            className="w-full bg-transparent text-slate-800 font-medium text-sm outline-none resize-none min-h-[44px] max-h-32 p-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 placeholder:text-slate-400"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(e);
                              }
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isReplying || !replyMessage.trim()}
                          className="w-14 h-14 shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-orange-500/20"
                        >
                          {isReplying ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Send
                              size={20}
                              className="mr-1 transform rotate-180"
                            />
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* =======================
          مودال ساخت تیکت جدید
      ======================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 pr-2 mt-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 border border-orange-100 text-orange-500 shadow-sm">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  ثبت تیکت جدید
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  مشکل یا درخواست خود را مطرح کنید
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در ویرایش منو"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 px-4 text-sm focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">
                  متن کامل پیام
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="توضیحات خود را کامل بنویسید..."
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl py-3.5 px-4 text-sm font-medium focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-sm placeholder:text-slate-300"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-600 text-sm font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <AlertTriangle size={18} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateTicket}
              disabled={isCreating}
              className="w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "ارسال تیکت به پشتیبانی"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
