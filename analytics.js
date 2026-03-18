/**
 * Vercel Web Analytics
 * This script initializes Vercel Web Analytics for the site.
 * The analytics will only work when deployed on Vercel with Analytics enabled in the dashboard.
 */

(function() {
  // Initialize Vercel Analytics
  window.va = window.va || function () { 
    (window.vaq = window.vaq || []).push(arguments); 
  };
})();
