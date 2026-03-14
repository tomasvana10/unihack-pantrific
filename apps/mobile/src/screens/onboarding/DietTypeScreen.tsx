import { DIET_TYPES, type DietType } from "@pantrific/schema";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useUpdateProfile } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "DietType">;

const DIET_LABELS: Record<
  DietType,
  { label: string; desc: string; emoji: string }
> = {
  none: { label: "No Restriction", desc: "I eat everything", emoji: "🍖" },
  vegetarian: { label: "Vegetarian", desc: "No meat or fish", emoji: "🥚" },
  vegan: { label: "Vegan", desc: "No animal products", emoji: "🌱" },
};

export default function DietTypeScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [selected, setSelected] = useState<DietType>("none");
  const updateProfile = useUpdateProfile(userId);

  const handleContinue = async () => {
    await updateProfile.mutateAsync({ dietType: selected });
    navigation.navigate("Cuisines", { userId });
  };

  return (
    <View style={tw`flex-1 bg-cream px-8 pt-14`}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
        <Text style={tw`text-brown-light text-base`}>← Back</Text>
      </TouchableOpacity>

      <Text style={tw`text-3xl font-bold text-brown mb-2`}>Dietary Needs</Text>
      <Text style={tw`text-base text-brown-light mb-8`}>
        Do you have any dietary restrictions?
      </Text>

      {DIET_TYPES.map((value) => {
        const { label, desc, emoji } = DIET_LABELS[value];
        return (
          <TouchableOpacity
            key={value}
            onPress={() => setSelected(value)}
            style={tw`flex-row items-center rounded-2xl px-5 py-4 mb-3 ${
              selected === value
                ? "bg-yellow"
                : "bg-white border border-cream-dark"
            }`}>
            <Text style={tw`text-2xl mr-4`}>{emoji}</Text>
            <View style={tw`flex-1`}>
              <Text style={tw`text-brown font-semibold text-base`}>
                {label}
              </Text>
              <Text style={tw`text-brown-light text-sm`}>{desc}</Text>
            </View>
            {selected === value && (
              <Text style={tw`text-brown text-lg`}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={tw`mt-8 rounded-full py-4 items-center bg-yellow`}
        onPress={handleContinue}
        disabled={updateProfile.isPending}>
        <Text style={tw`text-brown font-semibold text-lg`}>
          {updateProfile.isPending ? "Saving..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
