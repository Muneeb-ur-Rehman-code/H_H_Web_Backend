require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const Admin = require('./src/models/Admin');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(compression()); // Add compression for better performance
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Add logging for development

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Auto-create Admin on Server Start
const autoCreateAdmin = async () => {
  try {
    // Wait a bit for DB connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      console.log('\n🎉 ================================');
      console.log('✅ Admin Created Successfully!');
      console.log('================================');
      console.log('📧 Email:', process.env.ADMIN_EMAIL);
      console.log('🔑 Password:', process.env.ADMIN_PASSWORD);
      console.log('================================\n');
    } else {
      console.log('\n✅ Admin already exists in database');
      console.log('📧 Email:', process.env.ADMIN_EMAIL);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

// Execute admin creation
autoCreateAdmin();

// ==================== API Routes ====================

// Existing routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/countries', require('./src/routes/country'));
app.use('/api/universities', require('./src/routes/university'));

// New program filtering routes
app.use('/api/programs', require('./src/routes/programs'));

// ==================== Documentation & Health ====================

// Home route with complete API documentation
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Visa Consultancy API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        description: 'Admin authentication'
      },
      countries: {
        list: 'GET /api/countries',
        create: 'POST /api/countries',
        update: 'PUT /api/countries/:id',
        delete: 'DELETE /api/countries/:id',
        description: 'Country management'
      },
      universities: {
        list: 'GET /api/universities',
        create: 'POST /api/universities',
        update: 'PUT /api/universities/:id',
        delete: 'DELETE /api/universities/:id',
        description: 'University management'
      },
      programs: {
        list: 'GET /api/programs',
        filters: 'GET /api/programs/filter-options',
        university: 'GET /api/programs/university/:country/:universityName',
        description: 'Program filtering and search'
      }
    },
    documentation: '/api/docs'
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Visa Consultancy API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for visa consultancy platform',
    
    authentication: {
      endpoint: 'POST /api/auth/login',
      body: {
        email: 'string',
        password: 'string'
      },
      response: {
        success: true,
        token: 'JWT token',
        admin: 'Admin details'
      }
    },
    
    programs: {
      description: 'Program filtering and search functionality',
      
      listPrograms: {
        endpoint: 'GET /api/programs',
        queryParams: {
          country: 'string/array - Filter by country(s)',
          city: 'string/array - Filter by city/cities',
          programLevel: 'string/array - Bachelor or Master',
          tags: 'string/array - Filter by tags',
          hasScholarship: 'boolean - Filter programs with scholarships',
          minBudget: 'number - Minimum total cost (tuition + fees)',
          maxBudget: 'number - Maximum total cost (tuition + fees)',
          search: 'string - Search in university/program names',
          sortBy: 'string - Sorting criteria',
          page: 'number - Page number (default: 1)',
          itemsPerPage: 'number - Items per page (12, 24, 48)'
        },
        sortingOptions: [
          'best_match',
          'tuition_low_high',
          'tuition_high_low',
          'application_fee_low_high',
          'application_fee_high_low',
          'total_cost_low_high',
          'total_cost_high_low',
          'university_name_az',
          'university_name_za'
        ]
      },
      
      filterOptions: {
        endpoint: 'GET /api/programs/filter-options',
        queryParams: {
          country: 'string - Optional country filter'
        }
      },
      
      universityDetails: {
        endpoint: 'GET /api/programs/university/:country/:universityName',
        urlParams: {
          country: 'string - Country name (URL encoded)',
          universityName: 'string - University name (URL encoded)'
        },
        queryParams: {
          page: 'number - Page for programs',
          itemsPerPage: 'number - Programs per page'
        }
      }
    },
    
    countries: {
      description: 'Country management (requires authentication)',
      endpoints: {
        list: 'GET /api/countries',
        create: 'POST /api/countries',
        update: 'PUT /api/countries/:id',
        delete: 'DELETE /api/countries/:id'
      }
    },
    
    universities: {
      description: 'University management (requires authentication)',
      endpoints: {
        list: 'GET /api/universities',
        create: 'POST /api/universities',
        update: 'PUT /api/universities/:id',
        delete: 'DELETE /api/universities/:id'
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== Error Handlers ====================

// Use the errorHandler middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (fallback)
app.use((err, req, res, next) => {
  // If errorHandler didn't catch it
  if (res.headersSent) {
    return next(err);
  }
  
  console.error('Uncaught Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// ==================== Server Initialization ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`✅ Server Running on Port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log('================================');
  console.log('📝 Available Endpoints:');
  console.log('  - Auth: /api/auth');
  console.log('  - Countries: /api/countries');
  console.log('  - Universities: /api/universities');
  console.log('  - Programs: /api/programs (NEW)');
  console.log('================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated!');
  });
});