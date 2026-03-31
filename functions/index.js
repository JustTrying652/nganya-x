const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const express = require("express");

admin.initializeApp();

const app = express();
app.use(cors);
app.use(express.json());

// Your M-Pesa credentials from Safaricom Developer Portal
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// M-Pesa API endpoints
const AUTH_URL =
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const STK_PUSH_URL =
  "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
const STK_QUERY_URL =
  "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";

// Get OAuth token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64",
    );
    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Generate password for STK Push
function generatePassword() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, -3);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString(
    "base64",
  );
  return { password, timestamp };
}

// Initiate STK Push
app.post("/initiatePayment", async (req, res) => {
  try {
    const { phone, amount, bookingId } = req.body;

    if (!phone || !amount || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let formattedPhone = phone.toString().trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const stkPushData = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: bookingId,
      TransactionDesc: `Payment for booking ${bookingId}`,
    };

    const response = await axios.post(STK_PUSH_URL, stkPushData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("STK Push Response:", response.data);

    // Store transaction in Firestore
    await admin.firestore().collection("mpesa_transactions").add({
      bookingId,
      phone: formattedPhone,
      amount,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "STK push sent successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Error initiating payment:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Payment initiation failed",
      error: error.response?.data || error.message,
    });
  }
});

// M-Pesa callback
app.post("/mpesaCallback", async (req, res) => {
  try {
    console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    const { stkCallback } = Body;

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    const transactionsRef = admin.firestore().collection("mpesa_transactions");
    const snapshot = await transactionsRef
      .where("checkoutRequestID", "==", CheckoutRequestID)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("Transaction not found");
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    }

    const transactionDoc = snapshot.docs[0];
    const transactionData = transactionDoc.data();

    if (ResultCode === 0) {
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find(
        (item) => item.Name === "MpesaReceiptNumber",
      )?.Value;

      await transactionDoc.ref.update({
        status: "completed",
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await admin
        .firestore()
        .collection("bookings")
        .doc(transactionData.bookingId)
        .update({
          paymentStatus: "Paid",
          mpesaReceiptNumber,
        });

      console.log(
        `Payment successful for booking: ${transactionData.bookingId}`,
      );
    } else {
      await transactionDoc.ref.update({
        status: "failed",
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await admin
        .firestore()
        .collection("bookings")
        .doc(transactionData.bookingId)
        .update({
          paymentStatus: "Failed",
        });

      console.log(`Payment failed for booking: ${transactionData.bookingId}`);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("Callback error:", error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
  }
});

// STK Push Query endpoint
app.post("/queryPayment", async (req, res) => {
  try {
    const { checkoutRequestID } = req.body;

    if (!checkoutRequestID) {
      return res.status(400).json({
        success: false,
        message: "Missing checkoutRequestID",
      });
    }

    const accessToken = await getAccessToken();
    const { password, timestamp } = generatePassword();

    const response = await axios.post(
      STK_QUERY_URL,
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const { ResultCode, ResultDesc } = response.data;

    if (ResultCode === 0 || ResultCode === "0") {
      const transactionsRef = admin
        .firestore()
        .collection("mpesa_transactions");
      const snapshot = await transactionsRef
        .where("checkoutRequestID", "==", checkoutRequestID)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const transactionDoc = snapshot.docs[0];
        const transactionData = transactionDoc.data();

        await transactionDoc.ref.update({
          status: "completed",
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await admin
          .firestore()
          .collection("bookings")
          .doc(transactionData.bookingId)
          .update({
            paymentStatus: "Paid",
          });
      }

      return res.status(200).json({
        success: true,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        status: "completed",
      });
    } else if (ResultCode === 1032 || ResultCode === "1032") {
      return res.status(200).json({
        success: false,
        resultCode: ResultCode,
        resultDesc: "Request cancelled by user",
        status: "cancelled",
      });
    } else {
      return res.status(200).json({
        success: false,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        status: "pending",
      });
    }
  } catch (error) {
    console.error("Query error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Query failed",
      error: error.response?.data || error.message,
    });
  }
});

// IMPORTANT: exports must always be at the very end
exports.mpesa = functions.https.onRequest(app);
