import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useCreatePantry,
  useDeletePantry,
  usePantries,
  usePantryItems,
} from "../api/hooks";
import { colors } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Pantries">;

export default function PantriesScreen({ route }: Props) {
  const { userId } = route.params;
  const { data, isLoading } = usePantries(userId);
  const createPantry = useCreatePantry(userId);
  const deletePantry = useDeletePantry(userId);
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createPantry.mutateAsync(newName.trim());
    setNewName("");
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Pantry", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePantry.mutate(id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-cream items-center justify-center`}>
        <ActivityIndicator size="large" color={colors.yellowDark} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-cream`}>
      <View style={tw`px-6 pt-14 pb-4`}>
        <Text style={tw`text-3xl font-bold text-brown`}>My Pantries</Text>
        <Text style={tw`text-base text-brown-light mt-1`}>
          Items detected by your Pantrific camera
        </Text>
      </View>

      <FlatList
        data={data?.pantries ?? []}
        keyExtractor={(item) => item.id}
        style={tw`px-6`}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={tw`items-center mt-10`}>
            <Text style={tw`text-6xl mb-4`}>🍽️</Text>
            <Text style={tw`text-brown-light text-base text-center`}>
              No pantries yet.{"\n"}Add one below or connect your Pi camera!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PantryCard
            pantry={item}
            userId={userId}
            isExpanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
      />

      <View
        style={tw`absolute bottom-0 left-0 right-0 bg-cream border-t border-cream-dark px-6 py-4`}>
        <View style={tw`flex-row gap-2`}>
          <TextInput
            style={tw`flex-1 bg-white rounded-2xl px-4 py-3 text-brown border border-cream-dark`}
            placeholder="New pantry name..."
            placeholderTextColor="#9E9E9E"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={tw`bg-yellow rounded-2xl px-6 justify-center`}
            onPress={handleAdd}>
            <Text style={tw`text-brown font-semibold`}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PantryCard({
  pantry,
  userId,
  isExpanded,
  onToggle,
  onDelete,
}: {
  pantry: { id: string; name: string };
  userId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { data, isLoading } = usePantryItems(
    userId,
    isExpanded ? pantry.id : "",
  );

  return (
    <View
      style={tw`bg-white rounded-2xl mb-3 overflow-hidden border border-cream-dark`}>
      <TouchableOpacity
        style={tw`flex-row items-center justify-between px-4 py-4`}
        onPress={onToggle}
        onLongPress={onDelete}>
        <View style={tw`flex-row items-center gap-3`}>
          <Text style={tw`text-2xl`}>📦</Text>
          <Text style={tw`text-brown font-semibold text-lg`}>
            {pantry.name}
          </Text>
        </View>
        <Text style={tw`text-brown-light text-lg`}>
          {isExpanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={tw`px-4 pb-4 border-t border-cream-dark pt-3`}>
          {isLoading ? (
            <ActivityIndicator color={colors.yellowDark} />
          ) : !data?.items?.length ? (
            <Text style={tw`text-brown-light text-sm italic`}>
              No items detected yet
            </Text>
          ) : (
            data.items.map((item) => (
              <View
                key={item.id}
                style={tw`flex-row items-center justify-between py-2 border-b border-gray-light`}>
                <Text style={tw`text-brown text-base`}>{item.name}</Text>
                {item.confidence != null && (
                  <Text style={tw`text-brown-light text-sm`}>
                    {Math.round(item.confidence * 100)}%
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}
