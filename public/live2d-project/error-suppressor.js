/**
 * Global Error Suppressor for Live2D hitTest Issues
 * This must be loaded BEFORE any other scripts
 */

(function() {
  'use strict';
  
  // List of error patterns to suppress
  const SUPPRESSED_PATTERNS = [
    'hitTest',
    'Cannot read properties of null',
    'reading \'hitTest\'',
    'live2d',
    'Live2D'
  ];
  
  // Check if error should be suppressed
  function shouldSuppress(message) {
    if (!message) return false;
    const msgStr = String(message).toLowerCase();
    return SUPPRESSED_PATTERNS.some(pattern => 
      msgStr.includes(pattern.toLowerCase())
    );
  }
  
  // 1. Override console.error (earliest interception)
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (shouldSuppress(args[0])) {
      return; // Silently suppress
    }
    originalConsoleError.apply(console, args);
  };
  
  // 2. Global error handler (capture phase, highest priority)
  window.addEventListener('error', function(event) {
    if (shouldSuppress(event.message) || shouldSuppress(event.error?.message)) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // Capture phase = true for earliest interception
  
  // 3. Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (shouldSuppress(event.reason)) {
      event.preventDefault();
      return false;
    }
  });
  
  // 4. Next.js Error Overlay interceptor (must be set before Next.js loads)
  if (typeof window !== 'undefined') {
    // Store original onerror
    const originalOnError = window.onerror;
    
    window.onerror = function(message, source, lineno, colno, error) {
      if (shouldSuppress(message) || shouldSuppress(error?.message)) {
        return true; // Prevent default error handling
      }
      
      // Call original handler if exists
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
  }
  
  // 5. Wrap setTimeout/setInterval to catch async errors
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(callback, delay, ...args) {
    const wrappedCallback = function() {
      try {
        return callback.apply(this, arguments);
      } catch (error) {
        if (shouldSuppress(error?.message)) {
          return; // Suppress
        }
        throw error;
      }
    };
    return originalSetTimeout.call(window, wrappedCallback, delay, ...args);
  };
  
  window.setInterval = function(callback, delay, ...args) {
    const wrappedCallback = function() {
      try {
        return callback.apply(this, arguments);
      } catch (error) {
        if (shouldSuppress(error?.message)) {
          return; // Suppress
        }
        throw error;
      }
    };
    return originalSetInterval.call(window, wrappedCallback, delay, ...args);
  };
  
})();
