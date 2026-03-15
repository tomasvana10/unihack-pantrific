import {
  DIET_TYPES,
  type DietType,
  GENDERS,
  type Gender,
} from "@pantrific/schema";
import { getErrorMessage } from "@pantrific/shared/utils";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAutoSetup, useUpdateProfile } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "QuickSetup">;

const DIET_LABELS: Record<DietType, { label: string; emoji: string }> = {
  none: { label: "No Restriction", emoji: "🍖" },
  vegetarian: { label: "Vegetarian", emoji: "🥚" },
  vegan: { label: "Vegan", emoji: "🌱" },
};

export default function QuickSetupScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [gender, setGender] = useState<Gender>();
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [dietType, setDietType] = useState<DietType>("none");
  const [error, setError] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const autoSetup = useAutoSetup(userId);
  const updateProfile = useUpdateProfile(userId);

  const valid = gender && Number(age) > 0 && Number(weight) > 0;

  const handleContinue = async () => {
    if (!valid || !gender) return;
    setError("");
    try {
      await Promise.all([
        autoSetup.mutateAsync({
          gender,
          age: Number(age),
          weight: Number(weight),
        }),
        updateProfile.mutateAsync({ dietType }),
      ]);
      setSetupDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (setupDone) {
    return (
      <View style={tw`flex-1 bg-cream justify-center px-8`}>
        <Text style={tw`text-3xl font-bold text-brown mb-2`}>
          You're all set!
        </Text>
        <Text style={tw`text-base text-brown-light mb-10`}>
          We've calculated your recommended daily targets. You can personalise
          further or jump straight in.
        </Text>

        <TouchableOpacity
          style={tw`bg-yellow rounded-2xl px-6 py-5 mb-4`}
          onPress={() => navigation.navigate("Cuisines", { userId })}>
          <Text style={tw`text-brown font-bold text-lg mb-1`}>
            Personalise Further
          </Text>
          <Text style={tw`text-brown-light text-sm`}>
            Choose preferred cuisines, nutrition goals &amp; deficiencies
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-white border border-cream-dark rounded-2xl px-6 py-5`}
          onPress={() => navigation.navigate("Done", { userId })}>
          <Text style={tw`text-brown font-bold text-lg mb-1`}>Get Started</Text>
          <Text style={tw`text-brown-light text-sm`}>
            You can always customise these later in your settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <ScrollView
        style={tw`flex-1 px-8 pt-14`}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={tw`text-3xl font-bold text-brown mb-2`}>About You</Text>
        <Text style={tw`text-base text-brown-light mb-8`}>
          We'll calculate your recommended daily intake using AI based on your
          details.
        </Text>

        <Text style={tw`text-base text-brown-light mb-3`}>Gender</Text>
        <View style={tw`flex-row gap-3 mb-6`}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              style={tw`flex-1 rounded-2xl py-4 items-center ${
                gender === g ? "bg-yellow" : "bg-white border border-cream-dark"
              }`}>
              <Text style={tw`text-2xl mb-1`}>{g === "male" ? "♂" : "♀"}</Text>
              <Text style={tw`text-brown font-medium capitalize`}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={tw`text-base text-brown-light mb-2`}>Age</Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark mb-6`}
          placeholder="e.g. 25"
          placeholderTextColor="#9E9E9E"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={tw`text-base text-brown-light mb-2`}>Weight (kg)</Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark mb-6`}
          placeholder="e.g. 70"
          placeholderTextColor="#9E9E9E"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={tw`text-base text-brown-light mb-3`}>
          Dietary Requirements
        </Text>
        <View style={tw`flex-row gap-2 mb-6`}>
          {DIET_TYPES.map((value) => {
            const { label, emoji } = DIET_LABELS[value];
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setDietType(value)}
                style={tw`flex-1 rounded-2xl py-3 items-center ${
                  dietType === value
                    ? "bg-yellow"
                    : "bg-white border border-cream-dark"
                }`}>
                <Text style={tw`text-lg mb-0.5`}>{emoji}</Text>
                <Text style={tw`text-brown text-xs font-medium`}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={tw`text-red mb-4 text-sm`}>{error}</Text> : null}

        <TouchableOpacity
          style={tw`rounded-full py-4 items-center mb-10 ${
            valid ? "bg-yellow" : "bg-cream-dark"
          }`}
          onPress={handleContinue}
          disabled={!valid || autoSetup.isPending}>
          {autoSetup.isPending ? (
            <View style={tw`flex-row items-center justify-center gap-2`}>
              <ActivityIndicator color="#3E2723" size="small" />
              <Text style={tw`text-brown-light text-sm`}>
                Calculating your targets...
              </Text>
            </View>
          ) : (
            <Text style={tw`text-brown font-semibold text-lg`}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
