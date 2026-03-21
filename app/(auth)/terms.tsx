import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using Nganya X mobile application, you accept and
          agree to be bound by the terms and provisions of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of Service</Text>
        <Text style={styles.paragraph}>
          Nganya X provides a platform for booking matatu transportation
          services. You agree to use this service only for lawful purposes and
          in accordance with these Terms.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your
          account and password. You agree to accept responsibility for all
          activities that occur under your account.
        </Text>

        <Text style={styles.sectionTitle}>4. Booking and Payment</Text>
        <Text style={styles.paragraph}>
          All bookings are subject to availability. Payment must be completed
          through the app using M-Pesa or other approved payment methods. Prices
          are subject to change without notice.
        </Text>

        <Text style={styles.sectionTitle}>5. Cancellation Policy</Text>
        <Text style={styles.paragraph}>
          Cancellations must be made at least 24 hours before the scheduled
          departure time for a full refund. Cancellations made within 24 hours
          may be subject to a cancellation fee.
        </Text>

        <Text style={styles.sectionTitle}>6. Liability</Text>
        <Text style={styles.paragraph}>
          Nganya X acts as an intermediary between users and transport service
          providers. We are not liable for any delays, accidents, or incidents
          that occur during your journey.
        </Text>

        <Text style={styles.sectionTitle}>7. User Conduct</Text>
        <Text style={styles.paragraph}>
          Users must behave respectfully towards drivers and other passengers.
          Any abusive or inappropriate behavior may result in account suspension
          or termination.
        </Text>

        <Text style={styles.sectionTitle}>8. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of Nganya X is also governed by our Privacy Policy. We
          collect and use your personal information as described in our Privacy
          Policy.
        </Text>

        <Text style={styles.sectionTitle}>9. Modifications to Service</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify or discontinue, temporarily or
          permanently, the service with or without notice.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms & Conditions, please contact us at
          support@nganyax.com
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Nganya X, you acknowledge that you have read and understood
            these Terms & Conditions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    marginBottom: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
