(function() {
  
  const currentPath = window.location.pathname;
  const shouldBypass = currentPath.startsWith('/login') || 
                       currentPath.startsWith('/register') || 
                       currentPath.startsWith('/dash') || 
                       currentPath.startsWith('/dashboard') ||
                       currentPath.startsWith('/api');
  
  if (shouldBypass) return;
  
  
  if (document.cookie.includes('browser_verified=true')) {
    return;
  }
  
  
  if (!document.querySelector('link[href="/static/css/verification-modal.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/static/css/verification-modal.css';
    document.head.appendChild(link);
  }
  
  
  const modalHTML = `
    <div class="verification-overlay" id="verificationOverlay">
      <div class="verification-modal">
        <div class="verification-brand">Glowi.es</div>
        
        <div class="verification-title">Verifying Browser Security</div>
        <p class="verification-subtitle">Analyzing your connection & browser fingerprint</p>
        
        <!-- Multi-stage progress indicators -->
        <div class="verification-stages" id="verificationStages">
          <div class="verification-stage active" id="stage1"></div>
          <div class="verification-stage" id="stage2"></div>
          <div class="verification-stage" id="stage3"></div>
        </div>
        
        <!-- Advanced progress bar with status -->
        <div class="verification-progress-container">
          <div class="verification-progress-info">
            <span class="verification-progress-status" id="progressStatus">Scanning security profile...</span>
            <span class="verification-progress-time" id="progressTime">3.2s</span>
          </div>
          <div class="verification-bar-wrapper">
            <div class="verification-progress-fill" id="progressFill"></div>
          </div>
        </div>
        
        <!-- Status message -->
        <div class="verification-message" id="verifyMessage">
          Analyzing browser fingerprint, security headers, and connection encryption. This ensures secure access to protected resources.
        </div>
        
        <!-- Success state -->
        <div class="verification-success-container" id="successContainer">
          <div class="verification-checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="verification-complete-text">Browser Verified</div>
          <div class="verification-redirect-hint">Redirecting you now...</div>
        </div>
      </div>
    </div>
  `;
  
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      startAdvancedVerification();
    });
  } else {
    if (document.body) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      startAdvancedVerification();
    }
  }
  
  function startAdvancedVerification() {
    const overlay = document.getElementById('verificationOverlay');
    const progressFill = document.getElementById('progressFill');
    const progressStatus = document.getElementById('progressStatus');
    const progressTime = document.getElementById('progressTime');
    const successContainer = document.getElementById('successContainer');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');
    const stage3 = document.getElementById('stage3');
    
    if (!overlay) return;
    
    
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'auto';
    
    
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
      webglVendor: getWebGLVendor(),
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      timestamp: Date.now(),
      screenOrientation: screen.orientation?.type || 'unknown'
    };
    
    
    setTimeout(() => {
      progressStatus.textContent = 'Collecting browser fingerprint...';
      stage1.classList.add('completed');
      stage2.classList.add('active');
    }, 600);
    
    
    setTimeout(() => {
      progressStatus.textContent = 'Analyzing security headers...';
      stage2.classList.add('completed');
      stage3.classList.add('active');
    }, 1400);
    
    
    setTimeout(() => {
      progressStatus.textContent = 'Finalizing verification...';
    }, 2200);
    
    
    fetch('/api/verify/browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fingerprint),
      credentials: 'include'
    })
    .then(res => res.json())
    .catch(e => console.warn('Verification request failed:', e));
    
    
    let seconds = 3.2;
    const timerInterval = setInterval(() => {
      seconds = Math.max(0, seconds - 0.1);
      progressTime.textContent = seconds.toFixed(1) + 's';
    }, 100);
    
    
    setTimeout(() => {
      clearInterval(timerInterval);
      stage3.classList.add('completed');
      
      
      successContainer.style.opacity = '1';
      
      
      document.getElementById('verifyMessage').style.opacity = '0';
      document.getElementById('verificationStages').style.opacity = '0';
      document.querySelector('.verification-progress-container').style.opacity = '0';
      
      
      setTimeout(() => {
        overlay.classList.add('exiting');
        setTimeout(() => {
          document.body.style.overflow = '';
          document.body.style.pointerEvents = '';
          overlay.remove();
        }, 400);
      }, 1200);
    }, 3200);
  }
  
  function getWebGLVendor() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    } catch (e) {}
    return 'unknown';
  }
})();
