import { auth, db } from "@/config/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
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

      await addDoc(collection(db, "bookings"), booking);
      setLoading(false); // ← ADD THIS LINE
      resetForm();
      router.push("/mybookings");
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
          <Text style={styles.title}>Book Your </Text>
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
              display={"default"}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
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
});
