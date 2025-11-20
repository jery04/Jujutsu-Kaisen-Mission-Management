// Utility: authentication helpers for frontend
(function () {
  'use strict';
  // Return current user id/name stored in localStorage/sessionStorage
  function getCurrentUserId() {
    try {
      const keys = ['username','userName','currentUserName','nombre','name'];
      for (const k of keys) {
        const v = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (v && typeof v === 'string' && v.trim()) return v.trim();
      }
    } catch (e) {
      // noop
    }
    return null;
  }

  // Export to global scope for non-module pages
  try { window.getCurrentUserId = getCurrentUserId; } catch (e) { /* noop */ }
})();
