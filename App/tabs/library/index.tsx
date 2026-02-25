import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Search, Leaf, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { plantLibrary } from '@/mocks/plants';
import { PlantProfile } from '@/types/plant';

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');

  const filteredPlants = useMemo(() => {
    if (!search.trim()) return plantLibrary;
    const q = search.toLowerCase();
    return plantLibrary.filter(
      (p) =>
        p.commonName.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q)
    );
  }, [search]);

  const renderPlant = ({ item }: { item: PlantProfile }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/library/[plantId]' as any, params: { plantId: item.id } })}
      activeOpacity={0.7}
      testID={`plant-${item.id}`}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.commonName}</Text>
        <Text style={styles.cardScientific} numberOfLines={1}>{item.scientificName}</Text>
        <View style={styles.cardMeta}>
          <Leaf size={12} color={Colors.primaryLight} />
          <Text style={styles.cardFamily}>{item.family}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textLight} style={styles.cardArrow} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plants by name, family..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
          testID="library-search"
        />
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filteredPlants.length} medicinal plants</Text>
      </View>

      <FlatList
        data={filteredPlants}
        keyExtractor={(item) => item.id}
        renderItem={renderPlant}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Leaf size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No plants found</Text>
            <Text style={styles.emptyHint}>Try a different search term</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  countRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  cardImage: {
    width: 90,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  cardScientific: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    color: Colors.primaryLight,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardFamily: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
  },
  cardArrow: {
    marginRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textLight,
  },
});
