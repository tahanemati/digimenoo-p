import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Store } from "lucide-react";
import { customerApi } from "../service/api";
import Template1 from "../components/templates/Template1";
import Template2 from "../components/templates/Template2";
import Template3 from "../components/templates/Template3";
import Template4 from "../components/templates/Template4";
import Template5 from "../components/templates/Template5";
import Template6 from "../components/templates/Template6";
import Template7 from "../components/templates/Template7";
import Template8 from "../components/templates/Template8";
import Template9 from "../components/templates/Template9";
import Template10 from "../components/templates/Template10";
import Template11 from "../components/templates/Template11";
import Template12 from "../components/templates/Template12";
import Template13 from "../components/templates/Template13";
import Template14 from "../components/templates/Template14";
import Template15 from "../components/templates/Template15";
import type {
  CartItem,
  ActiveOrderInfo,
} from "../components/templates/Template1";

const TemplateRegistry: Record<string, React.FC<any>> = {
  template_1: Template1,
  template_2: Template2,
  template_3: Template3,
  template_4: Template4,
  template_5: Template5,
  template_6: Template6,
  template_7: Template7,
  template_8: Template8,
  template_9: Template9,
  template_10: Template10,
  template_11: Template11,
  template_12: Template12,
  template_13: Template13,
  template_14: Template14,
  template_15: Template15,
};

export const CustomerMenu = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? parseInt(tableParam, 10) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [venueData, setVenueData] = useState<any>(null);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchFullMenuData = async () => {
      if (!slug) return;
      try {
        const venueRes = await customerApi.getRestaurantInfo(slug);
        const vData = venueRes?.data?.data || venueRes?.data || venueRes;

        if (!vData || !vData.name) {
          throw new Error("رستوران یافت نشد");
        }

        const [catRes, prodRes] = await Promise.all([
          customerApi.getCategories(slug).catch(() => ({ data: [] })),
          customerApi.getProducts(slug).catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const safeCategories = Array.isArray(catRes?.data)
          ? catRes.data
          : Array.isArray(catRes?.data?.data)
            ? catRes.data.data
            : Array.isArray(catRes)
              ? catRes
              : [];

        const safeProducts = Array.isArray(prodRes?.data)
          ? prodRes.data
          : Array.isArray(prodRes?.data?.items)
            ? prodRes.data.items
            : Array.isArray(prodRes)
              ? prodRes
              : [];

        const mappedMenu = safeCategories.map((cat: any) => {
          const catId = String(cat.id || cat.Id || "").toLowerCase();
          const matchedProducts = safeProducts.filter(
            (p: any) =>
              String(
                p.categoryId || p.CategoryId || p.category_id || "",
              ).toLowerCase() === catId,
          );

          const normalizedProducts = matchedProducts.map((p: any) => ({
            ...p,
            id: String(p.id || p.Id),
            categoryId: catId,
            nameFa: p.nameFa || p.NameFa || "",
            nameEn: p.nameEn || p.NameEn || "",
            descriptionFa: p.descriptionFa || p.DescriptionFa || "",
            descriptionEn: p.descriptionEn || p.DescriptionEn || "",
            price: Number(p.price ?? p.Price ?? 0),
            imageUrl: p.imageUrl || p.ImageUrl || "",
            stock: p.stock ?? p.Stock ?? null,
            isAvailableInMenu:
              p.isAvailableInMenu !== false && p.IsAvailableInMenu !== false,
          }));

          return {
            ...cat,
            id: catId,
            nameFa: cat.nameFa || cat.NameFa || "",
            nameEn: cat.nameEn || cat.NameEn || "",
            products: normalizedProducts,
          };
        });

        setVenueData(vData);
        setMenuData(mappedMenu);
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(
            err?.message || "خطا در ارتباط با سرور یا رستوران یافت نشد.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFullMenuData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product?.id === product.id);
      const maxStock =
        product.stock !== null && product.stock !== undefined
          ? Number(product.stock)
          : Infinity;

      if (exists) {
        if (exists.quantity >= maxStock) return prev;
        return prev.map((item) =>
          item.product?.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      if (maxStock <= 0) return prev;
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product?.id === productId);
      if (exists && exists.quantity > 1) {
        return prev.map((item) =>
          item.product?.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.product?.id !== productId);
    });
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product?.id === productId ? { ...item, notes } : item,
      ),
    );
  };

  const submitOrder = async (
    name: string,
    mobile: string,
  ): Promise<ActiveOrderInfo | null> => {
    if (!tableNumber || !slug || cart.length === 0) return null;
    try {
      const currentCartSnapshot = [...cart];
      const payload = {
        restaurantSlug: slug,
        tableNumber,
        customerName: name,
        customerMobile: mobile,
        items: currentCartSnapshot.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          notes: c.notes || "",
        })),
      };

      const res = await customerApi.submitOrder(payload);
      const createdOrder = res?.data?.data || res?.data || res || {};

      setMenuData((prevMenu) =>
        Array.isArray(prevMenu)
          ? prevMenu.map((cat) => ({
              ...cat,
              products: Array.isArray(cat.products)
                ? cat.products.map((p: any) => {
                    const orderedItem = currentCartSnapshot.find(
                      (c) => c.product?.id === p.id,
                    );
                    if (
                      orderedItem &&
                      p.stock !== null &&
                      p.stock !== undefined
                    ) {
                      return {
                        ...p,
                        stock: Math.max(
                          0,
                          Number(p.stock) - orderedItem.quantity,
                        ),
                      };
                    }
                    return p;
                  })
                : [],
            }))
          : [],
      );

      setCart([]);

      return {
        id: String(createdOrder?.id || ""),
        orderNumber: Number(createdOrder?.orderNumber || 1001),
        status: String(createdOrder?.status || "pending"),
        stageId: String(createdOrder?.stageId || ""),
        stages: Array.isArray(createdOrder?.stages) ? createdOrder.stages : [],
        totalPrice: Number(createdOrder?.totalPrice || 0),
      };
    } catch (e: any) {
      alert(e?.message || "خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید.");
      return null;
    }
  };

  const checkOrderStatus = async (
    orderId: string,
  ): Promise<ActiveOrderInfo | null> => {
    if (!orderId) return null;
    try {
      const res = await customerApi.getOrderStatus(orderId);
      const data = res?.data?.data || res?.data || res || {};
      return {
        id: String(data?.id || orderId),
        orderNumber: Number(data?.orderNumber || 1001),
        status: String(data?.status || "pending"),
        stageId: String(data?.stageId || ""),
        stages: Array.isArray(data?.stages) ? data.stages : [],
        totalPrice: Number(data?.totalPrice || 0),
      };
    } catch {
      return null;
    }
  };

  const callWaiter = async (msg: string) => {
    if (!tableNumber || !slug) return false;
    try {
      await customerApi.callWaiter({
        restaurantSlug: slug,
        tableNumber,
        message: msg,
      });
      return true;
    } catch {
      return false;
    }
  };

  const callChef = async (msg: string) => {
    if (!tableNumber || !slug) return false;
    try {
      await customerApi.callChef({
        restaurantSlug: slug,
        tableNumber,
        message: msg,
      });
      return true;
    } catch {
      return false;
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex justify-center items-center">
        <Loader2 className="animate-spin text-orange-500" size={38} />
      </div>
    );

  if (error || !venueData) {
    return (
      <div
        className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center p-6 text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 rounded-[28px] bg-white border border-slate-200/70 shadow-sm flex items-center justify-center mb-5">
          <Store size={36} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          {error || "رستورانی با این آدرس یافت نشد!"}
        </h2>
        <p className="text-sm font-bold text-slate-500 max-w-xs leading-relaxed">
          لطفاً لینک منو را بررسی کنید یا بارکد روی میز را مجدداً اسکن نمایید.
        </p>
      </div>
    );
  }

  const activeTheme = venueData?.theme || venueData?.Theme || "template_1";
  const SelectedTemplate =
    TemplateRegistry[activeTheme] || TemplateRegistry["template_1"];

  return (
    <SelectedTemplate
      venueData={venueData}
      menuData={menuData}
      tableNumber={tableNumber}
      language={language}
      setLanguage={setLanguage}
      cart={cart}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      updateItemNotes={updateItemNotes}
      submitOrder={submitOrder}
      checkOrderStatus={checkOrderStatus}
      getOrderWsUrl={customerApi.getOrderWsUrl}
      callWaiter={callWaiter}
      callChef={callChef}
    />
  );
};

export default CustomerMenu;
