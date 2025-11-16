const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// Main route to get program cards with filters, sorting, and pagination
router.get('/', programController.getProgramCards);

// Get available filter options
router.get('/filter-options', programController.getFilterOptions);

// Get university details with programs
router.get('/university/:country/:universityName', programController.getUniversityDetails);

// Cache management routes (optional, can be protected in production)
router.get('/cache/stats', programController.getCacheStats);
router.delete('/cache/clear', programController.clearCache);

module.exports = router;