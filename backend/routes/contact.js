const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST - Submit a contact message
router.post('/message', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create new contact message
    const newContact = new Contact({
      name: name.trim(),
      email: email.trim(),
      subject: subject ? subject.trim() : 'No subject',
      message: message.trim()
    });

    // Save to database
    await newContact.save();

    console.log('✅ New contact message received:', {
      from: name,
      email: email,
      subject: subject || 'No subject'
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
      data: newContact
    });

  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// GET - Get messages by email (for the sender to check replies)
router.get('/my-messages', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const messages = await Contact.find({ email: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .select('name email subject message status adminReply repliedAt studentReply studentRepliedAt createdAt');

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages by email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET - Get all contact messages (for admin)
router.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET - Get single contact message by ID
router.get('/messages/:id', async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT - Admin reply to a contact message
router.put('/messages/:id/reply', async (req, res) => {
  try {
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reply message'
      });
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        adminReply: adminReply.trim(),
        repliedAt: new Date(),
        status: 'replied'
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Reply saved successfully',
      data: message
    });
  } catch (error) {
    console.error('Error saving reply:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST - Student reply back to admin's reply
router.post('/messages/:id/student-reply', async (req, res) => {
  try {
    const { studentReply, email } = req.body;

    if (!studentReply || !studentReply.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reply message'
      });
    }

    // Find the message and verify ownership by email
    const existing = await Contact.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (email && existing.email !== email.toLowerCase().trim()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (!existing.adminReply) {
      return res.status(400).json({ success: false, message: 'Admin has not replied yet' });
    }

    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        studentReply: studentReply.trim(),
        studentRepliedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Your reply has been sent',
      data: message
    });
  } catch (error) {
    console.error('Error saving student reply:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE - Delete a contact message
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;