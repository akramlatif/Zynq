// ============================================================
// ZYNQ — Auth Types
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: "owner" | "manager" | "cashier";
  shop_id: string;
  avatar_url?: string;
  language_pref: "en" | "ur" | "roman_urdu";
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Shop {
  id: string;
  name: string;
  name_urdu?: string;
  owner_id: string;
  address?: string;
  city?: string;
  phone?: string;
  business_type: string;
  currency: string;
  logo_url?: string;
  created_at: Date;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email_or_phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  shop_name: string;
  business_type: string;
  city?: string;
}
