/**
 * UI Utility Functions
 * Helper functions for common UI operations
 */

const UI = {
  /**
   * Get base path for assets (handles different page locations)
   */
  getBasePath() {
    const href = window.location.href;
    const pathname = window.location.pathname;
    
    if (href.includes('/pages/') || href.includes('\\pages\\') || 
        href.includes('/pages') || href.includes('\\pages') ||
        pathname.includes('/pages/') || pathname.includes('\\pages\\') ||
        pathname.includes('/pages') || pathname.includes('\\pages')) {
      return '../';
    }
    
    return './';
  },
  
  /**
   * Render icon (supports both emoji and image paths)
   */
  renderIcon(icon, className = 'game-card-icon') {
    if (!icon) return '<div class="' + className + '">🎮</div>';
    
    // Check if icon is an image path (starts with http://, https://, /, or contains image extension)
    if (icon.match(/^(https?:\/\/|\/|\.\/|\.\.\/|assets\/)/) || icon.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
      const basePath = this.getBasePath();
      const iconPath = icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') 
        ? icon 
        : basePath + icon;
      return `<img src="${iconPath}" alt="Game icon" class="${className} game-icon-image" />`;
    }
    
    // Otherwise, treat as emoji
    return `<div class="${className}">${icon}</div>`;
  },
  
  /**
   * Show loading indicator
   */
  showLoading(container) {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-container';
    loadingEl.innerHTML = '<div class="spinner"></div>';
    container.innerHTML = '';
    container.appendChild(loadingEl);
  },
  
  /**
   * Show empty state
   */
  showEmptyState(container, message = '내용이 없습니다', icon = '📭') {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'empty-state';
    emptyEl.innerHTML = `
      <div class="empty-state-icon">${icon}</div>
      <p>${message}</p>
    `;
    container.innerHTML = '';
    container.appendChild(emptyEl);
  },
  
  /**
   * Create game card element
   */
  createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'card game-card';
    card.dataset.gameId = game.id;
    
    const isFavorite = Storage.isFavorite(game.id);
    
    // Use I18n to get translated title and description
    let gameTitle = game.title;
    let gameDescription = game.description;
    let playButtonText = '플레이';
    
    if (typeof I18n !== 'undefined') {
      gameTitle = I18n.getGameTitle(game.id, null, game);
      gameDescription = I18n.getGameDescription(game.id, null, game);
      playButtonText = I18n.t('games.play', '플레이');
    }
    
    card.innerHTML = `
      ${isFavorite ? '<div class="game-card-badge">⭐</div>' : ''}
      ${this.renderIcon(game.icon)}
      <div class="game-card-title">${gameTitle}</div>
      <div class="game-card-description">${gameDescription}</div>
      <button class="btn btn-primary">${playButtonText}</button>
    `;
    
    return card;
  },
  
  /**
   * Create category card element
   */
  createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'card category-card';
    card.dataset.categoryId = category.id;
    
    card.innerHTML = `
      <div class="category-card-icon">${category.icon || '📁'}</div>
      <div class="category-card-title">${category.name}</div>
      <div class="card-body">${category.description}</div>
    `;
    
    return card;
  },
  
  /**
   * Render game cards grid
   */
  renderGameCards(container, games) {
    if (!games || games.length === 0) {
      this.showEmptyState(container, I18n.t('games.noGames', '게임을 찾을 수 없습니다'), '🎮');
      return;
    }
    
    container.innerHTML = '';
    games.forEach(game => {
      const card = this.createGameCard(game);
      container.appendChild(card);
    });
  },
  
  /**
   * Render category cards grid
   */
  renderCategoryCards(container, categories) {
    if (!categories || categories.length === 0) {
      this.showEmptyState(container, '카테고리가 없습니다', '📁');
      return;
    }
    
    container.innerHTML = '';
    categories.forEach(category => {
      const card = this.createCategoryCard(category);
      container.appendChild(card);
    });
  },
  
  /**
   * Debounce function for search input
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.UI = UI;
}

