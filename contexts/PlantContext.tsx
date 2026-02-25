import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { ScanResult } from '@/types/plant';
import { useAuth } from '@/contexts/AuthContext';

const HISTORY_KEY_PREFIX = '@herbalscanner_history_';

export const [PlantProvider, usePlants] = createContextHook(() => {
  const { user } = useAuth();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const queryClient = useQueryClient();
  const storageKey = `${HISTORY_KEY_PREFIX}${user?.id ?? 'guest'}`;

  const historyQuery = useQuery({
    queryKey: ['scanHistory', user?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as ScanResult[]) : [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (historyQuery.data) {
      setScanHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (history: ScanResult[]) => {
      await AsyncStorage.setItem(storageKey, JSON.stringify(history));
      return history;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanHistory', user?.id] });
    },
  });

  const addScan = useCallback((scan: ScanResult) => {
    const updated = [scan, ...scanHistory];
    setScanHistory(updated);
    saveMutation.mutate(updated);
  }, [scanHistory, saveMutation]);

  const toggleBookmark = useCallback((scanId: string) => {
    const updated = scanHistory.map((s) =>
      s.id === scanId ? { ...s, isBookmarked: !s.isBookmarked } : s
    );
    setScanHistory(updated);
    saveMutation.mutate(updated);
  }, [scanHistory, saveMutation]);

  const updateNotes = useCallback((scanId: string, notes: string) => {
    const updated = scanHistory.map((s) =>
      s.id === scanId ? { ...s, notes } : s
    );
    setScanHistory(updated);
    saveMutation.mutate(updated);
  }, [scanHistory, saveMutation]);

  const deleteScan = useCallback((scanId: string) => {
    const updated = scanHistory.filter((s) => s.id !== scanId);
    setScanHistory(updated);
    saveMutation.mutate(updated);
  }, [scanHistory, saveMutation]);

  const bookmarkedScans = useMemo(
    () => scanHistory.filter((s) => s.isBookmarked),
    [scanHistory]
  );

  return {
    scanHistory,
    bookmarkedScans,
    addScan,
    toggleBookmark,
    updateNotes,
    deleteScan,
    isLoading: historyQuery.isLoading,
  };
});
