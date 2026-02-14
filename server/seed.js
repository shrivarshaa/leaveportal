const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');
const Attendance = require('./models/Attendance');
const Message = require('./models/Message');
const LeaveApplication = require('./models/LeaveApplication');

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leaveportal';
const connectSeedDB = async () => {
    try {
        await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected');
    } catch (err) {
        console.log('Atlas connection failed. Seeding to Local MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/leaveportal');
        console.log('Local MongoDB Connected');
    }
};

const seedData = async () => {
    try {
        await connectSeedDB(); // Ensure DB is connected before seeding
        await User.deleteMany({});
        await Department.deleteMany({});
        await Attendance.deleteMany({});
        await Message.deleteMany({});
        await LeaveApplication.deleteMany({});

        // Create Departments
        const cseDept = await Department.create({ name: 'Computer Science', code: 'CSE' });
        const eceDept = await Department.create({ name: 'Electronics', code: 'ECE' });

        // Create Users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@college.edu',
            password: 'password123',
            role: 'Admin'
        });

        const wardenCSE = await User.create({
            name: 'Warden (CSE Hostel)',
            email: 'warden.cse@college.edu',
            password: 'password123',
            role: 'Warden',
            department: 'CSE',
            facultyId: 'W001',
            phone: '+91 98765 43210'
        });

        const facultyCSE = await User.create({
            name: 'Prof. Johnson',
            email: 'faculty.cse@college.edu',
            password: 'password123',
            role: 'Faculty',
            department: 'CSE',
            facultyId: 'F002',
            phone: '+91 99887 76655'
        });

        const student1 = await User.create({
            name: 'arun',
            email: 'student1@college.edu',
            password: 'password123',
            role: 'Student',
            department: 'CSE',
            studentId: 'S001'
        });

        // Create Sample Attendance for nivetha (Last 5 days)
        const dates = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            dates.push(d);
        }

        await Attendance.create(dates.map(date => ({
            student: student1._id,
            date,
            status: 'Present',
            hours: Array.from({ length: 7 }, (_, i) => ({ hour: i + 1, status: 'Present' })),
            markedBy: facultyCSE._id
        })));

        // Create Sample Messages
        await Message.create([
            {
                sender: student1._id,
                recipient: facultyCSE._id,
                content: 'Hello Professor, I have a doubt regarding the attendance marking for yesterday.'
            },
            {
                sender: facultyCSE._id,
                recipient: student1._id,
                content: 'Sure nivetha, please visit my cabin during the break.'
            }
        ]);

        // Create Sample Leaves
        await LeaveApplication.create([
            {
                student: student1._id,
                leaveType: 'Emergency',
                startDate: new Date(),
                endDate: new Date(new Date().getTime() + 86400000),
                reason: 'Medical Emergency in family',
                status: 'Pending',
                facultyApproval: { status: 'Pending' },
                wardenApproval: { status: 'Pending' }
            },
            {
                student: student1._id,
                leaveType: 'Casual',
                startDate: new Date(new Date().getTime() - 172800000),
                endDate: new Date(new Date().getTime() - 86400000),
                reason: 'Attending Cousin wedding',
                status: 'Approved',
                facultyApproval: { status: 'Approved', approvedBy: facultyCSE._id },
                wardenApproval: { status: 'Approved', approvedBy: wardenCSE._id }
            }
        ]);

        // Update Department Warden (as property name 'hod' is still in model but we treat as warden)
        cseDept.hod = wardenCSE._id;
        await cseDept.save();

        console.log('Data Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
