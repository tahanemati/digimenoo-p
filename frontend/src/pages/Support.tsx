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
} from "lucide-react";
import { supportApi } from "../service/api";

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

  const fetchTickets = async () => {
    try {
      const data = await supportApi.getTickets();
      setTickets(data?.tickets || []);
      setStats(data?.stats || { total: 0, pending: 0, answered: 0, closed: 0 });
    } catch (error) {
      console.error("خطا در دریافت تیکت‌ها", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = async (id: number) => {
    setActiveTicketId(id);
    setIsChatLoading(true);
    try {
      const data = await supportApi.getTicketDetails(id);
      setActiveTicketDetails(data);
    } catch (error) {
      console.error("خطا در دریافت جزئیات تیکت", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicketId) return;

    setIsReplying(true);
    try {
      await supportApi.replyTicket(activeTicketId, replyMessage);
      setReplyMessage("");
      const data = await supportApi.getTicketDetails(activeTicketId);
      setActiveTicketDetails(data);
      await fetchTickets();
    } catch (error: any) {
      alert(error?.error || "خطا در ارسال پیام");
    } finally {
      setIsReplying(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      setModalError("لطفاً موضوع و متن پیام را کامل کنید.");
      return;
    }
    setIsCreating(true);
    setModalError("");
    try {
      const res = await supportApi.createTicket(newSubject, newMessage);
      setIsModalOpen(false);
      setNewSubject("");
      setNewMessage("");
      await fetchTickets();
      if (res?.ticket_id) handleSelectTicket(res?.ticket_id);
    } catch (error: any) {
      setModalError(error?.error || "خطایی رخ داد.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    if (status === "pending")
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (status === "answered")
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative pb-10">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Headset size={22} />
          </div>
          <h1 className="text-2xl font-black text-white">پشتیبانی میزینو</h1>
        </div>
        <p className="text-slate-500 text-sm">
          ارسال و پیگیری درخواست‌ها برای منوی دیجیتال و QR رستوران/کافه
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <div className="text-xs text-slate-500 mb-1">کل تیکت‌ها</div>
            <div className="text-2xl font-black text-white">
              {stats?.total || 0}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
            <Ticket size={24} />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <div className="text-xs text-slate-500 mb-1">در انتظار پاسخ</div>
            <div className="text-2xl font-black text-amber-400">
              {stats?.pending || 0}
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <div className="text-xs text-slate-500 mb-1">پاسخ داده شده</div>
            <div className="text-2xl font-black text-emerald-400">
              {stats?.answered || 0}
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
          <div>
            <div className="text-xs text-slate-500 mb-1">بسته شده</div>
            <div className="text-2xl font-black text-rose-400">
              {stats?.closed || 0}
            </div>
          </div>
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🔴 اعمال ارتفاع ثابت و جلوگیری از کِش آمدن ستون لیست تیکت‌ها */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-5 flex flex-col h-[400px] lg:h-[600px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-lg font-bold text-white">لیست تیکت‌ها</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Plus size={16} /> تیکت جدید
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {!tickets || tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <Inbox size={32} />
                </div>
                <h3 className="text-white font-bold mb-2">تیکتی یافت نشد</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                  برای ایجاد تیکت جدید، دکمه "تیکت جدید" را بزنید.
                </p>
              </div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t.id)}
                  className={`w-full text-right p-4 rounded-2xl transition-all border shrink-0 ${activeTicketId === t.id ? "bg-white/10 border-white/20 shadow-lg" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-sm line-clamp-1 flex-1">
                      {t.subject}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 mr-3">
                      {formatDate(t.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      شماره: #{t.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusColor(t.status)}`}
                    >
                      {t.status_display}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 🔴 اعمال ارتفاع ثابت و جلوگیری از کِش آمدن ستون چت */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-[28px] flex flex-col h-[500px] lg:h-[600px] relative overflow-hidden">
          {!activeTicketId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.02] pointer-events-none">
                <MessageSquare size={300} />
              </div>
              <div className="relative z-10 flex flex-col items-center max-w-sm">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500 border border-white/10 shadow-2xl">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">
                  تیکت را انتخاب کنید
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  برای مشاهده گفتگو و پاسخ‌های تیم پشتیبانی، یک تیکت از لیست
                  انتخاب کنید.
                </p>
              </div>
            </div>
          ) : isChatLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
          ) : (
            activeTicketDetails && (
              <>
                <div className="bg-white/[0.02] border-b border-white/5 p-5 shrink-0 flex justify-between items-center z-10">
                  <div>
                    <h3 className="font-black text-white">
                      {activeTicketDetails?.subject}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      تیکت #{activeTicketDetails?.id}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${getStatusColor(activeTicketDetails?.status)}`}
                  >
                    {activeTicketDetails?.status_display}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full z-10 relative">
                  {(activeTicketDetails?.messages || []).map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${msg.is_admin_reply ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <div className="shrink-0 mt-1">
                          {msg.is_admin_reply ? (
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                              <Shield size={16} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                              <User size={16} />
                            </div>
                          )}
                        </div>

                        <div
                          className={`flex flex-col ${msg.is_admin_reply ? "items-start" : "items-end"}`}
                        >
                          <div
                            className={`p-4 text-sm leading-loose whitespace-pre-wrap ${
                              msg.is_admin_reply
                                ? "bg-white/10 text-white rounded-2xl rounded-tr-sm border border-white/5"
                                : "bg-emerald-500 text-gray-950 font-medium rounded-2xl rounded-tl-sm shadow-[0_5px_15px_rgba(16,185,129,0.15)]"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-slate-500 mt-2 font-mono px-1">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/5 shrink-0 z-10">
                  {activeTicketDetails?.status === "closed" ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold p-4 rounded-xl text-center flex justify-center items-center gap-2">
                      <XCircle size={18} /> این تیکت بسته شده است و امکان ارسال
                      پیام جدید وجود ندارد.
                    </div>
                  ) : (
                    <form
                      onSubmit={handleReply}
                      className="flex items-end gap-3"
                    >
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-emerald-500/50 transition-colors">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="پیام خود را بنویسید..."
                          className="w-full bg-transparent text-white text-sm outline-none resize-none min-h-[44px] max-h-32 p-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20"
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
                        className="w-14 h-14 shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-gray-950 rounded-2xl flex items-center justify-center transition-colors shadow-lg"
                      >
                        {isReplying ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Send size={20} className="mr-1" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#030712] border border-white/10 rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
              className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 pr-2 mt-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">ثبت تیکت جدید</h3>
                <p className="text-xs text-slate-500 mt-1">
                  مشکل یا درخواست خود را مطرح کنید
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در درگاه پرداخت"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  متن پیام
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="توضیحات کامل..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={16} />
                  <span className="font-bold">{modalError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateTicket}
              disabled={isCreating}
              className="w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {isCreating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "ارسال تیکت"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
