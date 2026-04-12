import { auth, db } from "@/config/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  {
    id: "5",
    name: "Nairobi → Meru",
    from: "Nairobi",
    to: "Meru",
    price: 1000,
    pickupPoints: ["Railways", "OTC", "Machakos Country Bus", "Riverside"],
  },
  {
    id: "6",
    name: "Nairobi → Chuka",
    from: "Nairobi",
    to: "Chuka",
    price: 900,
    pickupPoints: ["Railways", "OTC", "Machakos Country Bus"],
  },
  {
    id: "7",
    name: "Nairobi → Embu",
    from: "Nairobi",
    to: "Embu",
    price: 700,
    pickupPoints: ["Railways", "OTC", "Machakos Country Bus", "Eastleigh"],
  },
  {
    id: "8",
    name: "Nairobi → Nyeri",
    from: "Nairobi",
    to: "Nyeri",
    price: 600,
    pickupPoints: ["Railways", "OTC", "Latema Road", "Riverside"],
  },
  {
    id: "9",
    name: "Nairobi → Karatina",
    from: "Nairobi",
    to: "Karatina",
    price: 550,
    pickupPoints: ["Railways", "OTC", "Latema Road"],
  },
  {
    id: "10",
    name: "Nairobi → Kerugoya",
    from: "Nairobi",
    to: "Kerugoya",
    price: 650,
    pickupPoints: ["Railways", "OTC", "Machakos Country Bus"],
  },
  {
    id: "11",
    name: "Nairobi → Nanyuki",
    from: "Nairobi",
    to: "Nanyuki",
    price: 700,
    pickupPoints: ["Railways", "OTC", "Latema Road", "Riverside"],
  },
  {
    id: "12",
    name: "Meru → Nairobi",
    from: "Meru",
    to: "Nairobi",
    price: 1000,
    pickupPoints: ["Meru Town Stage", "Meru Bus Park", "Makutano"],
  },
  {
    id: "13",
    name: "Chuka → Nairobi",
    from: "Chuka",
    to: "Nairobi",
    price: 900,
    pickupPoints: ["Chuka Town Stage", "Chuka Bus Park"],
  },
  {
    id: "14",
    name: "Embu → Nairobi",
    from: "Embu",
    to: "Nairobi",
    price: 700,
    pickupPoints: ["Embu Town Stage", "Embu Bus Park", "Kangethe"],
  },
  {
    id: "15",
    name: "Nyeri → Nairobi",
    from: "Nyeri",
    to: "Nairobi",
    price: 600,
    pickupPoints: ["Nyeri Town Stage", "Nyeri Bus Park", "Kimathi Way"],
  },
  {
    id: "16",
    name: "Karatina → Nairobi",
    from: "Karatina",
    to: "Nairobi",
    price: 550,
    pickupPoints: ["Karatina Market Stage", "Karatina Bus Park"],
  },
  {
    id: "17",
    name: "Kerugoya → Nairobi",
    from: "Kerugoya",
    to: "Nairobi",
    price: 650,
    pickupPoints: ["Kerugoya Town Stage", "Kutus Stage"],
  },
  {
    id: "18",
    name: "Nanyuki → Nairobi",
    from: "Nanyuki",
    to: "Nairobi",
    price: 700,
    pickupPoints: ["Nanyuki Town Stage", "Nanyuki Bus Park", "Equator"],
  },
];

export default function BookingScreen() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedPickup, setSelectedPickup] = useState("");
  const [travelDate, setTravelDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [numberOfSeats, setNumberOfSeats] = useState("1");
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState(0);

  const currentRoute = ROUTES.find((r) => r.id === selectedRoute);
  const totalPrice = currentRoute
    ? currentRoute.price * parseInt(numberOfSeats)
    : 0;

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const resetForm = () => {
    setSelectedRoute("");
    setSelectedPickup("");
    setTravelDate(new Date());
    setDateSelected(false);
    setNumberOfSeats("1");
  };

  const initiatePayment = async () => {
    if (!pendingBookingId) return;
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
            amount: pendingAmount,
            bookingId: pendingBookingId,
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

          if (queryResult.status === "completed") {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            setPhoneNumber("");
            resetForm();
            Alert.alert(
              "Success! 🎉",
              "Payment successful! Your booking is confirmed.",
              [
                {
                  text: "View Bookings",
                  onPress: () => router.push("/mybookings"),
                },
              ],
            );
          } else if (queryResult.status === "cancelled") {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            Alert.alert(
              "Cancelled",
              "Payment was cancelled. You can pay later from My Bookings.",
            );
            resetForm();
            router.push("/mybookings");
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPaymentLoading(false);
            Alert.alert(
              "Taking too long",
              "Payment is still processing. Check My Bookings in a few minutes.",
            );
            resetForm();
            router.push("/mybookings");
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

  const handleBooking = async () => {
    if (!selectedRoute) {
      Alert.alert("Error", "Please select a route");
      return;
    }
    if (!selectedPickup) {
      Alert.alert("Error", "Please select a pickup point");
      return;
    }
    if (!dateSelected) {
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
      const booking = {
        userId: user.uid,
        userName: user.displayName || "User",
        userEmail: user.email,
        route: currentRoute?.name,
        from: currentRoute?.from,
        to: currentRoute?.to,
        pickupPoint: selectedPickup,
        travelDate: formatDate(travelDate),
        numberOfSeats: parseInt(numberOfSeats),
        pricePerSeat: currentRoute?.price,
        totalPrice,
        status: "Pending",
        paymentStatus: "Pending",
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "bookings"), booking);
      setLoading(false);

      Alert.alert(
        "Booking Created!",
        `Your booking has been created.\n\nBooking ID: ${docRef.id}\nTotal: KSh ${totalPrice}\n\nProceed to payment?`,
        [
          {
            text: "Later",
            style: "cancel",
            onPress: () => {
              resetForm();
              router.push("/mybookings");
            },
          },
          {
            text: "Pay Now",
            onPress: () => {
              setPendingBookingId(docRef.id);
              setPendingAmount(totalPrice);
              setPhoneNumber("");
              setShowPayModal(true);
            },
          },
        ],
      );
    } catch (error) {
      console.error("Booking error:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to create booking. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Book Your Trip</Text>
          <Text style={styles.subtitle}>
            Choose your route and travel details
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Route</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRoute}
              onValueChange={(value) => {
                setSelectedRoute(value);
                setSelectedPickup("");
              }}
              style={styles.picker}
            >
              <Picker.Item label="Choose a route..." value="" />
              <Picker.Item
                label="─── Standard Routes ───"
                value=""
                enabled={false}
              />
              {ROUTES.slice(0, 4).map((route) => (
                <Picker.Item
                  key={route.id}
                  label={route.name}
                  value={route.id}
                />
              ))}
              <Picker.Item
                label="─── Mt. Kenya Region ───"
                value=""
                enabled={false}
              />
              {ROUTES.slice(4).map((route) => (
                <Picker.Item
                  key={route.id}
                  label={route.name}
                  value={route.id}
                />
              ))}
            </Picker>
          </View>
        </View>

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

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Travel Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={dateSelected ? styles.dateText : styles.datePlaceholder}
            >
              {dateSelected
                ? `📅 ${formatDate(travelDate)}`
                : "📅 Select travel date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={travelDate}
              mode="date"
              display={Platform.OS === "android" ? "calendar" : "spinner"}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (event.type === "set" && selectedDate) {
                  setTravelDate(selectedDate);
                  setDateSelected(true);
                }
              }}
            />
          )}
        </View>

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

        <TouchableOpacity
          style={[
            styles.bookButton,
            (loading || paymentLoading) && styles.bookButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={loading || paymentLoading}
        >
          {loading || paymentLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.push("/home")}
          disabled={loading || paymentLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Number Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>M-Pesa Payment</Text>
            <Text style={styles.modalSubtitle}>
              Enter your M-Pesa phone number to pay KSh {pendingAmount}
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
                  resetForm();
                  router.push("/mybookings");
                }}
              >
                <Text style={styles.modalCancelText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPayButton}
                onPress={initiatePayment}
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
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666" },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 8 },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: { height: 50 },
  dateButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
  },
  dateText: { fontSize: 16, color: "#000" },
  datePlaceholder: { fontSize: 16, color: "#999" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
    fontSize: 16,
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
  priceLabel: { fontSize: 14, color: "#666" },
  priceValue: { fontSize: 14, color: "#000", fontWeight: "500" },
  priceDivider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 8 },
  priceTotalLabel: { fontSize: 18, fontWeight: "bold", color: "#000" },
  priceTotalValue: { fontSize: 20, fontWeight: "bold", color: "#000" },
  bookButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "500" },
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
