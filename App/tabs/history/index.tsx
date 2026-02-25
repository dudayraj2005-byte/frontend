import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import {
  Clock,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Grid3x3,
  List,
  Leaf,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePlants } from '@/contexts/PlantContext';
import { ScanResult } from '@/types/plant';

export default function HistoryScreen() {
  const router = useRouter();
  const { scanHistory, toggleBookmark, deleteScan } = usePlants();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterBookmarked, setFilterBookmarked] = useState<boolean>(false);

  const filteredHistory = useMemo(() => {
    if (filterBookmarked) {
      return scanHistory.filter((s) => s.isBookmarked);
    }
    return scanHistory;
  }, [scanHistory, filterBookmarked]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Scan', 'Are you sure you want to remove this scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteScan(id),
      },
    ]);
  }, [deleteScan]);

  const handleBookmark = useCallback((id: string) => {
    toggleBookmark(id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [toggleBookmark]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateToResult = useCallback((scanId: string) => {
    router.push({
      pathname: '/result' as any,
      params: { scanId },
    });
  }, [router]);

  const renderListItem = ({ item }: { item: ScanResult }) => {
    const confidenceColor =
      item.confidence >= 80 ? Colors.success : item.confidence >= 50 ? Colors.warning : Colors.error;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigateToResult(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.imageUri }} style={styles.listImage} contentFit="cover" />
        <View style={styles.listContent}>
          <Text style={styles.listName} numberOfLines={1}>
            {item.plantProfile.commonName}
          </Text>
          <Text style={styles.listScientific} numberOfLines={1}>
            {item.plantProfile.scientificName}
          </Text>
          <View style={styles.listMeta}>
            <View style={[styles.confidencePill, { backgroundColor: `${confidenceColor}20` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
              <Text style={[styles.confidenceLabel, { color: confidenceColor }]}>
                {item.confidence}%
              </Text>
            </View>
            <Text style={styles.listDate}>{formatDate(item.scannedAt)}</Text>
          </View>
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity onPress={() => handleBookmark(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {item.isBookmarked ? (
              <BookmarkCheck size={18} color={Colors.primary} />
            ) : (
              <Bookmark size={18} color={Colors.textLight} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItem = ({ item }: { item: ScanResult }) => {
    const confidenceColor =
      item.confidence >= 80 ? Colors.success : item.confidence >= 50 ? Colors.warning : Colors.error;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigateToResult(item.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.imageUri }} style={styles.gridImage} contentFit="cover" />
        <View style={styles.gridOverlay}>
          {item.isBookmarked && (
            <BookmarkCheck size={14} color="#fff" style={styles.gridBookmark} />
          )}
          <View style={[styles.gridConfidence, { backgroundColor: confidenceColor }]}>
            <Text style={styles.gridConfidenceText}>{item.confidence}%</Text>
          </View>
        </View>
        <View style={styles.gridContent}>
          <Text style={styles.gridName} numberOfLines={1}>
            {item.plantProfile.commonName}
          </Text>
          <Text style={styles.gridDate}>{formatDate(item.scannedAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.filterBtn, filterBookmarked && styles.filterBtnActive]}
          onPress={() => setFilterBookmarked(!filterBookmarked)}
        >
          <Bookmark size={14} color={filterBookmarked ? '#fff' : Colors.textSecondary} />
          <Text style={[styles.filterText, filterBookmarked && styles.filterTextActive]}>
            Bookmarked
          </Text>
        </TouchableOpacity>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? Colors.primary : Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid3x3 size={16} color={viewMode === 'grid' ? Colors.primary : Colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.countText}>
        {filteredHistory.length} {filteredHistory.length === 1 ? 'scan' : 'scans'}
      </Text>

      {viewMode === 'list' ? (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyHint}>
                {filterBookmarked
                  ? 'Bookmark your scans to see them here'
                  : 'Start scanning plants to build your history'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Text style={styles.emptyHint}>
                {filterBookmarked
                  ? 'Bookmark your scans to see them here'
                  : 'Start scanning plants to build your history'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewBtnActive: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    borderRadius: 8,
  },
  countText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500' as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  listImage: {
    width: 80,
    height: 90,
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  listScientific: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    color: Colors.primaryLight,
    marginBottom: 6,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  listDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  listActions: {
    paddingRight: 14,
    gap: 14,
    alignItems: 'center',
  },
  gridRow: {
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  gridImage: {
    width: '100%',
    height: 130,
  },
  gridOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridBookmark: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
    overflow: 'hidden',
  },
  gridConfidence: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gridConfidenceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  gridContent: {
    padding: 10,
  },
  gridName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  gridDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
});
