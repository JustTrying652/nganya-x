import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f0f0f0",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <React.Fragment>
              {/* Simple emoji icons work on all platforms */}
            </React.Fragment>
          ),
          tabBarLabel: "🏠 Home",
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: "Book",
          tabBarLabel: "🚌 Book",
        }}
      />
      <Tabs.Screen
        name="mybookings"
        options={{
          title: "My Bookings",
          tabBarLabel: "📋 Bookings",
        }}
      />
      <Tabs.Screen
        name="tripstatus"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
