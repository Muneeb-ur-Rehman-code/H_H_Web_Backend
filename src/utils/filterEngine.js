class FilterEngine {
  // Parse currency string to number
  parseCurrency(value) {
    if (!value || value === 'Free') return 0;
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Apply all filters to program cards
  applyFilters(cards, filters = {}) {
    let filteredCards = [...cards];
    let matchScores = new Map(); // For best match sorting

    // Initialize match scores
    filteredCards.forEach((card, index) => {
      matchScores.set(index, 0);
    });

    // Country filter
    if (filters.country && filters.country.length > 0) {
      filteredCards = filteredCards.filter((card, index) => {
        const matches = filters.country.includes(card.country);
        if (matches) matchScores.set(index, matchScores.get(index) + 2); // Higher weight for country
        return matches;
      });
    }

    // City filter
    if (filters.city && filters.city.length > 0) {
      filteredCards = filteredCards.filter((card, index) => {
        const matches = filters.city.some(city => 
          card.campus_city?.toLowerCase().includes(city.toLowerCase())
        );
        if (matches) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) matchScores.set(currentIndex, matchScores.get(currentIndex) + 1.5);
        }
        return matches;
      });
    }

    // Program level filter (Bachelor or Master)
    if (filters.programLevel && filters.programLevel.length > 0) {
      filteredCards = filteredCards.filter((card) => {
        const degreeLevel = card.degree_level?.toLowerCase() || '';
        const matches = filters.programLevel.some(level => {
          const searchLevel = level.toLowerCase();
          if (searchLevel === 'bachelor' || searchLevel === 'bachelors') {
            return degreeLevel.includes('bachelor');
          }
          if (searchLevel === 'master' || searchLevel === 'masters') {
            return degreeLevel.includes('master');
          }
          return false;
        });
        if (matches) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) matchScores.set(currentIndex, matchScores.get(currentIndex) + 1);
        }
        return matches;
      });
    }

    // Tags filter (partial matching allowed, multiple tags)
    if (filters.tags && filters.tags.length > 0) {
      filteredCards = filteredCards.filter((card) => {
        const cardTags = card.tags?.toLowerCase() || '';
        const matches = filters.tags.some(tag => 
          cardTags.includes(tag.toLowerCase())
        );
        if (matches) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) matchScores.set(currentIndex, matchScores.get(currentIndex) + 0.5);
        }
        return matches;
      });
    }

    // Scholarship filter (separate from tags)
    if (filters.hasScholarship === true || filters.hasScholarship === 'true') {
      filteredCards = filteredCards.filter((card) => {
        const cardTags = card.tags?.toLowerCase() || '';
        const hasScholarship = cardTags.includes('scholarship');
        if (hasScholarship) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) matchScores.set(currentIndex, matchScores.get(currentIndex) + 1);
        }
        return hasScholarship;
      });
    }

    // Budget filter (combines tuition and application fee)
    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      filteredCards = filteredCards.filter((card) => {
        const tuition = this.parseCurrency(card.tuition_first_year);
        const appFee = this.parseCurrency(card.application_fee);
        const totalCost = tuition + appFee;
        
        let matches = true;
        if (filters.minBudget !== undefined && totalCost < parseFloat(filters.minBudget)) {
          matches = false;
        }
        if (filters.maxBudget !== undefined && totalCost > parseFloat(filters.maxBudget)) {
          matches = false;
        }
        
        if (matches) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) matchScores.set(currentIndex, matchScores.get(currentIndex) + 0.8);
        }
        return matches;
      });
    }

    // Search filter (searches in university name, program name, location)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredCards = filteredCards.filter((card) => {
        const searchIn = [
          card.university_name,
          card.program_name,
          card.location,
          card.campus_city
        ].join(' ').toLowerCase();
        
        const matches = searchIn.includes(searchTerm);
        if (matches) {
          const currentIndex = filteredCards.indexOf(card);
          if (currentIndex !== -1) {
            // Higher score for exact matches
            if (card.university_name?.toLowerCase().includes(searchTerm)) {
              matchScores.set(currentIndex, matchScores.get(currentIndex) + 2);
            } else if (card.program_name?.toLowerCase().includes(searchTerm)) {
              matchScores.set(currentIndex, matchScores.get(currentIndex) + 1.5);
            } else {
              matchScores.set(currentIndex, matchScores.get(currentIndex) + 0.5);
            }
          }
        }
        return matches;
      });
    }

    // Attach match scores to cards for sorting
    filteredCards = filteredCards.map((card, index) => ({
      ...card,
      _matchScore: matchScores.get(index) || 0
    }));

    return filteredCards;
  }

  // Extract unique filter options from cards
  extractFilterOptions(cards) {
    const options = {
      countries: [],
      cities: [],
      tags: [],
      programLevels: [],
      budgetRanges: {
        min: Infinity,
        max: 0
      }
    };

    // Use Sets for unique values
    const countrySet = new Set();
    const citySet = new Set();
    const tagSet = new Set();
    const levelSet = new Set();

    cards.forEach(card => {
      // Countries
      if (card.country) countrySet.add(card.country);

      // Cities
      if (card.campus_city) citySet.add(card.campus_city);

      // Tags (excluding scholarship-related tags for separate filter)
      if (card.tags) {
        const tags = card.tags.split(',').map(t => t.trim());
        tags.forEach(tag => {
          if (!tag.toLowerCase().includes('scholarship')) {
            tagSet.add(tag);
          }
        });
      }

      // Program levels
      if (card.degree_level) {
        const level = card.degree_level.toLowerCase();
        if (level.includes('bachelor')) levelSet.add('Bachelor');
        else if (level.includes('master')) levelSet.add('Master');
      }

      // Budget range
      const tuition = this.parseCurrency(card.tuition_first_year);
      const appFee = this.parseCurrency(card.application_fee);
      const total = tuition + appFee;
      
      if (total < options.budgetRanges.min) options.budgetRanges.min = total;
      if (total > options.budgetRanges.max) options.budgetRanges.max = total;
    });

    // Convert sets to sorted arrays
    options.countries = Array.from(countrySet).sort();
    options.cities = Array.from(citySet).sort();
    options.tags = Array.from(tagSet).sort();
    options.programLevels = Array.from(levelSet).sort();

    // Round budget ranges
    options.budgetRanges.min = Math.floor(options.budgetRanges.min);
    options.budgetRanges.max = Math.ceil(options.budgetRanges.max);

    return options;
  }
}

module.exports = new FilterEngine();