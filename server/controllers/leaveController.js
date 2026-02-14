const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');

// @desc    Apply for leave
// @route   POST /api/leaves/apply
// @access  Student
const applyLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const student = req.user._id;

        // Check availability/overlapping dates (basic check)
        const overlapping = await LeaveApplication.findOne({
            student,
            $or: [
                { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
            ],
            status: { $ne: 'Rejected' }
        });

        if (overlapping) {
            return res.status(400).json({ message: 'You already have a leave application for these dates.' });
        }

        const documents = req.files ? req.files.map(file => file.path) : [];

        const leave = await LeaveApplication.create({
            student,
            leaveType,
            startDate,
            endDate,
            reason,
            documents
        });

        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's leaves
// @route   GET /api/leaves/my-leaves
// @access  Student
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveApplication.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @access  Faculty, Warden, Admin
const getLeaves = async (req, res) => {
    try {
        // Basic implementation: return all for now. Real world: filter by department.
        const leaves = await LeaveApplication.find().populate('student', 'name email department');
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update leave status (Faculty/Warden)
// @route   PUT /api/leaves/:id/status
// @access  Faculty, Warden
const updateLeaveStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const leave = await LeaveApplication.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        const role = req.user.role;

        if (role === 'Faculty') {
            leave.facultyApproval = {
                status,
                updatedBy: req.user._id,
                updatedAt: Date.now()
            };
            // If rejected by faculty, main status is Rejected. If approved, main status stays Pending waiting for HOD.
            if (status === 'Rejected') {
                leave.status = 'Rejected';
            }
        } else if (role === 'Warden') {
            // Warden can only approve if faculty has approved (business logic choice, or can override)
            // For simplicity, Warden is final authority.
            leave.wardenApproval = {
                status,
                updatedBy: req.user._id,
                updatedAt: Date.now()
            };
            leave.status = status; // Final status
        }

        if (remarks) {
            leave.remarks = remarks;
        }

        const updatedLeave = await leave.save();
        res.json(updatedLeave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel leave application
// @route   PUT /api/leaves/:id/cancel
// @access  Student
const cancelLeave = async (req, res) => {
    try {
        const leave = await LeaveApplication.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        // Verify ownership
        if (leave.student.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to cancel this leave' });
        }

        // Check if already processed
        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: `Cannot cancel leave as it is already ${leave.status}` });
        }

        leave.status = 'Cancelled';
        await leave.save();

        res.json({ message: 'Leave application cancelled successfully', leave });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { applyLeave, getMyLeaves, getLeaves, updateLeaveStatus, cancelLeave };
