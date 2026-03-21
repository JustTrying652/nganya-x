import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Last Updated: March 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us, including your
          name, email address, phone number, and payment information when you
          create an account or make a booking.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to provide, maintain, and improve
          our services, process your bookings, send you updates about your
          trips, and communicate with you about our services.
        </Text>

        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We share your information with transport service providers to
          facilitate your bookings. We do not sell your personal information to
          third parties.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your personal
          information. However, no method of transmission over the internet is
          100% secure.
        </Text>

        <Text style={styles.sectionTitle}>5. Location Data</Text>
        <Text style={styles.paragraph}>
          We may collect location data to provide trip tracking services. You
          can disable location services in your device settings at any time.
        </Text>

        <Text style={styles.sectionTitle}>6. Payment Information</Text>
        <Text style={styles.paragraph}>
          Payment transactions are processed through secure third-party payment
          processors (M-Pesa). We do not store your complete payment card
          details.
        </Text>

        <Text style={styles.sectionTitle}>7. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar tracking technologies to track activity on
          our service and improve user experience.
        </Text>

        <Text style={styles.sectionTitle}>8. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, update, or delete your personal
          information. You can do this by contacting us or through your account
          settings.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for children under 18. We do not knowingly
          collect personal information from children.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us
          at privacy@nganyax.com
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Nganya X, you consent to the collection and use of
            information as described in this Privacy Policy.
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
