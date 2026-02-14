const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'On-Leave'],
        default: 'Present'
    },
    hours: [{
        hour: { type: Number, min: 1, max: 8 },
        status: { type: String, enum: ['Present', 'Absent', 'On-Leave'], default: 'Present' }
    }],
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Prevent duplicate attendance for the same student on the same date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
