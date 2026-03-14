import { CUISINES } from "@pantrific/schema";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useUpdateProfile } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Cuisines">;

const CUISINE_EMOJIS: Record<string, string> = {
  Italian: "🍝",
  Japanese: "🍣",
  Mexican: "🌮",
  Indian: "🍛",
  Chinese: "🥡",
  Thai: "🍜",
  Mediterranean: "🫒",
  Korean: "🥘",
  Vietnamese: "🍲",
  "Middle Eastern": "🧆",
  French: "🥐",
  Greek: "🥙",
  American: "🍔",
  Ethiopian: "🫓",
  Turkish: "🥩",
  Brazilian: "🥩",
};

export default function CuisinesScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [selected, setSelected] = useState<string[]>([]);
  const updateProfile = useUpdateProfile(userId);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const handleContinue = async () => {
    if (selected.length > 0) {
      await updateProfile.mutateAsync({ cuisinePreferences: selected });
    }
    navigation.navigate("Goals", { userId });
  };

  return (
    <ScrollView style={tw`flex-1 bg-cream px-6 pt-14`}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
        <Text style={tw`text-brown-light text-base`}>← Back</Text>
      </TouchableOpacity>

      <Text style={tw`text-3xl font-bold text-brown mb-2`}>
        Favourite Cuisines
      </Text>
      <Text style={tw`text-base text-brown-light mb-6`}>
        Pick the cuisines you enjoy — we'll lean towards these in meal
        suggestions
      </Text>

      <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
        {CUISINES.map((name) => (
          <TouchableOpacity
            key={name}
            onPress={() => toggle(name)}
            style={tw`rounded-2xl px-4 py-3 ${
              selected.includes(name)
                ? "bg-yellow"
                : "bg-white border border-cream-dark"
            }`}>
            <Text style={tw`text-center text-xl mb-1`}>
              {CUISINE_EMOJIS[name] ?? "🍴"}
            </Text>
            <Text style={tw`text-brown font-medium text-sm`}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={tw`flex-row gap-3 mb-10`}>
        <TouchableOpacity
          style={tw`flex-1 rounded-full py-4 items-center border border-cream-dark`}
          onPress={() => navigation.navigate("Goals", { userId })}>
          <Text style={tw`text-brown-light font-medium text-base`}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 rounded-full py-4 items-center bg-yellow`}
          onPress={handleContinue}
          disabled={updateProfile.isPending}>
          <Text style={tw`text-brown font-semibold text-base`}>
            {updateProfile.isPending ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
