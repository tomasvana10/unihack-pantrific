import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Name">;

export default function NameScreen({ navigation }: Props) {
  const [name, setName] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <View style={tw`flex-1 justify-center px-8`}>
        <Text style={tw`text-4xl font-bold text-brown mb-2`}>
          Welcome to{"\n"}Pantrific
        </Text>
        <Text style={tw`text-lg text-brown-light mb-10`}>
          Let's get you set up
        </Text>

        <Text style={tw`text-base text-brown-light mb-2`}>
          What should we call you?
        </Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark`}
          placeholder="Your name"
          placeholderTextColor="#9E9E9E"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TouchableOpacity
          style={tw`mt-8 rounded-full py-4 items-center ${
            name.length >= 3 ? "bg-yellow" : "bg-cream-dark"
          }`}
          onPress={() => navigation.navigate("Password", { username: name })}
          disabled={name.length < 3}>
          <Text style={tw`text-brown font-semibold text-lg`}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
