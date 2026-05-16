/**
 * Seed script — populates Trivia Tours with initial data
 * Run: pnpm db:seed
 */

import { config } from "dotenv";
import {
  countries,
  productCategories,
  users,
} from "../lib/db/schema";

config({ path: ".env.local" });

// Verify env loaded before importing anything that uses it
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found. Check .env.local at project root.");
  process.exit(1);
}

const COUNTRIES = [
  { code: "EG", name: "Egypt", flagEmoji: "🇪🇬", sortOrder: 1 },
  { code: "AE", name: "United Arab Emirates", flagEmoji: "🇦🇪", sortOrder: 2 },
  { code: "SA", name: "Saudi Arabia", flagEmoji: "🇸🇦", sortOrder: 3 },
  { code: "TR", name: "Turkey", flagEmoji: "🇹🇷", sortOrder: 4 },
  { code: "GR", name: "Greece", flagEmoji: "🇬🇷", sortOrder: 5 },
  { code: "IT", name: "Italy", flagEmoji: "🇮🇹", sortOrder: 6 },
  { code: "FR", name: "France", flagEmoji: "🇫🇷", sortOrder: 7 },
  { code: "ES", name: "Spain", flagEmoji: "🇪🇸", sortOrder: 8 },
  { code: "GB", name: "United Kingdom", flagEmoji: "🇬🇧", sortOrder: 9 },
  { code: "DE", name: "Germany", flagEmoji: "🇩🇪", sortOrder: 10 },
  { code: "CH", name: "Switzerland", flagEmoji: "🇨🇭", sortOrder: 11 },
  { code: "AT", name: "Austria", flagEmoji: "🇦🇹", sortOrder: 12 },
  { code: "NL", name: "Netherlands", flagEmoji: "🇳🇱", sortOrder: 13 },
  { code: "PT", name: "Portugal", flagEmoji: "🇵🇹", sortOrder: 14 },
  { code: "MA", name: "Morocco", flagEmoji: "🇲🇦", sortOrder: 15 },
  { code: "JO", name: "Jordan", flagEmoji: "🇯🇴", sortOrder: 16 },
  { code: "LB", name: "Lebanon", flagEmoji: "🇱🇧", sortOrder: 17 },
  { code: "QA", name: "Qatar", flagEmoji: "🇶🇦", sortOrder: 18 },
  { code: "OM", name: "Oman", flagEmoji: "🇴🇲", sortOrder: 19 },
  { code: "BH", name: "Bahrain", flagEmoji: "🇧🇭", sortOrder: 20 },
  { code: "TH", name: "Thailand", flagEmoji: "🇹🇭", sortOrder: 21 },
  { code: "MY", name: "Malaysia", flagEmoji: "🇲🇾", sortOrder: 22 },
  { code: "SG", name: "Singapore", flagEmoji: "🇸🇬", sortOrder: 23 },
  { code: "ID", name: "Indonesia", flagEmoji: "🇮🇩", sortOrder: 24 },
  { code: "JP", name: "Japan", flagEmoji: "🇯🇵", sortOrder: 25 },
  { code: "KR", name: "South Korea", flagEmoji: "🇰🇷", sortOrder: 26 },
  { code: "US", name: "United States", flagEmoji: "🇺🇸", sortOrder: 27 },
  { code: "CA", name: "Canada", flagEmoji: "🇨🇦", sortOrder: 28 },
  { code: "BR", name: "Brazil", flagEmoji: "🇧🇷", sortOrder: 29 },
  { code: "ZA", name: "South Africa", flagEmoji: "🇿🇦", sortOrder: 30 },
];

const CATEGORIES = [
  { name: "Cultural", slug: "cultural", icon: "Landmark" },
  { name: "Adventure", slug: "adventure", icon: "Mountain" },
  { name: "Family", slug: "family", icon: "Users" },
  { name: "Romantic", slug: "romantic", icon: "Heart" },
  { name: "Religious", slug: "religious", icon: "Church" },
  { name: "Nature", slug: "nature", icon: "TreePine" },
  { name: "Food & Drink", slug: "food-drink", icon: "UtensilsCrossed" },
  { name: "Shopping", slug: "shopping", icon: "ShoppingBag" },
  { name: "Wellness", slug: "wellness", icon: "Sparkles" },
  { name: "Nightlife", slug: "nightlife", icon: "Moon" },
];

async function main() {
  const { db } = await import("../lib/db");

  console.log("🌱 Seeding Trivia Tours database...\n");

  console.log("→ Inserting 30 countries...");
  await db.insert(countries).values(COUNTRIES).onConflictDoNothing();
  console.log("✓ Countries seeded\n");

  console.log("→ Inserting product categories...");
  await db.insert(productCategories).values(CATEGORIES).onConflictDoNothing();
  console.log("✓ Categories seeded\n");

  console.log("→ Creating admin user...");
  await db
    .insert(users)
    .values({
      email: "mohamedezzat@triviaeg.com",
      name: "Admin",
      role: "ADMIN",
    })
    .onConflictDoNothing();
  console.log("✓ Admin user created\n");

  console.log("✅ Seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});