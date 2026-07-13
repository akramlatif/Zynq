// ============================================================
// ZYNQ — WhatsApp Business Cloud API Service
// Sends bill receipts and udhaar reminders via Meta's API.
// Includes a daily rate limiter to stay within the free tier.
// ============================================================

import { config } from "../config";
import { logger } from "../utils/logger";

const WA_API_BASE = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;

// ─── Rate Limiter (in-memory, resets daily) ─────────────────

interface RateLimiterState {
  count: number;
  resetDate: string; // YYYY-MM-DD
}

const rateLimiter: RateLimiterState = {
  count: 0,
  resetDate: new Date().toISOString().split("T")[0],
};

function checkRateLimit(): boolean {
  const today = new Date().toISOString().split("T")[0];
  if (rateLimiter.resetDate !== today) {
    rateLimiter.count = 0;
    rateLimiter.resetDate = today;
  }
  if (rateLimiter.count >= config.whatsapp.dailyLimit) {
    return false;
  }
  rateLimiter.count++;
  return true;
}

export function getRateLimitStatus() {
  const today = new Date().toISOString().split("T")[0];
  if (rateLimiter.resetDate !== today) {
    return { sent: 0, limit: config.whatsapp.dailyLimit, remaining: config.whatsapp.dailyLimit };
  }
  return {
    sent: rateLimiter.count,
    limit: config.whatsapp.dailyLimit,
    remaining: config.whatsapp.dailyLimit - rateLimiter.count,
  };
}

// ─── Core Send Function ─────────────────────────────────────

export async function sendWhatsAppMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.whatsapp.phoneNumberId || !config.whatsapp.accessToken) {
    logger.error("[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return { success: false, error: "WhatsApp not configured" };
  }

  if (!checkRateLimit()) {
    logger.warn("[WhatsApp] Daily message limit reached");
    return { success: false, error: "Daily message limit reached (1000/day free tier)" };
  }

  // Normalize Pakistani phone number to international format
  let phone = to.replace(/[\s\-\(\)]/g, "");
  if (phone.startsWith("0")) {
    phone = "92" + phone.substring(1);
  }
  if (!phone.startsWith("+")) {
    phone = phone; // Already without + (Meta expects no +)
  } else {
    phone = phone.substring(1);
  }

  try {
    const response = await fetch(`${WA_API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.whatsapp.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("[WhatsApp] API Error:", data);
      return { success: false, error: data.error?.message || "Unknown WhatsApp API error" };
    }

    const messageId = data.messages?.[0]?.id;
    logger.info(`[WhatsApp] Message sent to ${phone}, ID: ${messageId}`);
    return { success: true, messageId };

  } catch (error: any) {
    logger.error("[WhatsApp] Network Error:", error.message);
    return { success: false, error: error.message };
  }
}

// ─── Bill Receipt ───────────────────────────────────────────

interface BillItem {
  name: string;
  qty: number;
  price: number;
}

interface BillData {
  billNumber: string;
  shopName: string;
  items: BillItem[];
  total: number;
  paymentMethod?: string;
  date?: string;
}

export async function sendReceipt(
  customerPhone: string,
  billData: BillData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const date = billData.date || new Date().toLocaleDateString("ur-PK");

  let message = `🧾 *${billData.shopName}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 بل نمبر: ${billData.billNumber}\n`;
  message += `📅 تاریخ: ${date}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Itemized list
  billData.items.forEach((item, index) => {
    const lineTotal = item.qty * item.price;
    message += `${index + 1}. ${item.name}\n`;
    message += `   ${item.qty} × Rs ${item.price.toLocaleString()} = Rs ${lineTotal.toLocaleString()}\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *کل رقم: Rs ${billData.total.toLocaleString()}*\n`;
  if (billData.paymentMethod) {
    const methodMap: Record<string, string> = {
      cash: "نقد",
      udhaar: "ادھار",
      online: "آن لائن",
      mixed: "مخلوط",
    };
    message += `💳 ادائیگی: ${methodMap[billData.paymentMethod] || billData.paymentMethod}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🙏 خریداری کا شکریہ!\n`;
  message += `آپ کا اعتماد ہماری طاقت ہے۔`;

  return sendWhatsAppMessage(customerPhone, message);
}

// ─── Udhaar Reminder ────────────────────────────────────────

export async function sendUdhaarReminder(
  customerPhone: string,
  amount: number,
  shopName: string,
  customerName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const greeting = customerName ? `محترم ${customerName}` : "محترم صارف";

  let message = `🔔 *ادھار یاددہانی*\n\n`;
  message += `السلام علیکم ${greeting}،\n\n`;
  message += `یہ *${shopName}* کی طرف سے ایک دوستانہ یاددہانی ہے۔\n\n`;
  message += `📌 آپ کے ذمہ *Rs ${amount.toLocaleString()}* واجب الادا ہیں۔\n\n`;
  message += `براہ کرم جلد از جلد ادائیگی فرمائیں۔\n`;
  message += `آپ کے تعاون کا شکریہ! 🙏\n\n`;
  message += `— ${shopName}`;

  return sendWhatsAppMessage(customerPhone, message);
}
