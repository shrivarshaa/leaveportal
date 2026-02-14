const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Attendance = require('./models/Attendance');
const Message = require('./models/Message');
const LeaveApplication = require('./models/LeaveApplication');

const seedData = async () => {
    try {
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
            name: 'Warden (Hostel)',
            email: 'warden@college.edu',
            password: 'password123',
            role: 'Warden',
            department: 'CSE',
            facultyId: 'W001',
            phone: '+91 98765 43210'
        });

        const facultySri = await User.create({
            name: 'Sri Varshaa',
            email: 'faculty.cse@college.edu',
            password: 'password123',
            role: 'Faculty',
            department: 'CSE',
            facultyId: 'F002',
            phone: '+91 99887 76655'
        });

        // Create Multiple Students with Different Stats
        const students = [
            { name: 'arun', email: 'student1@college.edu', id: 'S001', attendanceDays: [1, 1, 1, 1, 1] }, // 100%
            { name: 'varshhh', email: 'student2@college.edu', id: 'S002', attendanceDays: [1, 0, 1, 0, 1] }, // 60%
            { name: 'surya', email: 'student3@college.edu', id: 'S003', attendanceDays: [1, 1, 0, 1, 1] }, // 80%
            { name: 'nivetha', email: 'student4@college.edu', id: 'S004', attendanceDays: [0, 0, 1, 1, 0] }  // 40%
        ];

        const createdStudents = [];
        for (const s of students) {
            const studentUser = await User.create({
                name: s.name,
                email: s.email,
                password: 'password123',
                role: 'Student',
                department: 'CSE',
                studentId: s.id
            });
            createdStudents.push({ ...s, _id: studentUser._id });

            // Create Attendance Records (Last 5 days including TODAY)
            const attendanceRecords = [];
            for (let i = 0; i < 5; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                attendanceRecords.push({
                    student: studentUser._id,
                    date,
                    status: s.attendanceDays[i] === 1 ? 'Present' : 'Absent',
                    hours: Array.from({ length: 7 }, (_, h) => ({
                        hour: h + 1,
                        status: s.attendanceDays[i] === 1 ? 'Present' : 'Absent'
                    })),
                    markedBy: facultySri._id
                });
            }
            await Attendance.create(attendanceRecords);
        }

        // Create Rich Content Dummy Messages
        const dummyMessages = [
            // Conversation with Arun
            { sender: facultySri._id, recipient: createdStudents[0]._id, content: "Good morning Arun, have you finished the assignment?", createdAt: new Date(Date.now() - 3600000 * 24) },
            { sender: createdStudents[0]._id, recipient: facultySri._id, content: "Yes Professor, I'll submit it by noon.", createdAt: new Date(Date.now() - 3600000 * 23) },
            { sender: facultySri._id, recipient: createdStudents[0]._id, content: "Great. Please ensure the documentation is included.", createdAt: new Date(Date.now() - 3600000 * 22) },

            // Conversation with Varshhh
            { sender: createdStudents[1]._id, recipient: facultySri._id, content: "Professor, I missed yesterday's class due to a fever.", createdAt: new Date(Date.now() - 3600000 * 10) },
            { sender: facultySri._id, recipient: createdStudents[1]._id, content: "I hope you are feeling better now. Please check the notes from Arun.", createdAt: new Date(Date.now() - 3600000 * 9) },

            // Conversation with Surya
            { sender: createdStudents[2]._id, recipient: facultySri._id, content: "Can we have a doubt clearing session for the lab tomorrow?", createdAt: new Date(Date.now() - 3600000 * 5) },
            { sender: facultySri._id, recipient: createdStudents[2]._id, content: "Sure, let's meet in the lab at 2 PM.", createdAt: new Date(Date.now() - 3600000 * 4) },

            // Conversation with Nivetha
            { sender: createdStudents[3]._id, recipient: facultySri._id, content: "Professor, I have some personal issues and might be absent for a few days.", createdAt: new Date(Date.now() - 3600000 * 2) },
            { sender: facultySri._id, recipient: createdStudents[3]._id, content: "Please apply for leave officially through the portal so the Warden can approve it.", createdAt: new Date(Date.now() - 3600000 * 1) },

            // Warden Messages
            { sender: createdStudents[0]._id, recipient: wardenCSE._id, content: "Sir, I have applied for leave for the weekend. Please approve it.", createdAt: new Date(Date.now() - 3600000 * 3) },
            { sender: wardenCSE._id, recipient: createdStudents[0]._id, content: "I'll check and approve it soon.", createdAt: new Date(Date.now() - 3600000 * 2) }
        ];

        await Message.create(dummyMessages);

        // Create Sample Leaves
        await LeaveApplication.create([
            {
                student: createdStudents[0]._id, // arun
                leaveType: 'Emergency',
                startDate: new Date(),
                endDate: new Date(new Date().getTime() + 86400000),
                reason: 'Medical Emergency',
                status: 'Pending',
                facultyApproval: { status: 'Pending' },
                wardenApproval: { status: 'Pending' }
            },
            {
                student: createdStudents[1]._id, // varshhh
                leaveType: 'Casual',
                startDate: new Date(new Date().getTime() - 172800000),
                endDate: new Date(new Date().getTime() - 86400000),
                reason: 'Family Function',
                status: 'Approved',
                facultyApproval: { status: 'Approved', approvedBy: facultySri._id },
                wardenApproval: { status: 'Approved', approvedBy: wardenCSE._id }
            }
        ]);

        // Update Department Warden
        cseDept.hod = wardenCSE._id;
        await cseDept.save();

        return true;
    } catch (error) {
        console.error('Error in auto-seed:', error);
        return false;
    }
};

module.exports = seedData;
