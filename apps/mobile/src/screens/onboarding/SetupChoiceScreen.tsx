import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "SetupChoice">;

export default function SetupChoiceScreen({ navigation, route }: Props) {
  const { userId } = route.params;

  return (
    <View style={tw`flex-1 bg-cream justify-center px-8`}>
      <Text style={tw`text-3xl font-bold text-brown mb-2`}>
        How would you like{"\n"}to get started?
      </Text>
      <Text style={tw`text-base text-brown-light mb-10`}>
        Choose how to set up your nutrition profile
      </Text>

      <TouchableOpacity
        style={tw`bg-yellow rounded-2xl px-6 py-5 mb-4`}
        onPress={() => navigation.navigate("QuickSetup", { userId })}>
        <Text style={tw`text-brown font-bold text-lg mb-1`}>Quick Start</Text>
        <Text style={tw`text-brown-light text-sm`}>
          Enter your age, gender & weight and we'll set up recommended nutrition
          targets automatically
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={tw`bg-white border border-cream-dark rounded-2xl px-6 py-5`}
        onPress={() => navigation.navigate("DietType", { userId })}>
        <Text style={tw`text-brown font-bold text-lg mb-1`}>
          Full Personalisation
        </Text>
        <Text style={tw`text-brown-light text-sm`}>
          Choose your diet, preferred cuisines, nutrition goals & deficiencies
          manually
        </Text>
      </TouchableOpacity>
    </View>
  );
}
