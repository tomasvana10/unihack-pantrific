import { COMMON_NUTRIENTS } from "@pantrific/schema";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCreateNutrient } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Goals">;

type NutrientEntry = {
  name: string;
  unit: string;
  dailyTarget: string;
  enabled: boolean;
};

export default function GoalsScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const createNutrient = useCreateNutrient(userId);

  const [nutrients, setNutrients] = useState<NutrientEntry[]>(
    COMMON_NUTRIENTS.map((n) => ({
      name: n.name,
      unit: n.unit,
      dailyTarget: String(n.defaultTarget),
      enabled: false,
    })),
  );
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (idx: number) => {
    setNutrients((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, enabled: !n.enabled } : n)),
    );
  };

  const updateTarget = (idx: number, val: string) => {
    setNutrients((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, dailyTarget: val } : n)),
    );
  };

  const addCustom = () => {
    if (!customName || !customUnit || !customTarget) return;
    setNutrients((prev) => [
      ...prev,
      {
        name: customName,
        unit: customUnit,
        dailyTarget: customTarget,
        enabled: true,
      },
    ]);
    setCustomName("");
    setCustomUnit("");
    setCustomTarget("");
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      const enabled = nutrients.filter(
        (n) => n.enabled && Number(n.dailyTarget) > 0,
      );
      await Promise.all(
        enabled.map((n) =>
          createNutrient.mutateAsync({
            name: n.name,
            unit: n.unit,
            dailyTarget: Number(n.dailyTarget),
          }),
        ),
      );
      navigation.navigate("Deficiencies", { userId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <ScrollView style={tw`flex-1 px-6 pt-14`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
          <Text style={tw`text-brown-light text-base`}>← Back</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-brown mb-2`}>
          Nutrition Goals
        </Text>
        <Text style={tw`text-base text-brown-light mb-6`}>
          Select the nutrients you'd like to track and set your daily targets
        </Text>

        {nutrients.map((n, idx) => (
          <TouchableOpacity
            key={n.name}
            onPress={() => toggle(idx)}
            style={tw`flex-row items-center justify-between rounded-2xl px-4 py-3 mb-2 ${
              n.enabled ? "bg-yellow" : "bg-white border border-cream-dark"
            }`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-brown font-medium text-base`}>{n.name}</Text>
            </View>
            {n.enabled && (
              <View style={tw`flex-row items-center gap-2`}>
                <TextInput
                  style={tw`bg-white rounded-xl px-3 py-1 w-20 text-center text-brown`}
                  keyboardType="numeric"
                  value={n.dailyTarget}
                  onChangeText={(v) => updateTarget(idx, v)}
                  onPressIn={(e) => e.stopPropagation()}
                />
                <Text style={tw`text-brown-light text-sm`}>{n.unit}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={tw`mt-6 mb-2`}>
          <Text style={tw`text-base font-semibold text-brown mb-3`}>
            Add custom nutrient
          </Text>
          <View style={tw`flex-row gap-2 mb-2`}>
            <TextInput
              style={tw`flex-1 bg-white rounded-xl px-3 py-3 text-brown border border-cream-dark`}
              placeholder="Name"
              placeholderTextColor="#9E9E9E"
              value={customName}
              onChangeText={setCustomName}
            />
            <TextInput
              style={tw`w-16 bg-white rounded-xl px-3 py-3 text-brown border border-cream-dark`}
              placeholder="Unit"
              placeholderTextColor="#9E9E9E"
              value={customUnit}
              onChangeText={setCustomUnit}
            />
            <TextInput
              style={tw`w-20 bg-white rounded-xl px-3 py-3 text-center text-brown border border-cream-dark`}
              placeholder="Target"
              placeholderTextColor="#9E9E9E"
              keyboardType="numeric"
              value={customTarget}
              onChangeText={setCustomTarget}
            />
          </View>
          <TouchableOpacity
            style={tw`bg-white border border-yellow rounded-full py-2 items-center`}
            onPress={addCustom}>
            <Text style={tw`text-brown font-medium`}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`mt-6 mb-20 flex-row gap-3`}>
          <TouchableOpacity
            style={tw`flex-1 rounded-full py-4 items-center border border-cream-dark`}
            onPress={() => navigation.navigate("Deficiencies", { userId })}>
            <Text style={tw`text-brown-light font-medium text-base`}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 rounded-full py-4 items-center bg-yellow`}
            onPress={handleContinue}
            disabled={saving}>
            <Text style={tw`text-brown font-semibold text-base`}>
              {saving ? "Saving..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
