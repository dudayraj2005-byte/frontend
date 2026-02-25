import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, ImagePlus, Leaf, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PlantProfile, ScanResult } from '@/types/plant';
import { usePlants } from '@/contexts/PlantContext';
import { predictPlant } from '@/services/api';
import { plantLibrary } from '@/mocks/plants';

function findPlantInLibrary(plantName: string): PlantProfile | null {
  const normalized = plantName.toLowerCase().trim();
  const match = plantLibrary.find((p) => {
    const common = p.commonName.toLowerCase();
    const scientific = p.scientificName.toLowerCase();
    return (
      common.includes(normalized) ||
      normalized.includes(common.split('(')[0].trim().toLowerCase()) ||
      scientific.includes(normalized) ||
      normalized.includes(scientific.split(' ')[0].toLowerCase())
    );
  });
  return match ?? null;
}

function createBasicProfile(plantName: string, imageUri: string): PlantProfile {
  return {
    id: `scan_${Date.now()}`,
    commonName: plantName,
    scientificName: 'Not available',
    family: 'Not available',
    imageUrl: imageUri,
    organolepticCharacters: {
      taste: 'Not available',
      odor: 'Not available',
      texture: 'Not available',
      color: 'Not available',
    },
    medicinalUses: ['Detailed information not available for this plant'],
    culinaryUses: [],
    activeConstituents: [],
    safetyPrecautions: ['Consult a qualified herbalist before use'],
    contraindications: ['Consult a healthcare professional'],
    habitat: 'Not available',
    distribution: 'Not available',
    description: `This plant was identified as "${plantName}" by the ML model. Detailed profile data is not yet available in the local database.`,
  };
}

export default function ScanScreen() {
  const router = useRouter();
  const { addScan } = usePlants();
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const startScanAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanLineAnim]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera access is required to scan plants.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        await identifyPlant(asset.uri, asset.base64 ?? '');
      }
    } catch (err) {
      console.log('Image picker error:', err);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  }, []);

  const identifyPlant = async (imageUri: string, _base64: string) => {
    setIsScanning(true);
    startScanAnimation();

    try {
      console.log('[Scan] Starting plant identification via backend...');

      const prediction = await predictPlant(imageUri);
      const plantName = prediction.plant;
      const confidence = Math.round(prediction.confidence);
      console.log('[Scan] Backend prediction:', plantName, confidence);

      const libraryMatch = findPlantInLibrary(plantName);
      console.log('[Scan] Library match:', libraryMatch?.commonName ?? 'none');

      const plantProfile: PlantProfile = libraryMatch
        ? { ...libraryMatch, id: `scan_${Date.now()}`, imageUrl: imageUri }
        : createBasicProfile(plantName, imageUri);

      const scanResult: ScanResult = {
        id: `scan_${Date.now()}`,
        plantProfile,
        confidence,
        scannedAt: new Date().toISOString(),
        imageUri,
        notes: '',
        isBookmarked: false,
      };

      addScan(scanResult);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.push({
        pathname: '/result' as any,
        params: { scanId: scanResult.id },
      });
    } catch (err) {
      console.log('[Scan] Plant identification error:', err);
      Alert.alert('Identification Failed', 'Could not identify the plant. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
      setSelectedImage(null);
    }
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <LinearGradient
      colors={['#0A1F14', '#1B4332', '#2D6A4F']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Leaf size={24} color={Colors.success} />
          <Text style={styles.headerTitle}>HerbaScan</Text>
        </View>

        <View style={styles.content}>
          {isScanning && selectedImage ? (
            <View style={styles.scanningContainer}>
              <View style={styles.scanFrame}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.scanImage}
                  contentFit="cover"
                />
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslate }] },
                  ]}
                />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
              <View style={styles.scanningInfo}>
                <ActivityIndicator size="small" color={Colors.success} />
                <Text style={styles.scanningText}>Identifying plant...</Text>
              </View>
              <Text style={styles.scanningHint}>
                Connecting to ML model for identification
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.illustrationArea}>
                <Animated.View
                  style={[
                    styles.scanCircleOuter,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <View style={styles.scanCircleInner}>
                    <Leaf size={56} color={Colors.success} strokeWidth={1.5} />
                  </View>
                </Animated.View>
                <Text style={styles.heroTitle}>Identify Any Plant</Text>
                <Text style={styles.heroSubtitle}>
                  Take a photo or choose from gallery to discover medicinal properties
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => pickImage(true)}
                  activeOpacity={0.85}
                  testID="scan-camera-btn"
                >
                  <LinearGradient
                    colors={['#52B788', '#40916C']}
                    style={styles.primaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Camera size={24} color="#fff" />
                    <Text style={styles.primaryButtonText}>Scan with Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.85}
                  testID="scan-gallery-btn"
                >
                  <ImagePlus size={20} color={Colors.success} />
                  <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <Zap size={14} color={Colors.accentLight} />
                  <Text style={styles.featureText}>ML-powered instant identification</Text>
                </View>
                <View style={styles.featureRow}>
                  <Zap size={14} color={Colors.accentLight} />
                  <Text style={styles.featureText}>Detailed medicinal profiles</Text>
                </View>
                <View style={styles.featureRow}>
                  <Zap size={14} color={Colors.accentLight} />
                  <Text style={styles.featureText}>Safety & contraindication alerts</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scanCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(82, 183, 136, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  scanCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(82, 183, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(82, 183, 136, 0.3)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  actions: {
    gap: 14,
    marginBottom: 32,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(82, 183, 136, 0.4)',
    gap: 10,
    backgroundColor: 'rgba(82, 183, 136, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  features: {
    gap: 10,
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  scanningContainer: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.success,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.success,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.success,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.success,
    borderBottomRightRadius: 8,
  },
  scanningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  scanningText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  scanningHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 260,
    lineHeight: 18,
  },
});
