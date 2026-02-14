const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');
const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/', protect, getMessages);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
