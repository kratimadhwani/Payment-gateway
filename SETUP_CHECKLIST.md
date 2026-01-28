# ✅ Setup Checklist

Use this to track your setup progress. Check off each item as you complete it.

---

## 📋 Pre-Setup Requirements

- [ ] Node.js installed (v16+)
- [ ] Razorpay account created (https://razorpay.com)
- [ ] Supabase account created (https://supabase.com)
- [ ] Text editor or IDE (VS Code recommended)
- [ ] Internet connection

---

## 🔑 Step 1: Get Razorpay Credentials

- [ ] Go to https://dashboard.razorpay.com
- [ ] Login to account
- [ ] Go to Settings → API Keys
- [ ] Copy **Key ID** (public key)
- [ ] Copy **Key Secret** (keep private!)
- [ ] Note down both values

---

## 🗄️ Step 2: Get Supabase Credentials

- [ ] Go to https://supabase.com
- [ ] Login to account
- [ ] Create new project (or use existing)
- [ ] Wait for project to initialize
- [ ] Go to Project Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **Public API Key** (labeled as "Key")
- [ ] Note down both values

---

## 💻 Step 3: Setup Backend

- [ ] Navigate to `backend/` folder
- [ ] Run `npm install`
- [ ] Create `.env` file in `backend/` folder
- [ ] Fill in all values:
  ```
  RAZORPAY_KEY_ID=<your key id>
  RAZORPAY_KEY_SECRET=<your key secret>
  RAZORPAY_WEBHOOK_SECRET=webhook_secret_12345
  SUPABASE_URL=<your project url>
  SUPABASE_KEY=<your public key>
  PORT=5000
  NODE_ENV=development
  ```
- [ ] Save `.env` file
- [ ] Run `npm start`
- [ ] Verify backend starts (no errors)
- [ ] Open http://localhost:5000 in browser (should show API info)

---

## 💾 Step 4: Setup Supabase Database

- [ ] Go to https://supabase.com
- [ ] Open your project
- [ ] Go to SQL Editor
- [ ] Click "New Query"
- [ ] Open file: `database/supabase_schema.sql`
- [ ] Copy entire file content
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" button
- [ ] Wait for query to complete (should see "Success")
- [ ] Go to "Table Editor" in Supabase
- [ ] Verify 4 tables exist:
  - [ ] `customers`
  - [ ] `payments`
  - [ ] `webhook_logs`
  - [ ] `refunds`

---

## 🎨 Step 5: Setup Frontend

- [ ] Open `frontend/index.html` in browser, OR
- [ ] Go to `frontend/` folder
- [ ] Run: `python -m http.server 3000`
- [ ] Open http://localhost:3000 in browser
- [ ] Verify form loads with:
  - [ ] Name field
  - [ ] Email field
  - [ ] Phone field
  - [ ] Amount field
  - [ ] Description field
  - [ ] "Pay" button

---

## 🧪 Step 6: Test Payment Flow

- [ ] Fill form with test data:
  - [ ] Name: "Test User"
  - [ ] Email: "test@example.com"
  - [ ] Phone: "9876543210"
  - [ ] Amount: "500"
- [ ] Click "Pay ₹500" button
- [ ] Razorpay modal should open
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Expiry: `12/25`
- [ ] CVV: `123`
- [ ] OTP: `123456`
- [ ] Click "Pay" in modal
- [ ] Wait for confirmation (may take 2-5 seconds)
- [ ] Frontend should show "Payment successful"
- [ ] Check Supabase:
  - [ ] Go to "Table Editor"
  - [ ] Click "payments" table
  - [ ] Verify new record with:
    - [ ] `order_id`: populated
    - [ ] `payment_id`: populated
    - [ ] `status`: "success"
    - [ ] `amount`: 500

---

## 🔐 Step 7: Webhook Setup (For Production)

This is only needed for production/ngrok testing:

- [ ] Download ngrok: https://ngrok.com
- [ ] Run: `ngrok http 5000`
- [ ] Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
- [ ] Go to Razorpay Dashboard → Settings → Webhooks
- [ ] Add new webhook:
  - [ ] URL: `https://abc123.ngrok.io/webhook`
  - [ ] Select events:
    - [ ] `payment.authorized`
    - [ ] `payment.captured`
    - [ ] `payment.failed`
  - [ ] Copy webhook secret
  - [ ] Update `.env`:
    ```
    RAZORPAY_WEBHOOK_SECRET=<webhook_secret>
    ```
- [ ] Restart backend: `npm start`

---

## 📚 Step 8: Read Documentation

- [ ] [START_HERE.md](START_HERE.md) - Overview
- [ ] [QUICK_START.md](QUICK_START.md) - 5-minute guide
- [ ] [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md) - Understand code
- [ ] [INTERVIEW_QA.md](INTERVIEW_QA.md) - Interview prep
- [ ] [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete guide
- [ ] [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

---

## 🔍 Verification Checklist

### Backend
- [ ] `npm start` runs without errors
- [ ] `http://localhost:5000` responds with API info
- [ ] POST `/api/create-order` returns order details
- [ ] GET `/api/payment-status/:orderId` returns payment status

### Frontend
- [ ] Form displays correctly
- [ ] Form validation works
- [ ] "Pay" button opens Razorpay modal
- [ ] Payment can be completed

### Database (Supabase)
- [ ] `customers` table has new customer record
- [ ] `payments` table has payment record
- [ ] Payment status is "success" after payment
- [ ] `payment_id` is populated

### Security
- [ ] `.env` file is created
- [ ] `.env` is in `.gitignore` (not committed)
- [ ] No secrets in code
- [ ] Webhook signature verification works

---

## 🚀 Success Criteria

All of the following should be ✅:

- [ ] Backend starts without errors
- [ ] Frontend form displays
- [ ] Can fill and submit form
- [ ] Razorpay modal opens
- [ ] Can complete test payment
- [ ] Supabase shows successful payment
- [ ] Frontend shows confirmation
- [ ] All 4 database tables created

---

## 🎯 Next Steps (After Success)

### Immediate
- [ ] Test with failed payment (card ending in 1112)
- [ ] Test payment reconciliation
- [ ] Review webhook logs in Supabase

### This Week
- [ ] Study [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md)
- [ ] Review [INTERVIEW_QA.md](INTERVIEW_QA.md)
- [ ] Test edge cases

### For Production
- [ ] Follow [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Setup monitoring
- [ ] Configure alerts
- [ ] Add email notifications

---

## 📞 Troubleshooting

### Backend won't start
- [ ] Check Node.js version: `node --version` (need v16+)
- [ ] Check `.env` file exists in `backend/` folder
- [ ] Check all `.env` values are filled
- [ ] Check port 5000 is not in use
- [ ] Clear node_modules: `rm -rf node_modules` then `npm install`

### Frontend won't open
- [ ] Check port 3000 is not in use
- [ ] Check `frontend/index.html` exists
- [ ] Try different browser (Chrome recommended)
- [ ] Check browser console for JavaScript errors (F12)

### Razorpay modal doesn't open
- [ ] Check RAZORPAY_KEY_ID is correct
- [ ] Check backend is running
- [ ] Check browser console for errors (F12)
- [ ] Verify order was created on backend

### Payment stuck on "pending"
- [ ] Refresh page (wait 5 seconds first)
- [ ] Check Supabase directly
- [ ] For webhooks, verify ngrok URL is correct
- [ ] Check backend logs for errors

### Supabase connection error
- [ ] Check SUPABASE_URL is correct
- [ ] Check SUPABASE_KEY is correct (public key, not secret)
- [ ] Check internet connection
- [ ] Verify Supabase project is active

---

## 💡 Pro Tips

- ✅ Keep browser developer console open (F12) while testing
- ✅ Check backend terminal for error logs
- ✅ Check Supabase "Webhooks" tab to see webhook deliveries
- ✅ Use test cards provided (don't use real cards)
- ✅ Razorpay webhook secret starts with "whsec_" in production
- ✅ For local development, webhook secret can be anything

---

## 📝 Notes

Use this space to note down your credentials (keep private!):

```
Razorpay Key ID: ________________
Razorpay Key Secret: ________________
Razorpay Webhook Secret: ________________
Supabase URL: ________________
Supabase Key: ________________
ngrok URL (if using): ________________
```

---

## ✨ You're Ready!

When all checkboxes are ✅, you have:
- ✅ Working payment gateway
- ✅ Database configured
- ✅ Frontend & backend integrated
- ✅ Real payment processing ready

**Congratulations! 🎉**

Next: Follow [INTERVIEW_QA.md](INTERVIEW_QA.md) to prepare for interviews!

---

**Need help? Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed explanations.**
