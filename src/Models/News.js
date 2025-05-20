const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  verifications: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  }],
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      required: true,
      enum: ['false_information', 'inappropriate', 'spam', 'other']
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
  
});

// Update verification status based on thresholds
newsSchema.methods.updateVerificationStatus = function() {
  const VERIFICATION_THRESHOLD = 10;
  const FLAG_THRESHOLD = 3;
  
  if (this.flags.length >= FLAG_THRESHOLD) {
    this.verificationStatus = 'flagged';
  } else if (this.verifications.length >= VERIFICATION_THRESHOLD) {
    this.verificationStatus = 'verified';
  } else {
    this.verificationStatus = 'pending';
  }
};

// Update the updatedAt timestamp and verification status before saving
newsSchema.pre('save', function(next) {
  this.updateVerificationStatus();
  this.updatedAt = Date.now();
  next();
});

// Create indexes for location-based queries and verification
newsSchema.index({ location: '2dsphere' });
newsSchema.index({ verificationStatus: 1 });
newsSchema.index({ 'verifications.location': '2dsphere' });

const News = mongoose.models.News || mongoose.model('News', newsSchema);

module.exports = News;