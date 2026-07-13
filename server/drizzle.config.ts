import { config } from "drizzle-kit";
import "dotenv/config";

export default config({
  schema: "./src/db/models/*.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
