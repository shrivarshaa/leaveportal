const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
    leaveType: {
        type: String,
        required: true,
        unique: true
    },
    maxDaysPerYear: {
        type: Number,
        required: true
    },
    requiresDocument: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
