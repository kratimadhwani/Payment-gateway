// ✅ FRONTEND PAYMENT SCRIPT

const API_BASE_URL = "https://payment-gateway-wgnk.onrender.com";

const paymentForm = document.getElementById("paymentForm");
const payButton = document.getElementById("payButton");
const messageDiv = document.getElementById("message");
const statusSection = document.getElementById("statusSection");
const statusContent = document.getElementById("statusContent");
const amountInput = document.getElementById("amount");

// Update button text when amount changes
amountInput.addEventListener("change", updateButtonText);
amountInput.addEventListener("input", updateButtonText);

function updateButtonText() {
  const amount = amountInput.value || "0";
  document.getElementById("buttonText").textContent = `Pay ₹${amount}`;
}

// ========================================
// HANDLE FORM SUBMISSION
// ========================================
paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous messages
  hideMessage();
  statusSection.style.display = "none";

  // Get form data
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const amount = parseInt(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  // Validation
  if (!name || !email || !phone || !amount || amount < 1) {
    showMessage("❌ Please fill all required fields correctly", "error");
    return;
  }

  try {
    // Disable button
    payButton.disabled = true;
    document.getElementById("loader").style.display = "inline-block";

    // ========================================
    // STEP 1: Create Order on Backend
    // ========================================
    console.log("📝 Creating order...");
    const orderResponse = await fetch(`${API_BASE_URL}/api/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        amount,
        description,
      }),
    });

    if (!orderResponse.ok) {
      throw new Error("Failed to create order");
    }

    const orderData = await orderResponse.json();

    if (!orderData.success) {
      throw new Error(orderData.message || "Order creation failed");
    }

    console.log("✅ Order created:", orderData);

    // ========================================
    // STEP 2: Open Razorpay Checkout
    // ========================================
    const razorpayOptions = {
      key: orderData.keyId, // Public key from backend
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Payment Gateway",
      description: description || "Payment",
      order_id: orderData.orderId, // Razorpay Order ID
      
      prefill: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        contact: orderData.customerPhone,
      },

      // ⚠️ NOTE: These handlers are NOT SECURE
      // Do NOT mark payment as success here
      // Wait for webhook confirmation instead
      handler: function (response) {
        console.log("✅ Payment Response:", response);
        showMessage(
          "💳 Payment completed! Verifying with server...",
          "info"
        );

        // Poll for payment status (webhook takes a few seconds)
        setTimeout(() => checkPaymentStatus(orderData.orderId), 2000);
      },

      modal: {
        ondismiss: function () {
          console.log("❌ Payment Modal Closed");
          payButton.disabled = false;
          document.getElementById("loader").style.display = "none";
          showMessage("❌ Payment cancelled", "error");
        },
      },

      theme: {
        color: "#667eea",
      },
    };

    // Open Razorpay Checkout
    const razorpay = new Razorpay(razorpayOptions);
    razorpay.open();

    payButton.disabled = false;
    document.getElementById("loader").style.display = "none";
  } catch (error) {
    console.error("❌ Error:", error);
    payButton.disabled = false;
    document.getElementById("loader").style.display = "none";
    showMessage(`❌ Error: ${error.message}`, "error");
  }
});

// ========================================
// CHECK PAYMENT STATUS (After Webhook)
// ========================================
async function checkPaymentStatus(orderId) {
  try {
    console.log("🔍 Checking payment status...");

    const response = await fetch(
      `${API_BASE_URL}/api/payment-status/${orderId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch payment status");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Status check failed");
    }

    const payment = data.payment;

    console.log("💾 Payment Status:", payment.status);

    if (payment.status === "success") {
      showMessage(
        "✅ Payment successful! Your order has been confirmed.",
        "success"
      );
      displayPaymentDetails(payment);
      paymentForm.reset();
      updateButtonText();
    } else if (payment.status === "failed") {
      showMessage("❌ Payment failed! Please try again.", "error");
      displayPaymentDetails(payment);
    } else if (payment.status === "pending") {
      showMessage(
        "⏳ Payment is being processed... Please wait a moment.",
        "info"
      );
      // Retry after 2 seconds
      setTimeout(() => checkPaymentStatus(orderId), 2000);
    }
  } catch (error) {
    console.error("❌ Status Check Error:", error);
    showMessage(
      "⚠️ Could not verify payment. Please contact support.",
      "error"
    );
  }
}

// ========================================
// DISPLAY PAYMENT DETAILS
// ========================================
function displayPaymentDetails(payment) {
  statusSection.style.display = "block";

  const statusClass =
    payment.status === "success"
      ? "success"
      : payment.status === "failed"
      ? "failed"
      : "pending";

  statusContent.innerHTML = `
    <h4>Payment Details</h4>
    <p><strong>Order ID:</strong> ${payment.order_id}</p>
    <p><strong>Payment ID:</strong> ${payment.payment_id || "N/A"}</p>
    <p><strong>Amount:</strong> ₹${payment.amount}</p>
    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${payment.status.toUpperCase()}</span></p>
    <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleString()}</p>
  `;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";
}

function hideMessage() {
  messageDiv.style.display = "none";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  updateButtonText();
  console.log("🚀 Payment Form Ready");
  console.log(`📡 API URL: ${API_BASE_URL}`);
});
