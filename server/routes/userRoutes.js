const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getUserProfile, getFaculty } = require('../controllers/userController');
const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.get('/faculty', protect, getFaculty);

module.exports = router;
