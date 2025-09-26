# 🌍 Collective Synchronicity Network

A real-time global platform for tracking synchronicity experiences. When you experience a synchronicity, click the pulse button and see who else around the world felt it at the same moment.

## 🎯 Features

- **3D Interactive Globe** - Real-time visualization of synchronicity pulses worldwide
- **Geolocation Tracking** - Captures your actual location (with permission)
- **Time-Based Clustering** - Groups people who experienced synchronicity simultaneously
- **Live Timeline** - Visual graph showing pulse activity over time
- **Synchronized Moments** - See everyone who pulsed within the same time window
- **Real-Time Sync** - WebSocket connection keeps all devices connected
- **Mobile Responsive** - Works perfectly on phones and tablets

## 🏗️ Architecture

### Frontend
- **HTML5 + CSS3** - Responsive design with mobile support
- **Three.js** - 3D globe visualization
- **Socket.io Client** - Real-time WebSocket connections
- **Geolocation API** - User location tracking

### Backend
- **Node.js + Express** - HTTP server
- **Socket.io** - WebSocket real-time communication
- **MongoDB + Mongoose** - Database for pulse storage
- **Security Features:**
  - Helmet.js - Security headers
  - CORS protection
  - Rate limiting (100 requests per 15 minutes)
  - Input validation and sanitization
  - Data expiration (24 hours)

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Step 1: Clone & Install

```bash
cd synchronicity-network
cd server
npm install
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Whitelist your IP (or use 0.0.0.0/0 for all IPs)

### Step 3: Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/synchronicity
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/synchronicity
FRONTEND_URL=http://localhost:8080
```

### Step 4: Start the Server

```bash
cd server
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 3001
```

### Step 5: Start Frontend

Open `index.html` in a browser or use a simple HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

Visit: http://localhost:8080

## 🌐 Production Deployment

### Deploy Backend (Railway - Recommended)

1. **Create Railway Account**: https://railway.app

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select `synchronicity-network` repo

3. **Configure Environment Variables**
   - Go to your project → Variables
   - Add:
     ```
     MONGODB_URI=your_mongodb_atlas_uri
     FRONTEND_URL=https://yourusername.github.io/synchronicity-network
     PORT=3001
     ```

4. **Deploy**
   - Railway auto-detects Node.js
   - Set root directory to `/server`
   - Deploy!
   - Get your backend URL: `https://your-app.railway.app`

### Alternative: Render.com

1. Create account at https://render.com
2. New Web Service → Connect repo
3. Settings:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy

### Deploy Frontend (GitHub Pages)

Already set up! Just update `index.html`:

```javascript
const SOCKET_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://your-app.railway.app'; // <-- Change this
```

Commit and push:
```bash
git add index.html
git commit -m "Update backend URL for production"
git push origin main
```

Your site: https://dheeraj7k.github.io/synchronicity-network/

## 💰 Adding Google AdSense

### 1. Apply for AdSense
- Go to https://www.google.com/adsense
- Apply with your GitHub Pages URL
- Wait for approval (1-2 weeks)

### 2. Add AdSense Code

In `index.html`, add to `<head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```

### 3. Add Ad Units

Example positions:

**Top Banner (Below Header)**
```html
<div class="header">
    <h1>🌍 Collective Synchronicity Network</h1>
    <p class="subtitle">...</p>
    
    <!-- Ad Unit -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
         data-ad-slot="YYYYYYYYYY"
         data-ad-format="auto"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Sidebar Ad (Right Panel)**
```html
<div class="right-panel">
    <!-- Existing content -->
    
    <!-- Ad Unit -->
    <div style="padding: 20px;">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="ZZZZZZZZZZ"
             data-ad-format="auto"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
</div>
```

## 🔒 Security Features

### Built-in Protection
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (lat/lon bounds)
- ✅ Data sanitization
- ✅ MongoDB injection prevention
- ✅ Automatic data expiration (24h)
- ✅ No password/authentication (no credentials to steal)

### Best Practices
- Keep dependencies updated: `npm audit`
- Use HTTPS in production
- Monitor server logs
- Set up error tracking (Sentry)

## 📊 API Endpoints

### Health Check
```bash
GET /api/health
Response: { status: 'ok', timestamp: 1234567890, connections: 5 }
```

### Statistics
```bash
GET /api/stats
Response: { totalPulsesToday: 150, connectedUsers: 5 }
```

### WebSocket Events

**Client → Server**
- `requestRecentPulses` - Get last 24h of pulses
- `sendPulse` - Send new pulse `{ timestamp, lat, lon }`

**Server → Client**
- `recentPulses` - Array of recent pulses
- `newPulse` - New pulse from another user
- `pulseConfirmed` - Your pulse was saved
- `userCount` - Number of connected users
- `error` - Error message

## 🐛 Troubleshooting

### "Not connected to server"
- Check if backend is running
- Verify `SOCKET_URL` in index.html
- Check browser console for errors
- Verify MongoDB connection

### "Failed to save pulse"
- Check MongoDB connection
- Verify lat/lon are valid numbers
- Check server logs for errors

### Globe not rendering
- Check browser console
- Verify Three.js CDN is loading
- Try different browser

### No pulses showing
- Wait for server connection (green status)
- Check if MongoDB has data
- Verify WebSocket connection in Network tab

## 📝 TODO for Future Sessions

- [ ] Add user authentication (optional)
- [ ] Implement pulse categories/types
- [ ] Add private rooms/groups
- [ ] Create pulse heatmap visualization
- [ ] Add sound effects for pulses
- [ ] Implement daily/weekly statistics
- [ ] Add export data feature
- [ ] Create mobile apps (React Native)

## 🤝 Contributing

This project is set up for easy continuation in new sessions. All architecture decisions and setup instructions are documented here.

## 📄 License

ISC

## 🛠️ Tech Stack Summary

**Frontend**: HTML5, CSS3, JavaScript, Three.js, Socket.io-client  
**Backend**: Node.js, Express, Socket.io, MongoDB, Mongoose  
**Security**: Helmet, CORS, Rate Limiting, Input Validation  
**Deployment**: GitHub Pages (Frontend), Railway/Render (Backend)  
**Database**: MongoDB Atlas

---

Built with ❤️ for tracking collective consciousness

🤖 Generated with [Claude Code](https://claude.ai/code)