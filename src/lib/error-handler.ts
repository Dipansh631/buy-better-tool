// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Handle audio/video playback errors (common browser autoplay policy issues)
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('play() request was interrupted')) {
    console.warn('Audio playback was interrupted (likely due to browser autoplay policy)');
    event.preventDefault(); // Prevent the error from showing in console
    return;
  }
  
  // Handle other unhandled promise rejections
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('AbortError')) {
    console.warn('Request was aborted (likely due to timeout or cancellation)');
    event.preventDefault();
    return;
  }
  
  // Log other unhandled rejections
  console.error('Unhandled promise rejection:', event.reason);
});

// Global error handler for other errors
window.addEventListener('error', (event) => {
  // Handle audio/video related errors
  if (event.message && event.message.includes('play() request was interrupted')) {
    console.warn('Audio playback error handled gracefully');
    event.preventDefault();
    return;
  }
  
  // Log other errors
  console.error('Global error:', event.error);
});
