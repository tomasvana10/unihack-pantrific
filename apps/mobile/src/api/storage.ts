import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export async function setItem(key: string, value: string) {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  const SecureStore = require("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

export async function deleteItem(key: string) {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    const SecureStore = require("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  }
}
