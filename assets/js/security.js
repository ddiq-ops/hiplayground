/**
 * Domain Security Check
 * Prevents unauthorized domain usage by redirecting to official domain
 */
(function() {
  'use strict';
  
  const currentHost = window.location.hostname.toLowerCase();
  const allowedDomains = ['hiplayground.com', 'localhost', '127.0.0.1', '0.0.0.0'];
  const officialDomain = 'https://hiplayground.com';
  
  // Check if current domain is allowed
  const isAllowed = allowedDomains.some(domain => {
    return currentHost === domain || currentHost.endsWith('.' + domain);
  });
  
  // If not allowed, redirect to official domain
  if (!isAllowed) {
    alert('이 사이트는 hiplayground.com 에서만 이용할 수 있습니다.\n정식 도메인으로 이동합니다.');
    window.location.href = officialDomain;
  }
})();

