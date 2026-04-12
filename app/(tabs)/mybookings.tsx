import { auth, db } from "@/config/firebase";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
}

const UPCOMING_STATUSES = ["Pending", "Confirmed", "Departed", "En Route"];
const PAST_STATUSES = ["Arrived", "Cancelled"];

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(
    null,
  );
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchBookings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const upcomingBookings = bookings.filter((b) =>
    UPCOMING_STATUSES.includes(b.status),
  );
  const pastBookings = bookings.filter((b) => PAST_STATUSES.includes(b.status));
  const displayedBookings =
    activeTab === "upcoming" ? upcomingBookings : pastBookings;

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "#4CAF50";
      case "Failed":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel your booking for ${booking.route} on ${booking.travelDate}?`,
      [
        { text: "No, Keep It", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setCancellingBookingId(booking.id);
            try {
              await updateDoc(doc(db, "bookings", booking.id), {
                status: "Cancelled",
              });
              Alert.alert(
                "Booking Cancelled",
                "Your booking has been cancelled successfully.",
              );
              fetchBookings();
            } catch (error) {
              console.error("Cancel error:", error);
              Alert.alert(
                "Error",
                "Failed to cancel booking. Please try again.",
              );
            } finally {
              setCancellingBookingId(null);
            }
          },
        },
      ],
    );
  };

  const handlePayNow = async () => {
    if (!selectedBooking) return;
    if (!phoneNumber || phoneNumber.trim() === "") {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    setShowPayModal(false);
    setPayingBookingId(selectedBooking.id);

    try {
      const response = await fetch(
        "https://mpesa-cahjhnw66a-uc.a.run.app/initiatePayment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phoneNumber.trim(),
            amount: selectedBooking.totalPrice,
            bookingId: selectedBooking.id,
          }),
        },
      );

      const result = await response.json();

      if (!result.success) {
        Alert.alert("Error", result.message || "Payment failed");
        setPayingBookingId(null);
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

          if (queryResult.status === "completed") {
            clearInterval(pollInterval);
            setPayingBookingId(null);
            setPhoneNumber("");
            Alert.alert(
              "Success! 🎉",
              "Payment successful! Your booking is confirmed.",
            );
            fetchBookings();
          } else if (queryResult.status === "cancelled") {
            clearInterval(pollInterval);
            setPayingBookingId(null);
            Alert.alert("Cancelled", "Payment was cancelled.");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPayingBookingId(null);
            Alert.alert(
              "Taking too long",
              "Payment is still processing. Please check your bookings in a few minutes.",
            );
          }
        } catch (queryError) {
          console.error("Query error:", queryError);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPayingBookingId(null);
          }
        }
      }, 5000);
    } catch (error) {
      console.error("Payment error:", error);
      setPayingBookingId(null);
      Alert.alert("Error", "Failed to initiate payment. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === "upcoming" ? "🗓️" : "📋"}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === "upcoming" ? "No Upcoming Trips" : "No Past Trips"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "upcoming"
          ? "You have no upcoming bookings. Book a trip to get started!"
          : "Your completed and cancelled trips will appear here."}
      </Text>
      {activeTab === "upcoming" && (
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={() => router.push("/booking")}
        >
          <Text style={styles.bookNowButtonText}>Book Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      onPress={() => router.push(`/tripstatus?bookingId=${booking.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{booking.route}</Text>
          <Text style={styles.pickupPoint}>📍 {booking.pickupPoint}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(booking.status) },
            ]}
          />
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Travel Date:</Text>
          <Text style={styles.detailValue}>{booking.travelDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Seats:</Text>
          <Text style={styles.detailValue}>{booking.numberOfSeats}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.detailValueBold}>KSh {booking.totalPrice}</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
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
              styles.paymentText,
              { color: getPaymentStatusColor(booking.paymentStatus) },
            ]}
          >
            {booking.paymentStatus === "Paid"
              ? "✓ Paid"
              : booking.paymentStatus === "Failed"
                ? "✗ Payment Failed"
                : "⏳ Payment Pending"}
          </Text>
        </View>

        {booking.paymentStatus === "Pending" &&
          booking.status !== "Cancelled" && (
            <TouchableOpacity
              style={[
                styles.payButton,
                payingBookingId === booking.id && styles.buttonDisabled,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedBooking(booking);
                setPhoneNumber("");
                setShowPayModal(true);
              }}
              disabled={payingBookingId === booking.id}
            >
              {payingBookingId === booking.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          )}
      </View>

      {booking.status === "Pending" && booking.paymentStatus === "Pending" && (
        <TouchableOpacity
          style={[
            styles.cancelBookingButton,
            cancellingBookingId === booking.id && styles.buttonDisabled,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleCancelBooking(booking);
          }}
          disabled={cancellingBookingId === booking.id}
        >
          {cancellingBookingId === booking.id ? (
            <ActivityIndicator color="#F44336" size="small" />
          ) : (
            <Text style={styles.cancelBookingText}>✕ Cancel Booking</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.bookingId}>ID: {booking.id.substring(0, 8)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "upcoming" && styles.activeTabText,
              ]}
            >
              Upcoming{" "}
              {upcomingBookings.length > 0 && `(${upcomingBookings.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "past" && styles.activeTab]}
            onPress={() => setActiveTab("past")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "past" && styles.activeTabText,
              ]}
            >
              Past {pastBookings.length > 0 && `(${pastBookings.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {displayedBookings.length === 0
          ? renderEmptyState()
          : displayedBookings.map((booking) => renderBookingCard(booking))}
      </View>

      {/* Phone Number Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>M-Pesa Payment</Text>
            <Text style={styles.modalSubtitle}>
              Enter your M-Pesa phone number to pay KSh{" "}
              {selectedBooking?.totalPrice}
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
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "500", color: "#999" },
  activeTabText: { color: "#000", fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  bookNowButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  routeInfo: { flex: 1 },
  routeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  pickupPoint: { fontSize: 13, color: "#666" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#000" },
  detailsSection: { marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: "#666" },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "500" },
  detailValueBold: { fontSize: 16, color: "#000", fontWeight: "bold" },
  paymentSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  paymentText: { fontSize: 13, fontWeight: "600" },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  payButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cancelBookingButton: {
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  cancelBookingText: { color: "#F44336", fontSize: 13, fontWeight: "600" },
  bookingId: { fontSize: 11, color: "#999", marginTop: 4 },
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
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalCancelButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#666" },
  modalPayButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  modalPayText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
