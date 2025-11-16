class SortingEngine {
  // Parse currency for sorting
  parseCurrency(value) {
    if (!value || value === 'Free') return 0;
    const cleaned = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Sort cards based on the selected criteria
  sortCards(cards, sortBy = 'best_match') {
    const sortedCards = [...cards];

    switch(sortBy) {
      case 'best_match':
        // Sort by match score (higher score = better match)
        return sortedCards.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));

      case 'tuition_low_high':
        return sortedCards.sort((a, b) => 
          this.parseCurrency(a.tuition_first_year) - this.parseCurrency(b.tuition_first_year)
        );

      case 'tuition_high_low':
        return sortedCards.sort((a, b) => 
          this.parseCurrency(b.tuition_first_year) - this.parseCurrency(a.tuition_first_year)
        );

      case 'application_fee_low_high':
        return sortedCards.sort((a, b) => 
          this.parseCurrency(a.application_fee) - this.parseCurrency(b.application_fee)
        );

      case 'application_fee_high_low':
        return sortedCards.sort((a, b) => 
          this.parseCurrency(b.application_fee) - this.parseCurrency(a.application_fee)
        );

      case 'total_cost_low_high':
        return sortedCards.sort((a, b) => {
          const costA = this.parseCurrency(a.tuition_first_year) + this.parseCurrency(a.application_fee);
          const costB = this.parseCurrency(b.tuition_first_year) + this.parseCurrency(b.application_fee);
          return costA - costB;
        });

      case 'total_cost_high_low':
        return sortedCards.sort((a, b) => {
          const costA = this.parseCurrency(a.tuition_first_year) + this.parseCurrency(a.application_fee);
          const costB = this.parseCurrency(b.tuition_first_year) + this.parseCurrency(b.application_fee);
          return costB - costA;
        });

      case 'university_name_az':
        return sortedCards.sort((a, b) => 
          (a.university_name || '').localeCompare(b.university_name || '')
        );

      case 'university_name_za':
        return sortedCards.sort((a, b) => 
          (b.university_name || '').localeCompare(a.university_name || '')
        );

      default:
        return sortedCards;
    }
  }

  // Paginate results
  paginate(items, page = 1, itemsPerPage = 12) {
    // Validate inputs
    page = Math.max(1, parseInt(page) || 1);
    itemsPerPage = parseInt(itemsPerPage) || 12;

    // Ensure itemsPerPage is one of the allowed values
    const allowedItemsPerPage = [12, 24, 48];
    if (!allowedItemsPerPage.includes(itemsPerPage)) {
      itemsPerPage = 12;
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPage = Math.min(page, totalPages || 1);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Remove internal scoring data before sending
    const cleanedItems = items.slice(startIndex, endIndex).map(item => {
      const { _matchScore, ...cleanItem } = item;
      return cleanItem;
    });

    return {
      data: cleanedItems,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        startIndex: startIndex + 1,
        endIndex,
        itemsShowing: `${startIndex + 1}-${endIndex} of ${totalItems}`
      }
    };
  }
}

module.exports = new SortingEngine();