import { CUISINES, DIET_TYPES, GENDERS, type Gender } from "@pantrific/schema";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useAutoSetup,
  useCreateNutrient,
  useDeleteNutrient,
  useDietProfile,
  useLogout,
  useTrackedNutrients,
  useUpdateNutrient,
  useUpdateProfile,
} from "../api/hooks";
import { colors } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Account">;

export default function AccountScreen({ route }: Props) {
  const { userId } = route.params;
  const { data, isLoading } = useDietProfile(userId);
  const { data: nutrientsData } = useTrackedNutrients(userId);
  const updateProfile = useUpdateProfile(userId);
  const autoSetup = useAutoSetup(userId);
  const createNutrient = useCreateNutrient(userId);
  const updateNutrient = useUpdateNutrient(userId);
  const deleteNutrient = useDeleteNutrient(userId);
  const logout = useLogout();
  const [displayName, setDisplayName] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  const [editingDetails, setEditingDetails] = useState(false);
  const [recalcNutrition, setRecalcNutrition] = useState(false);
  const [gender, setGender] = useState<Gender | undefined>();
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

  const [editingTargets, setEditingTargets] = useState<Record<string, string>>(
    {},
  );
  const [addingNutrient, setAddingNutrient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newTarget, setNewTarget] = useState("");

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

  useEffect(() => {
    if (data?.profile) {
      setGender((data.profile.gender as Gender) ?? undefined);
      setAge(data.profile.age?.toString() ?? "");
      setWeight(data.profile.weight?.toString() ?? "");
    }
  }, [data?.profile]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color={colors.yellowDark} />
      </View>
    );
  }

  const profile = data?.profile;
  const trackedNutrients = nutrientsData?.nutrients ?? [];

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

  const handleSaveDetails = async () => {
    if (gender && Number(age) > 0 && Number(weight) > 0) {
      if (recalcNutrition) {
        await autoSetup.mutateAsync({
          gender,
          age: Number(age),
          weight: Number(weight),
        });
      } else {
        await updateProfile.mutateAsync({
          gender,
          age: Number(age),
          weight: Number(weight),
        });
      }
    }
    setEditingDetails(false);
    setRecalcNutrition(false);
  };

  const handleUpdateTarget = (nutrientId: string) => {
    const val = Number(editingTargets[nutrientId]);
    if (!val || val <= 0) return;
    updateNutrient.mutate({ nutrientId, body: { dailyTarget: val } });
    setEditingTargets((prev) => {
      const next = { ...prev };
      delete next[nutrientId];
      return next;
    });
  };

  const handleDeleteNutrient = (id: string, name: string) => {
    Alert.alert("Remove Nutrient", `Stop tracking "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteNutrient.mutate(id),
      },
    ]);
  };

  const handleAddNutrient = async () => {
    if (!newName.trim() || !newUnit.trim() || !Number(newTarget)) return;
    await createNutrient.mutateAsync({
      name: newName.trim(),
      unit: newUnit.trim(),
      dailyTarget: Number(newTarget),
    });
    setNewName("");
    setNewUnit("");
    setNewTarget("");
    setAddingNutrient(false);
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
    <ScrollView
      style={tw`flex-1 bg-cream`}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={tw`px-6 pt-14 pb-4`}>
        <Text style={tw`text-3xl font-bold text-brown`}>Account</Text>
        {displayName && (
          <Text style={tw`text-base text-brown-light mt-1`}>{displayName}</Text>
        )}
      </View>

      <View style={tw`px-6`}>
        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
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
                <Text style={tw`text-brown text-sm font-medium`}>
                  {username}
                </Text>
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

        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-base font-semibold text-brown`}>
              Your Details
            </Text>
            {!editingDetails ? (
              <TouchableOpacity onPress={() => setEditingDetails(true)}>
                <Text style={tw`text-yellow-dark text-sm font-semibold`}>
                  ✎ Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSaveDetails}>
                {autoSetup.isPending ? (
                  <ActivityIndicator size="small" color={colors.yellowDark} />
                ) : (
                  <Text style={tw`text-yellow-dark text-sm font-semibold`}>
                    ✓ Save
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {editingDetails ? (
            <View>
              <Text style={tw`text-sm text-brown-light mb-2`}>Gender</Text>
              <View style={tw`flex-row gap-2 mb-4`}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={tw`flex-1 rounded-xl py-3 items-center ${
                      gender === g ? "bg-yellow" : "bg-gray-light"
                    }`}>
                    <Text style={tw`text-brown text-sm font-medium capitalize`}>
                      {g === "male" ? "♂ " : "♀ "}
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={tw`text-sm text-brown-light mb-2`}>Age</Text>
              <TextInput
                style={tw`bg-gray-light rounded-xl px-4 py-3 text-brown border border-cream-dark mb-4`}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 25"
                placeholderTextColor="#9E9E9E"
              />

              <Text style={tw`text-sm text-brown-light mb-2`}>Weight (kg)</Text>
              <TextInput
                style={tw`bg-gray-light rounded-xl px-4 py-3 text-brown border border-cream-dark`}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 70"
                placeholderTextColor="#9E9E9E"
              />

              <TouchableOpacity
                style={tw`flex-row items-center mt-4`}
                onPress={() => setRecalcNutrition((v) => !v)}>
                <View
                  style={tw`w-5 h-5 rounded border mr-2 items-center justify-center ${
                    recalcNutrition
                      ? "bg-yellow border-yellow"
                      : "border-gray bg-white"
                  }`}>
                  {recalcNutrition && (
                    <Text style={tw`text-brown text-xs font-bold`}>✓</Text>
                  )}
                </View>
                <Text style={tw`text-brown-light text-sm`}>
                  Recalculate nutrition goals
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`flex-row items-center gap-4`}>
              {profile?.gender && (
                <View style={tw`items-center`}>
                  <Text style={tw`text-xl font-bold text-brown`}>
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
              {!profile?.gender && !profile?.age && !profile?.weight && (
                <Text style={tw`text-brown-light text-sm italic`}>
                  No details set yet. Tap Edit to add them.
                </Text>
              )}
            </View>
          )}
        </View>

        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-base font-semibold text-brown`}>
              Nutrition Goals
            </Text>
            <TouchableOpacity onPress={() => setAddingNutrient((v) => !v)}>
              <Text style={tw`text-yellow-dark text-sm font-semibold`}>
                {addingNutrient ? "Cancel" : "+ Add"}
              </Text>
            </TouchableOpacity>
          </View>

          {trackedNutrients.length === 0 && !addingNutrient && (
            <Text style={tw`text-brown-light text-sm italic`}>
              No nutrients tracked yet. Tap + Add to start.
            </Text>
          )}

          {trackedNutrients.map((n) => {
            const isEditing = editingTargets[n.id] !== undefined;
            return (
              <View
                key={n.id}
                style={tw`flex-row items-center justify-between py-3 border-b border-gray-light`}>
                <View style={tw`flex-1 mr-3`}>
                  <Text style={tw`text-brown text-sm font-medium`}>
                    {n.name}
                  </Text>
                  <Text style={tw`text-brown-light text-xs`}>{n.unit}</Text>
                </View>
                {isEditing ? (
                  <View style={tw`flex-row items-center gap-2`}>
                    <TextInput
                      style={tw`bg-gray-light rounded-lg px-3 py-1 w-20 text-brown text-center`}
                      keyboardType="numeric"
                      value={editingTargets[n.id]}
                      onChangeText={(v) =>
                        setEditingTargets((prev) => ({ ...prev, [n.id]: v }))
                      }
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => handleUpdateTarget(n.id)}>
                      <Text style={tw`text-yellow-dark font-semibold text-sm`}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity
                      onPress={() =>
                        setEditingTargets((prev) => ({
                          ...prev,
                          [n.id]: String(n.dailyTarget),
                        }))
                      }>
                      <Text style={tw`text-brown font-medium text-sm`}>
                        {n.dailyTarget} {n.unit}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteNutrient(n.id, n.name)}>
                      <Text style={tw`text-red text-sm`}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {addingNutrient && (
            <View style={tw`mt-3 gap-2`}>
              <TextInput
                style={tw`bg-gray-light rounded-xl px-4 py-3 text-brown border border-cream-dark`}
                placeholder="Nutrient name (e.g. Vitamin D)"
                placeholderTextColor="#9E9E9E"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={tw`flex-row gap-2`}>
                <TextInput
                  style={tw`flex-1 bg-gray-light rounded-xl px-4 py-3 text-brown border border-cream-dark`}
                  placeholder="Unit (e.g. mg)"
                  placeholderTextColor="#9E9E9E"
                  value={newUnit}
                  onChangeText={setNewUnit}
                />
                <TextInput
                  style={tw`flex-1 bg-gray-light rounded-xl px-4 py-3 text-brown border border-cream-dark`}
                  placeholder="Daily target"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  value={newTarget}
                  onChangeText={setNewTarget}
                />
              </View>
              <TouchableOpacity
                style={tw`bg-yellow rounded-xl py-3 items-center mt-1`}
                onPress={handleAddNutrient}
                disabled={createNutrient.isPending}>
                {createNutrient.isPending ? (
                  <ActivityIndicator color="#3E2723" size="small" />
                ) : (
                  <Text style={tw`text-brown font-semibold`}>Add Nutrient</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
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

        <View
          style={tw`bg-white rounded-2xl p-4 mb-4 border border-cream-dark`}>
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
          style={tw`rounded-full py-4 items-center border border-red mt-4`}
          onPress={handleLogout}>
          <Text style={tw`text-red font-semibold text-base`}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
