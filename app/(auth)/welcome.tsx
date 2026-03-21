import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Navigate to login after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.logo}>Nganya X</Text>
        <Text style={styles.tagline}>Your Journey, Our Priority</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF9800",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: "#FFF3E0",
    fontStyle: "italic",
  },
});
