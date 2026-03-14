export type OnboardingStackParams = {
  Name: undefined;
  Login: undefined;
  Password: { displayName: string };
  QuickSetup: { userId: string };
  DietType: { userId: string };
  Cuisines: { userId: string };
  Goals: { userId: string };
  Deficiencies: { userId: string };
  Done: { userId: string };
};

export type MealType = {
  name: string;
  description: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  estimatedNutrition: Record<string, number>;
  imageUrl: string | null;
  benefits: string;
};

export type TabParams = {
  Pantries: { userId: string };
  Meals: { userId: string };
  Tracking: { userId: string };
  Account: { userId: string };
};

export type RootStackParams = {
  Tabs: { userId: string };
  MealDetail: { userId: string; meal: MealType };
};
