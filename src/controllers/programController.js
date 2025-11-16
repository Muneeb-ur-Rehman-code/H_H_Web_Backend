const dataManager = require('../utils/dataManager');
const filterEngine = require('../utils/filterEngine');
const sortingEngine = require('../utils/sortingEngine');

class ProgramController {
  // Get filtered and sorted program cards with pagination
  async getProgramCards(req, res, next) {
    try {
      const startTime = Date.now();
      
      // Extract query parameters
      const {
        // Filters
        country,
        location,  // New location filter (state/province)
        city,
        programLevel,
        tags,
        hasScholarship,
        minBudget,
        maxBudget,
        search,
        
        // Sorting
        sortBy = 'best_match',
        
        // Pagination
        page = 1,
        itemsPerPage = 12
      } = req.query;

      // Build filters object
      const filters = {};
      
      // Handle array parameters (can be single value or array)
      if (country) filters.country = Array.isArray(country) ? country : [country];
      if (location) filters.location = Array.isArray(location) ? location : [location];
      if (city) filters.city = Array.isArray(city) ? city : [city];
      if (programLevel) filters.programLevel = Array.isArray(programLevel) ? programLevel : [programLevel];
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      
      // Handle boolean and numeric parameters
      if (hasScholarship !== undefined) filters.hasScholarship = hasScholarship;
      if (minBudget !== undefined) filters.minBudget = minBudget;
      if (maxBudget !== undefined) filters.maxBudget = maxBudget;
      if (search) filters.search = search;

      // Load data (with smart caching)
      const allCards = dataManager.getAllProgramCards(filters.country);

      // Apply filters
      let filteredCards = filterEngine.applyFilters(allCards, filters);

      // Apply sorting
      filteredCards = sortingEngine.sortCards(filteredCards, sortBy);

      // Apply pagination
      const result = sortingEngine.paginate(
        filteredCards,
        parseInt(page),
        parseInt(itemsPerPage)
      );

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Send response
      res.json({
        success: true,
        ...result,
        filters: {
          applied: filters,
          sortBy
        },
        meta: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get available filter options (with hierarchy)
  async getFilterOptions(req, res, next) {
    try {
      // Optional: filter options based on country
      const { country, location } = req.query;
      
      // Load cards
      const cards = country 
        ? dataManager.getAllProgramCards([country])
        : dataManager.getAllProgramCards();

      // Extract filter options
      const options = filterEngine.extractFilterOptions(cards);

      // If specific country requested, provide filtered location data
      if (country && options.locationHierarchy[country]) {
        options.locationsInCountry = Object.keys(options.locationHierarchy[country]).sort();
        
        // If specific location also requested, provide cities
        if (location) {
          options.citiesInLocation = filterEngine.getCitiesForLocation(cards, country, location);
        }
      }

      res.json({
        success: true,
        filters: options,
        meta: {
          totalPrograms: cards.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get dynamic location options (for cascading dropdowns)
  async getDynamicLocationOptions(req, res, next) {
    try {
      const { country, location } = req.query;
      
      if (!country) {
        return res.status(400).json({
          success: false,
          error: 'Country parameter is required'
        });
      }

      const cards = dataManager.getAllProgramCards([country]);
      
      let result = {};

      if (!location) {
        // Get all locations for the country
        result.locations = filterEngine.getLocationsForCountry(cards, country);
      } else {
        // Get all cities for the country and location
        result.cities = filterEngine.getCitiesForLocation(cards, country, location);
      }

      res.json({
        success: true,
        data: result,
        meta: {
          country,
          location: location || null,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get university details (without separate programs since they're included)
  async getUniversityDetails(req, res, next) {
    try {
      const { country, universityName } = req.params;
      
      // Decode URL parameters
      const decodedCountry = decodeURIComponent(country);
      const decodedUniversityName = decodeURIComponent(universityName);

      // Get university details
      const universityDetails = dataManager.getUniversityDetails(
        decodedUniversityName, 
        decodedCountry
      );

      if (!universityDetails) {
        return res.status(404).json({
          success: false,
          error: `University "${decodedUniversityName}" not found in ${decodedCountry}`
        });
      }

      // Return only university details (programs are already included in programs_list)
      res.json({
        success: true,
        data: universityDetails,
        meta: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Get cache statistics (useful for monitoring)
  async getCacheStats(req, res, next) {
    try {
      const stats = dataManager.getCacheStats();
      res.json({
        success: true,
        stats,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear cache (useful for development)
  async clearCache(req, res, next) {
    try {
      dataManager.clearCache();
      res.json({
        success: true,
        message: 'Cache cleared successfully',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProgramController();