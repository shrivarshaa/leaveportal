const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment variables
dotenv.config();

// Route imports
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;

        let uri = process.env.MONGO_URI;
        const clientOptions = {
            serverApi: { version: '1', strict: true, deprecationErrors: true },
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000
        };

        const startFallback = async () => {
            console.log('\n[DB] Atlas connection failed. Attempting local fallback...');
            try {
                // Try Local MongoDB First
                await mongoose.connect('mongodb://127.0.0.1:27017/leaveportal', {
                    serverSelectionTimeoutMS: 5000
                });
                console.log('[DB] Connected to Local MongoDB');
            } catch (localErr) {
                console.log('[DB] Local MongoDB unavailable. Initializing In-Memory server...');
                try {
                    const { MongoMemoryServer } = require('mongodb-memory-server');
                    const mongod = await MongoMemoryServer.create({
                        instance: { dbName: 'leaveportal' },
                        binary: { version: '6.0.4' }
                    });
                    uri = mongod.getUri();
                    console.log('[DB] In-memory MongoDB started at:', uri);
                    await mongoose.connect(uri);
                } catch (memErr) {
                    console.error('[DB] CRITICAL: All fallback attempts failed:', memErr.message);
                }
            }
        };

        if (!uri || uri.includes('cluster0.xxxxx') || uri.includes('<db_password>')) {
            await startFallback();
        } else {
            console.log('[DB] Attempting to connect to Atlas...');
            try {
                await mongoose.connect(uri, {
                    ...clientOptions,
                    serverSelectionTimeoutMS: 10000
                });
            } catch (connectErr) {
                console.error('[DB] Atlas connection failed:', connectErr.message);
                await startFallback();
            }
        }
        console.log('[DB] MongoDB Connection Established Successfully\n');
    } catch (err) {
        console.error('[DB] CRITICAL: Database Connection Final Error:', err.message);
    }
};

// Execute connection
connectDB().then(async () => {
    // Auto-seed if empty
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
        console.log('[DB] Database is empty. Running auto-seed...');
        const seedScript = require('./seed_logic'); // We'll move seed logic here
        await seedScript();
        console.log('[DB] Auto-seed completed.');
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('Antigravity Leave Portal API is running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
