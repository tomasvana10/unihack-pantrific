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
} from "react-native";
import { useLogin } from "../../api/hooks";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();

  const valid = username.length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!valid) return;
    setError("");
    try {
      const data = await login.mutateAsync({ username, password });
      navigation.navigate("Done", { userId: data.id });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg.includes("401") ? "Invalid username or password" : msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center px-8`}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-6`}>
          <Text style={tw`text-brown-light text-base`}>← Back</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-brown mb-2`}>Welcome back</Text>
        <Text style={tw`text-lg text-brown-light mb-10`}>
          Sign in with your credentials
        </Text>

        <Text style={tw`text-base text-brown-light mb-2`}>Username</Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark mb-4`}
          placeholder="Your username"
          placeholderTextColor="#9E9E9E"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          autoFocus
        />

        <Text style={tw`text-base text-brown-light mb-2`}>Password</Text>
        <TextInput
          style={tw`bg-white rounded-2xl px-5 py-4 text-lg text-brown border border-cream-dark`}
          placeholder="Your password"
          placeholderTextColor="#9E9E9E"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={tw`text-red mt-2 text-sm`}>{error}</Text> : null}

        <TouchableOpacity
          style={tw`mt-8 mb-10 rounded-full py-4 items-center ${
            valid ? "bg-yellow" : "bg-cream-dark"
          }`}
          onPress={handleLogin}
          disabled={!valid || login.isPending}>
          {login.isPending ? (
            <ActivityIndicator color="#3E2723" />
          ) : (
            <Text style={tw`text-brown font-semibold text-lg`}>Sign In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
