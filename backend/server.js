import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://payment-gateway-rose.vercel.app",
    "https://payment-gateway-wgnk.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
// Raw body parser for webhook signature verification
app.use("/webhook", express.raw({ type: "application/json" }));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ ENDPOINT 1: Create Payment Order
app.post("/api/create-order", async (req, res) => {
  try {
    console.log("📝 Request received:", req.body);
    const { name, email, phone, amount, description } = req.body;

    // Validate input
    if (!name || !email || !phone || !amount) {
      console.error("❌ Missing fields:", { name, email, phone, amount });
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Step 1: Create or get customer in Supabase
    let { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .single();

    if (!customer) {
      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .insert([{ name, email, phone }])
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Customer insertion failed: ${insertError.message}`);
      }
      customer = newCustomer;
    }

    // Step 2: Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        customer_id: customer.id,
        customer_email: email,
      },
    });

    // Step 3: Save order record in Supabase with status = 'pending'
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          order_id: razorpayOrder.id,
          customer_id: customer.id,
          amount: amount,
          currency: "INR",
          status: "pending",
          description: description || "Payment",
        },
      ])
      .select("id")
      .single();

    if (paymentError) {
      throw new Error(`Payment record insertion failed: ${paymentError.message}`);
    }

    // Return Razorpay order details to frontend
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
    });
  } catch (error) {
    console.error("❌ Order Creation Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ ENDPOINT 2: Webhook Handler (MOST CRITICAL)
app.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ⚠️ CRITICAL: Verify webhook signature to prevent tampering
    const body = req.body.toString();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠️ Invalid webhook signature!");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(body);
    console.log("✅ Webhook Event Received:", event.event);

    if (event.event === "payment.authorized" || event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log(`💰 Payment Captured: ${paymentId} for Order: ${orderId}`);

      // Update Supabase: Mark payment as success
      const { error } = await supabase
        .from("payments")
        .update({
          status: "success",
          payment_id: paymentId,
        })
        .eq("order_id", orderId);

      if (error) {
        console.error("❌ Database Update Error:", error);
        return res.status(500).json({ success: false, message: "Update failed" });
      }

      console.log("✅ Payment marked as SUCCESS in database");
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      console.log(`❌ Payment Failed: Order ${orderId}`);

      // Update Supabase: Mark payment as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("order_id", orderId);
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ success: false, message: error.message });
  }
});

// ✅ ENDPOINT 3: Get Payment Status
app.get("/api/payment-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      payment: data,
    });
  } catch (error) {
    console.error("❌ Status Check Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ ENDPOINT 4: Get All Payments (for testing)
app.get("/api/payments", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, customers(name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      payments: data,
    });
  } catch (error) {
    console.error("❌ Fetch Payments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Razorpay Payment Gateway API is running",
    endpoints: {
      "POST /api/create-order": "Create payment order",
      "POST /webhook": "Razorpay webhook handler",
      "GET /api/payment-status/:orderId": "Check payment status",
      "GET /api/payments": "Get all payments",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("📝 Make sure to configure .env with your Razorpay credentials");
});
