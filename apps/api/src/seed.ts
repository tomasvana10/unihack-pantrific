import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import { db } from "./db";
import {
  deficienciesTable,
  dietaryProfilesTable,
  intakeLogsTable,
  pantryItemTable,
  pantryTable,
  trackedNutrientsTable,
  userTable,
} from "./db/schema";

const USERS = [
  {
    displayName: "Alice Chen",
    username: "alice-demo",
    password: "password",
    gender: "female" as const,
    age: 28,
    weight: 62,
    dietType: "vegetarian" as const,
    cuisines: ["Japanese", "Mediterranean", "Indian", "Thai"],
    calorieTarget: 1900,
    proteinTarget: 55,
    deficiencies: [
      { nutrient: "Iron", severity: "moderate" },
      { nutrient: "Vitamin B12", severity: "high" },
    ],
    nutrients: [
      { name: "Calories", unit: "kcal", dailyTarget: 1900 },
      { name: "Protein", unit: "g", dailyTarget: 55 },
      { name: "Iron", unit: "mg", dailyTarget: 18 },
      { name: "Vitamin B12", unit: "mcg", dailyTarget: 2.4 },
      { name: "Calcium", unit: "mg", dailyTarget: 1000 },
      { name: "Fibre", unit: "g", dailyTarget: 28 },
    ],
    pantries: [
      {
        name: "Fridge",
        items: [
          { name: "Tofu", quantity: 2, confidence: 0.95 },
          { name: "Spinach", quantity: 1, confidence: 0.92 },
          { name: "Eggs", quantity: 12, confidence: 0.98 },
          { name: "Milk", quantity: 1, confidence: 0.97 },
          { name: "Bell Pepper", quantity: 3, confidence: 0.88 },
          { name: "Carrots", quantity: 4, confidence: 0.91 },
          { name: "Greek Yogurt", quantity: 2, confidence: 0.89 },
        ],
      },
      {
        name: "Pantry Shelf",
        items: [
          { name: "Rice", quantity: 1, confidence: 0.96 },
          { name: "Lentils", quantity: 2, confidence: 0.93 },
          { name: "Chickpeas", quantity: 3, confidence: 0.94 },
          { name: "Olive Oil", quantity: 1, confidence: 0.97 },
          { name: "Quinoa", quantity: 1, confidence: 0.85 },
        ],
      },
    ],
  },
  {
    displayName: "Marcus Johnson",
    username: "marcus-demo",
    password: "password",
    gender: "male" as const,
    age: 35,
    weight: 88,
    dietType: "none" as const,
    cuisines: ["American", "Mexican", "Korean", "Italian"],
    calorieTarget: 2500,
    proteinTarget: 120,
    deficiencies: [
      { nutrient: "Vitamin D", severity: "low" },
      { nutrient: "Magnesium", severity: "moderate" },
    ],
    nutrients: [
      { name: "Calories", unit: "kcal", dailyTarget: 2500 },
      { name: "Protein", unit: "g", dailyTarget: 120 },
      { name: "Carbohydrates", unit: "g", dailyTarget: 300 },
      { name: "Fat", unit: "g", dailyTarget: 80 },
      { name: "Vitamin D", unit: "IU", dailyTarget: 800 },
    ],
    pantries: [
      {
        name: "Main Fridge",
        items: [
          { name: "Chicken Breast", quantity: 4, confidence: 0.96 },
          { name: "Ground Beef", quantity: 1, confidence: 0.91 },
          { name: "Cheddar Cheese", quantity: 1, confidence: 0.87 },
          { name: "Avocado", quantity: 3, confidence: 0.93 },
          { name: "Tomatoes", quantity: 5, confidence: 0.95 },
          { name: "Onion", quantity: 2, confidence: 0.94 },
          { name: "Jalapeños", quantity: 4, confidence: 0.82 },
          { name: "Sour Cream", quantity: 1, confidence: 0.88 },
        ],
      },
    ],
  },
  {
    displayName: "Priya Sharma",
    username: "priya-demo",
    password: "password",
    gender: "female",
    age: 22,
    weight: 55,
    dietType: "vegan",
    cuisines: ["Indian", "Thai", "Ethiopian", "Middle Eastern"],
    calorieTarget: 1800,
    proteinTarget: 50,
    deficiencies: [
      { nutrient: "Vitamin B12", severity: "high" },
      { nutrient: "Iron", severity: "moderate" },
      { nutrient: "Omega-3", severity: "low" },
      { nutrient: "Zinc", severity: "low" },
    ],
    nutrients: [
      { name: "Calories", unit: "kcal", dailyTarget: 1800 },
      { name: "Protein", unit: "g", dailyTarget: 50 },
      { name: "Iron", unit: "mg", dailyTarget: 18 },
      { name: "Vitamin B12", unit: "mcg", dailyTarget: 2.4 },
      { name: "Calcium", unit: "mg", dailyTarget: 1000 },
      { name: "Vitamin C", unit: "mg", dailyTarget: 90 },
      { name: "Fibre", unit: "g", dailyTarget: 30 },
    ],
    pantries: [
      {
        name: "Kitchen Fridge",
        items: [
          { name: "Tempeh", quantity: 2, confidence: 0.88 },
          { name: "Kale", quantity: 1, confidence: 0.91 },
          { name: "Sweet Potato", quantity: 3, confidence: 0.94 },
          { name: "Coconut Milk", quantity: 2, confidence: 0.96 },
          { name: "Mushrooms", quantity: 1, confidence: 0.85 },
        ],
      },
      {
        name: "Dry Storage",
        items: [
          { name: "Black Beans", quantity: 3, confidence: 0.95 },
          { name: "Nutritional Yeast", quantity: 1, confidence: 0.79 },
          { name: "Chia Seeds", quantity: 1, confidence: 0.83 },
          { name: "Brown Rice", quantity: 1, confidence: 0.92 },
          { name: "Peanut Butter", quantity: 1, confidence: 0.97 },
          { name: "Walnuts", quantity: 1, confidence: 0.86 },
        ],
      },
      {
        name: "Spice Rack",
        items: [
          { name: "Turmeric", quantity: 1, confidence: 0.81 },
          { name: "Cumin", quantity: 1, confidence: 0.78 },
          { name: "Garam Masala", quantity: 1, confidence: 0.74 },
        ],
      },
    ],
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(
    8 + Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 60),
  );
  return d;
}

export async function seedSampleData() {
  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(sql`${userTable.username} LIKE '%-demo'`)
    .limit(1);

  if (existing.length > 0) {
    console.log("sample data already exists, skipping seed");
    return;
  }

  console.log("seeding sample data...");

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const token = crypto.randomUUID();

    const [user] = await db
      .insert(userTable)
      .values({
        displayName: u.displayName,
        username: u.username,
        passwordHash,
        token,
      })
      .returning({ id: userTable.id });

    // dietary profile
    await db.insert(dietaryProfilesTable).values({
      userId: user.id,
      calorieTarget: u.calorieTarget,
      proteinTarget: u.proteinTarget,
      dietType: u.dietType,
      cuisinePreferences: u.cuisines,
      gender: u.gender,
      age: u.age,
      weight: u.weight,
    });

    // deficiencies
    if (u.deficiencies.length > 0) {
      await db
        .insert(deficienciesTable)
        .values(u.deficiencies.map((d) => ({ userId: user.id, ...d })));
    }

    // tracked nutrients + intake logs
    for (const n of u.nutrients) {
      const [nutrient] = await db
        .insert(trackedNutrientsTable)
        .values({ userId: user.id, ...n })
        .returning({ id: trackedNutrientsTable.id });

      // generate 7 days of intake logs (1-3 entries per day)
      const logs: {
        userId: string;
        trackedNutrientId: string;
        amount: number;
        loggedAt: Date;
      }[] = [];
      for (let day = 0; day < 7; day++) {
        const entries = 1 + Math.floor(Math.random() * 3);
        for (let e = 0; e < entries; e++) {
          const fraction = (0.2 + Math.random() * 0.5) / entries;
          logs.push({
            userId: user.id,
            trackedNutrientId: nutrient.id,
            amount: Math.round(n.dailyTarget * fraction * 10) / 10,
            loggedAt: daysAgo(day),
          });
        }
      }
      await db.insert(intakeLogsTable).values(logs);
    }

    // pantries + items
    for (const p of u.pantries) {
      const [pantry] = await db
        .insert(pantryTable)
        .values({ userId: user.id, name: p.name })
        .returning({ id: pantryTable.id });

      await db.insert(pantryItemTable).values(
        p.items.map((item) => ({
          pantryId: pantry.id,
          name: item.name,
          quantity: item.quantity,
          confidence: item.confidence,
        })),
      );
    }

    console.log(`  created user: ${u.displayName} (${u.username})`);
  }

  console.log("sample data seeded successfully");
}
