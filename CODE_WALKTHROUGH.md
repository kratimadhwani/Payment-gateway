# 🎯 Code Walkthrough - Interview Ready

Perfect for explaining in interviews. Each section explains **WHY** we do it.

---

## 🔌 BACKEND: server.js

### Part 1️⃣: Setup & Initialization

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config(); // Load .env variables
const app = express();

// CORS: Allow frontend to communicate
app.use(cors());

// JSON parser for request bodies
app.use(express.json());

// Raw body parser for webhook (IMPORTANT!)
// Webhooks need raw bytes for signature verification
app.use("/webhook", express.raw({ type: "application/json" }));
```

**Why raw body for webhooks?**
- HMAC signature is computed on raw bytes
- JSON parsing changes the bytes
- Raw parser preserves exact body for verification

---

### Part 2️⃣: Initialize External Services

```javascript
// Supabase Database Connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Razorpay API Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

**Why separate these?**
- Reusable across endpoints
- Easy to mock for testing
- Clean dependency injection

---

### Part 3️⃣: POST /api/create-order (MOST IMPORTANT)

```javascript
app.post("/api/create-order", async (req, res) => {
  try {
    // Step 1: Extract & validate input
    const { name, email, phone, amount, description } = req.body;

    if (!name || !email || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ WHY VALIDATE?
    // Frontend can be hacked. Never trust user input.

    // Step 2: Get or create customer
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .single();

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert([{ name, email, phone }])
        .select("id")
        .single();
      customer = newCustomer;
    }

    // ✅ WHY GET_OR_CREATE?
    // Same customer can make multiple payments
    // Avoid duplicate customer records

    // Step 3: Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert ₹ to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`, // Unique identifier
      notes: {
        customer_id: customer.id,
        customer_email: email,
      },
    });

    // ✅ WHY RAZORPAY ORDER?
    // - Razorpay tracks all orders
    // - We get order_id to link with payments table
    // - Prevents duplicate/unauthorized orders

    // Step 4: Save pending payment in database
    const { data: payment } = await supabase
      .from("payments")
      .insert([
        {
          order_id: razorpayOrder.id,
          customer_id: customer.id,
          amount: amount,
          currency: "INR",
          status: "pending", // ⭐ IMPORTANT
          description: description || "Payment",
        },
      ])
      .select("id")
      .single();

    // ✅ WHY SAVE AS PENDING?
    // - Order created but not verified yet
    // - Will be updated by webhook
    // - Prevents status manipulation

    // Step 5: Return order details to frontend
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Public key
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
```

**Interview Answer:**
> "We create order on backend because frontend is compromised. Anyone can change amount with DevTools. By creating order server-side, we ensure authentic amount. We save status as 'pending' and update ONLY via webhook, which is cryptographically signed."

---

### Part 4️⃣: POST /webhook (THE MOST CRITICAL PART)

```javascript
app.post("/webhook", async (req, res) => {
  try {
    // ✅ STEP 1: GET SIGNATURE FROM REQUEST
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ✅ STEP 2: VERIFY SIGNATURE (CRITICAL!)
    const body = req.body.toString(); // Raw body
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret) // Hash with secret
      .update(body) // Hash the raw body
      .digest("hex"); // Convert to hex

    // ✅ COMPARE SIGNATURES
    if (signature !== expectedSignature) {
      console.warn("⚠️ Invalid webhook signature!");
      // Return 400 - this is a fake request
      return res.status(400).json({ success: false });
    }

    // ✅ WHY SIGNATURE VERIFICATION?
    // - Anyone with webhook URL can send fake events
    // - Signature = HMAC(secret, body)
    // - Only Razorpay knows the secret
    // - Proves request is from Razorpay

    // ✅ STEP 3: PARSE VERIFIED EVENT
    const event = JSON.parse(body);
    console.log(`✅ Event: ${event.event}`);

    // ✅ STEP 4: HANDLE PAYMENT SUCCESS
    if (event.event === "payment.authorized" || event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // ✅ UPDATE DATABASE: MARK AS SUCCESS
      const { error } = await supabase
        .from("payments")
        .update({
          status: "success", // ⭐ Mark success here only
          payment_id: paymentId,
        })
        .eq("order_id", orderId);

      if (error) {
        console.error("❌ Database Update Error:", error);
        return res.status(500).json({ success: false });
      }

      console.log("✅ Payment marked as SUCCESS");
    }

    // ✅ STEP 5: HANDLE PAYMENT FAILURE
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("order_id", orderId);
    }

    // ✅ STEP 6: ALWAYS RETURN 200 OK
    // Even if our code fails, return 200 to tell Razorpay
    // "we received this webhook"
    // If we return error, Razorpay retries (spam!)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(200).json({ success: false }); // Still 200!
  }
});
```

**Interview Answer:**
> "Webhooks are the only secure way to confirm payment. Here's why:
> 
> 1. **Signature Verification**: Razorpay signs webhook with secret. We verify HMAC-SHA256 to ensure it's really from Razorpay, not a hacker.
> 
> 2. **Backend-Only Update**: Only backend updates database status. Frontend can't manipulate payment.
> 
> 3. **Atomic Operation**: We update database AFTER signature verification. If verification fails, nothing changes.
> 
> 4. **Idempotency**: If webhook fires multiple times, we just update same record multiple times (safe).
> 
> 5. **Always 200 OK**: We acknowledge receipt to prevent Razorpay from retrying infinitely."

---

## 🎨 FRONTEND: script.js

### Part 1️⃣: Form Submission

```javascript
paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form data
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const amount = parseInt(document.getElementById("amount").value);

  // ✅ WHY VALIDATE BEFORE SENDING?
  // Faster feedback to user
  // Saves server resources
  // Better UX

  try {
    // ✅ STEP 1: CREATE ORDER ON BACKEND
    const orderResponse = await fetch(`${API_BASE_URL}/api/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, amount, description,
      }),
    });

    const orderData = await orderResponse.json();

    // ✅ STEP 2: OPEN RAZORPAY CHECKOUT
    const razorpayOptions = {
      key: orderData.keyId, // Public key from backend
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId, // Link to Razorpay order
      
      prefill: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        contact: orderData.customerPhone,
      },

      // ⚠️ DO NOT MARK SUCCESS HERE!
      handler: function (response) {
        // Frontend received payment response
        // But payment might fail in Razorpay system
        // Wait for webhook instead
        
        checkPaymentStatus(orderData.orderId); // Poll backend
      },

      theme: { color: "#667eea" },
    };

    const razorpay = new Razorpay(razorpayOptions);
    razorpay.open(); // Opens modal
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, "error");
  }
});
```

**Interview Answer:**
> "We never mark payment success in frontend. JavaScript is client-side and can be manipulated. The handler function just shows a message 'verifying...' and polls the backend for actual status."

---

### Part 2️⃣: Poll for Payment Status

```javascript
async function checkPaymentStatus(orderId) {
  try {
    // Call backend API
    const response = await fetch(
      `${API_BASE_URL}/api/payment-status/${orderId}`
    );
    const data = await response.json();
    const payment = data.payment;

    // ✅ CHECK STATUS
    if (payment.status === "success") {
      showMessage("✅ Payment successful!", "success");
      displayPaymentDetails(payment);
      paymentForm.reset();
    } else if (payment.status === "failed") {
      showMessage("❌ Payment failed!", "error");
    } else if (payment.status === "pending") {
      // ⏳ Still waiting for webhook
      // Retry after 2 seconds
      setTimeout(() => checkPaymentStatus(orderId), 2000);
    }
  } catch (error) {
    showMessage("⚠️ Could not verify payment", "error");
  }
}
```

**Interview Answer:**
> "We poll every 2 seconds because webhook takes time to arrive (usually 1-5 seconds). Frontend polls until database status changes from pending to success/failed."

---

## 🔐 Security Concepts

### 1️⃣ Why Backend-Only Status Update?

```
❌ WRONG - Frontend decides status:
User clicks "Pay"
→ Razorpay modal opens
→ User closes modal
→ Frontend marks as "success" ← WRONG!

✅ RIGHT - Backend decides via webhook:
User clicks "Pay"
→ Backend creates order (status: pending)
→ Razorpay modal opens
→ Razorpay sends webhook
→ Backend verifies + updates to "success"
→ Frontend polls and sees "success"
```

### 2️⃣ Webhook Signature Verification

```
Message Flow:
1. Razorpay creates event (e.g., payment.captured)
2. Razorpay signs: HMAC-SHA256(secret, body)
3. Razorpay sends: body + signature header

Backend receives:
4. Backend computes: HMAC-SHA256(secret, body)
5. Backend compares: computed == received?
6. If match → authentic from Razorpay
7. If no match → fake/tampered request → reject
```

### 3️⃣ Idempotency

```
What if webhook fires twice?

First call:
- Signature valid ✅
- Update: status pending → success
- Order 123 now success

Second call (duplicate):
- Signature valid ✅
- Update: status success → success
- Order 123 still success ✅

No problem! Same operation twice is safe.
```

---

## 📊 Database Flow

```
1. CREATE ORDER (POST /api/create-order)
   ↓
   INSERT INTO payments (
     order_id: "order_123",
     status: "pending"  ← Not confirmed yet
   )

2. PAYMENT HAPPENS
   ↓
   Razorpay sends webhook

3. WEBHOOK VERIFICATION
   ↓
   Verify HMAC-SHA256(secret, body)
   ↓
   If valid:
     UPDATE payments
     SET status = "success"
     WHERE order_id = "order_123"

4. FRONTEND POLLS
   ↓
   SELECT * FROM payments WHERE order_id = "order_123"
   ↓
   Returns status: "success"
   ↓
   Show confirmation to user
```

---

## 🎓 What Interviewers Want to Hear

### Q1: "Why can't we trust frontend?"
**A:** "JavaScript runs in user's browser. Anyone can open DevTools, modify the amount, or skip payment entirely. Only backend + cryptographically verified webhooks are trustworthy."

### Q2: "What if webhook never arrives?"
**A:** "Frontend polls every 2-5 seconds for 30 seconds. If still pending, show 'Payment processing' message. User can refresh page to check. In production, we'd send email confirmation. For failed webhooks, Razorpay retries automatically."

### Q3: "What if someone sends a fake webhook?"
**A:** "We verify HMAC-SHA256 signature. Fake requests won't have the correct signature (attacker doesn't know the secret). Verification fails → webhook rejected."

### Q4: "How do you prevent double payment?"
**A:** "Each customer per transaction gets unique order_id. If user pays twice, Razorpay detects duplicate and either refunds or merges. Database also has unique order_id constraint."

### Q5: "How do you scale this?"
**A:** "Add message queue (Bull, RabbitMQ) for webhook processing. Cache payment status in Redis. Use database replication. Load balance backend servers. CDN for frontend assets. Implement payment reconciliation job."

---

## 🚀 Real-World Scenarios

### Scenario 1: User closes payment modal

```
CREATE ORDER ✓
→ status: pending

Payment modal opens
→ User clicks X to close

WEBHOOK:
→ Never arrives (user didn't pay)

Frontend polls:
→ Sees status still "pending"
→ Shows "Payment not completed"
→ User can retry
```

### Scenario 2: Network latency

```
CREATE ORDER ✓
→ status: pending

Payment completes ✓

Webhook delayed (10 seconds)
→ Backend waits

Frontend polls (2, 4, 6, 8, 10 sec)
→ Sees pending
→ At 10 sec, webhook arrives
→ Status updates to success
→ Next poll sees success
```

### Scenario 3: Webhook retries

```
Webhook 1 → Network error ✗
Webhook 2 → Timeout ✗
Webhook 3 → Success ✓
→ UPDATE payments SET status = "success"

Webhook 4 → Duplicate
→ UPDATE payments SET status = "success" (same)
→ No harm, idempotent

Frontend sees success ✓
```

---

**You're ready for the interview! 🎉**
