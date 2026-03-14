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

export const CUISINES = [
  "Italian",
  "Japanese",
  "Mexican",
  "Indian",
  "Chinese",
  "Thai",
  "Mediterranean",
  "Korean",
  "Vietnamese",
  "Middle Eastern",
  "French",
  "Greek",
  "American",
  "Ethiopian",
  "Turkish",
  "Brazilian",
] as const;
