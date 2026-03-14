import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MealType } from "../types/navigation";
import { api, clearAuth, getAuth, saveAuth } from "./client";

export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: getAuth,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { username: string; password: string }) => {
      const data = await api<{ id: string; username: string; token: string }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(body) },
      );
      await saveAuth(data);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { username: string; password: string }) => {
      const data = await api<{ id: string; username: string; token: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(body) },
      );
      await saveAuth(data);
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

export function usePantries(userId: string) {
  return useQuery({
    queryKey: ["pantries", userId],
    queryFn: () =>
      api<{ pantries: { id: string; name: string; userId: string }[] }>(
        `/pantries/${userId}`,
      ),
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
      api(`/pantries/${userId}`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantries", userId] }),
  });
}

export function useDeletePantry(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pantryId: string) =>
      api(`/pantries/${userId}/${pantryId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantries", userId] }),
  });
}

export function useUpdateDeficiencies(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deficiencies: { nutrient: string; severity?: string }[]) =>
      api(`/diets/${userId}/deficiencies`, {
        method: "PUT",
        body: JSON.stringify(deficiencies),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diet", userId] }),
  });
}

export function useTrackedNutrients(userId: string) {
  return useQuery({
    queryKey: ["nutrients", userId],
    queryFn: () =>
      api<{
        nutrients: {
          id: string;
          name: string;
          unit: string;
          dailyTarget: number;
        }[];
      }>(`/tracking/${userId}/nutrients`),
  });
}

export function useCreateNutrient(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; unit: string; dailyTarget: number }) =>
      api(`/tracking/${userId}/nutrients`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrients", userId] }),
  });
}

export function useDailyTracking(userId: string, date?: string) {
  const d = date ?? new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily", userId, d],
    queryFn: () =>
      api<{
        date: string;
        nutrients: {
          id: string;
          name: string;
          unit: string;
          dailyTarget: number;
          consumed: number;
          remaining: number;
        }[];
      }>(`/tracking/${userId}/daily?date=${d}`),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily", userId] }),
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

export function useMealSuggestions(userId: string) {
  return useQuery({
    queryKey: ["suggestions", userId],
    queryFn: () => api<{ meals: MealType[] }>(`/suggestions/${userId}`),
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });
}
