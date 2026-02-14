const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Warden', 'Admin'],
        default: 'Student'
    },
    department: {
        type: String, // Can be ObjectId if referencing Department model strictly
        required: function () { return this.role !== 'Admin'; }
    },
    studentId: {
        type: String,
        required: function () { return this.role === 'Student'; }
    },
    facultyId: {
        type: String,
        required: function () { return this.role === 'Faculty' || this.role === 'Warden'; }
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
