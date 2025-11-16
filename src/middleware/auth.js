const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.authenticateAdmin = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from database
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized - Admin not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Invalid token'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - No token provided'
    });
  }
};