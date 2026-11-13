// Applies db/schema.sql (idempotent). Usage: DATABASE_URL=... node scripts/migrate.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const sql = neon(process.env.DATABASE_URL);
const stmts = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8").split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log(`Applied ${stmts.length} statements`);
