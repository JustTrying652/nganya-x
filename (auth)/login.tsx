import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // We'll implement this later
    console.log("Login pressed");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/Company Name */}
        <View style={styles.header}>
          <Text style={styles.logo}>MatBook</Text>
          <Text style={styles.tagline}>Your Journey, Our Priority</Text>
        </View>

        {/* Toggle between Email and Phone */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === "email" && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMethod("email")}
          >
            <Text
              style={[
                styles.toggleText,
                loginMethod === "email" && styles.toggleTextActive,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === "phone" && styles.toggleButtonActive,
            ]}
            onPress={() => setLoginMethod("phone")}
          >
            <Text
              style={[
                styles.toggleText,
                loginMethod === "phone" && styles.toggleTextActive,
              ]}
            >
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.formContainer}>
          {loginMethod === "email" ? (
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#666",
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 32,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  forgotPassword: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
