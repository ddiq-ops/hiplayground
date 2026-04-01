/**
 * Analytics Manager
 * Sends events to Google Tag Manager via dataLayer.
 */

const Analytics = {
  /**
   * Ensure dataLayer exists and return it.
   */
  getDataLayer() {
    if (typeof window === 'undefined') return null;
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  },

  /**
   * Push a normalized event payload into GTM dataLayer.
   */
  push(eventName, payload = {}) {
    const dataLayer = this.getDataLayer();
    if (!dataLayer) return;
    dataLayer.push({
      event: eventName,
      ...payload
    });
  },

  /**
   * Track a page view
   */
  trackPageView(pageName) {
    console.log('Analytics: Page view', pageName);
    this.push('page_view', {
      page_name: pageName,
      page_path: (typeof window !== 'undefined' && window.location) ? window.location.pathname : ''
    });
  },
  
  /**
   * Track a game play event
   */
  trackGamePlay(gameId) {
    console.log('Analytics: Game played', gameId);
    this.push('game_play', { game_id: gameId });
  },
  
  /**
   * Track a game completion
   */
  trackGameComplete(gameId, score, time) {
    console.log('Analytics: Game completed', { gameId, score, time });
    this.push('game_complete', {
      game_id: gameId,
      score: typeof score === 'number' ? score : 0,
      time_spent: typeof time === 'number' ? time : 0
    });
  },
  
  /**
   * Track a custom event
   */
  trackEvent(eventName, eventData = {}) {
    console.log('Analytics: Event', eventName, eventData);
    this.push(eventName, eventData);
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}

