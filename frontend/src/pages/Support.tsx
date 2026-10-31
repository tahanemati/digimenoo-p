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
  ShieldCheck,
  Search,
  CheckCheck,
} from "lucide-react";
import { supportApi } from "../service/api";

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch (error) {
    return "نامشخص";
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

  // اسکرول نرم به پایین چت
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeTicketDetails?.messages]);

  // =======================
  // 🔴 دریافت لیست تیکت‌ها
  // =======================
  const fetchTickets = async () => {
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

  // =======================
  // 🔴 دریافت زنده پیام‌ها (ارتباط با تلگرام ادمین)
  // =======================
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    if (activeTicketId) {
      // دریافت اولیه هنگام کلیک روی تیکت
      const loadTicket = async () => {
        setIsChatLoading(true);
        try {
          const data = await supportApi.getTicketDetails(activeTicketId);
          setActiveTicketDetails(data);
        } catch (error) {
          console.error("خطا در دریافت چت:", error);
        } finally {
          setIsChatLoading(false);
        }
      };

      loadTicket();

      // 🔴 هر 5 ثانیه چک می‌کند آیا ادمین از تلگرام پاسخی داده است یا خیر
      pollingInterval = setInterval(async () => {
        try {
          const data = await supportApi.getTicketDetails(activeTicketId);
          // اگر تعداد پیام‌ها تغییر کرده بود، استیت را آپدیت کن تا چت بروز شود
          setActiveTicketDetails((prev: any) => {
            if (!prev || prev.messages.length !== data.messages.length) {
              return data;
            }
            return prev;
          });
        } catch (error) {}
      }, 5000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [activeTicketId]);

  // =======================
  // 🔴 ارسال پاسخ توسط کاربر
  // =======================
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    setIsReplying(true);
    try {
      const updatedTicket = await supportApi.replyTicket(
        activeTicketId,
        replyMessage,
      );

      setActiveTicketDetails(updatedTicket);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicketId
            ? { ...t, status: "pending", status_display: "در انتظار پاسخ" }
            : t,
        ),
      );
      setReplyMessage("");
      scrollToBottom();
    } catch (error: any) {
      alert(error.error || "خطا در ارسال پیام.");
    } finally {
      setIsReplying(false);
    }
  };

  // =======================
  // 🔴 ایجاد تیکت جدید
  // =======================
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
      return "text-amber-500 bg-amber-50 border-amber-200";
    if (status === "answered")
      return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (status === "closed") return "text-rose-500 bg-rose-50 border-rose-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  return (
    <div
      className="min-h-screen bg-slate-50 relative font-sans text-slate-800 pb-12 overflow-x-hidden"
      dir="rtl"
    >
      {/* 🔴 افکت‌های بک‌گراند مدرن */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white text-blue-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                <Headset size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                پشتیبانی <span className="text-blue-500">کیومیزبان</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-bold">
              درخواست‌ها، نظرات و مشکلات خود را مستقیماً با کارشناسان ما در میان
              بگذارید.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-black transition-all text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={3} /> ارسال تیکت جدید
          </button>
        </header>

        {/* 🔴 کارت‌های آمار */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: "کل تیکت‌ها",
              value: stats.total,
              icon: Ticket,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "در انتظار پاسخ",
              value: stats.pending,
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "پاسخ داده شده",
              value: stats.answered,
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "تیکت‌های بسته",
              value: stats.closed,
              icon: XCircle,
              color: "text-rose-500",
              bg: "bg-rose-50",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-[24px] p-6 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1.5">
                  {item.label}
                </div>
                <div className={`text-3xl font-black ${item.color}`}>
                  {item.value}
                </div>
              </div>
              <div
                className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-inner`}
              >
                <item.icon size={26} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>

        {/* 🔴 پنل اصلی تیکت‌ها (لیست + چت) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] lg:h-[700px]">
          {/* بخش راست: لیست تیکت‌ها */}
          <div className="lg:col-span-4 bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                <Inbox size={20} className="text-blue-500" /> صندوق پیام‌ها
              </h2>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="جستجو در موضوع تیکت‌ها..."
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl py-3 pr-11 pl-4 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 transition-colors">
              {!tickets || tickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[200px]">
                    هیچ تیکتی وجود ندارد. برای ارتباط با پشتیبانی تیکت جدید
                    بسازید.
                  </p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`w-full cursor-pointer p-4 rounded-[20px] transition-all border-2 text-right group ${
                      activeTicketId === t.id
                        ? "bg-blue-50/50 border-blue-400 shadow-md shadow-blue-500/10"
                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className={`font-black text-[14px] line-clamp-1 pl-2 ${activeTicketId === t.id ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}`}
                      >
                        {t.subject}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        #{t.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> {formatDate(t.created_at)}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${getStatusColor(t.status)}`}
                      >
                        {t.status_display}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* بخش چپ: صفحه چت (Messenger Style) */}
          <div className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col overflow-hidden relative">
            {!activeTicketId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 relative overflow-hidden">
                <MessageSquare
                  size={300}
                  className="absolute text-slate-200/50 -rotate-12 blur-[2px]"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 text-blue-500 border border-slate-200 shadow-xl shadow-blue-500/10">
                    <MessageSquare size={36} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">
                    پشتیبانی آنلاین
                  </h3>
                  <p className="text-slate-500 font-bold leading-relaxed text-sm max-w-[250px]">
                    برای مشاهده گفتگو و دریافت پاسخ از کارشناسان، یک تیکت انتخاب
                    کنید.
                  </p>
                </div>
              </div>
            ) : isChatLoading ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                <Loader2 className="animate-spin text-blue-500" size={40} />
              </div>
            ) : (
              activeTicketDetails && (
                <>
                  {/* هدر چت */}
                  <div className="bg-white border-b border-slate-100 p-5 shrink-0 flex justify-between items-center z-10 shadow-sm relative">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-[15px] mb-1">
                          {activeTicketDetails?.subject}
                        </h3>
                        <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
                          تیم پشتیبانی پاسخگو است
                        </p>
                      </div>
                    </div>
                    <div className="text-left hidden sm:block">
                      <span
                        className={`text-[11px] font-black px-3 py-1.5 rounded-xl border shadow-sm ${getStatusColor(activeTicketDetails?.status)}`}
                      >
                        {activeTicketDetails?.status_display}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                        تیکت #{activeTicketDetails?.id}
                      </p>
                    </div>
                  </div>

                  {/* محیط چت */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full z-10 relative bg-[#f8fafc]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

                    {(activeTicketDetails?.messages || []).map((msg: any) => {
                      const isAdmin = msg.is_admin_reply;
                      return (
                        <div
                          key={msg.id}
                          className={`flex relative z-10 ${isAdmin ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isAdmin ? "flex-row" : "flex-row-reverse"}`}
                          >
                            {/* آواتار */}
                            <div className="shrink-0 flex items-end">
                              {isAdmin ? (
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                                  <ShieldCheck size={16} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md">
                                  <User size={16} />
                                </div>
                              )}
                            </div>

                            {/* حباب پیام */}
                            <div
                              className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                            >
                              {isAdmin && (
                                <span className="text-[11px] font-bold text-slate-400 mb-1 ml-1">
                                  پشتیبانی کیومیزبان
                                </span>
                              )}

                              <div
                                className={`p-4 text-[13px] leading-relaxed whitespace-pre-wrap font-bold shadow-sm ${
                                  isAdmin
                                    ? "bg-white text-slate-700 rounded-3xl rounded-bl-sm border border-slate-200"
                                    : "bg-orange-500 text-white rounded-3xl rounded-br-sm shadow-orange-500/20"
                                }`}
                              >
                                {msg.message}
                              </div>

                              <div className="flex items-center gap-1 mt-1.5 px-1 opacity-70">
                                <span className="text-[10px] font-bold text-slate-400">
                                  {formatDate(msg.created_at)}
                                </span>
                                {!isAdmin && (
                                  <CheckCheck
                                    size={14}
                                    className="text-blue-500"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* نوار ارسال پیام */}
                  <div className="p-4 md:p-5 bg-white border-t border-slate-100 shrink-0 z-10 relative">
                    {activeTicketDetails?.status === "closed" ? (
                      <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold p-4 rounded-2xl text-center flex justify-center items-center gap-2 shadow-sm">
                        <XCircle size={20} /> این تیکت توسط پشتیبانی بسته شده
                        است.
                      </div>
                    ) : (
                      <form
                        onSubmit={handleReply}
                        className="flex items-end gap-3"
                      >
                        <div className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[24px] p-2 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-[0_8px_30px_rgb(59,130,246,0.1)] transition-all">
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="پاسخ خود را اینجا بنویسید..."
                            className="w-full bg-transparent text-slate-800 font-bold text-[13px] outline-none resize-none min-h-[48px] max-h-32 p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 placeholder:text-slate-400 placeholder:font-medium"
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
                          className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-[20px] flex items-center justify-center transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5"
                        >
                          {isReplying ? (
                            <Loader2 size={24} className="animate-spin" />
                          ) : (
                            <Send
                              size={24}
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
          <div className="bg-white border border-slate-200 rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-500 shadow-sm mb-4">
                <Headset size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-1">
                ارسال تیکت جدید
              </h3>
              <p className="text-sm font-bold text-slate-500">
                سوال یا مشکل خود را به طور کامل توضیح دهید.
              </p>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[13px] font-black text-slate-700 mb-2 ml-1">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در افزودن محصول جدید"
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl py-4 px-4 text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
              <div>
                <label className="block text-[13px] font-black text-slate-700 mb-2 ml-1">
                  متن کامل پیام
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="توضیحات خود را کامل بنویسید..."
                  rows={5}
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-2xl py-4 px-4 text-[13px] font-bold focus:bg-white focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-600 text-xs font-black bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <AlertTriangle size={18} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateTicket}
              disabled={isCreating}
              className="w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "ارسال برای کارشناسان پشتیبانی"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
