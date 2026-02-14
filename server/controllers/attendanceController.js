const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Mark attendance for a student or whole class
exports.markAttendance = async (req, res) => {
    const { studentId, date, status, hours } = req.body;
    try {
        const attendance = await Attendance.findOneAndUpdate(
            { student: studentId, date: new Date(date).setHours(0, 0, 0, 0) },
            { student: studentId, date, status, hours, markedBy: req.user._id },
            { upsert: true, new: true }
        );
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

// Get attendance stats for a student
exports.getStudentStats = async (req, res) => {
    const studentId = req.params.studentId || req.user._id;
    try {
        const attendances = await Attendance.find({ student: studentId }).sort({ date: -1 });
        const totalDays = attendances.length;
        const presentDays = attendances.filter(a => a.status === 'Present').length;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        // Calculate Streak
        let streak = 0;
        for (const record of attendances) {
            if (record.status === 'Present') {
                streak++;
            } else {
                break;
            }
        }

        res.status(200).json({
            totalDays,
            presentDays,
            percentage: percentage.toFixed(2),
            streak,
            history: attendances
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

// Get daily attendance for a class
exports.getClassAttendance = async (req, res) => {
    const { date, department } = req.query;
    const deptToUse = department || req.user.department;
    try {
        const students = await User.find({ role: 'Student', department: deptToUse });
        const attendance = await Attendance.find({
            date: new Date(date).setHours(0, 0, 0, 0),
            student: { $in: students.map(s => s._id) }
        });
        res.status(200).json({ students, attendance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching class attendance', error: error.message });
    }
};
