const fs = require('fs');
const path = require('path');

class DataManager {
  constructor() {
    this.dataCache = new Map(); // Using Map for better performance
    this.dataPath = path.join(process.cwd(), 'data');
    this.cacheTimeout = 1000 * 60 * 60; // 1 hour cache
    this.lastCacheTime = new Map();
  }

  // Check if cache is still valid
  isCacheValid(key) {
    if (!this.lastCacheTime.has(key)) return false;
    const elapsed = Date.now() - this.lastCacheTime.get(key);
    return elapsed < this.cacheTimeout;
  }

  // Get all available countries
  getAvailableCountries() {
    try {
      const countries = fs.readdirSync(this.dataPath)
        .filter(item => {
          const itemPath = path.join(this.dataPath, item);
          return fs.statSync(itemPath).isDirectory();
        });
      return countries;
    } catch (error) {
      console.error('Error reading countries:', error);
      return [];
    }
  }

  // Load data for a specific country with caching
  loadCountryData(country) {
    const cacheKey = `country_${country}`;
    
    // Return cached data if valid
    if (this.dataCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    try {
      const countryPath = path.join(this.dataPath, country);
      const cardsPath = path.join(countryPath, 'university_cards.json');
      const detailsPath = path.join(countryPath, 'university_details.json');

      let cards = [];
      let details = [];

      // Load university cards
      if (fs.existsSync(cardsPath)) {
        const rawData = fs.readFileSync(cardsPath, 'utf8');
        cards = JSON.parse(rawData);
        console.log(`Loaded ${cards.length} cards from ${country}`);
      }

      // Load university details
      if (fs.existsSync(detailsPath)) {
        const rawData = fs.readFileSync(detailsPath, 'utf8');
        details = JSON.parse(rawData);
        console.log(`Loaded ${details.length} university details from ${country}`);
      }

      const data = { cards, details };
      
      // Update cache
      this.dataCache.set(cacheKey, data);
      this.lastCacheTime.set(cacheKey, Date.now());
      
      return data;
    } catch (error) {
      console.error(`Error loading data for ${country}:`, error);
      return { cards: [], details: [] };
    }
  }

  // Get all program cards from all countries (with lazy loading)
  getAllProgramCards(countriesFilter = null) {
    const cacheKey = 'all_cards';
    
    // If no country filter and cache is valid, return cached data
    if (!countriesFilter && this.dataCache.has(cacheKey) && this.isCacheValid(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    let allCards = [];
    const countriesToLoad = countriesFilter || this.getAvailableCountries();

    countriesToLoad.forEach(country => {
      const { cards } = this.loadCountryData(country);
      allCards = allCards.concat(cards);
    });

    // Cache the result if no filter was applied
    if (!countriesFilter) {
      this.dataCache.set(cacheKey, allCards);
      this.lastCacheTime.set(cacheKey, Date.now());
    }

    console.log(`Total cards loaded: ${allCards.length}`);
    return allCards;
  }

  // Get university details by name and country
  getUniversityDetails(universityName, country) {
    const { details } = this.loadCountryData(country);
    return details.find(uni => 
      uni.university_name.toLowerCase() === universityName.toLowerCase()
    );
  }

  // Get programs for a specific university
  getUniversityPrograms(universityName, country) {
    const { cards } = this.loadCountryData(country);
    return cards.filter(card => 
      card.university_name.toLowerCase() === universityName.toLowerCase()
    );
  }

  // Clear cache (useful for development)
  clearCache() {
    this.dataCache.clear();
    this.lastCacheTime.clear();
    console.log('Cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.dataCache.size,
      cacheKeys: Array.from(this.dataCache.keys()),
      cacheTimeout: this.cacheTimeout / 1000 / 60 + ' minutes'
    };
  }
}

// Export singleton instance
module.exports = new DataManager();