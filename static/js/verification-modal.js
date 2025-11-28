(function() {
  // Don't show on login/register/dashboard pages or if already verified
  const currentPath = window.location.pathname;
  const shouldBypass = currentPath.startsWith('/login') || 
                       currentPath.startsWith('/register') || 
                       currentPath.startsWith('/dash') || 
                       currentPath.startsWith('/dashboard') ||
                       currentPath.startsWith('/api');
  
  if (shouldBypass) return;
  
  // Check if already verified
  if (document.cookie.includes('browser_verified=true')) {
    return;
  }
  
  // Inject CSS if not already present
  if (!document.querySelector('link[href="/static/css/verification-modal.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/verification-modal.css';
    document.head.appendChild(link);
  }
  
  // Create modal HTML
  const modalHTML = `
    <div class="verification-overlay" id="verificationOverlay">
      <div class="verification-modal">
        <div class="verification-logo">Glowi.es</div>
        <p class="verification-subtitle">Verifying your browser security...</p>
        
        <div class="verification-progress-container">
          <div class="verification-progress-bar">
            <div class="verification-progress-fill" id="progressFill"></div>
          </div>
          <p class="verification-status" id="statusText">This process usually takes a few seconds...</p>
        </div>
        
        <div class="verification-message" id="verifyMessage">
          Almost done... We're performing additional security checks to ensure a safe connection.
        </div>
        
        <div class="verification-checkmark" id="checkmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <div class="verification-complete" id="completeText">Verification complete!</div>
      </div>
    </div>
  `;
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      startVerification();
    });
  } else {
    if (document.body) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      startVerification();
    }
  }
  
  function startVerification() {
    const overlay = document.getElementById('verificationOverlay');
    if (!overlay) return;
    
    // Disable scrolling and interactions
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'auto';
    
    // Collect browser fingerprint
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timestamp: Date.now()
    };
    
    // Send verification request
    fetch('/api/verify/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fingerprint)
    }).catch(e => console.warn('Verification request failed:', e));
    
    // Complete after animation (3.5s)
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
      overlay.style.animation = 'fadeOutOverlay 0.4s ease-out forwards';
      setTimeout(() => {
        overlay.remove();
      }, 400);
    }, 3500);
  }
  
  // Add fade out animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOutOverlay {
      from {
        opacity: 1;
        backdrop-filter: blur(12px);
      }
      to {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
    }
  `;
  document.head.appendChild(style);
})();
