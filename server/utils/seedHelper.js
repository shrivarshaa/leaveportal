const Attendance = require('../models/Attendance');
const LeaveApplication = require('../models/LeaveApplication');
const Message = require('../models/Message');
const User = require('../models/User');
const Department = require('../models/Department');

const seedStudentData = async (studentId) => {
    console.log(`[SEED] Starting data generation for student ID: ${studentId}`);
    try {
        const student = await User.findById(studentId);
        if (!student || student.role !== 'Student') return;

        // Ensure a default department exists
        let cseDept = await Department.findOne({ code: 'CSE' });
        if (!cseDept) {
            cseDept = await Department.create({ name: 'Computer Science', code: 'CSE' });
        }

        // Ensure at least one faculty exists
        let faculty = await User.findOne({ role: 'Faculty' });
        if (!faculty) {
            faculty = await User.create({
                name: 'Prof. Johnson',
                email: 'faculty.cse@college.edu',
                password: 'password123',
                role: 'Faculty',
                department: 'CSE',
                facultyId: 'F002',
                phone: '+91 99887 76655'
            });
            console.log('[SEED] Created default faculty: Prof. Johnson');
        }

        const facultyId = faculty._id;

        // 1. Generate 5 days of attendance, aligning with leave
        const attendanceData = [];
        const leaveStartDate = new Date(Date.now() - 259200000);
        const leaveEndDate = new Date(Date.now() - 172800000);
        leaveStartDate.setHours(0, 0, 0, 0);
        leaveEndDate.setHours(23, 59, 59, 999);

        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            // Check if this date falls within the approved casual leave period
            const isOnLeave = date >= leaveStartDate && date <= leaveEndDate;

            attendanceData.push({
                student: studentId,
                date,
                status: isOnLeave ? 'On-Leave' : 'Present',
                hours: Array.from({ length: 7 }, (_, h) => ({
                    hour: h + 1,
                    status: isOnLeave ? 'On-Leave' : 'Present'
                })),
                markedBy: facultyId
            });
        }
        await Attendance.insertMany(attendanceData);

        // 2. Generate a pending Emergency Leave
        await LeaveApplication.create({
            student: studentId,
            leaveType: 'Emergency',
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 86400000),
            reason: 'This is an automatically generated demo emergency leave.',
            status: 'Pending',
            facultyApproval: { status: 'Pending' },
            wardenApproval: { status: 'Pending' }
        });

        // 3. Generate an approved Casual Leave
        await LeaveApplication.create({
            student: studentId,
            leaveType: 'Casual',
            startDate: new Date(new Date().getTime() - 259200000),
            endDate: new Date(new Date().getTime() - 172800000),
            reason: 'This is an automatically generated demo casual leave (past).',
            status: 'Approved',
            facultyApproval: { status: 'Approved', approvedBy: facultyId },
            wardenApproval: { status: 'Approved' }
        });

        // 4. Generate demo chat history
        await Message.insertMany([
            {
                sender: facultyId,
                recipient: studentId,
                content: `Welcome to Easy Connect! I am Prof. Johnson. You can contact me here for any academic queries.`,
                createdAt: new Date(new Date().getTime() - 86400000)
            },
            {
                sender: studentId,
                recipient: facultyId,
                content: `Thank you, Professor! I've just applied for a leave. Could you please review it?`,
                createdAt: new Date(new Date().getTime() - 43200000)
            },
            {
                sender: facultyId,
                recipient: studentId,
                content: `I see your request. I will check it shortly. Keep an eye on the portal!`,
                createdAt: new Date(new Date().getTime() - 3600000)
            }
        ]);

        console.log(`[SEED] Demo data generated for student: ${student.name}`);
    } catch (error) {
        console.error('[SEED] Error generating demo data:', error.message);
    }
};

module.exports = { seedStudentData };
