# 💡 Interview Q&A - Razorpay Payment Gateway

Common questions interviewers ask about payment systems. Use this to prepare! 🎯

---

## ⭐ Most Important Questions

### Q1: Why do you need a backend to create orders? Can't frontend do it?

**Bad Answer:** "It's just how it works."

**GOOD Answer:**
> "No, because frontend is compromised. When I open DevTools, I can modify any value:
> - Change amount from ₹500 to ₹50
> - Skip payment entirely
> 
> Only the backend is trusted because:
> - Backend code is on our server
> - Users can't modify it
> - We validate all inputs server-side
>
> So, the flow is:
> 1. Frontend sends `{name, email, amount}`
> 2. Backend creates Razorpay order with `amount` from database (not frontend)
> 3. Backend returns order details
> 4. Frontend can't change the amount anymore
> 5. Payment happens with backend-verified amount"

---

### Q2: What would happen if you allowed frontend to handle payment status?

**Bad Answer:** "It would be insecure."

**GOOD Answer:**
> "Disaster! Here's the attack:
>
> ```javascript
> // ❌ WRONG - Frontend decides
> handler: function() {
>   updateStatus('success'); // I can fake this!
> }
> ```
>
> Attack:
> 1. Attacker opens DevTools
> 2. Finds updateStatus() function
> 3. Manually calls: `updateStatus('success')`
> 4. Payment marked success without paying
> 5. Database shows payment success
> 6. Attacker gets free product
>
> Solution: Only backend updates via webhook
> ```javascript
> handler: function() {
>   // Don't do anything! Just show 'verifying...'
>   checkPaymentStatus(); // Ask backend
> }
> ```
> Backend has cryptographically signed webhook from Razorpay, so it's authentic."

---

### Q3: Why webhook? Why not just call payment status API?

**Bad Answer:** "Webhooks are more secure."

**GOOD Answer:**
> "Good question! Both approaches are secure, but webhooks are better for this flow:
>
> **Approach 1: Frontend polls**
> ```
> Payment happens
> → Frontend asks: 'Hey, am I paid?'
> → Backend checks: 'Hmm, let me ask Razorpay'
> → Razorpay checks: 'Yes, they paid'
> → Takes 2-5 seconds
> → Bad UX: user sees 'processing...'
> ```
>
> **Approach 2: Webhook (what we use)**
> ```
> Payment happens
> → Razorpay immediately tells backend: 'They paid!'
> → Backend updates database instantly
> → Frontend polls and gets 'success'
> → Takes <1 second
> → Good UX: instant confirmation
> ```
>
> Webhooks are:
> - Faster (push vs pull)
> - More reliable (Razorpay retries if failed)
> - Scalable (backend pulls data once)
> - Real-time (instant notification)"

---

### Q4: How do you prevent someone from sending a fake webhook?

**Bad Answer:** "We check the order_id."

**GOOD Answer:**
> "We verify the HMAC-SHA256 signature. Here's how:
>
> **How it works:**
> 1. Razorpay and we share a secret key (only we two know)
> 2. Razorpay creates event: `{order_id: 123, status: 'success'}`
> 3. Razorpay signs it: `signature = HMAC-SHA256(secret, body)`
> 4. Razorpay sends: `body + signature`
>
> **On our backend:**
> 5. We receive: `body + signature`
> 6. We compute: `expected = HMAC-SHA256(secret, body)`
> 7. We compare: `signature == expected?`
>
> **Example:**
> - If hacker sends fake webhook without secret:
>   - Hacker's signature won't match
>   - We reject it ✅
>
> - If hacker tries to guess secret:
>   - Cryptographically impossible (2^256 possibilities)
>   - HMAC takes milliseconds to brute-force check
>   - Razorpay uses rate limiting
>
> **Code:**
> ```javascript
> const signature = req.headers['x-razorpay-signature'];
> const body = req.body.toString();
> const expected = crypto
>   .createHmac('sha256', WEBHOOK_SECRET)
>   .update(body)
>   .digest('hex');
> 
> if (signature !== expected) {
>   return res.status(400).json({error: 'Invalid signature'});
> }
> // Safe to proceed - this is real from Razorpay
> ```"

---

### Q5: What if webhook arrives twice?

**Bad Answer:** "We handle it by checking if payment exists."

**GOOD Answer:**
> "Great question about idempotency!
>
> **Scenario:** Razorpay sends webhook twice (network retry)
> ```
> Webhook 1: UPDATE payments SET status='success' WHERE order_id='123'
> Webhook 2: UPDATE payments SET status='success' WHERE order_id='123'
> ```
>
> **What happens:**
> 1. First webhook: `pending` → `success`
> 2. Second webhook: `success` → `success` (no change)
> 3. Database is still correct ✅
>
> **Why it's safe:**
> - We update based on `order_id`
> - Setting `status='success'` twice is harmless
> - It's idempotent (same operation = same result)
>
> **If we did it wrong (without idempotency):**
> ```javascript
> // ❌ BAD: Increments counter
> UPDATE payments SET count = count + 1
> ```
> - First webhook: `count: 1`
> - Second webhook: `count: 2` ← WRONG!
>
> **Best practice:**
> ```javascript
> // ✅ GOOD: Set absolute value
> UPDATE payments SET status='success'
> WHERE order_id = '123'
> ```"

---

### Q6: How do you handle payment failures?

**Bad Answer:** "We mark status as 'failed'."

**GOOD Answer:**
> "We handle multiple failure scenarios:
>
> **1. Razorpay sends payment.failed webhook**
> ```javascript
> if (event.event === 'payment.failed') {
>   UPDATE payments SET status='failed'
> }
> ```
>
> **2. User closes payment modal**
> - Frontend polls backend
> - Status still 'pending'
> - Frontend shows: 'Payment not completed'
> - User can retry
>
> **3. Network error during webhook**
> - Razorpay retries automatically
> - We handle idempotently (safe if called twice)
>
> **4. Payment timeout (>30 seconds)**
> - Frontend stops polling
> - Shows message: 'Payment processing, check email'
> - User can manually check order status
> - In production, send email notification
>
> **Database states:**
> | State | Meaning | Action |
> |-------|---------|--------|
> | pending | Awaiting payment | User can retry |
> | success | Payment confirmed | Deliver product |
> | failed | Payment rejected | Offer retry |"

---

## 🔐 Security Questions

### Q7: What if someone gets your webhook secret?

**GOOD Answer:**
> "If webhook secret is leaked:
>
> 1. **Immediate action:**
>    - Rotate webhook secret in Razorpay dashboard
>    - Old secret becomes invalid
>
> 2. **What they can do with old secret:**
>    - Send fake webhooks with valid signatures
>    - Mark payments as success/failed
>    - Cause database corruption
>
> 3. **Why we're protected:**
>    - Signature change requires re-signing with NEW secret
>    - Old webhooks are rejected immediately
>    - All existing webhooks from Razorpay use new secret
>
> 4. **Prevention:**
>    - Never hardcode secret in code
>    - Use environment variables
>    - Don't commit .env file
>    - Rotate secrets monthly
>    - Monitor webhook delivery logs"

---

### Q8: How do you prevent SQL injection in this project?

**GOOD Answer:**
> "We use parameterized queries with Supabase JS SDK:
>
> ```javascript
> // ✅ SAFE: Parameterized
> await supabase
>   .from('payments')
>   .update({ status: 'success' })
>   .eq('order_id', orderId); // Parameter binding
>
> // ❌ UNSAFE: String concatenation
> const query = `UPDATE payments SET status='success' 
>                WHERE order_id='${orderId}'`;
> ```
>
> Supabase SDK handles:
> - Parameter escaping
> - Prepared statements
> - Type checking
> - SQL injection prevention"

---

## 🎯 Scaling & Performance

### Q9: How would you scale this for 10 million payments/month?

**GOOD Answer:**
> "Current bottlenecks and solutions:
>
> **1. Webhook processing (I/O bottleneck)**
> ```javascript
> // Currently: sequential
> await supabase.update(...) // Wait 100ms
>
> // Solution: Use queue
> queue.add({event, orderId})
> return 200 OK immediately
> // Process in background
> ```
>
> **2. Database writes (lock contention)**
> - Current: Direct update
> - Solution: Use background job workers
>   - Multiple workers process queue
>   - Reduces lock time
>   - Scales to 100K+ webhooks/sec
>
> **3. Payment status polling (too many reads)**
> - Current: Frontend polls every 2 seconds
> - Solution: WebSockets
>   - Backend pushes status update
>   - Frontend shows immediately
>   - Reduces database reads by 90%
>   - Use Socket.io or native WebSocket
>
> **4. Cache payment status**
> ```javascript
> // Add Redis cache
> const status = await redis.get(`payment:${orderId}`)
> if (!status) {
>   const data = await supabase.fetch(...)
>   await redis.set(`payment:${orderId}`, data, 300) // 5 min TTL
> }
> return status
> ```
>
> **5. Load balance backend**
> - Nginx/HAProxy in front
> - Multiple Node.js processes
> - Shared Redis for cache
> - Supabase handles database replication
>
> **Final architecture:**
> ```
> Frontend
>   ↓
> Nginx (load balancer)
>   ↓
> API Servers (×4)  → Redis Cache
>   ↓
> Message Queue (Bull/RabbitMQ)
>   ↓
> Workers (×8)
>   ↓
> Supabase (replicated)
> ```
> This handles 10M payments/month easily."

---

### Q10: How do you ensure payment consistency across microservices?

**GOOD Answer:**
> "If this was in microservices:
>
> **Problem:** Payment service, inventory service, etc.
>
> **Solution: Saga pattern**
> ```
> 1. Payment service: Create order (pending)
> 2. Inventory service: Reserve stock
> 3. Order service: Create order
> 4. Webhook: Payment success
> 5. Update all services: success
>
> If step 2 fails:
> - Rollback step 1 (refund)
> - Release stock
> - Mark order as failed
> ```
>
> **Implementation:**
> - Use choreography (event-based)
> - Or orchestration (central coordinator)
> - Distributed transactions are hard
> - Each service tracks its part
> - Event sourcing for audit trail"

---

## 🚀 Advanced Scenarios

### Q11: How do you handle payment reconciliation?

**GOOD Answer:**
> "Nightly reconciliation job:
>
> ```javascript
> // Every night at 2 AM
> async function reconcilePayments() {
>   // Get all 'pending' payments older than 1 hour
>   const stale = await supabase
>     .from('payments')
>     .select()
>     .eq('status', 'pending')
>     .lt('created_at', now - 1hour)
>
>   for (const payment of stale) {
>     // Check actual status from Razorpay API
>     const razorpayStatus = await razorpay.payments.fetch(
>       payment.payment_id
>     )
>
>     // If Razorpay says success but DB says pending
>     if (razorpayStatus.status === 'captured') {
>       // Our webhook failed, update now
>       await supabase
>         .from('payments')
>         .update({status: 'success'})
>         .eq('id', payment.id)
>     }
>
>     // If older than 24 hours and still pending
>     if (payment.created_at < now - 24hours) {
>       // Mark as failed, send user email
>       await supabase
>         .from('payments')
>         .update({status: 'failed'})
>         .eq('id', payment.id)
>       
>       sendEmail(payment.customer_email, 'Payment Timeout')
>     }
>   }
> }
>
> // Schedule daily
> schedule.scheduleJob('0 2 * * *', reconcilePayments)
> ```"

---

### Q12: How do you implement refunds?

**GOOD Answer:**
> "Create refund flow:
>
> **Database:**
> ```sql
> CREATE TABLE refunds (
>   id UUID,
>   payment_id TEXT,
>   amount INT,
>   status TEXT,
>   created_at TIMESTAMP
> )
> ```
>
> **Backend API:**
> ```javascript
> POST /api/refund/{paymentId}
>
> 1. Check if payment_id exists and status='success'
> 2. Call Razorpay refund API
> 3. Create refund record (status='pending')
> 4. Return refund_id to frontend
> 5. Listen for refund webhook
> 6. Update refund status='success'
> 7. Update payment status='refunded'
> ```
>
> **Webhook for refund.created:**
> ```javascript
> if (event.event === 'refund.created') {
>   const refundId = event.payload.refund.entity.id
>   const paymentId = event.payload.refund.entity.payment_id
>   
>   await supabase
>     .from('refunds')
>     .update({status: 'success'})
>     .eq('payment_id', paymentId)
>   
>   await supabase
>     .from('payments')
>     .update({status: 'refunded'})
>     .eq('payment_id', paymentId)
> }
> ```"

---

## 🎓 General Questions

### Q13: What are common payment gateway providers?

**GOOD Answer:**
> "Popular options:
>
> | Provider | Region | Fees | Best For |
> |----------|--------|------|----------|
> | Razorpay | India | 2% | Indian startups |
> | Stripe | Global | 2.9% + $0.30 | US/Global |
> | PayPal | Global | 2.9% + $0.30 | General |
> | Square | US | 2.6% | Retail |
> | 2Checkout | Global | 3.5% | International |
>
> **Razorpay advantages:**
> - Cheap in India
> - UPI support (unique to India)
> - Good API documentation
> - Fast webhook delivery"

---

### Q14: How do you test payment systems in development?

**GOOD Answer:**
> "Multiple approaches:
>
> **1. Test mode (what we use)**
> - Razorpay has test mode (rzp_test_xxx)
> - Use test cards (4111...)
> - No real charges
> - 100% realistic
>
> **2. Mock webhooks**
> - Manually send curl requests
> - Simulate webhook delivery
> - Good for edge cases
>
> **3. Integration tests**
> ```javascript
> test('payment succeeds', async () => {
>   const order = await createOrder({amount: 500})
>   // Simulate webhook
>   await simulateWebhook({
>     event: 'payment.captured',
>     order_id: order.id
>   })
>   // Check database
>   const payment = await getPayment(order.id)
>   expect(payment.status).toBe('success')
> })
> ```
>
> **4. Contract testing**
> - Test webhook signature verification
> - Test with wrong secret
> - Test with tampered body
>
> **5. E2E testing**
> - Use Puppeteer/Playwright
> - Automate browser
> - Fill form → submit payment
> - Verify database"

---

### Q15: What mistakes do you avoid?

**GOOD Answer:**
> "Common pitfalls I avoid:
>
> ❌ **Mistake 1:** Trusting frontend for payment status
> ✅ **Solution:** Backend + webhooks only
>
> ❌ **Mistake 2:** Not verifying webhook signature
> ✅ **Solution:** Always verify HMAC-SHA256
>
> ❌ **Mistake 3:** Failing when webhook processing fails
> ✅ **Solution:** Always return 200 OK, retry in queue
>
> ❌ **Mistake 4:** Hardcoding secrets
> ✅ **Solution:** Environment variables only
>
> ❌ **Mistake 5:** No payment reconciliation
> ✅ **Solution:** Nightly job to sync with Razorpay
>
> ❌ **Mistake 6:** Poor error handling
> ✅ **Solution:** Log everything, alert on failures
>
> ❌ **Mistake 7:** No timeout for pending payments
> ✅ **Solution:** Mark >24hr pending as failed
>
> ❌ **Mistake 8:** Not testing failure scenarios
> ✅ **Solution:** Test failed cards, network errors, etc."

---

## 📝 Quick Summary

**Most important points to remember:**

1. ✅ **Backend creates orders** (frontend can't be trusted)
2. ✅ **Webhooks verify payments** (only Razorpay can sign them)
3. ✅ **Signature verification** (HMAC-SHA256 prevents fakes)
4. ✅ **Database tracks status** (not frontend)
5. ✅ **Idempotent updates** (safe if webhook fires twice)
6. ✅ **Error handling** (always return 200 to webhooks)
7. ✅ **Reconciliation** (nightly sync with payment provider)

---

**You're ready to interview! Good luck! 🚀**
