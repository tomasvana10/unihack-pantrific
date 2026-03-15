import "./env";
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

const DEMO_USER = {
  displayName: "Tomas Vana",
  username: "tomas-demo",
  password: "password",
  gender: "male" as const,
  age: 19,
  weight: 70,
  dietType: "none" as const,
  cuisines: [
    "Italian",
    "Japanese",
    "Mexican",
    "Indian",
    "Thai",
    "Mediterranean",
    "Korean",
    "American",
  ],
  calorieTarget: 2200,
  proteinTarget: 100,
  deficiencies: [
    { nutrient: "Vitamin D", severity: "moderate" },
    { nutrient: "Iron", severity: "low" },
    { nutrient: "Omega-3", severity: "moderate" },
  ],
  nutrients: [
    { name: "Calories", unit: "kcal", dailyTarget: 2200 },
    { name: "Protein", unit: "g", dailyTarget: 100 },
    { name: "Carbohydrates", unit: "g", dailyTarget: 270 },
    { name: "Fat", unit: "g", dailyTarget: 75 },
    { name: "Fibre", unit: "g", dailyTarget: 30 },
    { name: "Iron", unit: "mg", dailyTarget: 18 },
    { name: "Vitamin C", unit: "mg", dailyTarget: 90 },
    { name: "Calcium", unit: "mg", dailyTarget: 1000 },
  ],
  pantries: [
    {
      name: "Fridge",
      items: [
        { name: "Chicken Breast", quantity: 4, confidence: 0.97 },
        { name: "Salmon Fillet", quantity: 2, confidence: 0.94 },
        { name: "Eggs", quantity: 12, confidence: 0.99 },
        { name: "Greek Yogurt", quantity: 3, confidence: 0.92 },
        { name: "Milk", quantity: 2, confidence: 0.96 },
        { name: "Cheddar Cheese", quantity: 1, confidence: 0.91 },
        { name: "Butter", quantity: 1, confidence: 0.95 },
        { name: "Spinach", quantity: 2, confidence: 0.89 },
        { name: "Kale", quantity: 1, confidence: 0.87 },
        { name: "Broccoli", quantity: 2, confidence: 0.93 },
        { name: "Bell Pepper", quantity: 4, confidence: 0.9 },
        { name: "Carrots", quantity: 6, confidence: 0.94 },
        { name: "Zucchini", quantity: 2, confidence: 0.88 },
        { name: "Tomatoes", quantity: 5, confidence: 0.96 },
        { name: "Avocado", quantity: 3, confidence: 0.92 },
        { name: "Lemon", quantity: 3, confidence: 0.91 },
        { name: "Lime", quantity: 2, confidence: 0.89 },
        { name: "Garlic", quantity: 1, confidence: 0.85 },
        { name: "Ginger", quantity: 1, confidence: 0.83 },
        { name: "Tofu", quantity: 2, confidence: 0.9 },
        { name: "Mushrooms", quantity: 2, confidence: 0.88 },
        { name: "Sweet Potato", quantity: 3, confidence: 0.93 },
        { name: "Onion", quantity: 4, confidence: 0.95 },
        { name: "Celery", quantity: 1, confidence: 0.86 },
        { name: "Cucumber", quantity: 2, confidence: 0.91 },
      ],
    },
    {
      name: "Pantry",
      items: [
        { name: "Rice", quantity: 2, confidence: 0.97 },
        { name: "Pasta", quantity: 3, confidence: 0.96 },
        { name: "Quinoa", quantity: 1, confidence: 0.88 },
        { name: "Oats", quantity: 1, confidence: 0.94 },
        { name: "Bread", quantity: 1, confidence: 0.92 },
        { name: "Flour", quantity: 1, confidence: 0.93 },
        { name: "Olive Oil", quantity: 2, confidence: 0.98 },
        { name: "Coconut Oil", quantity: 1, confidence: 0.87 },
        { name: "Soy Sauce", quantity: 1, confidence: 0.91 },
        { name: "Fish Sauce", quantity: 1, confidence: 0.82 },
        { name: "Sriracha", quantity: 1, confidence: 0.89 },
        { name: "Peanut Butter", quantity: 1, confidence: 0.95 },
        { name: "Honey", quantity: 1, confidence: 0.93 },
        { name: "Chickpeas", quantity: 3, confidence: 0.94 },
        { name: "Black Beans", quantity: 2, confidence: 0.92 },
        { name: "Lentils", quantity: 2, confidence: 0.91 },
        { name: "Canned Tomatoes", quantity: 4, confidence: 0.96 },
        { name: "Coconut Milk", quantity: 2, confidence: 0.9 },
        { name: "Chicken Stock", quantity: 2, confidence: 0.88 },
        { name: "Walnuts", quantity: 1, confidence: 0.84 },
        { name: "Almonds", quantity: 1, confidence: 0.86 },
        { name: "Chia Seeds", quantity: 1, confidence: 0.81 },
        { name: "Dark Chocolate", quantity: 1, confidence: 0.88 },
      ],
    },
    {
      name: "Spice Rack",
      items: [
        { name: "Cumin", quantity: 1, confidence: 0.79 },
        { name: "Paprika", quantity: 1, confidence: 0.82 },
        { name: "Turmeric", quantity: 1, confidence: 0.8 },
        { name: "Chili Flakes", quantity: 1, confidence: 0.77 },
        { name: "Oregano", quantity: 1, confidence: 0.81 },
        { name: "Basil", quantity: 1, confidence: 0.78 },
        { name: "Cinnamon", quantity: 1, confidence: 0.85 },
        { name: "Garam Masala", quantity: 1, confidence: 0.76 },
        { name: "Black Pepper", quantity: 1, confidence: 0.9 },
        { name: "Salt", quantity: 1, confidence: 0.95 },
      ],
    },
    {
      name: "Freezer",
      items: [
        { name: "Frozen Shrimp", quantity: 1, confidence: 0.91 },
        { name: "Frozen Peas", quantity: 2, confidence: 0.93 },
        { name: "Frozen Berries", quantity: 1, confidence: 0.89 },
        { name: "Frozen Corn", quantity: 1, confidence: 0.87 },
        { name: "Ice Cream", quantity: 1, confidence: 0.94 },
      ],
    },
  ],
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(
    8 + Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 60),
  );
  return d;
}

async function seedDemo() {
  // Wipe all existing data
  await db.delete(intakeLogsTable);
  await db.delete(pantryItemTable);
  await db.delete(pantryTable);
  await db.delete(trackedNutrientsTable);
  await db.delete(deficienciesTable);
  await db.delete(dietaryProfilesTable);
  await db.execute(sql`DELETE FROM meal_cache`);
  await db.execute(sql`DELETE FROM recipe_cache`);
  await db.delete(userTable);

  const u = DEMO_USER;
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

  if (u.deficiencies.length > 0) {
    await db
      .insert(deficienciesTable)
      .values(u.deficiencies.map((d) => ({ userId: user.id, ...d })));
  }

  for (const n of u.nutrients) {
    const [nutrient] = await db
      .insert(trackedNutrientsTable)
      .values({ userId: user.id, ...n })
      .returning({ id: trackedNutrientsTable.id });

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

  console.log(`demo user seeded: ${u.username} / ${u.password}`);
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
