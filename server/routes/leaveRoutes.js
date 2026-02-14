const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { applyLeave, getMyLeaves, getLeaves, updateLeaveStatus, cancelLeave } = require('../controllers/leaveController');
const router = express.Router();

router.post('/apply', protect, authorize('Student'), upload.array('documents'), applyLeave);
router.get('/my-leaves', protect, authorize('Student'), getMyLeaves);
router.get('/', protect, authorize('Faculty', 'HOD', 'Admin'), getLeaves);
router.put('/:id/status', protect, authorize('Faculty', 'Warden'), updateLeaveStatus);
router.put('/:id/cancel', protect, authorize('Student'), cancelLeave);

module.exports = router;
