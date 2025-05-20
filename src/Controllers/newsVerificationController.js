const News = require('../Models/News');

// Verify a news post
const verifyNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const userId = req.user._id;    let coordinates;
    
    // Handle different coordinate formats
    if (req.body.coordinates) {
      if (Array.isArray(req.body.coordinates)) {
        coordinates = req.body.coordinates;
      } else if (req.body.coordinates.latitude && req.body.coordinates.longitude) {
        // Convert from {latitude, longitude} to [longitude, latitude] format
        coordinates = [req.body.coordinates.longitude, req.body.coordinates.latitude];
      } else {
        coordinates = [0, 0];
      }
    } else {
      coordinates = [0, 0];
    }

    // Validate coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || 
        !coordinates.every(coord => typeof coord === 'number')) {
      return res.status(400).json({ 
        error: 'Invalid coordinates. Please provide either [longitude, latitude] array or {latitude, longitude} object' 
      });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Check if user has already verified
    if (news.verifications.some(v => v.user.toString() === userId.toString())) {
      return res.status(400).json({ error: 'You have already verified this news' });
    }

    // Add verification with user's location
    news.verifications.push({
      user: userId,
      location: {
        type: 'Point',
        coordinates
      }
    });

    await news.save();
    res.status(200).json({ 
      message: 'News verified successfully', 
      verificationStatus: news.verificationStatus,
      verifications: news.verifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Flag a news post
const flagNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    // Check if user has already flagged
    if (news.flags.some(f => f.user.toString() === userId.toString())) {
      return res.status(400).json({ error: 'You have already flagged this news' });
    }

    // Add flag
    news.flags.push({
      user: userId,
      reason,
      description
    });

    await news.save();
    res.status(200).json({ message: 'News flagged successfully', verificationStatus: news.verificationStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get verification status of a news post
const getVerificationStatus = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await News.findById(newsId)
      .select('verificationStatus verifications flags')
      .populate('verifications.user', 'username')
      .populate('flags.user', 'username');

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.status(200).json({
      status: news.verificationStatus,
      verificationCount: news.verifications.length,
      flagCount: news.flags.length,
      verifications: news.verifications,
      flags: news.flags
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  verifyNews,
  flagNews,
  getVerificationStatus
};
