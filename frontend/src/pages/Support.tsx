import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
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
  } catch {
    return "نامشخص";
  }
};

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data && Array.isArray(res.data.items)) return res.data.items;
  if (res?.data && Array.isArray(res.data.messages)) return res.data.messages;
  if (Array.isArray(res?.tickets)) return res.tickets;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export const Support = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    answered: 0,
    closed: 0,
  });

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState<any>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRefreshingChat, setIsRefreshingChat] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const recomputeStats = (list: any[]) => ({
    total: list.length,
    pending: list.filter((t) => String(t.status).toLowerCase() === "pending")
      .length,
    answered: list.filter((t) => String(t.status).toLowerCase() === "answered")
      .length,
    closed: list.filter((t) => String(t.status).toLowerCase() === "closed")
      .length,
  });

  // فقط یک بار هنگام ورود به صفحه اجرا می‌شود
  useEffect(() => {
    let isMounted = true;

    const loadInitialTickets = async () => {
      try {
        const res = await supportApi.getTickets();
        if (!isMounted) return;

        const safeTickets = extractArray(res);
        const sortedTickets = [...safeTickets].sort((a, b) => {
          const dateA = new Date(
            a.updated_at || a.creationDate || a.created_at || 0,
          ).getTime();
          const dateB = new Date(
            b.updated_at || b.creationDate || b.created_at || 0,
          ).getTime();
          return dateB - dateA;
        });

        setTickets(sortedTickets);
        const serverStats = res?.data?.stats || res?.stats;
        setStats(serverStats || recomputeStats(sortedTickets));
      } catch (error) {
        console.error("خطا در دریافت لیست تیکت‌ها:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialTickets();
    return () => {
      isMounted = false;
    };
  }, []);

  // فقط با کلیک کاربر روی تیکت اجرا می‌شود
  const handleSelectTicket = async (id: string) => {
    setActiveTicketId(id);
    setIsChatLoading(true);
    try {
      const data = await supportApi.getTicketDetails(id);
      const details = data?.data || data;
      setActiveTicketDetails(details);

      // همگام‌سازی وضعیت تیکت در لیست سمت راست بدون درخواست اضافه
      if (details?.status) {
        setTickets((prev) => {
          const updated = prev.map((t) =>
            t.id === id ? { ...t, status: details.status } : t,
          );
          setStats(recomputeStats(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error("خطا در دریافت چت:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  // فقط با کلیک دستی کاربر روی دکمه بروزرسانی اجرا می‌شود
  const handleManualRefresh = async () => {
    if (!activeTicketId || isRefreshingChat) return;
    setIsRefreshingChat(true);
    try {
      const data = await supportApi.getTicketDetails(activeTicketId);
      const details = data?.data || data;
      setActiveTicketDetails(details);

      if (details?.status) {
        setTickets((prev) => {
          const updated = prev.map((t) =>
            t.id === activeTicketId ? { ...t, status: details.status } : t,
          );
          setStats(recomputeStats(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error("خطا در بروزرسانی گفتگو:", error);
    } finally {
      setIsRefreshingChat(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeTicketDetails]);

  // ارسال پاسخ (فقط یک POST؛ لیست تیکت‌ها در حافظه آپدیت می‌شود)
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    setIsReplying(true);
    try {
      const res = await supportApi.replyTicket(activeTicketId, {
        ticketId: activeTicketId,
        body: replyMessage.trim(),
      });

      const updatedDetails = res?.data || res;
      setActiveTicketDetails(updatedDetails);
      setReplyMessage("");

      setTickets((prev) => {
        const updatedList = prev.map((t) =>
          t.id === activeTicketId
            ? {
                ...t,
                status: updatedDetails?.status || "pending",
                updated_at: new Date().toISOString(),
              }
            : t,
        );
        setStats(recomputeStats(updatedList));
        return updatedList;
      });
    } catch (error: any) {
      alert(error?.message || error?.detail || "خطا در ارسال پیام.");
    } finally {
      setIsReplying(false);
    }
  };

  // ایجاد تیکت جدید (فقط یک POST؛ به ابتدای لیست اضافه می‌شود)
  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newBody.trim()) {
      setModalError("لطفاً موضوع و متن پیام را کامل کنید.");
      return;
    }
    setIsCreating(true);
    setModalError("");

    try {
      const res = await supportApi.createTicket({
        subject: newSubject.trim(),
        body: newBody.trim(),
        priority: 0,
      });

      const created = res?.data || res;

      setIsModalOpen(false);
      setNewSubject("");
      setNewBody("");

      if (created?.id) {
        setTickets((prev) => {
          const nextList = [created, ...prev];
          setStats(recomputeStats(nextList));
          return nextList;
        });
        setActiveTicketId(created.id);
        setActiveTicketDetails(created);
      }
    } catch (error: any) {
      setModalError(
        error?.message || error?.detail || "خطا در ثبت تیکت. مجدداً تلاش کنید.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 size={40} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  const getStatusDisplay = (status?: string | number) => {
    const s = String(status).toLowerCase();
    if (s === "pending" || s === "0")
      return {
        text: "در انتظار پاسخ",
        color: "text-amber-600 bg-amber-50 border-amber-100",
      };
    if (s === "answered" || s === "1")
      return {
        text: "پاسخ داده شده",
        color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      };
    if (s === "closed" || s === "2")
      return {
        text: "بسته شده",
        color: "text-rose-600 bg-rose-50 border-rose-100",
      };
    return {
      text: "نامشخص",
      color: "text-slate-500 bg-slate-50 border-slate-200",
    };
  };

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(t.subject || "")
        .toLowerCase()
        .includes(q) ||
      String(t.id || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const chatMessages = extractArray(
    activeTicketDetails?.messages || activeTicketDetails,
  );

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] relative font-sans text-slate-800 pb-28 lg:pb-12 overflow-x-hidden"
      dir="rtl"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-orange-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-4 md:p-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] md:text-3xl font-black text-slate-900 mb-1.5 tracking-tight flex items-center gap-2">
              <Headset
                className="text-blue-500 hidden md:block"
                size={28}
                strokeWidth={2.5}
              />{" "}
              پشتیبانی
            </h1>
            <p className="text-slate-500 text-[13px] md:text-sm font-bold">
              درخواست‌ها و مشکلات خود را مستقیماً با کارشناسان ما در میان
              بگذارید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalError("");
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[18px] md:rounded-[20px] font-black transition-all text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/15 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> تیکت جدید
          </button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 h-[700px] lg:h-[750px]">
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-xl rounded-[32px] md:rounded-[40px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative">
            <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[16px] md:text-lg font-black text-slate-800 flex items-center gap-2 mb-4 tracking-tight">
                <Inbox size={20} className="text-blue-500" strokeWidth={2.5} />{" "}
                صندوق پیام‌ها
              </h2>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در موضوع..."
                  className="w-full bg-white border border-slate-200/60 text-slate-800 rounded-[18px] py-3 pr-11 pl-4 text-[13px] font-bold focus:outline-none focus:border-blue-400 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredTickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                    <MessageSquare size={30} strokeWidth={2} />
                  </div>
                  <p className="text-slate-500 text-[12px] font-bold leading-relaxed">
                    {searchQuery
                      ? "تیکتی با این موضوع پیدا نشد."
                      : "هیچ تیکتی وجود ندارد.\nبرای ارتباط با پشتیبانی تیکت جدید بسازید."}
                  </p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const statusInfo = getStatusDisplay(t.status);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t.id)}
                      className={`w-full cursor-pointer p-4 rounded-[24px] transition-all border-2 text-right group ${
                        activeTicketId === t.id
                          ? "bg-blue-50/50 border-blue-200 shadow-sm"
                          : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <h3
                          className={`font-black text-[13px] line-clamp-1 pl-2 tracking-tight ${activeTicketId === t.id ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}`}
                        >
                          {t.subject}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-black shrink-0 font-mono tracking-tighter">
                          #{t.id?.toString().slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock size={12} />{" "}
                          {formatDate(
                            t.creationDate || t.created_at || t.CreatedAt,
                          )}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-1 rounded-lg border shadow-sm ${statusInfo.color}`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white/90 backdrop-blur-xl rounded-[32px] md:rounded-[40px] border border-white shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative">
            {!activeTicketId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
                <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-5 text-blue-400 border border-slate-100 shadow-xl shadow-blue-500/5">
                  <MessageSquare size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">
                  پشتیبانی آنلاین
                </h3>
                <p className="text-slate-500 font-bold leading-relaxed text-[13px] max-w-[220px]">
                  برای مشاهده گفتگو و دریافت پاسخ، یک تیکت از لیست انتخاب کنید.
                </p>
              </div>
            ) : isChatLoading ? (
              <div className="flex-1 flex items-center justify-center bg-slate-50/30">
                <Loader2 className="animate-spin text-blue-400" size={40} />
              </div>
            ) : (
              activeTicketDetails && (
                <>
                  <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 md:p-5 shrink-0 flex justify-between items-center z-10 shadow-sm relative">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[18px] flex items-center justify-center shadow-inner">
                        <ShieldCheck size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-[14px] md:text-[15px] mb-1 tracking-tight">
                          {activeTicketDetails?.subject || "گفتگوی پشتیبانی"}
                        </h3>
                        <p className="text-[10px] md:text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{" "}
                          تیم پشتیبانی
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualRefresh}
                      disabled={isRefreshingChat}
                      title="بروزرسانی پیام‌ها"
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/70 text-xs font-black flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw
                        size={14}
                        className={isRefreshingChat ? "animate-spin" : ""}
                      />
                      <span>بروزرسانی</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full z-10 relative bg-[#f8fafc]/50">
                    {chatMessages.map((msg: any) => {
                      const isAdmin = msg.is_admin_reply || msg.IsAdminReply;
                      return (
                        <div
                          key={msg.id || Math.random()}
                          className={`flex relative z-10 ${isAdmin ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`flex gap-2.5 max-w-[85%] sm:max-w-[70%] ${isAdmin ? "flex-row" : "flex-row-reverse"}`}
                          >
                            <div className="shrink-0 flex items-end mb-1">
                              <div
                                className={`w-8 h-8 rounded-[12px] flex items-center justify-center shadow-sm text-white ${isAdmin ? "bg-blue-500" : "bg-slate-800"}`}
                              >
                                {isAdmin ? (
                                  <ShieldCheck size={16} strokeWidth={2.5} />
                                ) : (
                                  <User size={16} strokeWidth={2.5} />
                                )}
                              </div>
                            </div>
                            <div
                              className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                            >
                              <div
                                className={`p-3.5 md:p-4 text-[12px] md:text-[13px] leading-relaxed whitespace-pre-wrap font-bold shadow-sm ${
                                  isAdmin
                                    ? "bg-white text-slate-700 rounded-3xl rounded-br-sm border border-slate-200/60"
                                    : "bg-slate-900 text-white rounded-3xl rounded-bl-sm"
                                }`}
                              >
                                {msg.body || msg.Body || msg.message}
                              </div>
                              <div className="flex items-center gap-1 mt-1.5 px-1 opacity-70">
                                <span className="text-[9px] font-bold text-slate-400">
                                  {formatDate(
                                    msg.creationDate ||
                                      msg.created_at ||
                                      msg.CreatedAt,
                                  )}
                                </span>
                                {!isAdmin && (
                                  <CheckCheck
                                    size={14}
                                    className="text-slate-400"
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

                  <div className="p-3 md:p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shrink-0 z-10 relative">
                    {String(activeTicketDetails?.status).toLowerCase() ===
                      "closed" ||
                    String(activeTicketDetails?.status) === "2" ? (
                      <div className="bg-slate-50 border border-slate-100 text-slate-500 text-[12px] font-black p-4 rounded-2xl text-center flex justify-center items-center gap-2 shadow-sm">
                        <XCircle size={18} strokeWidth={2.5} /> این تیکت بسته
                        شده است.
                      </div>
                    ) : (
                      <form
                        onSubmit={handleReply}
                        className="flex items-end gap-2 md:gap-3"
                      >
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[20px] p-1.5 focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-sm transition-all">
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="پاسخ خود را بنویسید..."
                            className="w-full bg-transparent text-slate-800 font-bold text-[13px] outline-none resize-none min-h-[44px] max-h-32 p-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 placeholder:text-slate-400 placeholder:font-medium"
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
                          className="w-[52px] h-[52px] md:w-14 md:h-14 shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[18px] flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95"
                        >
                          {isReplying ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Send
                              size={20}
                              className="mr-1 transform rotate-180"
                              strokeWidth={2.5}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-3xl border border-white rounded-[40px] p-6 md:p-8 w-full max-w-md shadow-[0_30px_100px_rgba(0,0,0,0.15)] relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border border-slate-100 p-2.5 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-[20px] flex items-center justify-center bg-blue-50 text-blue-500 shadow-inner mb-3">
                <Ticket size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">
                ارسال تیکت جدید
              </h3>
              <p className="text-[12px] font-bold text-slate-500">
                مشکل خود را برای کارشناسان ما شرح دهید.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[12px] font-black text-slate-700 mb-1.5 ml-1">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در پرداخت"
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 rounded-[20px] py-3.5 px-4 text-[13px] font-bold focus:bg-white focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:font-medium"
                />
              </div>
              <div>
                <label className="block text-[12px] font-black text-slate-700 mb-1.5 ml-1">
                  متن کامل پیام
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="توضیحات خود را کامل بنویسید..."
                  rows={4}
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 rounded-[20px] py-3.5 px-4 text-[13px] font-bold focus:bg-white focus:outline-none focus:border-blue-400 transition-all resize-none shadow-sm placeholder:font-medium"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-600 text-[11px] font-black bg-rose-50 p-3 rounded-[16px] border border-rose-100">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                  <span>{modalError}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateTicket}
              disabled={isCreating || !newSubject.trim() || !newBody.trim()}
              className="w-full py-4 rounded-[20px] font-black text-[14px] transition-all flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-xl shadow-slate-900/15 active:scale-95"
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "ثبت و ارسال پیام"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
