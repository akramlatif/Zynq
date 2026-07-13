// ============================================================
// ZYNQ — Product Categories
// Common categories for Pakistani small businesses
// ============================================================

export interface ProductCategory {
  id: string;
  name_en: string;
  name_ur: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: "grocery", name_en: "Grocery", name_ur: "گروسری", icon: "🛒" },
  { id: "dairy", name_en: "Dairy", name_ur: "دودھ / ڈیری", icon: "🥛" },
  { id: "beverages", name_en: "Beverages", name_ur: "مشروبات", icon: "🥤" },
  { id: "snacks", name_en: "Snacks", name_ur: "سنیکس", icon: "🍿" },
  { id: "household", name_en: "Household", name_ur: "گھریلو سامان", icon: "🧹" },
  { id: "personal_care", name_en: "Personal Care", name_ur: "ذاتی نگہداشت", icon: "🧴" },
  { id: "medicine", name_en: "Medicine", name_ur: "دوائی", icon: "💊" },
  { id: "stationery", name_en: "Stationery", name_ur: "اسٹیشنری", icon: "📝" },
  { id: "electronics", name_en: "Electronics", name_ur: "الیکٹرونکس", icon: "🔌" },
  { id: "clothing", name_en: "Clothing", name_ur: "کپڑے", icon: "👕" },
  { id: "mobile", name_en: "Mobile & Accessories", name_ur: "موبائل", icon: "📱" },
  { id: "cosmetics", name_en: "Cosmetics", name_ur: "میک اپ / کاسمیٹکس", icon: "💄" },
  { id: "tobacco", name_en: "Tobacco & Pan", name_ur: "تمباکو / پان", icon: "🚬" },
  { id: "frozen", name_en: "Frozen Food", name_ur: "فروزن فوڈ", icon: "🧊" },
  { id: "bakery", name_en: "Bakery", name_ur: "بیکری", icon: "🍞" },
  { id: "other", name_en: "Other", name_ur: "دیگر", icon: "📦" },
];

/** Common Pakistani units of measurement */
export const UNITS = {
  PIECE: { en: "piece", ur: "عدد" },
  KG: { en: "kg", ur: "کلو" },
  GRAM: { en: "gram", ur: "گرام" },
  LITER: { en: "liter", ur: "لیٹر" },
  ML: { en: "ml", ur: "ایم ایل" },
  DOZEN: { en: "dozen", ur: "درجن" },
  PACK: { en: "pack", ur: "پیکٹ" },
  BOX: { en: "box", ur: "ڈبہ" },
  BUNDLE: { en: "bundle", ur: "گٹھا" },
  METER: { en: "meter", ur: "میٹر" },
} as const;
