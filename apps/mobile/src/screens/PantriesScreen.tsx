import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePantries, usePantryItems } from "../api/hooks";
import { colors } from "../theme";
import tw from "../tw";
import type { TabParams } from "../types/navigation";

type Props = BottomTabScreenProps<TabParams, "Pantries">;
type ViewMode = "pantries" | "unified";

type PantryItem = {
  id: string;
  name: string;
  quantity: number | null;
  confidence: number | null;
  detectedAt: string;
};

export default function PantriesScreen({ route }: Props) {
  const { userId } = route.params;
  const { data, isLoading } = usePantries(userId);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("pantries");

  const pantries = data?.pantries ?? [];

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

      {pantries.length > 0 && (
        <View style={tw`px-6 pb-2`}>
          <View
            style={tw`flex-row items-center bg-white rounded-2xl border border-cream-dark mt-3 px-4 py-3`}>
            <TextInput
              style={tw`flex-1 text-brown`}
              placeholder="Search items..."
              placeholderTextColor="#9E9E9E"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={tw`text-gray text-sm ml-2`}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={tw`flex-row bg-gray-light rounded-xl mt-3 p-1`}>
            <TouchableOpacity
              style={tw`flex-1 rounded-lg py-2 items-center ${viewMode === "pantries" ? "bg-white" : ""}`}
              onPress={() => setViewMode("pantries")}>
              <Text
                style={tw`text-sm font-medium ${viewMode === "pantries" ? "text-brown" : "text-gray"}`}>
                By Pantry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 rounded-lg py-2 items-center ${viewMode === "unified" ? "bg-white" : ""}`}
              onPress={() => setViewMode("unified")}>
              <Text
                style={tw`text-sm font-medium ${viewMode === "unified" ? "text-brown" : "text-gray"}`}>
                All Items
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={tw`flex-1 px-6`}
        contentContainerStyle={{
          paddingBottom: 40,
          flexGrow: pantries.length === 0 ? 1 : undefined,
        }}>
        {pantries.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center px-4`}>
            <Text style={tw`text-6xl mb-4`}>🖌️</Text>
            <Text style={tw`text-brown font-semibold text-lg mb-2 text-center`}>
              No pantries yet
            </Text>
            <Text style={tw`text-brown-light text-base text-center`}>
              Pantries are created automatically when you connect an inference
              device. Run the inference process and enter your credentials to
              get started.
            </Text>
          </View>
        ) : viewMode === "unified" ? (
          <UnifiedView userId={userId} pantries={pantries} search={search} />
        ) : (
          pantries.map((p) => (
            <PantryCard
              key={p.id}
              pantry={p}
              userId={userId}
              isExpanded={expanded.has(p.id)}
              onToggle={() => toggleExpand(p.id)}
              search={search}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ItemRow({ item }: { item: PantryItem }) {
  return (
    <View
      style={tw`flex-row items-center justify-between py-2 border-b border-gray-light`}>
      <Text style={tw`text-brown text-base flex-1`}>{item.name}</Text>
      <View style={tw`flex-row items-center gap-3`}>
        {item.quantity != null && (
          <View style={tw`bg-cream rounded-full px-2 py-0.5`}>
            <Text style={tw`text-brown text-sm font-medium`}>
              x{item.quantity}
            </Text>
          </View>
        )}
        {item.confidence != null && (
          <Text style={tw`text-brown-light text-xs`}>
            {Math.round(item.confidence * 100)}% conf.
          </Text>
        )}
      </View>
    </View>
  );
}

function PantryCard({
  pantry,
  userId,
  isExpanded,
  onToggle,
  search,
}: {
  pantry: { id: string; name: string };
  userId: string;
  isExpanded: boolean;
  onToggle: () => void;
  search: string;
}) {
  const { data, isLoading } = usePantryItems(userId, pantry.id);

  const query = search.toLowerCase().trim();
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!query) return data.items;
    return data.items.filter((i) => i.name.toLowerCase().includes(query));
  }, [data?.items, query]);

  // Hide entire pantry card if searching and no matches
  if (query && !isLoading && filteredItems.length === 0) return null;

  // Auto-expand when searching
  const showItems = isExpanded || !!query;

  return (
    <View
      style={tw`bg-white rounded-2xl mb-3 overflow-hidden border border-cream-dark`}>
      <TouchableOpacity
        style={tw`flex-row items-center justify-between px-4 py-4`}
        onPress={onToggle}>
        <View style={tw`flex-row items-center gap-3`}>
          <Text style={tw`text-2xl`}>📦</Text>
          <View>
            <Text style={tw`text-brown font-semibold text-lg`}>
              {pantry.name}
            </Text>
            {data?.items && (
              <Text style={tw`text-brown-light text-xs`}>
                {query
                  ? `${filteredItems.length} of ${data.items.length} items`
                  : `${data.items.length} items`}
              </Text>
            )}
          </View>
        </View>
        <Text style={tw`text-brown-light text-lg`}>
          {showItems ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {showItems && (
        <View style={tw`px-4 pb-4 border-t border-cream-dark pt-3`}>
          {isLoading ? (
            <ActivityIndicator color={colors.yellowDark} />
          ) : filteredItems.length === 0 ? (
            <Text style={tw`text-brown-light text-sm italic`}>
              No items detected yet
            </Text>
          ) : (
            filteredItems.map((item) => <ItemRow key={item.id} item={item} />)
          )}
        </View>
      )}
    </View>
  );
}

function UnifiedView({
  userId,
  pantries,
  search,
}: {
  userId: string;
  pantries: { id: string; name: string }[];
  search: string;
}) {
  return (
    <>
      {pantries.map((p) => (
        <UnifiedPantryItems
          key={p.id}
          userId={userId}
          pantry={p}
          search={search}
        />
      ))}
    </>
  );
}

function UnifiedPantryItems({
  userId,
  pantry,
  search,
}: {
  userId: string;
  pantry: { id: string; name: string };
  search: string;
}) {
  const { data, isLoading } = usePantryItems(userId, pantry.id);

  const query = search.toLowerCase().trim();
  const items = useMemo(() => {
    if (!data?.items) return [];
    if (!query) return data.items;
    return data.items.filter((i) => i.name.toLowerCase().includes(query));
  }, [data?.items, query]);

  if (isLoading) return <ActivityIndicator color={colors.yellowDark} />;
  if (items.length === 0) return null;

  return (
    <View style={tw`mb-2`}>
      <Text style={tw`text-brown-light text-xs font-semibold uppercase mb-1`}>
        {pantry.name}
      </Text>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </View>
  );
}
