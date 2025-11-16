const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');

// Main route to get program cards with filters, sorting, and pagination
router.get('/', programController.getProgramCards);

// Get available filter options with hierarchy
router.get('/filter-options', programController.getFilterOptions);

// Get dynamic location options for cascading dropdowns
router.get('/location-options', programController.getDynamicLocationOptions);

// Get university details (programs included in the details)
router.get('/university/:country/:universityName', programController.getUniversityDetails);

// Cache management routes (optional, can be protected in production)
router.get('/cache/stats', programController.getCacheStats);
router.delete('/cache/clear', programController.clearCache);

module.exports = router;