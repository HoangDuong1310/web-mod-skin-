/**
 * Global Error Suppressor for Live2D hitTest Issues
 * This must be loaded BEFORE any other scripts
 */

(function() {
  'use strict';
  
  // List of error patterns to suppress
  var SUPPRESSED_PATTERNS = [
    'hitTest',
    'Cannot read properties of null',
    'reading \'hitTest\'',
    'live2d',
    'Live2D'
  ];
  
  // Check if error should be suppressed
  function shouldSuppress(message) {
    if (!message) return false;
    var msgStr = String(message).toLowerCase();
    for (var i = 0; i < SUPPRESSED_PATTERNS.length; i++) {
      if (msgStr.indexOf(SUPPRESSED_PATTERNS[i].toLowerCase()) !== -1) {
        return true;
      }
    }
    return false;
  }
  
  // 1. Override console.error (earliest interception)
  var originalConsoleError = console.error;
  console.error = function() {
    if (arguments.length > 0 && shouldSuppress(arguments[0])) {
      return; // Silently suppress
    }
    originalConsoleError.apply(console, arguments);
  };
  
  // 2. Global error handler (capture phase, highest priority)
  window.addEventListener('error', function(event) {
    if (shouldSuppress(event.message) || (event.error && shouldSuppress(event.error.message))) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // Capture phase = true for earliest interception
  
  // 3. Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (shouldSuppress(String(event.reason))) {
      event.preventDefault();
      return false;
    }
  });
  
  // 4. Next.js Error Overlay interceptor (must be set before Next.js loads)
  if (typeof window !== 'undefined') {
    // Store original onerror
    var originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      if (shouldSuppress(message) || (error && shouldSuppress(error.message))) {
        return true; // Prevent default error handling
      }
      
      // Call original handler if exists
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
  }
  
  // NOTE: setTimeout/setInterval wrapping removed to avoid 'bind' errors
  // with non-function callbacks and framework compatibility issues
  
})();
