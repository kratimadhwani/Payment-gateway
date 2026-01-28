# 🎬 Quick Start (5 Minutes)

If you just want to **GET STARTED IMMEDIATELY** without reading docs:

## Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

## Step 2: Create `.env` file in `backend/`
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxx
PORT=5000
NODE_ENV=development
```

⚠️ **Get these from:**
- Razorpay: https://dashboard.razorpay.com → Settings → API Keys
- Supabase: https://supabase.com → Project → Settings → API

## Step 3: Setup Supabase Database
1. Go to https://supabase.com
2. Open your project
3. SQL Editor → Create new query
4. Copy-paste from `database/supabase_schema.sql`
5. Click "Run"

## Step 4: Start Backend
```bash
cd backend
npm start
```

Backend ready: `http://localhost:5000`

## Step 5: Open Frontend
Open `frontend/index.html` in browser OR:

```bash
cd frontend
python -m http.server 3000
```

Frontend: `http://localhost:3000`

## Step 6: Test Payment

1. Fill the form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 9876543210
   - Amount: 500

2. Click "Pay ₹500"

3. Use test card:
   - Number: `4111 1111 1111 1111`
   - Expiry: `12/25`
   - CVV: `123`
   - OTP: `123456`

4. ✅ Check Supabase → payments table for success

---

## 🚨 Common Issues

### "Cannot connect to Supabase"
- Check SUPABASE_URL and SUPABASE_KEY in .env
- Verify internet connection

### "Razorpay modal doesn't open"
- Check RAZORPAY_KEY_ID in .env
- Open browser console (F12) for errors

### "Payment shows 'pending' forever"
- Webhook not setup (local testing only - use ngrok)
- Refresh page after 5 seconds

---

## 📚 Need More Help?

- **Full Setup**: Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Code Explanation**: Read [CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md)
- **Deploy to Production**: Read [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project Overview**: Read [README.md](README.md)

---

**That's it! You're ready to test payments! 🚀**
