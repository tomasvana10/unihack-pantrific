import { CUISINES, DIET_TYPES } from "@pantrific/schema";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDietProfile, useLogout, useUpdateProfile } from "../api/hooks";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Account">;

export default function AccountScreen({ route }: Props) {
  const { userId } = route.params;
  const { data, isLoading } = useDietProfile(userId);
  const updateProfile = useUpdateProfile(userId);
  const logout = useLogout();
  const [displayName, setDisplayName] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("display_name").then((v) =>
      setDisplayName(v ?? undefined),
    );
    SecureStore.getItemAsync("username").then((v) =>
      setUsername(v ?? undefined),
    );
    SecureStore.getItemAsync("password").then((v) =>
      setPassword(v ?? undefined),
    );
  }, []);

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color="#F9A825" />
      </View>
    );
  }

  const profile = data?.profile;

  const handleDietType = (dietType: string) => {
    updateProfile.mutate({ dietType });
  };

  const toggleCuisine = (cuisine: string) => {
    const current = profile?.cuisinePreferences ?? [];
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    updateProfile.mutate({ cuisinePreferences: updated });
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => logout.mutate(),
      },
    ]);
  };

  return (
    <ScrollView style={tw`flex-1 bg-cream px-6 pt-14`}>
      <Text style={tw`text-3xl font-bold text-brown mb-1`}>Account</Text>
      {displayName && (
        <Text style={tw`text-base text-brown-light mb-6`}>{displayName}</Text>
      )}

      <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
        <Text style={tw`text-base font-semibold text-brown mb-2`}>
          Device Authentication
        </Text>
        <Text style={tw`text-sm text-brown-light mb-3`}>
          Use these credentials to connect your inference device.
        </Text>
        <View style={tw`bg-gray-light rounded-xl p-3 gap-2`}>
          {username && (
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-brown-light text-sm`}>Username</Text>
              <Text style={tw`text-brown text-sm font-medium`}>{username}</Text>
            </View>
          )}
          {password && (
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-brown-light text-sm`}>Password</Text>
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-brown text-sm font-medium`}>
                  {showPassword ? password : "••••••••"}
                </Text>
                <Text style={tw`text-brown-light text-xs`}>
                  {showPassword ? "Hide" : "Reveal"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {(profile?.gender || profile?.age || profile?.weight) && (
        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
          <Text style={tw`text-base font-semibold text-brown mb-3`}>
            Your Details
          </Text>
          <View style={tw`flex-row gap-4`}>
            {profile?.gender && (
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl`}>
                  {profile.gender === "male" ? "♂" : "♀"}
                </Text>
                <Text style={tw`text-brown-light text-sm capitalize`}>
                  {profile.gender}
                </Text>
              </View>
            )}
            {profile?.age && (
              <View style={tw`items-center`}>
                <Text style={tw`text-xl font-bold text-brown`}>
                  {profile.age}
                </Text>
                <Text style={tw`text-brown-light text-sm`}>years</Text>
              </View>
            )}
            {profile?.weight && (
              <View style={tw`items-center`}>
                <Text style={tw`text-xl font-bold text-brown`}>
                  {profile.weight}
                </Text>
                <Text style={tw`text-brown-light text-sm`}>kg</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
        <Text style={tw`text-base font-semibold text-brown mb-3`}>
          Diet Type
        </Text>
        <View style={tw`flex-row gap-2`}>
          {DIET_TYPES.map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => handleDietType(value)}
              style={tw`flex-1 rounded-xl py-3 items-center ${
                (profile?.dietType ?? "none") === value
                  ? "bg-yellow"
                  : "bg-gray-light"
              }`}>
              <Text style={tw`text-brown text-sm font-medium capitalize`}>
                {value === "none" ? "None" : value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
        <Text style={tw`text-base font-semibold text-brown mb-3`}>
          Preferred Cuisines
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {CUISINES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => toggleCuisine(c)}
              style={tw`rounded-full px-3 py-2 ${
                profile?.cuisinePreferences?.includes(c)
                  ? "bg-yellow"
                  : "bg-gray-light"
              }`}>
              <Text style={tw`text-brown text-sm`}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {(profile?.calorieTarget || profile?.proteinTarget) && (
        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
          <Text style={tw`text-base font-semibold text-brown mb-3`}>
            Daily Targets
          </Text>
          {profile?.calorieTarget && (
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-brown-light`}>Calories</Text>
              <Text style={tw`text-brown font-medium`}>
                {profile.calorieTarget} kcal
              </Text>
            </View>
          )}
          {profile?.proteinTarget && (
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-brown-light`}>Protein</Text>
              <Text style={tw`text-brown font-medium`}>
                {profile.proteinTarget}g
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={tw`rounded-full py-4 items-center border border-red mb-10 mt-4`}
        onPress={handleLogout}>
        <Text style={tw`text-red font-semibold text-base`}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
