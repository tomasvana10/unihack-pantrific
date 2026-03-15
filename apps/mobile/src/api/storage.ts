import { Platform } from "react-native";

let SecureStore: typeof import("expo-secure-store") | null = null;
if (Platform.OS !== "web") {
  SecureStore = require("expo-secure-store");
}

export async function setItem(key: string, value: string) {
  if (SecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return localStorage.getItem(key);
}

export async function deleteItem(key: string) {
  if (SecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    localStorage.removeItem(key);
  }
}
