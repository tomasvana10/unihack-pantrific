import { readFromEnv } from "@pantrific/shared/utils";
import * as SecureStore from "expo-secure-store";

const API_URL = readFromEnv("EXPO_PUBLIC_API_URL");
const ACCESS_KEY = readFromEnv("EXPO_PUBLIC_ACCESS_KEY");

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function saveAuth(data: {
  id: string;
  username: string;
  token: string;
}) {
  await SecureStore.setItemAsync("auth_token", data.token);
  await SecureStore.setItemAsync("user_id", data.id);
  await SecureStore.setItemAsync("username", data.username);
}

export async function getAuth() {
  const [token, userId, username] = await Promise.all([
    SecureStore.getItemAsync("auth_token"),
    SecureStore.getItemAsync("user_id"),
    SecureStore.getItemAsync("username"),
  ]);
  if (!token || !userId) return null;
  return { token, userId, username };
}

export async function clearAuth() {
  await Promise.all([
    SecureStore.deleteItemAsync("auth_token"),
    SecureStore.deleteItemAsync("user_id"),
    SecureStore.deleteItemAsync("username"),
  ]);
}
