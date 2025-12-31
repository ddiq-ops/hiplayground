/**
 * Simple Router
 * Handles client-side routing for the single-page application feel
 * Works with hash-based routing for local file serving
 */

const Router = {
  currentRoute: null,
  
  /**
   * Initialize router
   */
  init() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });
    
    // Handle initial load
    this.handleRoute();
  },
  
  /**
   * Handle current route
   */
  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0];
    const query = this.parseQuery(hash);
    
    this.currentRoute = { path, query };
    
    // Emit route change event
    document.dispatchEvent(new CustomEvent('route:change', {
      detail: { path, query }
    }));
  },
  
  /**
   * Parse query string
   */
  parseQuery(hash) {
    const query = {};
    const queryString = hash.split('?')[1];
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          query[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      });
    }
    
    return query;
  },
  
  /**
   * Navigate to a route
   */
  navigate(path, query = {}) {
    let url = `#${path}`;
    
    const queryString = Object.entries(query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      url += `?${queryString}`;
    }
    
    window.location.hash = url;
  },
  
  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute || { path: '/', query: {} };
  },
  
  /**
   * Navigate to game list
   */
  goToGames() {
    // For local file serving, we'll use direct page navigation
    window.location.href = 'pages/games.html';
  },
  
  /**
   * Navigate to category page
   */
  goToCategory(categoryId) {
    window.location.href = `pages/category.html?c=${encodeURIComponent(categoryId)}`;
  },
  
  /**
   * Navigate to play page
   */
  goToPlay(gameId) {
    window.location.href = `pages/play.html?id=${encodeURIComponent(gameId)}`;
  },
  
  /**
   * Navigate to home
   */
  goToHome() {
    window.location.href = 'index.html';
  },
  
  /**
   * Go back
   */
  goBack() {
    window.history.back();
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.Router = Router;
}

