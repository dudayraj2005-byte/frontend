export interface PlantProfile {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  imageUrl: string;
  organolepticCharacters: {
    taste: string;
    odor: string;
    texture: string;
    color: string;
  };
  medicinalUses: string[];
  culinaryUses: string[];
  activeConstituents: string[];
  safetyPrecautions: string[];
  contraindications: string[];
  habitat: string;
  distribution: string;
  description: string;
}

export interface ScanResult {
  id: string;
  plantProfile: PlantProfile;
  confidence: number;
  scannedAt: string;
  imageUri: string;
  notes: string;
  isBookmarked: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
