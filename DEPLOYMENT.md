<!-- Example of hosting this locally -->

# 🏠 Running Locally

## Prerequisites
- Node.js 16+
- Python 3+ or http-server

## Start Backend

```bash
cd backend
npm install
npm start
```

Server: http://localhost:5000

## Start Frontend

### Option 1: Python
```bash
cd frontend
python -m http.server 3000
```

### Option 2: Node http-server
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

Frontend: http://localhost:3000

## Test Webhooks Locally

Install ngrok: https://ngrok.com

```bash
ngrok http 5000
```

Update webhook URL in Razorpay dashboard with ngrok URL.

---

# 🌐 Deploying to Production

## Option 1: Heroku

```bash
# Create Procfile in backend
echo "web: npm start" > backend/Procfile

# Login & deploy
heroku login
heroku create razorpay-gateway
git push heroku main

# Set environment variables
heroku config:set RAZORPAY_KEY_ID=xxx
heroku config:set RAZORPAY_KEY_SECRET=xxx
...
```

## Option 2: Railway

1. Connect GitHub repo
2. Select `backend/` directory
3. Add environment variables
4. Deploy!

## Option 3: Vercel (Frontend)

1. Connect `frontend/` to Vercel
2. Update API_BASE_URL in script.js
3. Deploy!

## Option 4: Docker

Create `backend/Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t razorpay-gateway .
docker run -p 5000:5000 razorpay-gateway
```

---

# 🔧 Environment Variables

### Development (.env)
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
PORT=5000
NODE_ENV=development
```

### Production (Heroku/Railway)
```
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
SUPABASE_URL=https://prod-xxx.supabase.co
SUPABASE_KEY=xxx
PORT=5000
NODE_ENV=production
```

---

# 📊 Monitoring

## Supabase
- View payments: https://supabase.com → Projects → payments table
- Check logs: Database → Query Performance
- Monitor webhooks: webhook_logs table

## Razorpay
- Dashboard: https://dashboard.razorpay.com
- Payment details: Go to Payments section
- Webhook status: Settings → Webhooks → View delivery

---

Done! 🎉
