const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { seedStudentData } = require('./utils/seedHelper');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leaveportal';

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to DB');
    } catch (err) {
        console.log('Atlas connection failed. Using Local MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/leaveportal');
        console.log('Connected to Local MongoDB');
    }
};

connectDB().then(async () => {
    const arun = await User.findOne({ name: 'arun' });
    if (arun) {
        console.log('Found arun, seeding...');
        // Clear existing data for arun first to avoid duplicates
        const Attendance = require('./models/Attendance');
        const LeaveApplication = require('./models/LeaveApplication');
        const Message = require('./models/Message');
        await Attendance.deleteMany({ student: arun._id });
        await LeaveApplication.deleteMany({ student: arun._id });
        await Message.deleteMany({ recipient: arun._id });
        await Message.deleteMany({ sender: arun._id });

        await seedStudentData(arun._id);
        console.log('Done!');
    } else {
        console.log('arun not found!');
    }
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
