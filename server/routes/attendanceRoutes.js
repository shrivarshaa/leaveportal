const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { markAttendance, getStudentStats, getClassAttendance } = require('../controllers/attendanceController');
const router = express.Router();

router.post('/mark', protect, authorize('Faculty', 'HOD'), markAttendance);
router.get('/stats', protect, authorize('Student'), getStudentStats);
router.get('/stats/:studentId', protect, authorize('Faculty', 'HOD', 'Admin'), getStudentStats);
router.get('/class', protect, authorize('Faculty', 'HOD'), getClassAttendance);

module.exports = router;
