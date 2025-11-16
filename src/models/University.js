const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'University name is required'],
    trim: true
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: [true, 'Country is required']
  },
  logo: {
    type: String,
    required: [true, 'Logo is required']
  },
  location: {
    city: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  // Visa consultancy specific fields
  established: {
    type: String,
    default: ''
  },
  ranking: {
    type: String,
    default: ''
  },
  courses: {
    type: [String],
    default: []
  },
  tuitionFees: {
    type: String,
    default: ''
  },
  admissionRequirements: {
    type: String,
    default: ''
  },
  intakeMonths: {
    type: [String],
    default: []
  },
  scholarships: {
    type: String,
    default: ''
  },
  campusType: {
    type: String,
    default: ''
  },
  internationalStudents: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('University', universitySchema);