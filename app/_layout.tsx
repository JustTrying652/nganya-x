import { auth } from "@/config/firebase";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [isReady, isLoggedIn, segments]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
