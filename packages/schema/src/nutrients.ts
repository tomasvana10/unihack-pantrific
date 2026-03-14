export type NutrientPreset = {
  name: string;
  unit: string;
  defaultTarget: number;
};

export const COMMON_NUTRIENTS: NutrientPreset[] = [
  { name: "Calories", unit: "kcal", defaultTarget: 2000 },
  { name: "Protein", unit: "g", defaultTarget: 50 },
  { name: "Carbohydrates", unit: "g", defaultTarget: 250 },
  { name: "Fat", unit: "g", defaultTarget: 65 },
  { name: "Fibre", unit: "g", defaultTarget: 25 },
  { name: "Vitamin C", unit: "mg", defaultTarget: 90 },
  { name: "Iron", unit: "mg", defaultTarget: 18 },
  { name: "Calcium", unit: "mg", defaultTarget: 1000 },
  { name: "Vitamin D", unit: "IU", defaultTarget: 600 },
  { name: "Vitamin B12", unit: "mcg", defaultTarget: 2.4 },
];

export const COMMON_DEFICIENCIES = [
  "Iron",
  "Vitamin D",
  "Vitamin B12",
  "Calcium",
  "Magnesium",
  "Zinc",
  "Folate",
  "Vitamin A",
  "Omega-3",
  "Potassium",
] as const;

export const CUISINE_OPTIONS = [
  { name: "Italian", emoji: "🍝" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🥡" },
  { name: "Thai", emoji: "🍜" },
  { name: "Mediterranean", emoji: "🫒" },
  { name: "Korean", emoji: "🥘" },
  { name: "Vietnamese", emoji: "🍲" },
  { name: "Middle Eastern", emoji: "🧆" },
  { name: "French", emoji: "🥐" },
  { name: "Greek", emoji: "🥙" },
  { name: "American", emoji: "🍔" },
  { name: "Ethiopian", emoji: "🫓" },
  { name: "Turkish", emoji: "🥩" },
  { name: "Brazilian", emoji: "🥩" },
] as const;

export const CUISINE_NAMES = CUISINE_OPTIONS.map((c) => c.name);
