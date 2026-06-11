const express = require('express');
const MovieRequest = require('../movies/movieRequest.model');

const router = express.Router();

// POST /Request/movie -> submit a movie request
router.post('/movie', async (req, res, next) => {
  try {
    const { title, message } = req.body;

    // Validate and trim title
    const trimmedTitle = title ? String(title).trim() : '';
    
    if (!trimmedTitle) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.'
      });
    }

    // Normalize title for duplicate checking (lowercase)
    const normalizedTitle = trimmedTitle.toLowerCase();

    // Check for existing pending request with the same title
    const existingRequest = await MovieRequest.findOne({
      title: normalizedTitle,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(201).json({
        success: true,
        message: 'Movie request submitted successfully.'
      });
    }

    // Trim and set message
    const trimmedMessage = message ? String(message).trim() : '';

    // Create and save new movie request
    const movieRequest = new MovieRequest({
      title: normalizedTitle,
      message: trimmedMessage,
      status: 'pending',
      requestedAt: new Date()
    });

    await movieRequest.save();

    return res.status(201).json({
      success: true,
      message: 'Movie request submitted successfully.'
    });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A request for this movie is already pending.'
      });
    }
    next(err);
  }
});

module.exports = router;
