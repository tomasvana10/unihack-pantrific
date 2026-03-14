import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  useDailyTracking,
  useLogIntake,
  useTrackedNutrients,
  useTrackingHistory,
} from "../api/hooks";
import { colors } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Tracking">;

const screenWidth = Dimensions.get("window").width - 48;

export default function TrackingScreen({ route }: Props) {
  const { userId } = route.params;
  const today = new Date().toISOString().split("T")[0];
  const { data: daily, isLoading } = useDailyTracking(userId, today);
  const { data: nutrients } = useTrackedNutrients(userId);
  const { data: history } = useTrackingHistory(userId, 7);
  const logIntake = useLogIntake(userId);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);

  const handleLog = async (nutrientId: string) => {
    const val = Number(amounts[nutrientId]);
    if (!val || val <= 0) {
      Alert.alert("Invalid", "Enter a positive number");
      return;
    }
    await logIntake.mutateAsync({ trackedNutrientId: nutrientId, amount: val });
    setAmounts((prev) => ({ ...prev, [nutrientId]: "" }));
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color={colors.yellowDark} />
      </View>
    );
  }

  const chartNutrient = selectedNutrient
    ? nutrients?.nutrients?.find((n) => n.id === selectedNutrient)
    : nutrients?.nutrients?.[0];

  const chartData =
    history?.history && chartNutrient
      ? {
          labels: history.history.map((h) => h.date.slice(5)),
          datasets: [
            {
              data: history.history.map(
                (h) =>
                  h.nutrients.find((n) => n.id === chartNutrient.id)
                    ?.consumed ?? 0,
              ),
              color: () => colors.yellowDark,
              strokeWidth: 2,
            },
            {
              data: history.history.map(() => chartNutrient.dailyTarget),
              color: () => colors.pink,
              strokeWidth: 1,
            },
          ],
        }
      : null;

  return (
    <ScrollView
      style={tw`flex-1 bg-cream`}
      contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={tw`px-6 pt-14 pb-2`}>
        <Text style={tw`text-3xl font-bold text-brown`}>Daily Tracking</Text>
        <Text style={tw`text-base text-brown-light mt-1`}>{today}</Text>
      </View>

      <View style={tw`px-6 mt-4`}>
        {!daily?.nutrients?.length ? (
          <View style={tw`items-center mt-10`}>
            <Text style={tw`text-5xl mb-4`}>📊</Text>
            <Text style={tw`text-brown-light text-center`}>
              No nutrients being tracked yet.{"\n"}Set them up in your profile!
            </Text>
          </View>
        ) : (
          daily.nutrients.map((n) => {
            const pct = Math.min((n.consumed / n.dailyTarget) * 100, 100);
            return (
              <View
                key={n.id}
                style={tw`bg-white rounded-2xl p-4 mb-3 border border-cream-dark`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-brown font-semibold text-base`}>
                    {n.name}
                  </Text>
                  <Text style={tw`text-brown-light text-sm`}>
                    {n.consumed.toFixed(1)} / {n.dailyTarget} {n.unit}
                  </Text>
                </View>

                <View
                  style={tw`h-3 bg-gray-light rounded-full overflow-hidden mb-3`}>
                  <View
                    style={[
                      tw`h-full rounded-full ${pct >= 100 ? "bg-green" : "bg-yellow"}`,
                      { width: `${pct}%` },
                    ]}
                  />
                </View>

                <View style={tw`flex-row gap-2`}>
                  <TextInput
                    style={tw`flex-1 bg-cream rounded-xl px-3 py-2 text-brown text-center`}
                    placeholder={`Add ${n.unit}`}
                    placeholderTextColor="#9E9E9E"
                    keyboardType="numeric"
                    value={amounts[n.id] ?? ""}
                    onChangeText={(v) =>
                      setAmounts((prev) => ({ ...prev, [n.id]: v }))
                    }
                  />
                  <TouchableOpacity
                    style={tw`bg-yellow rounded-xl px-4 justify-center`}
                    onPress={() => handleLog(n.id)}
                    disabled={logIntake.isPending}>
                    <Text style={tw`text-brown font-semibold`}>Log</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {history?.history && chartData && chartNutrient && (
        <View style={tw`px-6 mt-6`}>
          <Text style={tw`text-xl font-bold text-brown mb-3`}>
            7-Day Progress
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`mb-4`}>
            {nutrients?.nutrients?.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => setSelectedNutrient(n.id)}
                style={tw`rounded-full px-4 py-2 mr-2 ${
                  (selectedNutrient ?? nutrients.nutrients[0]?.id) === n.id
                    ? "bg-yellow"
                    : "bg-white border border-cream-dark"
                }`}>
                <Text style={tw`text-brown text-sm`}>{n.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={tw`bg-white rounded-2xl p-3 border border-cream-dark`}>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets,
                legend: ["Consumed", "Target"],
              }}
              width={screenWidth - 24}
              height={200}
              chartConfig={{
                backgroundColor: colors.white,
                backgroundGradientFrom: colors.white,
                backgroundGradientTo: colors.white,
                decimalPlaces: 0,
                color: () => colors.brown,
                labelColor: () => colors.brownLight,
                propsForDots: { r: "4", fill: colors.yellowDark },
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
