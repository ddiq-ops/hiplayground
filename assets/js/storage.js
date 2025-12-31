/**
 * Local Storage Management
 * Handles saving and retrieving user data (progress, favorites, etc.)
 */

const Storage = {
  // Keys
  KEYS: {
    LAST_PLAYED: 'hiplayground_last_played',
    FAVORITES: 'hiplayground_favorites',
    PROGRESS: 'hiplayground_progress',
    SETTINGS: 'hiplayground_settings'
  },

  /**
   * Get item from localStorage
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  /**
   * Save last played game
   */
  saveLastPlayed(gameId) {
    const data = {
      gameId,
      timestamp: Date.now()
    };
    return this.set(this.KEYS.LAST_PLAYED, data);
  },

  /**
   * Get last played game
   */
  getLastPlayed() {
    return this.get(this.KEYS.LAST_PLAYED, null);
  },

  /**
   * Get all favorites
   */
  getFavorites() {
    return this.get(this.KEYS.FAVORITES, []);
  },

  /**
   * Check if game is favorite
   */
  isFavorite(gameId) {
    const favorites = this.getFavorites();
    return favorites.includes(gameId);
  },

  /**
   * Toggle favorite status
   */
  toggleFavorite(gameId) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(gameId);
    
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(gameId);
    }
    
    return this.set(this.KEYS.FAVORITES, favorites);
  },

  /**
   * Get progress for a specific game
   */
  getGameProgress(gameId) {
    const allProgress = this.get(this.KEYS.PROGRESS, {});
    return allProgress[gameId] || null;
  },

  /**
   * Save progress for a game
   */
  saveGameProgress(gameId, progress) {
    const allProgress = this.get(this.KEYS.PROGRESS, {});
    allProgress[gameId] = {
      ...allProgress[gameId],
      ...progress,
      updatedAt: Date.now()
    };
    return this.set(this.KEYS.PROGRESS, allProgress);
  },

  /**
   * Get settings
   */
  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      language: 'ko',
      soundEnabled: true,
      fullscreen: false
    });
  },

  /**
   * Save settings
   */
  saveSettings(settings) {
    const currentSettings = this.getSettings();
    return this.set(this.KEYS.SETTINGS, { ...currentSettings, ...settings });
  },

  /**
   * Clear all data (for reset/debugging)
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      this.remove(key);
    });
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.Storage = Storage;
}

