import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../../theme";
import tw from "../../tw";
import type { OnboardingStackParams } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParams, "Done"> & {
  onComplete: (userId: string) => void;
};

export default function DoneScreen({ route, onComplete }: Props) {
  useEffect(() => {
    onComplete(route.params.userId);
  }, [route.params.userId, onComplete]);

  return (
    <View style={tw`flex-1 bg-cream items-center justify-center`}>
      <ActivityIndicator size="large" color={colors.yellowDark} />
    </View>
  );
}
