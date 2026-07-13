import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";

// Initialize Gemini
// Using Gemini 2.0 Flash as requested
const genAI = new GoogleGenerativeAI(config.gemini.apiKey || process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // We use 2.5 flash as it's the latest available in the SDK
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.1, // Low temperature for consistent classification
  }
});

// Define Intent Types
export type Intent = 
  | "add_product"
  | "update_stock"
  | "delete_product"
  | "generate_bill"
  | "check_stock"
  | "add_udhaar"
  | "get_udhaar"
  | "get_insights"
  | "set_alert"
  | "unknown"
  | "clarify";

export interface ClassifierResult {
  intent: Intent;
  entities: Record<string, any>;
  confidence: number;
  reply: string;
}

const SYSTEM_PROMPT = `You are Zynq, a smart inventory assistant for Pakistani small businesses (Dukaans, Pharmacies, etc).
You must extract structured intent and entities from the user's message.
You support Urdu, Roman Urdu, English, and mixed language (code-switching).

Always respond in JSON with this exact structure:
{
  "intent": "<intent_name>",
  "entities": { ... },
  "confidence": 0.0 to 1.0,
  "reply": "<friendly confirmation or clarifying question in the SAME LANGUAGE the user spoke>"
}

Supported intents and their required/optional entities:
- add_product       -> entities: name, quantity (number), price (number), category, expiry_date
- delete_product    -> entities: name or product_id
- update_stock      -> entities: name, new_quantity (number) or delta (number, positive/negative)
- generate_bill     -> entities: items (array of {name, qty}), customer_name (optional)
- check_stock       -> entities: name (optional, null = check all low stock)
- add_udhaar        -> entities: customer_name, amount (number), note
- get_udhaar        -> entities: customer_name (optional)
- get_insights      -> entities: period (today/week/month), type (top_sellers/slow/profit)
- set_alert         -> entities: product_name, threshold_qty (number)
- unknown           -> when intent is not clear or entirely unrelated

Rules:
1. Always be friendly and helpful.
2. The 'reply' field MUST match the user's language (e.g., if they speak Roman Urdu, reply in Roman Urdu).
3. Extract numbers cleanly (e.g., "5" instead of "paanch").
4. If confidence < 0.75, set intent to "clarify" and ask for confirmation in the reply.`;

/**
 * Helper to delay execution (for retry logic)
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Classifies a user's natural language input into a structured Intent + Entities.
 * Includes automatic retry logic for API errors.
 */
export async function classifyIntent(text: string, retries = 3): Promise<ClassifierResult> {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nUser Input: "${text}"\n\nOutput JSON:`;
      const result = await model.generateContent(prompt);
      
      const responseText = result.response.text();
      let parsed: ClassifierResult;
      
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Failed to parse Gemini response as JSON");
      }

      // Enforce the confidence rule manually just in case the model forgets
      if (parsed.confidence < 0.75 && parsed.intent !== "unknown") {
        parsed.intent = "clarify";
      }

      return parsed;
    } catch (error: any) {
      attempt++;
      console.error(`[Classifier Error] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt >= retries) {
        // Fallback on exhaustion
        return {
          intent: "unknown",
          entities: {},
          confidence: 0,
          reply: "Sorry, I'm having trouble connecting to the server right now."
        };
      }
      
      // Exponential backoff
      await delay(1000 * Math.pow(2, attempt));
    }
  }
  
  throw new Error("Unreachable");
}

// ============================================================
// TEST FUNCTION
// Runs 10 sample commands and logs the output
// ============================================================

export async function runTests() {
  console.log("🚀 Starting Intent Classifier Tests...\n");

  const samples = [
    // 1. add_product (Roman Urdu)
    "Naya item daalo: 50 Panadol k pattay, price 25 rupay per patta.",
    // 2. generate_bill (Mixed)
    "Bhai, 2 brufen aur 1 dettol ka bill bana do Asad k naam pe.",
    // 3. update_stock (Urdu)
    "پانڈول کے 10 مزید پتے اسٹاک میں شامل کر دیں۔",
    // 4. check_stock (Roman Urdu - All)
    "Kon kon sa maal khatam hone wala hai?",
    // 5. add_udhaar (Mixed)
    "Chacha Rasheed ke khate mein 1500 udhaar likh do, dawai li hai unhone.",
    // 6. get_udhaar (Roman Urdu)
    "Rizwan bhai ka kitna udhaar baki hai?",
    // 7. get_insights (Mixed)
    "Is haftay sab se zyada kya bika hai?",
    // 8. set_alert (English)
    "Set an alert when ORS drops below 50 packets.",
    // 9. Unknown/Clarify
    "Bhai cricket ka score kya chal raha hai?",
    // 10. delete_product (Roman Urdu)
    "Surgical mask ko system se nikal do."
  ];

  for (let i = 0; i < samples.length; i++) {
    console.log(`\n========================================`);
    console.log(`📝 Input ${i + 1}: "${samples[i]}"`);
    
    const result = await classifyIntent(samples[i]);
    
    console.log(`🎯 Intent     : ${result.intent}`);
    console.log(`📦 Entities   : ${JSON.stringify(result.entities)}`);
    console.log(`📊 Confidence : ${result.confidence}`);
    console.log(`💬 Reply      : "${result.reply}"`);
  }
  console.log(`\n✅ Tests completed!`);
}

// Execute tests if file is run directly
if (require.main === module) {
  // Check if API key is present
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in environment variables. Tests will likely fail unless dummy key works.");
  }
  runTests();
}
