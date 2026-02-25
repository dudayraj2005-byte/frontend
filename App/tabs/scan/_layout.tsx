import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ScanLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' as const },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Plant Scanner', headerShown: false }}
      />
      <Stack.Screen
        name="result"
        options={{ title: 'Scan Result' }}
      />
    </Stack>
  );
}