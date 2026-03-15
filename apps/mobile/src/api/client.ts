import { readFromEnv } from "@pantrific/shared/utils";
import { deleteItem, getItem, setItem } from "./storage";

const API_URL = readFromEnv("EXPO_PUBLIC_API_URL");
const ACCESS_KEY = readFromEnv("EXPO_PUBLIC_ACCESS_KEY");

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ACCESS_KEY}`,
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
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
  displayName: string;
  username: string;
  token: string;
  password?: string;
}) {
  await setItem("auth_token", data.token);
  await setItem("user_id", data.id);
  await setItem("display_name", data.displayName);
  await setItem("username", data.username);
  if (data.password) {
    await setItem("password", data.password);
  }
}

export async function getAuth() {
  const [token, userId, displayName] = await Promise.all([
    getItem("auth_token"),
    getItem("user_id"),
    getItem("display_name"),
  ]);
  if (!token || !userId) return null;
  return { token, userId, displayName };
}

export async function clearAuth() {
  await Promise.all([
    deleteItem("auth_token"),
    deleteItem("user_id"),
    deleteItem("display_name"),
    deleteItem("username"),
    deleteItem("password"),
  ]);
}
