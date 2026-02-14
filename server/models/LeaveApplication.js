const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['Medical', 'Casual', 'On-Duty', 'Emergency'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    documents: [{
        type: String // URL/Path to uploaded file
    }],
    facultyApproval: {
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: Date
    },
    wardenApproval: {
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: Date
    },
    remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
