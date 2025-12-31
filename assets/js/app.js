/**
 * Main Application Controller
 * Coordinates between different modules and handles app-wide logic
 */

const App = {
  games: [],
  categories: [],
  
  /**
   * Get base path for data files (handles different page locations)
   */
  getBasePath() {
    // Check if we're in pages/ folder
    const path = window.location.pathname || window.location.href;
    if (path.includes('/pages/') || path.includes('\\pages\\')) {
      return '../';
    }
    return './';
  },
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Load games and categories data
      await this.loadData();
      
      // Initialize router
      Router.init();
      
      // Initialize i18n (already auto-initializes, but ensure it's ready)
      await I18n.init();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization error:', error);
      this.showError('앱을 초기화하는 중 오류가 발생했습니다: ' + error.message);
    }
  },
  
  /**
   * Load games and categories data
   */
  async loadData() {
    try {
      const basePath = this.getBasePath();
      
      // Load games
      const gamesResponse = await fetch(`${basePath}data/games.json`);
      if (!gamesResponse.ok) throw new Error(`Failed to load games: ${gamesResponse.status}`);
      this.games = await gamesResponse.json();
      
      // Load categories
      const categoriesResponse = await fetch(`${basePath}data/categories.json`);
      if (!categoriesResponse.ok) throw new Error(`Failed to load categories: ${categoriesResponse.status}`);
      this.categories = await categoriesResponse.json();
      
      return { games: this.games, categories: this.categories };
    } catch (error) {
      console.error('Data loading error:', error);
      throw error;
    }
  },
  
  /**
   * Get all games
   */
  getGames() {
    return this.games;
  },
  
  /**
   * Get game by ID
   */
  getGameById(gameId) {
    return this.games.find(game => game.id === gameId) || null;
  },
  
  /**
   * Get games by category
   */
  getGamesByCategory(categoryId) {
    if (!categoryId || categoryId === 'all') {
      return this.games;
    }
    return this.games.filter(game => game.category === categoryId);
  },
  
  /**
   * Search games
   */
  searchGames(query) {
    if (!query) return this.games;
    
    const lowerQuery = query.toLowerCase();
    return this.games.filter(game => {
      return game.title.toLowerCase().includes(lowerQuery) ||
             game.titleEn.toLowerCase().includes(lowerQuery) ||
             game.description.toLowerCase().includes(lowerQuery) ||
             game.descriptionEn.toLowerCase().includes(lowerQuery) ||
             game.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
  },
  
  /**
   * Filter and sort games
   */
  filterAndSortGames(games, filters = {}) {
    let result = [...games];
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
      result = result.filter(game => game.category === filters.category);
    }
    
    // Filter by difficulty
    if (filters.difficulty && filters.difficulty !== 'all') {
      result = result.filter(game => game.difficulty === filters.difficulty);
    }
    
    // Sort
    if (filters.sort === 'popular') {
      result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (filters.sort === 'new') {
      result.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    }
    
    return result;
  },
  
  /**
   * Get all categories
   */
  getCategories() {
    return this.categories;
  },
  
  /**
   * Get category by ID
   */
  getCategoryById(categoryId) {
    return this.categories.find(cat => cat.id === categoryId) || null;
  },
  
  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle clicks on game cards
    document.addEventListener('click', (e) => {
      const gameCard = e.target.closest('.game-card');
      if (gameCard && gameCard.dataset.gameId) {
        const gameId = gameCard.dataset.gameId;
        Router.goToPlay(gameId);
        Analytics.trackGamePlay(gameId);
      }
      
      // Handle category cards
      const categoryCard = e.target.closest('.category-card');
      if (categoryCard && categoryCard.dataset.categoryId) {
        const categoryId = categoryCard.dataset.categoryId;
        Router.goToCategory(categoryId);
      }
    });
  },
  
  /**
   * Show error message
   */
  showError(message) {
    // Simple error display (can be enhanced with a toast/notification component)
    alert(message);
  }
};

// Initialize app when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.App = App;
}

