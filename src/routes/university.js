const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const University = require('../models/University');
const { authenticateAdmin } = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = 'uploads/universities';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for logo upload
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


// @route   POST /api/universities
// @desc    Create a new university
// @access  Private (Admin)
router.post('/', authenticateAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { 
      name, country, description, city, address, established, ranking,
      courses, tuitionFees, admissionRequirements, intakeMonths,
      scholarships, campusType, internationalStudents, website
    } = req.body;

    // Validation
    if (!name || !country || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, country, and description'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a logo image'
      });
    }

    // Create university
    const university = await University.create({
      name,
      country,
      logo: `/uploads/universities/${req.file.filename}`,
      location: {
        city: city || '',
        address: address || ''
      },
      description,
      established: established || '',
      ranking: ranking || '',
      courses: courses ? JSON.parse(courses) : [],
      tuitionFees: tuitionFees || '',
      admissionRequirements: admissionRequirements || '',
      intakeMonths: intakeMonths ? JSON.parse(intakeMonths) : [],
      scholarships: scholarships || '',
      campusType: campusType || '',
      internationalStudents: internationalStudents || '',
      website: website || ''
    });

    // Populate country details
    await university.populate('country', 'name code flag');

    res.status(201).json({
      success: true,
      message: 'University created successfully',
      data: university
    });

  } catch (error) {
    console.error('Create University Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/universities/:id
// @desc    Update a university
// @access  Private (Admin)
router.put('/:id', authenticateAdmin, upload.single('logo'), async (req, res) => {
  try {
    let university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    const { 
      name, country, description, city, address, established, ranking,
      courses, tuitionFees, admissionRequirements, intakeMonths,
      scholarships, campusType, internationalStudents, website
    } = req.body;

    // Update fields
    const updateData = {
      name: name || university.name,
      country: country || university.country,
      description: description || university.description,
      location: {
        city: city !== undefined ? city : university.location.city,
        address: address !== undefined ? address : university.location.address
      },
      established: established !== undefined ? established : university.established,
      ranking: ranking !== undefined ? ranking : university.ranking,
      courses: courses ? JSON.parse(courses) : university.courses,
      tuitionFees: tuitionFees !== undefined ? tuitionFees : university.tuitionFees,
      admissionRequirements: admissionRequirements !== undefined ? admissionRequirements : university.admissionRequirements,
      intakeMonths: intakeMonths ? JSON.parse(intakeMonths) : university.intakeMonths,
      scholarships: scholarships !== undefined ? scholarships : university.scholarships,
      campusType: campusType !== undefined ? campusType : university.campusType,
      internationalStudents: internationalStudents !== undefined ? internationalStudents : university.internationalStudents,
      website: website !== undefined ? website : university.website
    };

    // Update logo if new file uploaded
    if (req.file) {
      updateData.logo = `/uploads/universities/${req.file.filename}`;
    }

    university = await University.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('country', 'name code flag');

    res.status(200).json({
      success: true,
      message: 'University updated successfully',
      data: university
    });

  } catch (error) {
    console.error('Update University Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/universities/:id
// @desc    Delete a university
// @access  Private (Admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    await University.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'University deleted successfully'
    });

  } catch (error) {
    console.error('Delete University Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});


// @route   GET /api/universities
// @desc    Get all universities with pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const countryFilter = req.query.country; // Optional filter by country

    // Build query
    const query = countryFilter ? { country: countryFilter } : {};

    const universities = await University.find(query)
      .select('name logo location.city description ranking tuitionFees country createdAt')
      .populate('country', 'name code flag')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalUniversities = await University.countDocuments(query);

    res.status(200).json({
      success: true,
      count: universities.length,
      data: universities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUniversities / limit),
        totalUniversities: totalUniversities,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Get Universities Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/universities/:id
// @desc    Get single university with all details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const university = await University.findById(req.params.id)
      .populate('country');

    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.status(200).json({
      success: true,
      data: university
    });

  } catch (error) {
    console.error('Get University Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;