// import { useState, useEffect } from "react";
// import {
//   Plus,
//   Minus,
//   ShoppingCart,
//   ChevronLeft,
//   CheckCircle2,
//   X,
//   Loader2,
//   Search,
//   BellRing,
//   ChefHat,
//   Receipt,
//   Flame,
//   Coffee,
//   Info,
//   MapPin,
//   Phone,
// } from "lucide-react";

// const MOCK_VENUE = {
//   name: "کافه رستوران دمو",
//   about_us:
//     "این یک صفحه تستی برای نمایش ظاهر قالب مدرن است. طعم واقعی قهوه را با ما تجربه کنید. ما با استفاده از بهترین مواد اولیه، تجربه‌ای فراموش‌نشدنی را برای شما رقم می‌زنیم.",
//   address: "تهران، خیابان ولیعصر، کوچه تستی، پلاک ۱",
//   phone: "021-12345678",
//   logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
//   brand_color: "orange",
//   is_ordering_enabled: true,
//   is_waiter_enabled: true,
//   is_chef_request_enabled: true,
// };

// const MOCK_CATEGORIES = [
//   {
//     id: 1,
//     name: "نوشیدنی گرم",
//     items: [
//       {
//         id: 101,
//         name: "لته آرت ویژه",
//         price: 85000,
//         description: "اسپرسو سینگل، شیر فوم گرفته شده",
//         image:
//           "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
//         is_available: true,
//         stock: null,
//       },
//       {
//         id: 102,
//         name: "کاپوچینو",
//         price: 75000,
//         description: "اسپرسو دبل، فوم شیر کلاسیک",
//         image:
//           "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&h=200&fit=crop",
//         is_available: true,
//         stock: 10,
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "غذای اصلی",
//     items: [
//       {
//         id: 201,
//         name: "پاستا آلفردو",
//         price: 220000,
//         description: "پنه، سس آلفردو، مرغ گریل شده، قارچ",
//         image:
//           "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
//         is_available: true,
//         stock: null,
//       },
//     ],
//   },
// ];

// const HEX_COLORS: Record<string, string> = {
//   emerald: "#10b981",
//   rose: "#f43f5e",
//   amber: "#f59e0b",
//   blue: "#3b82f6",
//   purple: "#a855f7",
//   orange: "#f97316",
// };

// const ORDER_STAGES = [
//   { id: "new", label: "ثبت سفارش", icon: Receipt },
//   { id: "preparing", label: "در حال پخت", icon: Flame },
//   { id: "ready", label: "آماده تحویل", icon: Coffee },
// ];

// export const ModernDemo = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [cart, setCart] = useState<any[]>([]);
//   const [orderStatus, setOrderStatus] = useState<
//     "shopping" | "checkout" | "tracking"
//   >("shopping");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id);
//   const [currentStageIndex, setCurrentStageIndex] = useState(0);

//   const brandColor = HEX_COLORS[MOCK_VENUE.brand_color] || HEX_COLORS["orange"];
//   const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
//   const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
//   const getItemQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

//   const addToCart = (product: any) =>
//     setCart((p) =>
//       p.find((i) => i.id === product.id)
//         ? p.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
//         : [...p, { ...product, qty: 1 }],
//     );

//   const removeFromCart = (id: number) =>
//     setCart((p) =>
//       p.find((i) => i.id === id)?.qty > 1
//         ? p.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
//         : p.filter((i) => i.id !== id),
//     );

//   const handleFinalCheckout = () => {
//     setIsSubmitting(true);
//     setTimeout(() => {
//       setIsSubmitting(false);
//       setOrderStatus("tracking");
//       setCart([]);
//       setCurrentStageIndex(0);
//     }, 1500);
//   };

//   useEffect(() => {
//     let timer: NodeJS.Timeout;
//     if (
//       orderStatus === "tracking" &&
//       currentStageIndex < ORDER_STAGES.length - 1
//     ) {
//       timer = setTimeout(() => {
//         setCurrentStageIndex((prev) => prev + 1);
//       }, 5000);
//     }
//     return () => clearTimeout(timer);
//   }, [orderStatus, currentStageIndex]);

//   const filteredCategories = MOCK_CATEGORIES.map((cat) => ({
//     ...cat,
//     items: cat.items.filter(
//       (item) =>
//         item.name.includes(searchQuery) ||
//         item.description.includes(searchQuery),
//     ),
//   })).filter((cat) => cat.items.length > 0);

//   const handleServiceRequest = (service: string) => {
//     alert(`درخواست ${service} با موفقیت برای میز شما ثبت شد.`);
//   };

//   return (
//     <div
//       className="min-h-screen bg-slate-100 flex justify-center font-sans text-slate-800"
//       dir="rtl"
//     >
//       <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative overflow-x-hidden pb-24 flex flex-col">
//         {/* هدر گرافیکی */}
//         <div
//           className="relative h-48 w-full overflow-hidden transition-colors duration-500 rounded-b-[40px] shadow-sm"
//           style={{ backgroundColor: brandColor }}
//         >
//           <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20"></div>
//           <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
//           <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/10 rounded-full blur-3xl"></div>

//           <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
//             <div className="w-20 h-20 rounded-[24px] border-[3px] border-white bg-white overflow-hidden shadow-lg mb-3">
//               <img
//                 src={MOCK_VENUE.logo}
//                 alt="logo"
//                 className="w-full h-full object-cover"
//               />
//             </div>
//             <h1 className="text-xl font-black text-white tracking-tight drop-shadow-md">
//               {MOCK_VENUE.name}
//             </h1>
//           </div>
//         </div>

//         {/* دکمه‌های درخواست خدمات */}
//         <div className="px-4 -mt-6 relative z-20 flex gap-3">
//           {MOCK_VENUE.is_waiter_enabled && (
//             <button
//               onClick={() => handleServiceRequest("احضار گارسون")}
//               className="flex-1 bg-white/90 backdrop-blur-md border border-white rounded-[20px] p-3 shadow-lg flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform"
//             >
//               <div
//                 className="w-10 h-10 rounded-full flex items-center justify-center"
//                 style={{
//                   backgroundColor: `${brandColor}15`,
//                   color: brandColor,
//                 }}
//               >
//                 <BellRing size={20} />
//               </div>
//               <span className="text-xs font-black text-slate-700">
//                 درخواست گارسون
//               </span>
//             </button>
//           )}
//           {MOCK_VENUE.is_chef_request_enabled && (
//             <button
//               onClick={() => handleServiceRequest("سفارش اختصاصی")}
//               className="flex-1 bg-white/90 backdrop-blur-md border border-white rounded-[20px] p-3 shadow-lg flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform"
//             >
//               <div
//                 className="w-10 h-10 rounded-full flex items-center justify-center"
//                 style={{
//                   backgroundColor: `${brandColor}15`,
//                   color: brandColor,
//                 }}
//               >
//                 <ChefHat size={20} />
//               </div>
//               <span className="text-xs font-black text-slate-700">
//                 سفارش به آشپز
//               </span>
//             </button>
//           )}
//         </div>

//         {/* نوار جستجو */}
//         <div className="px-5 mt-6 mb-2 sticky top-2 z-50">
//           <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 flex items-center px-4 py-3.5">
//             <Search className="text-slate-400 shrink-0" size={20} />
//             <input
//               type="text"
//               placeholder="جستجوی محصول..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full bg-transparent border-none outline-none pr-3 text-slate-800 font-bold text-sm placeholder:text-slate-400"
//             />
//             {searchQuery && (
//               <button
//                 onClick={() => setSearchQuery("")}
//                 className="text-slate-400 bg-slate-100 p-1 rounded-full hover:bg-slate-200"
//               >
//                 <X size={14} />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* دسته‌بندی‌ها */}
//         <div className="sticky top-[72px] z-40 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200/50 py-3 mb-2">
//           <div
//             className="flex overflow-x-auto px-5 gap-3 snap-x hide-scrollbar"
//             style={{ scrollbarWidth: "none" }}
//           >
//             {filteredCategories.map((cat) => (
//               <button
//                 key={cat.id}
//                 onClick={() => setActiveCategory(cat.id)}
//                 className="snap-center shrink-0 px-5 py-2.5 rounded-2xl font-black border transition-all text-sm shadow-sm"
//                 style={{
//                   backgroundColor:
//                     activeCategory === cat.id ? brandColor : "#fff",
//                   color: activeCategory === cat.id ? "#fff" : "#64748b",
//                   borderColor:
//                     activeCategory === cat.id ? brandColor : "#f1f5f9",
//                 }}
//               >
//                 {cat.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* محصولات */}
//         <div className="flex-1 p-5 space-y-10">
//           {filteredCategories.map((category) => (
//             <div key={category.id}>
//               <h2 className="text-lg font-black text-slate-800 mb-5 pr-4 relative flex items-center">
//                 <span
//                   className="absolute right-0 w-1.5 h-6 rounded-full"
//                   style={{ backgroundColor: brandColor }}
//                 ></span>
//                 {category.name}
//               </h2>
//               <div className="space-y-4">
//                 {category.items.map((item) => {
//                   const qty = getItemQty(item.id);
//                   return (
//                     <div
//                       key={item.id}
//                       className="bg-white rounded-[24px] p-3 flex gap-4 shadow-sm border border-slate-100"
//                     >
//                       <div className="w-28 h-28 shrink-0 rounded-[18px] overflow-hidden bg-slate-100">
//                         <img
//                           src={item.image}
//                           className="w-full h-full object-cover"
//                         />
//                       </div>
//                       <div className="flex-1 flex flex-col justify-between py-1.5">
//                         <div>
//                           <h3 className="font-black text-slate-800 mb-1.5 text-sm">
//                             {item.name}
//                           </h3>
//                           <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
//                             {item.description}
//                           </p>
//                         </div>
//                         <div className="flex justify-between items-end mt-3">
//                           <div
//                             className="font-black text-base tracking-tight"
//                             style={{ color: brandColor }}
//                           >
//                             {item.price.toLocaleString("fa-IR")}{" "}
//                             <span className="text-[10px] text-slate-400 font-bold">
//                               تومان
//                             </span>
//                           </div>
//                           <div className="flex items-center bg-slate-50 rounded-[14px] p-1 border border-slate-100">
//                             {qty > 0 ? (
//                               <>
//                                 <button
//                                   onClick={() => removeFromCart(item.id)}
//                                   className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center text-slate-600 shadow-sm border border-slate-100"
//                                 >
//                                   <Minus size={16} strokeWidth={2.5} />
//                                 </button>
//                                 <span className="w-8 text-center font-black text-sm">
//                                   {qty}
//                                 </span>
//                                 <button
//                                   onClick={() => addToCart(item)}
//                                   className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shadow-sm"
//                                   style={{ backgroundColor: brandColor }}
//                                 >
//                                   <Plus size={16} strokeWidth={2.5} />
//                                 </button>
//                               </>
//                             ) : (
//                               <button
//                                 onClick={() => addToCart(item)}
//                                 className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shadow-md transition-transform active:scale-95"
//                                 style={{ backgroundColor: brandColor }}
//                               >
//                                 <Plus size={20} strokeWidth={2.5} />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}

//           {/* درباره ما */}
//           <div className="mt-12 bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 text-center">
//             <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
//               <Info size={28} style={{ color: brandColor }} />
//             </div>
//             <h3 className="font-black text-slate-800 text-lg mb-3">
//               درباره {MOCK_VENUE.name}
//             </h3>
//             <p className="text-xs font-bold text-slate-500 leading-loose mb-6">
//               {MOCK_VENUE.about_us}
//             </p>
//             <div className="space-y-3">
//               <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
//                 <MapPin size={16} style={{ color: brandColor }} />
//                 {MOCK_VENUE.address}
//               </div>
//               <div
//                 className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 py-2.5 rounded-xl border border-slate-100"
//                 dir="ltr"
//               >
//                 <Phone size={16} style={{ color: brandColor }} />
//                 {MOCK_VENUE.phone}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* سبد خرید شناور */}
//         {orderStatus === "shopping" && cartItemCount > 0 && (
//           <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
//             <button
//               onClick={() => setOrderStatus("checkout")}
//               className="w-full text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between transition-transform active:scale-95"
//               style={{ backgroundColor: brandColor }}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="relative">
//                   <ShoppingCart size={24} />
//                   <span className="absolute -top-2 -right-2 bg-white text-slate-900 font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
//                     {cartItemCount}
//                   </span>
//                 </div>
//                 <span className="font-black text-sm">تکمیل سفارش</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="font-black text-lg">
//                   {cartTotal.toLocaleString("fa-IR")}
//                 </span>
//                 <ChevronLeft size={20} strokeWidth={3} />
//               </div>
//             </button>
//           </div>
//         )}

//         {/* مودال‌های تسویه و پیگیری */}
//         {orderStatus !== "shopping" && (
//           <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4">
//             <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
//               {/* صفحه تسویه */}
//               {orderStatus === "checkout" && (
//                 <div className="p-6 overflow-y-auto">
//                   <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-black text-lg text-slate-800">
//                       تکمیل سفارش
//                     </h3>
//                     <button
//                       onClick={() => setOrderStatus("shopping")}
//                       className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200"
//                     >
//                       <X size={20} />
//                     </button>
//                   </div>

//                   <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-100 mb-6 space-y-4">
//                     <h4 className="font-black text-slate-700 text-sm border-b border-slate-200 pb-3">
//                       خلاصه اقلام
//                     </h4>
//                     {cart.map((item: any) => (
//                       <div
//                         key={item.id}
//                         className="flex justify-between items-center text-sm"
//                       >
//                         <span className="font-black text-slate-800">
//                           <span style={{ color: brandColor }} className="ml-2">
//                             x{item.qty}
//                           </span>
//                           {item.name}
//                         </span>
//                         <span className="font-bold text-slate-600">
//                           {(item.price * item.qty).toLocaleString("fa-IR")}{" "}
//                           تومان
//                         </span>
//                       </div>
//                     ))}
//                     <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-300">
//                       <span className="font-black text-slate-500">
//                         مبلغ نهایی:
//                       </span>
//                       <span className="font-black text-lg text-slate-900">
//                         {cartTotal.toLocaleString("fa-IR")} تومان
//                       </span>
//                     </div>
//                   </div>

//                   <button
//                     disabled={isSubmitting}
//                     onClick={handleFinalCheckout}
//                     className="w-full text-white py-4 rounded-2xl font-black flex justify-center items-center shadow-lg transition-transform active:scale-95"
//                     style={{ backgroundColor: brandColor }}
//                   >
//                     {isSubmitting ? (
//                       <Loader2 className="animate-spin" />
//                     ) : (
//                       "تایید و پرداخت نهایی"
//                     )}
//                   </button>
//                 </div>
//               )}

//               {/* صفحه پیگیری زنده */}
//               {orderStatus === "tracking" && (
//                 <div className="p-6 bg-slate-50 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
//                   <div
//                     className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
//                     style={{
//                       backgroundColor: `${brandColor}20`,
//                       color: brandColor,
//                     }}
//                   >
//                     <Receipt size={32} strokeWidth={2.5} />
//                   </div>
//                   <h2 className="text-xl font-black text-slate-800 mb-2">
//                     سفارش با موفقیت ثبت شد
//                   </h2>
//                   <p className="text-xs font-bold text-slate-500 mb-8">
//                     فیش شماره #1042 - در حال پیگیری
//                   </p>

//                   <div className="w-full bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm relative mb-8 text-right">
//                     <div className="absolute right-9 top-10 bottom-10 w-1 bg-slate-100 rounded-full z-0"></div>
//                     <div className="space-y-8 relative z-10">
//                       {ORDER_STAGES.map((stage, idx) => {
//                         const isActive = idx === currentStageIndex;
//                         const isCompleted = idx < currentStageIndex;
//                         const isPending = idx > currentStageIndex;

//                         return (
//                           <div
//                             key={stage.id}
//                             className={`flex items-center gap-4 transition-all duration-500 ${isPending ? "opacity-40 grayscale" : ""}`}
//                           >
//                             <div
//                               className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-colors ${
//                                 isActive || isCompleted
//                                   ? "bg-white"
//                                   : "bg-slate-50 border-slate-200 text-slate-400"
//                               }`}
//                               style={{
//                                 borderColor:
//                                   isActive || isCompleted ? brandColor : "",
//                                 color:
//                                   isActive || isCompleted ? brandColor : "",
//                               }}
//                             >
//                               {isCompleted ? (
//                                 <CheckCircle2 size={24} strokeWidth={3} />
//                               ) : (
//                                 <stage.icon size={24} />
//                               )}
//                             </div>
//                             <div>
//                               <h4
//                                 className={`font-black text-sm mb-1 ${isActive ? "text-slate-800" : isCompleted ? "text-slate-600" : "text-slate-400"}`}
//                               >
//                                 {stage.label}
//                               </h4>
//                               {isActive && (
//                                 <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
//                                   <span
//                                     className="w-1.5 h-1.5 rounded-full animate-pulse"
//                                     style={{ backgroundColor: brandColor }}
//                                   ></span>
//                                   در حال انجام...
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {currentStageIndex === ORDER_STAGES.length - 1 ? (
//                     <button
//                       onClick={() => setOrderStatus("shopping")}
//                       className="w-full text-white py-4 rounded-xl font-black shadow-lg"
//                       style={{ backgroundColor: brandColor }}
//                     >
//                       ثبت سفارش جدید
//                     </button>
//                   ) : (
//                     <button
//                       onClick={() => setOrderStatus("shopping")}
//                       className="text-slate-500 font-bold bg-white border border-slate-200 px-6 py-3 rounded-xl shadow-sm text-sm"
//                     >
//                       بستن پیگیری
//                     </button>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ModernDemo;
