/**
 * Language Selector Component
 * Handles language selector dropdown functionality
 */

(function() {
  function initLanguageSelector() {
    const langSelector = document.getElementById('lang-selector');
    if (!langSelector) return;
    
    const langToggle = document.getElementById('lang-selector-toggle');
    const langCurrent = document.getElementById('lang-selector-current');
    const langItems = langSelector.querySelectorAll('.lang-selector-item');
    
    const langLabels = {
      'ko': '한국어',
      'en': 'English',
      'zh-HK': '繁體中文(香港)'
    };
    
    function updateLangSelector() {
      if (!langCurrent) return;
      const currentLang = I18n.getLanguage();
      langCurrent.textContent = langLabels[currentLang] || '한국어';
      
      langItems.forEach(item => {
        if (item.getAttribute('data-lang') === currentLang) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    // Toggle dropdown
    if (langToggle) {
      langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langSelector.classList.toggle('active');
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (langSelector && !langSelector.contains(e.target)) {
        langSelector.classList.remove('active');
      }
    });
    
    // Handle language selection
    langItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const lang = item.getAttribute('data-lang');
        await I18n.setLanguage(lang);
        updateLangSelector();
        langSelector.classList.remove('active');
      });
    });
    
    // Update selector when language changes
    document.addEventListener('i18n:loaded', () => {
      updateLangSelector();
    });
    
    // Initial update
    updateLangSelector();
  }
  
  // Initialize when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLanguageSelector);
    } else {
      initLanguageSelector();
    }
  }
})();

