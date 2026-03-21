import { auth, db } from "@/config/firebase";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        bookingsData.push({
          id: doc.id,
          ...doc.data(),
        } as Booking);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Bookings Yet</Text>
          <Text style={styles.emptySubtitle}>
            You haven't made any bookings yet. Start your journey today!
          </Text>
          <TouchableOpacity
            style={styles.bookNowButton}
            onPress={() => router.push("/booking")}
          >
            <Text style={styles.bookNowButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

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

        {bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.bookingCard}
            onPress={() => router.push(`/tripstatus?bookingId=${booking.id}`)}
            activeOpacity={0.7}
          >
            {/* Route Info */}
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

            {/* Travel Details */}
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
                <Text style={styles.detailValueBold}>
                  KSh {booking.totalPrice}
                </Text>
              </View>
            </View>

            {/* Payment Status */}
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
                    {
                      color: getPaymentStatusColor(booking.paymentStatus),
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
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>
                    🔒 Pay via M-Pesa coming soon
                  </Text>
                </View>
              )}
            </View>

            {/* Booking ID */}
            <Text style={styles.bookingId}>
              ID: {booking.id.substring(0, 8)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 500,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  bookNowButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  bookNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
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
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  pickupPoint: {
    fontSize: 13,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  detailValueBold: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
  paymentSection: {
    marginBottom: 8,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  comingSoonBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  comingSoonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  bookingId: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
});
