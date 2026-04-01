/**
 * Analytics Manager
 * Sends events to Google Analytics 4.
 */

const Analytics = {
  measurementId: 'G-59SSSHXEHJ',
  initialized: false,
  scriptLoaded: false,
  pendingEvents: [],

  /**
   * Ensure dataLayer exists and return it.
   */
  getDataLayer() {
    if (typeof window === 'undefined') return null;
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
  },

  /**
   * Ensure gtag is available and GA4 is configured.
   */
  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    const dataLayer = this.getDataLayer();
    if (!dataLayer) return;

    // Define gtag bridge once.
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }

    // Load GA4 library only once.
    if (!this.scriptLoaded) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => {
        this.flushPendingEvents();
      };
      document.head.appendChild(script);
      this.scriptLoaded = true;
    }

    window.gtag('js', new Date());
    // Avoid duplicate automatic page_view since pages already call trackPageView.
    window.gtag('config', this.measurementId, { send_page_view: false });

    this.initialized = true;
  },

  /**
   * Send event through gtag, queueing until gtag is ready.
   */
  sendEvent(eventName, payload = {}) {
    this.init();
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      this.pendingEvents.push({ eventName, payload });
      return;
    }
    window.gtag('event', eventName, payload);
  },

  /**
   * Flush queued events once gtag is available.
   */
  flushPendingEvents() {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    if (!this.pendingEvents.length) return;
    this.pendingEvents.forEach(({ eventName, payload }) => {
      window.gtag('event', eventName, payload);
    });
    this.pendingEvents = [];
  },

  /**
   * Track a page view
   */
  trackPageView(pageName) {
    this.sendEvent('page_view', {
      page_name: pageName,
      page_path: (typeof window !== 'undefined' && window.location) ? window.location.pathname : '',
      page_location: (typeof window !== 'undefined' && window.location) ? window.location.href : ''
    });
  },
  
  /**
   * Track a game play event
   */
  trackGamePlay(gameId) {
    this.sendEvent('game_play', { game_id: gameId });
  },
  
  /**
   * Track a game completion
   */
  trackGameComplete(gameId, score, time) {
    this.sendEvent('game_complete', {
      game_id: gameId,
      score: typeof score === 'number' ? score : 0,
      time_spent: typeof time === 'number' ? time : 0
    });
  },
  
  /**
   * Track a custom event
   */
  trackEvent(eventName, eventData = {}) {
    this.sendEvent(eventName, eventData);
  }
};

// Initialize immediately so collection starts as soon as script is loaded.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init(), { once: true });
  } else {
    Analytics.init();
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}

