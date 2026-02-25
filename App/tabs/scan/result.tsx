import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Shield,
  Stethoscope,
  FlaskConical,
  MapPin,
  Pencil,
  Leaf,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePlants } from '@/contexts/PlantContext';

interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

function ExpandableSection({ title, icon, children, defaultOpen = false, accentColor = Colors.primary }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <View style={[sectionStyles.container, { borderLeftColor: accentColor }]}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.headerLeft}>
          {icon}
          <Text style={sectionStyles.title}>{title}</Text>
        </View>
        {isOpen ? (
          <ChevronUp size={18} color={Colors.textLight} />
        ) : (
          <ChevronDown size={18} color={Colors.textLight} />
        )}
      </TouchableOpacity>
      {isOpen && <View style={sectionStyles.content}>{children}</View>}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default function ScanResultScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const { scanHistory, toggleBookmark, updateNotes } = usePlants();
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [notesText, setNotesText] = useState<string>('');

  const scan = useMemo(
    () => scanHistory.find((s) => s.id === scanId),
    [scanHistory, scanId]
  );

  if (!scan) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Scan result not found</Text>
      </View>
    );
  }

  const { plantProfile, confidence } = scan;

  const handleBookmark = () => {
    toggleBookmark(scan.id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSaveNotes = () => {
    updateNotes(scan.id, notesText);
    setEditingNotes(false);
  };

  const confidenceColor =
    confidence >= 80 ? Colors.success : confidence >= 50 ? Colors.warning : Colors.error;

  return (
    <>
      <Stack.Screen
        options={{
          title: plantProfile.commonName,
          headerRight: () => (
            <TouchableOpacity onPress={handleBookmark} style={{ padding: 4 }}>
              {scan.isBookmarked ? (
                <BookmarkCheck size={22} color={Colors.primary} />
              ) : (
                <Bookmark size={22} color={Colors.textLight} />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: scan.imageUri }}
            style={styles.plantImage}
            contentFit="cover"
          />
          <View style={styles.confidenceBadge}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={styles.confidenceText}>{confidence}% match</Text>
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.commonName}>{plantProfile.commonName}</Text>
          <Text style={styles.scientificName}>{plantProfile.scientificName}</Text>
          <View style={styles.familyBadge}>
            <Leaf size={13} color={Colors.primary} />
            <Text style={styles.familyText}>{plantProfile.family}</Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{plantProfile.description}</Text>
        </View>

        <ExpandableSection
          title="Organoleptic Characters"
          icon={<FlaskConical size={18} color={Colors.accent} />}
          defaultOpen
          accentColor={Colors.accent}
        >
          <View style={styles.orgGrid}>
            {Object.entries(plantProfile.organolepticCharacters).map(([key, value]) => (
              <View key={key} style={styles.orgItem}>
                <Text style={styles.orgLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <Text style={styles.orgValue}>{value}</Text>
              </View>
            ))}
          </View>
        </ExpandableSection>

        <ExpandableSection
          title="Medicinal Uses"
          icon={<Stethoscope size={18} color={Colors.primary} />}
          defaultOpen
          accentColor={Colors.primary}
        >
          {plantProfile.medicinalUses.map((use, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
              <Text style={styles.bulletText}>{use}</Text>
            </View>
          ))}
        </ExpandableSection>

        {plantProfile.culinaryUses.length > 0 && (
          <ExpandableSection
            title="Culinary Uses"
            icon={<UtensilsCrossed size={18} color={Colors.accentDark} />}
            accentColor={Colors.accentDark}
          >
            {plantProfile.culinaryUses.map((use, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: Colors.accentDark }]} />
                <Text style={styles.bulletText}>{use}</Text>
              </View>
            ))}
          </ExpandableSection>
        )}

        <ExpandableSection
          title="Active Constituents"
          icon={<FlaskConical size={18} color="#6C63FF" />}
          accentColor="#6C63FF"
        >
          <View style={styles.tagContainer}>
            {plantProfile.activeConstituents.map((c, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{c}</Text>
              </View>
            ))}
          </View>
        </ExpandableSection>

        <ExpandableSection
          title="Safety & Precautions"
          icon={<Shield size={18} color={Colors.warning} />}
          accentColor={Colors.warning}
        >
          {plantProfile.safetyPrecautions.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <AlertTriangle size={14} color={Colors.warning} />
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </ExpandableSection>

        <ExpandableSection
          title="Contraindications"
          icon={<AlertTriangle size={18} color={Colors.error} />}
          accentColor={Colors.error}
        >
          {plantProfile.contraindications.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: Colors.error }]} />
              <Text style={styles.bulletText}>{c}</Text>
            </View>
          ))}
        </ExpandableSection>

        <ExpandableSection
          title="Habitat & Distribution"
          icon={<MapPin size={18} color={Colors.primaryLight} />}
          accentColor={Colors.primaryLight}
        >
          <Text style={styles.infoLabel}>Habitat</Text>
          <Text style={styles.infoValue}>{plantProfile.habitat}</Text>
          <Text style={[styles.infoLabel, { marginTop: 12 }]}>Distribution</Text>
          <Text style={styles.infoValue}>{plantProfile.distribution}</Text>
        </ExpandableSection>

        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <Pencil size={16} color={Colors.textSecondary} />
            <Text style={styles.notesTitle}>Personal Notes</Text>
            {!editingNotes && (
              <TouchableOpacity
                onPress={() => {
                  setNotesText(scan.notes);
                  setEditingNotes(true);
                }}
              >
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingNotes ? (
            <View>
              <TextInput
                style={styles.notesInput}
                multiline
                value={notesText}
                onChangeText={setNotesText}
                placeholder="Add your notes about this plant..."
                placeholderTextColor={Colors.textLight}
                testID="notes-input"
              />
              <View style={styles.notesActions}>
                <TouchableOpacity onPress={() => setEditingNotes(false)}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.notesContent}>
              {scan.notes || 'No notes yet. Tap Edit to add your observations.'}
            </Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  imageContainer: {
    position: 'relative',
    height: 280,
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  nameSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  commonName: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic' as const,
    color: Colors.primaryLight,
    marginBottom: 10,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  familyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  descriptionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  orgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  orgItem: {
    width: '47%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
  },
  orgLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orgValue: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500' as const,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  notesSection: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  editBtn: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  notesInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  notesContent: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLight,
  },
});
