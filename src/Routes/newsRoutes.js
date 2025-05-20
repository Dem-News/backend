const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createNews,
  getNewsByLocation,
  getNewsById,
  updateNews,
  deleteNews,
  toggleLike,
  addComment
} = require('../Controllers/newsController');
const { 
  verifyNews, 
  flagNews, 
  getVerificationStatus 
} = require('../Controllers/newsVerificationController');

// Create news
router.post('/', auth, createNews);

// Get all news by location
router.get('/location', getNewsByLocation);

// Get news by ID
router.get('/:id', getNewsById);

// Update news
router.patch('/:id', auth, updateNews);

// Delete news
router.delete('/:id', auth, deleteNews);

// Like/Unlike news
router.post('/:id/like', auth, toggleLike);

// Add comment
router.post('/:id/comment', auth, addComment);

// Verification routes
router.post('/:newsId/verify', auth, verifyNews);
router.post('/:newsId/flag', auth, flagNews);
router.get('/:newsId/verification-status', getVerificationStatus);

module.exports = router;