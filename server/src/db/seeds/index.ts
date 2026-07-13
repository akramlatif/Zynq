// ============================================================
// ZYNQ — Seed Data
// Sample Pharmacy in Islamabad (F-8 Markaz)
// Run: npm run db:seed --workspace=server
// ============================================================

import { db, closeDatabase } from "../index";
import { shops, users, products, bills, udhaar, salesLog } from "../models";
import bcryptjs from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding Zynq database...\n");

  // ─── 1. Create Shop ────────────────────────────────────────

  const [shop] = await db
    .insert(shops)
    .values({
      name: "Al-Shifa Pharmacy",
      owner_name: "Dr. Ahmed Khan",
      phone: "+923001234567",
      city: "Islamabad",
      plan_type: "starter",
    })
    .returning();

  console.log(`✅ Shop created: ${shop.name} (${shop.city})`);

  // ─── 2. Create Users ───────────────────────────────────────

  const ownerHash = await bcryptjs.hash("owner@123", 12);
  const cashierHash = await bcryptjs.hash("cashier@123", 12);

  const [owner] = await db
    .insert(users)
    .values({
      shop_id: shop.id,
      name: "Dr. Ahmed Khan",
      phone: "+923001234567",
      role: "owner",
      password_hash: ownerHash,
    })
    .returning();

  const [cashier] = await db
    .insert(users)
    .values({
      shop_id: shop.id,
      name: "Bilal Hassan",
      phone: "+923009876543",
      role: "cashier",
      password_hash: cashierHash,
    })
    .returning();

  console.log(`✅ Users created: ${owner.name} (owner), ${cashier.name} (cashier)`);

  // ─── 3. Create Products (Pharmacy Inventory) ──────────────

  const productData = [
    {
      shop_id: shop.id,
      name: "Panadol Extra",
      category: "medicine",
      quantity: 150,
      price: "25.00",
      cost_price: "18.00",
      expiry_date: "2027-06-15",
      alert_threshold: 20,
      barcode: "8964001510017",
    },
    {
      shop_id: shop.id,
      name: "Brufen 400mg",
      category: "medicine",
      quantity: 80,
      price: "35.00",
      cost_price: "25.00",
      expiry_date: "2027-03-20",
      alert_threshold: 15,
      barcode: "8964001510024",
    },
    {
      shop_id: shop.id,
      name: "Augmentin 625mg",
      category: "medicine",
      quantity: 45,
      price: "180.00",
      cost_price: "140.00",
      expiry_date: "2027-01-10",
      alert_threshold: 10,
      barcode: "8964001510031",
    },
    {
      shop_id: shop.id,
      name: "Disprin",
      category: "medicine",
      quantity: 200,
      price: "15.00",
      cost_price: "10.00",
      expiry_date: "2028-12-01",
      alert_threshold: 30,
      barcode: "8964001510048",
    },
    {
      shop_id: shop.id,
      name: "Flagyl 400mg",
      category: "medicine",
      quantity: 60,
      price: "45.00",
      cost_price: "32.00",
      expiry_date: "2027-08-25",
      alert_threshold: 10,
      barcode: "8964001510055",
    },
    {
      shop_id: shop.id,
      name: "ORS Sachets",
      category: "medicine",
      quantity: 300,
      price: "10.00",
      cost_price: "6.00",
      expiry_date: "2028-05-15",
      alert_threshold: 50,
      barcode: "8964001510062",
    },
    {
      shop_id: shop.id,
      name: "Centrum Multivitamin",
      category: "medicine",
      quantity: 25,
      price: "950.00",
      cost_price: "750.00",
      expiry_date: "2027-11-30",
      alert_threshold: 5,
      barcode: "8964001510079",
    },
    {
      shop_id: shop.id,
      name: "Dettol Antiseptic 250ml",
      category: "personal_care",
      quantity: 40,
      price: "350.00",
      cost_price: "280.00",
      alert_threshold: 8,
      barcode: "8964001510086",
    },
    {
      shop_id: shop.id,
      name: "Band-Aid Box (50pc)",
      category: "medicine",
      quantity: 35,
      price: "120.00",
      cost_price: "85.00",
      alert_threshold: 5,
      barcode: "8964001510093",
    },
    {
      shop_id: shop.id,
      name: "Cetirizine 10mg",
      category: "medicine",
      quantity: 90,
      price: "20.00",
      cost_price: "12.00",
      expiry_date: "2027-09-18",
      alert_threshold: 15,
      barcode: "8964001510109",
    },
    {
      shop_id: shop.id,
      name: "Ensure Vanilla 400g",
      category: "dairy",
      quantity: 15,
      price: "2800.00",
      cost_price: "2300.00",
      expiry_date: "2027-07-22",
      alert_threshold: 3,
      barcode: "8964001510116",
    },
    {
      shop_id: shop.id,
      name: "Voltaren Gel 50g",
      category: "medicine",
      quantity: 28,
      price: "320.00",
      cost_price: "250.00",
      expiry_date: "2027-04-10",
      alert_threshold: 5,
      barcode: "8964001510123",
    },
    {
      shop_id: shop.id,
      name: "Surgical Mask Box (50pc)",
      category: "medicine",
      quantity: 100,
      price: "250.00",
      cost_price: "180.00",
      alert_threshold: 15,
      barcode: "8964001510130",
    },
    {
      shop_id: shop.id,
      name: "Baby Diaper Pampers (M-30)",
      category: "personal_care",
      quantity: 20,
      price: "1400.00",
      cost_price: "1100.00",
      alert_threshold: 5,
      barcode: "8964001510147",
    },
    {
      shop_id: shop.id,
      name: "Strepsils (8 lozenges)",
      category: "medicine",
      quantity: 70,
      price: "80.00",
      cost_price: "55.00",
      expiry_date: "2027-10-05",
      alert_threshold: 10,
      barcode: "8964001510154",
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .returning();

  console.log(`✅ Products created: ${insertedProducts.length} items`);

  // ─── 4. Create Sample Bills ────────────────────────────────

  const billsData = [
    {
      shop_id: shop.id,
      cashier_id: cashier.id,
      items: [
        { name: "Panadol Extra", qty: 3, price: 25, total: 75 },
        { name: "ORS Sachets", qty: 5, price: 10, total: 50 },
      ],
      total: "125.00",
      payment_method: "cash" as const,
      customer_name: "Asad Ali",
    },
    {
      shop_id: shop.id,
      cashier_id: cashier.id,
      items: [
        { name: "Augmentin 625mg", qty: 1, price: 180, total: 180 },
        { name: "Brufen 400mg", qty: 2, price: 35, total: 70 },
        { name: "Flagyl 400mg", qty: 1, price: 45, total: 45 },
      ],
      total: "295.00",
      payment_method: "udhaar" as const,
      customer_name: "Rizwan Bhai",
    },
    {
      shop_id: shop.id,
      cashier_id: owner.id,
      items: [
        { name: "Centrum Multivitamin", qty: 1, price: 950, total: 950 },
        { name: "Ensure Vanilla 400g", qty: 1, price: 2800, total: 2800 },
      ],
      total: "3750.00",
      payment_method: "cash" as const,
      customer_name: "Mrs. Fatima",
    },
  ];

  await db.insert(bills).values(billsData);
  console.log(`✅ Bills created: ${billsData.length} transactions`);

  // ─── 5. Create Udhaar Records ──────────────────────────────

  const udhaarData = [
    {
      shop_id: shop.id,
      customer_name: "Rizwan Bhai",
      customer_phone: "+923331112233",
      amount: "295.00",
      is_paid: false,
      note: "Augmentin + Brufen + Flagyl — says will pay on Friday",
    },
    {
      shop_id: shop.id,
      customer_name: "Chacha Rasheed",
      customer_phone: "+923214445566",
      amount: "1500.00",
      is_paid: false,
      note: "Monthly medicines for blood pressure",
    },
    {
      shop_id: shop.id,
      customer_name: "Nadia Bibi",
      amount: "450.00",
      is_paid: true,
      note: "Baby diapers — PAID on 28th June",
    },
  ];

  await db.insert(udhaar).values(udhaarData);
  console.log(`✅ Udhaar records created: ${udhaarData.length} entries`);

  // ─── 6. Create Sales Log Entries ───────────────────────────

  const panadol = insertedProducts.find((p: any) => p.name === "Panadol Extra")!;
  const ors = insertedProducts.find((p: any) => p.name === "ORS Sachets")!;
  const augmentin = insertedProducts.find((p: any) => p.name === "Augmentin 625mg")!;
  const brufen = insertedProducts.find((p: any) => p.name === "Brufen 400mg")!;
  const centrum = insertedProducts.find((p: any) => p.name === "Centrum Multivitamin")!;
  const ensure = insertedProducts.find((p: any) => p.name === "Ensure Vanilla 400g")!;

  const salesData = [
    { shop_id: shop.id, product_id: panadol.id, quantity_sold: 3, sale_price: "25.00" },
    { shop_id: shop.id, product_id: ors.id, quantity_sold: 5, sale_price: "10.00" },
    { shop_id: shop.id, product_id: augmentin.id, quantity_sold: 1, sale_price: "180.00" },
    { shop_id: shop.id, product_id: brufen.id, quantity_sold: 2, sale_price: "35.00" },
    { shop_id: shop.id, product_id: centrum.id, quantity_sold: 1, sale_price: "950.00" },
    { shop_id: shop.id, product_id: ensure.id, quantity_sold: 1, sale_price: "2800.00" },
  ];

  await db.insert(salesLog).values(salesData);
  console.log(`✅ Sales log entries created: ${salesData.length} records`);

  // ─── Done ──────────────────────────────────────────────────

  console.log("\n🎉 Seed complete! Al-Shifa Pharmacy (F-8 Markaz, Islamabad) is ready.");
  console.log("   Owner login:   +923001234567 / owner@123");
  console.log("   Cashier login: +923009876543 / cashier@123");
}

// ─── Execute ─────────────────────────────────────────────────

seed()
  .then(() => closeDatabase())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
