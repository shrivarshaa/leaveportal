const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getFaculty = async (req, res) => {
    try {
        const faculty = await User.find({ role: { $in: ['Faculty', 'HOD'] } }).select('name role department phone');
        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching faculty' });
    }
};

module.exports = { getUserProfile, getFaculty };
