const User = require('../models/User');
const Department = require('../models/Department');
const LeaveApplication = require('../models/LeaveApplication');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a department
// @route   POST /api/admin/departments
// @access  Admin
const addDepartment = async (req, res) => {
    try {
        const { name, code } = req.body;
        const department = await Department.create({ name, code });
        res.status(201).json(department);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Admin
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalLeaves = await LeaveApplication.countDocuments();
        const pendingLeaves = await LeaveApplication.countDocuments({ status: 'Pending' });
        const approvedLeaves = await LeaveApplication.countDocuments({ status: 'Approved' });
        const rejectedLeaves = await LeaveApplication.countDocuments({ status: 'Rejected' });

        // Monthly Leave Stats (Last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyLeaves = await LeaveApplication.aggregate([
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Department-wise stats
        const departments = await Department.find();
        const deptStats = await Promise.all(departments.map(async (dept) => {
            const usersCount = await User.countDocuments({ department: dept.code });
            const leavesCount = await LeaveApplication.countDocuments({
                student: { $in: await User.find({ department: dept.code }).distinct('_id') }
            });
            return {
                name: dept.name,
                userCount: usersCount,
                leaveCount: leavesCount
            };
        }));

        // Student Performance stats
        const Attendance = require('../models/Attendance');
        const students = await User.find({ role: 'Student' });
        const studentStats = await Promise.all(students.map(async (student) => {
            const attendances = await Attendance.find({ student: student._id });
            const totalDays = attendances.length;
            const presentDays = attendances.filter(a => a.status === 'Present').length;
            const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

            const studentLeavesCount = await LeaveApplication.countDocuments({ student: student._id });
            const approvedLeavesCount = await LeaveApplication.countDocuments({ student: student._id, status: 'Approved' });

            return {
                _id: student._id,
                name: student.name,
                studentId: student.studentId,
                department: student.department,
                attendancePercentage,
                totalLeaves: studentLeavesCount,
                approvedLeaves: approvedLeavesCount
            };
        }));

        res.json({
            totalUsers,
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            monthlyLeaves,
            deptStats,
            studentStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUsers, addDepartment, getDepartments, getAnalytics };
