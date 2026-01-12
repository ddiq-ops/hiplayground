/**
 * Internationalization (i18n) Manager
 * Handles language switching and text translation
 */

const I18n = {
  currentLanguage: 'ko',
  translations: {},
  
  /**
   * Get base path for data files (handles different page locations)
   */
  getBasePath() {
    // Get current page path
    const href = window.location.href;
    const pathname = window.location.pathname;
    
    // Check if we're in pages/ folder
    if (href.includes('/pages/') || href.includes('\\pages\\') || 
        pathname.includes('/pages/') || pathname.includes('\\pages\\')) {
      return '../';
    }
    
    // For file:// protocol, check the directory structure
    if (href.startsWith('file://')) {
      try {
        const url = new URL(href);
        const pathParts = url.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          // If the file is in pages/ directory
          if (pathParts.includes('pages')) {
            return '../';
          }
        }
      } catch (e) {
        // If URL parsing fails, use simple string check
        if (href.includes('pages')) {
          return '../';
        }
      }
    }
    
    return './';
  },
  
  /**
   * Initialize i18n system
   */
  async init(language = null) {
    // If language is not provided, try to get from storage or default to 'ko'
    if (!language && typeof Storage !== 'undefined') {
      const settings = Storage.getSettings();
      language = settings.language || 'ko';
    }
    this.currentLanguage = language || 'ko';
    
    try {
      const basePath = this.getBasePath();
      // Load translation file
      const response = await fetch(`${basePath}data/i18n/${this.currentLanguage}.json`);
      if (!response.ok) {
        throw new Error('Failed to load translation file');
      }
      this.translations = await response.json();
      
      // Update HTML lang attribute
      document.documentElement.lang = this.currentLanguage;
      
      // Apply translations to page
      if (typeof document !== 'undefined' && document.readyState === 'complete') {
        this.translatePage();
      }
      
      // Trigger translation update event
      document.dispatchEvent(new CustomEvent('i18n:loaded', { 
        detail: { language: this.currentLanguage } 
      }));
      
      return true;
    } catch (error) {
      console.error('i18n init error:', error);
      // Fallback to default language
      if (this.currentLanguage !== 'ko') {
        return this.init('ko');
      }
      return false;
    }
  },
  
  /**
   * Translate a key (supports nested keys like "nav.home")
   * Returns the value at the key path, or defaultValue if not found
   */
  t(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue !== null ? defaultValue : key;
      }
    }
    
    // Return the value if it's not undefined/null, otherwise return defaultValue or key
    if (value !== undefined && value !== null) {
      return value;
    }
    return defaultValue !== null ? defaultValue : key;
  },
  
  /**
   * Translate all elements with data-i18n attribute
   */
  translatePage() {
    // Translate all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation && translation !== key) {
        // Handle different element types
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (element.type === 'submit' || element.type === 'button') {
            element.value = translation;
          } else {
            element.placeholder = translation;
          }
        } else if (element.tagName === 'OPTION') {
          element.textContent = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
    
    // Translate title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation && translation !== key) {
        element.title = translation;
      }
    });
  },
  
  /**
   * Switch language
   */
  async setLanguage(language) {
    if (this.currentLanguage === language) return true;
    
    const success = await this.init(language);
    if (success) {
      Storage.saveSettings({ language });
      // Apply translations without page reload
      this.translatePage();
      // Trigger translation update event (init already does this, but ensure it's dispatched)
      document.dispatchEvent(new CustomEvent('i18n:loaded', { 
        detail: { language: this.currentLanguage } 
      }));
    }
    return success;
  },
  
  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  },
  
  /**
   * Get game title (from translations or fallback to manifest/data)
   */
  getGameTitle(gameId, manifest = null, gameData = null) {
    // Try to get from translations first
    const titleKey = `gameDetails.${gameId}.title`;
    const translatedTitle = this.t(titleKey);
    if (translatedTitle && translatedTitle !== titleKey) {
      return translatedTitle;
    }
    
    // Fallback to manifest or gameData
    if (manifest) {
      const lang = this.currentLanguage;
      if (lang === 'en' && manifest.titleEn) {
        return manifest.titleEn;
      } else if (lang === 'zh-HK' && manifest.titleZhHK) {
        return manifest.titleZhHK;
      } else if (manifest.title) {
        return manifest.title;
      }
    }
    
    if (gameData) {
      const lang = this.currentLanguage;
      if (lang === 'en' && gameData.titleEn) {
        return gameData.titleEn;
      } else if (gameData.title) {
        return gameData.title;
      }
    }
    
    return '게임';
  },
  
  /**
   * Get game description (from translations or fallback to manifest/data)
   */
  getGameDescription(gameId, manifest = null, gameData = null) {
    // Try to get from translations first
    const descKey = `gameDetails.${gameId}.description`;
    const translatedDesc = this.t(descKey);
    if (translatedDesc && translatedDesc !== descKey) {
      return translatedDesc;
    }
    
    // Fallback to manifest or gameData
    if (manifest) {
      const lang = this.currentLanguage;
      if (lang === 'en' && manifest.descriptionEn) {
        return manifest.descriptionEn;
      } else if (lang === 'zh-HK' && manifest.descriptionZhHK) {
        return manifest.descriptionZhHK;
      } else if (manifest.description) {
        return manifest.description;
      }
    }
    
    if (gameData) {
      const lang = this.currentLanguage;
      if (lang === 'en' && gameData.descriptionEn) {
        return gameData.descriptionEn;
      } else if (gameData.description) {
        return gameData.description;
      }
    }
    
    return '';
  },
  
  /**
   * Get game description data (howToPlay, strategy, about)
   * Returns data from translations or falls back to GameDescriptions
   */
  getGameDescriptionData(gameId) {
    const baseKey = `gameDetails.${gameId}`;
    const descData = {
      howToPlay: null,
      strategy: null,
      about: null
    };
    
    // Try to get from translations first
    const gameTranslations = this.t(baseKey, null);
    if (gameTranslations && typeof gameTranslations === 'object' && gameTranslations !== baseKey) {
      // Get howToPlay from translations
      if (gameTranslations.howToPlay) {
        descData.howToPlay = {
          title: gameTranslations.howToPlay.title || '',
          steps: Array.isArray(gameTranslations.howToPlay.steps) ? gameTranslations.howToPlay.steps : []
        };
      }
      
      // Get strategy from translations
      if (gameTranslations.strategy) {
        descData.strategy = {
          title: gameTranslations.strategy.title || '',
          tips: Array.isArray(gameTranslations.strategy.tips) ? gameTranslations.strategy.tips : []
        };
      }
      
      // Get about from translations
      if (gameTranslations.about) {
        descData.about = {
          title: gameTranslations.about.title || '',
          description: gameTranslations.about.description || ''
        };
      }
    }
    
    // Fallback to GameDescriptions if available
    if ((!descData.howToPlay && !descData.strategy && !descData.about) && typeof GameDescriptions !== 'undefined') {
      const fallbackData = GameDescriptions[gameId];
      if (fallbackData) {
        return fallbackData;
      }
    }
    
    // Return null values if no data found (to indicate no description available)
    if (!descData.howToPlay && !descData.strategy && !descData.about) {
      return null;
    }
    
    return descData;
  }
};

// Auto-initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await I18n.init();
    I18n.translatePage();
  });
  
  // Also translate when page is fully loaded (for dynamically added content)
  if (document.readyState === 'complete') {
    I18n.init().then(() => I18n.translatePage());
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.I18n = I18n;
}

