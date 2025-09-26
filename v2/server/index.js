require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shipment-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const shipmentsRoutes = require('./routes/shipments');
const adsRoutes = require('./routes/ads');
const leadsRoutes = require('./routes/leads');

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/leads', leadsRoutes);

const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    connectedUsers.set(socket.id, { connectedAt: Date.now() });

    io.emit('userCount', connectedUsers.size);

    socket.on('subscribeToShipments', (filters) => {
        socket.join('shipments');
        console.log('User subscribed to shipments');
    });

    socket.on('shipmentUpdate', async (data) => {
        const Shipment = require('./models/Shipment');
        
        const shipment = await Shipment.findById(data.shipmentId);
        if (shipment && data.progress !== undefined) {
            shipment.progress = data.progress;
            await shipment.save();
            
            io.to('shipments').emit('shipmentMoved', {
                shipmentId: data.shipmentId,
                progress: data.progress
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
        connectedUsers.delete(socket.id);
        io.emit('userCount', connectedUsers.size);
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        connections: connectedUsers.size
    });
});

app.get('/api/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const Shipment = require('./models/Shipment');
        const Ad = require('./models/Ad');

        const [userCount, shipmentCount, adCount] = await Promise.all([
            User.countDocuments(),
            Shipment.countDocuments({ active: true }),
            Ad.countDocuments({ status: 'active' })
        ]);

        res.json({
            users: userCount,
            activeShipments: shipmentCount,
            activeAds: adCount,
            connectedUsers: connectedUsers.size
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = { app, io };