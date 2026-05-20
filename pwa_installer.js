/**
 * AzEstetik PWA Installer & AHS Widget Guide
 * Fully optimized, luxury responsive layout with scroll-reveal and native slide-up bottom sheet.
 */

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registered successfully.', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Global state for install prompt
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showPwaWidgetButton();
});

document.addEventListener('DOMContentLoaded', () => {
  if (!isAppStandalone()) {
    initPwaUi();
  }
});

function isAppStandalone() {
  return window.navigator.standalone || 
         window.matchMedia('(display-mode: standalone)').matches;
}

// Initialize PWA UI (Dynamic CSS + Floating Pill Button + Modal Sheets)
function initPwaUi() {
  injectPwaStyles();
  createFloatingWidget();
  createModalMarkup();
  autoDetectOsAndHighlightTab();
  setupScrollReveal();
}

function autoDetectOsAndHighlightTab() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  setTimeout(() => {
    switchTab(isIos ? 'ios' : 'android');
  }, 100);
}

// Scroll-reveal listener: smoothly hides PWA button on scroll down to clear screen, reveals on scroll up
function setupScrollReveal() {
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('pwa-float-btn');
    if (!btn) return;
    const isMobile = window.innerWidth <= 768;
    
    if (window.scrollY > lastScrollY && window.scrollY > 150) {
      // Scrolling down - hide smoothly
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      if (isMobile) {
        btn.style.transform = 'translateX(-50%) translateY(30px) scale(0.9)';
      } else {
        btn.style.transform = 'translateY(30px) scale(0.9)';
      }
    } else {
      // Scrolling up - show smoothly
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      if (isMobile) {
        btn.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      } else {
        btn.style.transform = 'translateY(0) scale(1)';
      }
    }
    lastScrollY = window.scrollY;
  });
}

// Inject ultra-premium responsive CSS styles
function injectPwaStyles() {
  const css = `
    /* PWA Floating Action Widget */
    .pwa-floating-btn {
      position: fixed;
      bottom: calc(24px + var(--safe-bottom, 0px));
      right: 24px;
      background: linear-gradient(135deg, #00A859, #00D06E);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      padding: 14px 26px;
      font-size: 0.875rem;
      font-weight: 700;
      letter-spacing: -0.2px;
      box-shadow: 0 10px 30px rgba(0, 168, 89, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
      animation: pwaPulse 3s infinite alternate;
    }
    
    .pwa-floating-btn:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 14px 38px rgba(0, 168, 89, 0.5);
      border-color: rgba(255, 255, 255, 0.35);
    }
    
    @keyframes pwaPulse {
      0% { box-shadow: 0 10px 24px rgba(0, 168, 89, 0.35); }
      100% { box-shadow: 0 12px 36px rgba(0, 168, 89, 0.6), 0 0 0 6px rgba(0, 168, 89, 0.12); }
    }
    
    @media (max-width: 768px) {
      .pwa-floating-btn {
        bottom: calc(88px + var(--safe-bottom, 0px)); /* Safe clearance from mobile nav bar */
        left: 50%;
        transform: translateX(-50%);
        right: auto;
        width: calc(100% - 48px);
        max-width: 310px;
        padding: 12px 20px;
        font-size: 0.85rem;
        justify-content: center;
      }
      .pwa-floating-btn:hover {
        transform: translateX(-50%) translateY(-2px) scale(1.02);
      }
    }

    /* PWA Glassmorphic Overlay Backdrop */
    .pwa-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(8, 10, 15, 0.7);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .pwa-overlay.active {
      opacity: 1;
      visibility: visible;
    }
    
    /* PWA Glassmorphic Bottom Sheet / Modal */
    .pwa-modal {
      background: rgba(14, 18, 25, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-top: 3px solid #00A859; /* Elegant Emerald Top Accent Line */
      border-radius: 24px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      transform: translateY(40px) scale(0.96);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .pwa-overlay.active .pwa-modal {
      transform: translateY(0) scale(1);
    }
    
    /* Native iOS Bottom Sheet on Mobile */
    @media (max-width: 768px) {
      .pwa-overlay {
        align-items: flex-end;
        padding: 0;
      }
      .pwa-modal {
        border-radius: 24px 24px 0 0;
        max-width: 100%;
        margin: 0;
        transform: translateY(100%);
        border-bottom: none;
        padding-bottom: calc(24px + var(--safe-bottom, 0px));
      }
      .pwa-overlay.active .pwa-modal {
        transform: translateY(0);
      }
    }
    
    .pwa-header {
      padding: 24px 24px 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    
    .pwa-title-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .pwa-app-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      object-fit: cover;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    
    .pwa-app-details h3 {
      font-size: 1.1rem;
      font-weight: 800;
      margin: 0;
      color: white;
      letter-spacing: -0.3px;
    }
    
    .pwa-app-details p {
      font-size: 0.75rem;
      color: #94A3B8;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    
    .pwa-close-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #94A3B8;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .pwa-close-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #EF4444;
      transform: scale(1.05);
    }
    
    /* Tabs System with underlines */
    .pwa-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 0 16px;
    }
    
    .pwa-tab-btn {
      flex: 1;
      padding: 16px 0;
      border: none;
      background: transparent;
      color: #64748B;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-bottom: 2px solid transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .pwa-tab-btn:hover {
      color: #94A3B8;
    }
    
    .pwa-tab-btn.active {
      color: #00A859;
      border-bottom-color: #00A859;
      font-weight: 700;
      text-shadow: 0 0 15px rgba(0, 168, 89, 0.3);
    }
    
    /* PWA Instructions Body */
    .pwa-body {
      padding: 24px;
      max-height: 420px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .pwa-instruction-tab {
      display: none;
    }
    
    .pwa-instruction-tab.active {
      display: block;
      animation: pwaFadeIn 0.4s ease forwards;
    }
    
    @keyframes pwaFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Step List and Readability Polishing */
    .pwa-step-list {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    
    .pwa-step {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    
    .pwa-step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 168, 89, 0.12);
      border: 1px solid rgba(0, 168, 89, 0.25);
      color: #00A859;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
      box-shadow: 0 0 10px rgba(0, 168, 89, 0.1);
    }
    
    .pwa-step-text {
      flex: 1;
      font-size: 0.875rem;
      color: #94A3B8;
      line-height: 1.6;
    }
    
    .pwa-step-text strong {
      color: white;
      font-weight: 600;
    }
    
    .pwa-icon-inline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      width: 26px;
      height: 26px;
      margin: 0 6px;
      vertical-align: middle;
      color: white;
    }
    
    .pwa-icon-inline svg {
      width: 13px !important;
      height: 13px !important;
    }
    
    /* Direct Install Button for Android/Chrome */
    .pwa-direct-install-btn {
      width: 100%;
      background: linear-gradient(135deg, #00A859, #00D06E);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      box-shadow: 0 6px 20px rgba(0, 168, 89, 0.35);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .pwa-direct-install-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 26px rgba(0, 168, 89, 0.5);
    }

    .pwa-divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #64748B;
      font-size: 0.75rem;
      margin: 20px 0;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .pwa-divider::before, .pwa-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .pwa-divider:not(:empty)::before { margin-right: 1em; }
    .pwa-divider:not(:empty)::after { margin-left: 1em; }

    /* Light Mode Polishing */
    body.light-mode .pwa-modal {
      background: rgba(255, 255, 255, 0.96);
      border-color: rgba(0, 0, 0, 0.06);
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.12);
    }
    
    body.light-mode .pwa-header {
      border-bottom-color: rgba(0, 0, 0, 0.05);
    }
    
    body.light-mode .pwa-app-details h3 {
      color: #1B2559;
    }
    
    body.light-mode .pwa-app-details p {
      color: #5E6E82;
    }
    
    body.light-mode .pwa-close-btn {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.05);
      color: #5E6E82;
    }
    
    body.light-mode .pwa-tabs {
      background: rgba(0, 0, 0, 0.01);
      border-bottom-color: rgba(0, 0, 0, 0.05);
    }
    
    body.light-mode .pwa-tab-btn {
      color: #5E6E82;
    }
    
    body.light-mode .pwa-tab-btn.active {
      color: #00A859;
      text-shadow: none;
    }
    
    body.light-mode .pwa-step-text {
      color: #5E6E82;
    }
    
    body.light-mode .pwa-step-text strong {
      color: #1B2559;
    }
    
    body.light-mode .pwa-icon-inline {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.05);
      color: #1B2559;
    }
    
    body.light-mode .pwa-step-num {
      background: rgba(0, 168, 89, 0.06);
      border-color: rgba(0, 168, 89, 0.15);
    }
    
    body.light-mode .pwa-divider::before,
    body.light-mode .pwa-divider::after {
      border-bottom-color: rgba(0, 0, 0, 0.05);
    }
  `;

  const styleNode = document.createElement('style');
  styleNode.type = 'text/css';
  styleNode.appendChild(document.createTextNode(css));
  document.head.appendChild(styleNode);
}

function createFloatingWidget() {
  if (document.getElementById('pwa-float-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'pwa-float-btn';
  btn.className = 'pwa-floating-btn';
  btn.innerHTML = '<i data-lucide="smartphone"></i> Tətbiqi Yüklə';
  btn.onclick = openPwaModal;
  document.body.appendChild(btn);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showPwaWidgetButton() {
  const btn = document.getElementById('pwa-float-btn');
  if (btn) {
    btn.style.display = 'flex';
  } else {
    createFloatingWidget();
  }
}

function createModalMarkup() {
  if (document.getElementById('pwa-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'pwa-modal-overlay';
  overlay.className = 'pwa-overlay';
  overlay.onclick = (e) => {
    if (e.target === overlay) closePwaModal();
  };

  overlay.innerHTML = `
    <div class="pwa-modal">
      <!-- Modal Header -->
      <div class="pwa-header">
        <div class="pwa-title-box">
          <img src="assets/azestetik_app_icon.png" class="pwa-app-icon" alt="AzEstetik Logo">
          <div class="pwa-app-details">
            <h3>AzEstetik Club</h3>
            <p>Ekrana widget kimi əlavə et 📲</p>
          </div>
        </div>
        <button class="pwa-close-btn" onclick="closePwaModal()"><i data-lucide="x"></i></button>
      </div>
      
      <!-- Tab Header -->
      <div class="pwa-tabs">
        <button class="pwa-tab-btn active" id="pwa-tab-ios" onclick="switchTab('ios')">
          <i data-lucide="apple"></i> Apple Safari
        </button>
        <button class="pwa-tab-btn" id="pwa-tab-android" onclick="switchTab('android')">
          <i data-lucide="chrome"></i> Chrome / Google
        </button>
      </div>
      
      <!-- Tab Contents -->
      <div class="pwa-body">
        
        <!-- Apple Safari Instructions -->
        <div class="pwa-instruction-tab active" id="pwa-content-ios">
          <div class="pwa-step-list">
            <div class="pwa-step">
              <div class="pwa-step-num">1</div>
              <div class="pwa-step-text">
                Safari brauzerinin alt panelindəki <strong>Paylaş / Share</strong> 
                <span class="pwa-icon-inline"><i data-lucide="share"></i></span> 
                düyməsinə klikləyin.
              </div>
            </div>
            
            <div class="pwa-step">
              <div class="pwa-step-num">2</div>
              <div class="pwa-step-text">
                Menyudan aşağı sürüşdürərək <strong>Ana ekrana əlavə et / Add to Home Screen</strong> 
                <span class="pwa-icon-inline"><i data-lucide="plus-square"></i></span> 
                seçimini edin.
              </div>
            </div>
            
            <div class="pwa-step">
              <div class="pwa-step-num">3</div>
              <div class="pwa-step-text">
                Yuxarı sağ küncdəki <strong>Əlavə et / Add</strong> düyməsinə klikləyin. Qısa yol telefonunuzun ekranına rəsmi widget kimi yerləşdiriləcəkdir!
              </div>
            </div>
          </div>
        </div>
        
        <!-- Android / Chrome Instructions -->
        <div class="pwa-instruction-tab" id="pwa-content-android">
          
          <!-- Automated Install Button -->
          <button class="pwa-direct-install-btn" id="pwa-direct-btn" onclick="triggerNativeInstall()" style="display:none;">
            <i data-lucide="download-cloud"></i> Proqramı İndi Yüklə
          </button>
          
          <div class="pwa-divider" id="pwa-install-divider" style="display:none;">Yaxud Manuel Quraşdırın</div>
          
          <div class="pwa-step-list">
            <div class="pwa-step">
              <div class="pwa-step-num">1</div>
              <div class="pwa-step-text">
                Brauzerin yuxarı sağındakı <strong>Menyu / Üç Nöqtə</strong> 
                <span class="pwa-icon-inline"><i data-lucide="more-vertical"></i></span> 
                düyməsinə klikləyin.
              </div>
            </div>
            
            <div class="pwa-step">
              <div class="pwa-step-num">2</div>
              <div class="pwa-step-text">
                Açılan menyudan <strong>Ana ekrana əlavə et / Add to Home Screen</strong> və ya <strong>Quraşdırın / Install</strong> seçimini edin.
              </div>
            </div>
            
            <div class="pwa-step">
              <div class="pwa-step-num">3</div>
              <div class="pwa-step-text">
                Bildirişi təsdiqləyin. Proqram qısa zamanda əsas ekranınızda və tətbiqlər siyahısında yer alacaqdır!
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  toggleDirectInstallButton();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function toggleDirectInstallButton() {
  const directBtn = document.getElementById('pwa-direct-btn');
  const divider = document.getElementById('pwa-install-divider');
  if (directBtn) {
    if (deferredPrompt) {
      directBtn.style.display = 'flex';
      if (divider) divider.style.display = 'flex';
    } else {
      directBtn.style.display = 'none';
      if (divider) divider.style.display = 'none';
    }
  }
}

function triggerNativeInstall() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted PWA installation');
      closePwaModal();
      const btn = document.getElementById('pwa-float-btn');
      if (btn) btn.style.display = 'none';
    }
    deferredPrompt = null;
    toggleDirectInstallButton();
  });
}

function switchTab(os) {
  const iosBtn = document.getElementById('pwa-tab-ios');
  const androidBtn = document.getElementById('pwa-tab-android');
  const iosContent = document.getElementById('pwa-content-ios');
  const androidContent = document.getElementById('pwa-content-android');

  if (!iosBtn || !androidBtn || !iosContent || !androidContent) return;

  if (os === 'ios') {
    iosBtn.classList.add('active');
    androidBtn.classList.remove('active');
    iosContent.classList.add('active');
    androidContent.classList.remove('active');
  } else {
    androidBtn.classList.add('active');
    iosBtn.classList.remove('active');
    androidContent.classList.add('active');
    iosContent.classList.remove('active');
  }
  
  toggleDirectInstallButton();
}

function openPwaModal() {
  const overlay = document.getElementById('pwa-modal-overlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    toggleDirectInstallButton();
  }
}

function closePwaModal() {
  const overlay = document.getElementById('pwa-modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}
