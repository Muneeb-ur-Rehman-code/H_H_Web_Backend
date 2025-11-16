const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Country = require('../models/Country');
const { authenticateAdmin } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = 'uploads/countries';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for flag upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});


router.post('/', authenticateAdmin, upload.single('flag'), async (req, res) => {
  try {
    const { 
      name, code, description, visaTypes, processingTime, visaFee,
      popularCities, language, currency, requirements, benefits
    } = req.body;

    // Validation
    if (!name || !code || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, code, and description'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a flag image'
      });
    }

    // Create country
    const country = await Country.create({
      name,
      code: code.toUpperCase(),
      flag: `/uploads/countries/${req.file.filename}`,
      description,
      visaTypes: visaTypes ? JSON.parse(visaTypes) : [],
      processingTime: processingTime || '',
      visaFee: visaFee || '',
      popularCities: popularCities ? JSON.parse(popularCities) : [],
      language: language || '',
      currency: currency || '',
      requirements: requirements || '',
      benefits: benefits || ''
    });

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country
    });

  } catch (error) {
    console.error('Create Country Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/countries/:id
// @desc    Update a country
// @access  Private (Admin)
router.put('/:id', authenticateAdmin, upload.single('flag'), async (req, res) => {
  try {
    let country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    const { 
      name, code, description, visaTypes, processingTime, visaFee,
      popularCities, language, currency, requirements, benefits
    } = req.body;

    // Update fields
    const updateData = {
      name: name || country.name,
      code: code ? code.toUpperCase() : country.code,
      description: description || country.description,
      visaTypes: visaTypes ? JSON.parse(visaTypes) : country.visaTypes,
      processingTime: processingTime !== undefined ? processingTime : country.processingTime,
      visaFee: visaFee !== undefined ? visaFee : country.visaFee,
      popularCities: popularCities ? JSON.parse(popularCities) : country.popularCities,
      language: language !== undefined ? language : country.language,
      currency: currency !== undefined ? currency : country.currency,
      requirements: requirements !== undefined ? requirements : country.requirements,
      benefits: benefits !== undefined ? benefits : country.benefits
    };

    // Update flag if new file uploaded
    if (req.file) {
      updateData.flag = `/uploads/countries/${req.file.filename}`;
    }

    country = await Country.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });

  } catch (error) {
    console.error('Update Country Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/countries/:id
// @desc    Delete a country
// @access  Private (Admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    await Country.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Country deleted successfully'
    });

  } catch (error) {
    console.error('Delete Country Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});



// @route   GET /api/countries
// @desc    Get all countries with pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const countries = await Country.find()
      .select('name code flag description visaTypes processingTime visaFee createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalCountries = await Country.countDocuments();

    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCountries / limit),
        totalCountries: totalCountries,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Get Countries Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/countries/:id
// @desc    Get single country with all details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.status(200).json({
      success: true,
      data: country
    });

  } catch (error) {
    console.error('Get Country Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;