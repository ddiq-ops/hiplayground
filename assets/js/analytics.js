/**
 * Analytics Manager
 * Uses GA4 gtag loaded in each page <head> (G-59SSSHXEHJ).
 * Do not load gtag.js here — avoids duplicate config and ensures live HTML search finds the ID.
 */

const Analytics = {
  measurementId: 'G-59SSSHXEHJ',

  getDataLayer() {
    if (typeof window === 'undefined') return null;
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  },

  /**
   * Queue event until gtag is defined (inline script in <head> usually defines it immediately).
   */
  sendEvent(eventName, payload = {}) {
    const trySend = () => {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
        return true;
      }
      return false;
    };

    if (trySend()) return;

    this.getDataLayer();
    const start = Date.now();
    const tick = () => {
      if (trySend()) return;
      if (Date.now() - start > 8000) return;
      setTimeout(tick, 50);
    };
    tick();
  },

  trackPageView(pageName) {
    this.sendEvent('page_view', {
      page_name: pageName,
      page_path: typeof window !== 'undefined' && window.location ? window.location.pathname : '',
      page_location: typeof window !== 'undefined' && window.location ? window.location.href : ''
    });
  },

  trackGamePlay(gameId) {
    this.sendEvent('game_play', { game_id: gameId });
  },

  trackGameComplete(gameId, score, time) {
    this.sendEvent('game_complete', {
      game_id: gameId,
      score: typeof score === 'number' ? score : 0,
      time_spent: typeof time === 'number' ? time : 0
    });
  },

  trackEvent(eventName, eventData = {}) {
    this.sendEvent(eventName, eventData);
  }
};

if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}
