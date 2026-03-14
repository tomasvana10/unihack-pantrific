import { GENDERS, type Gender } from "@pantrific/schema";
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
import { useAutoSetup } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "QuickSetup">;

export default function QuickSetupScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [gender, setGender] = useState<Gender>();
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const autoSetup = useAutoSetup(userId);

  const valid = gender && Number(age) > 0 && Number(weight) > 0;

  const handleContinue = async () => {
    if (!valid || !gender) return;
    setError("");
    try {
      await autoSetup.mutateAsync({
        gender,
        age: Number(age),
        weight: Number(weight),
      });
      navigation.navigate("Done", { userId });
    } catch (e: any) {
      setError(e.message || "Setup failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <ScrollView style={tw`flex-1 px-8 pt-14`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
          <Text style={tw`text-brown-light text-base`}>← Back</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-brown mb-2`}>Quick Start</Text>
        <Text style={tw`text-base text-brown-light mb-8`}>
          We'll calculate your recommended daily intake using AI based on your
          details
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

        {error ? <Text style={tw`text-red mb-4 text-sm`}>{error}</Text> : null}

        <TouchableOpacity
          style={tw`rounded-full py-4 items-center mb-10 ${
            valid ? "bg-yellow" : "bg-cream-dark"
          }`}
          onPress={handleContinue}
          disabled={!valid || autoSetup.isPending}>
          {autoSetup.isPending ? (
            <View style={tw`items-center`}>
              <ActivityIndicator color="#3E2723" />
              <Text style={tw`text-brown-light text-sm mt-2`}>
                Calculating your targets...
              </Text>
            </View>
          ) : (
            <Text style={tw`text-brown font-semibold text-lg`}>
              Set Up My Profile
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
