import { db } from "@/config/firebase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Booking {
  id: string;
  route: string;
  from: string;
  to: string;
  pickupPoint: string;
  travelDate: string;
  numberOfSeats: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  userName: string;
}

const STATUS_STEPS = [
  { key: "Pending", label: "Booking Pending", icon: "⏳" },
  { key: "Confirmed", label: "Booking Confirmed", icon: "✓" },
  { key: "Departed", label: "Vehicle Departed", icon: "🚌" },
  { key: "En Route", label: "On the Way", icon: "🛣️" },
  { key: "Arrived", label: "Arrived at Destination", icon: "🎯" },
];

export default function TripStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "bookings", bookingId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setBooking({ id: docSnapshot.id, ...docSnapshot.data() } as Booking);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching booking:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [bookingId]);

  const getCurrentStatusIndex = () => {
    if (!booking) return -1;
    return STATUS_STEPS.findIndex((step) => step.key === booking.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "#4CAF50";
      case "Departed":
        return "#2196F3";
      case "En Route":
        return "#FF9800";
      case "Arrived":
        return "#9C27B0";
      case "Cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const handleContactSupport = () => {
    if (!booking) return;
    const email = "ngataevans@gmail.com";
    const subject = `Support Request - Booking ${booking.id.substring(0, 8)}`;
    const body = `Hi, I need help with my booking.\n\nBooking ID: ${booking.id}\nRoute: ${booking.route}\nTravel Date: ${booking.travelDate}\n\nIssue: `;
    Linking.openURL(
      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  };

  const handlePayNow = async () => {
    if (!booking) return;
    if (!phoneNumber || phoneNumber.trim() === "") {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    setShowPayModal(false);
    setPaymentLoading(true);

    try {
      const response = await fetch(
        "https://mpesa-cahjhnw66a-uc.a.run.app/initiatePayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phoneNumber.trim(),
            amount: booking.totalPrice,
            bookingId: booking.id,
          }),
        },
      );

      const result = await response.json();

      if (!result.success) {
        Alert.alert("Error", result.message || "Payment failed");
        setPaymentLoading(false);
        return;
      }

      const checkoutRequestID = result.data.CheckoutRequestID;
      Alert.alert(
        "Payment Initiated",
        "Check your phone for the M-Pesa prompt. We will check your payment status automatically.",
      );

      let attempts = 0;
      const maxAttempts = 6;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const queryResponse = await fetch(
            "https://mpesa-cahjhnw66a-uc.a.run.app/queryPayment",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ checkoutRequestID }),
            },
          );
          const queryResult = await queryResponse.json();
          console.log("Query result:", queryResult);

          if (queryResult.status === "completed") {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            setPhoneNumber("");
            Alert.alert(
              "Success! 🎉",
              "Payment successful! Your booking is confirmed.",
            );
          } else if (queryResult.status === "cancelled") {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            Alert.alert("Cancelled", "Payment was cancelled.");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            Alert.alert(
              "Taking too long",
              "Payment is still processing. Please check your bookings in a few minutes.",
            );
          }
        } catch (queryError) {
          console.error("Query error:", queryError);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPaymentLoading(false);
          }
        }
      }, 5000);
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentLoading(false);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading trip status...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Booking Not Found</Text>
        <Text style={styles.errorSubtitle}>
          We couldn't find this booking. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();
  const isCancelled = booking.status === "Cancelled";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.push("/mybookings")}
        >
          <Text style={styles.backLinkText}>← Back to My Bookings</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.routeName}>{booking.route}</Text>
          <Text style={styles.travelDate}>📅 {booking.travelDate}</Text>
          <Text style={styles.pickupPoint}>
            📍 Pickup: {booking.pickupPoint}
          </Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Seats:</Text>
            <Text style={styles.infoValue}>{booking.numberOfSeats}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total:</Text>
            <Text style={styles.infoValue}>KSh {booking.totalPrice}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Booking ID:</Text>
            <Text style={styles.infoValueSmall}>
              {booking.id.substring(0, 12)}...
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isCancelled
                ? "#FFEBEE"
                : getStatusColor(booking.status) + "20",
            },
          ]}
        >
          <Text style={styles.statusBannerLabel}>Current Status</Text>
          <Text
            style={[
              styles.statusBannerText,
              {
                color: isCancelled ? "#F44336" : getStatusColor(booking.status),
              },
            ]}
          >
            {booking.status}
          </Text>
        </View>

        {!isCancelled && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Trip Progress</Text>
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  {index > 0 && (
                    <View
                      style={[
                        styles.connector,
                        {
                          backgroundColor: isCompleted ? "#4CAF50" : "#e0e0e0",
                        },
                      ]}
                    />
                  )}
                  <View style={styles.stepContainer}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isCompleted
                            ? isCurrent
                              ? getStatusColor(booking.status)
                              : "#4CAF50"
                            : "#f5f5f5",
                          borderColor: isCompleted
                            ? isCurrent
                              ? getStatusColor(booking.status)
                              : "#4CAF50"
                            : "#e0e0e0",
                        },
                      ]}
                    >
                      <Text style={styles.iconText}>{step.icon}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isCompleted ? "#000" : "#999",
                            fontWeight: isCurrent ? "bold" : "500",
                          },
                        ]}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.currentBadge}>Current</Text>
                      )}
                      {isCompleted && !isCurrent && (
                        <Text style={styles.completedText}>✓ Completed</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {isCancelled && (
          <View style={styles.cancelledCard}>
            <Text style={styles.cancelledIcon}>🚫</Text>
            <Text style={styles.cancelledTitle}>Booking Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>
              This booking has been cancelled. If you have any questions, please
              contact support.
            </Text>
          </View>
        )}

        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Payment Status</Text>
          <View
            style={[
              styles.paymentBadge,
              {
                backgroundColor:
                  booking.paymentStatus === "Paid"
                    ? "#E8F5E9"
                    : booking.paymentStatus === "Failed"
                      ? "#FFEBEE"
                      : "#FFF3E0",
              },
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                {
                  color:
                    booking.paymentStatus === "Paid"
                      ? "#4CAF50"
                      : booking.paymentStatus === "Failed"
                        ? "#F44336"
                        : "#FF9800",
                },
              ]}
            >
              {booking.paymentStatus === "Paid"
                ? "✓ Paid"
                : booking.paymentStatus === "Failed"
                  ? "✗ Payment Failed"
                  : "⏳ Payment Pending"}
            </Text>
          </View>

          {booking.paymentStatus === "Pending" && (
            <TouchableOpacity
              style={[
                styles.payNowButton,
                paymentLoading && styles.payNowButtonDisabled,
              ]}
              onPress={() => setShowPayModal(true)}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payNowButtonText}>Pay via M-Pesa</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            If you have any questions about your trip, contact our support team.
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.supportButtonText}>✉️ Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Phone Number Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>M-Pesa Payment</Text>
            <Text style={styles.modalSubtitle}>
              Enter your M-Pesa phone number to pay KSh {booking?.totalPrice}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 0712345678"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={12}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPayModal(false);
                  setPhoneNumber("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPayButton}
                onPress={handlePayNow}
              >
                <Text style={styles.modalPayText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8f9fa",
  },
  errorIcon: { fontSize: 64, marginBottom: 16 },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backLink: { marginBottom: 24 },
  backLinkText: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  travelDate: { fontSize: 15, color: "#666", marginBottom: 6 },
  pickupPoint: { fontSize: 15, color: "#666", marginBottom: 16 },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: { fontSize: 14, color: "#666" },
  infoValue: { fontSize: 14, color: "#000", fontWeight: "600" },
  infoValueSmall: { fontSize: 12, color: "#000", fontWeight: "500" },
  statusBanner: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  statusBannerLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  statusBannerText: { fontSize: 24, fontWeight: "bold" },
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 24,
  },
  timelineStep: { position: "relative", marginBottom: 24 },
  connector: { position: "absolute", left: 23, top: -24, width: 2, height: 24 },
  stepContainer: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: { fontSize: 20 },
  stepInfo: { flex: 1 },
  stepLabel: { fontSize: 16, marginBottom: 4 },
  currentBadge: { fontSize: 12, color: "#FF9800", fontWeight: "600" },
  completedText: { fontSize: 12, color: "#4CAF50", fontWeight: "600" },
  cancelledCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelledIcon: { fontSize: 64, marginBottom: 16 },
  cancelledTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F44336",
    marginBottom: 8,
  },
  cancelledSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  paymentBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  paymentBadgeText: { fontSize: 14, fontWeight: "600" },
  payNowButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  payNowButtonDisabled: { opacity: 0.6 },
  payNowButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  supportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  supportButtonText: { color: "#000", fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#666" },
  modalPayButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalPayText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
