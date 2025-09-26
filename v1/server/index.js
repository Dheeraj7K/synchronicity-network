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
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const pulseSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true, index: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const Pulse = mongoose.model('Pulse', pulseSchema);

const validatePulse = (data) => {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.timestamp !== 'number' || data.timestamp <= 0) return false;
    if (typeof data.lat !== 'number' || data.lat < -90 || data.lat > 90) return false;
    if (typeof data.lon !== 'number' || data.lon < -180 || data.lon > 180) return false;
    return true;
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synchronicity', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    connectedUsers.set(socket.id, { connectedAt: Date.now() });

    io.emit('userCount', connectedUsers.size);

    socket.on('requestRecentPulses', async () => {
        try {
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentPulses = await Pulse.find({
                timestamp: { $gte: oneDayAgo }
            }).select('-__v').limit(1000).lean();

            socket.emit('recentPulses', recentPulses);
        } catch (error) {
            console.error('Error fetching recent pulses:', error);
            socket.emit('error', 'Failed to fetch recent pulses');
        }
    });

    socket.on('sendPulse', async (data) => {
        try {
            if (!validatePulse(data)) {
                socket.emit('error', 'Invalid pulse data');
                return;
            }

            const pulse = new Pulse({
                timestamp: data.timestamp,
                lat: parseFloat(data.lat.toFixed(4)),
                lon: parseFloat(data.lon.toFixed(4)),
                userId: socket.id
            });

            await pulse.save();

            const pulseData = {
                id: pulse._id.toString(),
                timestamp: pulse.timestamp,
                lat: pulse.lat,
                lon: pulse.lon,
                isYours: false
            };

            socket.broadcast.emit('newPulse', pulseData);
            
            socket.emit('pulseConfirmed', { ...pulseData, isYours: true });

            console.log('📍 New pulse saved:', socket.id);
        } catch (error) {
            console.error('Error saving pulse:', error);
            socket.emit('error', 'Failed to save pulse');
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
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const totalPulses = await Pulse.countDocuments({
            timestamp: { $gte: oneDayAgo }
        });

        res.json({
            totalPulsesToday: totalPulses,
            connectedUsers: connectedUsers.size
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
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