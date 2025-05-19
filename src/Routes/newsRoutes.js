const express = require('express');
const router = express.Router();
const News = require('../Models/News');
const auth = require('../middleware/auth');

// Create news
router.post('/', auth, async (req, res) => {
  try {
    const news = new News({
      ...req.body,
      author: req.user._id
    });
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all news
router.get('/location', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, location } = req.query;
    const query = {};

    if (tag) {
      query.tags = tag;
    }

    if (location) {
      const [longitude, latitude, maxDistance = 10000] = location.split(',');
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    const news = await News.find(query)
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await News.countDocuments(query);

    res.json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get news by ID
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update news
router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'content', 'image', 'location', 'tags'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const news = await News.findOne({ _id: req.params.id, author: req.user._id });
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    updates.forEach(update => news[update] = req.body[update]);
    await news.save();
    res.json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete news
router.delete('/:id', auth, async (req, res) => {
  try {
    const news = await News.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike news
router.post('/:id/like', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    const likeIndex = news.likes.indexOf(req.user._id);
    
    if (likeIndex === -1) {
      news.likes.push(req.user._id);
    } else {
      news.likes.splice(likeIndex, 1);
    }

    await news.save();
    res.json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    news.comments.push({
      user: req.user._id,
      content: req.body.content
    });

    await news.save();
    await news.populate('comments.user', 'username profilePicture');
    res.json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 