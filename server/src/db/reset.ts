// ============================================================
// ZYNQ — Database Reset Script
// WARNING: Drops all tables and re-runs migration + seed
// Run: npm run db:reset --workspace=server
// ============================================================

import { connection, closeDatabase } from "./index";

async function reset() {
  console.log("⚠️  Resetting Zynq database...\n");

  // Drop all tables in correct order (respecting FKs)
  await connection`DROP TABLE IF EXISTS sales_log CASCADE`;
  await connection`DROP TABLE IF EXISTS udhaar CASCADE`;
  await connection`DROP TABLE IF EXISTS bills CASCADE`;
  await connection`DROP TABLE IF EXISTS products CASCADE`;
  await connection`DROP TABLE IF EXISTS users CASCADE`;
  await connection`DROP TABLE IF EXISTS shops CASCADE`;

  // Drop custom enum types
  await connection`DROP TYPE IF EXISTS plan_type CASCADE`;
  await connection`DROP TYPE IF EXISTS user_role CASCADE`;
  await connection`DROP TYPE IF EXISTS payment_method CASCADE`;

  console.log("🗑️  All tables and types dropped.");
  console.log("   Run 'npm run db:migrate' then 'npm run db:seed' to rebuild.");
}

reset()
  .then(() => closeDatabase())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  });
