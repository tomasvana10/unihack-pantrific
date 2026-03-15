import type { MealSuggestion } from "@pantrific/schema";

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

export type MealType = MealSuggestion;

export type TabParams = {
  Pantries: { userId: string };
  Meals: { userId: string };
  Tracking: { userId: string };
  Me: { userId: string };
};

export type RootStackParams = {
  Tabs: { userId: string };
  MealDetail: { userId: string; meal: MealType };
};
