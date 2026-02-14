const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getUsers, addDepartment, getDepartments, getAnalytics } = require('../controllers/adminController');
const router = express.Router();

router.get('/users', protect, authorize('Admin'), getUsers);
router.post('/departments', protect, authorize('Admin'), addDepartment);
router.get('/departments', protect, authorize('Admin'), getDepartments);
router.get('/analytics', protect, authorize('Admin'), getAnalytics);

module.exports = router;
