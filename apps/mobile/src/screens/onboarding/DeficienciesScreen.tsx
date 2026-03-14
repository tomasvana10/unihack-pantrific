import { COMMON_DEFICIENCIES } from "@pantrific/schema";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUpdateDeficiencies } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Deficiencies">;

const SEVERITY_OPTIONS = ["low", "moderate", "high"] as const;

type Entry = { nutrient: string; severity: (typeof SEVERITY_OPTIONS)[number] };

export default function DeficienciesScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const updateDeficiencies = useUpdateDeficiencies(userId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [custom, setCustom] = useState("");

  const toggleNutrient = (nutrient: string) => {
    setEntries((prev) => {
      const exists = prev.find((e) => e.nutrient === nutrient);
      if (exists) return prev.filter((e) => e.nutrient !== nutrient);
      return [...prev, { nutrient, severity: "moderate" }];
    });
  };

  const setSeverity = (
    nutrient: string,
    severity: (typeof SEVERITY_OPTIONS)[number],
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.nutrient === nutrient ? { ...e, severity } : e)),
    );
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    if (!entries.find((e) => e.nutrient === custom)) {
      setEntries((prev) => [
        ...prev,
        { nutrient: custom.trim(), severity: "moderate" },
      ]);
    }
    setCustom("");
  };

  const handleFinish = async () => {
    if (entries.length > 0) {
      await updateDeficiencies.mutateAsync(entries);
    }
    navigation.navigate("Done", { userId });
  };

  const isSelected = (n: string) => entries.some((e) => e.nutrient === n);

  return (
    <ScrollView style={tw`flex-1 bg-cream px-6 pt-14`}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
        <Text style={tw`text-brown-light text-base`}>← Back</Text>
      </TouchableOpacity>

      <Text style={tw`text-3xl font-bold text-brown mb-2`}>
        Any Deficiencies?
      </Text>
      <Text style={tw`text-base text-brown-light mb-6`}>
        Select any known nutrient deficiencies so we can tailor meal suggestions
      </Text>

      <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
        {COMMON_DEFICIENCIES.map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => toggleNutrient(n)}
            style={tw`rounded-full px-4 py-2 ${
              isSelected(n) ? "bg-yellow" : "bg-white border border-cream-dark"
            }`}>
            <Text style={tw`text-brown`}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {entries.length > 0 && (
        <View style={tw`mb-4`}>
          <Text style={tw`text-base font-semibold text-brown mb-3`}>
            Set severity
          </Text>
          {entries.map((entry) => (
            <View
              key={entry.nutrient}
              style={tw`bg-white rounded-2xl px-4 py-3 mb-2 border border-cream-dark`}>
              <Text style={tw`text-brown font-medium mb-2`}>
                {entry.nutrient}
              </Text>
              <View style={tw`flex-row gap-2`}>
                {SEVERITY_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSeverity(entry.nutrient, s)}
                    style={tw`flex-1 rounded-full py-2 items-center ${
                      entry.severity === s
                        ? s === "high"
                          ? "bg-red"
                          : s === "moderate"
                            ? "bg-yellow"
                            : "bg-green"
                        : "bg-gray-light"
                    }`}>
                    <Text
                      style={tw`text-sm font-medium ${
                        entry.severity === s ? "text-white" : "text-brown-light"
                      }`}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={tw`flex-row gap-2 mb-6`}>
        <TextInput
          style={tw`flex-1 bg-white rounded-xl px-4 py-3 text-brown border border-cream-dark`}
          placeholder="Add custom deficiency"
          placeholderTextColor="#9E9E9E"
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
        />
        <TouchableOpacity
          style={tw`bg-white border border-yellow rounded-xl px-4 justify-center`}
          onPress={addCustom}>
          <Text style={tw`text-brown font-medium`}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row gap-3 mb-10`}>
        <TouchableOpacity
          style={tw`flex-1 rounded-full py-4 items-center border border-cream-dark`}
          onPress={handleFinish}>
          <Text style={tw`text-brown-light font-medium text-base`}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 rounded-full py-4 items-center bg-yellow`}
          onPress={handleFinish}
          disabled={updateDeficiencies.isPending}>
          <Text style={tw`text-brown font-semibold text-base`}>
            {updateDeficiencies.isPending ? "Saving..." : "Finish"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
