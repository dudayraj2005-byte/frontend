import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Stethoscope,
  FlaskConical,
  MapPin,
  Leaf,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { plantLibrary } from '@/mocks/plants';

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
    <View style={[secStyles.container, { borderLeftColor: accentColor }]}>
      <TouchableOpacity
        style={secStyles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={secStyles.headerLeft}>
          {icon}
          <Text style={secStyles.title}>{title}</Text>
        </View>
        {isOpen ? (
          <ChevronUp size={18} color={Colors.textLight} />
        ) : (
          <ChevronDown size={18} color={Colors.textLight} />
        )}
      </TouchableOpacity>
      {isOpen && <View style={secStyles.content}>{children}</View>}
    </View>
  );
}

const secStyles = StyleSheet.create({
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

export default function PlantDetailScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();

  const plant = useMemo(
    () => plantLibrary.find((p) => p.id === plantId),
    [plantId]
  );

  if (!plant) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Plant not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: plant.commonName }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: plant.imageUrl }} style={styles.image} contentFit="cover" />

        <View style={styles.nameSection}>
          <Text style={styles.commonName}>{plant.commonName}</Text>
          <Text style={styles.scientificName}>{plant.scientificName}</Text>
          <View style={styles.familyBadge}>
            <Leaf size={13} color={Colors.primary} />
            <Text style={styles.familyText}>{plant.family}</Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{plant.description}</Text>
        </View>

        <View style={styles.sections}>
          <ExpandableSection
            title="Organoleptic Characters"
            icon={<FlaskConical size={18} color={Colors.accent} />}
            defaultOpen
            accentColor={Colors.accent}
          >
            <View style={styles.orgGrid}>
              {Object.entries(plant.organolepticCharacters).map(([key, value]) => (
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
            {plant.medicinalUses.map((use, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
                <Text style={styles.bulletText}>{use}</Text>
              </View>
            ))}
          </ExpandableSection>

          {plant.culinaryUses.length > 0 && (
            <ExpandableSection
              title="Culinary Uses"
              icon={<UtensilsCrossed size={18} color={Colors.accentDark} />}
              accentColor={Colors.accentDark}
            >
              {plant.culinaryUses.map((use, i) => (
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
              {plant.activeConstituents.map((c, i) => (
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
            {plant.safetyPrecautions.map((p, i) => (
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
            {plant.contraindications.map((c, i) => (
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
            <Text style={styles.infoValue}>{plant.habitat}</Text>
            <Text style={[styles.infoLabel, { marginTop: 12 }]}>Distribution</Text>
            <Text style={styles.infoValue}>{plant.distribution}</Text>
          </ExpandableSection>
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
  image: {
    width: '100%',
    height: 260,
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
  sections: {
    paddingHorizontal: 16,
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
});
