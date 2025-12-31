/**
 * Internationalization (i18n) Manager
 * Handles language switching and text translation
 */

const I18n = {
  currentLanguage: 'ko',
  translations: {},
  
  /**
   * Initialize i18n system
   */
  async init(language = 'ko') {
    this.currentLanguage = language || Storage.getSettings().language || 'ko';
    
    try {
      // Load translation file
      const response = await fetch(`data/i18n/${this.currentLanguage}.json`);
      if (!response.ok) {
        throw new Error('Failed to load translation file');
      }
      this.translations = await response.json();
      
      // Update HTML lang attribute
      document.documentElement.lang = this.currentLanguage;
      
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
   */
  t(key, defaultValue = '') {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }
    
    return typeof value === 'string' ? value : (defaultValue || key);
  },
  
  /**
   * Switch language
   */
  async setLanguage(language) {
    if (this.currentLanguage === language) return true;
    
    const success = await this.init(language);
    if (success) {
      Storage.saveSettings({ language });
      // Reload page to apply translations
      window.location.reload();
    }
    return success;
  },
  
  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  }
};

// Auto-initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
  });
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.I18n = I18n;
}

