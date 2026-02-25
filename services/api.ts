import { Platform } from 'react-native';

const API_BASE_URL = 'https://medicinal-plant-scanner.onrender.com';

export interface PredictionResponse {
  plant: string;
  confidence: number;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export async function predictPlant(imageUri: string): Promise<PredictionResponse> {
  console.log('[API] Predicting plant from image:', imageUri);
  console.log('[API] Platform:', Platform.OS);

  const formData = new FormData();

  const filename = imageUri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  if (Platform.OS === 'web') {
    const blob = await uriToBlob(imageUri);
    formData.append('file', blob, filename);
    console.log('[API] Web: appended blob to formData, size:', blob.size);
  } else {
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);
    console.log('[API] Native: appended file object to formData');
  }

  console.log('[API] Sending POST to', `${API_BASE_URL}/predict`);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[API] Prediction error:', response.status, errorText);
    throw new Error(`Prediction failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('[API] Prediction result:', data);

  return {
    plant: data.plant ?? data.predicted_class ?? data.class_name ?? 'Unknown',
    confidence: data.confidence ?? data.confidence_score ?? 0,
  };
}
