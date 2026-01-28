# Razorpay Payment Gateway

Complete, production-ready payment gateway implementation with Razorpay, Supabase, and Webhooks.

## 📁 Project Structure

```
payment-2/
├── backend/                    # Node.js + Express server
│   ├── server.js              # Main application file
│   ├── package.json           # Dependencies
│   └── .env.example           # Environment template
│
├── frontend/                   # HTML + JS payment form
│   ├── index.html             # Payment form
│   ├── styles.css             # Styling
│   └── script.js              # Payment logic
│
├── database/                   # Supabase setup
│   └── supabase_schema.sql    # Database tables
│
└── SETUP_GUIDE.md             # Complete setup instructions
```

## ⚡ Quick Start

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Razorpay & Supabase credentials
```

### 3. Setup Supabase
- Run SQL from `database/supabase_schema.sql`

### 4. Start Backend
```bash
npm start
# Backend runs on http://localhost:5000
```

### 5. Open Frontend
- Open `frontend/index.html` in browser
- Or serve with: `python -m http.server 3000` (port 3000)

## 🔑 Key Features

✅ **Secure Payment Processing**
- Razorpay integration
- HMAC-SHA256 webhook signature verification
- Secure credential management

✅ **Database Schema**
- Customers table
- Payments table with status tracking
- Webhook logs for debugging
- Refunds table (optional)

✅ **API Endpoints**
- POST `/api/create-order` - Create payment order
- POST `/webhook` - Razorpay webhook handler
- GET `/api/payment-status/:orderId` - Check payment status
- GET `/api/payments` - List all payments

✅ **Frontend**
- Beautiful responsive form
- Real-time payment status updates
- Error handling & validation
- Mobile-friendly design

## 🔄 Payment Flow

```
Form Submission
    ↓
Create Order (Backend)
    ↓
Save to Supabase (pending)
    ↓
Open Razorpay Checkout
    ↓
User Completes Payment
    ↓
Webhook Verification
    ↓
Update Supabase (success)
    ↓
Show Confirmation
```

## 📚 Full Documentation

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for:
- Complete setup instructions
- API documentation
- Testing with test cards
- Webhook configuration
- Production deployment
- Troubleshooting
- Interview tips

## 🧪 Testing

### Test Card (Success)
- Number: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`

### Test Card (Failure)
- Number: `4111 1111 1111 1112`
- Same expiry & CVV

## 🔐 Security

- ✅ Environment-based configuration
- ✅ Webhook signature verification
- ✅ Backend-only payment verification
- ✅ CORS protection
- ✅ Database-level status updates

## 🚀 Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Payment | Razorpay |
| Security | HMAC-SHA256 |

## 📞 Support

For issues, check the [Troubleshooting](SETUP_GUIDE.md#-troubleshooting) section in SETUP_GUIDE.md

---

**Ready to deploy? Start with the [SETUP_GUIDE.md](SETUP_GUIDE.md)** 🚀
