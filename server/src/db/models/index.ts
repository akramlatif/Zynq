// ============================================================
// ZYNQ — Database Models Barrel Export
// Import everything from here: import { shops, users, ... } from "@/db/models"
// ============================================================

export { shops, planTypeEnum } from "./shops.model";
export type { Shop, NewShop } from "./shops.model";

export { users, userRoleEnum } from "./users.model";
export type { User, NewUser } from "./users.model";

export { products } from "./products.model";
export type { Product, NewProduct } from "./products.model";

export { bills, paymentMethodEnum } from "./bills.model";
export type { Bill, NewBill, BillItemJSON } from "./bills.model";

export { udhaar } from "./udhaar.model";
export type { Udhaar, NewUdhaar } from "./udhaar.model";

export { salesLog } from "./sales-log.model";
export type { SalesLog, NewSalesLog } from "./sales-log.model";
