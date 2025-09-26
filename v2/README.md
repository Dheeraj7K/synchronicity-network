# V2 - Global Wholesale Shipment Tracker & Ad Marketplace

## ✅ Backend Complete!

Full production-ready backend with:
- ✅ User authentication (JWT)
- ✅ Subscription management (Stripe)
- ✅ Shipment tracking API
- ✅ Ad marketplace with impression/click tracking
- ✅ Lead generation system
- ✅ Real-time WebSocket sync
- ✅ Revenue sharing calculations
- ✅ Security (rate limiting, validation, helmet)

## 🚀 What's Built

### Backend (`/server`)
- **Authentication**: Registration, login, JWT tokens
- **Users**: Free/Plus/Pro/Enterprise plans
- **Shipments**: Track products from origin → destination
- **Ads**: Create campaigns, track impressions/clicks
- **Leads**: Capture inquiries, CRM features
- **Payments**: Stripe subscriptions & ad credits
- **WebSocket**: Real-time shipment updates

### API Endpoints

**Auth**
- POST `/api/auth/register` - Sign up
- POST `/api/auth/login` - Sign in
- GET `/api/auth/me` - Get current user

**Shipments**
- GET `/api/shipments` - List all shipments
- GET `/api/shipments/my` - My shipments
- POST `/api/shipments` - Create shipment (Plus+ only)
- PUT `/api/shipments/:id` - Update shipment
- DELETE `/api/shipments/:id` - Deactivate shipment

**Ads**
- GET `/api/ads/match` - Get matching ads
- GET `/api/ads/my` - My ad campaigns
- POST `/api/ads` - Create ad campaign
- POST `/api/ads/:id/impression` - Record impression
- POST `/api/ads/:id/click` - Record click

**Leads**
- GET `/api/leads/my` - My leads
- POST `/api/leads` - Create lead
- PUT `/api/leads/:id/status` - Update lead status

**Payments**
- POST `/api/payments/create-checkout-session` - Subscribe to plan
- POST `/api/payments/buy-credits` - Buy ad credits
- POST `/api/payments/webhook` - Stripe webhooks
- POST `/api/payments/cancel-subscription` - Cancel plan

## 📦 Frontend Status

**Status**: Ready to build

The frontend will include:
- 🌍 3D globe with animated shipment routes
- 🔐 Login/signup pages
- 📊 Dashboard (shipments, ads, leads, revenue)
- 📍 Create shipment form
- 📢 Create ad campaign form
- 💰 Pricing page with Stripe checkout
- 📈 Analytics & reporting

## 🎯 Quick Start

### 1. Install Dependencies
```bash
cd v2/server
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB, Stripe, and JWT secret
```

### 3. Start Server
```bash
npm start
```

Server runs on `http://localhost:3001`

## 💳 Stripe Setup

### Get Stripe Keys
1. Go to https://dashboard.stripe.com
2. Get your Secret Key
3. Create Products:
   - **Plus Plan**: $20/month recurring
   - **Pro Plan**: $200/month recurring
4. Get Price IDs
5. Set up webhook endpoint: `/api/payments/webhook`
6. Add keys to `.env`

## 🗄️ Database Models

### User
- Email, password (bcrypt hashed)
- Role: wholesaler/seller/admin
- Plan: free/plus/pro/enterprise
- Stripe customer & subscription IDs
- Ad credits balance

### Shipment
- User ID (owner)
- Title, description, product details
- Origin & destination (lat/lon)
- Status: pending/in_transit/delivered
- Progress (0-100%)
- Views, clicks, ad revenue
- Ads enabled flag

### Ad
- User ID (advertiser)
- Campaign details (title, image, URL)
- Targeting (categories, countries)
- Budget & pricing (CPM/CPC)
- Impressions, clicks, leads
- Status: draft/active/paused/completed

### Lead
- Ad ID, Shipment ID
- Wholesaler ID, Seller ID
- Contact info (name, email, phone)
- Type: wholesale_inquiry/quote_request
- Status: new/contacted/qualified/converted
- Notes array

## 🔒 Security Features

- ✅ JWT authentication with 30-day expiry
- ✅ Password hashing with bcryptjs (12 rounds)
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ Input validation on all routes
- ✅ Plan-based access control
- ✅ Stripe webhook signature verification
- ✅ IP address logging for leads

## 💰 Revenue Model Implementation

### Subscription Plans
- **Free**: View only, no hosting
- **Plus ($20/mo)**: Unlimited shipments + 70% ad revenue share
- **Pro ($200/mo)**: Everything + 80% ad revenue share + API access
- **Enterprise ($2K+/mo)**: Custom + up to 90% revenue share

### Ad Credits
- Sellers buy credits starting at $20
- Used for impressions (CPM) or clicks (CPC)
- Automatic budget tracking
- Campaign pauses when budget exhausted
- Refunds for unused credits

### Revenue Sharing
When ad displays on shipment:
1. Ad records impression/click
2. Cost deducted from ad budget
3. Revenue calculated based on CPM/CPC
4. Wholesaler's share calculated (70/80/85%)
5. Added to shipment's `adRevenue` field
6. Wholesaler can withdraw/view earnings

## 📊 Example Revenue Flow

**Scenario**: Plus user with 50K monthly views
- 10 ads display @ $20 CPM
- Total ad spend: $100
- Platform keeps 30%: $30
- Wholesaler earns 70%: $70
- Wholesaler profit: $70 - $20 subscription = **$50/month**

**Scenario**: Pro user with 500K monthly views
- 50 ads display @ $15 CPM
- Total ad spend: $750
- Platform keeps 20%: $150
- Wholesaler earns 80%: $600
- Wholesaler profit: $600 - $200 subscription = **$400/month**

## 🚀 Deployment

### MongoDB Atlas
1. Create free cluster
2. Get connection string
3. Add to `.env`

### Railway/Render
1. Connect GitHub repo
2. Set root directory to `v2/server`
3. Add environment variables
4. Deploy!

### Frontend (GitHub Pages)
1. Build frontend HTML/JS
2. Push to `v2` branch
3. Enable Pages

## 📝 Next Steps

1. ✅ Backend - COMPLETE
2. ⏳ Frontend - Ready to build
3. ⏳ Deployment - Ready when frontend done
4. ⏳ Stripe setup - Need production keys
5. ⏳ Marketing site - Optional

## 🎉 What You Can Do Now

With the backend complete, you can:
- Test all API endpoints with Postman/Insomnia
- Set up Stripe in test mode
- Create MongoDB database
- Deploy backend to Railway/Render
- Start building frontend

## 💡 Frontend Build Options

**Option A**: I build a complete web app (2-3 hours)
- Full dashboard, globe visualization, all features
- Production-ready UI

**Option B**: I build a simple MVP (30 min)
- Basic forms, simple list views
- Get it working fast, improve later

**Option C**: You use the API directly
- Build your own frontend
- Use any framework (React, Vue, etc.)

Which option do you want? 🚀