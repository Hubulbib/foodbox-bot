import { Context, SessionFlavor } from "grammy";

export type AdminAction =
  | "add_product"
  | "add_category"
  | "edit_category"
  | "edit_product_name"
  | "edit_product_description"
  | "edit_product_price"
  | "edit_product_subscription"
  | "edit_product_photo"
  | "edit_product_pername";

export interface SessionData {
  cart?: number[];
  orderStep?: "name" | "address" | "phone";
  orderName?: string;
  orderAddress?: string;
  orderPhone?: string;
  hasSubscription?: boolean;

  // Для ввода совета
  adviceStep?: "waiting_text";
  adviceText?: string;

  // Админские поля
  adminAction?: AdminAction;
  adminEditingProductId?: number;
  adminEditingCategoryId?: number;
  adminEditingOrderId?: number;
  productData?: Record<string, any>;
}

export type AppContext = Context & SessionFlavor<SessionData>;
