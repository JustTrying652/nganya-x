import { auth, db } from "@/config/firebase";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Sample routes data - we'll move this to Firebase later
const ROUTES = [
  {
    id: "1",
    name: "Nairobi → Mombasa",
    from: "Nairobi",
    to: "Mombasa",
    price: 1500,
    pickupPoints: ["Railways", "OTC", "Machakos Country Bus"],
  },
  {
    id: "2",
    name: "Nairobi → Kisumu",
    from: "Nairobi",
    to: "Kisumu",
    price: 1200,
    pickupPoints: ["Railways", "OTC", "Mololine"],
  },
  {
    id: "3",
    name: "Nairobi → Eldoret",
    from: "Nairobi",
    to: "Eldoret",
    price: 1000,
    pickupPoints: ["Railways", "OTC", "Mbukinya"],
  },
  {
    id: "4",
    name: "Mombasa → Nairobi",
    from: "Mombasa",
    to: "Nairobi",
    price: 1500,
    pickupPoints: ["Mwembe Tayari", "Likoni", "Buxton"],
  },
];

export default function BookingScreen() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedPickup, setSelectedPickup] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [numberOfSeats, setNumberOfSeats] = useState("1");
  const [loading, setLoading] = useState(false);

  const currentRoute = ROUTES.find((r) => r.id === selectedRoute);
  const totalPrice = currentRoute
    ? currentRoute.price * parseInt(numberOfSeats)
    : 0;

  const handleBooking = async () => {
    // Validation
    if (!selectedRoute) {
      Alert.alert("Error", "Please select a route");
      return;
    }
    if (!selectedPickup) {
      Alert.alert("Error", "Please select a pickup point");
      return;
    }
    if (!travelDate) {
      Alert.alert("Error", "Please select a travel date");
      return;
    }
    if (!numberOfSeats || parseInt(numberOfSeats) < 1) {
      Alert.alert("Error", "Please select number of seats");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to book");
      return;
    }

    setLoading(true);

    try {
      // Create booking in Firestore
      const booking = {
        userId: user.uid,
        userName: user.displayName || "User",
        userEmail: user.email,
        route: currentRoute?.name,
        from: currentRoute?.from,
        to: currentRoute?.to,
        pickupPoint: selectedPickup,
        travelDate: travelDate,
        numberOfSeats: parseInt(numberOfSeats),
        pricePerSeat: currentRoute?.price,
        totalPrice: totalPrice,
        status: "Pending", // Pending, Confirmed, Departed, En Route, Arrived, Cancelled
        paymentStatus: "Pending", // Pending, Paid, Failed
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "bookings"), booking);

      Alert.alert(
        "Booking Created!",
        `Your booking has been created.\n\nBooking ID: ${docRef.id}\nTotal: KSh ${totalPrice}\n\nProceed to payment?`,
        [
          {
            text: "Later",
            style: "cancel",
            onPress: () => {
              // Clear form
              setSelectedRoute("");
              setSelectedPickup("");
              setTravelDate("");
              setNumberOfSeats("1");
              router.push("/home");
            },
          },
          {
            text: "Pay Now",
            onPress: () => {
              // We'll implement M-Pesa payment later
              Alert.alert("Coming Soon", "M-Pesa integration coming soon!");
              setSelectedRoute("");
              setSelectedPickup("");
              setTravelDate("");
              setNumberOfSeats("1");
            },
          },
        ],
      );
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Your Trip</Text>
          <Text style={styles.subtitle}>
            Choose your route and travel details
          </Text>
        </View>

        {/* Route Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Route</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRoute}
              onValueChange={(value) => {
                setSelectedRoute(value);
                setSelectedPickup(""); // Reset pickup when route changes
              }}
              style={styles.picker}
            >
              <Picker.Item label="Choose a route..." value="" />
              {ROUTES.map((route) => (
                <Picker.Item
                  key={route.id}
                  label={route.name}
                  value={route.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Pickup Point Selection - Only show if route is selected */}
        {selectedRoute && currentRoute && (
          <View style={styles.section}>
            <Text style={styles.label}>Pickup Point</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPickup}
                onValueChange={setSelectedPickup}
                style={styles.picker}
              >
                <Picker.Item label="Choose pickup point..." value="" />
                {currentRoute.pickupPoints.map((point, index) => (
                  <Picker.Item key={index} label={point} value={point} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Travel Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Travel Date (DD/MM/YYYY)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 25/03/2026"
            placeholderTextColor="#999"
            value={travelDate}
            onChangeText={setTravelDate}
            keyboardType="numeric"
          />
        </View>

        {/* Number of Seats */}
        <View style={styles.section}>
          <Text style={styles.label}>Number of Seats</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={numberOfSeats}
              onValueChange={setNumberOfSeats}
              style={styles.picker}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <Picker.Item
                  key={num}
                  label={`${num} seat${num > 1 ? "s" : ""}`}
                  value={num.toString()}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Price Summary - Only show if route is selected */}
        {selectedRoute && currentRoute && (
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per seat:</Text>
              <Text style={styles.priceValue}>KSh {currentRoute.price}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Number of seats:</Text>
              <Text style={styles.priceValue}>{numberOfSeats}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total Amount:</Text>
              <Text style={styles.priceTotalValue}>KSh {totalPrice}</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.push("/home")}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  dateInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  datePlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  bookButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
    fontSize: 16,
  },
});
