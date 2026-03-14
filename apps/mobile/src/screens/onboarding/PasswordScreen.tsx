import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRegister } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Password">;

export default function PasswordScreen({ navigation, route }: Props) {
  const { username } = route.params;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const register = useRegister();

  const valid = password.length >= 6 && password === confirm;

  const handleContinue = async () => {
    if (!valid) return;
    setError("");
    try {
      const data = await register.mutateAsync({ username, password });
      navigation.navigate("SetupChoice", { userId: data.id });
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <View style={tw`flex-1 justify-center px-8`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-6`}>
          <Text style={tw`text-brown-light text-base`}>← Back</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-brown mb-2`}>
          Hi, {username}!
        </Text>
        <Text style={tw`text-lg text-brown-light mb-10`}>
          Create a password to secure your account
        </Text>

        <Text style={tw`text-base text-brown-light mb-2`}>Password</Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark mb-4`}
          placeholder="At least 6 characters"
          placeholderTextColor="#9E9E9E"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoFocus
        />

        <Text style={tw`text-base text-brown-light mb-2`}>
          Confirm password
        </Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark`}
          placeholder="Type it again"
          placeholderTextColor="#9E9E9E"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {password.length > 0 && confirm.length > 0 && password !== confirm && (
          <Text style={tw`text-red mt-2 text-sm`}>Passwords don't match</Text>
        )}

        {error ? <Text style={tw`text-red mt-2 text-sm`}>{error}</Text> : null}

        <TouchableOpacity
          style={tw`mt-8 rounded-full py-4 items-center ${
            valid ? "bg-yellow" : "bg-cream-dark"
          }`}
          onPress={handleContinue}
          disabled={!valid || register.isPending}>
          {register.isPending ? (
            <ActivityIndicator color="#3E2723" />
          ) : (
            <Text style={tw`text-brown font-semibold text-lg`}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
