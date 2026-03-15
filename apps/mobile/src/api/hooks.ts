import { toDateString } from "@pantrific/shared/utils";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { MealType } from "../types/navigation";
import { api, clearAuth, getAuth, saveAuth } from "./client";

type DailyData = {
  date: string;
  nutrients: {
    id: string;
    name: string;
    unit: string;
    dailyTarget: number;
    consumed: number;
    remaining: number;
  }[];
};

type NutrientsData = {
  nutrients: {
    id: string;
    name: string;
    unit: string;
    dailyTarget: number;
  }[];
};

type PantriesData = {
  pantries: { id: string; name: string; userId: string }[];
};

type DietData = {
  profile: {
    id: string;
    calorieTarget: number | null;
    proteinTarget: number | null;
    dietType: string | null;
    cuisinePreferences: string[];
    gender: string | null;
    age: number | null;
    weight: number | null;
  } | null;
  deficiencies: {
    id: string;
    nutrient: string;
    severity: string | null;
  }[];
};

function invalidateNutrientQueries(qc: QueryClient, userId: string) {
  qc.invalidateQueries({ queryKey: ["nutrients", userId] });
  qc.invalidateQueries({ queryKey: ["daily", userId] });
}

// ── Auth ──

export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: getAuth,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

type AuthResponse = {
  id: string;
  displayName: string;
  username: string;
  token: string;
};

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { displayName: string; password: string }) => {
      const data = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await saveAuth({ ...data, password: body.password });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { username: string; password: string }) => {
      const data = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await saveAuth({ ...data, password: body.password });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearAuth,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

// ── Pantries ──

export function usePantries(userId: string) {
  return useQuery({
    queryKey: ["pantries", userId],
    queryFn: () => api<PantriesData>(`/pantries/${userId}`),
  });
}

export function usePantryItems(userId: string, pantryId: string) {
  return useQuery({
    queryKey: ["pantryItems", pantryId],
    queryFn: () =>
      api<{
        items: {
          id: string;
          name: string;
          quantity: number | null;
          confidence: number | null;
          detectedAt: string;
        }[];
      }>(`/pantries/${userId}/${pantryId}/items`),
    enabled: !!pantryId,
  });
}

export function useCreatePantry(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<{ id: string; name: string; userId: string }>(`/pantries/${userId}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onMutate: async (name) => {
      const key = ["pantries", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PantriesData>(key);
      if (previous) {
        qc.setQueryData<PantriesData>(key, {
          pantries: [
            ...previous.pantries,
            { id: `temp-${Date.now()}`, name, userId },
          ],
        });
      }
      return { previous, key };
    },
    onError: (_err, _name, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantries", userId] }),
  });
}

export function useDeletePantry(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pantryId: string) =>
      api(`/pantries/${userId}/${pantryId}`, { method: "DELETE" }),
    onMutate: async (pantryId) => {
      const key = ["pantries", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<PantriesData>(key);
      if (previous) {
        qc.setQueryData<PantriesData>(key, {
          pantries: previous.pantries.filter((p) => p.id !== pantryId),
        });
      }
      return { previous, key };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["pantries", userId] }),
  });
}

// ── Diet Profile ──

export function useUpdateDeficiencies(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deficiencies: { nutrient: string; severity?: string }[]) =>
      api(`/diets/${userId}/deficiencies`, {
        method: "PUT",
        body: JSON.stringify(deficiencies),
      }),
    onMutate: async (deficiencies) => {
      const key = ["diet", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DietData>(key);
      if (previous) {
        qc.setQueryData<DietData>(key, {
          ...previous,
          deficiencies: deficiencies.map((d) => ({
            id: `temp-${d.nutrient}`,
            nutrient: d.nutrient,
            severity: d.severity ?? null,
          })),
        });
      }
      return { previous, key };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["diet", userId] }),
  });
}

export function useDietProfile(userId: string) {
  return useQuery({
    queryKey: ["diet", userId],
    queryFn: () => api<DietData>(`/diets/${userId}`),
  });
}

export function useUpdateProfile(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      calorieTarget?: number;
      proteinTarget?: number;
      dietType?: string;
      cuisinePreferences?: string[];
      gender?: string;
      age?: number;
      weight?: number;
    }) =>
      api(`/diets/${userId}/profile`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      const key = ["diet", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DietData>(key);
      if (previous?.profile) {
        qc.setQueryData<DietData>(key, {
          ...previous,
          profile: { ...previous.profile, ...body } as DietData["profile"],
        });
      }
      return { previous, key };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["diet", userId] }),
  });
}

export function useAutoSetup(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { gender: string; age: number; weight: number }) =>
      api<{
        calorieTarget: number;
        proteinTarget: number;
        nutrients: { name: string; unit: string; dailyTarget: number }[];
      }>(`/diets/${userId}/auto-setup`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diet", userId] });
      qc.invalidateQueries({ queryKey: ["nutrients", userId] });
    },
  });
}

// ── Nutrient Tracking ──

export function useTrackedNutrients(userId: string) {
  return useQuery({
    queryKey: ["nutrients", userId],
    queryFn: () => api<NutrientsData>(`/tracking/${userId}/nutrients`),
  });
}

export function useCreateNutrient(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; unit: string; dailyTarget: number }) =>
      api<{ id: string; name: string; unit: string; dailyTarget: number }>(
        `/tracking/${userId}/nutrients`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    onMutate: async (body) => {
      const key = ["nutrients", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<NutrientsData>(key);
      if (previous) {
        qc.setQueryData<NutrientsData>(key, {
          nutrients: [
            ...previous.nutrients,
            { id: `temp-${Date.now()}`, ...body },
          ],
        });
      }
      return { previous, key };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => invalidateNutrientQueries(qc, userId),
  });
}

export function useUpdateNutrient(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      nutrientId: string;
      body: { name?: string; unit?: string; dailyTarget?: number };
    }) =>
      api(`/tracking/${userId}/nutrients/${args.nutrientId}`, {
        method: "PUT",
        body: JSON.stringify(args.body),
      }),
    onMutate: async (args) => {
      const key = ["nutrients", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<NutrientsData>(key);
      if (previous) {
        qc.setQueryData<NutrientsData>(key, {
          nutrients: previous.nutrients.map((n) =>
            n.id === args.nutrientId ? { ...n, ...args.body } : n,
          ),
        });
      }
      return { previous, key };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => invalidateNutrientQueries(qc, userId),
  });
}

export function useDeleteNutrient(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nutrientId: string) =>
      api(`/tracking/${userId}/nutrients/${nutrientId}`, {
        method: "DELETE",
      }),
    onMutate: async (nutrientId) => {
      const key = ["nutrients", userId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<NutrientsData>(key);
      if (previous) {
        qc.setQueryData<NutrientsData>(key, {
          nutrients: previous.nutrients.filter((n) => n.id !== nutrientId),
        });
      }
      return { previous, key };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => invalidateNutrientQueries(qc, userId),
  });
}

// ── Daily Tracking & Logging ──

export function useDailyTracking(userId: string, date?: string) {
  const d = date ?? toDateString();
  return useQuery({
    queryKey: ["daily", userId, d],
    queryFn: () => api<DailyData>(`/tracking/${userId}/daily?date=${d}`),
  });
}

export function useLogIntake(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { trackedNutrientId: string; amount: number }) =>
      api(`/tracking/${userId}/logs`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      const today = toDateString();
      const key = ["daily", userId, today];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DailyData>(key);
      if (previous) {
        qc.setQueryData<DailyData>(key, {
          ...previous,
          nutrients: previous.nutrients.map((n) =>
            n.id === body.trackedNutrientId
              ? {
                  ...n,
                  consumed: n.consumed + body.amount,
                  remaining: n.remaining - body.amount,
                }
              : n,
          ),
        });
      }
      return { previous, key };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["daily", userId] });
      qc.invalidateQueries({ queryKey: ["history", userId] });
    },
  });
}

export function useTrackingHistory(userId: string, days = 7) {
  return useQuery({
    queryKey: ["history", userId, days],
    queryFn: () =>
      api<{
        history: {
          date: string;
          nutrients: {
            id: string;
            name: string;
            unit: string;
            dailyTarget: number;
            consumed: number;
          }[];
        }[];
      }>(`/tracking/${userId}/history?days=${days}`),
  });
}

export function useLogMealNutrition(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      entries: { trackedNutrientId: string; amount: number }[],
    ) => {
      for (const entry of entries) {
        await api(`/tracking/${userId}/logs`, {
          method: "POST",
          body: JSON.stringify(entry),
        });
      }
    },
    onMutate: async (entries) => {
      const today = toDateString();
      const key = ["daily", userId, today];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DailyData>(key);
      if (previous) {
        const amountMap = new Map(
          entries.map((e) => [e.trackedNutrientId, e.amount]),
        );
        qc.setQueryData<DailyData>(key, {
          ...previous,
          nutrients: previous.nutrients.map((n) => {
            const add = amountMap.get(n.id);
            return add
              ? {
                  ...n,
                  consumed: n.consumed + add,
                  remaining: n.remaining - add,
                }
              : n;
          }),
        });
      }
      return { previous, key };
    },
    onError: (_err, _entries, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["daily", userId] });
      qc.invalidateQueries({ queryKey: ["history", userId] });
    },
  });
}

// ── Meal Suggestions ──

export function useMealSuggestions(
  userId: string,
  preferences?: { focusNutrient?: string; mood?: string },
) {
  const params = new URLSearchParams();
  if (preferences?.focusNutrient)
    params.set("focusNutrient", preferences.focusNutrient);
  if (preferences?.mood) params.set("mood", preferences.mood);
  const qs = params.toString();
  return useQuery({
    queryKey: [
      "suggestions",
      userId,
      preferences?.focusNutrient,
      preferences?.mood,
    ],
    queryFn: () =>
      api<{ meals: MealType[] }>(`/suggestions/${userId}${qs ? `?${qs}` : ""}`),
    enabled: false,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
