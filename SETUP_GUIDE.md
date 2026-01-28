# 🚀 Razorpay Payment Gateway - Complete Setup Guide

## 📋 Project Overview

A complete payment gateway implementation with:
- **Frontend**: HTML + Vanilla JavaScript (Payment Form)
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Payment Processor**: Razorpay
- **Security**: Webhook signature verification

---

## 🔄 Payment Flow

```
1. User fills payment form
   ↓
2. Frontend calls /api/create-order
   ↓
3. Backend creates Razorpay Order + saves to Supabase (status: pending)
   ↓
4. Frontend opens Razorpay Checkout
   ↓
5. User completes payment
   ↓
6. Razorpay sends Webhook (signed)
   ↓
7. Backend verifies signature + updates Supabase (status: success)
   ↓
8. Frontend polls /api/payment-status
   ↓
9. Shows payment confirmation
```

---

## 🛠️ Prerequisites

1. **Node.js** (v16+)
2. **Razorpay Account** (free at https://razorpay.com)
3. **Supabase Account** (free at https://supabase.com)
4. **ngrok** (for webhook testing locally - https://ngrok.com)

---

## ⚙️ STEP-BY-STEP SETUP

### STEP 1️⃣: Setup Supabase Database

#### 1. Create Supabase Project
- Go to https://supabase.com
- Click "New Project"
- Enter project name, password, region
- Wait for project to be created
- Copy `SUPABASE_URL` and `SUPABASE_KEY` from Settings → API

#### 2. Create Database Tables
- Go to SQL Editor in Supabase
- Create new query
- Copy contents of `database/supabase_schema.sql`
- Run the query
- Tables created: `customers`, `payments`, `webhook_logs`, `refunds`

**Expected Tables:**

| Table | Columns |
|-------|---------|
| customers | id, name, email, phone, created_at |
| payments | id, order_id, payment_id, customer_id, amount, currency, status, description, created_at |
| webhook_logs | id, event_type, order_id, payload, status, created_at |
| refunds | id, payment_id, order_id, refund_id, amount, status, reason, created_at |

---

### STEP 2️⃣: Setup Razorpay Credentials

#### 1. Create Razorpay Account
- Go to https://razorpay.com
- Sign up → Create account
- Dashboard → Settings → API Keys

#### 2. Get API Keys
- You'll see:
  - `Key ID` (Public Key)
  - `Key Secret` (Private Key - keep SECRET!)

#### 3. Setup Webhook
- Go to Dashboard → Settings → Webhooks
- Add new webhook:
  - **URL**: `https://yourdomain.com/webhook` (use ngrok for testing)
  - **Events**: Check:
    - `payment.authorized`
    - `payment.captured`
    - `payment.failed`
  - **Secret**: Copy the webhook secret

---

### STEP 3️⃣: Setup Backend

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Create `.env` File
Copy `.env.example` to `.env` and fill in:

```env
# Razorpay Keys
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_public_key_here

# Server
PORT=5000
NODE_ENV=development
```

#### 3. Start Backend
```bash
npm start
# or for development with auto-reload:
npm install -g nodemon
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### STEP 4️⃣: Setup Frontend

#### 1. Serve Frontend Files
Navigate to `frontend/` and serve files:

**Option A: Using Python**
```bash
cd frontend
python -m http.server 3000
```

**Option B: Using Node (http-server)**
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

**Option C: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

Frontend runs at: `http://localhost:3000`

---

### STEP 5️⃣: Test Locally with ngrok (Webhook Testing)

Since webhooks need a public URL, use **ngrok**:

#### 1. Install ngrok
Download from: https://ngrok.com

#### 2. Expose Backend to Internet
```bash
# In a new terminal
ngrok http 5000
```

Output:
```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:5000
```

#### 3. Update Webhook URL
- Go to Razorpay Dashboard → Settings → Webhooks
- Update webhook URL to: `https://abc123def456.ngrok.io/webhook`

#### 4. Update Frontend API URL (if needed)
In `frontend/script.js`, change:
```javascript
const API_BASE_URL = "https://abc123def456.ngrok.io";
```

---

## 🧪 Testing Payment Flow

### 1. Open Frontend
Navigate to `http://localhost:3000` (or ngrok URL)

### 2. Fill Form
- **Name**: John Doe
- **Email**: john@example.com
- **Phone**: 9876543210
- **Amount**: 500 (₹500)

### 3. Click "Pay ₹500"

### 4. Use Razorpay Test Cards
In Razorpay checkout, use test credentials:

**Success Payment:**
- Card: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`
- OTP: `123456`

**Failed Payment:**
- Card: `4111 1111 1111 1112`
- Same expiry & CVV

### 5. Verify in Supabase
- Open Supabase → payments table
- Check if payment status is `success`
- Verify `payment_id` is populated

---

## 📡 API ENDPOINTS

### POST `/api/create-order`
**Purpose**: Create Razorpay order

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "amount": 500,
  "description": "Product purchase"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_abc123",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_abc123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210"
}
```

---

### POST `/webhook`
**Purpose**: Razorpay webhook handler

**Signature Verification:**
```
HMAC-SHA256(webhook_secret, body) == x-razorpay-signature
```

**Handles Events:**
- `payment.authorized` → Update to `success`
- `payment.captured` → Update to `success`
- `payment.failed` → Update to `failed`

---

### GET `/api/payment-status/:orderId`
**Purpose**: Check payment status

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "order_id": "order_abc123",
    "payment_id": "pay_abc123",
    "status": "success",
    "amount": 500,
    "created_at": "2024-01-28T10:30:00Z"
  }
}
```

---

### GET `/api/payments`
**Purpose**: Get all payments (admin)

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "order_id": "order_abc123",
      "payment_id": "pay_abc123",
      "customer_id": "uuid",
      "amount": 500,
      "status": "success",
      "created_at": "2024-01-28T10:30:00Z",
      "customers": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

## 🔐 Security Checklist

- ✅ **Webhook Signature Verification**: Verify HMAC-SHA256
- ✅ **Backend Order Creation**: Never trust frontend amounts
- ✅ **Database Status Update**: Only via webhook
- ✅ **Environment Variables**: Never hardcode secrets
- ✅ **HTTPS in Production**: All communication encrypted
- ✅ **CORS Configuration**: Restrict allowed origins

---

## 🚀 Production Deployment

### 1. Prepare Backend
```bash
# Update .env with production values
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx
SUPABASE_URL=https://prod-project.supabase.co
```

### 2. Deploy Backend
Options:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **Render**: Connect GitHub repo
- **AWS/Azure**: Use Docker container

### 3. Update Webhook URL
- Razorpay Dashboard → Webhooks
- Update to production domain: `https://yourdomain.com/webhook`

### 4. Update Frontend API URL
```javascript
const API_BASE_URL = "https://yourdomain.com";
```

### 5. Enable CORS
In `backend/server.js`:
```javascript
app.use(cors({
  origin: ["https://yourdomain.com"],
  credentials: true
}));
```

---

## 📊 Database Schema Visualization

```
┌─────────────────────────────┐
│      customers              │
├─────────────────────────────┤
│ id (uuid) [PK]              │
│ name (text)                 │
│ email (text) [UNIQUE]       │
│ phone (text)                │
│ created_at (timestamp)      │
└─────────────────────────────┘
           ↑
           │ (FK: customer_id)
           │
┌─────────────────────────────┐
│      payments               │
├─────────────────────────────┤
│ id (uuid) [PK]              │
│ order_id (text) [UNIQUE]    │
│ payment_id (text)           │
│ customer_id (uuid) [FK]     │
│ amount (int)                │
│ status (pending/success)    │
│ created_at (timestamp)      │
└─────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Supabase"
- ✅ Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- ✅ Verify API key is public (not secret)
- ✅ Check network connection

### Issue: "Webhook not received"
- ✅ Ensure ngrok URL is updated in Razorpay dashboard
- ✅ Check ngrok tunnel is active
- ✅ Verify webhook secret matches

### Issue: "Payment status stuck on 'pending'"
- ✅ Check backend logs for errors
- ✅ Verify HMAC signature matches
- ✅ Check Razorpay webhook delivery status

### Issue: "CORS error in frontend"
- ✅ Update `API_BASE_URL` to match backend URL
- ✅ Verify CORS is enabled in backend

---

## 💡 Interview Tips

**What would you say?**

1. **"Why webhooks?"**
   - Frontend can be manipulated (JavaScript is client-side)
   - Only backend + webhook signature is secure
   - Razorpay guarantees webhook delivery

2. **"Why signature verification?"**
   - Prevents fake webhook requests
   - Uses HMAC-SHA256 with shared secret
   - Ensures data integrity

3. **"How do you handle payment failures?"**
   - Update status to `failed` in database
   - Show error message to user
   - Allow retry

4. **"What about refunds?"**
   - Use Razorpay Refund API
   - Create refund record
   - Update payment status to `refunded`

5. **"How do you scale this?"**
   - Add payment queue (Bull, RabbitMQ)
   - Cache payment status (Redis)
   - Load balance servers
   - Use CDN for frontend

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Start Backend | `npm start` |
| Start Frontend | `http-server -p 3000` |
| Expose with ngrok | `ngrok http 5000` |
| View Supabase | https://supabase.com → Projects |
| Razorpay Dashboard | https://dashboard.razorpay.com |

---

## 🎯 Next Steps

1. ✅ Setup all credentials
2. ✅ Run database schema SQL
3. ✅ Start backend & frontend
4. ✅ Test payment flow
5. ✅ Deploy to production

---

**Happy Coding! 🚀**
