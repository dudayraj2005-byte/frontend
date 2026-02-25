import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' as const },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Plant Library' }} />
      <Stack.Screen name="[plantId]" options={{ title: 'Plant Details' }} />
    </Stack>
  );
}
