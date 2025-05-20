// routes/news.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../Models/Comment');

// Get comments for a news item
router.get('/:newsId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ news: req.params.newsId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to a news item
router.post('/:newsId/comments', auth, async (req, res) => {
  try {
    const comment = new Comment({
      content: req.body.content,
      author: req.user._id,
      news: req.params.newsId
    });
    
    const savedComment = await comment.save();
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('author', 'username');
      
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;