const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
    const { recipientId, content } = req.body;
    try {
        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            content
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user._id }, { recipient: req.user._id }]
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'name role')
            .populate('recipient', 'name role');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};
