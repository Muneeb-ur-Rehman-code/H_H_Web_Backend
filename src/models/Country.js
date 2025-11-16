const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Country name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Country code is required'],
    uppercase: true,
    trim: true
  },
  flag: {
    type: String,
    required: [true, 'Flag image is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  // Visa consultancy specific fields
  visaTypes: {
    type: [String],
    default: []
  },
  processingTime: {
    type: String,
    default: ''
  },
  visaFee: {
    type: String,
    default: ''
  },
  popularCities: {
    type: [String],
    default: []
  },
  language: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  benefits: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Country', countrySchema);