export type CartItem = {
  product: any;
  quantity: number;
  notes: string;
};

export interface TemplateProps {
  venueData: any;
  menuData: any[];
  tableNumber: number | null;
  language: "fa" | "en";
  setLanguage: (lang: "fa" | "en") => void;
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  submitOrder: (name: string, mobile: string) => Promise<number | null>;
  callWaiter: (msg: string) => Promise<boolean>;
  callChef: (msg: string) => Promise<boolean>;
}
