import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

const EMOJIS = [
  "🍎",
  "🥑",
  "🍕",
  "🥦",
  "🍣",
  "🌮",
  "🥕",
  "🍔",
  "🥗",
  "🍩",
  "🧀",
  "🍇",
  "🌽",
  "🥐",
  "🍜",
  "🍰",
  "🫑",
  "🥞",
  "🍝",
  "🍓",
];
const EMOJI_SIZE = 36; // text-2xl (~24px) + mx-2 (8px each side) ≈ 36px per item
const MARQUEE_DURATION = 30000;

function Marquee({ reverse }: { reverse?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  // Repeat emojis enough to fill at least 2x the screen width
  const repeats =
    Math.ceil((screenWidth * 2) / (EMOJIS.length * EMOJI_SIZE)) + 1;
  const items = Array.from({ length: repeats }, () => EMOJIS).flat();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: MARQUEE_DURATION,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Start fully visible, then scroll one set of emojis worth
  const singleSetWidth = EMOJIS.length * EMOJI_SIZE;
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [-singleSetWidth, 0] : [0, -singleSetWidth],
  });

  return (
    <View style={{ overflow: "hidden", width: "100%" }}>
      <Animated.View
        style={{
          flexDirection: "row",
          transform: [{ translateX }],
          opacity: 0.35,
        }}>
        {items.map((emoji, i) => (
          <Text key={i} style={tw`text-2xl mx-2`}>
            {emoji}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type Props = NativeStackScreenProps<OnboardingStackParams, "Name">;

export default function NameScreen({ navigation }: Props) {
  const [name, setName] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1 bg-cream`}>
      <View style={tw`absolute top-12 left-0 right-0`}>
        <Marquee />
      </View>

      {process.env.NODE_ENV === "production" && (
        <View style={tw`mx-6 mt-24 bg-yellow rounded-xl px-4 py-3`}>
          <Text style={tw`text-brown text-sm text-center`}>
            Sign in with username <Text style={tw`font-bold`}>tomas-demo</Text>{" "}
            and password <Text style={tw`font-bold`}>password</Text> to test the
            app
          </Text>
        </View>
      )}

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
          onPress={() => navigation.navigate("Password", { displayName: name })}
          disabled={name.length < 3}>
          <Text style={tw`text-brown font-semibold text-lg`}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`mt-4 items-center py-2`}
          onPress={() => navigation.navigate("Login")}>
          <Text style={tw`text-brown-light text-base`}>
            Already have an account?{" "}
            <Text style={tw`text-yellow-dark font-semibold`}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={tw`absolute bottom-8 left-0 right-0`}>
        <Marquee reverse />
      </View>
    </KeyboardAvoidingView>
  );
}
